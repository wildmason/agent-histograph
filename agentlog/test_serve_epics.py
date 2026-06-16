#!/usr/bin/env python3
"""
TDD unit tests for serve_epics.py — the epics layer of `agentlog serve`.
Cases 11-13 of the frozen build plan:

  11. schema validate drops bad, keeps good (corrupt epics.json never 500s).
  12. add / link idempotent + --index insert + list derives done/total.
  13. confirm flips integrity reconstructed -> human-confirmed + persists atomically.

Every test points serve_epics at a tmp AGENTLOG_DIR (by patching the env-overridable
A.AGENTLOG_DIR that serve_epics consults at call time) and asserts derived/persisted
behaviour — never a literal echoing itself.

Run: python -m unittest test_serve_epics -v   (or: python -m pytest test_serve_epics.py -q)
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import agentlog_common as A
import serve_epics as E
import serve_state as S


def _cp(sid, ts, *, project="Mortar", leaf=None, decisions=None):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": "did work",
        "touched_paths": ["src/x.rs"], "verification": [], "decisions": decisions or [],
        "risks": [], "asks": [], "next_action": "", "health_draft": None,
        "checkpoint_id": "chk_%s" % sid, "session_id": sid, "host": "claude-code",
        "cwd": "C:\\repo\\%s\\%s" % (project, leaf or sid),
        "project": project, "captured_at": ts, "_valid": True, "_problems": [],
    }


def _act(sid, ts):
    return {"type": "stop_boundary", "session_id": sid, "cwd": "C:\\repo\\Mortar",
            "armed": True, "ts": ts}


class _TmpEnv(unittest.TestCase):
    """Base: redirect serve_epics' AGENTLOG_DIR to a fresh tmp dir for each test."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._saved = A.AGENTLOG_DIR
        A.AGENTLOG_DIR = self.tmp
        os.makedirs(os.path.join(self.tmp, "state"), exist_ok=True)

    def tearDown(self):
        A.AGENTLOG_DIR = self._saved

    def _epics_path(self):
        return os.path.join(self.tmp, "epics.json")

    def _write_raw(self, obj):
        with open(self._epics_path(), "w", encoding="utf-8") as f:
            json.dump(obj, f)

    def _ledger(self, cps, acts):
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            for c in cps:
                f.write(json.dumps(c) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "w", encoding="utf-8") as f:
            for a in acts:
                f.write(json.dumps(a) + "\n")
        return R.Ledger.from_dir(self.tmp)


# --------------------------------------------------------------------------- #
# Case 11 — schema validate drops bad, keeps good
# --------------------------------------------------------------------------- #
class TestValidate(_TmpEnv):
    def test_drops_invalid_epics_keeps_valid(self):
        raw = {"schema_version": "0.1", "epics": [
            {"id": "epic-good", "title": "Good", "project": "Mortar",
             "integrity": "reconstructed", "stories": ["st-a", "st-b"],
             "createdAt": "2026-06-10T10:00:00Z"},
            {"title": "no id -> dropped", "project": "X"},              # missing id
            {"id": "epic-badstories", "title": "bad stories type",
             "project": "Y", "stories": "not-a-list"},                  # stories not list
            "totally not a dict",                                       # not an object
            {"id": "epic-min", "title": "Minimal"},                     # minimal but valid
        ]}
        good = E.validate(raw)
        ids = [e["id"] for e in good]
        self.assertIn("epic-good", ids)
        self.assertIn("epic-min", ids)
        self.assertNotIn("epic-badstories", ids)
        self.assertEqual(len(good), 2)
        # defaults filled for the minimal one
        minimal = next(e for e in good if e["id"] == "epic-min")
        self.assertEqual(minimal["stories"], [])
        self.assertEqual(minimal["integrity"], "reconstructed")

    def test_corrupt_file_loads_as_empty_not_500(self):
        with open(self._epics_path(), "w", encoding="utf-8") as f:
            f.write("{ this is not json ][")
        store = E.load()
        self.assertEqual(E.list_epics(store, None), [])

    def test_missing_file_loads_as_empty(self):
        self.assertFalse(os.path.exists(self._epics_path()))
        store = E.load()
        self.assertEqual(store["epics"], [])


