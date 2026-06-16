#!/usr/bin/env python3
"""
install_hooks.py — register the agent-histograph capture hooks into Claude Code.

The histograph board is a window onto the `~/.agentlog/*.jsonl` ledger; this
installer wires the producer that fills it. It merges five hooks
(SessionStart / Stop / PreCompact / SessionEnd / PostToolUse) into your Claude
Code settings, pointing them at the scripts in THIS directory — so the paths are
correct on whatever machine you cloned onto, with no hard-coded user path.

Key safety property (same as the original control-plane producer): the hooks only
CAPTURE when `AGENTLOG_CAPTURE_ACTIVE=1` is set in that session's environment.
Installed-but-un-armed they only passively log activity; installing this cannot
disrupt your normal sessions. `AGENTLOG_DISABLE=1` no-ops everything.

Usage:
  python install_hooks.py                  # merge into ~/.claude/settings.json
  python install_hooks.py --project        # merge into ./.claude/settings.json (this repo/cwd)
  python install_hooks.py --settings PATH  # merge into an explicit settings.json
  python install_hooks.py --print          # show what would be written, change nothing
  python install_hooks.py --uninstall      # remove the agent-histograph hooks

After installing, ARM capture for the sessions you want on the board:
  PowerShell (persistent):  setx AGENTLOG_CAPTURE_ACTIVE 1   (then open a new terminal)
  bash (one session):       export AGENTLOG_CAPTURE_ACTIVE=1
Then start (or restart) Claude Code — hook config + the env are read at session start.
"""
import os
import sys
import json
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))

# (event, script, matcher-or-None, timeout). PostToolUse fires on state-changing
# tools AND observation tools so the live-activity stream moves during exploration,
# not only on edits — but only MUTATING tools contribute `paths`; a Read/search
# records a live-stream-only `target`, never a "touched path".
_POSTTOOL_MATCHER = "Edit|Write|MultiEdit|NotebookEdit|Bash|Read|Grep|Glob|Task|Agent|WebFetch|WebSearch"
HOOK_SPEC = [
    ("SessionStart", "session_start.py", None, 10),
    ("Stop", "stop_capture.py", None, 15),
    ("PreCompact", "precompact_marker.py", None, 10),
    ("SessionEnd", "session_end.py", None, 10),
    ("PostToolUse", "posttooluse.py", _POSTTOOL_MATCHER, 5),
]

# every script we own, so reinstall/uninstall can recognize a prior group of ours
# regardless of which interpreter path it was written with.
OUR_SCRIPTS = {script for (_e, script, _m, _t) in HOOK_SPEC}


def _command(script):
    """Quoted `"<this python>" "<abs script>"` with forward slashes (Claude Code
    accepts forward slashes on Windows; quoting tolerates spaces in either path)."""
    py = sys.executable.replace("\\", "/")
    path = os.path.join(HERE, script).replace("\\", "/")
    return '"%s" "%s"' % (py, path)


def _is_ours(group):
    """True if a hook GROUP references one of our scripts (matches across machines /
    interpreter paths, since we test the script basename, not the full command)."""
    for h in group.get("hooks", []):
        cmd = h.get("command", "")
        if any(("/" + s) in cmd.replace("\\", "/") or cmd.endswith(s) for s in OUR_SCRIPTS):
            return True
    return False


def _build_group(script, matcher, timeout):
    group = {"hooks": [{"type": "command", "command": _command(script), "timeout": timeout}]}
    if matcher is not None:
        group["matcher"] = matcher
    return group


def _load(settings_path):
    if not os.path.isfile(settings_path):
        return {}
    with open(settings_path, "r", encoding="utf-8-sig") as f:   # utf-8-sig strips a BOM if present
        text = f.read().strip()
    return json.loads(text) if text else {}


def _save(settings_path, data):
    os.makedirs(os.path.dirname(settings_path) or ".", exist_ok=True)
    with open(settings_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _merge(settings, uninstall=False):
    """Return (settings, added, removed). Idempotent: strips any prior groups of
    ours first (so a reinstall repoints paths cleanly), preserving every other hook,
    then re-adds unless uninstalling."""
    hooks = settings.setdefault("hooks", {})
    added = removed = 0
    for event, script, matcher, timeout in HOOK_SPEC:
        groups = hooks.get(event, [])
        kept = [g for g in groups if not _is_ours(g)]
        removed += len(groups) - len(kept)
        if not uninstall:
            kept.append(_build_group(script, matcher, timeout))
            added += 1
        if kept:
            hooks[event] = kept
        elif event in hooks:
            del hooks[event]
    if not hooks:
        settings.pop("hooks", None)
    return settings, added, removed


def main(argv=None):
    ap = argparse.ArgumentParser(description="Install/remove the agent-histograph capture hooks.")
    ap.add_argument("--settings", default=None, help="explicit settings.json path")
    ap.add_argument("--project", action="store_true", help="use ./.claude/settings.json instead of the global one")
    ap.add_argument("--uninstall", action="store_true", help="remove the agent-histograph hooks")
    ap.add_argument("--print", dest="dry", action="store_true", help="print the result, write nothing")
    args = ap.parse_args(argv)

    if args.settings:
        settings_path = os.path.abspath(args.settings)
    elif args.project:
        settings_path = os.path.abspath(os.path.join(".claude", "settings.json"))
    else:
        settings_path = os.path.join(os.path.expanduser("~"), ".claude", "settings.json")

    try:
        settings = _load(settings_path)
    except (json.JSONDecodeError, OSError) as e:
        print("ERROR reading %s: %s" % (settings_path, e), file=sys.stderr)
        return 1

    settings, added, removed = _merge(settings, uninstall=args.uninstall)

    if args.dry:
        print("# would write %s" % settings_path)
        print(json.dumps(settings, indent=2, ensure_ascii=False))
        return 0

    _save(settings_path, settings)
    if args.uninstall:
        print("Removed %d agent-histograph hook group(s) from %s" % (removed, settings_path))
        return 0

    verb = "Updated" if removed else "Installed"
    print("%s %d agent-histograph capture hook(s) in %s" % (verb, added, settings_path))
    print("  scripts: %s" % HERE)
    print("  python:  %s" % sys.executable)
    print("")
    print("Next: ARM capture, then start/restart Claude Code:")
    print("  PowerShell (persistent):  setx AGENTLOG_CAPTURE_ACTIVE 1   (open a new terminal after)")
    print("  bash (one session):       export AGENTLOG_CAPTURE_ACTIVE=1")
    print("Un-armed, the hooks only passively log; AGENTLOG_DISABLE=1 no-ops everything.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
