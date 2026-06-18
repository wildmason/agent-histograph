#!/usr/bin/env python3
"""
serve_ledger — runtime ledger-directory selection for the histograph board.

The board reads its workstream data from a ledger directory (`~/.agent-histograph`
by default; `AGENTLOG_DIR` overrides it at launch). That launch-time-only binding
was a silent foot-gun: double-clicking the built exe inherits no `AGENTLOG_DIR`, so
the sidecar read the EMPTY default while capture was writing to a different dir
(e.g. `~/.agentlog`) — the board rendered nothing with zero hint why.

This module adds a THIRD, highest-priority source: an in-app override the user can
change live (and that persists across restarts, even a bare double-click). Two hard
constraints shape it:

  1. The override config must live at a FIXED, ledger-INDEPENDENT path — storing it
     inside a ledger dir would be circular (you'd need to know the dir to learn which
     dir to read) and would not survive a swap. It lives at
     `~/.histograph/config.json` (redirect with HISTOGRAPH_CONFIG_DIR, resolved at
     call time for tests).
  2. It is a BOARD concern only. The capture producers keep writing to their own
     `AGENTLOG_DIR` — the override changes only what the board READS, preserving the
     capture/board decoupling.

Resolution precedence:  in-app override (if it points at a real dir)  >  AGENTLOG_DIR
(env or built-in default). A stale override pointing at a now-missing dir is ignored
so a bad persisted choice can never blank the board.

FAIL-OPEN throughout: any read/write error degrades to the configured default rather
than raising — the board must never 500 on a config-layer hiccup.
"""
import os
import glob
import json
import time
import tempfile

import agentlog_read as R
import agentlog_common as A


# --------------------------------------------------------------------------- #
# config path (fixed, ledger-independent; env-overridable for tests)
# --------------------------------------------------------------------------- #
def config_dir():
    """Dir holding the board's own config (NOT a ledger dir). Resolved at call time
    so HISTOGRAPH_CONFIG_DIR (tests) and the home default both take effect."""
    return os.environ.get("HISTOGRAPH_CONFIG_DIR") or os.path.join(
        os.path.expanduser("~"), ".histograph")


def config_path():
    return os.path.join(config_dir(), "config.json")


