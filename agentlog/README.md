# agentlog — Gate-B Read Surface

The cheap local read surface the **recall-aware kill experiment (§6.2)** runs against.
It reads the hook-written JSONL at `~/.agent-histograph/` and renders a flat operational
digest — `agentlog since` / a regenerated Markdown digest, the spec's **default**
read surface (the Bridge widget is the explicit fallback, not this).

This is the **Gate-B setup** deliverable bundle (§6.0 allowed work). It is the
consumer side of the [`../capture-proof/`](../capture-proof/) producer (the Stop /
PreCompact / SessionStart hooks), reading the same `~/.agent-histograph/*.jsonl` they write.

## Scope guard (§6.0)

Allowed pre-Gate-B, and this stays inside the envelope:

- ✅ reads only `~/.agent-histograph/*.jsonl` — re-read from scratch every run
- ✅ no durable **SQLite** store, no **MCP** server, no **daemon**, no **TUI/watch**
- ✅ no Bridge polish, no multi-host abstraction
- ✅ all four deliverables are plain Python scripts, stdlib-only (no third-party deps)

If any of those creep in, it is a gate violation — file it as Phase-1 work instead.

## The four Gate-B-setup deliverables → commands

| Deliverable (pre-registered bar) | Where |
|----------------------------------|-------|
| Hook-written JSONL substrate | `../capture-proof/` (already built + live-proven) |
| **CLI / flat-Markdown digest** | `agentlog status` / `since` / `brief` |
| **Sanitized health-draft append/export** | `agentlog health-drafts [--export F] [--append]` |
| **Scripted recall-audit extractor** | `agentlog audit` |

## Commands

```text
agentlog status                         # PROJECT-grouped board: Needs Matt / Waiting / Stale / Active / Low-integrity
agentlog status --all                   # include archived/idle workstreams

agentlog since                          # dense digest of the last 24h
agentlog since --cursor last-seen       # everything since the stored cursor, then advance it
agentlog since 2026-06-08T10:00:00-04:00
agentlog since --project Bridge

agentlog brief <project>                # everything for one project/workstream (per-session detail)

agentlog health-drafts                  # sanitized, draft-only Decisions-table rows (§13)
agentlog health-drafts Bridge --export drafts.md          # write a standalone .md
agentlog health-drafts Bridge --export drafts.md --append # append rows to an existing file

agentlog checkpoint <checkpoint_id>     # one checkpoint in full
agentlog decision <query>               # search recorded decisions (stable ids are Phase-1)

agentlog ack <id>                       # retire a Needs-Matt item by its ack id (§4)

agentlog question "text" [--project P]  # open a timed re-entry question (UTILITY-bar evidence)
agentlog answered [id] [--wrong] [--note T]   # resolve it; records elapsed time
agentlog experiment-report [--by DATE]  # Gate-B utility+adoption bars, computed

agentlog audit <transcript.jsonl>       # §6.3 recall audit on one session
agentlog audit <transcript.jsonl> --diff git.diff --commands cmds.log
agentlog audit --sample 5               # sample N transcripts AT RANDOM within a window (§6.3 N=5)
agentlog audit --sample 5 --since 2026-06-01 --until 2026-06-09  # explicit window (default: now-7d → now)

agentlog snapshot [--dest DIR]          # copy ~/.agent-histograph/*.jsonl into <repo>/evidence/ for the gate

agentlog serve [--port 8080] [--host 127.0.0.1] [--no-browser]   # the histograph web UI (Epic→Story→Task)

agentlog epic add "<title>" --project <P>          # declare an initiative (roadmap of stories)
agentlog epic link <epic_id> <story_id> [--index N]  # link a story into the epic's roadmap (ordered)
agentlog epic confirm <epic_id> [--title "..."]    # human-confirm the epic name (integrity → human-confirmed)
agentlog epic list                                 # epics with DERIVED done/total
```

### Histograph (`agentlog serve`)

The **interactive surface** — a portrait, local web UI that keeps you oriented across several
concurrent agent terminals during long sessions. It renders the same `~/.agent-histograph` ledger as a
**3-tier hierarchy** (Terminal → **Epic** → **Story** → **Task**): a triage status mosaic of all
terminals plus a focused **trail** for one. Design brief: [`../histograph-ux-spec.md`](../histograph-ux-spec.md);
build contract: [`HISTOGRAPH-BUILD-PLAN.md`](HISTOGRAPH-BUILD-PLAN.md).

