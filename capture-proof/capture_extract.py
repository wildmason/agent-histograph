#!/usr/bin/env python3
"""
Out-of-band checkpoint extractor — the QUIET capture path (default mode).

Runs DETACHED from the Stop / PreCompact hook (spawned via A.spawn_detached) so the
capture is invisible in the TUI and adds zero turn-end latency: NO block, NO reprompt,
NO visible assistant turn. (This is the only documented way to hide capture — a Stop
hook's block `reason` and the reprompted reply are always user-visible, so the inline
mode cannot be hidden; see README.)

It reads the just-completed transcript, runs a headless `claude -p` over the messages
SINCE the last capture to produce the same structured checkpoint the inline reprompt
would have elicited (the §6.2.1 Part-2 content pilot validated this on fresh,
uncompacted material — which is exactly what a live boundary segment is), and appends
it to ~/.agent-histograph/checkpoints.jsonl. On a PreCompact trigger with no meaningful
checkpoint, it writes the suspected-gap tripwire itself (so the §11 backstop signal is
preserved without a false positive when a capture does succeed).

Usage (internal): capture_extract.py --session SID --cwd CWD --transcript PATH
                                     [--trigger stop|precompact|session_end]
Fail-open: any error → log + exit 0. Armed-only + kill-switch honored.
"""
import sys, os, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
from rubric import validate_checkpoint