# --------------------------------------------------------------------------- #
# Case 12 — add / link idempotent + --index insert + list derives done/total
# --------------------------------------------------------------------------- #
class TestAddLinkList(_TmpEnv):
    def test_add_epic_slug_and_reconstructed_integrity(self):
        store = E.load()
        epic = E.add_epic(store, "Protocol parity with competitors", "Mortar")
        self.assertEqual(epic["integrity"], "reconstructed")
        self.assertEqual(epic["stories"], [])
        self.assertTrue(epic["id"].startswith("epic-"))
        self.assertIn("protocol-parity", epic["id"])
        # persisted
        E.save(store)
        reloaded = E.load()
        self.assertEqual(len(reloaded["epics"]), 1)

    def test_link_is_idempotent(self):
        store = E.load()
        epic = E.add_epic(store, "Parity", "Mortar")
        E.link_story(store, epic["id"], "st-ws")
        E.link_story(store, epic["id"], "st-ws")           # second link is a no-op
        again = next(e for e in store["epics"] if e["id"] == epic["id"])
        self.assertEqual(again["stories"].count("st-ws"), 1)

    def test_link_with_index_inserts_at_position(self):
        store = E.load()
        epic = E.add_epic(store, "Parity", "Mortar")
        E.link_story(store, epic["id"], "st-a")
        E.link_story(store, epic["id"], "st-b")
        E.link_story(store, epic["id"], "st-mid", index=1)   # insert between a and b
        e = next(x for x in store["epics"] if x["id"] == epic["id"])
        self.assertEqual(e["stories"], ["st-a", "st-mid", "st-b"])

    def test_list_derives_done_and_total_from_story_states(self):
        # two linked stories: one idle/done, one live/active -> done=1, total=2.
        cps = [
            _cp("done1", "2026-06-07T10:00:00-04:00", leaf="done1"),
            _cp("live1", "2026-06-10T10:00:00-04:00", leaf="live1"),
        ]
        acts = [_act("done1", "2026-06-07T10:00:00-04:00"),
                _act("live1", "2026-06-10T10:00:00-04:00")]
        led = self._ledger(cps, acts)
        st_done = S.story_id_for(led, "done1")
        st_live = S.story_id_for(led, "live1")
        store = E.load()
        epic = E.add_epic(store, "Parity", "Mortar")
        E.link_story(store, epic["id"], st_done)
        E.link_story(store, epic["id"], st_live)
        E.save(store)
        # list_epics derives done/total live from the ledger (NOT stored). Pin the
        # clock to the fixture window so live1 reads active (not idle->done).
        now = R.parse_ts("2026-06-10T10:05:00-04:00")
        rows = E.list_epics(E.load(), led, now_epoch=now)
        row = next(r for r in rows if r["id"] == epic["id"])
        self.assertEqual(row["total"], 2)
        self.assertEqual(row["done"], 1)
        self.assertLessEqual(row["done"], row["total"])
        # done/total are never persisted to disk
        with open(self._epics_path(), encoding="utf-8") as _f:
            on_disk = json.load(_f)
        self.assertNotIn("done", on_disk["epics"][0])
        self.assertNotIn("total", on_disk["epics"][0])

    def test_epic_for_story_reverse_lookup(self):
        store = E.load()
        epic = E.add_epic(store, "Parity", "Mortar")
        E.link_story(store, epic["id"], "st-ws")
        found = E.epic_for_story(store, "st-ws")
        self.assertIsNotNone(found)
        self.assertEqual(found["id"], epic["id"])
        self.assertIsNone(E.epic_for_story(store, "st-unlinked"))


# --------------------------------------------------------------------------- #
# Case 13 — confirm flips integrity + persists atomically
# --------------------------------------------------------------------------- #
class TestConfirm(_TmpEnv):
    def test_confirm_flips_integrity_and_persists(self):
        store = E.load()
        epic = E.add_epic(store, "Parity", "Mortar")
        self.assertEqual(epic["integrity"], "reconstructed")
        E.save(store)

        store2 = E.load()
        confirmed = E.confirm_epic(store2, epic["id"], new_title="Protocol parity (confirmed)")
        self.assertEqual(confirmed["integrity"], "human-confirmed")
        self.assertEqual(confirmed["title"], "Protocol parity (confirmed)")
        E.save(store2)

        # reload from disk: the flip persisted
        reloaded = E.load()
        e = next(x for x in reloaded["epics"] if x["id"] == epic["id"])
        self.assertEqual(e["integrity"], "human-confirmed")
        self.assertEqual(e["title"], "Protocol parity (confirmed)")

    def test_save_is_atomic_no_tmp_left_behind(self):
        store = E.load()
        E.add_epic(store, "Parity", "Mortar")
        E.save(store)
        # the atomic tmp+rename must not leave a stray tmp file beside epics.json
        leftovers = [n for n in os.listdir(self.tmp)
                     if n.startswith("epics.json") and n != "epics.json"]
        self.assertEqual(leftovers, [])

    def test_focus_roundtrip_persists(self):
        self.assertIsNone(E.load_focus())
        E.save_focus("term-123")
        self.assertEqual(E.load_focus(), "term-123")


if __name__ == "__main__":
    unittest.main()
