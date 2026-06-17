#!/usr/bin/env python3
"""Detached Codex TUI process watcher.

Codex currently has no proven SessionEnd hook equivalent in this setup. SessionStart
spawns this helper with the durable Codex TUI pid; the helper waits for that exact
process to exit, appends a terminal session_end record, and then exits itself.
"""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C

HERE = os.path.dirname(os.path.abspath(__file__))


def _wait_windows(pid, max_secs=0):
    try:
        import ctypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        SYNCHRONIZE = 0x00100000
        WAIT_OBJECT_0 = 0x00000000
        WAIT_TIMEOUT = 0x00000102
        handle = kernel32.OpenProcess(SYNCHRONIZE, False, int(pid))
        if not handle:
            return "not_found"
        try:
            deadline = time.time() + float(max_secs) if max_secs else None
            while True:
                wait_ms = 60000
                if deadline is not None:
                    remaining = deadline - time.time()
                    if remaining <= 0:
                        return "timeout"
                    wait_ms = max(1, min(wait_ms, int(remaining * 1000)))
                rc = kernel32.WaitForSingleObject(handle, wait_ms)
                if rc == WAIT_OBJECT_0:
                    return "exited"
                if rc != WAIT_TIMEOUT:
                    return "wait_error_%s" % rc
        finally:
            kernel32.CloseHandle(handle)
    except Exception as e:
        A.log("codex process watcher windows wait error: %r" % e)
        return "wait_error"


def wait_for_process_exit(pid, poll_secs=2.0, max_secs=0):
    if os.name == "nt":
        return _wait_windows(pid, max_secs=max_secs)
    deadline = time.time() + float(max_secs) if max_secs else None
    while C.process_is_alive(pid):
        if deadline is not None and time.time() >= deadline:
            return "timeout"
        time.sleep(max(0.05, float(poll_secs)))
    return "exited"


def maybe_spawn_session_end_capture(session_id, cwd, transcript_path):
    if not C.armed():
        return False
    try:
        tpath = transcript_path if transcript_path and os.path.exists(transcript_path) else ""
        if not tpath:
            tpath = C.find_session_path(session_id=session_id, cwd=cwd)
        st = A.load_state(C.state_id(session_id))
        grew = C.transcript_size(tpath) > int(st.get("last_capture_size", 0))
        if tpath and A.should_capture(
            "session_end",
            grew,
            float(st.get("last_capture_at", 0) or 0),
            A.now_epoch(),
            A.debounce_secs(),
        ):
            A.spawn_detached([
                sys.executable,
                os.path.join(HERE, "codex_capture_extract.py"),
                "--session",
                session_id,
                "--cwd",
                cwd or "",
                "--transcript",
                tpath,
                "--trigger",
                "session_end",
            ])
            A.log("codex process watcher: spawned session_end extractor for %s" % session_id)
            return True
        A.log("codex process watcher: no session_end capture needed for %s" % session_id)
    except Exception as e:
        A.log("codex process watcher capture check error (fail-open): %r" % e)
    return False


def append_process_exit(args, outcome):
    C.append_activity({
        "type": "session_end",
        "session_id": args.session or "unknown",
        "cwd": args.cwd or "",
        "source": "process_exit",
        "start_source": args.source or "",
        "armed": C.armed(),
        "pid": int(args.pid),
        "process_name": args.process_name or "",
        "watch_outcome": outcome,
        "ts": A.now_iso(),
    })


def main(argv=None):
    parser = argparse.ArgumentParser(description="Watch a Codex TUI process and close its session on exit.")
    parser.add_argument("--session", required=True)
    parser.add_argument("--pid", required=True, type=int)
    parser.add_argument("--cwd", default="")
    parser.add_argument("--source", default="")
    parser.add_argument("--process-name", default="")
    parser.add_argument("--transcript", default="")
    parser.add_argument("--poll-secs", type=float, default=float(os.environ.get("AGENTLOG_CODEX_WATCH_POLL_SECS", "2")))
    parser.add_argument("--max-secs", type=float, default=float(os.environ.get("AGENTLOG_CODEX_WATCH_MAX_SECS", "0") or "0"))
    args = parser.parse_args(argv)

    if A.disabled():
        return 0
    outcome = "unknown"
    try:
        outcome = wait_for_process_exit(args.pid, poll_secs=args.poll_secs, max_secs=args.max_secs)
        if outcome == "timeout":
            A.log("codex process watcher timed out session=%s pid=%s" % (args.session, args.pid))
            return 0
        append_process_exit(args, outcome)
        maybe_spawn_session_end_capture(args.session, args.cwd, args.transcript)
        A.log("codex process watcher ended session=%s pid=%s outcome=%s" % (args.session, args.pid, outcome))
        return 0
    except Exception as e:
        A.log("codex process watcher error (fail-open): %r" % e)
        return 0
    finally:
        C.release_process_watcher_marker(args.session, args.pid)


if __name__ == "__main__":
    raise SystemExit(main())
