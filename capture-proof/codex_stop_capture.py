#!/usr/bin/env python3
"""Codex Stop hook: passive boundary log + quiet out-of-band capture."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    sid = C.hook_session_id(data) or "unknown"
    cwd = C.hook_cwd(data)
    tpath = C.hook_transcript_path(data, session_id=sid, cwd=cwd)

    try:
        C.append_activity({
            "type": "stop_boundary",
            "session_id": sid,
            "cwd": cwd,
            "armed": C.armed(),
            "ts": A.now_iso(),
        })

        if not C.armed():
            A.log("codex stop (unarmed): passive log only")
            sys.exit(0)

        st = A.load_state(C.state_id(sid))
        grew = C.transcript_size(tpath) > int(st.get("last_capture_size", 0))
        if A.should_capture("stop", grew, float(st.get("last_capture_at", 0) or 0),
                            A.now_epoch(), A.debounce_secs()):
            A.spawn_detached([
                sys.executable,
                os.path.join(HERE, "codex_capture_extract.py"),
                "--session", sid,
                "--cwd", cwd,
                "--transcript", tpath or "",
                "--trigger", "stop",
            ])
            A.log("codex stop (armed): spawned extractor for %s" % sid)
        else:
            A.log("codex stop (armed): debounced / no new activity")
    except Exception as e:
        A.log("codex stop hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
