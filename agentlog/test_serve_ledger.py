#!/usr/bin/env python3
"""
TDD unit tests for serve_ledger.py — the runtime ledger-dir override + candidate
discovery that lets the board switch which ~/.agent* ledger it reads WITHOUT a
relaunch (the fix for "double-clicked the exe → read the empty default → nothing
rendered").

Invariants under test:
  - The override config lives at a FIXED, ledger-INDEPENDENT path (so it can't be
    circular and survives a ledger swap / restart). Here it is redirected via the
    HISTOGRAPH_CONFIG_DIR env var to a tmp dir.
  - resolved_dir() precedence: a valid in-app override > AGENTLOG_DIR (env/default).
    An override pointing at a NONEXISTENT dir is ignored (falls back), never blanks
    the board with a bad persisted choice.
  - dir_stats / candidates report real session counts so the picker can show
    "~/.agentlog · 44 sessions" vs an empty dir at a glance.

Run: python -m unittest test_serve_ledger -v
"""
import os, sys, json, tempfile, shutil, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import agentlog_common as A
import serve_ledger as L


def _cp(sid, ts, *, project="Demo"):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": "did work",
        "touched_paths": ["src/x.rs"], "verification": [], "decisions": [],
        "risks": [], "asks": [], "next_action": "", "health_draft": None,
        "checkpoint_id": "chk_%s" % sid, "session_id": sid, "host": "claude-code",
        "cwd": "C:\\repo\\%s\\%s" % (project, sid), "project": project,
        "captured_at": ts, "_valid": True, "_problems": [],
    }


def _act(sid, ts):
    return {"type": "tool_use", "session_id": sid, "cwd": "C:\\repo\\Demo",
            "tool": "Bash", "command": "echo hi", "ts": ts}


def _seed(path, sids, ts="2026-06-17T08:00:00-03:00"):
    """Create a ledger dir at `path` with one checkpoint + one tool_use per sid."""
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
        for s in sids:
            f.write(json.dumps(_cp(s, ts)) + "\n")
    with open(os.path.join(path, "activity.jsonl"), "w", encoding="utf-8") as f:
        for s in sids:
            f.write(json.dumps(_act(s, ts)) + "\n")