def _read_config():
    try:
        with open(config_path(), "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _write_config(data):
    """Persist the config dict atomically (tmp + os.replace). Fail-open."""
    path = config_path()
    d = os.path.dirname(path) or "."
    try:
        os.makedirs(d, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".config.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except Exception:
                    pass
    except Exception:
        pass


# --------------------------------------------------------------------------- #
# override get/set/clear
# --------------------------------------------------------------------------- #
def _norm(d):
    return os.path.abspath(os.path.expanduser(d)) if d else d


def load_override():
    """The persisted in-app ledger-dir override (normalized absolute path), or None.
    Does NOT check existence — resolved_dir() does that so the picker can still show a
    just-removed dir. Fail-open to None."""
    d = _read_config().get("ledgerDir")
    return d if isinstance(d, str) and d.strip() else None


def save_override(d):
    """Persist `d` as the in-app ledger-dir override (normalized). Fail-open."""
    cfg = _read_config()
    cfg["ledgerDir"] = _norm(d)
    _write_config(cfg)


def clear_override():
    """Drop the in-app override so the board falls back to AGENTLOG_DIR. Fail-open."""
    cfg = _read_config()
    if "ledgerDir" in cfg:
        cfg.pop("ledgerDir", None)
        _write_config(cfg)


# --------------------------------------------------------------------------- #
# UI preferences (theme / scheme / zoom)
#
# These live in the SAME ledger-independent config as the override, and for the same
# reason: the desktop app serves the board on an EPHEMERAL port (`serve --port 0`), so
# the browser origin changes every launch and origin-scoped localStorage is wiped —
# settings stored only client-side don't survive a close/reopen. Persisting them here
# (and injecting them into the served HTML for first paint) makes them durable across
# launches and ports.
# --------------------------------------------------------------------------- #
def load_prefs():
    """The persisted UI prefs ({theme, variant, zoom}), only the keys actually set.
    Validated to the right types so a corrupt config can't poison the boot. Fail-open
    to {}."""
    ui = _read_config().get("ui")
    if not isinstance(ui, dict):
        return {}
    out = {}
    for k in ("theme", "variant"):
        v = ui.get(k)
        if isinstance(v, str) and v.strip():
            out[k] = v
    z = ui.get("zoom")
    if isinstance(z, (int, float)) and not isinstance(z, bool):
        out["zoom"] = z
    return out


def save_prefs(partial):
    """Merge a partial {theme?, variant?, zoom?} into the persisted UI prefs (other keys
    untouched, so a zoom change can't drop the theme). Ignores unknown keys / bad types.
    Fail-open; returns the merged prefs."""
    cfg = _read_config()
    ui = dict(cfg.get("ui") or {}) if isinstance(cfg.get("ui"), dict) else {}
    p = partial or {}
    for k in ("theme", "variant"):
        if isinstance(p.get(k), str) and p[k].strip():
            ui[k] = p[k]
    if isinstance(p.get("zoom"), (int, float)) and not isinstance(p.get("zoom"), bool):
        ui["zoom"] = p["zoom"]
    cfg["ui"] = ui
    _write_config(cfg)
    return load_prefs()


# --------------------------------------------------------------------------- #
# resolution
# --------------------------------------------------------------------------- #
def resolved_dir():
    """The directory the board ACTUALLY reads: a valid in-app override, else
    AGENTLOG_DIR (env/default). A non-directory override is ignored (fail-safe)."""
    ov = load_override()
    if ov and os.path.isdir(ov):
        return ov
    return A.AGENTLOG_DIR


def active_source():
    """Why the current dir is in effect: 'override' (in-app), 'env' (AGENTLOG_DIR set),
    or 'default' (built-in). Drives the settings readout so the user can see the wiring."""
    ov = load_override()
    if ov and os.path.isdir(ov):
        return "override"
    return "env" if os.environ.get("AGENTLOG_DIR") else "default"


# --------------------------------------------------------------------------- #
# stats + discovery
# --------------------------------------------------------------------------- #
def _iso(epoch):
    if not epoch:
        return None
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(epoch))


def _has_ledger_files(d):
    """True iff `d` holds at least one histograph ledger file. Keeps the candidate
    picker from surfacing unrelated dotfolders (~/.agents etc.)."""
    try:
        return bool(glob.glob(os.path.join(d, "checkpoints*.jsonl"))
                    or glob.glob(os.path.join(d, "activity*.jsonl")))
    except Exception:
        return False


def _dir_quickstats(d):
    """(sessions, last_iso) for a ledger dir via a single STREAMING pass — distinct
    session_ids + newest timestamp — without building a sorted+indexed Ledger or
    retaining the records. This keeps the candidate picker cheap and bounded no matter
    how large a candidate dir is (it only needs counts, not the parsed structure — the
    earlier 3.9s /api/ledger was a full parse per candidate over the 158MB residue).
    Mirrors what dir_stats derived from a Ledger: session_ids union both streams;
    activity stamps live in `ts`, checkpoints in `captured_at`. Fail-open to (0, None)."""
    sids = set()
    max_ts = 0.0
    for pat, ts_key in (("checkpoints*.jsonl", "captured_at"), ("activity*.jsonl", "ts")):
        for path in glob.glob(os.path.join(d, pat)):
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            rec = json.loads(line)
                        except Exception:
                            continue
                        sid = rec.get("session_id")
                        if sid:
                            sids.add(sid)
                        t = R.parse_ts(rec.get(ts_key))
                        if t > max_ts:
                            max_ts = t
            except OSError:
                continue
    return len(sids), (_iso(max_ts) if max_ts else None)


def dir_stats(d, ledger=None):
    """Describe a ledger dir for the picker / diagnostic: {dir, exists, sessions,
    lastActivity (UTC-Z|None), hasData}. `ledger`, if given, is reused (the hot
    /api/state path already has the active Ledger loaded) to avoid a re-read; otherwise
    a lightweight streaming quick-scan (no full Ledger build) is used so multi-dir
    candidate discovery stays cheap. Fail-open: a read error degrades to zero counts."""
    exists = bool(d) and os.path.isdir(d)
    sessions, last = 0, None
    if exists:
        try:
            if ledger is not None:
                sessions = len(ledger.session_ids())
                ts = 0.0
                for a in ledger.activity:
                    ts = max(ts, R.parse_ts(a.get("ts")))
                for c in ledger.checkpoints:
                    ts = max(ts, R.parse_ts(c.get("captured_at")))
                last = _iso(ts) if ts else None
            else:
                sessions, last = _dir_quickstats(d)
        except Exception:
            sessions, last = 0, None
    return {"dir": d, "exists": exists, "sessions": sessions,
            "lastActivity": last, "hasData": sessions > 0}


def _candidate_paths(home):
    """Ordered, de-duped absolute paths worth offering as ledger choices: the current
    + configured default first, then the conventional histograph/agentlog namespaces,
    then any `~/.*agent*` / `~/.*histograph*` dotfolder. Existence/ledger-file filtering
    happens in candidates()."""
    seen = []

    def add(d):
        if not d:
            return
        ad = _norm(d)
        if ad not in seen:
            seen.append(ad)

    add(resolved_dir())
    add(A.AGENTLOG_DIR)
    add(os.path.join(home, ".agent-histograph"))
    add(os.path.join(home, ".agentlog"))
    for pat in (".agent*", ".*agentlog*", ".*histograph*"):
        try:
            for p in sorted(glob.glob(os.path.join(home, pat))):
                if os.path.isdir(p):
                    add(p)
        except Exception:
            continue
    return seen


def candidates(home=None):
    """Detected ledger dirs for the in-app picker. Each entry is dir_stats(...) plus
    `isCurrent` / `isDefault`. Only dirs that hold ledger files (or are the current /
    default) are offered, so the list reads as real choices, not every dotfolder.
    Sorted: current first, then most-sessions, then path."""
    home = home or os.path.expanduser("~")
    cur = _norm(resolved_dir())
    default = _norm(A.AGENTLOG_DIR)
    out = []
    for d in _candidate_paths(home):
        if not (_has_ledger_files(d) or d == cur or d == default):
            continue
        st = dir_stats(d)
        st["isCurrent"] = (d == cur)
        st["isDefault"] = (d == default)
        out.append(st)
    out.sort(key=lambda s: (not s["isCurrent"], -s["sessions"], s["dir"]))
    return out


def info(home=None):
    """The GET /api/ledger envelope: where the board points, why, and the choices."""
    return {
        "current": resolved_dir(),
        "source": active_source(),
        "default": A.AGENTLOG_DIR,
        "candidates": candidates(home=home),
    }


def describe_active(ledger=None):
    """The `ledger` block embedded in /api/state, so the renderer's empty-state can
    name the dir being read and flag a likely misconfiguration. Reuses the already-
    loaded active Ledger when passed (zero extra I/O on the poll path)."""
    describe = dir_stats(resolved_dir(), ledger=ledger)
    describe["source"] = active_source()
    return describe
