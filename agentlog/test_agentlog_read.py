#!/usr/bin/env python3
"""
TDD unit tests for agentlog_read.py performance vectors:

  V3 — parse_ts: fromisoformat-first + memoized. The hard contract is BYTE-IDENTICAL
       output vs the original two-tier (strptime-then-fromisoformat) parser across
       every input class (offset, Z, fractional, naive, junk, None), plus correct
       memoization (repeat calls agree; distinct inputs don't collide).

  V2 — Ledger session indexing: _cps/_acts return the SAME lists (same order, same
       contents) as a from-scratch full scan, for every session id and for an
       unknown id — proving the O(1) index didn't change observable behavior.

Run: python -m unittest test_agentlog_read -v
"""
import os, sys, json, tempfile, unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R


# The ORIGINAL parse_ts, inlined verbatim as the reference oracle. The optimized
# parse_ts must agree with this for every input — that is the byte-identical contract.
def _ref_parse_ts(s):
    if not s:
        return 0.0
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z").timestamp()
    except Exception:
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0


# Representative inputs spanning every branch the parser must handle identically.
_TS_INPUTS = [
    # canonical hook format (offset) — the strptime fast-path case
    "2026-06-10T10:00:00-04:00",
    "2026-06-10T10:00:00+00:00",
    "2026-06-10T10:00:00+05:30",
    "2026-01-01T00:00:00-08:00",
    # trailing Z (UTC)
    "2026-06-10T14:00:00Z",
    "1970-01-01T00:00:00Z",
    # fractional seconds (strptime fast-path FAILS -> fromisoformat in the original)
    "2026-06-10T10:00:00.123456-04:00",
    "2026-06-10T10:00:00.5+00:00",
    "2026-06-10T10:00:00.999999Z",
    # naive (no offset) — both impls fall to fromisoformat -> local-time interpretation
    "2026-06-10T10:00:00",
    "2026-06-10T10:00:00.250",
    # date-only (fromisoformat accepts it; strptime fails)
    "2026-06-10",
    # junk / empty / None -> 0.0
    "not a timestamp",
    "",
    None,
    "2026-13-99T99:99:99-04:00",
]


class TestParseTsByteIdentical(unittest.TestCase):
    def test_matches_reference_for_every_input_class(self):
        for s in _TS_INPUTS:
            self.assertEqual(R.parse_ts(s), _ref_parse_ts(s),
                             "parse_ts(%r) diverged from the original parser" % s)

    def test_known_epoch_anchors(self):
        # Not self-referential: assert against independently-computed epoch values so a
        # regression in BOTH parse_ts and the oracle can't pass silently.
        # 2026-06-10T14:00:00Z and 2026-06-10T10:00:00-04:00 are the same instant.
        z = R.parse_ts("2026-06-10T14:00:00Z")
        off = R.parse_ts("2026-06-10T10:00:00-04:00")
        self.assertEqual(z, off)
        self.assertEqual(R.parse_ts("1970-01-01T00:00:00Z"), 0.0)
        # +05:30 is 5.5h ahead of UTC: 2026-06-10T05:30:00+05:30 == 2026-06-10T00:00:00Z
        self.assertEqual(R.parse_ts("2026-06-10T05:30:00+05:30"),
                         R.parse_ts("2026-06-10T00:00:00Z"))

    def test_fractional_seconds_are_preserved(self):
        # .5s past the second must be exactly 0.5 greater than the whole second.
        whole = R.parse_ts("2026-06-10T10:00:00+00:00")
        frac = R.parse_ts("2026-06-10T10:00:00.5+00:00")
        self.assertAlmostEqual(frac - whole, 0.5, places=6)

    def test_failure_sentinel_is_zero(self):
        self.assertEqual(R.parse_ts("garbage"), 0.0)
        self.assertEqual(R.parse_ts(""), 0.0)
        self.assertEqual(R.parse_ts(None), 0.0)

    def test_memoization_is_consistent(self):
        # repeat calls agree; interleaving distinct inputs never cross-contaminates the
        # cache (a broken memo would leak one key's value to another).
        a = "2026-06-10T10:00:00-04:00"
        b = "2026-06-10T10:00:00-05:00"   # one hour later in UTC
        self.assertEqual(R.parse_ts(a), R.parse_ts(a))
        self.assertNotEqual(R.parse_ts(a), R.parse_ts(b))
        self.assertEqual(R.parse_ts(b) - R.parse_ts(a), 3600.0)
        # value still matches the oracle after caching
        self.assertEqual(R.parse_ts(a), _ref_parse_ts(a))


