"""
Codex producer helpers.

Codex writes to per-host ledger files (`checkpoints.codex.jsonl` and
`activity.codex.jsonl`) so it can feed the same agentlog read surface without
sharing an append target with Claude Code.
"""
import glob
import json
import os
import re
import subprocess
import sys
import tempfile

import agentlog_common as A


HOST = "codex"
CHECKPOINTS = os.path.join(A.AGENTLOG_DIR, "checkpoints.codex.jsonl")
ACTIVITY = os.path.join(A.AGENTLOG_DIR, "activity.codex.jsonl")
ARM_FILE = os.path.join(A.AGENTLOG_DIR, "codex.capture-active")
CODEX_HOME = os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex"))
CODEX_BIN = os.environ.get("AGENTLOG_CODEX_BIN") or ("codex.cmd" if os.name == "nt" else "codex")
MAX_ARG_CHARS = int(os.environ.get("AGENTLOG_CODEX_MAX_ARG_CHARS", "1200"))
HERE = os.path.dirname(os.path.abspath(__file__))
CHECKPOINT_SCHEMA = os.path.join(HERE, "checkpoint.schema.json")
_FALSEY = {"0", "false", "no", "off"}


def append_activity(obj):
    obj = dict(obj)
    obj.setdefault("host", HOST)
    return A.append_jsonl(ACTIVITY, obj)


def append_checkpoint(obj):
    obj = dict(obj)
    obj.setdefault("host", HOST)
    return A.append_jsonl(CHECKPOINTS, obj)


def state_id(session_id):
    return "codex-" + (session_id or "unknown")


def armed():
    """Codex hooks cannot be armed from config env on 0.137, so support a file flag."""
    return (
        A.armed()
        or os.environ.get("AGENTLOG_CODEX_CAPTURE_ACTIVE", "") == "1"
        or os.path.exists(ARM_FILE)
    )


def _safe_session_name(session_id):
    return re.sub(r"[^A-Za-z0-9_.-]", "_", session_id or "unknown")


def _nested(d, *path):
    cur = d
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def _to_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def _proc(pid, ppid=0, name="", command=""):
    return {
        "pid": _to_int(pid),
        "ppid": _to_int(ppid),
        "name": str(name or ""),
        "command": str(command or ""),
    }


def _win_process_table():
    script = (
        "$ErrorActionPreference='SilentlyContinue';"
        "Get-CimInstance Win32_Process | "
        "Select-Object ProcessId,ParentProcessId,Name,CommandLine | "
        "ConvertTo-Json -Compress"
    )
    try:
        kw = {}
        if os.name == "nt":
            kw["creationflags"] = 0x08000000  # CREATE_NO_WINDOW
        proc = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=4,
            **kw,
        )
        if proc.returncode != 0 or not proc.stdout.strip():
            return {}
        rows = json.loads(proc.stdout)
        if isinstance(rows, dict):
            rows = [rows]
        out = {}
        for row in rows if isinstance(rows, list) else []:
            if not isinstance(row, dict):
                continue
            p = _proc(
                row.get("ProcessId"),
                row.get("ParentProcessId"),
                row.get("Name"),
                row.get("CommandLine"),
            )
            if p["pid"]:
                out[p["pid"]] = p
        return out
    except Exception as e:
        A.log("codex process table (windows) error: %r" % e)
        return {}


def _linux_process_table():
    root = "/proc"
    if not os.path.isdir(root):
        return {}
    out = {}
    try:
        for name in os.listdir(root):
            if not name.isdigit():
                continue
            pid = int(name)
            pdir = os.path.join(root, name)
            try:
                with open(os.path.join(pdir, "stat"), "r", encoding="utf-8", errors="replace") as f:
                    stat = f.read()
                rest = stat.rsplit(")", 1)[1].strip().split()
                ppid = int(rest[1]) if len(rest) > 1 else 0
            except Exception:
                ppid = 0
            try:
                with open(os.path.join(pdir, "comm"), "r", encoding="utf-8", errors="replace") as f:
                    pname = f.read().strip()
            except Exception:
                pname = ""
            try:
                with open(os.path.join(pdir, "cmdline"), "rb") as f:
                    cmd = f.read().replace(b"\x00", b" ").decode("utf-8", errors="replace").strip()
            except Exception:
                cmd = ""
            out[pid] = _proc(pid, ppid, pname, cmd)
    except Exception as e:
        A.log("codex process table (procfs) error: %r" % e)
    return out


