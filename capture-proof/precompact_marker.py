#!/usr/bin/env python3
"""
PreCompact hook — boundary marker + suspected-gap tripwire.

PreCompact CANNOT inject instructions to the model (verified against the hook docs),
so it cannot itself ask for judgment. Its job is to (1) record that a compaction
boundary happened (a passive fact) and (2) if there has been material activity since
the last checkpoint with no checkpoint written, flag a suspected gap — exactly the
"context was about to be lost here and nothing captured it" case (§11).

Never blocks compaction. Fail-open. No stdout needed.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A

def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    sid = data.get("session_id") or "unknown"
    cwd = data.get("cwd") or ""
    tpath = data.get("transcript_path") or ""
    trigger = data.get("trigger") or data.get("hook_event_name") or "precompact"
    try:
        st = A.load_state(sid)
        uncaptured = A.transcript_size(tpath) > int(st.get("last_capture_size", 0))
        A.append_jsonl(A.ACTIVITY, {
            "type": "compaction_boundary", "session_id": sid, "cwd": cwd,
            "trigger": trigger, "armed": A.armed(),
            "uncaptured_activity_since_last_checkpoint": uncaptured,
            "ts": A.now_iso(),
        })
        # In quiet mode (armed), capture the pre-compaction decisions out-of-band BEFORE the
        # context is lost, and let the extractor decide the suspected-gap (so it isn't a false
        # positive when the capture succeeds). Otherwise (unarmed, or inline mode) the gap
        # tripwire is the only signal we have here — fire it directly.
        spawn_quiet = A.armed() and A.mode() != "inline"
        if spawn_quiet:
            here = os.path.dirname(os.path.abspath(__file__))
            A.spawn_detached([sys.executable, os.path.join(here, "capture_extract.py"),
                              "--session", sid, "--cwd", cwd, "--transcript", tpath,
                              "--trigger", "precompact"])
            A.log("precompact (armed, quiet): spawned out-of-band extractor for %s" % sid)
        elif uncaptured:
            A.append_jsonl(A.ACTIVITY, {
                "type": "suspected_gap", "signal": "compaction_without_checkpoint",
                "session_id": sid, "cwd": cwd, "ts": A.now_iso(),
                "note": "context compacted with material activity since the last checkpoint; "
                        "a decision may have been lost before it was recorded",
            })
        A.log("precompact boundary (trigger=%s) uncaptured=%s quiet=%s" % (trigger, uncaptured, spawn_quiet))
    except Exception as e:
        A.log("precompact hook error (fail-open): %r" % e)
    sys.exit(0)

if __name__ == "__main__":
    main()
