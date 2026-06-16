#!/usr/bin/env python3
"""
serve_epics — the epics layer of `agentlog serve` (the histograph).

Epics are a HUMAN-DECLARED grouping of stories that gives the board a roadmap band.
This module owns the only persistent state the histograph writes: `epics.json` (the
declared epic->story links) and `histograph-focus.json` (the persisted focus lane).

Stored fields are human-declared ONLY (id, title, project, integrity, ORDERED
stories, createdAt). `done` / `total` / `roadmapSegments` / `outcome` are NEVER
stored — they are always DERIVED at read time from the live story states
(serve_state.roadmap_progress / story_state). This keeps the roadmap honest: it can
never claim "done" for a story whose session isn't actually finished.

Auto scoping-conversation extraction is DEFERRED + flagged: an epic stays
integrity:"reconstructed" until a human runs `epic confirm`, which flips it to
"human-confirmed".

FAIL-OPEN: a missing or corrupt epics.json loads as an empty store; a malformed
epic entry is dropped by validate() and never crashes the board.

Paths resolve A.AGENTLOG_DIR at CALL time (not import time) so the env override
(AGENTLOG_DIR) and tests both take effect. The module-level EPICS_PATH / FOCUS_PATH
are kept as a convenience snapshot but the functions use the live resolvers.
"""
import os
import json
import tempfile

import agentlog_common as A
import serve_state as S

SCHEMA_VERSION = "0.1"
_VALID_INTEGRITY = ("reconstructed", "human-confirmed")


# --------------------------------------------------------------------------- #
# path resolvers (live — honour AGENTLOG_DIR overrides + tests)
# --------------------------------------------------------------------------- #
def epics_path():
    return os.path.join(A.AGENTLOG_DIR, "epics.json")


def focus_path():
    return os.path.join(A.AGENTLOG_DIR, "state", "histograph-focus.json")


def dismissed_path():
    return os.path.join(A.AGENTLOG_DIR, "state", "histograph-dismissed.json")


# convenience module constants (snapshot at import; functions above are canonical)
EPICS_PATH = epics_path()
FOCUS_PATH = focus_path()


# --------------------------------------------------------------------------- #
# schema validation
# --------------------------------------------------------------------------- #
def validate(raw):
    """Drop invalid epic entries, keep + normalize valid ones. An entry is valid iff
    it is a dict with a non-empty string `id` and a string `title`. `stories` must be
    a list of strings (a non-list stories field invalidates the entry — silent
    coercion would lie about the roadmap). Missing optional fields are defaulted.
    Returns a clean list[dict] of stored-shape epics; never raises."""
    if not isinstance(raw, dict):
        return []
    out = []
    seen = set()
    for e in (raw.get("epics") or []):
        if not isinstance(e, dict):
            continue
        eid = e.get("id")
        title = e.get("title")
        if not isinstance(eid, str) or not eid.strip():
            continue
        if not isinstance(title, str) or not title.strip():
            continue
        if eid in seen:
            continue
        stories = e.get("stories", [])
        if stories is None:
            stories = []
        if not isinstance(stories, list) or not all(isinstance(s, str) for s in stories):
            continue   # a malformed stories list invalidates the epic (don't fake order)
        integrity = e.get("integrity")
        if integrity not in _VALID_INTEGRITY:
            integrity = "reconstructed"
        seen.add(eid)
        out.append({
            "id": eid,
            "title": title,
            "project": e.get("project") if isinstance(e.get("project"), str) else None,
            "integrity": integrity,
            "stories": list(stories),
            "createdAt": e.get("createdAt") if isinstance(e.get("createdAt"), str) else None,
        })
    return out


