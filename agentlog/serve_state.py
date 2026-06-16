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
))
# session_end `source`/`reason` values that mean the human actually EXITED the
# session (→ auto-drop the lane). "clear" is a context reset where the same
# terminal keeps working, so it is deliberately NOT terminal.
_TERMINAL_END_SOURCES = frozenset(("prompt_input_exit", "logout", "other"))

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
# story identity + state
# --------------------------------------------------------------------------- #
def story_id_for(ledger, sid):
    """Stable slug for the story a session is working — the link target an epic
    references. Derived from (project, branch, cwd-leaf) so the same workstream
    keeps the same id across sessions/restarts. Deterministic."""
    if sid is None:
        return None
    try:
        project = ledger.project_of(sid) or "?"
        cps = ledger._cps(sid)
        acts = ledger._acts(sid)
        src = (cps[-1] if cps else None) or (acts[-1] if acts else {}) or {}
        cwd = src.get("cwd") or ""
        branch = R.A.git_branch(cwd) if cwd else ""
        leaf = os.path.basename(cwd.rstrip("\\/")) if cwd else ""
    except Exception:
        project, branch, leaf = (sid or "?"), "", ""
    raw = "%s|%s|%s" % (project, branch, leaf)
    slug = "".join(c.lower() if c.isalnum() else "-" for c in raw).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return "st-" + (slug or "x")


def _sessions_for_story(ledger, story_id):
    """All live session ids whose story_id_for == story_id (a workstream can span
    several sessions that share project|branch|cwd-leaf). Empty when none map."""
    if not story_id:
        return []
    out = []
    for sid in ledger.session_ids():
        try:
            if story_id_for(ledger, sid) == story_id:
                out.append(sid)
        except Exception:
            continue
    return out


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
        nodes.append({"tool": tool or "tool", "target": target, "at": a.get("ts")})
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
            "summary": target, "at": a.get("ts"), "topic": "", "reversal": None,
            "now": False,
        })
    return nodes


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

    # trailing pending from the latest next_action
    latest = cps[-1] if cps else None
    if isinstance(latest, dict):
        na = (latest.get("next_action") or "").strip()
        if na:
            tasks.append({
                "id": "tk-pending",
                "kind": "pending",
                "summary": R.clean(na, 240),
                "integrity": "passive",
                "at": None,
                "topic": "",
                "reversal": None,
            })

    # strip the internal 'topic' helper from the wire shape; keep reversal only on
    # supersedes; normalize every timestamp to UTC-Z (consistent with generatedAt).
    out = []
    for t in tasks:
        wire = {"id": t["id"], "kind": t["kind"], "summary": t["summary"],
                "integrity": t.get("integrity"), "at": _norm_ts(t["at"])}
        if t["kind"] == "supersedes" and t.get("reversal"):
            rev = dict(t["reversal"])
            rev["supersededAt"] = _norm_ts(rev.get("supersededAt"))
            wire["reversal"] = rev
        if t["kind"] == "activity":
            # the in-flight tool node carries its tool name + live-edge flag.
            wire["tool"] = t.get("tool") or "tool"
            wire["now"] = bool(t.get("now"))
        if t.get("_toolCalls"):
            # a completed turn's tool calls, for the click-to-expand accordion.
            wire["toolCalls"] = [
                {"tool": tc.get("tool") or "tool", "target": tc.get("target") or "",
                 "at": _norm_ts(tc.get("at"))}
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
    must never silently hide a real lane."""
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
    ≈now) can't masquerade as fresh activity. Fail-open to 0.0."""
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
    return ts


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
    # resumed since the close (real work after it)? then it's live again.
    return last_end if last_end >= last_work_ts(ledger, sid) else None


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


def live_sessions(ledger, now_epoch, dismissed=None):
    """Session ids the board renders, newest-WORK first. A lane is live iff it has
    real substance, its most recent *work* is inside LIVE_WINDOW_SECS, the human has
    not exited the session (a terminal session_end auto-drops it), and it has not
    been manually dismissed without doing new work since. Older sessions are history;
    empty/aborted sessions (e.g. a scheduled run that errored before acting) are
    noise, not lanes."""
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
        rows.append((work, sid))
    rows.sort(key=lambda r: r[0], reverse=True)
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

    return {
        "id": terminal_id(sid),
        "provider": provider_of(ledger, sid),
        "project": sess.get("project") or ledger.project_of(sid),
        "status": status,
        "freshnessLabel": label,
        "freshnessTone": tone,
        "story": {"title": story_title},
        "epic": epic,
        "focused": False,
        "statusLine": status_line(sess),
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
                "tasks": tasks,
            },
        }
    except Exception:
        return None


def build_state(ledger, epics, *, now_epoch=None, focus_terminal_id=None, dismissed=None):
    """Assemble the FROZEN /api/state dict. Pure over (ledger, epics, now_epoch,
    dismissed).

    Degraded/cold shapes are part of the contract:
      - cold: no live sessions      -> terminals:[] + focus:null
      - no-epic: focused standalone  -> focus.epic:null + single-element stories[]
      - live-but-empty: focus.activeStory.tasks:[]
    `dismissed` maps a terminal id → dismissed-at epoch (manual close-out); such
    lanes are hidden until they do new work. Fail-open: a per-terminal derivation
    exception drops that lane only."""
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
        terminals.append(term)
        sess_by_term[term["id"]] = sess
        sid_by_term[term["id"]] = sid

    # focus selection: an explicit (persisted) focus if it is still a live lane,
    # else the most-recently-active lane. live_sessions is newest-first, so [0].
    focus_tid = None
    if focus_terminal_id and focus_terminal_id in sid_by_term:
        focus_tid = focus_terminal_id
    elif terminals:
        focus_tid = terminals[0]["id"]

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
    }