def _ps_process_table():
    try:
        proc = subprocess.run(
            ["ps", "-axo", "pid=,ppid=,comm=,command="],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=4,
        )
        if proc.returncode != 0:
            return {}
        out = {}
        for line in proc.stdout.splitlines():
            parts = line.strip().split(None, 3)
            if len(parts) < 3:
                continue
            pid = _to_int(parts[0])
            if not pid:
                continue
            out[pid] = _proc(pid, parts[1], parts[2], parts[3] if len(parts) > 3 else "")
        return out
    except Exception as e:
        A.log("codex process table (ps) error: %r" % e)
        return {}


def process_table():
    """Best-effort pid -> process info map. Used once at Codex SessionStart."""
    if os.name == "nt":
        return _win_process_table()
    return _linux_process_table() or _ps_process_table()


def process_chain(start_pid=None, table=None, limit=32):
    """Return current process -> ancestors using a pre-read table when supplied."""
    table = table if table is not None else process_table()
    pid = _to_int(start_pid or os.getpid())
    chain = []
    seen = set()
    while pid and pid not in seen and len(chain) < limit:
        seen.add(pid)
        info = table.get(pid) or _proc(pid)
        chain.append(info)
        pid = _to_int(info.get("ppid"))
    return chain


_HOOK_MARKERS = (
    "codex_session_start.py",
    "codex_posttooluse.py",
    "codex_pretooluse.py",
    "codex_stop_capture.py",
    "codex_precompact_marker.py",
    "codex_process_watcher.py",
)


def is_codex_tui_process(proc):
    """True for the durable Codex CLI/TUI ancestor, not hook shim processes."""
    name = os.path.basename(str(proc.get("name") or "")).lower()
    cmd = str(proc.get("command") or "")
    cmd_l = cmd.lower().replace("\\", "/")
    if any(marker in cmd_l for marker in _HOOK_MARKERS):
        return False
    if name in {"codex", "codex.exe"}:
        return True
    if "@openai/codex" in cmd_l and ("bin/codex" in cmd_l or "node_modules" in cmd_l):
        return True
    return False


def select_codex_tui_process(chain):
    """Pick the nearest durable Codex ancestor from a current-process chain."""
    for proc in (chain or [])[1:]:
        if is_codex_tui_process(proc):
            return proc
    return None


def codex_tui_process(start_pid=None):
    return select_codex_tui_process(process_chain(start_pid=start_pid))


def process_is_alive(pid):
    pid = _to_int(pid)
    if not pid:
        return False
    if os.name == "nt":
        try:
            import ctypes

            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
            SYNCHRONIZE = 0x00100000
            WAIT_TIMEOUT = 0x00000102
            WAIT_OBJECT_0 = 0x00000000
            handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
            if not handle:
                return False
            try:
                rc = kernel32.WaitForSingleObject(handle, 0)
                return rc == WAIT_TIMEOUT
            finally:
                kernel32.CloseHandle(handle)
        except Exception:
            return False
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except Exception:
        return False


def _watcher_marker_path(session_id):
    return os.path.join(A.STATE_DIR, _safe_session_name(session_id) + ".codex-process-watcher.json")


def acquire_process_watcher_marker(session_id, pid):
    """Dedupe SessionStart/resume/compact hooks for the same session and Codex pid."""
    A._ensure_dirs()
    path = _watcher_marker_path(session_id)
    payload = {"pid": _to_int(pid), "started_at": A.now_iso()}
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        try:
            os.write(fd, json.dumps(payload).encode("utf-8"))
        finally:
            os.close(fd)
        return True
    except FileExistsError:
        try:
            with open(path, "r", encoding="utf-8") as f:
                old = json.load(f)
            old_pid = _to_int(old.get("pid"))
            if old_pid and process_is_alive(old_pid):
                return False
            os.remove(path)
            return acquire_process_watcher_marker(session_id, pid)
        except Exception:
            return False
    except Exception as e:
        A.log("codex watcher marker error: %r" % e)
        return True


def release_process_watcher_marker(session_id, pid=None):
    path = _watcher_marker_path(session_id)
    try:
        if pid is not None:
            with open(path, "r", encoding="utf-8") as f:
                old = json.load(f)
            if _to_int(old.get("pid")) != _to_int(pid):
                return
        os.remove(path)
    except Exception:
        pass


def process_watcher_enabled():
    return os.environ.get("AGENTLOG_CODEX_WATCH_PROCESS_EXIT", "1").strip().lower() not in _FALSEY


