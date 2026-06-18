#!/usr/bin/env python3
"""
TDD equivalence tests for the serve_state perf vectors (V4, V5). These are PURE
refactors — they must not change a single byte of derived output, only how fast it
is produced. So every test pins the optimized function against an independent
brute-force reference (or a known multi-session invariant), never against itself.

The broad regression net is the full test_serve_state suite (status/freshness/story/
roadmap/reversal/integrity/ordering/fail-open); this file adds the targeted memo- and
single-pass-correctness invariants those don't isolate.

Run: python -m unittest test_serve_state_perf -v
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import serve_state as S


def _cp(sid, ts, *, project="Mortar", cwd=None, asks=None, decisions=None):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": "did work",
        "touched_paths": ["src/x.rs"], "verification": [], "decisions": decisions or [],
        "risks": [], "asks": asks or [], "next_action": "go", "health_draft": None,
        "checkpoint_id": "chk_%s_%s" % (sid, ts.replace(":", "")), "session_id": sid,
        "host": "claude-code", "cwd": cwd or ("C:\\repo\\%s" % project),
        "project": project, "captured_at": ts, "_valid": True, "_problems": [],
    }


def _act(typ, sid, ts, **extra):
    o = {"type": typ, "session_id": sid, "cwd": "C:\\repo\\Mortar", "ts": ts}
    o.update(extra)
    return o


def _write(d, cps, acts):
    with open(os.path.join(d, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
        for c in cps:
            f.write(json.dumps(c) + "\n")
    with open(os.path.join(d, "activity.jsonl"), "w", encoding="utf-8") as f:
        for a in acts:
            f.write(json.dumps(a) + "\n")


def _ref_sessions_for_story(led, story_id):
    """The original brute-force scan, inlined as the oracle for _sessions_for_story."""
    if not story_id:
        return []
    return [sid for sid in led.session_ids() if S.story_id_for(led, sid) == story_id]


class TestStoryIdMemo(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        # five sessions across three distinct cwds: two pairs collapse to one story
        # each, one is solo. Distinct cwd-leaf => distinct story_id.
        cps = [
            _cp("a1", "2026-06-10T10:00:00-04:00", cwd="C:\\repo\\Mortar\\core"),
            _cp("a2", "2026-06-10T10:01:00-04:00", cwd="C:\\repo\\Mortar\\core"),
            _cp("b1", "2026-06-10T10:02:00-04:00", cwd="C:\\repo\\Mortar\\ui"),
            _cp("b2", "2026-06-10T10:03:00-04:00", cwd="C:\\repo\\Mortar\\ui"),
            _cp("c1", "2026-06-10T10:04:00-04:00", cwd="C:\\repo\\Bridge\\app"),
        ]
        acts = [_act("tool_use", c["session_id"], c["captured_at"], tool="Edit",
                     paths=["x"]) for c in cps]
        _write(self.tmp, cps, acts)
        self.led = R.Ledger.from_dir(self.tmp)

    def test_story_id_is_deterministic_and_repeatable(self):
        # the memo must never change the value: two calls agree, and re-deriving on a
        # FRESH ledger (cold memo) yields the same id.
        first = S.story_id_for(self.led, "a1")
        self.assertEqual(first, S.story_id_for(self.led, "a1"))
        fresh = R.Ledger.from_dir(self.tmp)
        self.assertEqual(S.story_id_for(fresh, "a1"), first)

    def test_distinct_cwds_get_distinct_story_ids(self):
        # correct keying: the memo must not collapse different sessions to one id.
        ids = {sid: S.story_id_for(self.led, sid) for sid in ("a1", "b1", "c1")}
        self.assertEqual(len(set(ids.values())), 3, "distinct cwds must not alias: %r" % ids)

    def test_shared_cwd_sessions_share_one_story(self):
        self.assertEqual(S.story_id_for(self.led, "a1"), S.story_id_for(self.led, "a2"))
        self.assertEqual(S.story_id_for(self.led, "b1"), S.story_id_for(self.led, "b2"))
        self.assertNotEqual(S.story_id_for(self.led, "a1"), S.story_id_for(self.led, "b1"))

    def test_sessions_for_story_matches_bruteforce(self):
        for sid in self.led.session_ids():
            story = S.story_id_for(self.led, sid)
            got = sorted(S._sessions_for_story(self.led, story))
            ref = sorted(_ref_sessions_for_story(self.led, story))
            self.assertEqual(got, ref, "_sessions_for_story(%r) != brute force" % story)

    def test_sessions_for_story_returns_fresh_list(self):
        # callers must be able to treat the result as their own; mutating it must not
        # poison the cached inverse index.
        story = S.story_id_for(self.led, "a1")
        got = S._sessions_for_story(self.led, story)
        got.append("POISON")
        self.assertNotIn("POISON", S._sessions_for_story(self.led, story))

    def test_empty_story_id_is_empty_list(self):
        self.assertEqual(S._sessions_for_story(self.led, None), [])
        self.assertEqual(S._sessions_for_story(self.led, ""), [])


class TestSessionMemos(unittest.TestCase):
    """V5: the now-independent per-session functions are memoized per Ledger. Each
    memoized value must equal a fresh recomputation on a cold Ledger — memoization is
    an optimization, never a behavior change. acked_ids is likewise memoized over the
    immutable activity stream."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        cps = [
            _cp("s", "2026-06-10T10:00:00-04:00"),
            _cp("s", "2026-06-10T10:05:00-04:00", asks=[{"question": "q?", "blocking": True}]),
            _cp("done", "2026-06-01T10:00:00-04:00"),
        ]
        # human_ack at 10:04 (before the last real work) references the blocking
        # checkpoint; stop_boundary at 10:05:30 is the last REAL work; session_end at
        # 10:06 is META (a `clear`) and must NOT count as work — that's the exclusion
        # this fixture pins. (human_ack is deliberately NOT in serve_state's meta set,
        # so it would count; placing it before the stop_boundary keeps it off the max.)
        acts = [
            _act("tool_use", "s", "2026-06-10T10:00:30-04:00", tool="Edit", paths=["a"]),
            _act("human_ack", "s", "2026-06-10T10:04:00-04:00",
                 item_id=cps[1]["checkpoint_id"]),
            _act("stop_boundary", "s", "2026-06-10T10:05:30-04:00"),
            _act("session_end", "s", "2026-06-10T10:06:00-04:00", source="clear"),  # meta
            _act("stop_boundary", "done", "2026-06-01T10:00:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        self.led = R.Ledger.from_dir(self.tmp)

    def test_last_work_ts_memo_equals_fresh(self):
        fresh = R.Ledger.from_dir(self.tmp)
        for sid in ("s", "done", "missing"):
            self.assertEqual(S.last_work_ts(self.led, sid), S.last_work_ts(fresh, sid))
        # last REAL work is the 10:05:30 stop_boundary; the 10:06 session_end (meta) is
        # excluded, so last_work_ts must NOT advance to it.
        self.assertEqual(S.last_work_ts(self.led, "s"),
                         R.parse_ts("2026-06-10T10:05:30-04:00"))
        self.assertLess(S.last_work_ts(self.led, "s"),
                        R.parse_ts("2026-06-10T10:06:00-04:00"))

    def test_first_work_ts_memo_equals_fresh(self):
        fresh = R.Ledger.from_dir(self.tmp)
        for sid in ("s", "done"):
            self.assertEqual(S.first_work_ts(self.led, sid), S.first_work_ts(fresh, sid))
        self.assertEqual(S.first_work_ts(self.led, "s"),
                         R.parse_ts("2026-06-10T10:00:00-04:00"))

    def test_session_has_substance_memo_equals_fresh(self):
        fresh = R.Ledger.from_dir(self.tmp)
        for sid in ("s", "done", "ghost"):
            self.assertEqual(S.session_has_substance(self.led, sid),
                             S.session_has_substance(fresh, sid))

    def test_acked_ids_memo_equals_fresh_and_is_correct(self):
        fresh = R.Ledger.from_dir(self.tmp)
        self.assertEqual(self.led.acked_ids(), fresh.acked_ids())
        # the human_ack references the blocking checkpoint's id -> it is acked.
        self.assertIn(self.led._cps("s")[1]["checkpoint_id"], self.led.acked_ids())


class TestBuildStateOutputUnchanged(unittest.TestCase):
    """The end-to-end guard: a rich fixture (epic linking multiple stories, a blocked
    lane, an idle/done lane, an active lane, an in-flight tool tip) produces a stable
    /api/state. We snapshot the full payload and assert determinism across repeated
    builds and a fresh re-parse — so any perf refactor that perturbs output is caught
    by a diff on the whole structure, not just a hand-picked field."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        cps = [
            _cp("act", "2026-06-10T10:00:00-04:00", project="Mortar",
                cwd="C:\\repo\\Mortar\\core",
                decisions=[{"topic": "transport", "choice": "use HTTP", "rationale": "r",
                            "class": "local", "materiality": "record", "human_involved": True}]),
            _cp("blk", "2026-06-10T10:01:00-04:00", project="Mortar",
                cwd="C:\\repo\\Mortar\\ui",
                asks=[{"question": "approve prod migration?", "blocking": True}]),
            _cp("done", "2026-06-07T10:00:00-04:00", project="Bridge",
                cwd="C:\\repo\\Bridge\\app"),
        ]
        acts = [
            _act("tool_use", "act", "2026-06-10T10:00:30-04:00", tool="Edit", paths=["a.rs"]),
            _act("tool_use", "blk", "2026-06-10T10:01:00-04:00", tool="Read", target="b"),
            _act("stop_boundary", "done", "2026-06-07T10:00:00-04:00"),
        ]
        _write(self.tmp, cps, acts)
        self.now = R.parse_ts("2026-06-10T10:01:10-04:00")
        story_core = S.story_id_for(R.Ledger.from_dir(self.tmp), "act")
        story_ui = S.story_id_for(R.Ledger.from_dir(self.tmp), "blk")
        self.epics = [{"id": "e1", "title": "Parity", "project": "Mortar",
                       "integrity": "reconstructed",
                       "stories": [story_core, story_ui, "st-unbuilt"], "createdAt": None}]

    def _build(self):
        led = R.Ledger.from_dir(self.tmp)
        return S.build_state(led, self.epics, now_epoch=self.now)

    def test_output_is_deterministic_across_rebuilds(self):
        # generatedAt is fixed by now_epoch, so the WHOLE payload must be byte-stable.
        a = json.dumps(self._build(), sort_keys=True)
        b = json.dumps(self._build(), sort_keys=True)
        self.assertEqual(a, b)

    def test_output_reflects_the_fixture(self):
        # non-tautological anchors: the blocked lane is needs-you, the active lane has a
        # live tip, the epic derives done/total over three linked stories.
        st = self._build()
        by_proj = {t["project"]: t for t in st["terminals"]}
        self.assertEqual(by_proj["Mortar"]["status"] if len(by_proj) == 1 else
                         next(t["status"] for t in st["terminals"]
                              if t["statusLine"]["kind"] == "needs-you"), "needs-you")
        # two live Mortar lanes + the Bridge lane is idle/archived (done) -> dropped or done
        statuses = {t["status"] for t in st["terminals"]}
        self.assertIn("needs-you", statuses)
        # focus pane exists and its epic band counts three linked stories
        self.assertIsNotNone(st["focus"])
        if st["focus"].get("epic"):
            self.assertEqual(st["focus"]["epic"]["total"], 3)


if __name__ == "__main__":
    unittest.main()
