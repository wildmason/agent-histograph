#!/usr/bin/env python3
"""Gemini CLI / Antigravity transcript watcher.

Tails the transcript.jsonl files produced by Gemini CLI and translates them
into the passive-fact and checkpoint records histograph expects. Runs
continuously out-of-band to provide passive capture.
"""

import glob
import hashlib
import json
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import posttooluse as PT

HOME = os.path.expanduser("~")
BRAIN_DIR = os.path.join(HOME, ".gemini", "antigravity-cli", "brain")
DEV_ROOT = os.path.join(HOME, "Documents", "development")
STATE_FILE = os.path.join(A.STATE_DIR, "gemini_watcher_state.json")
CHECKPOINTS = os.path.join(A.AGENTLOG_DIR, "checkpoints.gemini.jsonl")
ACTIVITY = os.path.join(A.AGENTLOG_DIR, "activity.gemini.jsonl")
SEEN_HASH_LIMIT = 20000

# Lock heartbeat: the watch loop touches the lock file's mtime at most every
# HEARTBEAT_SECS; a lock not refreshed within STALE_LOCK_SECS is treated as dead and
# reclaimed even if its recorded PID still appears alive (a recycled PID must not be
# able to masquerade as a live watcher — that is the PID-reuse hole that let the
# duplicate-watcher incident through). STALE is many× HEARTBEAT so a merely-slow loop
# never trips it.
HEARTBEAT_SECS = 10
STALE_LOCK_SECS = 60
_last_heartbeat = 0.0
# The lock fd held by an in-process (start_in_thread) watcher, so a clean shutdown
# (atexit) and the tests can release it. None when no in-process watcher is running.
_lock_fd = None


def _default_lock_path():
    """The single-instance lock lives at a FIXED, machine-global, ledger-INDEPENDENT
    path — NOT under AGENTLOG_DIR. The watcher's input is the global ~/.gemini
    transcript stream, so the invariant is one watcher per machine regardless of which
    ledger dir it mirrors into; a per-AGENTLOG_DIR lock would let two watchers (default
    dir + an override) both replay the same source. Honors HISTOGRAPH_CONFIG_DIR (the
    same ledger-independent config dir the board uses) so tests and a relocated home
    both work."""
    cfg = os.environ.get("HISTOGRAPH_CONFIG_DIR") or os.path.join(HOME, ".histograph")
    return os.path.join(cfg, "gemini_watcher.lock")


LOCK_FILE = _default_lock_path()


def load_state():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_state(state):
    A._ensure_dirs()
    d = os.path.dirname(STATE_FILE) or "."
    tmp = None
    try:
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".gemini-watcher.", suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(state, f)
        os.replace(tmp, STATE_FILE)
    except Exception as e:
        A.log("gemini_watcher save_state error: %r" % e)
        if tmp and os.path.exists(tmp):
            try:
                os.remove(tmp)
            except Exception:
                pass


def _pid_alive(pid):
    try:
        pid = int(pid)
    except Exception:
        return False
    if pid <= 0:
        return False
    if os.name == "nt":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
            if handle:
                kernel32.CloseHandle(handle)
                return True
            return False
        except Exception:
            return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _lock_is_stale():
    """True if the existing lock's heartbeat (its mtime, refreshed each loop) is older
    than STALE_LOCK_SECS — i.e. its owner has crashed, hung, or the recorded PID has
    been recycled by an unrelated process. A missing lock counts as stale (gone)."""
    try:
        age = time.time() - os.stat(LOCK_FILE).st_mtime
    except OSError:
        return True
    return age > STALE_LOCK_SECS


def acquire_lock():
    """Single-instance guard. Duplicate watchers replay the same transcripts and
    multiply the ledger (the 2026-06-17 incident), so a second LIVE watcher exits. A
    lock is reclaimed when its PID is dead OR its heartbeat is stale — the heartbeat
    check is what makes a recycled PID unable to keep a dead owner's lock alive."""
    d = os.path.dirname(LOCK_FILE) or "."
    try:
        os.makedirs(d, exist_ok=True)
    except Exception:
        pass
    while True:
        try:
            fd = os.open(LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_RDWR)
        except FileExistsError:
            try:
                with open(LOCK_FILE, "r", encoding="utf-8") as f:
                    owner = json.load(f)
            except Exception:
                owner = {}
            pid = owner.get("pid")
            # A genuinely live owner = PID alive AND a fresh heartbeat. Either being
            # false (dead PID, or a stale/recycled one not refreshing the lock) means
            # the lock is reclaimable.
            if _pid_alive(pid) and not _lock_is_stale():
                A.log("gemini_watcher already running as pid %s; exiting" % pid)
                return None
            try:
                os.remove(LOCK_FILE)
            except FileNotFoundError:
                pass
            except Exception as e:
                A.log("gemini_watcher lock reclaim failed: %r" % e)
                return None
            continue
        os.write(fd, json.dumps({"pid": os.getpid(), "started": A.now_iso(),
                                 "dir": A.AGENTLOG_DIR}).encode("utf-8"))
        global _last_heartbeat
        _last_heartbeat = time.time()   # the create stamps a fresh mtime
        return fd