class _Base(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp()
        self.cfg = tempfile.mkdtemp()
        self._saved_dir = A.AGENTLOG_DIR
        self._saved_cfg = os.environ.get("HISTOGRAPH_CONFIG_DIR")
        self._saved_env = os.environ.get("AGENTLOG_DIR")
        os.environ["HISTOGRAPH_CONFIG_DIR"] = self.cfg
        os.environ.pop("AGENTLOG_DIR", None)
        # default ledger = an (empty) ~/.agent-histograph under the tmp home
        self.default_dir = os.path.join(self.home, ".agent-histograph")
        os.makedirs(self.default_dir, exist_ok=True)
        A.AGENTLOG_DIR = self.default_dir
        # a populated sibling, like the real ~/.agentlog
        self.full_dir = os.path.join(self.home, ".agentlog")
        _seed(self.full_dir, ["s1", "s2", "s3"])

    def tearDown(self):
        A.AGENTLOG_DIR = self._saved_dir
        if self._saved_cfg is None:
            os.environ.pop("HISTOGRAPH_CONFIG_DIR", None)
        else:
            os.environ["HISTOGRAPH_CONFIG_DIR"] = self._saved_cfg
        if self._saved_env is not None:
            os.environ["AGENTLOG_DIR"] = self._saved_env
        shutil.rmtree(self.home, ignore_errors=True)
        shutil.rmtree(self.cfg, ignore_errors=True)


class TestResolution(_Base):
    def test_no_override_resolves_to_configured_default(self):
        self.assertEqual(os.path.abspath(L.resolved_dir()), os.path.abspath(self.default_dir))
        self.assertEqual(L.active_source(), "default")

    def test_valid_override_wins_over_default(self):
        L.save_override(self.full_dir)
        self.assertEqual(os.path.abspath(L.resolved_dir()), os.path.abspath(self.full_dir))
        self.assertEqual(L.active_source(), "override")

    def test_override_at_nonexistent_dir_is_ignored(self):
        L.save_override(os.path.join(self.home, "does-not-exist"))
        # a stale/bad persisted choice must never blank the board — fall back.
        self.assertEqual(os.path.abspath(L.resolved_dir()), os.path.abspath(self.default_dir))
        self.assertEqual(L.active_source(), "default")

    def test_clear_override_returns_to_default(self):
        L.save_override(self.full_dir)
        L.clear_override()
        self.assertIsNone(L.load_override())
        self.assertEqual(os.path.abspath(L.resolved_dir()), os.path.abspath(self.default_dir))


class TestConfigIndependence(_Base):
    def test_config_path_is_under_config_dir_not_ledger_dir(self):
        L.save_override(self.full_dir)
        cfg_file = L.config_path()
        self.assertTrue(cfg_file.startswith(os.path.abspath(self.cfg)))
        # the override must NOT be written inside any ledger dir (that would be circular)
        self.assertFalse(os.path.exists(os.path.join(self.full_dir, "config.json")))
        self.assertFalse(os.path.exists(os.path.join(self.default_dir, "config.json")))

    def test_round_trip_persists_normalized_path(self):
        L.save_override(self.full_dir)
        self.assertEqual(os.path.abspath(L.load_override()), os.path.abspath(self.full_dir))


class TestDirStats(_Base):
    def test_populated_dir_reports_sessions_and_last_activity(self):
        st = L.dir_stats(self.full_dir)
        self.assertTrue(st["exists"])
        self.assertEqual(st["sessions"], 3)
        self.assertTrue(st["hasData"])
        self.assertIsNotNone(st["lastActivity"])
        self.assertTrue(st["lastActivity"].endswith("Z"))

    def test_empty_dir_reports_zero(self):
        st = L.dir_stats(self.default_dir)
        self.assertTrue(st["exists"])
        self.assertEqual(st["sessions"], 0)
        self.assertFalse(st["hasData"])

    def test_missing_dir_reports_not_exists(self):
        st = L.dir_stats(os.path.join(self.home, "nope"))
        self.assertFalse(st["exists"])
        self.assertEqual(st["sessions"], 0)
        self.assertFalse(st["hasData"])

    def test_passed_ledger_is_reused(self):
        led = R.Ledger.from_dir(self.full_dir)
        st = L.dir_stats(self.full_dir, ledger=led)
        self.assertEqual(st["sessions"], 3)


class TestCandidates(_Base):
    def test_discovers_default_and_populated_sibling(self):
        cands = L.candidates(home=self.home)
        dirs = {os.path.abspath(c["dir"]) for c in cands}
        self.assertIn(os.path.abspath(self.full_dir), dirs)
        self.assertIn(os.path.abspath(self.default_dir), dirs)
        full = next(c for c in cands if os.path.abspath(c["dir"]) == os.path.abspath(self.full_dir))
        self.assertEqual(full["sessions"], 3)

    def test_current_dir_is_flagged_and_sorts_first(self):
        L.save_override(self.full_dir)
        cands = L.candidates(home=self.home)
        self.assertEqual(os.path.abspath(cands[0]["dir"]), os.path.abspath(self.full_dir))
        self.assertTrue(cands[0]["isCurrent"])

    def test_dir_without_ledger_files_is_excluded(self):
        # a sibling dir with no ledger files must not pollute the picker
        noise = os.path.join(self.home, ".agents")
        os.makedirs(noise, exist_ok=True)
        cands = L.candidates(home=self.home)
        dirs = {os.path.abspath(c["dir"]) for c in cands}
        self.assertNotIn(os.path.abspath(noise), dirs)

    def test_info_envelope_shape(self):
        info = L.info(home=self.home)
        self.assertIn("current", info)
        self.assertIn("source", info)
        self.assertIn("default", info)
        self.assertIsInstance(info["candidates"], list)


class TestPrefs(_Base):
    def test_save_and_load_round_trip(self):
        L.save_prefs({"theme": "metro", "variant": "dark", "zoom": 1.25})
        p = L.load_prefs()
        self.assertEqual(p["theme"], "metro")
        self.assertEqual(p["variant"], "dark")
        self.assertEqual(p["zoom"], 1.25)

    def test_partial_merge_preserves_other_keys(self):
        # the whole point: a zoom-only change must not drop the saved theme
        L.save_prefs({"theme": "cinnabar", "variant": "light"})
        L.save_prefs({"zoom": 1.5})
        p = L.load_prefs()
        self.assertEqual(p["theme"], "cinnabar")
        self.assertEqual(p["variant"], "light")
        self.assertEqual(p["zoom"], 1.5)

    def test_prefs_and_ledger_override_coexist_in_one_config(self):
        L.save_override(self.full_dir)
        L.save_prefs({"theme": "editorial"})
        self.assertEqual(os.path.abspath(L.resolved_dir()), os.path.abspath(self.full_dir))
        self.assertEqual(L.load_prefs()["theme"], "editorial")

    def test_bad_types_and_unknown_keys_ignored(self):
        L.save_prefs({"theme": 123, "zoom": "big", "junk": "x", "variant": ""})
        self.assertEqual(L.load_prefs(), {})

    def test_zoom_bool_is_not_a_number(self):
        # True is an int subclass — must not slip through as a zoom factor
        L.save_prefs({"zoom": True})
        self.assertNotIn("zoom", L.load_prefs())


class TestDescribeActive(_Base):
    def test_describe_active_reflects_override_and_source(self):
        L.save_override(self.full_dir)
        d = L.describe_active()
        self.assertEqual(os.path.abspath(d["dir"]), os.path.abspath(self.full_dir))
        self.assertEqual(d["source"], "override")
        self.assertEqual(d["sessions"], 3)
        self.assertTrue(d["hasData"])

    def test_describe_active_empty_default(self):
        d = L.describe_active()
        self.assertEqual(os.path.abspath(d["dir"]), os.path.abspath(self.default_dir))
        self.assertFalse(d["hasData"])
        self.assertEqual(d["source"], "default")


if __name__ == "__main__":
    unittest.main(verbosity=2)
