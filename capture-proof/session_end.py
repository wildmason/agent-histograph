#!/usr/bin/env python3
"""
SessionEnd hook — the session-tail capture path.

Closes a structural recall hole: a Stop inside the debounce window was skipped, and
if the session then ENDED (terminal exit, /clear, logout) no later Stop ever fired —
so the wrap-up segment (typically the decision-densest turn) was silently lost. The
same applies to /clear, which is a context-loss boundary exactly like compaction but
had no PreCompact equivalent.

SessionEnd fires with source in {clear, logout, prompt_input_exit, other} and cannot
block anything (verified against the hook docs). transcript_path is NOT a documented
SessionEnd field, so we use it when present and otherwise derive it from the session
id (fail-open: no transcript found → passive log only).

Always passively logs the boundary; when ARMED in quiet mode it spawns the detached
extractor with --trigger session_end, which bypasses the Stop debounce.
"""
import sys, os, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A

HERE = os.path.dirname(os.path.abspath(__file__))


def find_transcript(data, sid):
    """transcript_path if the host provided it; else derive from the session id
    (Claude Code transcripts live at ~/.claude/projects/<munged-cwd>/<sid>.jsonl)."""
    p = data.get("transcript_path") or ""
    if p and os.path.isfile(p):
        return p
    if sid and sid != "unknown":
        hits = glob.glob(os.path.join(os.path.expanduser("~"), ".claude", "projects", "*", sid + ".jsonl"))
        if hits:
            hits.sort(key=os.path.getmtime, reverse=True)
            return hits[0]
    return ""


def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    sid = data.get("session_id") or "unknown"
    cwd = data.get("cwd") or ""
    source = data.get("source") or data.get("reason") or "other"
    try:
        A.append_jsonl(A.ACTIVITY, {"type": "session_end", "session_id": sid,
                                    "cwd": cwd, "source": source, "armed": A.armed(),
                                    "ts": A.now_iso()})
        if A.armed() and A.mode() != "inline":
            tpath = find_transcript(data, sid)
            st = A.load_state(sid)
            grew = A.transcript_size(tpath) > int(st.get("last_capture_size", 0))
            if tpath and A.should_capture("session_end", grew,
                                          float(st.get("last_capture_at", 0) or 0),
                                          A.now_epoch(), A.debounce_secs()):
                A.spawn_detached([sys.executable, os.path.join(HERE, "capture_extract.py"),
                                  "--session", sid, "--cwd", cwd, "--transcript", tpath,
                                  "--trigger", "session_end"])
                A.log("session_end (armed, quiet, source=%s): spawned out-of-band extractor for %s"
                      % (source, sid))
            else:
                A.log("session_end (armed, source=%s): no transcript/new activity; passive log only"
                      % source)
        else:
            A.log("session_end (source=%s, armed=%s): passive log only" % (source, A.armed()))
    except Exception as e:
        A.log("session_end hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
