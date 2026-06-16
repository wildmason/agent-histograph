#!/usr/bin/env python3
"""Out-of-band Codex checkpoint extractor."""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C
import replay_pilot as RP
from rubric import validate_checkpoint


def stamp_checkpoint(cp, sid, cwd, n, trigger):
    cp = A.redact_tree(cp)   # at-rest safety (§10): secrets never reach the ledger
    cp.setdefault("type", "checkpoint")
    cp.setdefault("schema_version", "0.1")
    ok, problems = validate_checkpoint(cp)
    cp.update({
        "checkpoint_id": "chk_cx_%s_%03d" % (str(sid)[:8], n),
        "session_id": sid,
        "host": C.HOST,
        "cwd": cwd,
        "project": os.path.basename(cwd.rstrip("/\\")) or cwd,
        "branch": A.git_branch(cwd),
        "captured_at": A.now_iso(),
        "capture_mode": "quiet",
        "capture_trigger": trigger,
        "integrity_class": "reconstructed_claim",
        "_valid": ok,
        "_problems": problems,
    })
    return cp, ok, problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session", required=True)
    ap.add_argument("--cwd", default="")
    ap.add_argument("--transcript", default="")
    ap.add_argument("--trigger", default="stop")
    args = ap.parse_args()

    if A.disabled() or not C.armed():
        sys.exit(0)

    sid = args.session
    cwd = args.cwd or os.getcwd()
    tpath = args.transcript or C.find_session_path(session_id=sid, cwd=cwd)
    trigger = args.trigger
    if not tpath:
        A.log("codex_capture_extract: no transcript path for session %s" % sid)
        sys.exit(0)

    # §8.1 guards (shared with the Claude extractor): breaker → daily cap →
    # per-session single-flight lock. Every skip/failure leaves a capture_result
    # record so pipeline-lost misses are distinguishable in the audit.
    lock_sid = C.state_id(sid)

    def result(outcome, checkpoint_id=None):
        rec = {"type": "capture_result", "session_id": sid, "trigger": trigger,
               "outcome": outcome, "ts": A.now_iso()}
        if checkpoint_id:
            rec["checkpoint_id"] = checkpoint_id
        C.append_activity(rec)

    if not A.breaker_allows():
        A.log("codex_capture_extract: failure breaker open; skipping capture")
        result("skipped_breaker")
        sys.exit(0)
    if not A.capture_cap_allows():
        A.log("codex_capture_extract: daily capture cap reached; skipping capture")
        result("skipped_cap")
        sys.exit(0)
    if not A.acquire_capture_lock(lock_sid):
        A.log("codex_capture_extract: another extractor holds the lock for %s; skipping" % sid)
        result("skipped_lock")
        sys.exit(0)

    try:
        C.append_activity({"type": "capture_attempt", "session_id": sid,
                           "trigger": trigger, "ts": A.now_iso()})
        st = A.load_state(C.state_id(sid))
        msgs = C.read_codex_transcript(tpath)
        start = int(st.get("last_capture_msg_count", 0))
        new = msgs[start:]
        if not new:
            A.log("codex_capture_extract: no new messages since last capture")
            result("no_judgment")
            sys.exit(0)

        A.increment_capture_count()
        rendered = RP.wrap_data(RP.render_msgs(new))
        out = C.codex_exec(RP.capture_instr(), rendered, cwd=cwd)
        if out is None:
            A.record_capture_failure()
            A.log("codex_capture_extract: codex exec failed (trigger=%s); breaker notified" % trigger)
            result("failed")
            sys.exit(0)
        A.reset_breaker()
        cp = RP.extract_json(out) or {}
        has_judgment = isinstance(cp, dict) and bool(
            (cp.get("decisions") or []) or (cp.get("verification") or []) or (cp.get("asks") or [])
        )

        if has_judgment:
            n = int(st.get("n_checkpoints", 0)) + 1
            cp, ok, problems = stamp_checkpoint(cp, sid, cwd, n, trigger)
            C.append_checkpoint(cp)
            A.log("codex_capture_extract: wrote %s valid=%s trigger=%s" %
                  (cp["checkpoint_id"], ok, trigger))
            st["n_checkpoints"] = n
            result("written", cp["checkpoint_id"])
        else:
            A.log("codex_capture_extract: no meaningful checkpoint from segment (trigger=%s)" % trigger)
            result("no_judgment")
            if trigger in ("precompact", "session_end"):
                C.append_activity({
                    "type": "suspected_gap",
                    "signal": "%s_without_checkpoint" % (
                        "compaction" if trigger == "precompact" else "session_end"),
                    "session_id": sid,
                    "cwd": cwd,
                    "ts": A.now_iso(),
                    "note": "Codex context boundary (%s) with material activity since the last "
                            "checkpoint; the quiet extractor produced no meaningful checkpoint "
                            "for the segment" % trigger,
                })

        st["last_capture_msg_count"] = len(msgs)
        st["last_capture_size"] = C.transcript_size(tpath)
        st["last_capture_at"] = A.now_epoch()
        st["phase"] = "idle"
        A.save_state(C.state_id(sid), st)
    except SystemExit:
        raise
    except Exception as e:
        A.log("codex_capture_extract error (fail-open): %r" % e)
        try:
            result("failed")
        except Exception:
            pass
    finally:
        A.release_capture_lock(lock_sid)
    sys.exit(0)


if __name__ == "__main__":
    main()
