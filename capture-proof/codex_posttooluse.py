#!/usr/bin/env python3
"""Codex PostToolUse hook: passive tool facts for live histograph activity.

Codex 0.140 supports PostToolUse. This wrapper normalizes likely Codex hook
payload spellings into the existing passive-facts parser, then writes to the
Codex activity ledger namespace. It is deliberately fail-open and performs no
model calls.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C
import posttooluse as PT


def _dictish(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def _nested(d, *path):
    cur = d
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def _tool_name(data):
    return (
        data.get("tool_name")
        or data.get("toolName")
        or data.get("tool")
        or data.get("name")
        or _nested(data, "tool_call", "name")
        or _nested(data, "toolCall", "name")
        or _nested(data, "tool", "name")
        or ""
    )


def _tool_input(data):
    for key in ("tool_input", "toolInput", "input", "arguments", "args"):
        value = data.get(key)
        parsed = _dictish(value)
        if parsed:
            return parsed
    for path in (
        ("tool_call", "arguments"),
        ("toolCall", "arguments"),
        ("tool", "input"),
        ("tool", "arguments"),
    ):
        parsed = _dictish(_nested(data, *path))
        if parsed:
            return parsed
    return {}


def codex_tool_use_record(data, now_iso=None):
    normalized = {
        "tool_name": _tool_name(data),
        "tool_input": _tool_input(data),
        "session_id": C.hook_session_id(data) or "unknown",
        "cwd": C.hook_cwd(data),
    }
    rec = PT.tool_use_record(normalized, now_iso=now_iso)
    if rec:
        rec["host"] = C.HOST
    return rec


def main():
    data = A.read_stdin_json()
    if A.disabled():
        sys.exit(0)
    try:
        rec = codex_tool_use_record(data)
        if rec:
            C.append_activity(rec)
    except Exception as e:
        A.log("codex posttooluse hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
