#!/usr/bin/env python3
"""
Tests for the quiet (out-of-band) capture path's pure logic:
  - A.should_capture(): the debounce / growth / precompact-bypass decision.
  - capture_extract.stamp_checkpoint(): provenance + validity stamping.

The model pass (claude -p) is the impure boundary and is smoke-tested live elsewhere;
here we pin the logic that decides WHEN to capture and HOW a captured checkpoint is
stamped — the parts that must not silently drift.

Run: python -m unittest test_capture_quiet -v
"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import capture_extract as CE


class TestShouldCapture(unittest.TestCase):
    def test_stop_first_capture_fires(self):
        self.assertTrue(A.should_capture("stop", grew=True, last_capture_at=0, now=1000, debounce=120))

    def test_stop_debounced_within_window(self):
        self.assertFalse(A.should_capture("stop", grew=True, last_capture_at=970, now=1000, debounce=120))

    def test_stop_after_debounce_window(self):
        self.assertTrue(A.should_capture("stop", grew=True, last_capture_at=800, now=1000, debounce=120))

    def test_no_growth_never_captures(self):
        self.assertFalse(A.should_capture("stop", grew=False, last_capture_at=0, now=1000, debounce=120))
        self.assertFalse(A.should_capture("precompact", grew=False, last_capture_at=0, now=1000, debounce=120))

    def test_precompact_bypasses_debounce(self):
        # a compaction boundary captures even if a Stop just captured (context is about to be lost)
        self.assertTrue(A.should_capture("precompact", grew=True, last_capture_at=999, now=1000, debounce=120))


class TestStampCheckpoint(unittest.TestCase):
    def _valid_cp(self):
        return {
            "summary": "Chose to preserve legacy renewal semantics.",
            "touched_paths": ["src/renewals.rs"],
            "decisions": [{"topic": "Renewal behavior", "choice": "Preserve legacy",
                           "rationale": "Avoid widening blast radius into billing.",
                           "class": "none"}],
            "verification": [], "risks": [], "asks": [],
        }

    def test_stamps_provenance_and_validity(self):
        cp, ok, problems = CE.stamp_checkpoint(self._valid_cp(), "b8e1aaff-xyz", "C:\\repo\\Bridge", 1, "stop")
        self.assertEqual(cp["checkpoint_id"], "chk_cc_b8e1aaff_001")
        self.assertEqual(cp["session_id"], "b8e1aaff-xyz")
        self.assertEqual(cp["host"], "claude-code")
        self.assertEqual(cp["project"], "Bridge")
        self.assertEqual(cp["capture_mode"], "quiet")
        self.assertEqual(cp["capture_trigger"], "stop")
        self.assertTrue(cp["captured_at"])
        self.assertTrue(ok)
        self.assertEqual(problems, [])

    def test_invalid_checkpoint_flagged_not_dropped(self):
        bad = {"summary": "", "touched_paths": [], "decisions": []}  # no decisions, empty summary, no paths
        cp, ok, problems = CE.stamp_checkpoint(bad, "sess1234", "C:\\repo\\X", 3, "precompact")
        self.assertEqual(cp["checkpoint_id"], "chk_cc_sess1234_003")
        self.assertEqual(cp["capture_trigger"], "precompact")
        self.assertFalse(ok)
        self.assertTrue(problems)   # validate_checkpoint reported the structural problems


class TestClaudePRecursionSafety(unittest.TestCase):
    """Regression guard for the fork-bomb: a headless claude -p MUST run with the
    agentlog kill switch on, or an armed parent recurses (claude -p → Stop hook →
    spawn capture_extract → claude -p → …). Monkeypatch subprocess.run to inspect the
    child env without actually launching claude."""
    def test_claude_p_disables_hooks_in_child_env(self):
        import subprocess
        import replay_pilot as RP
        seen = {}

        class _Done:
            returncode = 0
            stdout = "```json\n{}\n```"
            stderr = ""

        orig = subprocess.run
        subprocess.run = lambda *a, **kw: (
            seen.update(env=kw.get("env"), creationflags=kw.get("creationflags", 0)) or _Done())
        had = os.environ.get("AGENTLOG_CAPTURE_ACTIVE")
        os.environ["AGENTLOG_CAPTURE_ACTIVE"] = "1"
        try:
            RP.claude_p("instr", "ctx", timeout=5)
        finally:
            subprocess.run = orig
            if had is None:
                os.environ.pop("AGENTLOG_CAPTURE_ACTIVE", None)
            else:
                os.environ["AGENTLOG_CAPTURE_ACTIVE"] = had
        env = seen.get("env")
        self.assertIsNotNone(env, "claude_p must pass an explicit env to the subprocess")
        self.assertEqual(env.get("AGENTLOG_DISABLE"), "1")
        self.assertNotIn("AGENTLOG_CAPTURE_ACTIVE", env)
        if os.name == "nt":
            # Windows: the detached, console-less capture must launch claude.exe with
            # CREATE_NO_WINDOW (0x08000000) or a terminal window pops up every turn.
            self.assertTrue(seen.get("creationflags", 0) & 0x08000000,
                            "claude -p must run with CREATE_NO_WINDOW on Windows (no popped console)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
