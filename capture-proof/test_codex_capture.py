#!/usr/bin/env python3
"""Focused tests for the Codex producer."""
import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codex_capture_extract as CE
import codex_common as C


def _write_codex_session(path, sid="019e-test", cwd="C:\\repo\\Demo"):
    rows = [
        {"timestamp": "2026-06-09T10:00:00Z", "type": "session_meta",
         "payload": {"id": sid, "cwd": cwd, "base_instructions": {"text": "do not include"}}},
        {"timestamp": "2026-06-09T10:01:00Z", "type": "response_item",
         "payload": {"type": "message", "role": "developer", "content": [{"type": "text", "text": "skip me"}]}},
        {"timestamp": "2026-06-09T10:02:00Z", "type": "event_msg",
         "payload": {"type": "user_message", "message": "Please choose a cache format."}},
        {"timestamp": "2026-06-09T10:03:00Z", "type": "response_item",
         "payload": {"type": "function_call", "name": "shell_command",
                     "arguments": json.dumps({"command": "python -m unittest", "workdir": cwd}),
                     "call_id": "call1"}},
        {"timestamp": "2026-06-09T10:04:00Z", "type": "response_item",
         "payload": {"type": "function_call_output", "call_id": "call1",
                     "output": "raw tool output should be skipped"}},
        {"timestamp": "2026-06-09T10:05:00Z", "type": "event_msg",
         "payload": {"type": "agent_message",
                     "message": "Chose JSONL for this week to stay inside the gate envelope."}},
    ]
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")


class TestCodexTranscript(unittest.TestCase):
    def test_parser_uses_visible_messages_and_skips_raw_outputs(self):
        with tempfile.TemporaryDirectory() as td:
            p = os.path.join(td, "rollout-2026-06-09T10-00-00-019e-test.jsonl")
            _write_codex_session(p)
            msgs = C.read_codex_transcript(p)
            sid = C.session_id_from_transcript(p)
        text = "\n".join(m["text"] for m in msgs)
        self.assertIn("Please choose a cache format", text)
        self.assertIn("Chose JSONL", text)
        self.assertIn("TOOL CALL shell_command", text)
        self.assertNotIn("skip me", text)
        self.assertNotIn("raw tool output", text)
        self.assertEqual(sid, "019e-test")

    def test_file_marker_can_arm_codex_hooks(self):
        with tempfile.TemporaryDirectory() as td:
            old_dir, old_arm = C.A.AGENTLOG_DIR, C.ARM_FILE
            # isolate the env too: the test itself may run inside an ARMED session
            # (AGENTLOG_CAPTURE_ACTIVE=1 is set globally during the experiment), and
            # C.armed() also consults the env flags
            saved_env = {k: os.environ.pop(k, None)
                         for k in ("AGENTLOG_CAPTURE_ACTIVE", "AGENTLOG_CODEX_CAPTURE_ACTIVE")}
            C.A.AGENTLOG_DIR = td
            C.ARM_FILE = os.path.join(td, "codex.capture-active")
            try:
                self.assertFalse(C.armed())
                with open(C.ARM_FILE, "w", encoding="utf-8") as f:
                    f.write("1\n")
                self.assertTrue(C.armed())
            finally:
                C.A.AGENTLOG_DIR = old_dir
                C.ARM_FILE = old_arm
                for k, v in saved_env.items():
                    if v is not None:
                        os.environ[k] = v


class TestCodexStamp(unittest.TestCase):
    def test_stamps_codex_provenance(self):
        cp = {
            "summary": "Chose JSONL for the Codex producer.",
            "touched_paths": ["capture-proof/codex_common.py"],
            "decisions": [{"topic": "Codex producer storage", "choice": "per-host JSONL",
                           "rationale": "Avoid write contention.", "class": "local"}],
            "verification": [], "risks": [], "asks": [],
        }
        stamped, ok, problems = CE.stamp_checkpoint(cp, "019eabcdef", "C:\\repo\\control-plane", 2, "stop")
        self.assertEqual(stamped["checkpoint_id"], "chk_cx_019eabcd_002")
        self.assertEqual(stamped["host"], "codex")
        self.assertEqual(stamped["project"], "control-plane")
        self.assertEqual(stamped["capture_trigger"], "stop")
        self.assertTrue(ok)
        self.assertEqual(problems, [])


class TestCodexExecSafety(unittest.TestCase):
    def test_codex_exec_disables_hooks_and_armed_flag(self):
        seen = {}

        class _Done:
            returncode = 0
            stdout = "fallback"
            stderr = ""

        orig_run = subprocess.run
        orig_unlink = os.unlink

        def fake_run(*args, **kwargs):
            seen["argv"] = args[0]
            seen["env"] = kwargs.get("env")
            seen["creationflags"] = kwargs.get("creationflags", 0)
            return _Done()

        subprocess.run = fake_run
        os.unlink = lambda path: None
        had = os.environ.get("AGENTLOG_CAPTURE_ACTIVE")
        os.environ["AGENTLOG_CAPTURE_ACTIVE"] = "1"
        try:
            C.codex_exec("instruction", "context", cwd=os.getcwd(), timeout=5)
        finally:
            subprocess.run = orig_run
            os.unlink = orig_unlink
            if had is None:
                os.environ.pop("AGENTLOG_CAPTURE_ACTIVE", None)
            else:
                os.environ["AGENTLOG_CAPTURE_ACTIVE"] = had
        self.assertIn("--disable", seen["argv"])
        self.assertIn("hooks", seen["argv"])
        self.assertIn("--ephemeral", seen["argv"])
        self.assertEqual(seen["env"].get("AGENTLOG_DISABLE"), "1")
        self.assertNotIn("AGENTLOG_CAPTURE_ACTIVE", seen["env"])
        if os.name == "nt":
            self.assertTrue(seen["creationflags"] & 0x08000000)


if __name__ == "__main__":
    unittest.main(verbosity=2)
