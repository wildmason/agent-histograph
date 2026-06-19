#!/usr/bin/env python3
"""
serve_state — the pure derivation core of `agentlog serve` (the histograph).

Given a read-only Ledger (agentlog_read.Ledger) and the validated list of epics,
produce the FROZEN `/api/state` dict the thin JS renderer consumes. ALL logic
lives here so it is unit-testable in Python; there is no I/O, no http, no HTML.

The histograph is a "where is every agent right now, and what is the live story"
board. It reuses the Gate-B read surface verbatim (Ledger.session_state /
status_board / project_of / session_ids / acked_ids) and projects it onto the
spec's wire shape:

  terminal lane   <- one live session (a "term-N")
  story           <- the session's working thread (its latest checkpoint summary)
  epic            <- a human-declared epics.json grouping of stories (DERIVED done/total)
  task trail      <- the session's checkpoints/decisions, oldest->newest, live tag last

FAIL-OPEN is a hard contract requirement: a single malformed session must drop
that lane and keep the rest, never raise. Every per-terminal derivation is wrapped.

Contract field <- real ledger field mapping (verified against ~/.agent-histograph/*.jsonl):
  provider        <- checkpoint/activity `host` (claude-code|cli|codex|gemini)
  project         <- Ledger.project_of (checkpoint `project` / cwd basename)
  status          <- Ledger.session_state.status + §4 ack lifecycle + freshness
  freshness       <- now_epoch - session_state.last_activity_ts
  story.title     <- latest checkpoint `summary`
  statusLine      <- blocking ask `question` (needs-you) else `next_action` (status)
  task.kind       <- re-decided `topic` -> supersedes; high `class` -> milestone;
                     decision -> decision; touched_paths -> step; newest -> live; pending
  task.integrity  <- `_valid` / `human_involved` / `materiality` (map_integrity)
  task.at         <- checkpoint `captured_at`
  task.reversal   <- prior decision summary + per-decision `reversibility`
"""
import os
import time

import agentlog_read as R

# --- module constants: tests pin the boundaries against these ---------------- #
STALE_SECS = 1800        # idle beyond this -> the lane reads danger/stale
MIDTURN_SECS = 600       # idle under this -> "mid-turn" (the agent is actively working)
LIVE_WINDOW_SECS = 86400 # a session older than this is no longer a live lane

# Lifecycle / meta activity records that are NOT real work. They must not reset a
# lane's freshness clock or keep it "live": a session_end fires its own ts ≈ now,
# so without this a JUST-CLOSED lane would read as the freshest on the board (idle
# ≈ 0 → "mid-turn") and linger a full LIVE_WINDOW before aging out.
_META_ACT_TYPES = frozenset((
    "session_end", "capture_attempt", "capture_result", "suspected_gap",
    "pretool_material_signal",
))
# session_end `source`/`reason` values that mean the human actually EXITED the
# session (→ auto-drop the lane). "clear" is a context reset where the same
# terminal keeps working, so it is deliberately NOT terminal.
_TERMINAL_END_SOURCES = frozenset(("prompt_input_exit", "logout", "other", "process_exit"))

# decision classes that warrant a "milestone" marker + needs-attention weight
_HIGH_CLASSES = {"billing", "license", "auth", "migration", "data_loss"}


# --------------------------------------------------------------------------- #
# small helpers
# --------------------------------------------------------------------------- #
def _iso(epoch):
    """epoch seconds -> ISO-8601 UTC (Z). 0/None -> None."""
    if not epoch:
        return None
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(epoch))


def _norm_ts(raw):
    """Normalize a ledger `captured_at`/`ts` string to ISO-8601 UTC-Z for the wire, so
    every timestamp in /api/state is in the same form as `generatedAt` (a client can
    compute "how long ago" against generatedAt without per-field offset parsing).
    Conservative + fail-open: an unparseable-but-present string is passed through
    unchanged (better a raw local-offset stamp than a dropped timestamp); None/empty
    stays None. Equal-instant with the raw value — only the rendering zone changes."""
    if not raw:
        return None
    if not isinstance(raw, str):
        return raw
    epoch = R.parse_ts(raw)
    return _iso(epoch) or raw


def _truthy(v):
    """Normalize a possibly-stringy boolean ("true"/"True") to a real bool —
    models emit human_involved as the string "true" (mirrors R._is_truthy)."""
    if v is True:
        return True
    if isinstance(v, str):
        return v.strip().lower() == "true"
    return False


def terminal_id(session_id):
    """Stable, deterministic 'term-N' from a session id. Uses a stable hash of the
    id so the same session always renders as the same lane id across polls (the
    renderer keys DOM nodes off it). Never collides for distinct ids in practice."""
    sid = session_id or "unknown"
    # FNV-1a 32-bit — deterministic across runs (unlike hash()), short, stable.
    h = 2166136261
    for ch in sid.encode("utf-8"):
        h = ((h ^ ch) * 16777619) & 0xFFFFFFFF
    return "term-%d" % (h % 100000)


def provider_of(ledger, sid):
    """host -> claude|codex|gemini|unknown. Prefers the most recent record that
    actually carries a `host` (checkpoints do; many activity records don't), so a
    session whose latest record is a host-less stop_boundary still attributes to the
    producer that wrote its checkpoints — not 'unknown'."""
    host = ""
    try:
        cps = ledger._cps(sid)
        acts = ledger._acts(sid)
        # newest-first across both streams; take the first record with a host.
        for src in list(reversed(cps)) + list(reversed(acts)):
            h = (src.get("host") or "").strip().lower()
            if h:
                host = h
                break
    except Exception:
        host = ""
    if host in ("claude-code", "claude", "cli"):
        return "claude"
    if host == "codex":
        return "codex"
    if host == "gemini":
        return "gemini"
    return "unknown"


# --------------------------------------------------------------------------- #
# status / freshness / status-line
# --------------------------------------------------------------------------- #
def derive_status(sess_state, now_epoch):
    """Map the read surface's session_state.status onto the contract's vocabulary:
        waiting   -> needs-you   (a blocking ask is open and un-acked)
        archived  -> done        (idle past the read-surface idle floor)
        stale     -> stale       (substantial passive activity since last checkpoint)
        active    -> active
    needs-you collapses to active once the blocking ask is acked, because the read
    surface already drops acked needs-Matt items before computing `waiting` — so this
    is the §4 ack-by-id lifecycle, not a stale high-water mark."""
    status = (sess_state or {}).get("status")
    if status == "waiting":
        return "needs-you"
    if status == "archived":
        return "done"
    if status == "stale":
        return "stale"
    return "active"


def derive_freshness(sess_state, now_epoch):
    """(label, tone) from idle seconds since last activity.
        idle < MIDTURN_SECS      -> ("mid-turn", "muted")   agent is actively turning
        MIDTURN_SECS..STALE_SECS -> ("<n>m", "warning")     cooling off
        idle > STALE_SECS        -> ("<n>m", "danger")      stale
    The boundary is inclusive on the fresh side: exactly STALE_SECS still reads warning."""
    now = time.time() if now_epoch is None else now_epoch
    last = (sess_state or {}).get("last_activity_ts") or 0.0
    idle = max(0.0, now - last) if last else 1e18
    if idle < MIDTURN_SECS:
        return "mid-turn", "muted"
    mins = int(round(idle / 60.0))
    if idle > STALE_SECS:
        return ("%dm" % mins), "danger"
    return ("%dm" % mins), "warning"


def reconcile_tone(status, tone):
    """Reconcile the (orthogonal) freshness tone against the lane's status so the
    board never paints an attention lane as calm. status (needs-you / stale) and
    tone (idle-time) answer different questions, but a lane shouting "needs you" or
    "stale" rendered 'muted' reads as calm at a glance — directly contradicting the
    single most important thing on the board. A needs-you or stale lane therefore
    never emits 'muted'; its tone is floored to at least 'warning' (a 'danger' tone
    stays danger). 'active'/'done' lanes keep their raw idle-time tone untouched."""
    if status in ("needs-you", "stale") and tone == "muted":
        return "warning"
    return tone