# --------------------------------------------------------------------------- #
# V2 — Ledger session indexing equivalence
# --------------------------------------------------------------------------- #
def _cp(sid, ts, **extra):
    o = {"type": "checkpoint", "session_id": sid, "captured_at": ts,
         "checkpoint_id": "chk_%s_%s" % (sid, ts), "host": "claude-code",
         "project": "P", "cwd": "C:\\repo\\P", "summary": "s", "decisions": [],
         "_valid": True}
    o.update(extra)
    return o


def _act(typ, sid, ts, **extra):
    o = {"type": typ, "session_id": sid, "ts": ts, "cwd": "C:\\repo\\P"}
    o.update(extra)
    return o


class TestLedgerSessionIndex(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        # three interleaved sessions, out of timestamp order on disk, plus records
        # with NO session_id (must be excluded from every per-session list).
        cps = [
            _cp("a", "2026-06-10T10:05:00-04:00"),
            _cp("b", "2026-06-10T10:01:00-04:00"),
            _cp("a", "2026-06-10T10:00:00-04:00"),
            {"type": "checkpoint", "captured_at": "2026-06-10T10:02:00-04:00"},  # no sid
        ]
        acts = [
            _act("tool_use", "a", "2026-06-10T10:06:00-04:00", tool="Edit"),
            _act("stop_boundary", "b", "2026-06-10T10:01:30-04:00"),
            _act("tool_use", "a", "2026-06-10T10:00:30-04:00", tool="Read"),
            _act("intent", "c", "2026-06-10T10:03:00-04:00", title="t"),
            {"type": "tool_use", "ts": "2026-06-10T10:04:00-04:00"},  # no sid
        ]
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            for c in cps:
                f.write(json.dumps(c) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "w", encoding="utf-8") as f:
            for a in acts:
                f.write(json.dumps(a) + "\n")
        self.led = R.Ledger.from_dir(self.tmp)

    def test_cps_acts_equal_full_scan_for_every_session(self):
        for sid in self.led.session_ids() + ["does-not-exist"]:
            expect_cps = [c for c in self.led.checkpoints if c.get("session_id") == sid]
            expect_acts = [a for a in self.led.activity if a.get("session_id") == sid]
            self.assertEqual(self.led._cps(sid), expect_cps,
                             "_cps(%r) != full scan" % sid)
            self.assertEqual(self.led._acts(sid), expect_acts,
                             "_acts(%r) != full scan" % sid)

    def test_cps_acts_preserve_sorted_order(self):
        # the index must hand back records in the Ledger's sorted (oldest->newest)
        # order — cps[-1] == newest is relied on across serve_state.
        cps_a = self.led._cps("a")
        ats = [R.parse_ts(c["captured_at"]) for c in cps_a]
        self.assertEqual(ats, sorted(ats))
        self.assertEqual(cps_a[-1]["captured_at"], "2026-06-10T10:05:00-04:00")
        acts_a = self.led._acts("a")
        a_ts = [R.parse_ts(a["ts"]) for a in acts_a]
        self.assertEqual(a_ts, sorted(a_ts))

    def test_unknown_session_returns_empty(self):
        self.assertEqual(self.led._cps("nope"), [])
        self.assertEqual(self.led._acts("nope"), [])

    def test_hostless_record_without_sid_excluded(self):
        # a record with no session_id must not appear under any session.
        for sid in self.led.session_ids():
            self.assertTrue(all(c.get("session_id") == sid for c in self.led._cps(sid)))
            self.assertTrue(all(a.get("session_id") == sid for a in self.led._acts(sid)))


if __name__ == "__main__":
    unittest.main()