def _heartbeat():
    """Refresh the lock's heartbeat (its mtime) so a peer's _lock_is_stale() sees this
    watcher as alive. Throttled to once per HEARTBEAT_SECS — the loop runs every 1.5s,
    so this is a cheap touch, not a per-iteration write."""
    global _last_heartbeat
    now = time.time()
    if now - _last_heartbeat < HEARTBEAT_SECS:
        return
    _last_heartbeat = now
    try:
        os.utime(LOCK_FILE, None)
    except OSError:
        pass


def release_lock(fd):
    try:
        os.close(fd)
    except Exception:
        pass
    try:
        with open(LOCK_FILE, "r", encoding="utf-8") as f:
            owner = json.load(f)
        if int(owner.get("pid") or 0) == os.getpid():
            os.remove(LOCK_FILE)
    except Exception:
        pass


def append_activity(rec):
    A.append_jsonl(ACTIVITY, rec)


def append_checkpoint(rec):
    A.append_jsonl(CHECKPOINTS, rec)


def get_tool_category(tool_name):
    """Map Gemini tools to Histograph tool classes."""
    if tool_name in ("run_command", "unsandboxed", "RUN_COMMAND"):
        return "Bash"
    if tool_name in ("write_to_file", "multi_replace_file_content", "replace_file_content",
                     "define_subagent", "CODE_ACTION"):
        return "Write"
    if tool_name in ("view_file", "list_dir", "read_url_content", "search_web",
                     "grep_search", "VIEW_FILE", "LIST_DIRECTORY", "SEARCH_WEB",
                     "GREP_SEARCH"):
        return "Read"
    if tool_name in ("invoke_subagent", "manage_subagents"):
        return "Agent"
    if tool_name in ("send_message", "manage_task", "schedule"):
        return "Task"
    return tool_name


def _text(v):
    if isinstance(v, str):
        return v
    if isinstance(v, list):
        parts = []
        for item in v:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(_text(item.get("text") or item.get("content") or ""))
        return "\n".join(p for p in parts if p)
    if isinstance(v, dict):
        return _text(v.get("text") or v.get("content") or "")
    return ""


def _safe_id(s):
    s = str(s or "x")
    return "".join(ch if ch.isalnum() else "_" for ch in s)[:80] or "x"


def _decode_arg(v):
    if not isinstance(v, str):
        return v
    s = v.strip()
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        try:
            return json.loads(s)
        except Exception:
            return s.strip('"')
    return s


def _project_from_path(raw):
    raw = _decode_arg(raw)
    if not isinstance(raw, str) or not raw.strip():
        return None
    path = os.path.abspath(os.path.expanduser(raw.strip()))
    try:
        common = os.path.commonpath([os.path.normcase(path), os.path.normcase(DEV_ROOT)])
    except Exception:
        return None
    if common != os.path.normcase(DEV_ROOT):
        return None
    rel = os.path.relpath(path, DEV_ROOT)
    if rel.startswith(".."):
        return None
    project = rel.split(os.sep, 1)[0]
    if not project or project in (".", ".."):
        return None
    return {
        "project": project,
        "cwd": os.path.join(DEV_ROOT, project),
    }


def _tool_args(call):
    if not isinstance(call, dict):
        return {}
    args = call.get("args", {})
    if isinstance(args, str):
        try:
            args = json.loads(args)
        except Exception:
            args = {}
    return args if isinstance(args, dict) else {}