def start_process_watcher(session_id, cwd="", source="", transcript_path="", start_pid=None):
    """Spawn a detached watcher for the durable Codex TUI process, if discoverable."""
    if not process_watcher_enabled():
        return {"started": False, "reason": "disabled"}
    try:
        target = codex_tui_process(start_pid=start_pid)
        if not target:
            A.log("codex process watcher: no Codex TUI ancestor found")
            return {"started": False, "reason": "no_codex_process"}
        pid = _to_int(target.get("pid"))
        if not pid:
            return {"started": False, "reason": "no_pid"}
        if not acquire_process_watcher_marker(session_id, pid):
            return {
                "started": False,
                "reason": "already_running",
                "pid": pid,
                "name": target.get("name") or "",
            }
        argv = [
            sys.executable,
            os.path.join(HERE, "codex_process_watcher.py"),
            "--session",
            session_id or "unknown",
            "--pid",
            str(pid),
            "--cwd",
            cwd or "",
            "--source",
            source or "",
            "--process-name",
            target.get("name") or "",
            "--transcript",
            transcript_path or "",
        ]
        if A.spawn_detached(argv):
            A.log("codex process watcher: spawned for session=%s pid=%s" % (session_id, pid))
            return {"started": True, "pid": pid, "name": target.get("name") or ""}
        release_process_watcher_marker(session_id, pid)
        return {"started": False, "reason": "spawn_failed", "pid": pid}
    except Exception as e:
        A.log("codex process watcher start error (fail-open): %r" % e)
        return {"started": False, "reason": "error"}


