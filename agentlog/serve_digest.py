#!/usr/bin/env python3
"""
serve_digest — the "while you were away" overnight digest (#1).

A pure, DETERMINISTIC fold over the ledger between a "last seen" cursor and now:
what moved in the gap, grouped by project then provider. No LLM, no network — just
count / group / flag over the same checkpoint + activity records /api/state derives
from. The result is the JSON body of GET /api/digest; the renderer paints it as a
dismissible sheet and serializes Markdown/HTML client-side.

What it surfaces per project:
  decisions    — every decision recorded after the cursor (high-class flagged)
  milestones   — the high-class subset (billing/auth/migration/data_loss/license)
  reversals    — a post-cursor decision that re-decides a topic decided EARLIER
                 (the prior may be pre-cursor — that cross-cursor reversal is the
                 most interesting "we changed our mind while you were away")
  newlyStale   — a lane that was active AT/AFTER the cursor and has since gone stale
                 (not a lane that was already idle when you left)
  waiting      — a lane now blocked on an open, un-acked blocking ask
  filesChanged — the union of touched_paths across the window's checkpoints

Every agent-authored string is run through R.clean (redact + strip control) on the
wire; the client additionally escapes for Markdown/HTML export. Fail-open: a single
malformed record is skipped, never raised.
"""
import time

import agentlog_read as R
import serve_state as S
import rubric


def _new_group(proj):
    return {
        "project": proj,
        "_providers": set(),
        "decisions": [],
        "milestones": [],
        "reversals": [],
        "newlyStale": [],
        "waiting": [],
        "_files": set(),
    }


def _decision_view(d, proj, cap_iso, cid, high):
    """The wire shape of one decision (sanitized agent text)."""
    return {
        "topic": R.clean(d.get("topic") or "", 200),
        "choice": R.clean(d.get("choice") or "", 240),
        "rationale": R.clean(d.get("rationale") or "", 400),
        "class": (d.get("class") or "none"),
        "reversibility": (d.get("reversibility") or ""),
        "confidence": (d.get("confidence") or ""),
        "humanInvolved": S._truthy(d.get("human_involved")),
        "highClass": bool(high),
        "project": proj,
        "capturedAt": cap_iso,
        "checkpointId": cid,
    }


