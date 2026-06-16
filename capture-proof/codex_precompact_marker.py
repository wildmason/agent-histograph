#!/usr/bin/env python3
"""Codex PreCompact hook: boundary marker + quiet pre-compaction capture."""
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
    trigger = data.get("trigger") or data.get("hook_event_name") or data.get("hookEventName") or "precompact"

    try:
        st = A.load_state(C.state_id(sid))
        uncaptured = C.transcript_size(tpath) > int(st.get("last_capture_size", 0))
        C.append_activity({
            "type": "compaction_boundary",
            "session_id": sid,
            "cwd": cwd,
            "trigger": trigger,
            "armed": C.armed(),
            "uncaptured_activity_since_last_checkpoint": uncaptured,
            "ts": A.now_iso(),
        })
        if C.armed() and A.mode() != "inline":
            A.spawn_detached([
                sys.executable,
                os.path.join(HERE, "codex_capture_extract.py"),
                "--session", sid,
                "--cwd", cwd,
                "--transcript", tpath or "",
                "--trigger", "precompact",
            ])
            A.log("codex precompact (armed): spawned extractor for %s" % sid)
        elif uncaptured:
            C.append_activity({
                "type": "suspected_gap",
                "signal": "compaction_without_checkpoint",
                "session_id": sid,
                "cwd": cwd,
                "ts": A.now_iso(),
                "note": "Codex context compacted with material activity since the last checkpoint; "
                        "a decision may have been lost before it was recorded",
            })
        A.log("codex precompact boundary trigger=%s uncaptured=%s" % (trigger, uncaptured))
    except Exception as e:
        A.log("codex precompact hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
