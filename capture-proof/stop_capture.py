#!/usr/bin/env python3
"""
Stop hook — the capture path.

Two modes (env AGENTLOG_CAPTURE_MODE, default 'quiet'):

  QUIET (default): on an armed Stop with new activity (debounced), spawn a DETACHED
  out-of-band extractor (capture_extract.py) and exit immediately with no stdout. No
  block, no reprompt, no visible assistant turn — the capture is invisible in the TUI
  and adds zero turn-end latency. This is the only documented way to hide capture: a
  Stop hook's block `reason` and the reprompted reply are always user-visible.

  INLINE (AGENTLOG_CAPTURE_MODE=inline): the original §6.2.1-validated path — block
  once, inject the capture prompt, then on the next Stop read + store the agent's
  emitted checkpoint. Visible in the TUI; kept for the proof artifact and comparison.

Both are armed-only (AGENTLOG_CAPTURE_ACTIVE=1), kill-switched (AGENTLOG_DISABLE=1),
fail-open, and always passively log the Stop boundary.
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import posttooluse as PT
from rubric import load_capture_prompt, validate_checkpoint

HERE = os.path.dirname(os.path.abspath(__file__))


def allow_stop():
    # no stdout => Claude stops normally
    sys.exit(0)


def block_with(reason):
    sys.stdout.write(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def quiet_capture(sid, cwd, tpath, st):
    """Spawn the detached out-of-band extractor when warranted; never block."""
    grew = A.transcript_size(tpath) > int(st.get("last_capture_size", 0))
    if A.should_capture("stop", grew, float(st.get("last_capture_at", 0) or 0),
                         A.now_epoch(), A.debounce_secs()):
        A.spawn_detached([sys.executable, os.path.join(HERE, "capture_extract.py"),
                          "--session", sid, "--cwd", cwd, "--transcript", tpath, "--trigger", "stop"])
        A.log("stop (armed, quiet): spawned out-of-band extractor for %s" % sid)
    else:
        A.log("stop (armed, quiet): debounced / no new activity; no capture")
    allow_stop()


def inline_capture(sid, cwd, tpath, stop_active, st):
    """The §6.2.1-validated block-once-and-reprompt path (visible in the TUI)."""
    # finalize branch: we previously asked for a checkpoint
    if st.get("phase") == "awaiting" or stop_active:
        msgs = A.read_transcript(tpath)
        cp = A.extract_checkpoint(A.last_assistant_text(msgs))
        ok, problems = (validate_checkpoint(cp) if cp is not None else (False, ["no json block found"]))
        if cp is not None:
            n = int(st.get("n_checkpoints", 0)) + 1
            cp = A.redact_tree(cp)   # at-rest safety (§10): secrets never reach the ledger
            cp.setdefault("type", "checkpoint")
            cp.setdefault("schema_version", "0.1")
            cp.update({
                "checkpoint_id": "chk_cc_%s_%03d" % (str(sid)[:8], n),
                "session_id": sid, "host": "claude-code",
                "cwd": cwd, "project": os.path.basename(cwd.rstrip("/\\")) or cwd,
                "branch": A.git_branch(cwd),
                "captured_at": A.now_iso(),
                "capture_mode": "inline", "capture_trigger": "stop",
                # inline IS the live agent volunteering its own checkpoint (§10)
                "integrity_class": "volunteered_claim",
                "_valid": ok, "_problems": problems,
            })
            A.append_jsonl(A.CHECKPOINTS, cp)
            A.log("captured checkpoint %s valid=%s problems=%s (inline)" % (cp["checkpoint_id"], ok, problems))
            st["n_checkpoints"] = n
        else:
            A.log("awaiting-finalize: no checkpoint json in agent reply; allowing stop (fail-open)")
        st["phase"] = "idle"
        st["last_capture_size"] = A.transcript_size(tpath)
        # keep the quiet extractor's segment cursor in sync, so switching capture
        # modes mid-experiment can neither re-extract nor skip a segment
        st["last_capture_msg_count"] = len(msgs)
        A.save_state(sid, st)
        allow_stop()

    grew = A.transcript_size(tpath) > int(st.get("last_capture_size", 0))
    if not grew:
        A.log("stop (armed, inline): no new activity since last checkpoint; allowing stop")
        allow_stop()

    st["phase"] = "awaiting"
    A.save_state(sid, st)
    A.log("stop (armed, inline): injecting capture prompt for session %s" % sid)
    block_with("[agentlog capture] " + load_capture_prompt())


def main():
    data = A.read_stdin_json()
    if A.disabled():
        allow_stop()
    sid = data.get("session_id") or "unknown"
    cwd = data.get("cwd") or ""
    tpath = data.get("transcript_path") or ""
    stop_active = bool(data.get("stop_hook_active"))
    st = A.load_state(sid)

    # passive fact: a Stop boundary occurred (logged in every mode, armed or not)
    A.append_jsonl(A.ACTIVITY, {"type": "stop_boundary", "session_id": sid,
                                "cwd": cwd, "armed": A.armed(), "ts": A.now_iso()})

    try:
        if not A.armed():
            A.log("stop (unarmed): passive log only, no capture")
            allow_stop()
        # Backstop the declared-intent scrape at the turn boundary. PostToolUse captures an
        # intent on the NEXT tool call after the declaring message persists — but a turn's
        # FINAL message has no following tool call. At Stop that message IS in the transcript,
        # so a dedup-guarded scrape here guarantees a declared "why" is never lost. Cheap
        # (a bounded tail read, no model call); fail-open so it can't disrupt the capture path.
        try:
            PT.maybe_capture_intent(data)
        except Exception as e:
            A.log("stop intent backstop error (fail-open): %r" % e)
        if A.mode() == "inline":
            inline_capture(sid, cwd, tpath, stop_active, st)
        else:
            quiet_capture(sid, cwd, tpath, st)
    except SystemExit:
        raise
    except Exception as e:
        A.log("stop hook error (fail-open): %r" % e)
        allow_stop()


if __name__ == "__main__":
    main()
