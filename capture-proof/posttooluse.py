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
_DESC_CAP = 200
_TODO_CONTENT_CAP = 200
_MAX_TODOS = 30

# Tools that MUTATE the workspace. Only these contribute `paths` — the field the
# §6.3 ground-truth / §6.4 suspected-gap audit harvests as "paths the session
# touched". A Read/Grep OBSERVES; it must never land in `paths` or it would falsely
# fire the migration/manifest/flagged-glob signals on files we merely looked at.
_MUTATING = ("Edit", "Write", "MultiEdit", "NotebookEdit", "apply_patch")


def _paths_from_patch(text):
    paths = []
    if not isinstance(text, str):
        return paths
    prefixes = ("*** Update File: ", "*** Add File: ", "*** Delete File: ")
    for line in text.splitlines():
        for prefix in prefixes:
            if line.startswith(prefix):
                p = line[len(prefix):].strip()
                if p and p not in paths:
                    paths.append(p)
                break
    return paths


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
        if tool == "apply_patch":
            for key in ("patch", "input", "changes"):
                paths.extend(p for p in _paths_from_patch(ti.get(key)) if p not in paths)
    command = ""
    c = ti.get("command")
    if isinstance(c, str) and c.strip():
        command = A.redact(c.strip())
        if len(command) > _CMD_CAP:
            command = command[:_CMD_CAP - 1] + "…"
    # The agent's OWN one-line label for a command-bearing tool (Bash's `description`,
    # "Push commits to remote"). Bash sets `command` first, so _observe_target never
    # reaches its description branch — the first-party human label was being discarded.
    # Capture it as a supplementary `desc` (the live-stream second line), never a touched
    # path. Only when a command is present, so a Task/Agent description still surfaces as
    # its `target` (no duplication). Redacted + capped at write time (§10).
    desc = ""
    if command:
        dv = ti.get("description")
        if isinstance(dv, str) and dv.strip():
            desc = A.redact(dv.strip())
            if len(desc) > _DESC_CAP:
                desc = desc[:_DESC_CAP - 1] + "…"
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
    if desc:
        rec["desc"] = desc
    if target:
        rec["target"] = target
    return rec


def intent_record(data, text, now_iso=None):
    """Pure: a block of assistant text -> a first-class `intent` activity record when the
    agent declared one (`▸ intent: <what> — <why>`), else None. This is the DECLARED-intent
    layer (the live, first-party "why"), the complement to the out-of-band reconstructed
    decision (a later model pass inferring the why). Title/why are redacted + capped inside
    A.extract_intent (§10 at-rest)."""
    parsed = A.extract_intent(text)
    if not parsed:
        return None
    return {"type": "intent", "session_id": data.get("session_id") or "unknown",
            "cwd": data.get("cwd") or "", "title": parsed["title"],
            "why": parsed["why"], "ts": now_iso or A.now_iso()}


def maybe_capture_intent(data):
    """Scrape the transcript tail for a declared `▸ intent:` line and, if it is NEW
    (deduped per session — the line lingers in the tail all turn), append an `intent`
    record. Bounded tail read; armed-only (called only when armed); fail-open."""
    tpath = data.get("transcript_path") or ""
    if not tpath:
        return
    rec = intent_record(data, A.tail_assistant_text(tpath))
    if rec is None:
        return
    sid = rec["session_id"]
    key = rec["title"] + "\x1f" + rec["why"]
    if A.last_intent_key(sid) == key:
        return   # this exact declaration was already emitted earlier in the turn
    # Gate the dedup marker on a SUCCESSFUL write: if the ledger append fails (disk full,
    # permission), the marker stays unset so the same declaration is re-captured next call.
    if A.append_jsonl(A.ACTIVITY, rec):
        A.set_intent_key(sid, key)


