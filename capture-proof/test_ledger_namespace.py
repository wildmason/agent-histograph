"""
Locks the ledger-namespace decoupling contract.

histograph captures into its OWN directory (~/.agent-histograph), separate from
the agentlog-experiments ledger (~/.agentlog), with AGENTLOG_DIR as the override.
This is the behaviour that keeps the two projects independent *at rest*: if the
default ever regressed to ~/.agentlog the two would silently share files again
(two hook sets racing appends into one ledger) — exactly the coupling the split
was meant to eliminate.
"""
import importlib
import os
import unittest


def _reload_agentlog_common(agentlog_dir_env):
    """Reload agentlog_common with AGENTLOG_DIR set to `agentlog_dir_env`
    (or unset if None) and return the freshly-evaluated module. The module
    resolves its directory constants at import time, so a reload is the only
    way to exercise the default-vs-override branch."""
    prev = os.environ.get("AGENTLOG_DIR")
    try:
        if agentlog_dir_env is None:
            os.environ.pop("AGENTLOG_DIR", None)
        else:
            os.environ["AGENTLOG_DIR"] = agentlog_dir_env
        import agentlog_common
        return importlib.reload(agentlog_common)
    finally:
        if prev is None:
            os.environ.pop("AGENTLOG_DIR", None)
        else:
            os.environ["AGENTLOG_DIR"] = prev


def _posix(p):
    return p.replace("\\", "/")


class TestLedgerNamespace(unittest.TestCase):
    def tearDown(self):
        # Leave the module reflecting the real environment so sibling suites
        # that import agentlog_common see the true default.
        import agentlog_common
        importlib.reload(agentlog_common)

    def test_default_is_own_namespace(self):
        A = _reload_agentlog_common(None)
        self.assertTrue(
            _posix(A.AGENTLOG_DIR).endswith("/.agent-histograph"),
            f"default ledger dir should be ~/.agent-histograph, got {A.AGENTLOG_DIR}",
        )

    def test_default_is_not_the_experiments_ledger(self):
        A = _reload_agentlog_common(None)
        self.assertFalse(
            _posix(A.AGENTLOG_DIR).endswith("/.agentlog"),
            "histograph must not default to the agentlog-experiments ledger (~/.agentlog)",
        )

    def test_env_override_relocates_ledger_and_derived_paths(self):
        target = os.path.join(os.path.sep, "tmp", "ah-override-xyz")
        A = _reload_agentlog_common(target)
        self.assertEqual(A.AGENTLOG_DIR, target)
        # The derived file paths must track the overridden root, not a stale one.
        self.assertEqual(A.CHECKPOINTS, os.path.join(target, "checkpoints.jsonl"))
        self.assertEqual(A.ACTIVITY, os.path.join(target, "activity.jsonl"))
        self.assertEqual(A.STATE_DIR, os.path.join(target, "state"))


if __name__ == "__main__":
    unittest.main()