```bash
python agentlog.py serve        # → http://127.0.0.1:8080  (use the wrapper `agentlog serve` on PATH)
```

- **Themeable.** Built on **Aegis v2** (`ae-*` components, `--ae-*` tokens — zero hardcoded color). The
  titlebar switcher live-swaps **brand** (default / cinnabar / editorial / metro / crucible / spectrum) ×
  **scheme** (light / dark / high-contrast); default **crucible / dark**; the choice persists to
  `localStorage`. Aegis is vendored under `histograph/static/aegis/` by **`./vendor_aegis.sh`** (an esbuild
  re-bundle that inlines Lit so a stdlib server can serve it) — re-run it after pulling a new aegis-v2.
- **Real data, no new capture for Story+Task.** Stories = workstream objectives; Tasks = decisions /
  checkpoints / pending — all already in the ledger. The backend (`serve_state.py`) computes every derived
  value (status, freshness, story-state, roadmap progress, reversal detection, integrity) so it is unit-
  tested in Python; the JS is a thin renderer of `GET /api/state`.
- **Epic + roadmap = a human-declared layer.** The initiative tier doesn't fall out of code decisions, so
  it's declared with `agentlog epic add/link` (stored in `~/.agent-histograph/epics.json`); `done`/`total`/roadmap
  progress are **derived** from the linked stories' live states, never stored. Auto extraction from scoping
  conversations is deferred — until you `epic confirm` a name it carries the `reconstructed` (◇) integrity
  glyph. With no epic declared, the focus view **degrades gracefully** to Story → Task.

> Scope note: `serve` is the **§15 Phase-4 interactive surface**, beyond the Gate-B read-surface envelope
> above. It was built ahead of the gate at Matt's explicit direction (decoupling the *visualization* from
> the CLI-adoption bar). It remains stdlib-only on the Python side (no third-party server deps); the only
> build dependency is the one-time aegis-v2 vendor step.

### Project-grouped status board (§7.2)

`agentlog status` is **workstream/project-shaped**: one row per project, aggregating
that project's sessions — `n_sessions`, summed checkpoints, the **unioned unacked
Needs-Matt** items, latest checkpoint summary, and a status that is the worst-of its
sessions (`waiting` if any session is waiting, else `stale` if any is stale, else
`active`; low-integrity if any session is). Per-session detail stays in `brief`. Each
Needs-Matt line prints its **ack id** so you can retire it with `agentlog ack`.

### Ack lifecycle (§4 — ack-by-id, not mark-seen)

The Needs-Matt band would otherwise accrete forever (a blocking ask answered two turns
later keeps shouting all week — the false-attention failure §6.4 warns about). `agentlog
ack <id>` retires an item, where `<id>` is either:

