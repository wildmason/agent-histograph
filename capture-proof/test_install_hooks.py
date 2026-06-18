#!/usr/bin/env python3
"""
Tests for install_hooks.py — the turnkey configurator an adopting user (or their
LLM) runs so "configure it" is one command with NO hand-edited paths. The load-
bearing properties: the installer RESOLVES the hook command paths from the repo's
own location + the running interpreter (so a fresh clone on any machine gets correct
absolute paths, never a leaked/hardcoded one), merges idempotently, preserves foreign
hooks, and supports both the Claude (`~/.claude/settings.json`) and Codex
(`~/.codex/hooks.json`) producers.

Run: python -m unittest test_install_hooks -v
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import install_hooks as IH


def _write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f)


def _read(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class _Base(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.td.name, "settings.json")

    def tearDown(self):
        self.td.cleanup()

    def _all_commands(self, data):
        out = []
        for groups in data.get("hooks", {}).values():
            for g in groups:
                for h in g.get("hooks", []):
                    out.append(h)
        return out


class TestClaudeInstall(_Base):
    def test_installs_repo_resolved_paths_no_hardcoded_user_path(self):
        IH.main(["--settings", self.path])
        data = _read(self.path)
        events = set(data["hooks"].keys())
        self.assertEqual(events, {"SessionStart", "Stop", "PreCompact", "SessionEnd", "PostToolUse"})
        cmds = [h["command"] for h in self._all_commands(data)]
        # every command points at THIS repo's capture-proof dir (resolved, not hardcoded)
        here = os.path.dirname(os.path.abspath(IH.__file__)).replace("\\", "/")
        self.assertTrue(all(here in c for c in cmds), "commands must resolve to this repo's dir")
        self.assertTrue(any("session_start.py" in c for c in cmds))
        # the installer points at THIS repo, never the stale private upstream — so a
        # @wildmason/control-plane path must never appear (it legitimately DOES contain
        # the local user's home path, since that's where this clone lives — that is the
        # turnkey property, not a leak).
        blob = json.dumps(data)
        for bad in ("@wildmason", "control-plane"):
            self.assertNotIn(bad, blob, "installer must not write %r" % bad)
        # Claude hooks do NOT carry commandWindows (that's the Codex shape)
        self.assertTrue(all("commandWindows" not in h for h in self._all_commands(data)))
        # PostToolUse matcher includes the observation tools
        pt = data["hooks"]["PostToolUse"][0]
        self.assertIn("Read", pt["matcher"])
        self.assertIn("Bash", pt["matcher"])

    def test_idempotent_and_preserves_foreign_hooks(self):
        _write(self.path, {"hooks": {"Stop": [
            {"hooks": [{"type": "command", "command": "python my-other-hook.py"}]}]}})
        IH.main(["--settings", self.path])
        IH.main(["--settings", self.path])  # reinstall
        data = _read(self.path)
        # the foreign Stop hook survives; ours is not duplicated
        stop_cmds = [h["command"] for g in data["hooks"]["Stop"] for h in g["hooks"]]
        self.assertIn("python my-other-hook.py", stop_cmds)
        self.assertEqual(sum("stop_capture.py" in c for c in stop_cmds), 1, "no duplicate on reinstall")

    def test_uninstall_removes_only_ours(self):
        _write(self.path, {"hooks": {"Stop": [
            {"hooks": [{"type": "command", "command": "python my-other-hook.py"}]}]}})
        IH.main(["--settings", self.path])
        IH.main(["--settings", self.path, "--uninstall"])
        data = _read(self.path)
        stop_cmds = [h["command"] for g in data.get("hooks", {}).get("Stop", []) for h in g["hooks"]]
        self.assertIn("python my-other-hook.py", stop_cmds)
        self.assertFalse(any("stop_capture.py" in c for c in stop_cmds))


class TestCodexInstall(_Base):
    def test_codex_install_shape_and_paths(self):
        IH.main(["--codex", "--settings", self.path])
        data = _read(self.path)
        events = set(data["hooks"].keys())
        self.assertEqual(events, {"SessionStart", "PreToolUse", "PostToolUse", "Stop", "PreCompact"})
        # Codex hooks carry BOTH command and commandWindows (its hook shape)
        for h in self._all_commands(data):
            self.assertIn("commandWindows", h)
            self.assertEqual(h["command"], h["commandWindows"])
            self.assertIn("codex_", h["command"])     # points at the codex_* producers
        # repo-resolved, not leaked
        blob = json.dumps(data)
        here = os.path.dirname(os.path.abspath(IH.__file__)).replace("\\", "/")
        self.assertIn(here, data["hooks"]["Stop"][0]["hooks"][0]["command"])
        self.assertNotIn("@wildmason", blob)  # never the stale private-upstream path
        # event-specific matchers preserved
        self.assertEqual(data["hooks"]["SessionStart"][0]["matcher"], "startup|resume|clear|compact")
        self.assertEqual(data["hooks"]["PreCompact"][0]["matcher"], "manual|auto")
        # Codex rejects helper keys — the file must be strict (no _comment anywhere)
        self.assertNotIn("_comment", blob)

    def test_codex_idempotent_and_uninstall(self):
        IH.main(["--codex", "--settings", self.path])
        IH.main(["--codex", "--settings", self.path])
        data = _read(self.path)
        stop_cmds = [h["command"] for g in data["hooks"]["Stop"] for h in g["hooks"]]
        self.assertEqual(sum("codex_stop_capture.py" in c for c in stop_cmds), 1)
        IH.main(["--codex", "--settings", self.path, "--uninstall"])
        self.assertEqual(_read(self.path).get("hooks", {}), {})


class TestTrackedTemplatesAreGeneric(unittest.TestCase):
    """The repo is public, so the tracked reference templates must carry NO personal
    home path or private-project (@wildmason) reference — those are both an info-leak
    and broken for any adopter. The turnkey path is install_hooks.py; these files are
    fallback references and must use placeholders only."""
    def _read(self, rel):
        p = os.path.join(os.path.dirname(os.path.abspath(IH.__file__)), rel)
        with open(p, "r", encoding="utf-8") as f:
            return f.read()

    def test_templates_have_no_personal_or_private_paths(self):
        for rel in ("settings-hooks.json", "codex-hooks.json"):
            text = self._read(rel)
            for bad in ("Users/Matt", "Users\\\\Matt", "@wildmason", "control-plane"):
                self.assertNotIn(bad, text, "%s leaks %r — genericize it" % (rel, bad))


if __name__ == "__main__":
    unittest.main()
