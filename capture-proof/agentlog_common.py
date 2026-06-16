"""
Shared helpers for the §6.2.1 capture-prompt proof hooks + harness.

Design invariants (from the spec):
- FAIL-OPEN. A hook must NEVER block or crash the agent. Any error → allow the
  action, log to file, emit nothing problematic to stdout. (§8.1)
- KILL SWITCH. AGENTLOG_DISABLE=1 makes every hook an instant no-op. (§9)
- ARMED-ONLY NUDGING. The Stop hook only *injects the capture prompt* when
  AGENTLOG_CAPTURE_ACTIVE=1 is set in that session's environment. Installed but
  un-armed, the hooks only passively log — so wiring them globally cannot disrupt
  your normal sessions. Arm it only in the controlled fixture terminal.
- JSONL SUBSTRATE ONLY. Everything writes to ~/.agentlog/*.jsonl. No SQLite, no
  MCP, no daemon (those are forbidden pre-Gate-B, §6.0).
"""
import os, sys, json, time, re

HOME = os.path.expanduser("~")
AGENTLOG_DIR = os.environ.get("AGENTLOG_DIR", os.path.join(HOME, ".agentlog"))
CHECKPOINTS = os.path.join(AGENTLOG_DIR, "checkpoints.jsonl")
ACTIVITY = os.path.join(AGENTLOG_DIR, "activity.jsonl")
STATE_DIR = os.path.join(AGENTLOG_DIR, "state")
HOOK_LOG = os.path.join(AGENTLOG_DIR, "hook.log")

def _ensure_dirs():
    try:
        os.makedirs(AGENTLOG_DIR, exist_ok=True)
        os.makedirs(STATE_DIR, exist_ok=True)
    except Exception:
        pass

def disabled():
    return os.environ.get("AGENTLOG_DISABLE", "") == "1"

def armed():
    return os.environ.get("AGENTLOG_CAPTURE_ACTIVE", "") == "1"

