#!/usr/bin/env python3
"""
TDD tests for serve_digest.build_digest — the "while you were away" overnight digest (#1).

Every test writes synthetic JSONL, builds a real Ledger, injects a fixed now_epoch and
cursor, and asserts a DERIVED grouping/flag/count — never a literal echoing itself. The
load-bearing logic pinned: high-class flagging, cross-cursor reversal detection, the
two-sided newly-stale boundary, ack-aware waiting delegation, touched_paths set-union,
provider_of normalization (cli+claude-code -> claude), and the empty-cursor case.

Run: python -m unittest test_serve_digest -v
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import serve_state as S
import serve_digest as D


def _cp(sid, ts, *, decisions=None, asks=None, project="Mortar", summary="did work",
        paths=None, host="claude-code", cid=None):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": summary,
        "touched_paths": paths if paths is not None else ["src/x.rs"],
        "verification": [], "decisions": decisions or [], "risks": [],
        "asks": asks or [], "next_action": "keep going", "health_draft": None,
        "checkpoint_id": cid or ("chk_%s_%s" % (sid, ts.replace(":", "").replace("-", ""))),
        "session_id": sid, "host": host, "cwd": "C:\\repo\\%s" % project,
        "project": project, "captured_at": ts, "_valid": True, "_problems": [],
    }


def _act(typ, sid, ts, **extra):
    o = {"type": typ, "session_id": sid, "cwd": "C:\\repo\\Mortar", "armed": True, "ts": ts}
    o.update(extra)
    return o


def _decision(topic, choice, *, cls="local", reversibility="high"):
    return {"topic": topic, "choice": choice, "rationale": "because", "alternatives": [],
            "reversibility": reversibility, "confidence": "high", "class": cls,
            "materiality": "record", "human_involved": False}


def _write(d, checkpoints, activity):
    with open(os.path.join(d, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
        for c in checkpoints:
            f.write(json.dumps(c) + "\n")
    with open(os.path.join(d, "activity.jsonl"), "w", encoding="utf-8") as f:
        for a in activity:
            f.write(json.dumps(a) + "\n")


def _t(iso):
    return R.parse_ts(iso)


def _group(digest, project):
    return next((g for g in digest["projects"] if g["project"] == project), None)


CURSOR = "2026-06-10T08:00:00-04:00"
NOW = "2026-06-10T10:00:00-04:00"


class TestDigest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_high_class_decisions_flagged(self):
        cps = [_cp("s1", "2026-06-10T09:00:00-04:00", project="Mortar", decisions=[
            _decision("billing provider", "switch to Stripe", cls="billing"),
            _decision("button color", "use teal", cls="local"),
        ])]
        _write(self.tmp, cps, [])
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        self.assertIsNotNone(g)
        billing = next(d for d in g["decisions"] if d["class"] == "billing")
        local = next(d for d in g["decisions"] if d["class"] == "local")
        self.assertTrue(billing["highClass"])
        self.assertFalse(local["highClass"])
        self.assertEqual([m["class"] for m in g["milestones"]], ["billing"])

    def test_reversal_detected_across_cursor(self):
        # A topic decided BEFORE the cursor, re-decided AFTER -> reversal naming the prior.
        cps = [
            _cp("s1", "2026-06-10T07:00:00-04:00", decisions=[
                _decision("db choice", "use postgres")]),     # pre-cursor
            _cp("s1", "2026-06-10T09:00:00-04:00", decisions=[
                _decision("db choice", "use mysql")]),        # post-cursor re-decision
        ]
        _write(self.tmp, cps, [])
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        self.assertEqual(len(g["reversals"]), 1)
        rev = g["reversals"][0]
        self.assertEqual(rev["topic"].lower(), "db choice")
        self.assertIn("postgres", rev["supersededSummary"])
        # the post-cursor decision shows once in decisions; the pre-cursor one does not.
        self.assertEqual(len(g["decisions"]), 1)
        self.assertIn("mysql", g["decisions"][0]["choice"])

    def test_newly_stale_boundary(self):
        # Lane A last worked BEFORE the cursor (already idle when you left) -> NOT stale.
        # Lane B worked AFTER the cursor and is now idle > STALE_SECS -> newly stale.
        cps = [
            _cp("a", "2026-06-10T07:00:00-04:00", project="Mortar", summary="A old"),
            _cp("b", "2026-06-10T09:00:00-04:00", project="Mortar", summary="B newer"),
        ]
        acts = [_act("tool_use", "a", "2026-06-10T07:00:00-04:00", tool="Edit"),
                _act("tool_use", "b", "2026-06-10T09:00:00-04:00", tool="Edit")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        stale_terms = {n["terminalId"] for n in g["newlyStale"]}
        self.assertIn(S.terminal_id("b"), stale_terms)
        self.assertNotIn(S.terminal_id("a"), stale_terms)

    def test_waiting_delegates_and_ack_filters(self):
        # Lane W has an open blocking ask -> waiting. Lane K's ask is human-acked -> excluded.
        cps = [
            _cp("w", "2026-06-10T09:50:00-04:00", project="Mortar", cid="chk_w",
                asks=[{"question": "ship it?", "blocking": True}]),
            _cp("k", "2026-06-10T09:50:00-04:00", project="Mortar", cid="chk_k",
                asks=[{"question": "delete prod?", "blocking": True}]),
        ]
        acts = [
            _act("stop_boundary", "w", "2026-06-10T09:50:00-04:00"),
            _act("stop_boundary", "k", "2026-06-10T09:50:00-04:00"),
            _act("human_ack", "k", "2026-06-10T09:51:00-04:00", item_id="chk_k"),
        ]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        waiting_terms = {w["terminalId"] for w in g["waiting"]}
        self.assertIn(S.terminal_id("w"), waiting_terms)
        self.assertNotIn(S.terminal_id("k"), waiting_terms)
        self.assertIn("ship it?", g["waiting"][0]["question"])

    def test_touched_paths_union_dedup(self):
        cps = [
            _cp("s1", "2026-06-10T09:00:00-04:00", paths=["a.py", "b.py"]),
            _cp("s1", "2026-06-10T09:30:00-04:00", paths=["b.py", "c.py"]),
        ]
        _write(self.tmp, cps, [])
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        self.assertEqual(g["filesChanged"], ["a.py", "b.py", "c.py"])
        self.assertEqual(g["counts"]["filesChanged"], 3)

    def test_grouping_by_provider_uses_provider_of(self):
        # cli + claude-code collapse to 'claude'; codex is separate. Raw host would
        # give 3 entries; provider_of normalization gives ['claude', 'codex'].
        cps = [
            _cp("cli1", "2026-06-10T09:00:00-04:00", project="Mortar", host="cli",
                decisions=[_decision("t1", "c1")]),
            _cp("cc1", "2026-06-10T09:05:00-04:00", project="Mortar", host="claude-code",
                decisions=[_decision("t2", "c2")]),
            _cp("cx1", "2026-06-10T09:10:00-04:00", project="Mortar", host="codex",
                decisions=[_decision("t3", "c3")]),
        ]
        _write(self.tmp, cps, [])
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(CURSOR), now_epoch=_t(NOW))
        g = _group(dig, "Mortar")
        self.assertEqual(g["providers"], ["claude", "codex"])

    def test_newly_stale_multiday_away(self):
        # Regression: a lane that worked AFTER the cursor but went quiet >24h ago must
        # STILL show as newly-stale (the multi-day/weekend-away case the digest exists
        # for). The pre-fix code delegated to live_sessions, whose 24h LIVE_WINDOW gate
        # silently dropped it.
        now = "2026-06-10T10:00:00-04:00"
        cursor = "2026-06-07T08:00:00-04:00"     # 3 days back
        cps = [_cp("a", "2026-06-09T04:00:00-04:00", project="Mortar", summary="worked ~30h ago")]
        acts = [_act("tool_use", "a", "2026-06-09T04:00:00-04:00", tool="Edit")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(cursor), now_epoch=_t(now))
        g = _group(dig, "Mortar")
        self.assertIsNotNone(g)
        stale_terms = {n["terminalId"] for n in g["newlyStale"]}
        self.assertIn(S.terminal_id("a"), stale_terms)

    def test_empty_digest_when_nothing_moved(self):
        # cursor == now: nothing after it, no waiting lane -> empty, no projects.
        cps = [_cp("s1", "2026-06-10T09:00:00-04:00", summary="active, not waiting")]
        acts = [_act("tool_use", "s1", "2026-06-10T09:59:30-04:00", tool="Edit")]
        _write(self.tmp, cps, acts)
        led = R.Ledger.from_dir(self.tmp)
        dig = D.build_digest(led, _t(NOW), now_epoch=_t(NOW))
        self.assertTrue(dig["empty"])
        self.assertEqual(dig["projects"], [])
        self.assertEqual(sum(dig["totals"].values()), 0)


if __name__ == "__main__":
    unittest.main()
