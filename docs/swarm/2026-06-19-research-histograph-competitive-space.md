# Swarm: research — apps in a similar space to agent-histograph + high-value ideas

**Date:** 2026-06-19
**Mode:** research
**Protocol:** convergent (4 parallel facet researchers → 1 synthesis lead)
**Engine:** Workflow (the experimental `Teammates` agent-team tool was unavailable in-session; the convergent `/swarm research` protocol was run on the Workflow orchestrator instead — same shape)
**Iterations:** 1

## Token Usage
| Agent | Model | Tasks | Tokens | Notes |
|-------|-------|-------|--------|-------|
| 4 facet researchers + 1 synthesis lead | opus (general-purpose, web-enabled) | 5 | 447,126 | aggregate; 117 tool uses, ~9.2 min wall-clock |
| **TOTAL** | | **5** | **447,126** | |

## Team
| Facet | Hunting ground |
|-------|----------------|
| observability | LangSmith, Langfuse, Helicone, Phoenix, Braintrust, Weave, Traceloop, AgentOps, Datadog LLM Obs, Logfire |
| orchestration | Conductor, Claude Squad, Crystal, Vibe Kanban, Sculptor, Container-use, Cursor/Devin/OpenHands, GitButler, Agent View |
| dev-telemetry-ux | WakaTime, GitHub graphs, asciinema/VHS, Grafana/Honeycomb/Sentry, k9s/lazygit, Linear, Raycast |
| positioning-gaps | local-first vs SaaS, single- vs multi-provider lock-in, 2026 agent-sprawl/cost/audit trends, the white-space moat |

## Summary
Histograph occupies a genuinely unique point: the only tool that is LIVE + LOCAL-FIRST + OSS + MULTI-PROVIDER (Claude+Codex+Gemini) + OBSERVABILITY-first, all on an append-only decision ledger it owns. Every strong competitor wins one axis and concedes the combination. The defining 2026 solo-dev pain — "too many agents across providers, no central visibility, and they quietly burn tokens overnight" — is exactly what histograph is shaped to solve, and the cloud/team answer (GitHub Agent HQ) and heavyweight answer (OTel+Grafana) both demand upload or infra. Positioning line: **"Agent HQ for one — unified, local, yours."** The single under-exploited asset is the structured checkpoint ledger (`summary/decisions/verification/risks/asks/next_action/touched_paths`), which is the substrate three converging trends are crying out for: cost accounting, overnight digests, and code-provenance audit trails.

## Findings / Output

### Top 5 ranked ideas
1. **"While you were away" overnight digest** (small, additive) — since-cursor fold over the ledger; `since(after_epoch, project)` already exists at `agentlog_read.py:414`. Verified nearly-free.
2. **Unified cross-provider cost & token lane** (medium, additive) — the one structural gap vs the entire field; verified NO token/cost field in the ledger today. Price locally with a vendored Helicone price table; observational only, never a budget gate.
3. **Needs-You / stuck-agent triage lane** (small, additive) — idle-after-question + tool-call loop detection; pure derivation, no model/network.
4. **Tauri tray-icon fleet presence** (medium, additive) — badge = #lanes needing you; counts already derived in `status_board` (`agentlog_read.py:356`).
5. **Personal-baseline anomaly guard** (medium, additive) — self-calibrating from the user's own history; catches wedged/runaway overnight cases fixed thresholds miss.

### Quick wins
- One-click jump-in/resume per provider (clipboard/open-terminal variant = observability-pure)
- Space-to-peek read-only overlay
- Backlog/up-next lane from existing `next`+`todos`
- Header + per-lane frequency sparklines
- Continuous freshness decay (replace the `STALE_SECS=1800` binary cliff; verified `serve_state.py:41-42`)
- Per-tool glyph vocabulary (`get_tool_category` already carried, `gemini_watcher.py:199`) + fleet pulse strip
- Keyboard-first navigation + lazygit-style footer + `?` help

### Big bets
- Portable, exportable, signed ledger (tamper-evident bundle + redaction pass)
- Local audit/provenance view — which agent touched which file, and why (EU AI Act Art.12-aligned, zero new capture)
- Cross-device ledger union over your own machines (LAN/SSH/syncthing, never cloud)
- Scrubbable trail replay (asciinema-for-agent-decisions; state at T is a deterministic fold)

### Anti-patterns (do NOT copy)
Forced cloud sync / hosted backend · proxy-in-the-request-path · control-plane pivot (dispatch, answer-on-behalf, mutating MCP) · per-seat SaaS model (Terragon died, Crystal/Vibe Kanban sunsetting) · single-provider lock-in · heavyweight daemon-zoo setup · governance bureaucracy for a solo user · replay-only/post-hoc framing.

### Most-worth-studying products
- **Claude Code Agent Monitor (hoangsonww)** — near-identical local hooks+JSONL→derive→render dashboard; proves the architecture, shows the additive growth path. Claude-only + SQLite = the gaps to exploit.
- **agenttrace** — closest cost sibling; cross-provider cost/token from local logs, no upload, but retrospective TUI not a live board. The #1 "steal this" target.
- **Claude Code Agent View (Anthropic, native)** — ratifies needs-you-first triage + Space-to-peek; Claude-only + ephemeral = the gap histograph fills.
- **GitHub Agent HQ** — the cloud/team/enterprise INVERSE; validates the problem, defines the complementary positioning.
- **disler/claude-code-hooks-multi-agent-observability** — crib the Live Pulse Chart + per-tool emoji glyphs.
- **Linear Pulse** — canonical "what happened while you were away" pattern (inspiration for idea #1).
- **JetBrains Air** — most strategically threatening entrant (unified cross-provider, local-by-default); wedge against it = minimalism + data-ownership + no workflow takeover.

## Verification notes (lead fact-check)
All five file-grounded claims confirmed against source by the orchestrator before reporting:
- `since(after_epoch, project)` — `agentlog/agentlog_read.py:414` ✅
- `status_board(...)` — `agentlog/agentlog_read.py:356` ✅
- `STALE_SECS=1800` / `MIDTURN_SECS=600` — `agentlog/serve_state.py:41-42` ✅
- `get_tool_category` — `capture-proof/gemini_watcher.py:199` ✅
- No LLM token/cost field in the ledger — confirmed (all `token|usage|cost` hits in the reader are incidental) ✅

## Unresolved Items
- Strategy call for Matt: ideas #1–#5 are all tagged **additive** (keep observability identity). The three control-plane lines flagged NOT to cross without an explicit decision: (a) dispatching/queueing work to agents, (b) answering/steering on an agent's behalf, (c) any mutating MCP tool.
- Full raw facet findings (all 4 researchers, every product + idea): `C:\Users\Matt\AppData\Local\Temp\claude\C--Users-Matt-Documents-development-agent-histograph\2890eb89-d114-4483-a9d9-2db8fb02af66\tasks\wjmq94zmf.output`