def now_iso():
    # DST-correct local offset: time.timezone is the NON-DST offset, so using it
    # year-round stamps ADT records as -04:00 and skews every parsed epoch by 1h.
    lt = time.localtime()
    off = -(time.altzone if (time.daylight and lt.tm_isdst) else time.timezone)
    sign = "+" if off >= 0 else "-"
    off = abs(off)
    return time.strftime("%Y-%m-%dT%H:%M:%S", lt) + "%s%02d:%02d" % (sign, off // 3600, (off % 3600) // 60)

_LOG_MAX_BYTES = 5 * 1024 * 1024   # rotate hook.log at 5 MB (retention floor, §10)

def log(msg):
    _ensure_dirs()
    try:
        try:
            if os.path.getsize(HOOK_LOG) > _LOG_MAX_BYTES:
                old = HOOK_LOG + ".1"
                if os.path.exists(old):
                    os.remove(old)
                os.replace(HOOK_LOG, old)
        except OSError:
            pass
        with open(HOOK_LOG, "a", encoding="utf-8") as f:
            f.write("%s  %s\n" % (now_iso(), msg))
    except Exception:
        pass

def read_stdin_json():
    try:
        # lstrip a UTF-8 BOM: Windows PowerShell pipes prepend one, and depending on
        # the stdin codec it arrives as U+FEFF (utf-8 decode) OR as the three raw
        # bytes ï»¿ (cp1252 decode of EF BB BF). Either form makes json.loads reject
        # an otherwise valid payload (found in live smoke 2026-06-09).
        raw = sys.stdin.read().lstrip("﻿\xef\xbb\xbf")
        return json.loads(raw) if raw.strip() else {}
    except Exception as e:
        log("stdin parse error: %r" % e)
        return {}

def append_jsonl(path, obj):
    _ensure_dirs()
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")
        return True
    except Exception as e:
        log("append_jsonl(%s) error: %r" % (path, e))
        return False

# ---- per-session state (small JSON marker) ----
def _state_path(sid):
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", sid or "unknown")
    return os.path.join(STATE_DIR, safe + ".json")

def load_state(sid):
    try:
        with open(_state_path(sid), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"phase": "idle", "last_capture_size": 0, "n_checkpoints": 0}

def save_state(sid, st):
    _ensure_dirs()
    try:
        with open(_state_path(sid), "w", encoding="utf-8") as f:
            json.dump(st, f)
    except Exception as e:
        log("save_state error: %r" % e)

# ---- Claude Code transcript reading ----
def transcript_size(path):
    try:
        return os.path.getsize(path)
    except Exception:
        return 0

def _content_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for it in content:
            if isinstance(it, dict) and it.get("type") == "text" and isinstance(it.get("text"), str):
                out.append(it["text"])
        return "\n".join(out)
    return ""

def read_transcript(path):
    """Return a list of {role, text, tools:[names], ts} from a Claude Code transcript jsonl."""
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
                m = o.get("message")
                if not isinstance(m, dict):
                    continue
                role = m.get("role")
                if role not in ("user", "assistant"):
                    continue
                tools = []
                c = m.get("content")
                if isinstance(c, list):
                    for it in c:
                        if isinstance(it, dict) and it.get("type") == "tool_use":
                            tools.append(it.get("name", "?"))
                msgs.append({"role": role, "text": _content_text(c),
                             "tools": tools, "ts": o.get("timestamp")})
    except Exception as e:
        log("read_transcript error: %r" % e)
    return msgs

def last_assistant_text(msgs):
    for m in reversed(msgs):
        if m["role"] == "assistant" and m["text"].strip():
            return m["text"]
    return ""

_JSON_BLOCK = re.compile(r"```json\s*(\{.*?\})\s*```", re.DOTALL)

def extract_checkpoint(text):
    """Pull the last fenced ```json {...} ``` block the agent emitted and parse it."""
    matches = _JSON_BLOCK.findall(text or "")
    if not matches:
        # tolerate a bare json object if the whole reply is one
        t = (text or "").strip()
        if t.startswith("{") and t.endswith("}"):
            matches = [t]
    for raw in reversed(matches):
        try:
            return json.loads(raw)
        except Exception:
            continue
    return None

# ---- capture mode (quiet out-of-band vs inline block-and-reprompt) ----
def mode():
    """'quiet' (default) = out-of-band extraction, invisible in the TUI.
       'inline' = the §6.2.1-validated block-once-and-reprompt path (visible)."""
    return (os.environ.get("AGENTLOG_CAPTURE_MODE", "quiet") or "quiet").strip().lower()

def debounce_secs():
    """Min seconds between quiet captures per session (coalesces bursts of quick turns)."""
    try:
        return max(0, int(os.environ.get("AGENTLOG_CAPTURE_DEBOUNCE_SECS", "120")))
    except Exception:
        return 120

def now_epoch():
    return time.time()

def should_capture(trigger, grew, last_capture_at, now, debounce):
    """Pure decision for quiet mode. Capture only if the transcript grew since the last
    capture; a Stop is additionally debounced, but a PreCompact or SessionEnd boundary
    bypasses the debounce (capture before context is lost / the session goes away —
    a debounced final Stop followed by terminal exit was a structural recall hole)."""
    if not grew:
        return False
    if trigger in ("precompact", "session_end"):
        return True
    return (now - last_capture_at) >= debounce

# ---- §10 redaction (shared single source: render-side AND write-side) ----
# Moved here from agentlog_read so the producers can redact AT WRITE TIME: the
# ledger at rest is a durable plaintext artifact in the home dir, so a rationale
# quoting a connection string must never be stored verbatim. agentlog_read
# re-exports these for the render path (same patterns, one source of truth).
_SECRET_SUBS = [
    (re.compile(r"(?i)\bauthorization\s*[:=]\s*.+"), "Authorization: [redacted]"),
    (re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._\-]+"), "Bearer [redacted]"),
    (re.compile(r"(?i)\b([a-z][a-z0-9+.\-]*)://[^\s:@/]+:[^\s@/]+@"), r"\1://[redacted]@"),
    (re.compile(r"(?i)\b(api[_-]?key|secret|access[_-]?token|client[_-]?secret|"
                r"password|passwd|pwd|token)\b\s*[:=]\s*\S+"), r"\1=[redacted]"),
    (re.compile(r"\bsk-[A-Za-z0-9]{16,}\b"), "[redacted-key]"),
    (re.compile(r"\b(?:ghp|gho|ghs|ghr)_[A-Za-z0-9]{20,}\b"), "[redacted-token]"),
    (re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"), "[redacted-token]"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "[redacted-aws-key]"),
    (re.compile(r"(?i)\bxox[baprs]-[A-Za-z0-9-]{10,}\b"), "[redacted-slack-token]"),
]

def redact(text):
    """Strip obvious secrets (§10). Benign prose is untouched."""
    if not text:
        return ""
    s = str(text)
    for pat, repl in _SECRET_SUBS:
        s = pat.sub(repl, s)
    return s

def redact_tree(obj):
    """Recursively redact every string value in a JSON-shaped object. Used by the
    extractors so checkpoint text is redacted BEFORE it is appended to the ledger
    (at-rest safety), not only at render time. Keys are left untouched."""
    if isinstance(obj, str):
        return redact(obj)
    if isinstance(obj, list):
        return [redact_tree(v) for v in obj]
    if isinstance(obj, dict):
        return {k: redact_tree(v) for k, v in obj.items()}
    return obj

def git_branch(cwd, max_up=6):
    """Current git branch for cwd, by reading .git/HEAD directly (no subprocess —
    keeps hooks inside the latency budget). Walks up max_up levels for repo root;
    handles worktree `.git` files (`gitdir: <path>`). Returns '' when not a repo,
    and 'detached:<sha12>' on a detached HEAD. Closes the §9 producer-gap where
    branch_or_worktree appeared in no Gate-B payload purely because the cheap
    producer never captured it."""
    try:
        d = os.path.abspath(cwd or os.getcwd())
        for _ in range(max_up):
            dotgit = os.path.join(d, ".git")
            head = None
            if os.path.isdir(dotgit):
                head = os.path.join(dotgit, "HEAD")
            elif os.path.isfile(dotgit):
                with open(dotgit, "r", encoding="utf-8", errors="replace") as f:
                    first = f.readline().strip()
                if first.startswith("gitdir:"):
                    head = os.path.join(first[len("gitdir:"):].strip(), "HEAD")
            if head and os.path.isfile(head):
                with open(head, "r", encoding="utf-8", errors="replace") as f:
                    line = f.readline().strip()
                if line.startswith("ref: refs/heads/"):
                    return line[len("ref: refs/heads/"):]
                return ("detached:" + line[:12]) if line else ""
            parent = os.path.dirname(d)
            if parent == d:
                break
            d = parent
    except Exception:
        pass
    return ""

# ---- capture pipeline guards (§8.1 spend envelope + single-flight) ----
def max_captures_per_day():
    try:
        return max(1, int(os.environ.get("AGENTLOG_MAX_CAPTURES_PER_DAY", "200")))
    except Exception:
        return 200

def _cap_path():
    return os.path.join(STATE_DIR, "captures-%s.count" % time.strftime("%Y%m%d"))

def capture_cap_allows():
    """Global daily ceiling on headless model calls for capture, so the control
    plane can never starve the real work's quota (§8.1 non-degradation). Fail-open:
    an unreadable counter allows the capture."""
    try:
        with open(_cap_path(), "r", encoding="utf-8") as f:
            return int(f.read().strip() or 0) < max_captures_per_day()
    except Exception:
        return True

def increment_capture_count():
    _ensure_dirs()
    try:
        n = 0
        try:
            with open(_cap_path(), "r", encoding="utf-8") as f:
                n = int(f.read().strip() or 0)
        except Exception:
            pass
        with open(_cap_path(), "w", encoding="utf-8") as f:
            f.write(str(n + 1))
    except Exception:
        pass

_BREAKER_THRESHOLD = 3
_BREAKER_PAUSE_SECS = 1800

def _breaker_path():
    return os.path.join(STATE_DIR, "capture-breaker.json")

def breaker_allows(now=None):
    """Consecutive-failure breaker: after 3 straight extraction failures, pause
    captures for 30 min rather than burning a model call per turn against a down/
    rate-limited API. Fail-open on any read error."""
    now = time.time() if now is None else now
    try:
        with open(_breaker_path(), "r", encoding="utf-8") as f:
            st = json.load(f)
        if int(st.get("consecutive_failures", 0)) >= _BREAKER_THRESHOLD:
            return (now - float(st.get("last_failure_at", 0))) >= _BREAKER_PAUSE_SECS
        return True
    except Exception:
        return True

def record_capture_failure(now=None):
    _ensure_dirs()
    now = time.time() if now is None else now
    st = {"consecutive_failures": 0, "last_failure_at": 0}
    try:
        with open(_breaker_path(), "r", encoding="utf-8") as f:
            st = json.load(f)
    except Exception:
        pass
    st["consecutive_failures"] = int(st.get("consecutive_failures", 0)) + 1
    st["last_failure_at"] = now
    try:
        with open(_breaker_path(), "w", encoding="utf-8") as f:
            json.dump(st, f)
    except Exception:
        pass

def reset_breaker():
    try:
        os.remove(_breaker_path())
    except Exception:
        pass

_LOCK_STALE_SECS = 600

def acquire_capture_lock(sid):
    """Single-flight per session: a Stop-spawned and PreCompact-spawned extractor for
    the same session must not race on last_capture_msg_count and double-extract the
    same segment. Atomic O_CREAT|O_EXCL; a lock older than 10 min is broken as stale
    (a dead extractor must not wedge capture — fail-open). Returns True if acquired."""
    _ensure_dirs()
    path = os.path.join(STATE_DIR, re.sub(r"[^A-Za-z0-9_.-]", "_", sid or "unknown") + ".capture.lock")
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return True
    except FileExistsError:
        try:
            if time.time() - os.path.getmtime(path) > _LOCK_STALE_SECS:
                os.remove(path)
                return acquire_capture_lock(sid)
        except Exception:
            pass
        return False
    except Exception:
        return True   # fail-open: a broken lock layer must not stop capture

def release_capture_lock(sid):
    try:
        os.remove(os.path.join(STATE_DIR,
                  re.sub(r"[^A-Za-z0-9_.-]", "_", sid or "unknown") + ".capture.lock"))
    except Exception:
        pass

def spawn_detached(argv):
    """Fire-and-forget a child that OUTLIVES this hook, so capture runs out-of-band with
    zero turn-end latency and nothing on the hook's stdout (the only documented way to
    keep the capture exchange invisible in the TUI). Inherits env (armed flag, dirs).
    Fail-open: returns False if the spawn fails."""
    import subprocess
    try:
        kw = dict(stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.name == "nt":
            # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW
            kw["creationflags"] = 0x00000008 | 0x00000200 | 0x08000000
        else:
            kw["start_new_session"] = True
        subprocess.Popen(argv, **kw)
        return True
    except Exception as e:
        log("spawn_detached error: %r" % e)
        return False
