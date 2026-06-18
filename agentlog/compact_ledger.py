#!/usr/bin/env python3
"""
compact_ledger — a LOSSLESS de-duplicator for histograph ledger dirs.

The 2026-06-17 duplicate-watcher incident replayed the same Gemini transcript over
and over, appending byte-identical records until ~/.agent-histograph held ~158MB of
99.9%-duplicate residue (140k+ checkpoint lines, a couple hundred distinct). A bare
exe double-click reads that default dir and pays multi-second-per-poll parse costs.

This tool rewrites each top-level `*.jsonl` in a dir keeping only the FIRST occurrence
of every DISTINCT record (keyed on normalized JSON, so key-order/whitespace noise is
ignored) in original order. Non-JSON lines are kept and deduped by raw text. It is:

  • lossless  — only byte-equivalent records are dropped; every distinct record stays;
  • safe      — DRY-RUN by default; `--apply` backs each file up under <dir>/.backup-<ts>/
                before writing the compacted version atomically (tmp + os.replace);
  • idempotent — running it on clean data is a no-op.

The `.backup-*` subdir is invisible to the ledger reader (it globs <dir>/*.jsonl at the
top level only), so the cleanup can never double-count itself.

Usage:
  python compact_ledger.py <dir>            # dry run — report only
  python compact_ledger.py <dir> --apply    # back up + compact in place
"""
import argparse
import glob
import json
import os
import sys
import tempfile
import time


def _norm_key(line):
    """A dedup key that ignores JSON key-order / whitespace: parse + re-serialize with
    sorted keys. A line that isn't JSON keys on its raw (stripped) text."""
    try:
        return "j:" + json.dumps(json.loads(line), sort_keys=True, ensure_ascii=False)
    except Exception:
        return "r:" + line


def compact_records(lines):
    """(kept_lines, n_dropped). Keeps the first occurrence of each distinct record in
    order; drops byte-equivalent repeats. Pure — no I/O."""
    seen = set()
    kept = []
    dropped = 0
    for line in lines:
        line = line.rstrip("\n")
        if not line.strip():
            continue
        k = _norm_key(line)
        if k in seen:
            dropped += 1
            continue
        seen.add(k)
        kept.append(line)
    return kept, dropped


def _ledger_files(d):
    """Top-level checkpoints*/activity*.jsonl in `d`, sorted. Mirrors what the reader
    unions, so we compact exactly the files the board reads — and nothing in subdirs."""
    out = []
    for pat in ("checkpoints*.jsonl", "activity*.jsonl"):
        out.extend(sorted(glob.glob(os.path.join(d, pat))))
    return out


def compact_dir(d, *, apply=False):
    """Compact every ledger file in `d`. Returns {filename: {before, after, dropped}}.
    With apply=True, backs each file up under <dir>/.backup-<ts>/ then rewrites it
    atomically; with apply=False (default) reports only and touches nothing."""
    report = {}
    files = _ledger_files(d)
    backup_dir = None
    for path in files:
        name = os.path.basename(path)
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
        except OSError:
            continue
        kept, dropped = compact_records(lines)
        report[name] = {"before": len([l for l in lines if l.strip()]),
                        "after": len(kept), "dropped": dropped}
        if not apply or dropped == 0:
            continue
        # back up the original before the first rewrite (one backup dir per run)
        if backup_dir is None:
            backup_dir = os.path.join(d, ".backup-%s" % time.strftime("%Y%m%d%H%M%S"))
            os.makedirs(backup_dir, exist_ok=True)
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as src, \
                 open(os.path.join(backup_dir, name), "w", encoding="utf-8") as dst:
                dst.write(src.read())
        except OSError as e:
            report[name]["error"] = "backup failed: %r — skipped" % e
            continue
        # atomic rewrite: tmp in the same dir + os.replace
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".compact.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as out:
                out.write("\n".join(kept) + ("\n" if kept else ""))
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except OSError:
                    pass
    if backup_dir:
        report["_backup"] = backup_dir
    return report


def main(argv=None):
    ap = argparse.ArgumentParser(description="Losslessly de-duplicate a histograph ledger dir.")
    ap.add_argument("dir", help="the ledger directory to compact")
    ap.add_argument("--apply", action="store_true",
                    help="back up + rewrite in place (default: dry-run report only)")
    args = ap.parse_args(argv)

    d = os.path.abspath(os.path.expanduser(args.dir))
    if not os.path.isdir(d):
        print("not a directory: %s" % d, file=sys.stderr)
        return 2

    report = compact_dir(d, apply=args.apply)
    mode = "APPLIED" if args.apply else "DRY-RUN (use --apply to write)"
    print("compact_ledger %s -- %s" % (mode, d))
    total_before = total_after = 0
    for name in sorted(k for k in report if not k.startswith("_")):
        r = report[name]
        total_before += r["before"]
        total_after += r["after"]
        note = ("  [%s]" % r["error"]) if r.get("error") else ""
        print("  %-28s %8d -> %-8d  (-%d)%s"
              % (name, r["before"], r["after"], r["dropped"], note))
    saved = total_before - total_after
    pct = (100.0 * saved / total_before) if total_before else 0.0
    print("  %-28s %8d -> %-8d  (-%d, %.1f%%)"
          % ("TOTAL", total_before, total_after, saved, pct))
    if report.get("_backup"):
        print("  backup: %s" % report["_backup"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