- a **`checkpoint_id`** — acks every blocking ask **and** un-weighed material-decision
  item derived from that checkpoint (they share the checkpoint's id as their ack id), or
- **`gap:<session_id>:<ts>`** — acks one suspected-gap.

It writes `{"type":"human_ack","item_id":<id>,"ts":...,"host":"cli"}` to
`activity.cli.jsonl`; `session_state` then excludes any Needs-Matt item whose ack id has
a `human_ack` record. This is **ack-by-id**, deliberately **NOT** a mark-seen high-water
mark: advancing the `since --cursor` can never bury an unacked Needs-Matt item.

### Re-entry timing + experiment report (Gate-B evidence)

These commands produce the pre-registered Gate-B evidence artifacts, which previously
had no instrumentation at all:

- **UTILITY bar** (median re-entry answer ≤ 180s, zero materially-wrong answers):
  `agentlog question "where did we leave the billing refactor?" --project Bridge` opens a
  timed question and prints `q_<epoch-ms>`. Later, `agentlog answered [id] [--wrong]
  [--note ...]` resolves it (default: the most recent unanswered question), records
  `elapsed_secs`, and flags whether the answer was materially wrong.
- **ADOPTION bar** (≥3 unprompted uses across ≥2 workstreams by 2026-06-13): every
  `agentlog` subcommand passively appends a `cli_invocation` record (fail-open, no
  `session_id`, so it never pollutes the status board).
- `agentlog experiment-report [--by DATE]` computes both bars against the
  instrumentation — answered count, median elapsed (bar ≤180s), wrong-answer count;
  invocations by day / by command, distinct workstreams, and the ≥3-across-≥2 cutoff
  check — and prints a one-line **PASS-so-far / AT-RISK** verdict per bar.

### Snapshot (evidence preservation)

`agentlog snapshot [--dest DIR]` copies every `~/.agent-histograph/*.jsonl` into
`<repo-root>/evidence/agentlog-<YYYYMMDD-HHMMSS>/` (default) and prints the destination,
preserving the JSONL substrate for the gate decision.

Run it directly as `python agentlog.py <command>`, or use the bundled launcher
shims (`agentlog.cmd` for Windows, `agentlog` for git-bash) so you can type
`agentlog <command>` once this directory is on your `PATH`:

```powershell
# PowerShell, current session:
$env:PATH += ";C:\path\to\agent-histograph\agentlog"
# …or add that line to your $PROFILE to make `agentlog status` permanent.
```

The shims are just `python agentlog.py %*` wrappers — nothing is installed, no
package, no entry point (a real packaged binary is Phase-1, §8 item 7).

## Trust posture (§10)

Every value originating from an agent-authored checkpoint (summary, decision text,
rationale, ask, risk) is **untrusted**:

- `redact()` strips obvious secrets (auth headers, bearer/API/GitHub/AWS/Slack tokens,
  `key=value` secrets, `scheme://user:pass@` credentials) before anything is shown.
- `md_cell()` neutralizes Markdown-table / wikilink / template-token injection and
  escapes pipes, so a `rationale` containing `|`, `[[…]]`, or `{{…}}` can never break
  the Decisions table or inject a link. Health-page drafts are **draft-only** — this
  never edits a wiki file; Matt applies.

## The recall audit (§6.3)

`agentlog audit` is the scripted, near-zero-effort ground-truth pass that keeps the
§11 residual hole *managed*:

1. **Independent ground truth (mandatory model, not Matt).** A `claude -p` pass that
   never sees the ledger extracts the material decisions from a session's transcript
   (+ optional `git diff` + command log) per the §4 rubric.
2. **Score** ledger recall against that ground truth.
3. **Pass bar (§6.3 step 4):** recall ≥ 0.9 **and** zero volunteered-but-lost misses
   in billing / license / auth / migration / data_loss — any such miss fails outright.
4. **Ping ONLY** on recall < 0.9 or a high-class miss (§6.3 step 6), so wiring it to
   the existing bi-weekly Task-Scheduler loop stays silent when healthy. Exit code is
   `0` on PASS, `1` on FAIL; a `PING:` line prints only when Matt should look.
5. **Step-7 suspected-gap dry-run:** for every *never-recorded* miss, it checks whether
   the cheap JSONL signals (flagged paths, manifest deltas, migration files — §11)
   *would have* fired — turning §6.4's "never-recorded gap → Phase-2 acceptance case"
   from a promise into a measured precision estimate. The signal now also checks the
   session's **observed paths** (from `tool_use` records), labelled coarse because a
   path hit fires at any-decision-in-session granularity (it can't bind a path to one
   decision from passive facts) — mirroring how L3 path-globs work.

The model wiring reuses `../capture-proof/replay_pilot.py`'s `claude -p` machinery
(same auth, same model that runs live).

### Sampling at random across a window (§6.3 step 1)

`--sample N` draws N sessions **at random within a time window** — the protocol §6.3
requires ("drawn at random across the window"), which the old size-sorted picker
violated. `--since ISO` / `--until ISO` set the window (bare dates accepted, like
`since`); the default when `--sample` is used without `--since` is **now − 7 days → now**.
The audit header prints the window and "random within window" for protocol transparency.

### Passive-fact enrichment + prompt hardening (§6.3 step 2, §10)

- The audit feeds the independent ground-truth pass an `=== OBSERVED COMMANDS/PATHS
  (passive facts) ===` block built from the session's `tool_use` records — the "command
  log" §6.3 step 2 calls for, which previously could not exist. **Ground truth NEVER
  sees checkpoints/decisions from the ledger** — only passive `tool_use` / `session_*`
  activity — so the pass stays independent.
- Both the ground-truth and judge prompts prepend `replay_pilot.DATA_GUARD` and wrap
  **all** embedded untrusted content (transcript, diff, command log, the ledger-decision
  JSON, the gt-item JSON) in `<data>…</data>`, so the audit — the kill-experiment's trust
  anchor — can't be steered by instruction-like text inside a transcript.

### Miss classification (best-effort triad, §6.2 re-derived)

Under quiet mode every miss is mechanically an extractor miss, so the kill distinction is
re-derived as a heuristic triad per missed ground-truth item:

- **`pipeline-lost (possible)`** — the session has a `capture_result` with outcome in
  `{failed, skipped_lock, skipped_cap, skipped_breaker}` (the extractor never
  ran/completed on a segment);
- else **`reconstruction-lost`** — the decision's topic keywords appear in the transcript:
  it was legible but the reconstruction missed it (the kind that **kills**);
- else **`never-legible`** — the decision never appeared in the transcript (Phase-2
  backstop case).

The audit prints a per-item class and a per-class summary line (labelled
heuristic/best-effort).

## Record schemas (read-side tolerances)

The reader tolerates the absence of every record type below (fail-open). New types the
parallel producers write, plus the CLI-authored ones:

| Type | Shape | Producer |
|------|-------|----------|
| `tool_use` | `{session_id, cwd, tool, paths:[…], command:"<redacted, ≤500>", ts}` | Claude PostToolUse passive facts |
| `intent` | `{session_id, cwd, title, why, ts, host?}` | armed PostToolUse declared-intent scrape from assistant-authored `intent: <what> -- <why>` lines |
| `next` | `{session_id, cwd, task, why, ts, host?}` | armed PostToolUse/Stop declared-NEXT scrape from assistant-authored `next: <task> -- <why>` lines — the first-party, deterministic "next" that supersedes the reconstructed `next_action` guess |
| `todos` | `{session_id, cwd, items:[{content, status}], ts, host?}` | armed PostToolUse snapshot of the TodoWrite plan; serve derives the deterministic "next" from the first still-`pending` item |
| `pretool_material_signal` | `{session_id, cwd, tool, classes:[...], paths?, command?, ts, host:"codex"}` | Codex PreToolUse armed-only materiality reminder/audit; meta, not real work |
| `capture_attempt` | `{session_id, trigger, ts}` | quiet-pipeline observability |
| `capture_result` | `{session_id, trigger, outcome:"written"\|"no_judgment"\|"failed"\|"skipped_lock"\|"skipped_cap"\|"skipped_breaker", checkpoint_id?, ts}` | quiet-pipeline observability |
| `session_end` | `{session_id, cwd, source, armed, ts, pid?, process_name?}` | producers; Codex uses `source:"process_exit"` from the detached process watcher |
| `cli_invocation` | `{command, project?, ts, host:"cli"}` | this CLI (A1, adoption evidence) |
| `re_entry_question` | `{question_id:"q_<epoch-ms>", question, project, ts, host:"cli"}` | `agentlog question` |
| `re_entry_answer` | `{question_id, elapsed_secs, wrong:bool, note, ts, host:"cli"}` | `agentlog answered` |
| `human_ack` | `{item_id, ts, host:"cli"}` | `agentlog ack` |

Checkpoints may also carry `"integrity_class": "reconstructed_claim"` (quiet captures) or
`"volunteered_claim"` (inline), surfaced as a `[reconstructed]` / `[volunteered]` tag.
`reconstructed_claim` does **not** count as low-integrity on its own — only `_valid is
False` or decisions-without-verification do.

Codex quiet checkpoints are structurally constrained with
`capture-proof/checkpoint.schema.json` via `codex exec --output-schema`; this keeps
the producer from writing alternate prompt-injection audit shapes such as
`audit_result` in place of checkpoint records.

## Files

| File | Role |
|------|------|
| `agentlog.py` | CLI dispatch for all commands. |
| `agentlog_read.py` | JSONL reader, §10 sanitizer, §11 state derivation, §13 health-draft mapping. |
| `agentlog_audit.py` | §6.3 recall scoring (pure, judge-injected) + live model wiring. |
| `test_agentlog.py` | 57 unit tests — sanitization + redaction single-sourcing, state derivation, ack lifecycle, project-grouped board, experiment-report math, health-draft column-safety, recall scoring, miss classification, signal session-paths, window-arg parsing, prompt hardening. |

## Tests

```text
python -m unittest test_agentlog -v
```

The load-bearing logic is TDD'd: secret redaction and table/wiki/template injection
(§10), active/stale/waiting + needs-Matt + low-integrity derivation (§11), health-draft
column-integrity under injection (§13), and the recall pass bar + ping rule + dry-run
(§6.3) — the model judge is injected so the *logic*, not the model, is under test. The
live `audit` path was additionally smoke-tested end-to-end against a real session
transcript (ground truth → judge → verdict PASS).
```
