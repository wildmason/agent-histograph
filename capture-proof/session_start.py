#!/usr/bin/env python3
"""
SessionStart hook — register the session (passive fact) and, when ARMED, re-inject
the checkpoint operating contract as context so the agent knows it will be asked to
checkpoint at boundaries. Re-injection on source in {resume, compact} is how the
operating contract survives compaction (§8 "PostCompact re-injects the contract").

Injects context via hookSpecificOutput.additionalContext (verified field).
Fail-open; if anything goes wrong, emit nothing and exit 0.
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A

# Accurate for BOTH capture modes: in quiet mode (default) nothing is ever asked of
# the agent — a detached extractor reconstructs the checkpoint from the transcript —
# so the contract asks for decision LEGIBILITY in replies, which is what makes the
# reconstruction faithful. (The old text promised "you will be asked to emit a JSON
# checkpoint", which only inline mode does.)
CONTRACT = (
    "This session is observed by agentlog. At stopping points and context boundaries, "
    "agentlog quietly reconstructs a JSON checkpoint of your non-trivial decisions from "
    "the transcript (out-of-band; you will not normally be prompted). Make the material "
    "decisions you take legible in your replies — the choice, the alternatives, and the "
    "why — especially anything touching billing, licensing, auth, migrations, public "
    "APIs, dependencies, or data loss, so the reconstruction is faithful. Do NOT print "
    "a JSON checkpoint block in your replies yourself — capture is external and "
    "automatic, and a self-emitted blob is exactly the TUI clutter the quiet mode "
    "exists to avoid. This never changes how you do the work."
)

def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    sid = data.get("session_id") or "unknown"
    cwd = data.get("cwd") or ""
    source = data.get("source") or "startup"
    try:
        A.append_jsonl(A.ACTIVITY, {"type": "session_start", "session_id": sid,
                                    "cwd": cwd, "branch": A.git_branch(cwd),
                                    "source": source, "armed": A.armed(),
                                    "ts": A.now_iso()})
        A.log("session_start source=%s armed=%s" % (source, A.armed()))
        if A.armed():
            out = {"hookSpecificOutput": {"hookEventName": "SessionStart",
                                          "additionalContext": CONTRACT}}
            sys.stdout.write(json.dumps(out))
    except Exception as e:
        A.log("session_start hook error (fail-open): %r" % e)
    sys.exit(0)

if __name__ == "__main__":
    main()