def build_digest(ledger, after_epoch, *, now_epoch=None, project=None):
    """Assemble the /api/digest payload for everything that moved after `after_epoch`.
    Pure over (ledger, after_epoch, now_epoch, project). `project` optionally scopes to
    one project. Deterministic; fail-open per record."""
    now = time.time() if now_epoch is None else now_epoch
    try:
        after = float(after_epoch)
    except (TypeError, ValueError):
        after = now - S.LIVE_WINDOW_SECS

    groups = {}
    # (project, topic-lower) -> {summary, at} of the most recent EARLIER decision on
    # that topic, walked oldest->newest so a post-cursor re-decision can name its prior
    # (the prior may be pre-cursor — that is the cross-cursor reversal we most want).
    prior_by_topic = {}

    for c in ledger.checkpoints:
        if not isinstance(c, dict):
            continue
        cap = c.get("captured_at")
        cap_ts = R.parse_ts(cap)
        proj = c.get("project") or ledger.project_of(c.get("session_id")) or "?"
        if project and proj != project:
            continue
        post = bool(cap_ts) and cap_ts > after
        cap_iso = S._norm_ts(cap)
        cid = c.get("checkpoint_id")
        decisions = c.get("decisions")
        if isinstance(decisions, list):
            for d in decisions:
                if not isinstance(d, dict):
                    continue
                topic_key = (d.get("topic") or "").strip().lower()
                if post:
                    g = groups.setdefault(proj, _new_group(proj))
                    high = rubric.is_high_class(d)
                    view = _decision_view(d, proj, cap_iso, cid, high)
                    g["decisions"].append(view)
                    if high:
                        g["milestones"].append(view)
                    # a post-cursor decision that re-decides an EARLIER topic = reversal
                    prior = prior_by_topic.get((proj, topic_key)) if topic_key else None
                    if prior is not None:
                        g["reversals"].append({
                            "topic": R.clean(d.get("topic") or "", 200),
                            "choice": R.clean(d.get("choice") or "", 240),
                            "supersededSummary": prior["summary"],
                            "supersededAt": prior["at"],
                            "reversibility": (d.get("reversibility") or "medium"),
                            "project": proj,
                            "capturedAt": cap_iso,
                        })
                # update the prior index for BOTH pre- and post-cursor decisions so a
                # later re-decision (post-cursor) can reference this one.
                if topic_key:
                    prior_by_topic[(proj, topic_key)] = {
                        "summary": R.clean(d.get("choice") or d.get("topic") or "", 240),
                        "at": cap_iso,
                    }
        if post:
            g = groups.setdefault(proj, _new_group(proj))
            for p in (c.get("touched_paths") or []):
                if isinstance(p, str) and p.strip():
                    g["_files"].add(p.strip())
            g["_providers"].add(S.provider_of(ledger, c.get("session_id")))

    # newlyStale + waiting walk every session that did real work AFTER the cursor and
    # hasn't been exited — NOT S.live_sessions, whose 24h LIVE_WINDOW gate would silently
    # drop a lane that worked after the cursor but went quiet >24h ago (exactly the
    # multi-day/weekend-away case the digest exists for). This matches the since-cursor
    # horizon the decision/file channels already use.
    try:
        live = [s for s in ledger.session_ids()
                if (S.last_work_ts(ledger, s) or 0) > after
                and S.session_ended_at(ledger, s) is None]
    except Exception:
        live = []
    for sid in live:
        try:
            proj = ledger.project_of(sid) or "?"
            if project and proj != project:
                continue
            provider = S.provider_of(ledger, sid)
            # newly stale: worked at/after the cursor, idle past STALE_SECS now. A lane
            # already idle BEFORE the cursor did not change while you were away.
            lw = S.last_work_ts(ledger, sid)
            if lw and lw > after and (now - lw) > S.STALE_SECS:
                g = groups.setdefault(proj, _new_group(proj))
                g["_providers"].add(provider)
                g["newlyStale"].append({
                    "terminalId": S.terminal_id(sid),
                    "project": proj,
                    "provider": provider,
                    "lastWorkAt": S._iso(lw),
                    "story": S.story_id_for(ledger, sid),
                })
            # waiting: an open, un-acked blocking ask (delegates to the read surface,
            # which is already ack-by-id aware — answered asks never resurface).
            sess = ledger.session_state(sid, now_epoch=now)
            for nm in (sess.get("needs_matt") or []):
                if nm.get("kind") == "blocking_ask":
                    g = groups.setdefault(proj, _new_group(proj))
                    g["_providers"].add(provider)
                    g["waiting"].append({
                        "terminalId": S.terminal_id(sid),
                        "project": proj,
                        "provider": provider,
                        "question": nm.get("detail") or "",
                        "ackId": nm.get("ack_id"),
                    })
        except Exception:
            continue

    # finalize: sets -> sorted lists, per-project + grand totals.
    projects = []
    totals = {k: 0 for k in ("decisions", "milestones", "reversals",
                             "newlyStale", "waiting", "filesChanged")}
    for proj in sorted(groups):
        g = groups[proj]
        files = sorted(g.pop("_files"))
        providers = sorted(p for p in g.pop("_providers") if p and p != "unknown")
        counts = {
            "decisions": len(g["decisions"]),
            "milestones": len(g["milestones"]),
            "reversals": len(g["reversals"]),
            "newlyStale": len(g["newlyStale"]),
            "waiting": len(g["waiting"]),
            "filesChanged": len(files),
        }
        for k in totals:
            totals[k] += counts[k]
        projects.append({
            "project": proj,
            "providers": providers,
            "decisions": g["decisions"],
            "milestones": g["milestones"],
            "reversals": g["reversals"],
            "newlyStale": g["newlyStale"],
            "waiting": g["waiting"],
            "filesChanged": files,
            "counts": counts,
        })

    return {
        "since": after,
        "now": now,
        "generatedAt": S._iso(now),
        "empty": (sum(totals.values()) == 0),
        "projects": projects,
        "totals": totals,
    }