def stamp_checkpoint(cp, sid, cwd, n, trigger):
    """Redact (at-rest safety, §10) + stamp provenance/validity onto an extracted
    checkpoint (pure). Returns (cp, ok, problems). Quiet captures are stamped
    integrity_class=reconstructed_claim: a separate model pass reconstructed this
    from the transcript — it is NOT the live agent volunteering judgment, and the
    §10 trust model must be able to tell the difference."""
    cp = A.redact_tree(cp)   # secrets must never reach the ledger at rest
    cp.setdefault("type", "checkpoint")
    cp.setdefault("schema_version", "0.1")
    ok, problems = validate_checkpoint(cp)   # validate the stamped checkpoint, not a typeless fragment
    cp.update({
        "checkpoint_id": "chk_cc_%s_%03d" % (str(sid)[:8], n),
        "session_id": sid, "host": "claude-code",
        "cwd": cwd, "project": os.path.basename(cwd.rstrip("/\\")) or cwd,
        "branch": A.git_branch(cwd),
        "captured_at": A.now_iso(),
        "capture_mode": "quiet", "capture_trigger": trigger,
        "integrity_class": "reconstructed_claim",
        "_valid": ok, "_problems": problems,
    })
    return cp, ok, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session", required=True)
    ap.add_argument("--cwd", default="")
    ap.add_argument("--transcript", default="")
    ap.add_argument("--trigger", default="stop")
    args = ap.parse_args()

    if A.disabled() or not A.armed():
        sys.exit(0)
    try:
        import replay_pilot as RP   # lazy: reuse claude -p + render + the capture instruction
    except Exception as e:
        A.log("capture_extract: cannot import replay_pilot (fail-open): %r" % e)
        sys.exit(0)

    sid, cwd, tpath, trigger = args.session, args.cwd, args.transcript, args.trigger

    # §8.1 guards, checked in cheap-first order. Each skip leaves a capture_result
    # record so the audit can tell a pipeline-lost miss from a reconstruction-lost one
    # (a dead/blocked extractor must be distinguishable from "no decision this turn").
    def result(outcome, checkpoint_id=None):
        rec = {"type": "capture_result", "session_id": sid, "trigger": trigger,
               "outcome": outcome, "ts": A.now_iso()}
        if checkpoint_id:
            rec["checkpoint_id"] = checkpoint_id
        A.append_jsonl(A.ACTIVITY, rec)

    if not A.breaker_allows():
        A.log("capture_extract: failure breaker open; skipping capture")
        result("skipped_breaker")
        sys.exit(0)
    if not A.capture_cap_allows():
        A.log("capture_extract: daily capture cap reached; skipping capture")
        result("skipped_cap")
        sys.exit(0)
    if not A.acquire_capture_lock(sid):
        # Another extractor (e.g. Stop-spawned vs PreCompact-spawned) holds this
        # session — racing it would double-extract the same segment.
        A.log("capture_extract: another extractor holds the lock for %s; skipping" % sid)
        result("skipped_lock")
        sys.exit(0)

    try:
        A.append_jsonl(A.ACTIVITY, {"type": "capture_attempt", "session_id": sid,
                                    "trigger": trigger, "ts": A.now_iso()})
        st = A.load_state(sid)
        msgs = A.read_transcript(tpath)
        start = int(st.get("last_capture_msg_count", 0))
        new = msgs[start:]
        if not new:
            A.log("capture_extract: no new messages since last capture; nothing to do")
            result("no_judgment")
            sys.exit(0)

        # Extract the checkpoint from the NEW segment via a headless model pass.
        # The segment is untrusted DATA (§10): wrapped + guarded so instruction-like
        # text inside the transcript cannot steer the reconstruction.
        A.increment_capture_count()
        full = RP.wrap_data(RP.render_msgs(new))
        out = RP.claude_p(RP.capture_instr(), full)
        if out is None:
            A.record_capture_failure()
            A.log("capture_extract: claude -p failed (trigger=%s); breaker notified" % trigger)
            result("failed")
            sys.exit(0)
        A.reset_breaker()
        cp = RP.extract_json(out)
        # Write-gate: JUDGMENT present (>=1 decision/verification/ask). We deliberately do
        # NOT require touched_paths here — unlike the live inline reprompt (which has the
        # agent's working context), an out-of-band model pass reconstructs the decision
        # reliably but often omits paths, and the decision is the payload the recall audit
        # cares about. An empty (summary-only) checkpoint is still skipped.
        has_judgment = isinstance(cp, dict) and bool(
            (cp.get("decisions") or []) or (cp.get("verification") or []) or (cp.get("asks") or []))

        if has_judgment:
            n = int(st.get("n_checkpoints", 0)) + 1
            cp, ok, problems = stamp_checkpoint(cp, sid, cwd, n, trigger)
            A.append_jsonl(A.CHECKPOINTS, cp)
            A.log("capture_extract: wrote %s valid=%s trigger=%s (quiet)" % (cp["checkpoint_id"], ok, trigger))
            st["n_checkpoints"] = n
            result("written", cp["checkpoint_id"])
        else:
            A.log("capture_extract: no meaningful checkpoint from segment (trigger=%s)" % trigger)
            result("no_judgment")
            # Preserve the §11 tripwire: a real context-loss boundary with material activity
            # but nothing captured is exactly the suspected-gap case. Fire on compaction AND
            # session end (both are "context about to be lost" moments — /clear, logout,
            # terminal exit) but not on routine Stops, to avoid per-turn alert fatigue.
            if trigger in ("precompact", "session_end"):
                A.append_jsonl(A.ACTIVITY, {
                    "type": "suspected_gap", "signal": "%s_without_checkpoint" % (
                        "compaction" if trigger == "precompact" else "session_end"),
                    "session_id": sid, "cwd": cwd, "ts": A.now_iso(),
                    "note": "context boundary (%s) with material activity since the last checkpoint; "
                            "the quiet extractor produced no meaningful checkpoint for the segment" % trigger,
                })

        # Advance state regardless so the same segment is never re-extracted.
        st["last_capture_msg_count"] = len(msgs)
        st["last_capture_size"] = A.transcript_size(tpath)
        st["last_capture_at"] = A.now_epoch()
        st["phase"] = "idle"
        A.save_state(sid, st)
    except SystemExit:
        raise
    except Exception as e:
        A.log("capture_extract error (fail-open): %r" % e)
        try:
            result("failed")
        except Exception:
            pass
    finally:
        A.release_capture_lock(sid)
    sys.exit(0)


if __name__ == "__main__":
    main()