def next_record(data, text, now_iso=None):
    """Pure: a block of assistant text -> a first-class `next` activity record when the agent
    declared one (`▸ next: <task> — <why>`), else None. This is the first-party DECLARED-NEXT
    layer — the agent's OWN statement of the next task, the deterministic replacement for the
    out-of-band reconstructed `next_action` guess. Task/why are redacted + capped inside
    A.extract_next (§10 at-rest)."""
    parsed = A.extract_next(text)
    if not parsed:
        return None
    return {"type": "next", "session_id": data.get("session_id") or "unknown",
            "cwd": data.get("cwd") or "", "task": parsed["title"],
            "why": parsed["why"], "ts": now_iso or A.now_iso()}


def maybe_capture_next(data):
    """Scrape the transcript tail for a declared `▸ next:` line and, if it is NEW (deduped
    per session, independently of intent — the line lingers in the tail all turn), append a
    `next` record. Bounded tail read; armed-only (called only when armed); fail-open."""
    tpath = data.get("transcript_path") or ""
    if not tpath:
        return
    rec = next_record(data, A.tail_assistant_text(tpath))
    if rec is None:
        return
    sid = rec["session_id"]
    key = rec["task"] + "\x1f" + rec["why"]
    if A.last_next_key(sid) == key:
        return   # this exact declaration was already emitted earlier in the turn
    if A.append_jsonl(A.ACTIVITY, rec):
        A.set_next_key(sid, key)


def todos_record(data, now_iso=None):
    """Pure: a TodoWrite tool call -> a `todos` activity record snapshotting the agent's live
    plan ([{content, status}], redacted + capped), else None for any other tool or an empty
    list. This is the STRUCTURED first-party plan: serve_state derives the deterministic
    'next' from the first still-pending item, superseding the reconstructed `next_action`
    guess with zero extra discipline (the agent already maintains its TodoWrite list)."""
    if (data.get("tool_name") or "") != "TodoWrite":
        return None
    ti = data.get("tool_input") if isinstance(data.get("tool_input"), dict) else {}
    raw = ti.get("todos")
    if not isinstance(raw, list) or not raw:
        return None
    items = []
    for t in raw[:_MAX_TODOS]:
        if not isinstance(t, dict):
            continue
        content = A.redact(str(t.get("content") or "").strip())
        if not content:
            continue
        if len(content) > _TODO_CONTENT_CAP:
            content = content[:_TODO_CONTENT_CAP - 1] + "…"
        status = (str(t.get("status") or "").strip().lower() or "pending")
        if status not in ("pending", "in_progress", "completed"):
            status = "pending"
        items.append({"content": content, "status": status})
    if not items:
        return None
    return {"type": "todos", "session_id": data.get("session_id") or "unknown",
            "cwd": data.get("cwd") or "", "items": items, "ts": now_iso or A.now_iso()}


def main():
    # Kill switch first: disabled() only reads an env var, so checking it BEFORE
    # read_stdin_json keeps AGENTLOG_DISABLE=1 a true zero-footprint no-op (a malformed
    # stdin must not create the ledger dir / hook.log when capture is disabled).
    if A.disabled():
        sys.exit(0)
    data = A.read_stdin_json()
    try:
        rec = tool_use_record(data)
        if rec:
            A.append_jsonl(A.ACTIVITY, rec)
    except Exception as e:
        A.log("posttooluse hook error (fail-open): %r" % e)
    # Declared intent / next + the TodoWrite plan are volunteered JUDGMENT (like a
    # checkpoint), so they are ARMED-ONLY — a normal un-armed session pays zero extra cost
    # (no transcript read at all). Each is wrapped separately so one scrape error can never
    # lose the passive tool_use fact above or the other first-party signals.
    if A.armed():
        try:
            maybe_capture_intent(data)
        except Exception as e:
            A.log("posttooluse intent capture error (fail-open): %r" % e)
        try:
            maybe_capture_next(data)
        except Exception as e:
            A.log("posttooluse next capture error (fail-open): %r" % e)
        try:
            trec = todos_record(data)
            if trec:
                A.append_jsonl(A.ACTIVITY, trec)
        except Exception as e:
            A.log("posttooluse todos capture error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
