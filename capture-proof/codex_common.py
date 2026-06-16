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
import tempfile

import agentlog_common as A


HOST = "codex"
CHECKPOINTS = os.path.join(A.AGENTLOG_DIR, "checkpoints.codex.jsonl")
ACTIVITY = os.path.join(A.AGENTLOG_DIR, "activity.codex.jsonl")
ARM_FILE = os.path.join(A.AGENTLOG_DIR, "codex.capture-active")
CODEX_HOME = os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex"))
CODEX_BIN = os.environ.get("AGENTLOG_CODEX_BIN") or ("codex.cmd" if os.name == "nt" else "codex")
MAX_ARG_CHARS = int(os.environ.get("AGENTLOG_CODEX_MAX_ARG_CHARS", "1200"))


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


def _nested(d, *path):
    cur = d
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


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


def codex_exec(instruction, context_text, cwd="", timeout=300):
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
