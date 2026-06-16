#!/usr/bin/env python3
"""
TDD unit tests for serve_state.py — the pure /api/state derivation core of
`agentlog serve` (the histograph). Cases 1-10 of the frozen build plan.

These are written test-first and pin LOAD-BEARING logic only (the spec's
no-tautological-tests rule): status transitions, freshness boundaries, story
state, roadmap math reacting to a flipped fixture, reversal true/false positive,
the integrity mapping table, task ordering + live/pending tags, the degraded/cold
shapes, and per-terminal fail-open. Every test writes synthetic JSONL into a tmp
dir, builds a real Ledger over it, injects a fixed now_epoch, and asserts a
DERIVED output — never a literal echoing itself.

Run: python -m unittest test_serve_state -v   (or: python -m pytest test_serve_state.py -q)
Stdlib unittest only; no third-party deps.
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import serve_state as S


# --------------------------------------------------------------------------- #
# fixture builders — mirror the real ledger record shapes (host, _valid,
# human_involved, class, reversibility, asks/blocking, touched_paths, etc.)
# --------------------------------------------------------------------------- #
def _cp(sid, ts, *, decisions=None, asks=None, risks=None, verification=None,
        project="Mortar", valid=True, summary="did work", paths=None,
        host="claude-code", cid=None, next_action="keep going"):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": summary,
        "touched_paths": paths if paths is not None else ["src/x.rs"],
        "verification": verification or [], "decisions": decisions or [],
        "risks": risks or [], "asks": asks or [], "next_action": next_action,
        "health_draft": None,
        "checkpoint_id": cid or ("chk_%s_%s" % (sid, ts.replace(":", "").replace("-", ""))),
        "session_id": sid, "host": host, "cwd": "C:\\repo\\%s" % project,
        "project": project, "captured_at": ts, "_valid": valid, "_problems": [],
    }


def _act(typ, sid, ts, **extra):
    o = {"type": typ, "session_id": sid, "cwd": "C:\\repo\\Mortar", "armed": True, "ts": ts}
    o.update(extra)
    return o


def _decision(topic, choice, *, cls="local", human=False, reversibility="high",
              materiality="record", alternatives=None):
    return {"topic": topic, "choice": choice, "rationale": "because",
            "alternatives": alternatives or [], "reversibility": reversibility,
            "confidence": "high", "class": cls, "materiality": materiality,
            "human_involved": human}


def _write(d, checkpoints, activity, epics_dir_files=None):
    with open(os.path.join(d, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
        for c in checkpoints:
            f.write(json.dumps(c) + "\n")
    with open(os.path.join(d, "activity.jsonl"), "w", encoding="utf-8") as f:
        for a in activity:
            f.write(json.dumps(a) + "\n")


def _epics(entries):
    """A minimal in-memory EpicStore-like list the serve_state functions consume.
    serve_state treats `epics` as the validated list of epic dicts (stories ordered)."""
    return entries


def _t(iso):
    return R.parse_ts(iso)


BASE = "2026-06-10T10:00:00-04:00"


# --------------------------------------------------------------------------- #
# Case 1 — status transitions (incl. needs-you → active after ack)
# --------------------------------------------------------------------------- #
class TestStatusTransitions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_active_when_recent_checkpoint_no_blockers(self):
        cps = [_cp("s1", "2026-06-10T10:06:00-04:00")]
        acts = [_act("stop_boundary", "s1", "2026-06-10T10:06:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        sess = led.session_state("s1", now_epoch=_t("2026-06-10T10:07:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:07:00-04:00")), "active")

    def test_needs_you_when_blocking_ask_open(self):
        cps = [_cp("s2", "2026-06-10T10:00:00-04:00",
                   asks=[{"question": "approve prod migration?", "blocking": True}])]
        acts = [_act("stop_boundary", "s2", "2026-06-10T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        sess = led.session_state("s2", now_epoch=_t("2026-06-10T10:01:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:01:00-04:00")), "needs-you")

    def test_needs_you_becomes_active_after_ack(self):
        # The blocking ask is answered (human_ack on the checkpoint's ack_id) two turns
        # later — needs-you must DROP to active. This is the §4 ack-by-id lifecycle the
        # board must reflect, not a stale high-water-mark.
        cps = [_cp("s3", "2026-06-10T10:00:00-04:00", cid="chk_block_3",
                   asks=[{"question": "approve prod migration?", "blocking": True}])]
        acts = [
            _act("stop_boundary", "s3", "2026-06-10T10:00:00-04:00"),
            _act("human_ack", "s3", "2026-06-10T10:05:00-04:00", item_id="chk_block_3"),
            _act("stop_boundary", "s3", "2026-06-10T10:06:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        before = led.session_state("s3", now_epoch=_t("2026-06-10T10:01:00-04:00"),
                                   acked=set())
        after = led.session_state("s3", now_epoch=_t("2026-06-10T10:07:00-04:00"))
        self.assertEqual(S.derive_status(before, _t("2026-06-10T10:01:00-04:00")), "needs-you")
        self.assertEqual(S.derive_status(after, _t("2026-06-10T10:07:00-04:00")), "active")

    def test_needs_you_clears_when_agent_works_past_the_ask(self):
        # A blocking ask, then the agent keeps working (tool_use + a later checkpoint).
        # The human must have answered, so needs-you DROPS to active even without an
        # explicit `agentlog ack` — before this fix the badge stuck forever.
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", cid="chk_a",
                   asks=[{"question": "which DB?", "blocking": True}]),
               _cp("s1", "2026-06-10T10:08:00-04:00", cid="chk_b")]  # resumed, no ask
        acts = [_act("stop_boundary", "s1", "2026-06-10T10:00:00-04:00"),
                _act("tool_use", "s1", "2026-06-10T10:07:00-04:00", tool="Edit"),
                _act("stop_boundary", "s1", "2026-06-10T10:08:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        sess = led.session_state("s1", now_epoch=_t("2026-06-10T10:09:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:09:00-04:00")), "active")

    def test_needs_you_persists_while_idle_on_the_ask(self):
        # The blocking ask is the frontier; no work after it -> still needs-you long
        # later. The fix must not "time out" a genuinely-unanswered ask.
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", cid="chk_a",
                   asks=[{"question": "which DB?", "blocking": True}])]
        acts = [_act("stop_boundary", "s1", "2026-06-10T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        sess = led.session_state("s1", now_epoch=_t("2026-06-10T10:30:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:30:00-04:00")), "needs-you")

    def test_stale_when_many_boundaries_since_checkpoint(self):
        cps = [_cp("s4", "2026-06-10T10:00:00-04:00")]
        acts = [_act("stop_boundary", "s4", t) for t in
                ["2026-06-10T10:00:00-04:00", "2026-06-10T10:05:00-04:00",
                 "2026-06-10T10:06:00-04:00", "2026-06-10T10:07:00-04:00"]]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        sess = led.session_state("s4", now_epoch=_t("2026-06-10T10:20:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:20:00-04:00")), "stale")

    def test_done_when_archived_idle(self):
        # idle past the read surface's idle floor -> archived -> contract "done".
        cps = [_cp("s5", "2026-06-08T10:00:00-04:00")]
        acts = [_act("stop_boundary", "s5", "2026-06-08T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        # 2 days later -> idle > idle_secs (86400)
        sess = led.session_state("s5", now_epoch=_t("2026-06-10T10:00:00-04:00"))
        self.assertEqual(S.derive_status(sess, _t("2026-06-10T10:00:00-04:00")), "done")


# --------------------------------------------------------------------------- #
# Case 2 — freshness boundaries at STALE_SECS ± 1 and mid-turn
# --------------------------------------------------------------------------- #
class TestFreshness(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def _sess(self, last_ts, now_ts):
        cps = [_cp("f1", last_ts)]
        acts = [_act("stop_boundary", "f1", last_ts)]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        return led.session_state("f1", now_epoch=_t(now_ts)), _t(now_ts)

    def test_midturn_when_within_midturn_window(self):
        # very recent activity (< MIDTURN_SECS) => "mid-turn" / muted
        sess, now = self._sess("2026-06-10T10:00:00-04:00", "2026-06-10T10:01:00-04:00")
        label, tone = S.derive_freshness(sess, now)
        self.assertEqual(label, "mid-turn")
        self.assertEqual(tone, "muted")

    def test_just_under_stale_is_warning_not_danger(self):
        # STALE_SECS - 1 second of idle: fresh side of the boundary. Assert the EXACT
        # tone ("warning") rather than two negatives — a bogus third tone value would
        # have slipped past `tone != "danger"` and `label != "mid-turn"`.
        now = _t(BASE)
        last = now - (S.STALE_SECS - 1)
        sess = {"last_activity_ts": last, "session_id": "f2"}
        label, tone = S.derive_freshness(sess, now)
        self.assertEqual(tone, "warning")            # inclusive fresh side of the boundary
        self.assertNotEqual(label, "mid-turn")       # but past mid-turn
        self.assertTrue(label.endswith("m"))         # minutes label, not "mid-turn"

    def test_just_over_stale_is_danger(self):
        now = _t(BASE)
        last = now - (S.STALE_SECS + 1)
        sess = {"last_activity_ts": last, "session_id": "f3"}
        label, tone = S.derive_freshness(sess, now)
        self.assertEqual(tone, "danger")

    def test_label_is_minutes_for_idle_session(self):
        now = _t(BASE)
        sess = {"last_activity_ts": now - 41 * 60, "session_id": "f4"}
        label, _ = S.derive_freshness(sess, now)
        self.assertEqual(label, "41m")


# --------------------------------------------------------------------------- #
# Case 3 — story_state done/active/not-started/blocked
# --------------------------------------------------------------------------- #
class TestStoryState(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def _led(self, cps, acts):
        _write(self.tmp, cps, acts)
        return R.Ledger.from_dir(self.tmp)

    def test_active_story_is_the_live_session(self):
        cps = [_cp("a1", "2026-06-10T10:00:00-04:00")]
        acts = [_act("stop_boundary", "a1", "2026-06-10T10:00:00-04:00")]
        led = self._led(cps, acts)
        sid_story = S.story_id_for(led, "a1")
        st = S.story_state(led, "a1", sid_story, None, now_epoch=_t("2026-06-10T10:01:00-04:00"))
        self.assertEqual(st, "active")

    def test_blocked_story_when_blocking_ask(self):
        cps = [_cp("a2", "2026-06-10T10:00:00-04:00",
                   asks=[{"question": "need a key", "blocking": True}])]
        acts = [_act("stop_boundary", "a2", "2026-06-10T10:00:00-04:00")]
        led = self._led(cps, acts)
        story = S.story_id_for(led, "a2")
        st = S.story_state(led, "a2", story, None, now_epoch=_t("2026-06-10T10:01:00-04:00"))
        self.assertEqual(st, "blocked")

    def test_done_story_when_idle_archived(self):
        cps = [_cp("a3", "2026-06-07T10:00:00-04:00")]
        acts = [_act("stop_boundary", "a3", "2026-06-07T10:00:00-04:00")]
        led = self._led(cps, acts)
        story = S.story_id_for(led, "a3")
        st = S.story_state(led, "a3", story, None, now_epoch=_t("2026-06-10T10:00:00-04:00"))
        self.assertEqual(st, "done")

    def test_not_started_for_linked_story_with_no_session(self):
        # A story linked into an epic that no live session maps to is "not-started".
        cps = [_cp("a4", "2026-06-10T10:00:00-04:00")]
        acts = [_act("stop_boundary", "a4", "2026-06-10T10:00:00-04:00")]
        led = self._led(cps, acts)
        st = S.story_state(led, None, "st-never-touched", None,
                           now_epoch=_t("2026-06-10T10:01:00-04:00"))
        self.assertEqual(st, "not-started")

    def test_state_is_canonical_across_sessions_sharing_a_story(self):
        # REGRESSION (real-data inconsistency): several sessions can collapse to ONE
        # story_id (same project|branch|cwd-leaf). When one of them is blocked
        # (waiting) and an older one is archived (done), the story's state must be a
        # SINGLE canonical answer regardless of which sid the caller passes — the
        # roadmap segment (tier 1, passes sid=None) and the story rail (tier 2, passes
        # the focused sid) describe the SAME story id and must never disagree. The
        # canonical state is the most-salient: a live blocked session wins over an
        # older archived one (the work is not "done" if a live lane is stuck on it).
        cps = [
            # oldest: an archived run of the same workstream (done on its own)
            _cp("old", "2026-06-07T10:00:00-04:00", project="Mortar"),
            # newest: a live run of the SAME workstream with an open blocking ask
            _cp("new", "2026-06-10T10:00:00-04:00", project="Mortar",
                asks=[{"question": "need a key", "blocking": True}]),
        ]
        # identical cwd => identical story_id => same story, two sessions
        for c in cps:
            c["cwd"] = "C:\\repo\\Mortar"
        acts = [
            _act("stop_boundary", "old", "2026-06-07T10:00:00-04:00"),
            _act("stop_boundary", "new", "2026-06-10T10:00:00-04:00"),
        ]
        led = self._led(cps, acts)
        now = _t("2026-06-10T10:01:00-04:00")
        story = S.story_id_for(led, "new")
        self.assertEqual(S.story_id_for(led, "old"), story,
                         "fixture invariant: both sessions share one story_id")

        # tier-2 path: caller passes the focused (blocked) sid
        st_focused = S.story_state(led, "new", story, None, now_epoch=now)
        # tier-1 path: roadmap passes sid=None -> resolves canonically
        st_roadmap = S.story_state(led, None, story, None, now_epoch=now)
        # also the archived sid must not drag the canonical state to "done"
        st_archived = S.story_state(led, "old", story, None, now_epoch=now)

        self.assertEqual(st_focused, "blocked")
        self.assertEqual(st_roadmap, st_focused,
                         "roadmap (sid=None) and story rail (focused sid) must agree "
                         "on the SAME story id — got roadmap=%r vs rail=%r"
                         % (st_roadmap, st_focused))
        self.assertEqual(st_archived, "blocked",
                         "passing an older archived sid for a story that still has a "
                         "live blocked session must yield the canonical 'blocked', not "
                         "'done' — the story is not done while a lane is stuck on it")


# --------------------------------------------------------------------------- #
# Case 4 — roadmap_progress math reacts to a flipped story fixture
# --------------------------------------------------------------------------- #
class TestRoadmapProgress(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def _cp_cwd(self, sid, ts, leaf):
        # distinct cwd leaf => distinct story_id (the real ledger distinguishes stories
        # within a project by branch/cwd; collapsing them would over-count "done").
        c = _cp(sid, ts, project="Mortar")
        c["cwd"] = "C:\\repo\\Mortar\\%s" % leaf
        return c

    def test_progress_counts_done_stories_and_flips(self):
        # Three distinct stories: ws + lp idle (done), grpc live (active), st-sse never
        # touched (not-started). The epic links four stories in order; done/total must
        # be DERIVED, and flipping the active story to done moves done 2->3 without
        # touching `total`.
        cps = [
            self._cp_cwd("ws", "2026-06-07T10:00:00-04:00", "ws"),      # idle -> done
            self._cp_cwd("lp", "2026-06-07T11:00:00-04:00", "lp"),      # idle -> done
            self._cp_cwd("grpc", "2026-06-10T10:00:00-04:00", "grpc"),  # live -> active
        ]
        acts = [
            _act("stop_boundary", "ws", "2026-06-07T10:00:00-04:00"),
            _act("stop_boundary", "lp", "2026-06-07T11:00:00-04:00"),
            _act("stop_boundary", "grpc", "2026-06-10T10:00:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        now = _t("2026-06-10T10:01:00-04:00")
        st_ws = S.story_id_for(led, "ws")
        st_lp = S.story_id_for(led, "lp")
        st_grpc = S.story_id_for(led, "grpc")
        epic = {"id": "epic-pp", "title": "Protocol parity", "project": "Mortar",
                "integrity": "reconstructed",
                "stories": [st_ws, st_lp, st_grpc, "st-sse"], "createdAt": BASE}

        done, total, segs = S.roadmap_progress(epic, led, now_epoch=now)
        self.assertEqual(total, 4)
        self.assertEqual(done, 2)
        self.assertEqual(len(segs), 4)
        self.assertEqual([s["state"] for s in segs],
                         ["done", "done", "active", "not-started"])

        # FLIP: make the grpc session idle/archived so its story becomes done.
        cps2 = list(cps)
        cps2[2] = self._cp_cwd("grpc", "2026-06-07T12:00:00-04:00", "grpc")
        acts2 = [
            _act("stop_boundary", "ws", "2026-06-07T10:00:00-04:00"),
            _act("stop_boundary", "lp", "2026-06-07T11:00:00-04:00"),
            _act("stop_boundary", "grpc", "2026-06-07T12:00:00-04:00"),
        ]
        _write(self.tmp, cps2, acts2)
        led2 = R.Ledger.from_dir(self.tmp)
        epic2 = dict(epic, stories=[S.story_id_for(led2, "ws"), S.story_id_for(led2, "lp"),
                                    S.story_id_for(led2, "grpc"), "st-sse"])
        done2, total2, segs2 = S.roadmap_progress(epic2, led2, now_epoch=now)
        self.assertEqual(total2, 4)
        self.assertEqual(done2, 3)
        self.assertEqual([s["state"] for s in segs2],
                         ["done", "done", "done", "not-started"])


# --------------------------------------------------------------------------- #
# Case 5 — reversal detection: true-positive AND no-false-positive
# --------------------------------------------------------------------------- #
class TestReversal(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_true_positive_when_topic_redecided(self):
        prior = [{"id": "tk-1", "kind": "decision", "topic": "transport",
                  "summary": "use HTTP API", "at": "2026-06-10T10:00:00-04:00"}]
        record = _decision("transport", "switch to headless CLI",
                           reversibility="medium")
        rev = S.detect_reversal(record, prior)
        self.assertIsNotNone(rev)
        self.assertIn("HTTP API", rev["supersededSummary"])
        self.assertEqual(rev["supersededTaskId"], "tk-1")
        self.assertEqual(rev["reversibility"], "medium")

    def test_no_false_positive_for_new_topic(self):
        prior = [{"id": "tk-1", "kind": "decision", "topic": "transport",
                  "summary": "use HTTP API", "at": "2026-06-10T10:00:00-04:00"}]
        record = _decision("tool access", "disable all tools")
        self.assertIsNone(S.detect_reversal(record, prior))

    def test_no_false_positive_with_empty_history(self):
        record = _decision("transport", "use HTTP API")
        self.assertIsNone(S.detect_reversal(record, []))

    def test_no_reversal_against_a_prior_step_with_colliding_topic(self):
        # detect_reversal only supersedes a DECISION-class prior. A 'step' (or any
        # passive node) that happens to carry the same free-text topic must NOT mint a
        # spurious supersede — topic is an uncontrolled agent field. Guards the
        # structural fragility that build_tasks' blank-topic-on-steps used to hide.
        prior = [{"id": "tk-step", "kind": "step", "topic": "transport",
                  "summary": "touched transport.rs", "at": "2026-06-10T10:00:00-04:00"}]
        record = _decision("transport", "switch to headless CLI")
        self.assertIsNone(S.detect_reversal(record, prior))

    def test_build_tasks_emits_supersedes_with_reversal_end_to_end(self):
        # END-TO-END (not the isolated detect_reversal): two real checkpoints driven
        # through build_tasks. The first decides transport=HTTP, the second re-decides
        # the SAME topic. The trail must contain a 'supersedes' task whose reversal
        # references the first decision's summary — proving build_tasks actually feeds
        # detect_reversal and re-tags the kind (the integration the isolated test missed).
        cps = [
            _cp("rv", "2026-06-10T10:00:00-04:00", cid="c1",
                decisions=[_decision("transport", "use HTTP API")]),
            _cp("rv", "2026-06-10T10:05:00-04:00", cid="c2",
                decisions=[_decision("transport", "switch to headless CLI",
                                     reversibility="medium")],
                next_action="wire the CLI"),
        ]
        acts = [_act("stop_boundary", "rv", "2026-06-10T10:05:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "rv")
        sup = [t for t in tasks if t["kind"] == "supersedes"]
        self.assertEqual(len(sup), 1, "the re-decision must emit exactly one supersede")
        rev = sup[0].get("reversal")
        self.assertIsNotNone(rev)
        self.assertIn("HTTP API", rev["supersededSummary"])
        self.assertEqual(rev["reversibility"], "medium")

    def test_newest_task_reversal_survives_live_retag(self):
        # S1-a REGRESSION: when the NEWEST checkpoint's decision is itself a reversal,
        # the live re-tag must NOT clobber it back to a plain live tip and strip the
        # reversal. The newest reversal stays kind=="supersedes" (so the renderer draws
        # the supersede stitch) and KEEPS its reversal payload — the "what was reversed"
        # provenance is most important exactly when it is most current. There is no
        # trailing next_action here, so the supersede IS the last real task.
        cps = [
            _cp("lr", "2026-06-10T10:00:00-04:00", cid="c1",
                decisions=[_decision("transport", "use HTTP API")], next_action=""),
            _cp("lr", "2026-06-10T10:05:00-04:00", cid="c2",
                decisions=[_decision("transport", "switch to headless CLI")],
                next_action=""),
        ]
        acts = [_act("stop_boundary", "lr", "2026-06-10T10:05:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "lr")
        last = tasks[-1]
        self.assertEqual(last["kind"], "supersedes",
                         "the newest reversal must keep kind=supersedes, not be "
                         "relabelled 'live' (which would strip its reversal)")
        self.assertIn("reversal", last)
        self.assertIsNotNone(last["reversal"])
        self.assertIn("HTTP API", last["reversal"]["supersededSummary"])


# --------------------------------------------------------------------------- #
# Case 6 — integrity mapping table per class
# --------------------------------------------------------------------------- #
class TestIntegrityMapping(unittest.TestCase):
    def test_invalid_checkpoint_maps_to_reconstructed(self):
        rec = {"_valid": False, "human_involved": True}
        self.assertEqual(S.map_integrity(rec), "reconstructed")

    def test_human_involved_decision_maps_to_human_confirmed(self):
        rec = _decision("x", "y", human=True)
        self.assertEqual(S.map_integrity(rec), "human-confirmed")

    def test_string_true_human_involved_is_human_confirmed(self):
        # models sometimes emit the STRING "true" — must normalize (matches _is_truthy)
        rec = _decision("x", "y")
        rec["human_involved"] = "true"
        self.assertEqual(S.map_integrity(rec), "human-confirmed")

    def test_volunteered_material_decision_without_human(self):
        rec = _decision("x", "y", human=False, materiality="record")
        self.assertEqual(S.map_integrity(rec), "volunteered")

    def test_ask_now_materiality_is_volunteered_without_topic_or_choice(self):
        # ask_now is a REAL ledger materiality value (the agent surfaced the decision
        # for a human). With no topic/choice present it must still map via the
        # materiality clause to 'volunteered' — the pre-fix tuple ("record","ask",
        # "surface") missed ask_now entirely and would have fallen through to passive.
        rec = {"materiality": "ask_now"}
        self.assertEqual(S.map_integrity(rec), "volunteered")

    def test_suppress_materiality_without_topic_is_passive(self):
        # suppress (the agent chose NOT to surface) is not volunteered on materiality
        # alone — a bare suppressed record with no topic/choice is passive. Pins the
        # boundary against a REAL ledger value rather than re-confirming the catch-all.
        rec = {"materiality": "suppress"}
        self.assertEqual(S.map_integrity(rec), "passive")

    def test_surface_string_is_no_longer_special_cased(self):
        # "surface" never occurs in the real ledger; it must NOT be treated as a
        # volunteered materiality. With no topic/choice it falls through to passive.
        rec = {"materiality": "surface"}
        self.assertEqual(S.map_integrity(rec), "passive")

    def test_passive_activity_record_maps_to_passive(self):
        rec = {"type": "stop_boundary"}
        self.assertEqual(S.map_integrity(rec), "passive")


# --------------------------------------------------------------------------- #
# Case 7 — task ordering oldest->newest + live tag + pending last
# --------------------------------------------------------------------------- #
class TestTaskOrdering(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_tasks_oldest_to_newest_live_last_pending_after(self):
        cps = [
            _cp("t1", "2026-06-10T10:00:00-04:00",
                decisions=[_decision("a", "first decision", human=True)],
                next_action="wire the parser next"),
            _cp("t1", "2026-06-10T10:05:00-04:00",
                decisions=[_decision("b", "second decision", human=True)],
                next_action="ship it"),
        ]
        acts = [_act("stop_boundary", "t1", "2026-06-10T10:05:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "t1", working_now=True)      # active lane -> live bloom
        ats = [t["at"] for t in tasks if t["at"] is not None]
        self.assertEqual(ats, sorted(ats))                      # oldest -> newest
        non_pending = [t for t in tasks if t["kind"] != "pending"]
        self.assertEqual(non_pending[-1]["kind"], "live")       # newest real task is live
        pendings = [t for t in tasks if t["kind"] == "pending"]
        if pendings:
            self.assertIs(tasks[-1], pendings[-1])              # pending sorts last
            self.assertIsNone(pendings[-1]["at"])               # pending has null at


# --------------------------------------------------------------------------- #
# Case 8 — no-epic degrade (focus.epic None, single story)
# --------------------------------------------------------------------------- #
class TestNoEpicDegrade(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_standalone_session_has_null_epic_and_single_story(self):
        cps = [_cp("solo", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("x", "y", human=True)])]
        acts = [_act("stop_boundary", "solo", "2026-06-10T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:01:00-04:00"))
        self.assertIsNotNone(state["focus"])
        self.assertIsNone(state["focus"]["epic"])
        self.assertEqual(len(state["focus"]["stories"]), 1)
        # the single terminal also carries epic:null
        self.assertEqual(len(state["terminals"]), 1)
        self.assertIsNone(state["terminals"][0]["epic"])


# --------------------------------------------------------------------------- #
# Case 9 — cold state (terminals [], focus None)
# --------------------------------------------------------------------------- #
class TestColdState(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_empty_ledger_is_cold(self):
        _write(self.tmp, [], [])
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t(BASE))
        self.assertEqual(state["terminals"], [])
        self.assertIsNone(state["focus"])
        self.assertIn("generatedAt", state)

    def test_only_archived_sessions_is_cold(self):
        # everything idle/done past the live window -> no live terminals -> cold focus.
        cps = [_cp("old", "2026-06-01T10:00:00-04:00")]
        acts = [_act("stop_boundary", "old", "2026-06-01T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t(BASE))
        self.assertEqual(state["terminals"], [])
        self.assertIsNone(state["focus"])


# --------------------------------------------------------------------------- #
# Case 10 — fail-open per terminal (one bad session never kills the board)
# --------------------------------------------------------------------------- #
class TestFailOpenPerTerminal(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_one_corrupt_session_does_not_500_the_board(self):
        good = _cp("good", "2026-06-10T10:05:00-04:00")
        # a record that will make naive derivation explode: captured_at None, decisions
        # a dict instead of a list, asks a string. The board must drop "bad", keep "good".
        bad = _cp("bad", "2026-06-10T10:06:00-04:00")
        bad["captured_at"] = None
        bad["decisions"] = {"not": "a list"}
        bad["asks"] = "totally wrong type"
        _write(self.tmp, [good, bad], [
            _act("stop_boundary", "good", "2026-06-10T10:05:00-04:00"),
            _act("stop_boundary", "bad", "2026-06-10T10:06:00-04:00"),
        ])
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:07:00-04:00"))
        ids_projects = [t["project"] for t in state["terminals"]]
        self.assertTrue(state["terminals"])                    # board survived
        self.assertIn("Mortar", ids_projects)                  # good lane is present

    def test_exactly_one_terminal_focused(self):
        cps = [
            _cp("x1", "2026-06-10T10:00:00-04:00", project="Mortar"),
            _cp("x2", "2026-06-10T10:06:00-04:00", project="Bridge"),
        ]
        acts = [
            _act("stop_boundary", "x1", "2026-06-10T10:00:00-04:00"),
            _act("stop_boundary", "x2", "2026-06-10T10:06:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:07:00-04:00"))
        focused = [t for t in state["terminals"] if t["focused"]]
        self.assertEqual(len(focused), 1)
        # default focus = most-recently-active lane
        self.assertEqual(focused[0]["project"], "Bridge")
        self.assertEqual(state["focus"]["terminalId"], focused[0]["id"])


# --------------------------------------------------------------------------- #
# provider_of — host attribution, incl. the host-less-latest-record fallback
# --------------------------------------------------------------------------- #
class TestProviderOf(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_hostless_latest_record_still_attributes_via_checkpoint_host(self):
        # The exact non-obvious behavior the docstring claims: the session's LATEST
        # record is a host-less stop_boundary, but the checkpoint carries host=claude-
        # code. provider_of must scan back to the first record WITH a host and return
        # 'claude' — not 'unknown'. A naive "latest record only" impl would fail here.
        cps = [_cp("p1", "2026-06-10T10:00:00-04:00", host="claude-code")]
        acts = [_act("stop_boundary", "p1", "2026-06-10T10:05:00-04:00")]  # no host field
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        self.assertEqual(S.provider_of(led, "p1"), "claude")

    def test_codex_host_maps_to_codex_and_cli_maps_to_claude(self):
        # codex -> codex; the agentlog CLI's own instrumentation host 'cli' -> claude.
        cps_codex = [_cp("p2", "2026-06-10T10:00:00-04:00", host="codex")]
        cps_cli = [_cp("p3", "2026-06-10T10:00:00-04:00", host="cli")]
        _write(self.tmp, cps_codex + cps_cli, [
            _act("stop_boundary", "p2", "2026-06-10T10:00:00-04:00"),
            _act("stop_boundary", "p3", "2026-06-10T10:00:00-04:00"),
        ])
        led = R.Ledger.from_dir(self.tmp)
        self.assertEqual(S.provider_of(led, "p2"), "codex")
        self.assertEqual(S.provider_of(led, "p3"), "claude")

    def test_unknown_host_is_unknown(self):
        cps = [_cp("p4", "2026-06-10T10:00:00-04:00", host="some-future-agent")]
        _write(self.tmp, cps, [_act("stop_boundary", "p4", "2026-06-10T10:00:00-04:00")])
        led = R.Ledger.from_dir(self.tmp)
        self.assertEqual(S.provider_of(led, "p4"), "unknown")


# --------------------------------------------------------------------------- #
# classify_kind — milestone (high class) / decision / step branches
# --------------------------------------------------------------------------- #
class TestClassifyKind(unittest.TestCase):
    def test_high_class_decision_is_milestone(self):
        # a high-class decision (billing/auth/migration/...) earns a milestone marker
        for cls in ("billing", "auth", "migration", "data_loss", "license"):
            self.assertEqual(S.classify_kind({"class": cls, "topic": "t", "choice": "c"}),
                             "milestone", "class=%s must be a milestone" % cls)

    def test_local_class_decision_is_decision(self):
        self.assertEqual(S.classify_kind({"class": "local", "topic": "t", "choice": "c"}),
                         "decision")

    def test_no_choice_no_topic_is_step(self):
        # nothing decision-shaped (no choice, no topic, ordinary class) -> a 'step'
        self.assertEqual(S.classify_kind({"class": "local"}), "step")
        self.assertEqual(S.classify_kind({}), "step")


# --------------------------------------------------------------------------- #
# status_line — blocking-ask needs-you vs next_action vs summary fallback
# --------------------------------------------------------------------------- #
class TestStatusLine(unittest.TestCase):
    def test_blocking_ask_yields_needs_you_with_detail(self):
        sess = {"needs_matt": [{"kind": "blocking_ask", "detail": "approve prod migration?"}],
                "last_checkpoint": {"next_action": "ship", "summary": "did work"}}
        line = S.status_line(sess)
        self.assertEqual(line["kind"], "needs-you")
        self.assertEqual(line["text"], "approve prod migration?")

    def test_falls_back_to_next_action_when_no_blocking_ask(self):
        sess = {"needs_matt": [], "last_checkpoint": {"next_action": "wire the parser",
                                                      "summary": "did work"}}
        line = S.status_line(sess)
        self.assertEqual(line["kind"], "status")
        self.assertEqual(line["text"], "wire the parser")

    def test_falls_back_to_summary_when_no_next_action(self):
        sess = {"needs_matt": [], "last_checkpoint": {"next_action": "", "summary": "did work"}}
        line = S.status_line(sess)
        self.assertEqual(line["kind"], "status")
        self.assertEqual(line["text"], "did work")


# --------------------------------------------------------------------------- #
# decision_count — counts decision-class only (excludes step/live/pending)
# --------------------------------------------------------------------------- #
class TestDecisionCount(unittest.TestCase):
    def test_counts_decision_classes_excludes_step_live_pending(self):
        trail = [
            {"kind": "decision"}, {"kind": "milestone"}, {"kind": "supersedes"},
            {"kind": "step"}, {"kind": "live"}, {"kind": "pending"},
        ]
        # decision + milestone + supersedes == 3; step/live/pending excluded
        self.assertEqual(S.decision_count(trail), 3)

    def test_empty_trail_is_zero(self):
        self.assertEqual(S.decision_count([]), 0)
        self.assertEqual(S.decision_count(None), 0)


# --------------------------------------------------------------------------- #
# reconcile_tone — an attention lane (needs-you/stale) is never painted 'muted'
# --------------------------------------------------------------------------- #
class TestReconcileTone(unittest.TestCase):
    def test_needs_you_muted_is_floored_to_warning(self):
        # a fresh (mid-turn, muted) lane that ALSO has an open blocking ask must not
        # render calm — the most important thing on the board can't read as muted.
        self.assertEqual(S.reconcile_tone("needs-you", "muted"), "warning")

    def test_stale_muted_is_floored_to_warning(self):
        self.assertEqual(S.reconcile_tone("stale", "muted"), "warning")

    def test_danger_stays_danger_for_attention_states(self):
        self.assertEqual(S.reconcile_tone("needs-you", "danger"), "danger")

    def test_active_lane_keeps_raw_idle_tone(self):
        # active/done lanes are not attention states — their raw idle-time tone stands.
        self.assertEqual(S.reconcile_tone("active", "muted"), "muted")
        self.assertEqual(S.reconcile_tone("done", "muted"), "muted")

    def test_fresh_needs_you_lane_terminal_is_not_muted_end_to_end(self):
        # END-TO-END: a fresh session (mid-turn) with an OPEN blocking ask. The terminal
        # must read status=needs-you AND freshnessTone != 'muted' — they can no longer
        # contradict at a glance (a needs-you lane painted muted/mid-turn).
        tmp = tempfile.mkdtemp()
        cps = [_cp("nu", "2026-06-10T10:00:30-04:00",
                   asks=[{"question": "approve prod migration?", "blocking": True}])]
        acts = [_act("stop_boundary", "nu", "2026-06-10T10:00:30-04:00")]
        _write(tmp, cps, acts)
        led = R.Ledger.from_dir(tmp)
        # now is ~30s after activity -> idle < MIDTURN_SECS -> raw tone would be 'muted'
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:01:00-04:00"))
        term = state["terminals"][0]
        self.assertEqual(term["status"], "needs-you")
        self.assertEqual(term["freshnessLabel"], "mid-turn")   # genuinely fresh
        self.assertNotEqual(term["freshnessTone"], "muted")    # but not painted calm
        self.assertEqual(term["freshnessTone"], "warning")


# --------------------------------------------------------------------------- #
# _state_of_session — the stale->active collapse (stale outranks done)
# --------------------------------------------------------------------------- #
class TestStaleStateContribution(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_stale_session_contributes_active_and_outranks_archived(self):
        # A stale lane (substantial passive activity since its last checkpoint, but not
        # idle-archived) contributes 'active' to its story state — stale != done. When a
        # stale session shares a story with an archived one, the canonical state must be
        # 'active' (stale outranks done): the work is not finished while a lane is still
        # passively churning on it.
        cps = [
            # archived: idle for days on the shared workstream
            _cp("arch", "2026-06-06T10:00:00-04:00", project="Mortar"),
            # stale: a recent checkpoint then many later boundaries (passive churn)
            _cp("stl", "2026-06-10T10:00:00-04:00", project="Mortar"),
        ]
        for c in cps:
            c["cwd"] = "C:\\repo\\Mortar"   # identical story_id
        acts = [_act("stop_boundary", "arch", "2026-06-06T10:00:00-04:00")]
        acts += [_act("stop_boundary", "stl", t) for t in
                 ["2026-06-10T10:00:00-04:00", "2026-06-10T10:05:00-04:00",
                  "2026-06-10T10:06:00-04:00", "2026-06-10T10:07:00-04:00"]]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        now = _t("2026-06-10T10:20:00-04:00")
        # sanity: the stale lane really reads 'stale' at the terminal level
        sess_stl = led.session_state("stl", now_epoch=now)
        self.assertEqual(S.derive_status(sess_stl, now), "stale")
        # the per-session contribution of a stale lane is 'active' (not done/blocked)
        self.assertEqual(S._state_of_session(led, "stl", now), "active")
        # canonical story state across {archived, stale} is 'active' (stale > done)
        story = S.story_id_for(led, "stl")
        self.assertEqual(S.story_state(led, None, story, None, now_epoch=now), "active")


# --------------------------------------------------------------------------- #
# wire timestamp normalization — every /api/state timestamp is UTC-Z
# --------------------------------------------------------------------------- #
class TestTimestampNormalization(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_task_at_is_normalized_to_utc_z_same_instant(self):
        # captured_at is a local-offset stamp; the wire 'at' must be UTC-Z (consistent
        # with generatedAt) AND describe the SAME instant. -04:00 10:00 == 14:00Z.
        cps = [_cp("ts", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("x", "y", human=True)])]
        acts = [_act("stop_boundary", "ts", "2026-06-10T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "ts")
        ats = [t["at"] for t in tasks if t["at"] is not None]
        self.assertTrue(ats)
        for at in ats:
            self.assertTrue(at.endswith("Z"), "wire timestamp must be UTC-Z, got %r" % at)
        # equal-instant check: 10:00-04:00 -> 14:00:00Z
        self.assertEqual(ats[0], "2026-06-10T14:00:00Z")

    def test_focus_started_at_is_utc_z(self):
        cps = [_cp("ts2", "2026-06-10T09:30:00-04:00")]
        acts = [_act("stop_boundary", "ts2", "2026-06-10T10:00:00-04:00")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:01:00-04:00"))
        started = state["focus"]["activeStory"]["startedAt"]
        self.assertIsNotNone(started)
        self.assertTrue(started.endswith("Z"))
        self.assertEqual(started, "2026-06-10T13:30:00Z")   # 09:30-04:00 == 13:30Z

    def test_started_at_is_oldest_checkpoint_across_a_multi_session_story(self):
        # S3-h: startedAt is the WORKSTREAM start (oldest checkpoint across every
        # session mapping to the story), not the focus session's own first checkpoint.
        # Two sessions share one story; the older session's first checkpoint wins.
        cps = [
            _cp("early", "2026-06-10T08:00:00-04:00", project="Mortar"),  # older start
            _cp("focus", "2026-06-10T10:00:00-04:00", project="Mortar"),  # focused, later
        ]
        for c in cps:
            c["cwd"] = "C:\\repo\\Mortar"   # identical story_id
        acts = [
            _act("stop_boundary", "early", "2026-06-10T08:00:00-04:00"),
            _act("stop_boundary", "focus", "2026-06-10T10:00:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        # focus the LATER session explicitly
        tid = S.terminal_id("focus")
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:01:00-04:00"),
                              focus_terminal_id=tid)
        started = state["focus"]["activeStory"]["startedAt"]
        # workstream began at the EARLY session's 08:00-04:00 == 12:00Z, not focus's 14:00Z
        self.assertEqual(started, "2026-06-10T12:00:00Z")


# --------------------------------------------------------------------------- #
# in-flight tool activity — the live trail nodes + working_now (real-time view)
# --------------------------------------------------------------------------- #
class TestActivityTail(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_activity_label_basename_command_and_multi(self):
        # path-op -> basename only (not the full path); multiple paths -> "+N"
        self.assertEqual(
            S._activity_label({"tool": "Edit", "paths": ["C:\\repo\\ci-forge\\render.js"]}),
            ("Edit", "render.js"))
        self.assertEqual(
            S._activity_label({"tool": "Edit", "paths": ["a/b/x.js", "y.css", "z.ts"]}),
            ("Edit", "x.js +2"))
        # Bash -> cleaned command string
        self.assertEqual(
            S._activity_label({"tool": "Bash", "command": "cargo test --workspace"}),
            ("Bash", "cargo test --workspace"))
        # nothing actionable -> empty target
        self.assertEqual(S._activity_label({"tool": "Read"}), ("Read", ""))

    def test_activity_label_target_branch_and_paths_precedence(self):
        # a read/search record carries `target` (no paths/command) -> the label
        # surfaces it, so the live stream shows what was read/searched...
        self.assertEqual(S._activity_label({"tool": "Read", "target": "login.rs"}),
                         ("Read", "login.rs"))
        self.assertEqual(S._activity_label({"tool": "Grep", "target": "AGENTLOG_DIR"}),
                         ("Grep", "AGENTLOG_DIR"))
        # ...but a mutation's `paths` still win over any stray target (ordering).
        self.assertEqual(
            S._activity_label({"tool": "Edit", "paths": ["a/b/x.py"], "target": "ignored"}),
            ("Edit", "x.py"))

    def test_active_trail_includes_read_search_target_nodes(self):
        # reads/searches now flow into the in-flight trail via `target` (not paths),
        # so the histograph moves during EXPLORATION, not just during edits — the
        # gap the user hit ("Bash grep showed, nothing since" while I read/grepped).
        cps = [_cp("wr", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d")])]
        acts = [
            _act("tool_use", "wr", "2026-06-10T10:01:00-04:00", tool="Read", target="login.rs"),
            _act("tool_use", "wr", "2026-06-10T10:02:00-04:00", tool="Grep", target="AGENTLOG_DIR"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        active = S.build_tasks(led, "wr", include_activity=True, working_now=True)
        activity = [t for t in active if t["kind"] == "activity"]
        self.assertEqual([(t["tool"], t["summary"]) for t in activity],
                         [("Read", "login.rs"), ("Grep", "AGENTLOG_DIR")])
        self.assertTrue(activity[-1]["now"])  # the grep is the live edge

    def test_active_trail_appends_inflight_tools_since_last_checkpoint_with_live_now(self):
        # one checkpoint at 10:00, then three tool_use AFTER it (the in-flight turn).
        # The active trail (include_activity) must end with those three as 'activity'
        # nodes, the most recent flagged now=True, and the checkpoint task must NOT be
        # re-tagged 'live' (the live edge is the current tool action, not the decision).
        cps = [_cp("w1", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("a", "the decision", human=True)],
                   next_action="")]
        acts = [
            _act("stop_boundary", "w1", "2026-06-10T10:00:00-04:00"),
            _act("tool_use", "w1", "2026-06-10T10:01:00-04:00", tool="Edit", paths=["render.js"]),
            _act("tool_use", "w1", "2026-06-10T10:02:00-04:00", tool="Bash", command="cargo test"),
            _act("tool_use", "w1", "2026-06-10T10:03:00-04:00", tool="Edit", paths=["app.js"]),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)

        active = S.build_tasks(led, "w1", include_activity=True, working_now=True)
        kinds = [t["kind"] for t in active]
        self.assertEqual(kinds, ["decision", "activity", "activity", "activity"])
        # the decision is history, NOT the live tip
        self.assertEqual(active[0]["kind"], "decision")
        # only the most recent activity is the live edge
        nows = [t for t in active if t.get("now")]
        self.assertEqual(len(nows), 1)
        self.assertIs(nows[0], active[-1])
        self.assertEqual(active[-1]["tool"], "Edit")
        self.assertEqual(active[-1]["summary"], "app.js")
        # oldest -> newest within the tail
        self.assertEqual([t["summary"] for t in active[1:]],
                         ["render.js", "cargo test", "app.js"])

        # WITHOUT include_activity (a sibling trail), no activity nodes; with the lane
        # working but no in-flight tool, the newest checkpoint blooms 'live'.
        sibling = S.build_tasks(led, "w1", working_now=True)
        self.assertNotIn("activity", [t["kind"] for t in sibling])
        self.assertEqual(sibling[-1]["kind"], "live")

    def test_tools_before_last_checkpoint_are_consolidated_out(self):
        # tool_use BEFORE the latest checkpoint are already represented by it, so the
        # in-flight tail must exclude them (else every turn's work would re-appear).
        cps = [
            _cp("w2", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d1")]),
            _cp("w2", "2026-06-10T10:10:00-04:00", decisions=[_decision("b", "d2")]),
        ]
        acts = [
            _act("tool_use", "w2", "2026-06-10T10:05:00-04:00", tool="Read", paths=["old.py"]),  # before cp2
            _act("tool_use", "w2", "2026-06-10T10:11:00-04:00", tool="Edit", paths=["new.py"]),  # after cp2
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        active = S.build_tasks(led, "w2", include_activity=True)
        activity = [t for t in active if t["kind"] == "activity"]
        self.assertEqual([t["summary"] for t in activity], ["new.py"])  # only the post-cp2 tool

    def test_activity_tail_capped(self):
        cps = [_cp("w3", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d")])]
        acts = [_act("tool_use", "w3", "2026-06-10T10:%02d:00-04:00" % (m + 1),
                     tool="Edit", paths=["f%d.js" % m]) for m in range(25)]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        active = S.build_tasks(led, "w3", include_activity=True)
        activity = [t for t in active if t["kind"] == "activity"]
        self.assertEqual(len(activity), S._ACTIVITY_LIMIT)        # bounded
        self.assertEqual(activity[-1]["summary"], "f24.js")       # keeps the MOST RECENT

    def test_idle_lane_does_not_bloom_a_stuck_live_edge(self):
        # the user's bug: a finished task kept pulsing "● now" forever. When the lane
        # is idle (working_now False) with its tools already consolidated, NOTHING is
        # the live tip — the newest checkpoint reads as a plain completed decision.
        cps = [_cp("idle", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("a", "add a fromisoformat fallback")], next_action="")]
        acts = [_act("tool_use", "idle", "2026-06-10T09:58:00-04:00", tool="Edit", paths=["x.js"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "idle", include_activity=True, working_now=False)
        self.assertNotIn("live", [t["kind"] for t in tasks])             # nothing blooms
        self.assertFalse(any(t.get("now") for t in tasks))              # nothing pulses
        self.assertEqual(tasks[-1]["kind"], "decision")                 # newest is plain

    def test_working_lane_pulses_the_in_flight_tool_edge(self):
        # actively working: the in-flight tool is the pulsing live edge.
        cps = [_cp("wk", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "did the thing")])]
        acts = [_act("tool_use", "wk", "2026-06-10T10:05:00-04:00", tool="Edit", paths=["live.js"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "wk", include_activity=True, working_now=True)
        act = [t for t in tasks if t["kind"] == "activity"]
        self.assertTrue(act[-1]["now"])                                 # tool is the edge

    def test_idle_focus_via_build_state_has_no_live_tip(self):
        # end-to-end through build_state/_build_focus: a focus whose last tool fired
        # minutes ago must expose workingNow False AND carry no 'live'/now node — the
        # finished task is settled history, not a perpetual "● now".
        cps = [_cp("f", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("a", "did the thing")], project="Mortar")]
        acts = [_act("tool_use", "f", "2026-06-10T09:58:00-04:00", tool="Edit", paths=["x.js"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:10:00-04:00"))
        focus = state["focus"]
        self.assertFalse(focus["workingNow"])
        tasks = focus["activeStory"]["tasks"]
        self.assertNotIn("live", [t["kind"] for t in tasks])
        self.assertFalse(any(t.get("now") for t in tasks))

    def test_working_now_true_when_recent_tool_else_false(self):
        cps = [_cp("w4", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d")])]
        acts = [_act("tool_use", "w4", "2026-06-10T10:05:00-04:00", tool="Edit", paths=["x.js"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        # 20s after the tool -> working; 5 minutes after -> not
        self.assertTrue(S.working_now(led, "w4", now_epoch=_t("2026-06-10T10:05:20-04:00")))
        self.assertFalse(S.working_now(led, "w4", now_epoch=_t("2026-06-10T10:10:00-04:00")))

    def test_focus_exposes_workingNow_and_live_activity_via_build_state(self):
        cps = [_cp("w5", "2026-06-10T10:00:00-04:00",
                   decisions=[_decision("a", "d")], project="Mortar")]
        acts = [
            _act("stop_boundary", "w5", "2026-06-10T10:00:00-04:00"),
            _act("tool_use", "w5", "2026-06-10T10:06:30-04:00", tool="Bash", command="npm test"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-10T10:06:45-04:00"))
        focus = state["focus"]
        self.assertTrue(focus["workingNow"])                     # tool fired 15s ago
        live = [t for t in focus["activeStory"]["tasks"] if t["kind"] == "activity"]
        self.assertEqual(len(live), 1)
        self.assertEqual(live[0]["tool"], "Bash")
        self.assertTrue(live[0]["now"])


class TestTurnToolCalls(unittest.TestCase):
    """Each COMPLETED task (checkpoint turn) carries the tool calls made during it,
    so the trail can fold them into a click-to-expand accordion — revisit what the
    agent did inside a finished task without cluttering the decision history."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_completed_turn_tool_calls_bound_to_its_task(self):
        # tools BETWEEN cp1 and cp2 belong to cp2's turn; tools before cp1 belong
        # to cp1's turn — each completed task owns exactly its window's calls.
        cps = [
            _cp("s", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "first decision")]),
            _cp("s", "2026-06-10T10:10:00-04:00", decisions=[_decision("b", "second decision")]),
        ]
        acts = [
            _act("tool_use", "s", "2026-06-10T09:59:00-04:00", tool="Read", target="a.py"),   # cp1's turn
            _act("tool_use", "s", "2026-06-10T10:05:00-04:00", tool="Grep", target="foo"),     # cp2's turn
            _act("tool_use", "s", "2026-06-10T10:06:00-04:00", tool="Edit", paths=["b.py"]),   # cp2's turn
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "s", include_activity=True)
        by_summary = {t["summary"]: t for t in tasks if t.get("toolCalls")}
        self.assertEqual([(c["tool"], c["target"]) for c in by_summary["first decision"]["toolCalls"]],
                         [("Read", "a.py")])
        self.assertEqual([(c["tool"], c["target"]) for c in by_summary["second decision"]["toolCalls"]],
                         [("Grep", "foo"), ("Edit", "b.py")])  # oldest->newest within the turn
        self.assertEqual(by_summary["second decision"]["toolCount"], 2)

    def test_inflight_tail_not_folded_into_completed_accordion(self):
        # tools AFTER the last checkpoint are the always-visible live tail (activity
        # nodes) — never folded into a completed task's accordion.
        cps = [_cp("s", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d")], next_action="")]
        acts = [
            _act("tool_use", "s", "2026-06-10T09:59:00-04:00", tool="Read", target="pre.py"),   # cp's turn
            _act("tool_use", "s", "2026-06-10T10:05:00-04:00", tool="Edit", paths=["live.py"]),  # in-flight
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "s", include_activity=True)
        activity = [t for t in tasks if t["kind"] == "activity"]
        self.assertEqual([t["summary"] for t in activity], ["live.py"])         # stays live
        completed = [t for t in tasks if t.get("toolCalls")]
        self.assertEqual(len(completed), 1)
        self.assertEqual([c["target"] for c in completed[0]["toolCalls"]], ["pre.py"])  # only its own turn

    def test_tool_calls_omitted_without_include_activity(self):
        # sibling/non-focused trails stay lean — no accordion payload.
        cps = [_cp("s", "2026-06-10T10:00:00-04:00", decisions=[_decision("a", "d")])]
        acts = [_act("tool_use", "s", "2026-06-10T09:59:00-04:00", tool="Read", target="a.py")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "s")  # include_activity=False
        self.assertTrue(all("toolCalls" not in t for t in tasks))

    def test_turn_tool_calls_capped_keeping_most_recent_with_true_count(self):
        cps = [_cp("s", "2026-06-10T11:00:00-04:00", decisions=[_decision("a", "d")])]
        acts = [_act("tool_use", "s", "2026-06-10T10:%02d:00-04:00" % m, tool="Read", target="f%02d" % m)
                for m in range(0, 55)]  # 55 tools in one turn, before the 11:00 checkpoint
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        tasks = S.build_tasks(led, "s", include_activity=True)
        t = [x for x in tasks if x.get("toolCalls")][0]
        self.assertEqual(t["toolCount"], 55)                       # true total preserved
        self.assertEqual(len(t["toolCalls"]), S._TURN_TOOL_LIMIT)  # bounded payload
        self.assertEqual(t["toolCalls"][-1]["target"], "f54")      # keeps the MOST RECENT


class TestSessionSubstance(unittest.TestCase):
    """The board shows real workstream lanes, not empty/aborted sessions. The real
    trigger: a scheduled task launched from C:\\WINDOWS\\system32 529'd before acting,
    leaving only session_start/end + an invalid 'no work progressed' checkpoint, and
    it rendered as a live lane (project 'system32') — and even became the focus."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_aborted_session_with_only_invalid_checkpoint_is_not_a_lane(self):
        cps = [_cp("junk", "2026-06-15T09:04:00-04:00", valid=False, decisions=[], paths=[],
                   summary="No work progressed: only an API 529 error", project="system32"),
               _cp("real", "2026-06-15T09:30:00-04:00",
                   decisions=[_decision("a", "did work")], valid=True)]
        acts = [_act("session_start", "junk", "2026-06-15T09:00:00-04:00"),
                _act("session_end", "junk", "2026-06-15T09:03:00-04:00"),
                _act("tool_use", "real", "2026-06-15T09:30:00-04:00", tool="Edit", paths=["x.py"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        live = S.live_sessions(led, _t("2026-06-15T09:35:00-04:00"))
        self.assertIn("real", live)
        self.assertNotIn("junk", live)        # the System32 noise lane is gone
        # and it can't be the focus either (focus is picked from live_sessions)
        state = S.build_state(led, _epics([]), now_epoch=_t("2026-06-15T09:35:00-04:00"))
        self.assertNotIn("system32", [t["project"] for t in state["terminals"]])

    def test_actively_working_session_with_no_checkpoint_yet_is_a_lane(self):
        # mid-first-turn (tool_use, no checkpoint yet) IS real — must not be hidden.
        acts = [_act("session_start", "fresh", "2026-06-15T09:00:00-04:00"),
                _act("tool_use", "fresh", "2026-06-15T09:01:00-04:00", tool="Read", target="x.py")]
        _write(self.tmp, [], acts)
        led = R.Ledger.from_dir(self.tmp)
        self.assertIn("fresh", S.live_sessions(led, _t("2026-06-15T09:02:00-04:00")))

    def test_invalid_checkpoint_but_real_tool_use_is_still_a_lane(self):
        # an invalid checkpoint but genuine tool work -> kept (real work happened).
        cps = [_cp("w", "2026-06-15T09:04:00-04:00", valid=False, decisions=[], paths=[])]
        acts = [_act("tool_use", "w", "2026-06-15T09:02:00-04:00", tool="Edit", paths=["a.py"])]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        self.assertIn("w", S.live_sessions(led, _t("2026-06-15T09:05:00-04:00")))


class TestParseTsRobustness(unittest.TestCase):
    """parse_ts must not silently map a valid ISO timestamp to epoch-0. A producer
    that stamps fractional seconds once teleported records to 1970, which then sorted
    before every checkpoint and vanished from the live activity tail (found while
    verifying the per-task tool accordion against a JS-stamped record)."""

    def test_fractional_seconds_and_Z_parse_not_zero(self):
        base = R.parse_ts("2026-06-15T12:26:18+00:00")
        self.assertGreater(base, 0.0)
        frac = R.parse_ts("2026-06-15T12:26:18.694+00:00")
        self.assertNotEqual(frac, 0.0)                  # the bug: was silently 0.0
        self.assertAlmostEqual(frac, base, delta=1.0)
        self.assertAlmostEqual(R.parse_ts("2026-06-15T12:26:18Z"), base, delta=0.001)
        self.assertAlmostEqual(R.parse_ts("2026-06-15T12:26:18.694Z"), base, delta=1.0)

    def test_garbage_and_empty_still_zero(self):
        self.assertEqual(R.parse_ts("not-a-timestamp"), 0.0)
        self.assertEqual(R.parse_ts(""), 0.0)
        self.assertEqual(R.parse_ts(None), 0.0)


# --------------------------------------------------------------------------- #
# session close-out: a terminal session_end auto-drops a lane; a manual dismissal
# hides it until the session does new work; lifecycle/meta records never read fresh.
# --------------------------------------------------------------------------- #
class TestSessionCloseOut(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def _state(self, cps, acts, *, now, dismissed=None):
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        return S.build_state(led, _epics([]), now_epoch=_t(now), dismissed=dismissed)

    def _projects(self, state):
        return {t["project"] for t in state["terminals"]}

    # --- auto-drop on terminal session_end ---------------------------------- #
    def test_terminal_session_end_drops_the_lane(self):
        # work at 10:00, the human exits the session at 10:05 -> the lane is gone.
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("session_end", "s1", "2026-06-10T10:05:00-04:00",
                     source="prompt_input_exit")]
        state = self._state(cps, acts, now="2026-06-10T10:06:00-04:00")
        self.assertEqual(state["terminals"], [])

    def test_clear_end_is_not_a_close(self):
        # /clear is a context reset, not a terminal exit -> the lane stays.
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("session_end", "s1", "2026-06-10T10:05:00-04:00", source="clear")]
        state = self._state(cps, acts, now="2026-06-10T10:06:00-04:00")
        self.assertIn("Mortar", self._projects(state))

    def test_resumed_after_close_is_live_again(self):
        # exit at 10:05, then real work at 10:10 -> the session resumed; show it.
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("session_end", "s1", "2026-06-10T10:05:00-04:00",
                     source="prompt_input_exit"),
                _act("tool_use", "s1", "2026-06-10T10:10:00-04:00", tool="Bash")]
        state = self._state(cps, acts, now="2026-06-10T10:11:00-04:00")
        self.assertIn("Mortar", self._projects(state))

    # --- freshness reflects WORK, not lifecycle/meta records ---------------- #
    def test_last_work_ts_ignores_meta_records(self):
        _write(self.tmp,
               [_cp("s1", "2026-06-10T10:00:00-04:00")],
               [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("session_end", "s1", "2026-06-10T10:30:00-04:00", source="clear"),
                _act("capture_result", "s1", "2026-06-10T10:30:05-04:00")])
        led = R.Ledger.from_dir(self.tmp)
        self.assertEqual(S.last_work_ts(led, "s1"), _t("2026-06-10T10:00:00-04:00"))

    def test_meta_records_do_not_make_an_idle_lane_read_fresh(self):
        # last real work 60min ago; a clear-end + capture meta fire at ~now. The lane
        # must read its true age (danger), never "mid-turn".
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("session_end", "s1", "2026-06-10T11:00:00-04:00", source="clear"),
                _act("capture_attempt", "s1", "2026-06-10T11:00:01-04:00"),
                _act("capture_result", "s1", "2026-06-10T11:00:05-04:00")]
        state = self._state(cps, acts, now="2026-06-10T11:01:00-04:00")
        term = next(t for t in state["terminals"] if t["project"] == "Mortar")
        self.assertNotEqual(term["freshnessLabel"], "mid-turn")
        self.assertEqual(term["freshnessTone"], "danger")

    # --- manual dismissal (returns on new work) ----------------------------- #
    def test_dismissed_lane_is_hidden(self):
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit")]
        # dismissed AFTER the last work -> hidden.
        state = self._state(cps, acts, now="2026-06-10T10:06:00-04:00",
                            dismissed={S.terminal_id("s1"): _t("2026-06-10T10:05:00-04:00")})
        self.assertEqual(state["terminals"], [])

    def test_dismissed_lane_returns_on_new_work(self):
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("tool_use", "s1", "2026-06-10T10:10:00-04:00", tool="Bash")]
        # dismissed at 10:05, but new work at 10:10 -> back on the board.
        state = self._state(cps, acts, now="2026-06-10T10:11:00-04:00",
                            dismissed={S.terminal_id("s1"): _t("2026-06-10T10:05:00-04:00")})
        self.assertIn("Mortar", self._projects(state))

    def test_dismissal_is_scoped_to_its_own_lane(self):
        cps = [_cp("s1", "2026-06-10T10:00:00-04:00", project="Mortar"),
               _cp("s2", "2026-06-10T10:01:00-04:00", project="Bridge")]
        acts = [_act("tool_use", "s1", "2026-06-10T10:00:00-04:00", tool="Edit"),
                _act("tool_use", "s2", "2026-06-10T10:01:00-04:00", tool="Edit")]
        state = self._state(cps, acts, now="2026-06-10T10:06:00-04:00",
                            dismissed={S.terminal_id("s1"): _t("2026-06-10T10:05:00-04:00")})
        self.assertEqual(self._projects(state), {"Bridge"})


if __name__ == "__main__":
    unittest.main()
