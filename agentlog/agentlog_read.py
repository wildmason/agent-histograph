#!/usr/bin/env python3
"""
Gate-B read surface — the JSONL reader, payload sanitizer, workstream-state
derivation, and health-page-draft mapping that `agentlog` (the CLI) renders.

Scope guard (§6.0): this reads only `~/.agent-histograph/*.jsonl`. NO durable SQLite, NO
MCP server, NO daemon — those are forbidden before Gate B passes. Each CLI run
re-reads the JSONL from scratch; that is deliberately the whole persistence layer
for the experiment.

Trust posture (§10): every value that originates from an agent-authored checkpoint
(summary, decision text, rationale, ask, risk) is UNTRUSTED. `md_cell` neutralizes
Markdown-table / wikilink / template-token injection and `redact` strips obvious
secrets before any of it is composed into a health-page draft row or printed.
"""
import os, sys, json, re, time
from datetime import datetime

_HERE = os.path.dirname(os.path.abspath(__file__))
_CAPTURE = os.path.normpath(os.path.join(_HERE, "..", "capture-proof"))
if _CAPTURE not in sys.path:
    sys.path.insert(0, _CAPTURE)
import agentlog_common as A      # path constants + fail-open helpers (shared one source of truth)
import rubric                    # falsifiable material-decision / high-class checks (§4/§11)


# --------------------------------------------------------------------------- #
# §10 — sanitization
# --------------------------------------------------------------------------- #
_ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")            # CSI escape sequences
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")     # control chars (\t\n\r handled separately)

# §10 redaction is now SINGLE-SOURCED in agentlog_common (A12): the producers redact
# at WRITE time (durable ledger never stores a verbatim secret) and the reader redacts
# at RENDER time — same patterns, one definition. We re-export `redact` and `_SECRET_SUBS`
# at module level so `R.redact` / `R._SECRET_SUBS` and the existing tests keep working.
redact = A.redact
_SECRET_SUBS = A._SECRET_SUBS


def _is_truthy(v):
    """Normalize a possibly-stringy boolean (models emit the string "true"/"True")
    to a real bool — A11/§4 human_involved gate."""
    if v is True:
        return True
    if isinstance(v, str):
        return v.strip().lower() == "true"
    return False


def _strip_control(s, keep_newlines=False):
    s = _ANSI.sub("", s)
    if keep_newlines:
        s = s.replace("\t", " ").replace("\r", "")
    else:
        s = s.replace("\t", " ").replace("\r", " ").replace("\n", " ")
    return _CTRL.sub("", s)


def clean(text, cap=None):
    """For CLI render (§10): redact secrets, strip ANSI/control, keep newlines."""
    if text is None:
        return ""
    s = _strip_control(redact(str(text)), keep_newlines=True)
    if cap and len(s) > cap:
        s = s[: cap - 1].rstrip() + "…"
    return s


def md_cell(text, cap=300):
    """Render UNTRUSTED text safe for a Markdown table cell (§10): redact secrets,
    strip control/ANSI, fold newlines, neutralize wikilinks and template tokens, and
    escape pipes so a rationale can never break the Decisions table or inject a link."""
    if text is None:
        return ""
    s = _strip_control(redact(str(text)), keep_newlines=False)
    s = s.replace("[[", "").replace("]]", "")                # neutralize [[wikilinks]]
    for a, b in (("{{", "{ {"), ("}}", "} }"), ("${", "$ {"), ("%{", "% {")):
        s = s.replace(a, b)                                  # neutralize template tokens
    s = s.replace("|", "\\|")                                # escape column separator
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > cap:
        s = s[: cap - 1].rstrip() + "…"
    return s


# --------------------------------------------------------------------------- #
# timestamps + JSONL loading
# --------------------------------------------------------------------------- #
def parse_ts(s):
    """ISO-8601-with-offset (the hooks' format) → epoch seconds; 0.0 on failure.

    Tolerates a trailing 'Z' and FRACTIONAL SECONDS (e.g. a producer that stamps
    microseconds). The strptime fast-path matches the producer's exact format; the
    fromisoformat fallback covers the other valid ISO variants. This matters because
    the failure value is 0.0 (= 1970), NOT an error — an unparsed timestamp would
    silently sort before every checkpoint and drop out of the live activity tail."""
    if not s:
        return 0.0
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z").timestamp()
    except Exception:
        try:
            # canonical ISO parser — handles fractional seconds + offset (and 'Z',
            # which we normalize for pre-3.11 fromisoformat).
            return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0


