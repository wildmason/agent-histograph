#!/usr/bin/env python3
"""Focused tests for the Gemini transcript watcher."""
import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import gemini_watcher as G


class TestGeminiWatcher(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.tmp = self.td.name
        self.old = {
            "activity": G.ACTIVITY,
            "checkpoints": G.CHECKPOINTS,
            "state_file": G.STATE_FILE,
            "lock_file": G.LOCK_FILE,
            "state_dir": A.STATE_DIR,
            "hook_log": A.HOOK_LOG,
        }
        A.STATE_DIR = os.path.join(self.tmp, "state")
        A.HOOK_LOG = os.path.join(self.tmp, "hook.log")
        G.ACTIVITY = os.path.join(self.tmp, "activity.gemini.jsonl")
        G.CHECKPOINTS = os.path.join(self.tmp, "checkpoints.gemini.jsonl")
        G.STATE_FILE = os.path.join(A.STATE_DIR, "gemini_watcher_state.json")
        G.LOCK_FILE = os.path.join(A.STATE_DIR, "gemini_watcher.lock")
        A._ensure_dirs()

    def tearDown(self):
        G.ACTIVITY = self.old["activity"]
        G.CHECKPOINTS = self.old["checkpoints"]
        G.STATE_FILE = self.old["state_file"]
        G.LOCK_FILE = self.old["lock_file"]
        A.STATE_DIR = self.old["state_dir"]
        A.HOOK_LOG = self.old["hook_log"]
        self.td.cleanup()

    def _read_jsonl(self, path):
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]

    def test_planner_response_extracts_sigils_without_checkpoint_spam(self):
        state = {}
        line = json.dumps({
            "type": "PLANNER_RESPONSE",
            "created_at": "2026-06-17T10:00:00Z",
            "content": "intent: Stabilize Gemini capture -- stop ledger fanout\n"
                       "next: Run the watcher tests -- prove the path",
        })
        G.process_line("gm-session", line, state=state)

        acts = self._read_jsonl(G.ACTIVITY)
        self.assertEqual([a["type"] for a in acts], ["intent", "next"])
        self.assertEqual(acts[1]["task"], "Run the watcher tests")
        self.assertFalse(os.path.exists(G.CHECKPOINTS))

    def test_checkpoint_event_writes_one_lightweight_checkpoint(self):
        state = {}
        line = json.dumps({
            "type": "CHECKPOINT",
            "created_at": "2026-06-17T10:01:00Z",
            "content": "Gemini finished wiring the watcher.",
            "thinking": "internal planner text should not become a decision row",
        })
        G.process_line("gm-session", line, state=state)
        G.process_line("gm-session", line, state=state)

        cps = self._read_jsonl(G.CHECKPOINTS)
        self.assertEqual(len(cps), 1)
        self.assertEqual(cps[0]["host"], "gemini")
        self.assertEqual(cps[0]["summary"], "Gemini finished wiring the watcher.")
        self.assertEqual(cps[0]["decisions"], [])
        self.assertTrue(cps[0]["_valid"])

    def test_user_input_emits_one_session_start_per_session(self):
        state = {}
        for minute in ("00", "01"):
            G.process_line("gm-session", json.dumps({
                "type": "USER_INPUT",
                "source": "USER_EXPLICIT",
                "created_at": f"2026-06-17T10:{minute}:00Z",
            }), state=state)

        acts = self._read_jsonl(G.ACTIVITY)
        self.assertEqual(len(acts), 1)
        self.assertEqual(acts[0]["type"], "session_start")

    def test_project_is_derived_from_tool_paths_not_brain_guid(self):
        state = {}
        session_id = "93330dc6-6161-43f1-9f5b-021e7c4ea9bf"
        repo = os.path.join(os.path.expanduser("~"), "Documents", "development",
                            "agent-histograph")
        G.process_line(session_id, json.dumps({
            "type": "PLANNER_RESPONSE",
            "created_at": "2026-06-17T10:02:00Z",
            "tool_calls": [{
                "name": "run_command",
                "args": {"Cwd": repo, "CommandLine": "python -m unittest"},
            }],
        }), state=state)

        acts = self._read_jsonl(G.ACTIVITY)
        self.assertEqual(len(acts), 1)
        self.assertEqual(acts[0]["project"], "agent-histograph")
        self.assertEqual(os.path.basename(acts[0]["cwd"]), "agent-histograph")
        self.assertNotIn(session_id, acts[0]["project"])

    def test_unknown_project_falls_back_without_guid(self):
        state = {}
        session_id = "93330dc6-6161-43f1-9f5b-021e7c4ea9bf"
        G.process_line(session_id, json.dumps({
            "type": "USER_INPUT",
            "source": "USER_EXPLICIT",
            "created_at": "2026-06-17T10:03:00Z",
        }), state=state)

        acts = self._read_jsonl(G.ACTIVITY)
        self.assertEqual(acts[0]["project"], "gemini-session")
        self.assertEqual(os.path.basename(acts[0]["cwd"]), "gemini-session")

    def test_line_seen_guard_blocks_replay_duplicates(self):
        state = {}
        line = json.dumps({"type": "USER_INPUT", "source": "USER_EXPLICIT"})
        self.assertFalse(G._mark_seen(state, "transcript.jsonl", line))
        self.assertTrue(G._mark_seen(state, "transcript.jsonl", line))


