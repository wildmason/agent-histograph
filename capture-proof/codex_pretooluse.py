#!/usr/bin/env python3
"""Codex PreToolUse hook: armed-only materiality tripwire.

This is not a second activity stream. PostToolUse records completed work; this
hook only spots planned high-materiality mutations early enough to remind the
agent to make its decision/rationale legible. It never blocks by default because
Codex PreToolUse coverage is documented as incomplete, so it must not be treated
as a security boundary.
"""
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import codex_common as C


_CMD_CAP = 500
_PATH_CAP = 240
_MAX_PATHS = 12
_MAX_REASONS = 8

_MUTATING_TOOLS = {"apply_patch", "edit", "write", "multiedit", "notebookedit"}
_SHELL_TOOLS = {"bash", "powershell", "shell", "shell_command"}
_MCP_MUTATING_WORDS = (
    "write", "edit", "delete", "remove", "move", "rename", "create", "update",
    "patch", "apply",
)

_DEPENDENCY_FILES = {
    "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
    "bun.lockb", "cargo.toml", "cargo.lock", "pyproject.toml", "poetry.lock",
    "pdm.lock", "uv.lock", "go.mod", "go.sum", "gemfile", "gemfile.lock",
    "composer.json", "composer.lock", "requirements.txt",
}

_PATH_RULES = (
    ("billing", re.compile(r"(^|/)(billing|billable|payments?|checkout|subscriptions?|invoices?|renewals?|revenue)(/|$|[._-])", re.I)),
    ("license", re.compile(r"(^|/)(licen[cs]e|licensing|entitlements?|activation)(/|$|[._-])", re.I)),
    ("auth", re.compile(r"(^|/)(auth|oauth|oidc|sso|login|sessions?|tokens?|credentials?|secrets?)(/|$|[._-])", re.I)),
    ("migration", re.compile(r"(^|/)(migrations?|schema|alembic|prisma)(/|$|[._-])", re.I)),
    ("public_api", re.compile(r"(^|/)(openapi|swagger|proto|graphql|sdk|public-api|api)(/|$|[._-])", re.I)),
)

_DATA_LOSS_COMMANDS = (
    re.compile(r"\brm\s+.*-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)\b", re.I),
    re.compile(r"\bremove-item\b.*-(?:recurse|force)\b", re.I),
    re.compile(r"\bgit\s+reset\s+--hard\b", re.I),
    re.compile(r"\bgit\s+clean\b.*\s-f", re.I),
    re.compile(r"\bdrop\s+(database|schema|table)\b", re.I),
    re.compile(r"\btruncate\s+(table\s+)?[a-z_][\w.]*\b", re.I),
    re.compile(r"\bdelete\s+from\s+[a-z_][\w.]*\b", re.I),
    re.compile(r"\b(prisma\s+migrate\s+reset|db\s+reset|database\s+reset)\b", re.I),
)

_MIGRATION_COMMANDS = re.compile(
    r"\b(migrate|migration|alembic|diesel\s+migration|prisma\s+migrate|sqlx\s+migrate)\b",
    re.I,
)
_DEPENDENCY_COMMANDS = re.compile(
    r"\b(npm|pnpm|yarn|bun)\s+(install|add|remove|update|upgrade|audit\s+fix)\b|"
    r"\b(cargo\s+(add|remove|update)|pip\s+install|uv\s+add|poetry\s+(add|remove|update)|"
    r"go\s+get|go\s+mod\s+tidy)\b",
    re.I,
)


def _norm_path(p):
    return str(p or "").strip().replace("\\", "/")


def _basename(p):
    p = _norm_path(p).rstrip("/")
    return p.rsplit("/", 1)[-1].lower()


def _cap_text(s, cap):
    s = A.redact(str(s or "").strip())
    s = re.sub(r"\s+", " ", s)
    if len(s) > cap:
        return s[: cap - 1].rstrip() + "..."
    return s


def _add_path(paths, p):
    p = _norm_path(p)
    if p and p not in paths:
        paths.append(p)


def _paths_from_patch(text):
    paths = []
    if not isinstance(text, str):
        return paths
    prefixes = ("*** Update File: ", "*** Add File: ", "*** Delete File: ")
    for line in text.splitlines():
        for prefix in prefixes:
            if line.startswith(prefix):
                _add_path(paths, line[len(prefix):].strip())
                break
    return paths


def _tool_is_mutating(tool):
    t = (tool or "").lower()
    if t in _MUTATING_TOOLS or t in _SHELL_TOOLS:
        return True
    if t.startswith("mcp__"):
        return any(word in t for word in _MCP_MUTATING_WORDS)
    return False


def _command_from_input(ti):
    for key in ("command", "cmd", "script"):
        v = ti.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def planned_paths(tool, ti):
    paths = []
    if not isinstance(ti, dict):
        return paths
    for key in ("file_path", "notebook_path", "path", "old_path", "new_path"):
        v = ti.get(key)
        if isinstance(v, str):
            _add_path(paths, v)
    for key in ("paths", "files"):
        v = ti.get(key)
        if isinstance(v, list):
            for item in v:
                if isinstance(item, str):
                    _add_path(paths, item)
                elif isinstance(item, dict):
                    for k in ("path", "file_path", "old_path", "new_path"):
                        if isinstance(item.get(k), str):
                            _add_path(paths, item.get(k))
    if (tool or "").lower() == "apply_patch":
        for key in ("command", "patch", "input", "changes"):
            for p in _paths_from_patch(ti.get(key)):
                _add_path(paths, p)
    return paths