def load_jsonl(path):
    rows = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue                                 # fail-open: skip a bad line
    except FileNotFoundError:
        pass
    except Exception:
        pass
    return rows


def load_ledger(d, stem):
    """Load + concatenate every per-host ledger file for a stem in dir `d`:
    `<stem>.jsonl` (Claude Code, the canonical producer) plus any sibling
    `<stem>.<host>.jsonl` a second producer writes (e.g. `checkpoints.codex.jsonl`).
    This is what makes the control plane cohesive across tools — Claude Code and
    Codex each own their own append-only file (no cross-process write contention),
    and the reader unions them into one view. Provenance is preserved by each
    record's `host` field, not by which file it came from. Fail-open per file."""
    import glob as _glob
    rows = []
    for path in sorted(_glob.glob(os.path.join(d, stem + "*.jsonl"))):
        rows.extend(load_jsonl(path))
    return rows


# --------------------------------------------------------------------------- #
# Ledger — index the JSONL and derive workstream state (§7, §11)
# --------------------------------------------------------------------------- #
class Ledger:
    def __init__(self, checkpoints, activity):
        self.checkpoints = sorted(checkpoints, key=lambda c: parse_ts(c.get("captured_at")))
        self.activity = sorted(activity, key=lambda a: parse_ts(a.get("ts")))

    @classmethod
    def from_dir(cls, agentlog_dir=None):
        d = agentlog_dir or A.AGENTLOG_DIR
        # Union per-host ledger files (checkpoints.jsonl + checkpoints.codex.jsonl …)
        # so every producer feeds one cohesive cross-tool view. The canonical
        # `checkpoints.jsonl` still matches; `host` on each record carries provenance.
        return cls(load_ledger(d, "checkpoints"), load_ledger(d, "activity"))

    # ---- grouping ----
    def session_ids(self):
        ids = []
        seen = set()
        for r in self.checkpoints + self.activity:
            sid = r.get("session_id")
            if sid and sid not in seen:
                seen.add(sid)
                ids.append(sid)
        return ids

    def _cps(self, sid):
        return [c for c in self.checkpoints if c.get("session_id") == sid]

    def _acts(self, sid):
        return [a for a in self.activity if a.get("session_id") == sid]

    def project_of(self, sid):
        cps = self._cps(sid)
        if cps and cps[-1].get("project"):
            return cps[-1]["project"]
        # fall back to the cwd's last path component
        src = (cps[-1] if cps else None) or (self._acts(sid)[-1] if self._acts(sid) else {})
        cwd = src.get("cwd") or ""
        return os.path.basename(cwd.rstrip("\\/")) or sid[:8]

    # ---- ack lifecycle (§4 ack-by-id; spec §6.4 false-attention guard) ----
    def acked_ids(self):
        """Set of item_ids that have a `human_ack` record. The Needs-Matt band is
        filtered against this so an ask answered two turns later stops shouting —
        ack-by-id (§4), NOT a since-cursor high-water mark (which must never be able
        to bury an unacked needs-Matt item)."""
        return {a.get("item_id") for a in self.activity
                if a.get("type") == "human_ack" and a.get("item_id")}

    # ---- per-session derived state ----
    def session_state(self, sid, now_epoch=None, stale_turns=3, idle_secs=86400, acked=None):
        now_epoch = time.time() if now_epoch is None else now_epoch
        acked = self.acked_ids() if acked is None else acked
        cps = self._cps(sid)
        acts = self._acts(sid)
        latest = cps[-1] if cps else None
        last_cp_ts = parse_ts(latest.get("captured_at")) if latest else 0.0

        stops = [a for a in acts if a.get("type") == "stop_boundary"]
        boundaries_since = sum(1 for a in stops if parse_ts(a.get("ts")) > last_cp_ts)
        all_ts = [parse_ts(a.get("ts")) for a in acts] + [parse_ts(c.get("captured_at")) for c in cps]
        last_activity_ts = max(all_ts) if all_ts else 0.0
        idle = now_epoch - last_activity_ts if last_activity_ts else 1e18

        # needs-Matt (§11): blocking asks, un-weighed material decisions, unacked gaps.
        # Each item carries a stable `ack_id` so `agentlog ack <id>` can retire it.
        needs = []
        for c in cps:
            for ask in (c.get("asks") or []):
                if isinstance(ask, dict) and ask.get("blocking"):
                    needs.append({"kind": "blocking_ask", "detail": clean(ask.get("question"), 200),
                                  "checkpoint_id": c.get("checkpoint_id"),
                                  "ack_id": c.get("checkpoint_id")})
        seen_topics = set()
        for c in cps:
            for d in (c.get("decisions") or []):
                # §6.3/§11: a model sometimes emits human_involved as the string "true".
                # Normalize so a human-weighed decision isn't re-surfaced as needs-Matt.
                if not rubric.is_material_decision(d) or _is_truthy(d.get("human_involved")):
                    continue
                topic = (d.get("topic") or "").strip()
                if topic in seen_topics:
                    continue
                seen_topics.add(topic)
                needs.append({"kind": "material_decision",
                              "detail": clean(topic, 200),
                              "high_class": rubric.is_high_class(d),
                              "checkpoint_id": c.get("checkpoint_id"),
                              "ack_id": c.get("checkpoint_id")})
        for a in acts:
            if a.get("type") == "suspected_gap":
                needs.append({"kind": "suspected_gap",
                              "detail": clean(a.get("note") or a.get("signal"), 200),
                              "ts": a.get("ts"),
                              "ack_id": "gap:%s:%s" % (sid, a.get("ts"))})

        # §4 ack-by-id: drop any needs-Matt item whose ack id has a human_ack record.
        needs = [n for n in needs if n.get("ack_id") not in acked]

        has_decisions = any(c.get("decisions") for c in cps)
        has_verification = any(c.get("verification") for c in cps)
        latest_invalid = bool(latest) and latest.get("_valid") is False
        low_integrity = latest_invalid or (has_decisions and not has_verification)

        has_blocking = any(nm["kind"] == "blocking_ask" for nm in needs)
        if has_blocking:
            status = "waiting"
        elif idle > idle_secs:
            status = "archived"
        elif boundaries_since >= stale_turns:
            status = "stale"
        else:
            status = "active"

        return {
            "session_id": sid,
            "project": self.project_of(sid),
            "status": status,
            "boundaries_since_checkpoint": boundaries_since,
            "needs_matt": needs,
            "low_integrity": low_integrity,
            "last_checkpoint": latest,
            "last_checkpoint_id": latest.get("checkpoint_id") if latest else None,
            "last_activity_ts": last_activity_ts,
            "n_checkpoints": len(cps),
            "idle_secs": idle,
        }

    def status_board(self, now_epoch=None, include_archived=False):
        """Project/workstream-shaped board (§7.2 / A4): one row per PROJECT, aggregating
        that project's sessions. Per-session detail stays in `brief`. Status is the
        worst-of the project's sessions (waiting > stale > active); low_integrity if any
        session is; needs-Matt is the union of every session's unacked needs-Matt items."""
        acked = self.acked_ids()
        sessions = [self.session_state(sid, now_epoch=now_epoch, acked=acked)
                    for sid in self.session_ids()]
        if not include_archived:
            sessions = [s for s in sessions if s["status"] != "archived"]

        groups = {}
        for s in sessions:
            groups.setdefault(s["project"] or "?", []).append(s)

        def _project_status(states):
            if any(st["status"] == "waiting" for st in states):
                return "waiting"
            if any(st["status"] == "stale" for st in states):
                return "stale"
            return "active"

        rows = []
        for proj, states in groups.items():
            states.sort(key=lambda st: st["last_activity_ts"], reverse=True)
            needs = []
            for st in states:
                needs.extend(st["needs_matt"])
            latest_cp = None
            latest_cp_ts = -1.0
            for st in states:
                cp = st["last_checkpoint"]
                if cp:
                    t = parse_ts(cp.get("captured_at"))
                    if t >= latest_cp_ts:
                        latest_cp_ts, latest_cp = t, cp
            rows.append({
                "project": proj,
                "status": _project_status(states),
                "n_sessions": len(states),
                "n_checkpoints": sum(st["n_checkpoints"] for st in states),
                "needs_matt": needs,
                "low_integrity": any(st["low_integrity"] for st in states),
                "last_checkpoint": latest_cp,
                "last_activity_ts": max(st["last_activity_ts"] for st in states),
                "boundaries_since_checkpoint": sum(st["boundaries_since_checkpoint"] for st in states),
            })
        rows.sort(key=lambda r: r["last_activity_ts"], reverse=True)
        counts = {
            "needs_matt": sum(1 for r in rows if r["needs_matt"]),
            "stale": sum(1 for r in rows if r["status"] == "stale"),
            "active": sum(1 for r in rows if r["status"] == "active"),
            "waiting": sum(1 for r in rows if r["status"] == "waiting"),
            "low_integrity": sum(1 for r in rows if r["low_integrity"]),
        }
        return {"rows": rows, "counts": counts}

    # ---- since-cursor digest (§7.3) ----
    def since(self, after_epoch, project=None):
        def keep_cp(c):
            if project and self.project_of(c.get("session_id")) != project and c.get("project") != project:
                return False
            return parse_ts(c.get("captured_at")) > after_epoch

        cps = [c for c in self.checkpoints if keep_cp(c)]
        decisions, risks, asks, verification = [], [], [], []
        for c in cps:
            for d in (c.get("decisions") or []):
                dd = dict(d)
                dd["_checkpoint_id"] = c.get("checkpoint_id")
                dd["_project"] = c.get("project")
                dd["_captured_at"] = c.get("captured_at")
                decisions.append(dd)
            for rk in (c.get("risks") or []):
                risks.append(rk)
            for ak in (c.get("asks") or []):
                asks.append(ak)
            for v in (c.get("verification") or []):
                verification.append(v)

        def keep_act(a):
            if project and self.project_of(a.get("session_id")) != project:
                return False
            return parse_ts(a.get("ts")) > after_epoch

        gaps = [a for a in self.activity if a.get("type") == "suspected_gap" and keep_act(a)]
        compactions = [a for a in self.activity if a.get("type") == "compaction_boundary" and keep_act(a)]
        return {
            "after_epoch": after_epoch,
            "checkpoints": cps,
            "decisions": decisions,
            "risks": risks,
            "asks": asks,
            "verification": verification,
            "suspected_gaps": gaps,
            "compaction_boundaries": compactions,
        }

    # ---- Gate-B experiment evidence (A1 adoption + A2 utility) ----
    def experiment_report(self, by_epoch=None, now_epoch=None):
        """Compute the pre-registered Gate-B bars from the instrumentation activity
        (cli_invocation / re_entry_question / re_entry_answer records). Pure over the
        loaded ledger so the render in agentlog.py can inject a clock and stay testable.

        UTILITY bar (§6.2): median re-entry answer ≤ 180s AND zero materially-wrong answers.
        ADOPTION bar: Matt uses agentlog unprompted ≥3 times across ≥2 workstreams by
        `by_epoch` (default the §6 gate cutoff 2026-06-13)."""
        acts = self.activity
        # --- utility: pair answers to their questions, measure elapsed + wrongness ---
        questions = {a.get("question_id"): a for a in acts
                     if a.get("type") == "re_entry_question" and a.get("question_id")}
        answers = [a for a in acts if a.get("type") == "re_entry_answer"]
        elapsed, wrong = [], 0
        answered_ids = set()
        for a in answers:
            qid = a.get("question_id")
            if qid in answered_ids:
                continue            # one answer per question (the recorded resolution)
            answered_ids.add(qid)
            es = a.get("elapsed_secs")
            if isinstance(es, (int, float)):
                elapsed.append(float(es))
            if _is_truthy(a.get("wrong")) or a.get("wrong") is True:
                wrong += 1
        med = _median(elapsed)
        utility = {
            "n_answered": len(answered_ids),
            "median_secs": med,
            "wrong": wrong,
            "median_bar": 180.0,
            "median_pass": (med is not None and med <= 180.0),
            "wrong_pass": (wrong == 0),
        }

        # --- adoption: cli_invocation counts by day, by command, distinct projects ---
        invs = [a for a in acts if a.get("type") == "cli_invocation"]
        by_day, by_command, projects = {}, {}, set()
        for a in invs:
            day = (a.get("ts") or "")[:10]
            by_day[day] = by_day.get(day, 0) + 1
            cmd = a.get("command") or "?"
            by_command[cmd] = by_command.get(cmd, 0) + 1
            if a.get("project"):
                projects.add(a.get("project"))
        # ≥3 uses across ≥2 workstreams by the cutoff
        cutoff = by_epoch
        if cutoff is not None:
            on_time = [a for a in invs if parse_ts(a.get("ts")) <= cutoff]
        else:
            on_time = invs
        on_time_projects = {a.get("project") for a in on_time if a.get("project")}
        adoption = {
            "total_invocations": len(invs),
            "by_day": dict(sorted(by_day.items())),
            "by_command": dict(sorted(by_command.items(), key=lambda kv: (-kv[1], kv[0]))),
            "distinct_projects": sorted(projects),
            "n_distinct_projects": len(projects),
            "on_time_invocations": len(on_time),
            "on_time_projects": sorted(p for p in on_time_projects if p),
            "adopted": (len(on_time) >= 3 and len(on_time_projects) >= 2),
        }
        return {"utility": utility, "adoption": adoption,
                "now_epoch": time.time() if now_epoch is None else now_epoch}