# --------------------------------------------------------------------------- #
# V7 — single-instance lock hardening. The 2026-06-17 incident dumped 140k+
# duplicate Gemini records because a second watcher replayed the same transcripts.
# The PID-only lock was defeatable by PID reuse (a recycled PID makes a dead owner
# look alive). The hardened lock pairs the PID with a heartbeat (the lock file's
# mtime, refreshed each loop): a lock that hasn't been refreshed within
# STALE_LOCK_SECS is reclaimed even if its PID is "alive", and a genuinely live +
# fresh lock blocks a second instance.
# --------------------------------------------------------------------------- #
class TestWatcherLock(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.tmp = self.td.name
        self._old_lock = G.LOCK_FILE
        self._old_state_dir = A.STATE_DIR
        self._old_hb = G._last_heartbeat
        A.STATE_DIR = os.path.join(self.tmp, "state")
        G.LOCK_FILE = os.path.join(self.tmp, "gemini_watcher.lock")
        G._last_heartbeat = 0.0
        A._ensure_dirs()

    def tearDown(self):
        # release any lock we hold so a leaked fd can't keep the temp file open
        try:
            if os.path.exists(G.LOCK_FILE):
                os.remove(G.LOCK_FILE)
        except Exception:
            pass
        G.LOCK_FILE = self._old_lock
        A.STATE_DIR = self._old_state_dir
        G._last_heartbeat = self._old_hb
        self.td.cleanup()

    def _owner(self):
        with open(G.LOCK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def test_acquire_writes_owner_with_our_pid(self):
        fd = G.acquire_lock()
        self.assertIsNotNone(fd)
        try:
            self.assertEqual(self._owner()["pid"], os.getpid())
        finally:
            G.release_lock(fd)
        self.assertFalse(os.path.exists(G.LOCK_FILE))  # released cleanly

    def test_second_instance_blocked_while_lock_is_live_and_fresh(self):
        fd = G.acquire_lock()                       # first instance holds it (our pid, fresh)
        try:
            self.assertIsNone(G.acquire_lock(),     # second instance must back off
                              "a live, freshly-heartbeat lock must block a second watcher")
        finally:
            G.release_lock(fd)

    def test_stale_heartbeat_is_reclaimed_even_if_pid_alive(self):
        # THE PID-reuse defense: a lock owned by a LIVE pid (our own) but whose
        # heartbeat (mtime) is older than STALE_LOCK_SECS must be reclaimed — liveness
        # is the heartbeat, not mere PID existence.
        with open(G.LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({"pid": os.getpid(), "started": A.now_iso()}, f)
        stale = time.time() - (G.STALE_LOCK_SECS + 30)
        os.utime(G.LOCK_FILE, (stale, stale))
        fd = G.acquire_lock()
        self.assertIsNotNone(fd, "a stale-heartbeat lock must be reclaimed")
        try:
            self.assertEqual(self._owner()["pid"], os.getpid())
        finally:
            G.release_lock(fd)

    def test_dead_pid_lock_is_reclaimed(self):
        # a lock from a crashed watcher (pid no longer exists) is reclaimed regardless
        # of heartbeat freshness.
        dead = 2 ** 31 - 1            # a pid that is essentially never live
        with open(G.LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({"pid": dead, "started": A.now_iso()}, f)
        fd = G.acquire_lock()
        self.assertIsNotNone(fd)
        try:
            self.assertEqual(self._owner()["pid"], os.getpid())
        finally:
            G.release_lock(fd)

    def test_heartbeat_refreshes_mtime(self):
        fd = G.acquire_lock()
        try:
            old = time.time() - (G.STALE_LOCK_SECS + 30)
            os.utime(G.LOCK_FILE, (old, old))
            G._last_heartbeat = 0.0           # clear throttle so the touch fires
            G._heartbeat()
            self.assertGreater(os.stat(G.LOCK_FILE).st_mtime, old + 1,
                               "heartbeat must bump the lock mtime forward")
        finally:
            G.release_lock(fd)

    def test_lock_path_is_machine_global_not_per_ledger_dir(self):
        # the default lock path must NOT live under AGENTLOG_DIR — the watcher's input
        # (~/.gemini) is machine-global, so one watcher per machine is the invariant.
        # (We can only assert the default resolver, since setUp overrides LOCK_FILE.)
        default_lock = G._default_lock_path()
        self.assertNotIn(os.path.normcase(os.path.abspath(A.AGENTLOG_DIR)),
                         os.path.normcase(os.path.abspath(default_lock)),
                         "lock must be independent of the ledger dir")


# --------------------------------------------------------------------------- #
# start_in_thread — the in-process daemon-thread launch the board's `serve`
# process uses to auto-start Gemini capture (the missing auto-launch path). It
# must be single-instance (the hardened lock gates it: a second board's serve
# can't double-capture) and fail-open (a startup error must never crash the board).
# --------------------------------------------------------------------------- #
class TestStartInThread(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.tmp = self.td.name
        self._old_lock = G.LOCK_FILE
        self._old_state_dir = A.STATE_DIR
        self._old_hb = G._last_heartbeat
        self._old_watch = G.watch_transcripts
        A.STATE_DIR = os.path.join(self.tmp, "state")
        G.LOCK_FILE = os.path.join(self.tmp, "gemini_watcher.lock")
        G._last_heartbeat = 0.0
        # don't run the real infinite tail loop in a test — stub it to return at once
        # so the started daemon thread exits immediately (the lock stays held until the
        # registered release, exactly as in the live process).
        G.watch_transcripts = lambda: None
        A._ensure_dirs()

    def tearDown(self):
        G.watch_transcripts = self._old_watch
        # release the in-process lock fd start_in_thread held open (Windows can't
        # delete an open file, so this must precede the temp-dir cleanup).
        if G._lock_fd is not None:
            G.release_lock(G._lock_fd)
            G._lock_fd = None
        try:
            if os.path.exists(G.LOCK_FILE):
                os.remove(G.LOCK_FILE)
        except Exception:
            pass
        G.LOCK_FILE = self._old_lock
        A.STATE_DIR = self._old_state_dir
        G._last_heartbeat = self._old_hb
        self.td.cleanup()

    def test_starts_one_thread_and_blocks_a_second(self):
        t1 = G.start_in_thread()
        self.assertIsNotNone(t1, "first start must launch the watcher thread")
        self.assertTrue(os.path.exists(G.LOCK_FILE))   # it took the lock
        t1.join(timeout=2)                              # the stubbed loop returns at once
        # a SECOND start (the lock is still held by this process) must NOT start a
        # duplicate — this is what makes auto-start-from-serve safe for two boards.
        t2 = G.start_in_thread()
        self.assertIsNone(t2, "a second start must back off while the lock is held")

    def test_fail_open_when_acquire_raises(self):
        saved = G.acquire_lock
        G.acquire_lock = lambda: (_ for _ in ()).throw(RuntimeError("boom"))
        try:
            self.assertIsNone(G.start_in_thread(), "a startup error must degrade to None, not raise")
        finally:
            G.acquire_lock = saved


if __name__ == "__main__":
    unittest.main()