# --------------------------------------------------------------------------- #
# load / save (fail-open; atomic)
# --------------------------------------------------------------------------- #
def load():
    """Load the EpicStore. Fail-open empty on missing/corrupt file. The store is a
    dict {schema_version, epics:[...]} with epics already validated."""
    try:
        with open(epics_path(), "r", encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        return {"schema_version": SCHEMA_VERSION, "epics": []}
    except Exception:
        return {"schema_version": SCHEMA_VERSION, "epics": []}
    return {"schema_version": raw.get("schema_version", SCHEMA_VERSION)
            if isinstance(raw, dict) else SCHEMA_VERSION,
            "epics": validate(raw)}


def save(store):
    """Persist the store atomically (tmp file in the same dir + os.replace). Only the
    stored-shape fields are written — never a derived done/total. Fail-open: a write
    error is swallowed so the board never 500s on a read-mostly path."""
    path = epics_path()
    d = os.path.dirname(path) or "."
    try:
        os.makedirs(d, exist_ok=True)
        clean = {"schema_version": store.get("schema_version", SCHEMA_VERSION),
                 "epics": validate(store)}
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".epics.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(clean, f, ensure_ascii=False, indent=2)
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
# mutations
# --------------------------------------------------------------------------- #
def _slugify(text):
    slug = "".join(c.lower() if c.isalnum() else "-" for c in (text or ""))
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def add_epic(store, title, project):
    """Create a new epic with a slug id, integrity='reconstructed', empty stories.
    Returns the new epic dict (also appended to store['epics']). Idempotent on id:
    a duplicate slug gets a numeric suffix so two epics with the same title coexist."""
    base = "epic-" + (_slugify(title) or "untitled")
    eid = base
    existing = {e.get("id") for e in store.get("epics", [])}
    n = 2
    while eid in existing:
        eid = "%s-%d" % (base, n)
        n += 1
    epic = {
        "id": eid,
        "title": title,
        "project": project,
        "integrity": "reconstructed",
        "stories": [],
        "createdAt": A.now_iso(),
    }
    store.setdefault("epics", []).append(epic)
    return epic


def _find(store, epic_id):
    for e in store.get("epics", []):
        if e.get("id") == epic_id:
            return e
    return None


def link_story(store, epic_id, story_id, *, index=None):
    """Link a story into an epic at the end, or at `index` if given. Idempotent: a
    story already linked is not duplicated (a re-link with an index also no-ops to
    preserve the existing order). Returns the updated epic (or None if not found)."""
    epic = _find(store, epic_id)
    if epic is None:
        return None
    stories = epic.setdefault("stories", [])
    if story_id in stories:
        return epic   # idempotent: never duplicate, never reorder on a re-link
    if index is None or index < 0 or index > len(stories):
        stories.append(story_id)
    else:
        stories.insert(index, story_id)
    return epic


def confirm_epic(store, epic_id, new_title=None):
    """Flip an epic to integrity='human-confirmed' (a human has vouched for the
    reconstructed grouping); optionally rename it. Returns the epic (or None)."""
    epic = _find(store, epic_id)
    if epic is None:
        return None
    epic["integrity"] = "human-confirmed"
    if new_title:
        epic["title"] = new_title
    return epic


def epic_for_story(store, story_id):
    """The epic whose ordered stories contain story_id, or None."""
    if not story_id:
        return None
    for e in store.get("epics", []):
        if story_id in (e.get("stories") or []):
            return e
    return None


# --------------------------------------------------------------------------- #
# list (DERIVES done/total/segments live)
# --------------------------------------------------------------------------- #
def list_epics(store, ledger, *, now_epoch=None):
    """The /api/epics list: every stored epic + DERIVED done/total. done/total are
    computed live from the linked story states via serve_state.roadmap_progress, so
    they always reflect current reality and are never persisted. `ledger` may be None
    (then everything reads not-started -> done 0)."""
    rows = []
    for e in store.get("epics", []):
        if ledger is not None:
            done, total, _ = S.roadmap_progress(e, ledger, now_epoch=now_epoch)
        else:
            done, total = 0, len(e.get("stories") or [])
        rows.append({
            "id": e.get("id"),
            "title": e.get("title"),
            "project": e.get("project"),
            "integrity": e.get("integrity", "reconstructed"),
            "stories": list(e.get("stories") or []),
            "done": done,
            "total": total,
            "createdAt": e.get("createdAt"),
        })
    return rows


# --------------------------------------------------------------------------- #
# focus persistence
# --------------------------------------------------------------------------- #
def load_focus():
    """The persisted focus terminal id, or None. Fail-open."""
    try:
        with open(focus_path(), "r", encoding="utf-8") as f:
            data = json.load(f)
        tid = data.get("terminalId") if isinstance(data, dict) else None
        return tid if isinstance(tid, str) and tid else None
    except Exception:
        return None


def save_focus(terminal_id):
    """Persist the focused terminal id atomically. Fail-open."""
    path = focus_path()
    d = os.path.dirname(path) or "."
    try:
        os.makedirs(d, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".focus.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump({"terminalId": terminal_id}, f)
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
# manual dismissals (close-out). A lane the user dismisses stays hidden until it
# does new work; keyed by the stable public terminal id, valued by the dismiss
# epoch so serve_state can compare against last_work_ts ("returns on new work").
# --------------------------------------------------------------------------- #
def load_dismissed():
    """Map of terminal-id → dismissed-at epoch (float). Fail-open to {}: a missing
    or corrupt file, or a non-numeric value, never breaks the board."""
    try:
        with open(dismissed_path(), "r", encoding="utf-8") as f:
            raw = json.load(f)
    except Exception:
        return {}
    out = {}
    for tid, ts in ((raw.get("dismissed") or {}).items()
                    if isinstance(raw, dict) else []):
        try:
            out[str(tid)] = float(ts)
        except (TypeError, ValueError):
            continue
    return out


def _write_dismissed(mapping):
    """Persist the dismissal map atomically. Fail-open."""
    path = dismissed_path()
    d = os.path.dirname(path) or "."
    try:
        os.makedirs(d, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=d, prefix=".dismissed.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump({"dismissed": mapping}, f)
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except Exception:
                    pass
    except Exception:
        pass


def dismiss_terminal(terminal_id, at_epoch):
    """Record (or refresh) a manual dismissal for a lane at `at_epoch`. The lane is
    hidden until it logs work newer than this. Fail-open; returns the new map."""
    m = load_dismissed()
    try:
        m[str(terminal_id)] = float(at_epoch)
    except (TypeError, ValueError):
        return m
    _write_dismissed(m)
    return m


def undismiss_terminal(terminal_id):
    """Clear a manual dismissal so the lane returns immediately. Fail-open."""
    m = load_dismissed()
    if str(terminal_id) in m:
        m.pop(str(terminal_id), None)
        _write_dismissed(m)
    return m
