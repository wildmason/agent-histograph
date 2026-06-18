#!/usr/bin/env python3
"""
TDD tests for compact_ledger.py — the lossless ledger de-duplicator used to clean the
158MB of duplicate-watcher replay residue out of ~/.agent-histograph (V7).

The dedup must be LOSSLESS: it drops only byte-equivalent records (same normalized
JSON) and keeps the FIRST occurrence of every distinct record, in order. A line that
doesn't parse as JSON is kept (deduped by its raw text). Compaction is idempotent —
running it on already-clean data changes nothing.

Run: python -m unittest test_compact_ledger -v
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import compact_ledger as C


class TestCompactRecords(unittest.TestCase):
    def test_drops_exact_duplicates_keeps_first_in_order(self):
        a = json.dumps({"type": "checkpoint", "checkpoint_id": "c1", "ts": "t1"})
        b = json.dumps({"type": "checkpoint", "checkpoint_id": "c2", "ts": "t2"})
        lines = [a, b, a, a, b]                       # a×3, b×2 -> a,b unique
        kept, dropped = C.compact_records(lines)
        self.assertEqual(kept, [a, b])               # first occurrences, original order
        self.assertEqual(dropped, 3)

    def test_key_is_normalized_not_textual(self):
        # same record, different key order / whitespace -> ONE unique record.
        x1 = '{"a": 1, "b": 2}'
        x2 = '{"b": 2, "a": 1}'                       # reordered keys
        x3 = '{"a":1,"b":2}'                          # no spaces
        kept, dropped = C.compact_records([x1, x2, x3])
        self.assertEqual(len(kept), 1)
        self.assertEqual(dropped, 2)

    def test_distinct_records_all_survive(self):
        lines = [json.dumps({"i": i}) for i in range(50)]
        kept, dropped = C.compact_records(lines + lines)   # double them
        self.assertEqual(len(kept), 50)
        self.assertEqual(dropped, 50)

    def test_non_json_lines_kept_and_deduped_by_text(self):
        lines = ["not json", "not json", "also not", json.dumps({"ok": 1})]
        kept, dropped = C.compact_records(lines)
        self.assertEqual(kept, ["not json", "also not", json.dumps({"ok": 1})])
        self.assertEqual(dropped, 1)

    def test_idempotent_on_clean_data(self):
        lines = [json.dumps({"i": i}) for i in range(10)]
        once, _ = C.compact_records(lines)
        twice, dropped = C.compact_records(once)
        self.assertEqual(once, twice)
        self.assertEqual(dropped, 0)


class TestCompactDir(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def _write(self, name, records):
        with open(os.path.join(self.tmp, name), "w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r) + "\n")

    def test_dry_run_reports_without_writing(self):
        dup = {"type": "checkpoint", "checkpoint_id": "c1"}
        self._write("checkpoints.jsonl", [dup, dup, dup])
        report = C.compact_dir(self.tmp, apply=False)
        # nothing written, no backup made
        self.assertEqual(report["checkpoints.jsonl"]["before"], 3)
        self.assertEqual(report["checkpoints.jsonl"]["after"], 1)
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), encoding="utf-8") as f:
            self.assertEqual(sum(1 for _ in f), 3)           # untouched
        self.assertEqual([d for d in os.listdir(self.tmp) if d.startswith(".backup")], [])

    def test_apply_compacts_in_place_and_backs_up(self):
        dup = {"type": "checkpoint", "checkpoint_id": "c1"}
        uniq = {"type": "checkpoint", "checkpoint_id": "c2"}
        self._write("checkpoints.jsonl", [dup, dup, uniq, dup])
        self._write("activity.jsonl", [{"type": "tool_use", "ts": "t"}])  # already clean
        report = C.compact_dir(self.tmp, apply=True)

        # compacted file holds only the 2 distinct checkpoints, in order
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), encoding="utf-8") as f:
            rows = [json.loads(l) for l in f if l.strip()]
        self.assertEqual([r["checkpoint_id"] for r in rows], ["c1", "c2"])

        # a backup dir was created holding the ORIGINAL (4-line) file
        backups = [d for d in os.listdir(self.tmp) if d.startswith(".backup")]
        self.assertEqual(len(backups), 1)
        with open(os.path.join(self.tmp, backups[0], "checkpoints.jsonl"), encoding="utf-8") as f:
            self.assertEqual(sum(1 for _ in f), 4)           # original preserved

        # the already-clean file is reported as unchanged (after == before)
        self.assertEqual(report["activity.jsonl"]["before"],
                         report["activity.jsonl"]["after"])

    def test_backup_subdir_is_invisible_to_the_ledger_reader(self):
        # the reader globs <dir>/*.jsonl at the top level only; a .backup-* SUBDIR must
        # not be picked up as ledger data. Guard the cleanup can't double-count itself.
        self._write("checkpoints.jsonl", [{"checkpoint_id": "c1"}, {"checkpoint_id": "c1"}])
        C.compact_dir(self.tmp, apply=True)
        import agentlog_read as R
        led = R.Ledger.from_dir(self.tmp)
        self.assertEqual(len(led.checkpoints), 1)            # only the compacted record


if __name__ == "__main__":
    unittest.main()