def status_line(sess_state):
    """{text, kind}. A blocking ask makes it a needs-you line carrying the question;
    otherwise a status line carrying the latest next_action."""
    sess = sess_state or {}
    for nm in (sess.get("needs_matt") or []):
        if nm.get("kind") == "blocking_ask" and nm.get("detail"):
            return {"text": nm["detail"], "kind": "needs-you"}
    latest = sess.get("last_checkpoint") or {}
    text = ""
    if isinstance(latest, dict):
        text = (latest.get("next_action") or latest.get("summary") or "").strip()
    return {"text": text, "kind": "status"}


# --------------------------------------------------------------------------- #
# attention state (#3): needs-you + stuck/loop — a channel ABOVE freshness
# --------------------------------------------------------------------------- #
# A loop is "the same tool+args repeated with no progress". Pinned by tests; expose
# as constants so tuning after live observation is a one-line change.
STUCK_WINDOW = 8        # how many recent tool_use calls the loop check looks back over
STUCK_THRESHOLD = 3     # a signature seen >= this many times in the window -> "stuck"

# unit separator — joins (tool, args) into one opaque signature string. Chosen so it
# can never appear inside a tool name or a path/command and collide two distinct calls.
_SIG_SEP = "\x1f"


def _stuck_signature(rec):
    """A stable signature for a tool_use record = (tool, FULL normalized args), so a
    repeated identical action can be detected as a loop. Uses the full args — sorted
    paths joined, else the redacted command, else the observe target — NOT
    _activity_label's basename-only target, which would false-positive across
    same-named files in different directories. Returns "" for a record with neither a
    tool nor any args (it can't meaningfully participate in loop detection)."""
    rec = rec or {}
    tool = (rec.get("tool") or "").strip().lower()
    paths = rec.get("paths")
    cmd = rec.get("command")
    obs = rec.get("target")
    if isinstance(paths, list) and paths:
        arg = "|".join(sorted(str(p or "").strip() for p in paths))
    elif isinstance(cmd, str) and cmd.strip():
        arg = cmd.strip()
    elif isinstance(obs, str) and obs.strip():
        arg = obs.strip()
    else:
        arg = ""
    if not tool and not arg:
        return ""
    return tool + _SIG_SEP + arg


def derive_attention_state(ledger, sid, *, now_epoch=None, sess_state=None,
                           window=STUCK_WINDOW, threshold=STUCK_THRESHOLD):
    """The lane's ATTENTION channel — orthogonal to, and rendered ABOVE, freshness:

        needsYou — the lane is blocked on an open, un-acked blocking ask. Delegates
                   to the read surface (session_state.status == 'waiting'), which is
                   already idle- and ack-by-id-aware. NOTE: no raw transcript text is
                   available at derive time, so "the turn ended in a question" is read
                   as "the extractor recorded an open blocking ask" — accuracy is
                   bounded by the extractor's ask-capture rate, not by this code.
        stuck    — the lane keeps firing the SAME (tool, args) with no progress: one
                   tool_use signature repeats >= `threshold` times within the most
                   recent `window` tool_use records. Pure over the tool_use stream;
                   meta/lifecycle records are excluded by construction (we look only
                   at type == 'tool_use'), so they neither count nor shift the window.

    Returns {kind, needsYou, stuck, stuckSignature, stuckCount}. `kind` is the single
    resolved tone the board paints: 'needs-you' wins over 'stuck'; both-false -> None
    (the object is still present with needsYou/stuck False). Fail-open: a read error
    yields the all-false shape so a corrupt session can never break /api/state."""
    needs_you = False
    try:
        ss = sess_state if sess_state is not None else \
            ledger.session_state(sid, now_epoch=now_epoch)
        needs_you = (ss or {}).get("status") == "waiting"
    except Exception:
        needs_you = False

    stuck, sig, count = False, None, 0
    try:
        tools = [a for a in ledger._acts(sid)
                 if isinstance(a, dict) and a.get("type") == "tool_use"]
        win = tools[-window:] if window else tools
        counts = {}
        for a in win:
            s = _stuck_signature(a)
            if not s:
                continue
            counts[s] = counts.get(s, 0) + 1
        if counts:
            top_sig, top_count = max(counts.items(), key=lambda kv: kv[1])
            if top_count >= threshold:
                stuck, sig, count = True, top_sig, top_count
    except Exception:
        stuck, sig, count = False, None, 0

    kind = "needs-you" if needs_you else ("stuck" if stuck else None)
    return {
        "kind": kind,
        "needsYou": bool(needs_you),
        "stuck": bool(stuck),
        "stuckSignature": sig if stuck else None,
        "stuckCount": count if stuck else 0,
    }


# --------------------------------------------------------------------------- #
# story identity + state
# --------------------------------------------------------------------------- #
def _ledger_cache(ledger, name):
    """A per-Ledger memo dict, created lazily on the Ledger instance. Scoped to the
    Ledger's life, so it is valid exactly as long as the parsed data is: a new poll
    that re-parses gets fresh caches, and the V1 Ledger cache (reused while the ledger
    FILES are unchanged) correctly reuses these too — story ids and branches can't
    drift without a ledger change. Returns None if `ledger` can't hold attributes."""
    try:
        c = getattr(ledger, name, None)
        if c is None:
            c = {}
            setattr(ledger, name, c)
        return c
    except Exception:
        return None


def _branch_for(ledger, cwd):
    """R.A.git_branch(cwd) memoized for the life of this Ledger. Branch resolution
    reads .git/HEAD (a handful of filesystem stats, walking up to 6 levels) and
    story_id_for is evaluated once per terminal AND once per session inside the story
    index — so without a cache the same cwd is resolved dozens of times per poll. ''
    for a falsy cwd, exactly as the inline `if cwd else ''` did."""
    if not cwd:
        return ""
    cache = _ledger_cache(ledger, "_branch_memo")
    if cache is None:
        return R.A.git_branch(cwd)
    if cwd not in cache:
        cache[cwd] = R.A.git_branch(cwd)
    return cache[cwd]


