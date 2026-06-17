#!/usr/bin/env python3
"""Codex SessionStart hook: register session and inject the checkpoint contract."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C

CONTRACT = (
    "This Codex session is observed by agentlog. At stopping points and context "
    "boundaries, agentlog quietly reconstructs a JSON checkpoint of your non-trivial "
    "decisions from the transcript (out-of-band; you will not normally be prompted). "
    "Make the material decisions you take legible in your replies — the choice, the "
    "alternatives, and the why — especially anything touching billing, licensing, auth, "
    "migrations, public APIs, dependencies, or data-loss risk, so the reconstruction is "
    "faithful. Do NOT print a JSON checkpoint block in your replies yourself — capture "
    "is external and automatic. This observation never changes how you do the work."
)


def main():
    if A.disabled():
        sys.exit(0)
    data = A.read_stdin_json()
    sid = C.hook_session_id(data) or "unknown"
    cwd = C.hook_cwd(data)
    tpath = C.hook_transcript_path(data, session_id=sid, cwd=cwd)
    source = data.get("source") or data.get("hook_event_name") or data.get("hookEventName") or "startup"
    try:
        watcher = C.start_process_watcher(sid, cwd=cwd, source=source, transcript_path=tpath or "")
        C.append_activity({
            "type": "session_start",
            "session_id": sid,
            "cwd": cwd,
            "branch": A.git_branch(cwd),
            "source": source,
            "armed": C.armed(),
            "process_watcher": watcher,
            "ts": A.now_iso(),
        })
        A.log("codex session_start source=%s armed=%s" % (source, C.armed()))
        if C.armed():
            sys.stdout.write(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": CONTRACT,
                }
            }))
    except Exception as e:
        A.log("codex session_start hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
