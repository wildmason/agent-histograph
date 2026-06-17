#!/usr/bin/env python3
"""Codex PostToolUse hook: passive tool facts for live histograph activity.

Codex 0.140 supports PostToolUse. This wrapper normalizes likely Codex hook
payload spellings into the existing passive-facts parser, then writes to the
Codex activity ledger namespace. When capture is armed, it also scrapes recent
conversation-visible assistant text for the same `intent` breadcrumb Claude
emits. It is deliberately fail-open and performs no model calls.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C
import posttooluse as PT


def codex_tool_use_record(data, now_iso=None):
    normalized = {
        "tool_name": C.hook_tool_name(data),
        "tool_input": C.hook_tool_input(data),
        "session_id": C.hook_session_id(data) or "unknown",
        "cwd": C.hook_cwd(data),
    }
    rec = PT.tool_use_record(normalized, now_iso=now_iso)
    if rec:
        rec["host"] = C.HOST
    return rec


def codex_intent_record(data, now_iso=None):
    sid = C.hook_session_id(data) or "unknown"
    cwd = C.hook_cwd(data)
    tpath = C.hook_transcript_path(data, session_id=sid, cwd=cwd)
    if not tpath:
        return None
    rec = PT.intent_record(
        {"session_id": sid, "cwd": cwd},
        C.tail_codex_assistant_text(tpath),
        now_iso=now_iso,
    )
    if rec:
        rec["host"] = C.HOST
    return rec


def maybe_capture_intent(data):
    rec = codex_intent_record(data)
    if rec is None:
        return
    key = rec["title"] + "\x1f" + rec["why"]
    marker_sid = C.state_id(rec["session_id"])
    if A.last_intent_key(marker_sid) == key:
        return
    if C.append_activity(rec):
        A.set_intent_key(marker_sid, key)


def main():
    if A.disabled():
        sys.exit(0)
    data = A.read_stdin_json()
    try:
        rec = codex_tool_use_record(data)
        if rec:
            C.append_activity(rec)
    except Exception as e:
        A.log("codex posttooluse hook error (fail-open): %r" % e)
    if C.armed():
        try:
            maybe_capture_intent(data)
        except Exception as e:
            A.log("codex posttooluse intent capture error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
