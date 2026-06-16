#!/usr/bin/env python3
"""
Tests for the 2026-06-09 producer hardening:
  - DST-correct now_iso (the old stamp skewed every summer epoch by 1h)
  - redact_tree (at-rest §10 redaction over whole checkpoint payloads)
  - git_branch (.git/HEAD read — branch payload for the §9 derivation carve-out)
  - should_capture session_end debounce bypass (session-tail hole)
  - single-flight capture lock (Stop vs PreCompact extractor race)
  - daily capture cap + consecutive-failure breaker (§8.1 spend envelope)
  - posttooluse.tool_use_record (passive-facts layer extraction)
  - integrity_class stamping (reconstructed_claim on quiet captures)

Run: python -m unittest test_producer_guards -v
"""
import json, os, shutil, sys, tempfile, time, unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import capture_extract as CE
import posttooluse as PT
import session_end as SE


class _TempStateMixin:
    """Redirect agentlog state/log paths into a temp dir for the test."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="agentlog-test-")
        self._saved = (A.STATE_DIR, A.HOOK_LOG, A.AGENTLOG_DIR)
        A.AGENTLOG_DIR = self.tmp
        A.STATE_DIR = os.path.join(self.tmp, "state")
        A.HOOK_LOG = os.path.join(self.tmp, "hook.log")
        os.makedirs(A.STATE_DIR, exist_ok=True)

    def tearDown(self):
        A.STATE_DIR, A.HOOK_LOG, A.AGENTLOG_DIR = self._saved[0], self._saved[1], self._saved[2]
        shutil.rmtree(self.tmp, ignore_errors=True)


class TestNowIsoDST(unittest.TestCase):
    def test_roundtrip_matches_wall_clock(self):
        # The old implementation used time.timezone year-round; in DST that parses
        # to an epoch 1h away from time.time(). The fix must roundtrip within
        # seconds, in any timezone, any season.
        stamp = A.now_iso()
        parsed = datetime.strptime(stamp, "%Y-%m-%dT%H:%M:%S%z").timestamp()
        self.assertLess(abs(parsed - time.time()), 5,
                        "now_iso must parse back to the current epoch (DST-correct offset)")


class TestStdinBomTolerance(unittest.TestCase):
    def _parse(self, raw):
        import io
        saved = sys.stdin
        sys.stdin = io.StringIO(raw)
        try:
            return A.read_stdin_json()
        finally:
            sys.stdin = saved

    def test_utf8_decoded_bom_stripped(self):
        # PowerShell pipes prepend a BOM; via a utf-8 stdin codec it arrives as U+FEFF
        self.assertEqual(self._parse("﻿{\"a\": 1}"), {"a": 1})

    def test_cp1252_decoded_bom_bytes_stripped(self):
        # ...and via a cp1252 stdin codec it arrives as the three raw chars ï»¿
        self.assertEqual(self._parse("\xef\xbb\xbf{\"a\": 1}"), {"a": 1})

    def test_plain_payload_unaffected(self):
        self.assertEqual(self._parse('{"a": 1}'), {"a": 1})
        self.assertEqual(self._parse(""), {})


class TestRedactTree(unittest.TestCase):
    def test_redacts_nested_strings(self):
        cp = {"summary": "set api_key=hunter2secret in config",
              "decisions": [{"rationale": "used Bearer abc.def-1234567 for the probe",
                             "alternatives": ["postgres://admin:hunter2@db.local/x"]}],
              "n": 3}
        out = A.redact_tree(cp)
        self.assertNotIn("hunter2secret", out["summary"])
        self.assertNotIn("abc.def-1234567", out["decisions"][0]["rationale"])
        self.assertNotIn("admin:hunter2", out["decisions"][0]["alternatives"][0])
        self.assertEqual(out["n"], 3)

    def test_benign_payload_unchanged(self):
        cp = {"summary": "renamed the config key", "decisions": [{"topic": "naming"}]}
        self.assertEqual(A.redact_tree(cp), cp)


class TestGitBranch(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="agentlog-git-")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _write_head(self, repo, content):
        os.makedirs(os.path.join(repo, ".git"), exist_ok=True)
        with open(os.path.join(repo, ".git", "HEAD"), "w", encoding="utf-8") as f:
            f.write(content)

    def test_reads_branch_from_head(self):
        self._write_head(self.tmp, "ref: refs/heads/feat/aegis-v2-reskin\n")
        self.assertEqual(A.git_branch(self.tmp), "feat/aegis-v2-reskin")

    def test_walks_up_from_subdir(self):
        self._write_head(self.tmp, "ref: refs/heads/master\n")
        sub = os.path.join(self.tmp, "src", "deep")
        os.makedirs(sub, exist_ok=True)
        self.assertEqual(A.git_branch(sub), "master")

    def test_detached_head(self):
        self._write_head(self.tmp, "a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0\n")
        self.assertEqual(A.git_branch(self.tmp), "detached:a1b2c3d4e5f6")

    def test_worktree_gitdir_file(self):
        real = os.path.join(self.tmp, "main-repo")
        self._write_head(real, "ref: refs/heads/wt-branch\n")
        wt = os.path.join(self.tmp, "worktree")
        os.makedirs(wt, exist_ok=True)
        with open(os.path.join(wt, ".git"), "w", encoding="utf-8") as f:
            f.write("gitdir: %s\n" % os.path.join(real, ".git"))
        self.assertEqual(A.git_branch(wt), "wt-branch")

    def test_non_repo_is_empty(self):
        self.assertEqual(A.git_branch(self.tmp), "")


class TestSessionEndCapture(unittest.TestCase):
    def test_session_end_bypasses_debounce(self):
        # The session-tail hole: a debounced final Stop + terminal exit lost the
        # wrap-up segment. SessionEnd must capture regardless of the debounce.
        self.assertTrue(A.should_capture("session_end", grew=True, last_capture_at=999,
                                         now=1000, debounce=120))

    def test_session_end_without_growth_skips(self):
        self.assertFalse(A.should_capture("session_end", grew=False, last_capture_at=0,
                                          now=1000, debounce=120))

    def test_find_transcript_prefers_explicit_path(self):
        with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
            f.write(b"{}")
            p = f.name
        try:
            self.assertEqual(SE.find_transcript({"transcript_path": p}, "sid"), p)
        finally:
            os.unlink(p)

    def test_find_transcript_missing_is_empty(self):
        self.assertEqual(SE.find_transcript({"transcript_path": "Z:/nope/none.jsonl"},
                                            "no-such-session-id-xyz"), "")


class TestCaptureLock(_TempStateMixin, unittest.TestCase):
    def test_single_flight(self):
        self.assertTrue(A.acquire_capture_lock("sess-1"))
        # second acquirer (the racing PreCompact extractor) must be refused
        self.assertFalse(A.acquire_capture_lock("sess-1"))
        A.release_capture_lock("sess-1")
        self.assertTrue(A.acquire_capture_lock("sess-1"))
        A.release_capture_lock("sess-1")

    def test_stale_lock_is_broken(self):
        self.assertTrue(A.acquire_capture_lock("sess-2"))
        path = os.path.join(A.STATE_DIR, "sess-2.capture.lock")
        old = time.time() - (A._LOCK_STALE_SECS + 60)
        os.utime(path, (old, old))
        # a dead extractor's lock must not wedge capture forever
        self.assertTrue(A.acquire_capture_lock("sess-2"))
        A.release_capture_lock("sess-2")

    def test_locks_are_per_session(self):
        self.assertTrue(A.acquire_capture_lock("sess-a"))
        self.assertTrue(A.acquire_capture_lock("sess-b"))
        A.release_capture_lock("sess-a")
        A.release_capture_lock("sess-b")


class TestSpendEnvelope(_TempStateMixin, unittest.TestCase):
    def test_daily_cap_blocks_at_ceiling(self):
        self.assertTrue(A.capture_cap_allows())
        for _ in range(A.max_captures_per_day()):
            A.increment_capture_count()
        self.assertFalse(A.capture_cap_allows())

    def test_cap_env_override(self):
        os.environ["AGENTLOG_MAX_CAPTURES_PER_DAY"] = "2"
        try:
            A.increment_capture_count()
            self.assertTrue(A.capture_cap_allows())
            A.increment_capture_count()
            self.assertFalse(A.capture_cap_allows())
        finally:
            os.environ.pop("AGENTLOG_MAX_CAPTURES_PER_DAY", None)

    def test_breaker_opens_after_three_failures_and_cools_down(self):
        now = 1_000_000.0
        self.assertTrue(A.breaker_allows(now))
        A.record_capture_failure(now)
        A.record_capture_failure(now)
        self.assertTrue(A.breaker_allows(now), "breaker must not open below the threshold")
        A.record_capture_failure(now)
        self.assertFalse(A.breaker_allows(now + 60), "3 consecutive failures must pause captures")
        self.assertTrue(A.breaker_allows(now + A._BREAKER_PAUSE_SECS + 1),
                        "breaker must allow a retry after the cooldown")
        A.reset_breaker()
        self.assertTrue(A.breaker_allows(now))


class TestToolUseRecord(unittest.TestCase):
    def test_edit_paths_extracted(self):
        rec = PT.tool_use_record({"tool_name": "Edit", "session_id": "s1", "cwd": "C:/r",
                                  "tool_input": {"file_path": "C:/r/src/billing.rs"}},
                                 now_iso="2026-06-09T10:00:00-03:00")
        self.assertEqual(rec["type"], "tool_use")
        self.assertEqual(rec["tool"], "Edit")
        self.assertEqual(rec["paths"], ["C:/r/src/billing.rs"])

    def test_bash_command_redacted_and_capped(self):
        long_tail = " x" * 400
        rec = PT.tool_use_record({"tool_name": "Bash", "session_id": "s1",
                                  "tool_input": {"command": "curl -H 'Authorization: Bearer sk-abcdefghijklmnop1234' api" + long_tail}})
        self.assertNotIn("sk-abcdefghijklmnop1234", rec["command"])
        self.assertLessEqual(len(rec["command"]), 500)

    def test_unobservable_payload_is_none(self):
        self.assertIsNone(PT.tool_use_record({"tool_name": "Read", "tool_input": {}}))
        self.assertIsNone(PT.tool_use_record({}))

    # --- observation tools (reads/searches/web/sub-agents): live-stream `target`,
    # never `paths`. The whole point of the separate field is integrity: a file we
    # only READ must not inflate the §6.3 ground-truth / §6.4 suspected-gap "paths
    # the session touched" signals the way an EDIT does. (histograph live activity)
    def test_read_records_target_basename_not_paths(self):
        rec = PT.tool_use_record({"tool_name": "Read", "session_id": "s1", "cwd": "C:/r",
                                  "tool_input": {"file_path": "C:/r/src/auth/login.rs"}})
        self.assertEqual(rec["tool"], "Read")
        self.assertEqual(rec["target"], "login.rs")
        self.assertNotIn("paths", rec)  # MUST NOT count as a touched path

    def test_grep_target_is_pattern_no_paths(self):
        rec = PT.tool_use_record({"tool_name": "Grep", "session_id": "s1",
                                  "tool_input": {"pattern": "AGENTLOG_DIR", "glob": "*.py"}})
        self.assertEqual(rec["tool"], "Grep")
        self.assertEqual(rec["target"], "AGENTLOG_DIR")
        self.assertNotIn("paths", rec)

    def test_glob_target_is_pattern(self):
        rec = PT.tool_use_record({"tool_name": "Glob", "tool_input": {"pattern": "**/*.ts"}})
        self.assertEqual(rec["target"], "**/*.ts")

    def test_webfetch_target_url_redacted_at_rest(self):
        rec = PT.tool_use_record({"tool_name": "WebFetch",
                                  "tool_input": {"url": "https://api.example.com/v1?token=sk-abcdefghijklmnop1234"}})
        self.assertNotIn("sk-abcdefghijklmnop1234", rec["target"])
        self.assertTrue(rec["target"])

    def test_websearch_target_query(self):
        rec = PT.tool_use_record({"tool_name": "WebSearch",
                                  "tool_input": {"query": "lit popover api"}})
        self.assertEqual(rec["target"], "lit popover api")

    def test_task_target_is_description_not_prompt(self):
        rec = PT.tool_use_record({"tool_name": "Task",
                                  "tool_input": {"description": "audit billing flow",
                                                 "prompt": "a very long prompt body ..."}})
        self.assertEqual(rec["target"], "audit billing flow")

    def test_mutation_still_uses_paths_never_target(self):
        # Edit/Write keep their existing semantics: file_path -> paths, no target.
        rec = PT.tool_use_record({"tool_name": "Write", "session_id": "s1",
                                  "tool_input": {"file_path": "C:/r/x.py"}})
        self.assertEqual(rec["paths"], ["C:/r/x.py"])
        self.assertNotIn("target", rec)


class TestIntegrityClassStamp(unittest.TestCase):
    def test_quiet_stamp_is_reconstructed_claim(self):
        cp, ok, _ = CE.stamp_checkpoint(
            {"summary": "s", "touched_paths": ["a.py"],
             "decisions": [{"topic": "t", "choice": "c", "rationale": "r"}]},
            "sessid99", "C:\\repo\\X", 1, "session_end")
        self.assertEqual(cp["integrity_class"], "reconstructed_claim")
        self.assertEqual(cp["capture_trigger"], "session_end")
        self.assertIn("branch", cp)

    def test_quiet_stamp_redacts_at_rest(self):
        cp, _, _ = CE.stamp_checkpoint(
            {"summary": "stored password=topsecret123 in env",
             "touched_paths": ["a.py"],
             "decisions": [{"topic": "t", "choice": "c", "rationale": "r"}]},
            "sessid99", "C:\\repo\\X", 1, "stop")
        self.assertNotIn("topsecret123", cp["summary"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