def classify_path(path):
    out = []
    p = _norm_path(path).lower()
    base = _basename(p)
    if base in _DEPENDENCY_FILES or re.match(r"requirements[-\w]*\.txt$", base):
        out.append(("dependency", "%s is a dependency manifest/lockfile" % path))
    if base == "license" or base.startswith("license."):
        out.append(("license", "%s is a license file" % path))
    for cls, rx in _PATH_RULES:
        if rx.search(p):
            out.append((cls, "%s matches %s path rule" % (path, cls)))
    return out


def classify_command(command):
    out = []
    if not command:
        return out
    c = command.strip()
    for rx in _DATA_LOSS_COMMANDS:
        if rx.search(c):
            out.append(("data_loss", "command has destructive/data-loss shape"))
            break
    if _MIGRATION_COMMANDS.search(c):
        out.append(("migration", "command has migration shape"))
    if _DEPENDENCY_COMMANDS.search(c):
        out.append(("dependency", "command has dependency-management shape"))
    if re.search(r"\b(openapi|swagger|proto|graphql)\b", c, re.I):
        out.append(("public_api", "command references public API artifacts"))
    return out


def material_signal(data, now_iso=None):
    tool = C.hook_tool_name(data)
    ti = C.hook_tool_input(data)
    if not tool or not _tool_is_mutating(tool):
        return None

    command = _command_from_input(ti)
    paths = planned_paths(tool, ti)
    classes, reasons = [], []

    def add(cls, reason):
        if cls not in classes:
            classes.append(cls)
        if reason not in reasons:
            reasons.append(reason)

    for p in paths:
        for cls, reason in classify_path(p):
            add(cls, reason)
    for cls, reason in classify_command(command):
        add(cls, reason)

    if not classes:
        return None

    rec = {
        "type": "pretool_material_signal",
        "session_id": C.hook_session_id(data) or "unknown",
        "cwd": C.hook_cwd(data),
        "tool": tool,
        "classes": sorted(classes),
        "reasons": reasons[:_MAX_REASONS],
        "ts": now_iso or A.now_iso(),
    }
    if paths:
        rec["paths"] = [_cap_text(p, _PATH_CAP) for p in paths[:_MAX_PATHS]]
        if len(paths) > _MAX_PATHS:
            rec["paths_truncated"] = len(paths) - _MAX_PATHS
    if command:
        rec["command"] = _cap_text(command, _CMD_CAP)
    return rec


def _marker_path(sid):
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", sid or "unknown")
    return os.path.join(A.STATE_DIR, safe + ".codex-pretool")


def _signal_key(rec):
    payload = {
        "tool": rec.get("tool"),
        "classes": rec.get("classes") or [],
        "paths": rec.get("paths") or [],
        "command": rec.get("command") or "",
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def already_seen(rec):
    try:
        with open(_marker_path(rec.get("session_id")), "r", encoding="utf-8") as f:
            return f.read().strip() == _signal_key(rec)
    except Exception:
        return False


def mark_seen(rec):
    try:
        os.makedirs(A.STATE_DIR, exist_ok=True)
        with open(_marker_path(rec.get("session_id")), "w", encoding="utf-8") as f:
            f.write(_signal_key(rec))
    except Exception as e:
        A.log("codex pretool mark_seen error: %r" % e)


def context_message(rec):
    classes = ", ".join(rec.get("classes") or ["material"])
    targets = rec.get("paths") or []
    if not targets and rec.get("command"):
        targets = [rec["command"]]
    target_text = "; ".join(targets[:3])
    if rec.get("paths_truncated"):
        target_text += "; +%d more" % rec["paths_truncated"]
    if target_text:
        target_text = " Target: %s." % target_text
    return (
        "agentlog noticed this planned tool call touches %s-sensitive work.%s "
        "If you make a non-trivial choice here, state the choice, alternatives, "
        "and why in normal prose; a `▸ intent: <what> -- <why>` line is also useful. "
        "Continue normally."
    ) % (classes, target_text)


def pretool_output(rec):
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": context_message(rec),
        }
    }


def main():
    if A.disabled():
        sys.exit(0)
    data = A.read_stdin_json()
    try:
        rec = material_signal(data)
        if not rec or not C.armed() or already_seen(rec):
            sys.exit(0)
        if C.append_activity(rec):
            mark_seen(rec)
        # Keep hook stdout ASCII-safe for Windows pipes whose default encoding may
        # not support the intent glyph in the additionalContext text.
        sys.stdout.write(json.dumps(pretool_output(rec)))
    except Exception as e:
        A.log("codex pretooluse hook error (fail-open): %r" % e)
    sys.exit(0)


if __name__ == "__main__":
    main()