def story_id_for(ledger, sid):
    """Stable slug for the story a session is working — the link target an epic
    references. Derived from (project, branch, cwd-leaf) so the same workstream
    keeps the same id across sessions/restarts. Deterministic; memoized per Ledger
    (the value cannot change for a fixed parse, and it is recomputed per terminal +
    once per session in the story index, so caching collapses that to one per sid)."""
    if sid is None:
        return None
    memo = _ledger_cache(ledger, "_story_id_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    try:
        project = ledger.project_of(sid) or "?"
        cps = ledger._cps(sid)
        acts = ledger._acts(sid)
        src = (cps[-1] if cps else None) or (acts[-1] if acts else {}) or {}
        cwd = src.get("cwd") or ""
        branch = _branch_for(ledger, cwd)
        leaf = os.path.basename(cwd.rstrip("\\/")) if cwd else ""
    except Exception:
        project, branch, leaf = (sid or "?"), "", ""
    raw = "%s|%s|%s" % (project, branch, leaf)
    slug = "".join(c.lower() if c.isalnum() else "-" for c in raw).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    story_id = "st-" + (slug or "x")
    if memo is not None:
        memo[sid] = story_id
    return story_id


def _story_sids_index(ledger):
    """story_id -> [sids] for every session, built ONCE per Ledger and cached. This
    replaces the O(sessions) rescan inside _sessions_for_story — which was itself
    called per-story per-epic from roadmap_progress/story_state, making the old cost
    O(stories × sessions) branch resolutions per poll. Buckets keep session_ids()
    order (the order _sessions_for_story produced). A sid whose story_id_for raises is
    skipped, mirroring the old per-sid try/except."""
    idx = getattr(ledger, "_story_sids_memo", None)
    if idx is not None:
        return idx
    idx = {}
    for sid in ledger.session_ids():
        try:
            st = story_id_for(ledger, sid)
        except Exception:
            continue
        if st:
            idx.setdefault(st, []).append(sid)
    try:
        ledger._story_sids_memo = idx
    except Exception:
        pass
    return idx


def _sessions_for_story(ledger, story_id):
    """All session ids whose story_id_for == story_id (a workstream can span several
    sessions that share project|branch|cwd-leaf). Empty when none map. Returns a fresh
    list (a copy of the cached index bucket) so a caller can't mutate the index."""
    if not story_id:
        return []
    return list(_story_sids_index(ledger).get(story_id, []))


def _session_for_story(ledger, story_id):
    """Reverse-lookup: a live session whose story_id_for == story_id, if any.
    (Kept for callers wanting a representative sid; story_state itself no longer
    relies on which one this returns — it aggregates over ALL of them.)"""
    s = _sessions_for_story(ledger, story_id)
    return s[0] if s else None


# state salience: a story is only as "done" as its least-finished live lane.
# blocked (a live lane needs you) > active (a live lane is working) > done (every
# lane archived) > not-started (no lane). This ordering is what makes story_state
# a single canonical answer regardless of which sid a caller passes.
_STATE_RANK = {"blocked": 3, "active": 2, "done": 1, "not-started": 0}


def _state_of_session(ledger, sid, now):
    """The per-session contribution to a story's state. waiting->blocked,
    archived->done, else active. Corrupt/unknown -> not-started."""
    if sid is None:
        return "not-started"
    try:
        sess = ledger.session_state(sid, now_epoch=now)
    except Exception:
        return "not-started"
    status = sess.get("status")
    if status == "waiting":
        return "blocked"
    if status == "archived":
        return "done"
    return "active"


def story_state(ledger, sid, story_id, epic, *, now_epoch=None):
    """done|active|not-started|blocked for a story — a SINGLE canonical answer.

    A story_id can collapse several live sessions (same project|branch|cwd-leaf).
    The state is the MOST SALIENT across every session that maps to the story, so
    the roadmap segment (tier 1, called with sid=None) and the story rail (tier 2,
    called with the focused sid) never disagree about the same story id:
        - any live session has an open blocking ask -> blocked
        - else any live session is active/stale      -> active
        - else every mapped session is archived      -> done
        - else no session maps                        -> not-started

    `sid`, if given, is folded into the same aggregate (it always maps to this
    story_id), so passing an older archived lane can never under-report a story
    that still has a live blocked lane.
    """
    now = time.time() if now_epoch is None else now_epoch
    sids = list(_sessions_for_story(ledger, story_id)) if story_id else []
    if sid is not None and sid not in sids:
        sids.append(sid)
    if not sids:
        return "not-started"
    best = "not-started"
    for s in sids:
        st = _state_of_session(ledger, s, now)
        if _STATE_RANK.get(st, 0) > _STATE_RANK.get(best, 0):
            best = st
    return best


# --------------------------------------------------------------------------- #
# tasks (the per-session trail) + reversal + integrity
# --------------------------------------------------------------------------- #
def map_integrity(record):
    """Integrity provenance of a task, from the real ledger fields (there is no
    literal integrity_class field; it is derived):
        checkpoint with _valid is False        -> reconstructed
        human_involved truthy                  -> human-confirmed
        a material decision (record materiality)-> volunteered
        a passive activity record (no decision) -> passive
    """
    rec = record or {}
    if rec.get("_valid") is False:
        return "reconstructed"
    if _truthy(rec.get("human_involved")):
        return "human-confirmed"
    # a decision-shaped record that the agent volunteered but a human has not weighed.
    # materiality values are matched against the REAL ledger vocabulary: a `record`
    # (the agent logged the decision) or an `ask_now` (the agent surfaced it for a
    # human) is volunteered; `suppress` (the agent chose NOT to surface it) is not
    # treated as volunteered on materiality alone. A decision-shaped record always
    # counts as volunteered via its choice/topic regardless of materiality.
    if rec.get("materiality") in ("record", "ask_now") or rec.get("choice") or rec.get("topic"):
        return "volunteered"
    return "passive"


def classify_kind(record):
    """decision|supersedes|milestone|step for a recorded item. (live/pending are
    assigned positionally by build_tasks, not here.)"""
    rec = record or {}
    cls = (rec.get("class") or "").strip().lower()
    if cls in _HIGH_CLASSES:
        return "milestone"
    if rec.get("choice") or rec.get("topic"):
        return "decision"
    return "step"


def detect_reversal(record, prior_tasks):
    """Return a reversal dict if `record` (a decision) re-decides a topic already in
    prior_tasks; else None. True-positive only when the topic matches an earlier
    decision task; no false positive for a brand-new topic or empty history."""
    rec = record or {}
    topic = (rec.get("topic") or "").strip().lower()
    if not topic:
        return None
    # only a prior DECISION-class task can be superseded — a re-decision reverses an
    # earlier decision, never a passive 'step'/'live'/'pending' node. Without this
    # gate any prior task that happened to carry a colliding free-text topic (topic is
    # an uncontrolled agent field) would mint a spurious supersede. build_tasks today
    # blanks topic on steps, but detect_reversal is public and must not rely on that.
    _DECISION_KINDS = ("decision", "supersedes", "milestone")
    for prior in reversed(prior_tasks or []):
        if prior.get("kind") not in _DECISION_KINDS:
            continue
        if (prior.get("topic") or "").strip().lower() == topic:
            return {
                "supersededSummary": prior.get("summary") or prior.get("topic") or "",
                "supersededAt": prior.get("at"),
                "supersededTaskId": prior.get("id"),
                "reversibility": (rec.get("reversibility") or "medium"),
            }
    return None


# how many in-flight tool actions (since the last checkpoint) the trail shows.
# Bounded so a long turn's tool stream can't flood the decision history.
_ACTIVITY_LIMIT = 10

# cap for a node's `detail` second line (the tool's first-party `desc`, the intent's
# `why`) — long enough to carry the reasoning, short enough to stay one or two lines.
_DETAIL_CAP = 200

# how many of a COMPLETED turn's tool calls the per-task accordion carries. A
# completed task folds its turn's tool stream behind a click-to-expand disclosure;
# this bounds the payload (the true count rides alongside as `toolCount`).
_TURN_TOOL_LIMIT = 50


def _tool_calls_in_window(tool_acts, lo_epoch, hi_epoch):
    """One completed turn's tool calls — the `tool_use` records with
    lo_epoch < ts <= hi_epoch, OLDEST->NEWEST. Returns (nodes, true_count): each
    node is {tool, target, at}; the list is capped to the most recent
    _TURN_TOOL_LIMIT while true_count keeps the real total for the accordion
    header. lo_epoch=None means 'from the beginning' (the first turn)."""
    win = []
    for a in tool_acts:
        ts = R.parse_ts(a.get("ts"))
        if ts is None:
            continue
        if lo_epoch is not None and ts <= lo_epoch:
            continue
        if hi_epoch is not None and ts > hi_epoch:
            continue
        win.append(a)
    count = len(win)
    nodes = []
    for a in win[-_TURN_TOOL_LIMIT:]:
        tool, target = _activity_label(a)
        nodes.append({"tool": tool or "tool", "target": target,
                      "desc": R.clean(a.get("desc") or "", _DETAIL_CAP), "at": a.get("ts")})
    return nodes, count


def _activity_label(rec):
    """(tool, target) for a tool_use activity record. target = the file BASENAME
    for path-ops (with a '+N' when several), else a cleaned command string, else
    "". Commands/paths are already redacted at write time; we only shorten."""
    rec = rec or {}
    tool = (rec.get("tool") or "").strip()
    paths = rec.get("paths")
    cmd = rec.get("command")
    obs = rec.get("target")
    if isinstance(paths, list) and paths:
        first = str(paths[0] or "")
        base = os.path.basename(first.rstrip("\\/")) or first
        target = base + ((" +%d" % (len(paths) - 1)) if len(paths) > 1 else "")
    elif isinstance(cmd, str) and cmd.strip():
        target = cmd.strip()
    elif isinstance(obs, str) and obs.strip():
        # a read/search/web/sub-agent observation — already basename'd / cleaned at
        # write time; this is what lets the trail move during exploration, not just edits.
        target = obs.strip()
    else:
        target = ""
    return tool, R.clean(target, 80)


def _activity_tail(ledger, sid, since_epoch):
    """The in-flight tool stream for a session: `tool_use` activity records
    written AFTER the last checkpoint (the current turn's work), OLDEST->NEWEST,
    capped to the most recent _ACTIVITY_LIMIT. These are the live 'what's
    happening now' nodes the decision trail (checkpoints, captured at turn-end)
    does NOT otherwise contain — rendering them is what makes the board move in
    real time mid-turn. When a checkpoint lands its turn's tool_use fall at/before
    that checkpoint's timestamp, so the tail empties and the trail consolidates to
    the new checkpoint. Fail-open: returns [] on any read error."""
    try:
        acts = ledger._acts(sid)
    except Exception:
        return []
    tools = []
    for a in acts:
        if not isinstance(a, dict) or a.get("type") != "tool_use":
            continue
        if since_epoch is not None:
            ts = R.parse_ts(a.get("ts"))
            if ts is not None and ts <= since_epoch:
                continue
        tools.append(a)
    nodes = []
    for i, a in enumerate(tools[-_ACTIVITY_LIMIT:]):
        tool, target = _activity_label(a)
        nodes.append({
            "id": "act-%d" % i, "kind": "activity", "tool": tool or "tool",
            "summary": target,
            # the agent's first-party one-liner for this action (Bash `description`),
            # surfaced as the activity node's second line. "" when the tool carried none.
            "detail": R.clean(a.get("desc") or "", _DETAIL_CAP),
            "at": a.get("ts"), "topic": "", "reversal": None,
            "now": False,
        })
    return nodes


def _intent_tasks(ledger, sid):
    """First-party DECLARED-INTENT entries for a session: the `intent` activity records
    the agent volunteered as it started a task ("what I'm doing and why"), OLDEST->NEWEST.
    Unlike a reconstructed decision (a later model pass INFERS the rationale), these carry
    the agent's OWN stated why — captured live, verbatim. They persist in the trail as the
    first-party 'why', distinct from (and durable across) any decision that later lands for
    the same work. integrity is always 'volunteered'. Fail-open: [] on any read error."""
    try:
        acts = ledger._acts(sid)
    except Exception:
        return []
    out = []
    for i, a in enumerate(acts):
        if not isinstance(a, dict) or a.get("type") != "intent":
            continue
        title = R.clean(a.get("title") or "", 240)
        if not title:
            continue
        out.append({
            "id": "intent-%d" % i,
            "kind": "intent",
            "summary": title,
            "detail": R.clean(a.get("why") or "", _DETAIL_CAP),
            "integrity": "volunteered",
            "at": a.get("ts"),
            "topic": "",
            "reversal": None,
        })
    return out


def _first_pending_todo(items):
    """The next UPCOMING item in a TodoWrite snapshot: the first 'pending' item's content
    (what comes next, distinct from the in-progress 'now'). None when nothing is pending —
    the agent is on the last item and has nothing queued, so this channel yields no 'next'."""
    if not isinstance(items, list):
        return None
    for it in items:
        if isinstance(it, dict) and (it.get("status") or "").strip().lower() == "pending":
            content = (it.get("content") or "").strip()
            if content:
                return content
    return None


def _first_party_next(ledger, sid):
    """The agent's OWN most-recent statement of the next task — the deterministic
    replacement for the reconstructed `next_action` guess (the "next item is a best guess,
    often wrong/stale" fix). Two first-party channels, NEWEST-by-timestamp wins so a fresh
    plan update supersedes an older declaration:
        • a declared `▸ next:` sigil  -> {source:'declared', text, why, at}
        • the live TodoWrite plan     -> {source:'todo', text=first pending item, why:'', at}
    Returns the winning candidate dict, or None when the agent has declared neither.
    Fail-open: None on any read error."""
    try:
        acts = ledger._acts(sid)
    except Exception:
        return None
    best = None  # (epoch, candidate)
    for a in acts:
        if not isinstance(a, dict):
            continue
        typ = a.get("type")
        if typ == "next":
            text = R.clean(a.get("task") or "", 240)
            if not text:
                continue
            cand = {"source": "declared", "text": text,
                    "why": R.clean(a.get("why") or "", _DETAIL_CAP), "at": a.get("ts")}
        elif typ == "todos":
            content = _first_pending_todo(a.get("items"))
            if not content:
                continue
            cand = {"source": "todo", "text": R.clean(content, 240), "why": "",
                    "at": a.get("ts")}
        else:
            continue
        e = R.parse_ts(a.get("ts"))
        e = e if e is not None else 0.0
        if best is None or e >= best[0]:   # newest wins; ties favor the later record
            best = (e, cand)
    return best[1] if best else None


def _live_edge_ts(t):
    """The effective sort time of a trail task for intent-weaving. The in-flight live
    edge (an activity now-tip, or a bloomed 'live' checkpoint) and the trailing 'pending'
    anchor to the END of the trail regardless of clock — so a declared intent, even one
    the producer stamps in the SAME (second-resolution) instant, can never displace the
    pulsing NOW card or sort below the ghosted next. Everything else sorts by its real ts."""
    if t.get("now") or t.get("kind") == "live" or not t.get("at"):
        return float("inf")
    return R.parse_ts(t.get("at"))


def _weave_intents(tasks, intents):
    """Insert declared-intent tasks into an already-ordered trail by timestamp (stable):
    an intent sorts ABOVE the first existing NON-intent task at-or-after its instant, so
    the intent the agent declared lands just above that turn's decision/tools even when the
    producer stamps both in the same (second-resolution) second. The live edge (the NOW
    tip / bloomed 'live') and the trailing 'pending' are pinned to the end (_live_edge_ts
    -> inf), so an intent never displaces the pulsing tip. Intents sharing a second keep
    their own declaration order (an already-woven same-second intent is not pushed below a
    later one). A missing/garbage `at` (parse_ts -> 0.0) degrades to the trail tail rather
    than anchoring the intent to 1970 at the very top."""
    if not intents:
        return tasks
    result = list(tasks)
    for it in intents:
        it_ts = R.parse_ts(it.get("at")) or float("inf")
        pos = len(result)
        for i, t in enumerate(result):
            eff = _live_edge_ts(t)
            # stop before the first task strictly newer, OR one that ties this instant but
            # is NOT itself an intent — so the intent lands above its same-second decision/
            # tool, yet after any same-second intent already woven in (order preserved).
            if eff > it_ts or (eff == it_ts and t.get("kind") != "intent"):
                pos = i
                break
        result.insert(pos, it)
    return result


def build_tasks(ledger, sid, *, include_activity=False, working_now=False):
    """The task trail for one session, OLDEST->NEWEST. Each checkpoint contributes:
      - one task per decision (kind decision|milestone|supersedes, integrity mapped),
        carrying topic so a later re-decision can detect a reversal;
      - else a 'step' task from the checkpoint summary (touched_paths work).
    The pulsing live edge ("● now") — the in-flight tool tip, or a 'live' bloom on the
    newest checkpoint when no tool is in flight — appears ONLY when `working_now` (a
    tool fired within ACTIVE_SECS). When the lane is idle (task done), nothing pulses
    "now": the newest checkpoint reads as a plain completed decision, not a stuck tip.
    If the latest checkpoint declares a next_action, a trailing kind:'pending' task
    with at:null is appended LAST. Fail-open: a malformed checkpoint is skipped."""
    tasks = []
    try:
        cps = ledger._cps(sid)
    except Exception:
        cps = []
    # For the focused trail we also bind each COMPLETED turn's tool calls to its
    # checkpoint task (the accordion). Gather the session's tool_use once, then walk
    # checkpoints with a moving window: the tools in (prev_cp, this_cp] are this
    # turn's work. (Only when include_activity — sibling/idle trails stay lean.)
    tool_acts = []
    if include_activity:
        try:
            tool_acts = [a for a in ledger._acts(sid)
                         if isinstance(a, dict) and a.get("type") == "tool_use"]
        except Exception:
            tool_acts = []
    prev_epoch = None
    for c in cps:
        if not isinstance(c, dict):
            continue
        at = c.get("captured_at")
        cid = c.get("checkpoint_id")
        decisions = c.get("decisions")
        start = len(tasks)
        emitted = False
        if isinstance(decisions, list):
            for i, d in enumerate(decisions):
                if not isinstance(d, dict):
                    continue
                kind = classify_kind(d)
                rev = detect_reversal(d, tasks)
                if rev is not None:
                    kind = "supersedes"
                tasks.append({
                    "id": "tk-%s-%d" % (cid or "x", i),
                    "kind": kind,
                    "summary": R.clean(d.get("choice") or d.get("topic") or "", 240),
                    # the decision's rationale — the "why" a future reader needs. The
                    # transcript surfaces it as the entry's second line; "" when the
                    # producer logged a choice without a rationale (degrade to title-only).
                    "detail": R.clean(d.get("rationale") or "", 240),
                    "integrity": map_integrity(d),
                    "at": at,
                    "topic": (d.get("topic") or ""),   # internal: reversal matching
                    "reversal": rev,
                })
                emitted = True
        if not emitted:
            # a passive/working checkpoint with no decisions -> one step task
            tasks.append({
                "id": "tk-%s" % (cid or "x"),
                "kind": "step",
                "summary": R.clean(c.get("summary") or "", 240),
                # a passive/working checkpoint carries no decision rationale; the step
                # is one line. ("" so the transcript renders title-only, not an empty row.)
                "detail": "",
                "integrity": map_integrity(c),
                "at": at,
                "topic": "",
                "reversal": None,
            })
        # bind this turn's tool calls to the checkpoint's LAST emitted task — the
        # node that represents the turn — and advance the window. A turn's tools
        # can't be bound to a specific decision within a multi-decision checkpoint
        # (passive facts don't carry that link), so they hang off the turn's tail.
        this_epoch = R.parse_ts(at)
        if include_activity and this_epoch is not None and len(tasks) > start:
            nodes, count = _tool_calls_in_window(tool_acts, prev_epoch, this_epoch)
            if nodes:
                tasks[-1]["_toolCalls"] = nodes
                tasks[-1]["_toolCount"] = count
        if this_epoch is not None:
            prev_epoch = this_epoch

    # In-flight tool stream + live edge. The pulsing "● now" appears ONLY while the
    # lane is actually working (working_now). Append the tool_use nodes recorded SINCE
    # the last checkpoint regardless (they're the in-progress turn's record), but:
    #   • working_now + in-flight tools -> the most recent tool is the live tip (now).
    #   • working_now + no in-flight tool (a checkpoint just landed) -> the newest
    #     checkpoint blooms 'live'.
    #   • idle (not working_now) -> NOTHING pulses; the newest checkpoint reads as a
    #     plain completed decision. (Fixes "a finished task stays '● now' forever".)
    last_cp_epoch = None
    if cps and isinstance(cps[-1], dict):
        last_cp_epoch = R.parse_ts(cps[-1].get("captured_at"))
    activity = _activity_tail(ledger, sid, last_cp_epoch) if include_activity else []
    if activity:
        if working_now:
            activity[-1]["now"] = True   # live edge — only while the lane works
        tasks.extend(activity)
    elif working_now and tasks and tasks[-1].get("kind") != "supersedes":
        # actively working, no in-flight tool yet -> the newest checkpoint blooms
        # 'live'. A supersede keeps kind=="supersedes" so its `reversal` survives the
        # wire-strip and the renderer draws the stitch instead of a plain live tip.
        tasks[-1]["kind"] = "live"

    # trailing "next" — the agent's OWN declared/planned next task supersedes the
    # reconstructed `next_action` guess (the "next item is a best guess, often wrong/stale"
    # fix). First-party channels (a `▸ next:` sigil, the TodoWrite plan) are read only on the
    # focused trail; provenance (`source`) + a `stale` flag ride the wire so the renderer can
    # weight a first-party statement (volunteered ◈) over a reconstruction (◇) and never paint
    # a guess as authoritatively as the agent's own word.
    fp = _first_party_next(ledger, sid) if include_activity else None
    if fp:
        # 'stale' only for an explicit DECLARATION overtaken by a later checkpoint (the agent
        # consolidated a whole turn after declaring without re-stating it). A TodoWrite plan is
        # current by construction; a reconstructed guess carries its tentativeness in provenance.
        stale = False
        if fp["source"] == "declared" and last_cp_epoch is not None:
            at = R.parse_ts(fp.get("at"))
            stale = at is not None and at < last_cp_epoch
        tasks.append({
            "id": "tk-pending", "kind": "pending",
            "summary": R.clean(fp["text"], 240), "detail": fp.get("why") or "",
            "integrity": "volunteered", "at": None, "topic": "", "reversal": None,
            "_nextSource": fp["source"], "_nextStale": stale,
        })
    else:
        latest = cps[-1] if cps else None
        na = (latest.get("next_action") or "").strip() if isinstance(latest, dict) else ""
        if na:
            tasks.append({
                "id": "tk-pending", "kind": "pending",
                "summary": R.clean(na, 240), "detail": "",
                "integrity": "reconstructed", "at": None, "topic": "", "reversal": None,
                "_nextSource": "reconstructed", "_nextStale": False,
            })

    # weave first-party DECLARED-INTENT entries into the trail by timestamp. Only on the
    # focused trail (include_activity) — sibling trails stay lean. These persist as the
    # agent's verbatim "why", so they survive even after the reconstructed decision lands.
    if include_activity:
        tasks = _weave_intents(tasks, _intent_tasks(ledger, sid))

    # strip the internal 'topic' helper from the wire shape; keep reversal only on
    # supersedes; normalize every timestamp to UTC-Z (consistent with generatedAt).
    out = []
    for t in tasks:
        wire = {"id": t["id"], "kind": t["kind"], "summary": t["summary"],
                "detail": t.get("detail") or "",
                "integrity": t.get("integrity"), "at": _norm_ts(t["at"])}
        if t["kind"] == "supersedes" and t.get("reversal"):
            rev = dict(t["reversal"])
            rev["supersededAt"] = _norm_ts(rev.get("supersededAt"))
            wire["reversal"] = rev
        if t["kind"] == "activity":
            # the in-flight tool node carries its tool name + live-edge flag.
            wire["tool"] = t.get("tool") or "tool"
            wire["now"] = bool(t.get("now"))
        if t["kind"] == "pending":
            # the "next" provenance: 'declared' (▸ next:) / 'todo' (TodoWrite plan) are
            # first-party; 'reconstructed' is the inferred guess. `stale` marks a declaration
            # a later checkpoint overtook. The renderer weights the line by these.
            wire["source"] = t.get("_nextSource") or "reconstructed"
            wire["stale"] = bool(t.get("_nextStale"))
        if t.get("_toolCalls"):
            # a completed turn's tool calls, for the click-to-expand accordion.
            wire["toolCalls"] = [
                {"tool": tc.get("tool") or "tool", "target": tc.get("target") or "",
                 "desc": tc.get("desc") or "", "at": _norm_ts(tc.get("at"))}
                for tc in t["_toolCalls"]
            ]
            wire["toolCount"] = t.get("_toolCount", len(t["_toolCalls"]))
        out.append(wire)
    return out


def decision_count(tasks):
    """How many decision-class tasks (decision|supersedes|milestone) are in a trail.
    Activity/live/pending/step nodes don't count — only recorded decisions."""
    return sum(1 for t in (tasks or [])
               if t.get("kind") in ("decision", "supersedes", "milestone"))


def now_line(tasks, working):
    """The orientation header's pinned 'now' line — a one-line read of the live edge
    so "what is this lane doing right now" stays in view while the transcript scrolls
    beneath it. Returns {"text", "working"}. Pure over the already-built WIRE tasks
    (no ledger access); mirrors build_tasks' live-edge precedence so the header and
    the transcript's NOW card never disagree:
        in-flight tool tip (activity, now=True)  -> "<tool> · <target>"
        bloomed live checkpoint (kind 'live')     -> the checkpoint summary
        neither (idle, or working-but-no-tip-yet) -> the newest recorded, non-pending
                                                     summary, so the header still orients
                                                     on the last thing the lane did
    `working` is the lane's workingNow — it drives the pulsing dot, independent of
    whether a live tip exists (a just-landed checkpoint can be working with no tip)."""
    tasks = tasks or []
    live = None
    for t in tasks:
        k = t.get("kind")
        if k == "live" or (k == "activity" and t.get("now")):
            live = t            # last one wins (newest live edge)
    if live is not None:
        if live.get("kind") == "activity":
            tool = (live.get("tool") or "tool").strip()
            tgt = (live.get("summary") or "").strip()
            text = (tool + " · " + tgt) if tgt else tool
        else:
            text = (live.get("summary") or "").strip()
    else:
        text = ""
        for t in reversed(tasks):
            if t.get("kind") != "pending":
                text = (t.get("summary") or "").strip()
                break
    return {"text": text, "working": bool(working)}


# how recently a tool action must have fired for a lane to read "working now".
ACTIVE_SECS = 45


def working_now(ledger, sid, *, now_epoch=None):
    """Is this lane actively turning RIGHT NOW — i.e. did a tool fire within the
    last ACTIVE_SECS? Drives the client's adaptive poll cadence (poll fast while a
    lane works, calm when idle) and the live-edge pulse. Reads the most recent
    tool_use record; fail-open to False."""
    now = time.time() if now_epoch is None else now_epoch
    try:
        acts = ledger._acts(sid)
    except Exception:
        return False
    for a in reversed(acts):
        if isinstance(a, dict) and a.get("type") == "tool_use":
            ts = R.parse_ts(a.get("ts"))
            return ts is not None and (now - ts) <= ACTIVE_SECS
    return False


# --------------------------------------------------------------------------- #
# token / cost (#2): derive-at-serve from each provider's own on-disk transcript
# --------------------------------------------------------------------------- #
def _session_cwd(ledger, sid):
    """The working directory for a session, from its newest record that carries one
    ("" when unknown). Used to locate the provider's on-disk transcript for cost."""
    try:
        cps = ledger._cps(sid)
        acts = ledger._acts(sid)
        for src in list(reversed(cps)) + list(reversed(acts)):
            cwd = (src.get("cwd") or "").strip()
            if cwd:
                return cwd
    except Exception:
        pass
    return ""


def derive_token_cost(ledger, sid):
    """Per-session token counts + estimated USD, derived OFFLINE from the provider's
    own transcript (Claude ~/.claude/projects, Codex ~/.codex/sessions; Gemini has no
    on-disk usage). Priced from a vendored model→price table. Strictly OBSERVATIONAL —
    never a budget/quota gate.

    Returns the cost object {tokens, usd, model, provider, accuracy, priced, reason}
    (Gemini returns a NON-null object with tokens/usd None + accuracy 'unavailable' so
    the UI can tell "not captured" apart from "$0 spent"), or None on a hard failure.
    Fail-open: ANY error — including serve_cost not importing — yields None so the lane
    still renders and /api/state is never broken. Per-lane reads are memoized on the
    Ledger so the same session isn't re-read across the multiple derivations per poll."""
    memo = _ledger_cache(ledger, "_cost_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    result = None
    try:
        import serve_cost as C
        provider = provider_of(ledger, sid)
        cwd = _session_cwd(ledger, sid)
        result = C.cost_for_session(provider, sid, cwd)
    except Exception:
        result = None
    if memo is not None:
        memo[sid] = result
    return result


def _empty_token_sum():
    return {"input": 0, "output": 0, "cacheRead": 0, "cacheCreation": 0, "total": 0}


def _add_tokens(acc, t):
    if not isinstance(t, dict):
        return
    for k in acc:
        try:
            acc[k] += int(t.get(k) or 0)
        except (TypeError, ValueError):
            pass


def fleet_cost(terminals):
    """Sum the per-lane cost objects into a fleet rollup (top-level `fleetCost`).
    Strictly OBSERVATIONAL. `usd` sums only priced lanes; sessionsUnavailable counts the
    rest (gemini + unpriced models) so the UI can footnote "+N unpriced" honestly rather
    than implying $0."""
    tokens = _empty_token_sum()
    usd = 0.0
    by = {
        "claude": {"tokens": 0, "usd": 0.0},
        "codex": {"tokens": 0, "usd": 0.0},
        "gemini": {"tokens": None, "usd": None, "reason": "no usage in transcript"},
    }
    priced = 0
    unavailable = 0
    for t in terminals or []:
        c = (t or {}).get("cost")
        if not c:
            continue
        prov = c.get("provider")
        tk = c.get("tokens")
        if tk:
            _add_tokens(tokens, tk)
            if prov in ("claude", "codex"):
                try:
                    by[prov]["tokens"] += int(tk.get("total") or 0)
                except (TypeError, ValueError):
                    pass
        # guard the usd add by TYPE (not just not-None): a malformed cost object must
        # degrade only the rollup, never raise out of build_state and cold-envelope the
        # whole board. bool is an int subclass, so exclude it explicitly.
        u = c.get("usd")
        if isinstance(u, (int, float)) and not isinstance(u, bool):
            usd += u
            if prov in ("claude", "codex"):
                by[prov]["usd"] += u
            priced += 1
        else:
            unavailable += 1
    return {"tokens": tokens, "usd": usd, "byProvider": by,
            "sessionsPriced": priced, "sessionsUnavailable": unavailable}


def story_cost(ledger, story_id, focus_sid):
    """Per-story cost rollup over every session mapping to the story. accuracy is the
    single value when sessions agree, 'mixed' when they differ (e.g. an exact Codex lane
    + an approximate Claude lane), 'unavailable' when no session has usage. None when no
    session yields any cost object at all."""
    sids = list(_sessions_for_story(ledger, story_id)) if story_id else []
    if focus_sid and focus_sid not in sids:
        sids.append(focus_sid)
    tokens = _empty_token_sum()
    usd = 0.0
    accs = set()
    any_cost = False
    for s in sids:
        c = derive_token_cost(ledger, s)
        if not c:
            continue
        any_cost = True
        _add_tokens(tokens, c.get("tokens"))
        if c.get("usd") is not None:
            usd += c["usd"]
        accs.add(c.get("accuracy"))
    if not any_cost:
        return None
    real = [a for a in accs if a and a != "unavailable"]
    if not real:
        accuracy = "unavailable"
    elif len(real) == 1:
        accuracy = real[0]
    else:
        accuracy = "mixed"
    return {"tokens": tokens, "usd": usd, "accuracy": accuracy}


# --------------------------------------------------------------------------- #
# epics / roadmap
# --------------------------------------------------------------------------- #
def roadmap_progress(epic, ledger, *, now_epoch=None):
    """(done, total, segments) for an epic, DERIVED from its linked story states in
    link order. done = #linked stories whose state == 'done'; total = len(stories);
    segments = [{state}, ...] in link order. Never reads a stored done/total."""
    now = time.time() if now_epoch is None else now_epoch
    stories = (epic or {}).get("stories") or []
    segments = []
    done = 0
    for story_id in stories:
        try:
            st = story_state(ledger, None, story_id, epic, now_epoch=now)
        except Exception:
            st = "not-started"
        if st == "done":
            done += 1
        segments.append({"state": st})
    return done, len(stories), segments


def epic_for_session(epics, ledger, sid):
    """The epic dict whose linked stories include this session's story_id, or None."""
    story_id = story_id_for(ledger, sid)
    if not story_id:
        return None
    for e in (epics or []):
        if not isinstance(e, dict):
            continue
        if story_id in (e.get("stories") or []):
            return e
    return None


def build_epic_band(epics, focus_sid, ledger, *, now_epoch=None):
    """The focus pane's epic band, or None when the focused session is standalone."""
    e = epic_for_session(epics, ledger, focus_sid)
    if not e:
        return None
    done, total, segs = roadmap_progress(e, ledger, now_epoch=now_epoch)
    project = e.get("project")
    return {
        "eyebrow": project or "",
        "title": e.get("title") or "",
        "project": project,
        "integrity": e.get("integrity") or "reconstructed",
        "done": done,
        "total": total,
        "roadmapSegments": segs,
    }


def parked_epic_seam(ledger, sid, epics):
    """The seam banner shown when the focused lane is parked at an epic boundary
    (a compaction/workstream-switch/clear with a recorded outcome). Derived from the
    most recent boundary activity record for the session; None when none applies."""
    try:
        acts = ledger._acts(sid)
    except Exception:
        return None
    seam = None
    for a in acts:
        if not isinstance(a, dict):
            continue
        typ = a.get("type")
        if typ == "compaction_boundary":
            seam = {"kind": "compaction", "at": a.get("ts"), "trigger": a.get("trigger")}
        elif typ == "session_start" and a.get("source") == "compact":
            seam = {"kind": "compaction", "at": a.get("ts"), "trigger": "compact"}
    if not seam:
        return None
    project = None
    try:
        project = ledger.project_of(sid)
    except Exception:
        project = None
    return {
        "label": "Context compacted",
        "project": project,
        "kind": seam["kind"],
        "outcome": "parked",
        "at": _norm_ts(seam.get("at")),
    }


# --------------------------------------------------------------------------- #
# live-session selection
# --------------------------------------------------------------------------- #
def session_has_substance(ledger, sid):
    """A real workstream lane vs empty/aborted noise. True iff the session produced
    at least one MEANINGFUL checkpoint (carries decisions, touched_paths, or the
    `_valid` flag) OR at least one `tool_use` (real work, including an in-flight first
    turn before any checkpoint). A session whose entire footprint is lifecycle
    boundaries + an invalid 'no work progressed' checkpoint — e.g. a scheduled task
    that 529'd from C:\\WINDOWS\\system32 before doing anything — has no substance and
    must not render as a lane (or become the focus). Fail-open to True: a read error
    must never silently hide a real lane.

    Memoized per Ledger (pure over the session's records, now-independent): live_sessions
    evaluates it for every session each poll."""
    memo = _ledger_cache(ledger, "_substance_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    result = _session_has_substance_uncached(ledger, sid)
    if memo is not None:
        memo[sid] = result
    return result


def _session_has_substance_uncached(ledger, sid):
    try:
        cps = ledger._cps(sid)
    except Exception:
        return True
    for c in cps:
        if isinstance(c, dict) and (c.get("_valid") or c.get("decisions") or c.get("touched_paths")):
            return True
    try:
        acts = ledger._acts(sid)
    except Exception:
        return True
    return any(isinstance(a, dict) and a.get("type") == "tool_use" for a in acts)


def last_work_ts(ledger, sid):
    """Newest timestamp of REAL work for a session — tool_use, stop_boundary, any
    non-meta activity, or a checkpoint. Excludes lifecycle/meta records (session_end,
    capture_*, suspected_gap) so closing a session (which writes a session_end at
    ≈now) can't masquerade as fresh activity. Fail-open to 0.0.

    Memoized per Ledger (now-independent, pure over the session's records): it is
    recomputed ~3× per session per poll (live_sessions, session_ended_at, and the
    freshness override in _build_terminal)."""
    memo = _ledger_cache(ledger, "_last_work_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    ts = 0.0
    try:
        for a in ledger._acts(sid):
            if isinstance(a, dict) and a.get("type") not in _META_ACT_TYPES:
                ts = max(ts, R.parse_ts(a.get("ts")))
    except Exception:
        pass
    try:
        for c in ledger._cps(sid):
            if isinstance(c, dict):
                ts = max(ts, R.parse_ts(c.get("captured_at")))
    except Exception:
        pass
    if memo is not None:
        memo[sid] = ts
    return ts


def last_activity_ts(ledger, sid):
    """Newest timestamp of genuine AGENT ACTIVITY — a non-meta activity record (tool_use,
    stop_boundary, intent/next, …). UNLIKE last_work_ts this EXCLUDES checkpoints: a
    checkpoint is a post-hoc summary, and the SessionEnd-triggered close-out extraction
    appends one dated a few seconds AFTER the terminal session_end. Counting that as work
    would falsely 'resume' a just-quit lane (it reappeared within the extraction delay).
    Only used to decide whether a session has truly resumed after a terminal end — a real
    resume always writes a new activity record. Memoized per Ledger; fail-open to 0.0."""
    memo = _ledger_cache(ledger, "_last_activity_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    ts = 0.0
    try:
        for a in ledger._acts(sid):
            if isinstance(a, dict) and a.get("type") not in _META_ACT_TYPES:
                ts = max(ts, R.parse_ts(a.get("ts")))
    except Exception:
        pass
    if memo is not None:
        memo[sid] = ts
    return ts


def first_work_ts(ledger, sid):
    """OLDEST timestamp of REAL work for a session — the lane's stable birth instant.
    Mirror of last_work_ts (same record set, same meta exclusions) but the MIN, so the
    value never moves as the agent keeps working. This is the lane's sort key: it gives
    the terminals list a fixed creation order instead of reshuffling on every action.
    Skips falsy/unparseable timestamps so one bad record can't pin the key to epoch-0.
    Fail-open to 0.0 (only when a session truly has no parseable work — never for a live
    lane, which by definition has a positive last_work_ts).

    Memoized per Ledger (now-independent): live_sessions sorts on it every poll."""
    memo = _ledger_cache(ledger, "_first_work_memo")
    if memo is not None and sid in memo:
        return memo[sid]
    ts = None
    try:
        for a in ledger._acts(sid):
            if isinstance(a, dict) and a.get("type") not in _META_ACT_TYPES:
                t = R.parse_ts(a.get("ts"))
                if t and (ts is None or t < ts):
                    ts = t
    except Exception:
        pass
    try:
        for c in ledger._cps(sid):
            if isinstance(c, dict):
                t = R.parse_ts(c.get("captured_at"))
                if t and (ts is None or t < ts):
                    ts = t
    except Exception:
        pass
    result = ts if ts is not None else 0.0
    if memo is not None:
        memo[sid] = result
    return result


def session_ended_at(ledger, sid):
    """Epoch of a TERMINAL session_end (the human exited) with no real work after
    it, else None. A `clear` end (context reset) is never terminal; a session_end
    followed by fresh work has resumed and is not ended."""
    try:
        acts = ledger._acts(sid)
    except Exception:
        return None
    ends = [R.parse_ts(a.get("ts")) for a in acts
            if isinstance(a, dict) and a.get("type") == "session_end"
            and (a.get("source") or a.get("reason")) in _TERMINAL_END_SOURCES]
    if not ends:
        return None
    last_end = max(ends)
    # resumed since the close? Only genuine new ACTIVITY counts — NOT a checkpoint. The
    # SessionEnd-triggered close-out extraction appends a checkpoint dated a few seconds
    # AFTER the session_end; comparing against last_work_ts (which counts checkpoints)
    # would falsely resurrect a just-quit lane within the extraction delay. A real resume
    # always writes a fresh activity record, so last_activity_ts is the correct gate.
    return last_end if last_end >= last_activity_ts(ledger, sid) else None


def dismissed_at(dismissed, term_id):
    """Epoch a lane was manually dismissed, or None. `dismissed` maps a stable
    terminal id (terminal_id(sid)) → dismissed-at epoch. Fail-open to None."""
    if not dismissed:
        return None
    try:
        v = dismissed.get(term_id)
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def terminal_annotation(annotations, term_id):
    """User-authored one-line note for a lane, or ''. Fail-open."""
    if not annotations:
        return ""
    try:
        v = annotations.get(term_id)
        return v if isinstance(v, str) else ""
    except Exception:
        return ""


def live_sessions(ledger, now_epoch, dismissed=None):
    """Session ids the board renders, in a STABLE creation order — oldest first-WORK
    first, so a lane holds its slot for its whole life instead of jumping to the top
    whenever its agent does new work (the reshuffle reads as confusing churn). A lane
    is live iff it has real substance, its most recent *work* is inside
    LIVE_WINDOW_SECS, the human has not exited the session (a terminal session_end
    auto-drops it), and it has not been manually dismissed without doing new work
    since. Older sessions are history; empty/aborted sessions (e.g. a scheduled run
    that errored before acting) are noise, not lanes. Note: `last_work_ts` still gates
    liveness here, but the ORDER is keyed on `first_work_ts`; default-focus
    (most-recently-active) is selected separately in build_state."""
    now = time.time() if now_epoch is None else now_epoch
    rows = []
    for sid in ledger.session_ids():
        try:
            work = last_work_ts(ledger, sid)
        except Exception:
            continue
        if not work or (now - work) > LIVE_WINDOW_SECS:
            continue
        if not session_has_substance(ledger, sid):
            continue
        if session_ended_at(ledger, sid) is not None:
            continue                                    # human exited → auto-drop
        d = dismissed_at(dismissed, terminal_id(sid))
        if d is not None and work <= d:
            continue                                    # dismissed, no new work since
        rows.append((first_work_ts(ledger, sid), sid))
    # oldest-first, sid as a deterministic tiebreak; never re-sorts on new work.
    rows.sort(key=lambda r: (r[0], r[1]))
    return [sid for _, sid in rows]


# --------------------------------------------------------------------------- #
# the frozen /api/state assembly
# --------------------------------------------------------------------------- #
def _build_terminal(ledger, sid, epics, now_epoch):
    """One terminal lane. Raises on a corrupt session so build_state can drop it."""
    sess = ledger.session_state(sid, now_epoch=now_epoch)
    status = derive_status(sess, now_epoch)
    # Freshness reflects real WORK, not lifecycle/meta records: session_state's
    # last_activity_ts counts a session_end / capture_* / suspected_gap (which fire
    # at ≈now), so a cleared-but-idle lane would otherwise read "mid-turn" forever.
    label, tone = derive_freshness(
        {**sess, "last_activity_ts": last_work_ts(ledger, sid)}, now_epoch)
    tone = reconcile_tone(status, tone)
    latest = sess.get("last_checkpoint") or {}
    story_title = ""
    if isinstance(latest, dict):
        story_title = R.clean(latest.get("summary") or "", 160)

    epic = None
    e = epic_for_session(epics, ledger, sid)
    if e:
        done, total, _ = roadmap_progress(e, ledger, now_epoch=now_epoch)
        epic = {"title": e.get("title") or "", "done": done, "total": total}

    # attention (#3) reuses the session_state we already derived (no second scan).
    attention = derive_attention_state(ledger, sid, now_epoch=now_epoch, sess_state=sess)
    # cost (#2) is derived per-lane from the provider's own on-disk transcript; fully
    # fail-open (cost=None) so a read/price miss can never drop the lane or break state.
    cost = derive_token_cost(ledger, sid)

    return {
        "id": terminal_id(sid),
        "provider": provider_of(ledger, sid),
        "project": sess.get("project") or ledger.project_of(sid),
        "status": status,
        "freshnessLabel": label,
        "freshnessTone": tone,
        "story": {"title": story_title},
        "epic": epic,
        "annotation": "",
        "focused": False,
        "statusLine": status_line(sess),
        "attention": attention,
        "cost": cost,
    }, sess


def _build_focus(ledger, focus_sid, epics, now_epoch):
    """The focus pane for the focused session. Fail-open: returns None on corruption."""
    try:
        story_id = story_id_for(ledger, focus_sid)
        epic_band = build_epic_band(epics, focus_sid, ledger, now_epoch=now_epoch)
        # the focused story's trail INCLUDES the in-flight tool stream (the live
        # 'what's happening now' nodes); sibling trails below don't (they only feed
        # a decision count). The live edge ("● now") only pulses while the lane is
        # actually working — gate it on the same working_now the focus exposes.
        wn = working_now(ledger, focus_sid, now_epoch=now_epoch)
        tasks = build_tasks(ledger, focus_sid, include_activity=True, working_now=wn)
        sess = ledger.session_state(focus_sid, now_epoch=now_epoch)
        title = ""
        latest = sess.get("last_checkpoint") or {}
        if isinstance(latest, dict):
            title = R.clean(latest.get("summary") or "", 160)
        st_state = story_state(ledger, focus_sid, story_id, None, now_epoch=now_epoch)

        # stories list: when an epic owns this story, surface every linked story's
        # state in link order; otherwise the single standalone story.
        stories = []
        e = epic_for_session(epics, ledger, focus_sid)
        if e:
            for s_id in (e.get("stories") or []):
                # per-story fail-open: a single malformed sibling story must drop only
                # itself (degraded to a minimal not-started entry) — never null the
                # WHOLE focus pane. Mirrors the per-lane isolation on the board; the
                # focused story is computed before this loop so it is never at risk.
                try:
                    ssid = focus_sid if s_id == story_id else _session_for_story(ledger, s_id)
                    s_state = story_state(ledger, ssid, s_id, e, now_epoch=now_epoch)
                    s_tasks = build_tasks(ledger, ssid) if ssid else []
                    s_title = title if s_id == story_id else (
                        R.clean(((ledger.session_state(ssid, now_epoch=now_epoch)
                                  .get("last_checkpoint") or {}).get("summary") or ""), 160)
                        if ssid else "")
                    stories.append({"id": s_id, "title": s_title, "state": s_state,
                                    "decisionCount": decision_count(s_tasks)})
                except Exception:
                    stories.append({"id": s_id, "title": "", "state": "not-started",
                                    "decisionCount": 0})
        else:
            stories.append({"id": story_id, "title": title, "state": st_state,
                            "decisionCount": decision_count(tasks)})

        active_index = next((i for i, s in enumerate(stories)
                             if s["id"] == story_id), 0)
        index_label = "active · %d of %d" % (active_index + 1, len(stories))

        # startedAt = when the WORKSTREAM began, not when the current session started.
        # A story can collapse several sessions (same project|branch|cwd-leaf); the
        # honest start is the oldest checkpoint across every session mapping to it, so a
        # multi-session workstream doesn't report "started" at the latest session's
        # first checkpoint. Normalized to UTC-Z for wire consistency. Fail-open: falls
        # back to the focus session's own first checkpoint if the story scan throws.
        started_epoch = None
        try:
            sids = _sessions_for_story(ledger, story_id) or []
            if focus_sid not in sids:
                sids = list(sids) + [focus_sid]
            for s in sids:
                try:
                    s_cps = ledger._cps(s)
                except Exception:
                    continue
                if s_cps and isinstance(s_cps[0], dict):
                    e = R.parse_ts(s_cps[0].get("captured_at"))
                    if e and (started_epoch is None or e < started_epoch):
                        started_epoch = e
        except Exception:
            started_epoch = None
        started_at = _iso(started_epoch)
        if started_at is None:
            cps = ledger._cps(focus_sid)
            if cps and isinstance(cps[0], dict):
                started_at = _norm_ts(cps[0].get("captured_at"))

        # cost is observational — a derivation failure must degrade just this figure,
        # never null the whole focus pane (tasks/stories/epic). Mirrors the per-sibling-
        # story isolation in the stories loop above.
        try:
            story_cost_val = story_cost(ledger, story_id, focus_sid)
        except Exception:
            story_cost_val = None

        return {
            "terminalId": terminal_id(focus_sid),
            "parkedEpicSeam": parked_epic_seam(ledger, focus_sid, epics),
            "epic": epic_band,
            "stories": stories,
            "workingNow": wn,
            "activeStory": {
                "id": story_id,
                "title": title,
                "startedAt": started_at,
                "indexLabel": index_label,
                # the pinned orientation-header "now" line (the live edge, surfaced at
                # the top so it stays in view as the transcript scrolls).
                "nowLine": now_line(tasks, wn),
                "storyCost": story_cost_val,
                "tasks": tasks,
            },
        }
    except Exception:
        return None


def build_state(ledger, epics, *, now_epoch=None, focus_terminal_id=None,
                dismissed=None, annotations=None):
    """Assemble the FROZEN /api/state dict. Pure over (ledger, epics, now_epoch,
    dismissed).

    Degraded/cold shapes are part of the contract:
      - cold: no live sessions      -> terminals:[] + focus:null
      - no-epic: focused standalone  -> focus.epic:null + single-element stories[]
      - live-but-empty: focus.activeStory.tasks:[]
    `dismissed` maps a terminal id → dismissed-at epoch (manual close-out); such
    lanes are hidden until they do new work. Fail-open: a per-terminal derivation
    exception drops that lane only. `annotations` is a terminal-id map of
    user-authored one-line notes."""
    now = time.time() if now_epoch is None else now_epoch
    epics = epics if isinstance(epics, list) else []

    terminals = []
    sess_by_term = {}
    sid_by_term = {}
    for sid in live_sessions(ledger, now, dismissed):
        try:
            term, sess = _build_terminal(ledger, sid, epics, now)
        except Exception:
            continue   # fail-open: drop this lane, keep the rest
        term["annotation"] = terminal_annotation(annotations, term["id"])
        terminals.append(term)
        sess_by_term[term["id"]] = sess
        sid_by_term[term["id"]] = sid

    # focus selection: an explicit (persisted) focus if it is still a live lane, else
    # the most-recently-active lane. The display list is now in STABLE creation order
    # (oldest first), so terminals[0] is the OLDEST — pick the max-last_work_ts lane
    # explicitly instead. Ties resolve to the earlier-listed (older) lane via max()'s
    # first-max rule, which is deterministic given the stable order.
    focus_tid = None
    if focus_terminal_id and focus_terminal_id in sid_by_term:
        focus_tid = focus_terminal_id
    elif terminals:
        focus_tid = max(
            terminals, key=lambda t: last_work_ts(ledger, sid_by_term[t["id"]])
        )["id"]

    focus = None
    if focus_tid is not None:
        for t in terminals:
            t["focused"] = (t["id"] == focus_tid)
        focus_sid = sid_by_term.get(focus_tid)
        if focus_sid is not None:
            focus = _build_focus(ledger, focus_sid, epics, now)

    return {
        "generatedAt": _iso(now) or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "terminals": terminals,
        "focus": focus,
        "fleetCost": fleet_cost(terminals),
    }