def _session_context(session_id, rec, state):
    """Infer a stable display project from Gemini tool-call path metadata.
    Antigravity transcript records do not carry cwd/project at top level; using the
    brain session folder would display a GUID. Prefer explicit Cwd, then other
    paths under ~/Documents/development. Fall back to a generic Gemini label."""
    if state is None:
        return {"project": "gemini-session", "cwd": os.path.join(BRAIN_DIR, "gemini-session")}
    votes = state.setdefault("_project_votes", {}).setdefault(session_id, {})
    for call in rec.get("tool_calls") or []:
        args = _tool_args(call)
        for key, weight in (
            ("Cwd", 20), ("cwd", 20), ("WorkingDirectory", 20),
            ("AbsolutePath", 2), ("DirectoryPath", 2), ("TargetFile", 2),
            ("path", 2), ("file_path", 2),
        ):
            candidate = _project_from_path(args.get(key))
            if not candidate:
                continue
            project = candidate["project"]
            if project == "obsidian-rag-vault":
                weight = min(weight, 1)
            votes[project] = votes.get(project, 0) + weight
    if votes:
        project = sorted(votes.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
        ctx = {"project": project, "cwd": os.path.join(DEV_ROOT, project)}
    else:
        ctx = {"project": "gemini-session", "cwd": os.path.join(BRAIN_DIR, "gemini-session")}
    state.setdefault("_session_context", {})[session_id] = ctx
    return ctx


def _mark_seen(state, file_path, line):
    """Best-effort replay guard. The byte offset is primary; line hashes prevent
    truncated/replayed transcripts or stale state from appending the same source
    event again."""
    if state is None:
        return False
    seen = state.setdefault("_seen", {})
    bucket = seen.setdefault(file_path, [])
    h = hashlib.sha1(line.encode("utf-8", errors="replace")).hexdigest()
    if h in bucket:
        return True
    bucket.append(h)
    if len(bucket) > SEEN_HASH_LIMIT:
        del bucket[:-SEEN_HASH_LIMIT]
    return False


def _remember_once(state, group, key):
    if state is None:
        return True
    group_map = state.setdefault(group, {})
    if group_map.get(key):
        return False
    group_map[key] = True
    return True


def _record_ts(rec):
    return rec.get("created_at") or rec.get("timestamp") or A.now_iso()


def process_line(session_id, line, state=None):
    try:
        rec = json.loads(line)
    except Exception:
        return

    ts = _record_ts(rec)
    step_type = rec.get("type")
    source = rec.get("source")
    ctx = _session_context(session_id, rec, state)
    cwd = ctx["cwd"]
    project = ctx["project"]

    # A USER_INPUT event from the explicit user acts as a session_start/resume
    # signal. Emit it once per Gemini session; every prompt should not become a new
    # terminal-birth event.
    if step_type == "USER_INPUT" and source == "USER_EXPLICIT":
        if not _remember_once(state, "started_sessions", session_id):
            return
        append_activity({
            "type": "session_start",
            "host": "gemini",
            "session_id": session_id,
            "cwd": cwd,
            "project": project,
            "ts": ts,
        })

    # Tool calls -> tool_use activity for the live stream.
    if "tool_calls" in rec and isinstance(rec.get("tool_calls"), list):
        for call in rec["tool_calls"]:
            if not isinstance(call, dict):
                continue
            tname = call.get("name", "")
            args = call.get("args", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}
            if not isinstance(args, dict):
                args = {}

            mapped_tool = get_tool_category(tname)
            tool_rec = {
                "type": "tool_use",
                "host": "gemini",
                "session_id": session_id,
                "cwd": cwd,
                "project": project,
                "tool": mapped_tool,
                "ts": ts,
            }

            if mapped_tool == "Bash":
                cmd = args.get("CommandLine") or args.get("command") or args.get("cmd") or ""
                tool_rec["command"] = A.redact(str(cmd)[:PT._CMD_CAP]) if cmd else "bash"
            elif mapped_tool == "Write":
                paths = []
                for k in ("TargetFile", "AbsolutePath", "path", "file_path"):
                    if k in args:
                        paths.append(args[k])
                if paths:
                    tool_rec["paths"] = paths
                else:
                    tool_rec["target"] = A.redact(str(args)[:PT._TARGET_CAP])
            else:
                target = (args.get("AbsolutePath") or args.get("DirectoryPath")
                          or args.get("query") or args.get("Recipient")
                          or args.get("path") or tname)
                tool_rec["target"] = A.redact(str(target)[:PT._TARGET_CAP])

            append_activity(tool_rec)

    # PLANNER_RESPONSE is frequent planner/chunk output. Mine it only for explicit
    # first-party sigils; do not synthesize a checkpoint per chunk.
    if step_type == "PLANNER_RESPONSE":
        content = _text(rec.get("content", ""))
        if content:
            intent = A.extract_intent(content)
            if intent:
                irec = {
                    "type": "intent",
                    "host": "gemini",
                    "session_id": session_id,
                    "cwd": cwd,
                    "project": project,
                    "title": intent["title"],
                    "why": intent["why"],
                    "ts": ts,
                }
                key = irec["title"] + "\x1f" + irec["why"]
                if A.last_intent_key(session_id) != key:
                    append_activity(irec)
                    A.set_intent_key(session_id, key)

            next_action = A.extract_next(content)
            if next_action:
                nrec = {
                    "type": "next",
                    "host": "gemini",
                    "session_id": session_id,
                    "cwd": cwd,
                    "project": project,
                    "task": next_action["title"],
                    "title": next_action["title"],
                    "why": next_action["why"],
                    "ts": ts,
                }
                key = nrec["task"] + "\x1f" + nrec["why"]
                if A.last_next_key(session_id) != key:
                    append_activity(nrec)
                    A.set_next_key(session_id, key)

    # CHECKPOINT is the durable Gemini summary event. Keep it lightweight and do
    # not convert hidden planner/thinking text into decision rows.
    if step_type == "CHECKPOINT":
        thinking = _text(rec.get("thinking", ""))
        content = _text(rec.get("content", "") or rec.get("summary", ""))
        summary = A.redact((content or thinking or "Gemini checkpoint").replace("\n", " ")[:240])
        key_material = "%s\x1f%s\x1f%s" % (session_id, ts, summary)
        key = hashlib.sha1(key_material.encode("utf-8", errors="replace")).hexdigest()
        if not _remember_once(state, "checkpoint_keys", key):
            return
        append_checkpoint({
            "type": "checkpoint",
            "schema_version": "0.1",
            "host": "gemini",
            "session_id": session_id,
            "cwd": cwd,
            "project": project,
            "summary": summary,
            "touched_paths": [],
            "verification": [],
            "decisions": [],
            "risks": [],
            "asks": [],
            "next_action": "",
            "health_draft": {"topic": "", "decision": "", "reason": "", "human_involved": False},
            "checkpoint_id": "ckpt_gm_%s_%s" % (_safe_id(session_id), key[:12]),
            "captured_at": ts,
            "_valid": True,
        })


def start_in_thread():
    """Auto-start the watcher in a background DAEMON thread, single-instance. Returns
    the Thread if it started, or None if another live watcher already holds the lock —
    so the board's `serve` process can call this unconditionally on startup and a
    SECOND board won't double-capture (the duplicate-watcher class of bug). This is the
    auto-launch path Gemini lacked: Claude rides lifecycle hooks and Codex a
    SessionStart-spawned watcher, but Antigravity has no hook surface, so the board's
    long-lived serve process owns the tail. The thread is a daemon (dies with the host
    process); a clean shutdown releases the lock via atexit, a hard kill is recovered by
    the heartbeat-stale reclaim. Fail-open: any error returns None rather than raising
    into the board's startup path."""
    try:
        fd = acquire_lock()
    except Exception as e:
        A.log("gemini_watcher start_in_thread acquire error: %r" % e)
        return None
    if fd is None:
        return None  # another live watcher owns the lock — don't double-capture
    import atexit
    import threading
    global _lock_fd
    _lock_fd = fd
    atexit.register(release_lock, fd)

    def _run():
        try:
            watch_transcripts()
        except Exception as e:
            A.log("gemini_watcher thread crashed: %r" % e)

    t = threading.Thread(target=_run, name="gemini-watcher", daemon=True)
    t.start()
    return t


def watch_transcripts():
    A._ensure_dirs()
    state = load_state()

    pattern = os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl")
    A.log(f"gemini_watcher starting. Tailing {pattern}")

    while True:
        files = glob.glob(pattern)
        changed = False

        for file_path in files:
            session_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(file_path))))

            try:
                size = os.path.getsize(file_path)
            except OSError:
                continue

            last_offset = state.get(file_path, 0)

            if size > last_offset:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        f.seek(last_offset)
                        for line in f:
                            line = line.strip()
                            if line and not _mark_seen(state, file_path, line):
                                process_line(session_id, line, state=state)

                        state[file_path] = f.tell()
                        changed = True
                except Exception as e:
                    A.log(f"gemini_watcher error reading {file_path}: {e}")
            elif size < last_offset:
                # File was truncated/recreated. Replay from the start, with line
                # hashes preventing duplicate appends for lines we already handled.
                state[file_path] = 0
                changed = True

        if changed:
            save_state(state)

        _heartbeat()   # keep the single-instance lock fresh so peers see us as alive
        time.sleep(1.5)


if __name__ == "__main__":
    lock_fd = acquire_lock()
    if lock_fd is None:
        sys.exit(0)
    try:
        watch_transcripts()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        A.log(f"gemini_watcher crashed: {e}")
    finally:
        release_lock(lock_fd)
