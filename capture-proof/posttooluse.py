#!/usr/bin/env python3
"""
PostToolUse hook — the passive-facts layer (§6.2: "files touched, commands attempted").

The Gate-B substrate previously logged only boundaries (session_start / stop /
compaction), while three spec mechanisms silently assumed observed paths/commands
existed in the JSONL: the §6.2.1 rubric's "N or more passive edits" clause, the §6.3
step-2 ground-truth inputs (transcript + command log), and the §6.3 step-7
suspected-gap signals ("flagged paths, manifest deltas, migration files ... already
present in the JSONL"). This hook makes those records real.

Scope + cost posture (§8.1): the matcher fires on state-changing tools
(Edit|Write|MultiEdit|NotebookEdit|Bash) AND observation tools
(Read|Grep|Glob|Task|Agent|WebFetch|WebSearch). Reads/searches were originally
excluded for cost, but that left the histograph live-activity stream silent during
exploration (which is most of a turn) — so it now captures them too, at ~34ms/call.
The integrity line is the FIELD, not the matcher: only MUTATING tools contribute
`paths` (what the §6.3 ground-truth / §6.4 suspected-gap audit harvests as 'paths the
session touched'); an observation records a live-stream-only `target` (basename /
pattern / url / query / desc) that the gate pipeline never reads — so a file we only
LOOKED at can never false-fire the migration/manifest/flagged-glob signals.
Direct append, minimal imports, no model call, no spawn. Command/target text is
truncated + redacted AT WRITE time (§10 at-rest boundary). Logs armed or not
(passive facts are the substrate, like stop_boundary) and honors the kill switch.
Fail-open: any error allows the agent to proceed.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A

_CMD_CAP = 500
_TARGET_CAP = 200

# Tools that MUTATE the workspace. Only these contribute `paths` — the field the
# §6.3 ground-truth / §6.4 suspected-gap audit harvests as "paths the session
# touched". A Read/Grep OBSERVES; it must never land in `paths` or it would falsely
# fire the migration/manifest/flagged-glob signals on files we merely looked at.
_MUTATING = ("Edit", "Write", "MultiEdit", "NotebookEdit")


def _observe_target(ti):
    """A single human-readable target for a non-mutating, non-Bash tool
    (Read/Grep/Glob/WebFetch/WebSearch/Task/Agent …), surfaced ONLY in the
    histograph live-activity stream — deliberately NOT a touched path. Path-ops
    show the basename; searches/web/sub-agents show their pattern/url/query/desc."""
    for key in ("file_path", "notebook_path"):
        p = ti.get(key)
        if isinstance(p, str) and p.strip():
            s = p.strip().rstrip("\\/")
            return os.path.basename(s) or s
    for key in ("pattern", "url", "query", "description"):
        v = ti.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    p = ti.get("path")
    if isinstance(p, str) and p.strip():
        s = p.strip().rstrip("\\/")
        return os.path.basename(s) or s
    return ""


def tool_use_record(data, now_iso=None):
    """Pure: hook stdin payload → a tool_use activity record (or None if there is
    nothing observable). MUTATING tools contribute `paths` (file_path/notebook_path);
    Bash contributes `command`; every other observed tool (reads/searches/web/
    sub-agents) contributes a live-stream-only `target`. All text is redacted +
    capped at write time (§10 at-rest boundary)."""
    tool = data.get("tool_name") or ""
    ti = data.get("tool_input") if isinstance(data.get("tool_input"), dict) else {}
    paths = []
    if tool in _MUTATING:
        for key in ("file_path", "notebook_path"):
            p = ti.get(key)
            if isinstance(p, str) and p.strip():
                paths.append(p)
    command = ""
    c = ti.get("command")
    if isinstance(c, str) and c.strip():
        command = A.redact(c.strip())
        if len(command) > _CMD_CAP:
            command = command[:_CMD_CAP - 1] + "…"
    target = ""
    if not paths and not command:
        t = _observe_target(ti)
        if t:
            target = A.redact(t)
            if len(target) > _TARGET_CAP:
                target = target[:_TARGET_CAP - 1] + "…"
    if not tool or (not paths and not command and not target):
        return None
    rec = {"type": "tool_use", "session_id": data.get("session_id") or "unknown",
           "cwd": data.get("cwd") or "", "tool": tool,
           "ts": now_iso or A.now_iso()}
    if paths:
        rec["paths"] = paths
    if command:
        rec["command"] = command
    if target:
        rec["target"] = target
    return rec


def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    try:
        rec = tool_use_record(data)
        if rec:
            A.append_jsonl(A.ACTIVITY, rec)
    except Exception as e:
        A.log("posttooluse hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
