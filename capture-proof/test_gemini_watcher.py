#!/usr/bin/env python3
"""Focused tests for the Gemini transcript watcher."""
import json
import os
import sys
import tempfile
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


if __name__ == "__main__":
    unittest.main()
