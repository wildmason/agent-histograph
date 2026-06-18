#!/usr/bin/env python3
"""
bench_state — a repeatable microbenchmark for the /api/state hot path.

Generates a synthetic ledger that resembles Matt's live board (configurable
session/record counts, a mix of claude/codex/gemini providers, checkpoints +
tool_use/stop_boundary/intent/next activity) into a tmp dir, then times the two
halves of the poll path separately:

    read+sort  -> R.Ledger.from_dir(dir)        (glob + json.loads + sort)
    derive     -> S.build_state(led, epics, ...) (the per-session scans)

It also exercises a cold-vs-warm split: the FIRST Ledger build pays the parse,
subsequent build_state calls on the SAME Ledger object measure pure derive (what
the V1 cache preserves — re-derive on a cached parse).

Run:  python bench_state.py [--sessions N] [--records-per-session M] [--iters K]

This is a dev tool, not a test. It prints a table; it asserts nothing. Used to
validate the V1–V5 backend perf vectors against measured before/after numbers.
"""
import argparse
import json
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R
import serve_state as S

_PROVIDERS = ["claude-code", "claude-code", "claude-code", "codex", "gemini"]


def _gen_ledger(d, n_sessions, recs_per_session):
    """Write a synthetic checkpoints.jsonl + activity.jsonl into dir `d`. Sessions
    are spread across the last ~20h so most land inside LIVE_WINDOW_SECS; each gets a
    handful of checkpoints and a tool_use/stop_boundary/intent stream."""
    base = 1_750_000_000  # a fixed epoch (no Date.now in scripts; deterministic here)
    checkpoints, activity = [], []
    for si in range(n_sessions):
        sid = "sess-%04d" % si
        host = _PROVIDERS[si % len(_PROVIDERS)]
        proj = "Proj%02d" % (si % 12)
        cwd = "C:\\repo\\%s" % proj
        # spread session starts over the last ~20h (older sessions age past liveness)
        s_start = base - (si * 1200)
        n_cp = max(1, recs_per_session // 12)
        n_act = recs_per_session - n_cp
        for ci in range(n_cp):
            ts = s_start + ci * 60
            iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(ts))
            checkpoints.append({
                "type": "checkpoint", "schema_version": "0.1",
                "summary": "did work %d" % ci, "touched_paths": ["src/x%d.rs" % ci],
                "verification": [], "decisions": (
                    [{"topic": "t%d" % ci, "choice": "c%d" % ci, "rationale": "because",
                      "class": "local", "materiality": "record", "human_involved": False}]
                    if ci % 3 == 0 else []),
                "risks": [], "asks": (
                    [{"question": "approve?", "blocking": True}] if ci == n_cp - 1 and si % 17 == 0 else []),
                "next_action": "keep going", "health_draft": None,
                "checkpoint_id": "chk_%s_%d" % (sid, ci), "session_id": sid,
                "host": host, "cwd": cwd, "project": proj,
                "captured_at": iso, "_valid": True, "_problems": [],
            })
        for ai in range(n_act):
            ts = s_start + ai * 10
            iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(ts))
            kind = ("tool_use", "stop_boundary", "intent", "tool_use")[ai % 4]
            rec = {"type": kind, "session_id": sid, "cwd": cwd, "ts": iso, "host": host}
            if kind == "tool_use":
                rec.update({"tool": "Edit", "paths": ["src/x%d.rs" % ai],
                            "desc": "editing file %d" % ai})
            elif kind == "intent":
                rec.update({"title": "do thing %d" % ai, "why": "reason %d" % ai})
            activity.append(rec)
    with open(os.path.join(d, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
        for c in checkpoints:
            f.write(json.dumps(c) + "\n")
    with open(os.path.join(d, "activity.jsonl"), "w", encoding="utf-8") as f:
        for a in activity:
            f.write(json.dumps(a) + "\n")
    return len(checkpoints) + len(activity)


def _time(fn, iters):
    """Return (mean_ms, result_of_last_call)."""
    t0 = time.perf_counter()
    res = None
    for _ in range(iters):
        res = fn()
    dt = (time.perf_counter() - t0) / iters
    return dt * 1000.0, res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions", type=int, default=56)
    ap.add_argument("--records-per-session", type=int, default=140)
    ap.add_argument("--iters", type=int, default=10)
    args = ap.parse_args()

    d = tempfile.mkdtemp(prefix="bench-ledger-")
    total = _gen_ledger(d, args.sessions, args.records_per_session)
    now = 1_750_000_100  # just after the freshest record

    # cold read+sort (a fresh Ledger each iter — the per-poll cost without a cache)
    read_ms, led = _time(lambda: R.Ledger.from_dir(d), args.iters)
    # warm derive (re-derive build_state on an ALREADY-PARSED Ledger — what V1 keeps)
    derive_ms, state = _time(
        lambda: S.build_state(led, [], now_epoch=now), args.iters)
    # full poll (fresh Ledger + derive each iter — today's actual per-poll cost)
    full_ms, _ = _time(
        lambda: S.build_state(R.Ledger.from_dir(d), [], now_epoch=now), args.iters)

    payload = json.dumps(state, ensure_ascii=False).encode("utf-8")
    print("ledger: %d sessions, %d records, %d live terminals"
          % (args.sessions, total, len(state["terminals"])))
    print("payload bytes: %d" % len(payload))
    print("-" * 52)
    print("read+sort (cold) : %8.2f ms" % read_ms)
    print("derive    (warm) : %8.2f ms" % derive_ms)
    print("full poll        : %8.2f ms   (fresh parse + derive)" % full_ms)


if __name__ == "__main__":
    main()