def dictish(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def hook_tool_name(data):
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


def hook_tool_input(data):
    for key in ("tool_input", "toolInput", "input", "arguments", "args"):
        parsed = dictish(data.get(key))
        if parsed:
            return parsed
    for path in (
        ("tool_call", "arguments"),
        ("toolCall", "arguments"),
        ("tool", "input"),
        ("tool", "arguments"),
    ):
        parsed = dictish(_nested(data, *path))
        if parsed:
            return parsed
    return {}


def hook_session_id(data):
    return (
        data.get("session_id")
        or data.get("sessionId")
        or data.get("thread_id")
        or data.get("threadId")
        or data.get("conversation_id")
        or _nested(data, "session", "id")
        or _nested(data, "thread", "id")
    )


def hook_cwd(data):
    return (
        data.get("cwd")
        or data.get("working_directory")
        or data.get("workingDirectory")
        or _nested(data, "session", "cwd")
        or _nested(data, "workspace", "cwd")
        or os.getcwd()
    )


def hook_transcript_path(data, session_id=None, cwd=None):
    p = (
        data.get("transcript_path")
        or data.get("transcriptPath")
        or data.get("session_path")
        or data.get("sessionPath")
        or data.get("conversation_path")
        or data.get("conversationPath")
        or _nested(data, "session", "path")
        or _nested(data, "thread", "path")
    )
    if p and os.path.exists(p):
        return p
    return find_session_path(session_id=session_id, cwd=cwd)


def read_session_meta(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            first = f.readline().strip()
        if not first:
            return {}
        o = json.loads(first)
        if o.get("type") == "session_meta" and isinstance(o.get("payload"), dict):
            return dict(o["payload"])
    except Exception:
        return {}
    return {}


def session_id_from_transcript(path):
    meta = read_session_meta(path)
    if meta.get("id"):
        return meta["id"]
    name = os.path.basename(path)
    m = re.search(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", name, re.I)
    if m:
        return m.group(1)
    return os.path.splitext(name)[0]


def is_codex_transcript(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if not line.strip():
                    continue
                o = json.loads(line)
                return o.get("type") in {"session_meta", "turn_context", "event_msg", "response_item"}
    except Exception:
        return False
    return False


def _norm(p):
    return os.path.normcase(os.path.abspath(p or ""))


def _session_files():
    return glob.glob(os.path.join(CODEX_HOME, "sessions", "**", "*.jsonl"), recursive=True)


def find_session_path(session_id=None, cwd=None):
    files = _session_files()
    if session_id:
        hits = [p for p in files if session_id in os.path.basename(p)]
        if hits:
            hits.sort(key=os.path.getmtime, reverse=True)
            return hits[0]
    recent = sorted(files, key=os.path.getmtime, reverse=True)[:80]
    cwd_norm = _norm(cwd) if cwd else None
    for path in recent:
        meta = read_session_meta(path)
        if session_id and meta.get("id") == session_id:
            return path
        if cwd_norm and _norm(meta.get("cwd")) == cwd_norm:
            return path
    return recent[0] if recent and not session_id else ""


def transcript_size(path):
    return A.transcript_size(path)


def _payload_text(payload, *keys):
    for key in keys:
        v = payload.get(key)
        if isinstance(v, str) and v.strip():
            return v
    return ""


def _short_json_text(value, cap=MAX_ARG_CHARS):
    try:
        s = json.dumps(value, ensure_ascii=False, sort_keys=True)
    except Exception:
        s = str(value)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > cap:
        return s[: cap - 1].rstrip() + "..."
    return s


def tail_codex_assistant_text(path, max_bytes=131072, max_messages=24):
    """Return recent conversation-visible Codex assistant text.

    This intentionally reads only `event_msg/agent_message` rows from the tail of
    the transcript. Tool outputs, developer messages, and raw response items stay
    out of the intent scrape.
    """
    if not path or not os.path.exists(path):
        return ""
    try:
        size = os.path.getsize(path)
        start = max(0, size - max_bytes)
        with open(path, "rb") as f:
            f.seek(start)
            chunk = f.read()
        text = chunk.decode("utf-8", errors="replace")
        lines = text.splitlines()
        if start > 0 and lines:
            lines = lines[1:]  # drop a potentially partial JSONL row
        out = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            if o.get("type") != "event_msg":
                continue
            payload = o.get("payload") if isinstance(o.get("payload"), dict) else {}
            if payload.get("type") != "agent_message":
                continue
            txt = _payload_text(payload, "message", "text").strip()
            if txt:
                out.append(txt)
        if max_messages and len(out) > max_messages:
            out = out[-max_messages:]
        return "\n\n".join(out)
    except Exception as e:
        A.log("tail_codex_assistant_text error: %r" % e)
        return ""


def read_codex_transcript(path):
    """Return [{role,text,tools,ts}] from a Codex session JSONL.

    Only conversation-visible user/assistant messages and tool-call names are
    rehydrated. Developer/system messages and raw tool outputs are deliberately
    skipped so transcript artifacts do not become instructions to the extractor.
    """
    msgs = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                typ = o.get("type")
                payload = o.get("payload") if isinstance(o.get("payload"), dict) else {}
                ts = o.get("timestamp")
                if typ == "event_msg":
                    ptyp = payload.get("type")
                    if ptyp == "user_message":
                        txt = _payload_text(payload, "message", "text")
                        if txt.strip():
                            msgs.append({"role": "user", "text": txt, "tools": [], "ts": ts})
                    elif ptyp == "agent_message":
                        txt = _payload_text(payload, "message", "text")
                        if txt.strip():
                            msgs.append({"role": "assistant", "text": txt, "tools": [], "ts": ts})
                elif typ == "response_item" and payload.get("type") == "function_call":
                    name = payload.get("name") or "tool"
                    args = payload.get("arguments")
                    text = "TOOL CALL %s" % name
                    if args:
                        try:
                            parsed = json.loads(args) if isinstance(args, str) else args
                        except Exception:
                            parsed = args
                        text += ": " + _short_json_text(parsed)
                    msgs.append({"role": "assistant", "text": text, "tools": [name], "ts": ts})
    except Exception as e:
        A.log("read_codex_transcript error: %r" % e)
    return msgs


def codex_exec(instruction, context_text, cwd="", timeout=300, output_schema=CHECKPOINT_SCHEMA):
    """Run headless Codex for extraction with hooks disabled and no persistence."""
    child_env = dict(os.environ)
    child_env["AGENTLOG_DISABLE"] = "1"
    child_env.pop("AGENTLOG_CAPTURE_ACTIVE", None)
    child_env.pop("AGENTLOG_CODEX_CAPTURE_ACTIVE", None)

    out_path = None
    try:
        fd, out_path = tempfile.mkstemp(prefix="agentlog-codex-", suffix=".txt")
        os.close(fd)
        argv = [
            CODEX_BIN,
            "--disable",
            "hooks",
            "-C",
            cwd or os.getcwd(),
            "-a",
            "never",
            "-s",
            "read-only",
            "exec",
            "--disable",
            "hooks",
            "--ephemeral",
            "--skip-git-repo-check",
            "--color",
            "never",
            "-o",
            out_path,
        ]
        if output_schema:
            argv.extend(["--output-schema", output_schema])
        model = os.environ.get("AGENTLOG_CODEX_MODEL")
        if model:
            argv.extend(["-m", model])
        argv.append(instruction)
        run_kw = {}
        if os.name == "nt":
            run_kw["creationflags"] = 0x08000000  # CREATE_NO_WINDOW
        proc = subprocess.run(
            argv,
            input=context_text,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            env=child_env,
            **run_kw,
        )
        text = ""
        try:
            with open(out_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
        except Exception:
            text = proc.stdout or ""
        if proc.returncode != 0:
            A.log("codex exec exit %d: %s" % (proc.returncode, (proc.stderr or proc.stdout or "")[:500]))
            return text or None
        return text or proc.stdout
    except Exception as e:
        A.log("codex exec error: %r" % e)
        return None
    finally:
        if out_path:
            try:
                os.unlink(out_path)
            except Exception:
                pass