def _median(values):
    """Median of a list of numbers; None for an empty list."""
    xs = sorted(float(v) for v in values if isinstance(v, (int, float)))
    n = len(xs)
    if n == 0:
        return None
    mid = n // 2
    if n % 2 == 1:
        return xs[mid]
    return (xs[mid - 1] + xs[mid]) / 2.0


# --------------------------------------------------------------------------- #
# §13 — health-page decision drafts (draft-only, sanitized)
# --------------------------------------------------------------------------- #
HEALTH_HEADER = "| Date | Topic | Decision | Reason |\n|------|-------|----------|--------|"


def _reason_from_decision(d):
    parts = []
    if (d.get("rationale") or "").strip():
        parts.append(d["rationale"].strip())
    if (d.get("consequences") or "").strip():
        parts.append("Consequences: " + d["consequences"].strip())
    if (d.get("reversibility") or "").strip():
        parts.append("Reversibility: " + d["reversibility"].strip())
    return " ".join(parts)


def _human_annotation(human_involved):
    return " — Matt weighed in." if human_involved is True else " — agent-recorded (review before applying)."


def health_draft_rows(checkpoints, project=None):
    """Return (header, [row, ...]) of sanitized Markdown Decisions-table drafts (§13).
    Prefers a checkpoint's explicit `health_draft` object; otherwise derives from its
    most material decision. Checkpoints with neither are skipped. Draft-only: this
    NEVER edits a wiki file — Matt applies."""
    rows = []
    for c in checkpoints:
        if project and c.get("project") != project:
            continue
        date = (c.get("captured_at") or "")[:10]
        hd = c.get("health_draft")
        if isinstance(hd, dict) and (hd.get("topic") or hd.get("decision")):
            topic = hd.get("topic")
            decision = hd.get("decision")
            reason = (hd.get("reason") or "") + _human_annotation(hd.get("human_involved"))
        else:
            decisions = c.get("decisions") or []
            if not decisions:
                continue
            material = rubric.material_decisions(decisions)
            d = (material[0] if material else decisions[0])
            topic = d.get("topic")
            decision = d.get("choice")
            reason = _reason_from_decision(d) + _human_annotation(d.get("human_involved"))
        rows.append("| %s | %s | %s | %s |" % (
            md_cell(date, 12), md_cell(topic, 120), md_cell(decision, 200), md_cell(reason, 400)))
    return HEALTH_HEADER, rows
