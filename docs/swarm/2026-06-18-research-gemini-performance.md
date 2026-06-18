# Swarm: research — post-Gemini performance regression & improvement vectors

**Date:** 2026-06-18
**Mode:** research (convergent)
**Protocol:** parallel facet exploration → lead synthesis
**Agents:** 5 (opus) — run via the `Agent` tool, not the `Teammates` primitive (agent-teams not exposed in this runtime despite the env flag; adapted faithfully to the research protocol with the main session as synthesizing lead)
**Iterations:** 1 explore round + lead synthesis

## Token Usage

Per-agent token usage was not surfaced by the `Agent`-tool spawn results in this adapted run (no `<usage>` blocks). Not captured.

## Team

| Agent | Persona | Facet |
|-------|---------|-------|
| Profiler | Backend Hot-Path Profiler | `serve_state.py` derivation complexity (cProfile of `build_state`) |
| Cacheworth | Data-Layer & Caching Architect | Ledger read I/O, caching, data growth |
| Pixel | Frontend Rendering Engineer | DOM rebuild / paint / layout cost |
| Wire | Network & Polling Latency Specialist | Poll cadence, payload, HTTP transport |
| Tail | Concurrency & Background-Process Specialist | Gemini watcher cost + ledger inflation (regression source) |

## Summary

The board's server is **stateless by design** (correct for the original one-shot CLI: "each run re-reads the JSONL from scratch") but now runs as a **long-lived process polled every 1.5 s / 4 s**. On *every* poll it globs + reads + `json.loads` + sorts the **entire unioned ledger**, then re-derives the full board state with **O(sessions × records)** scans, serializes ~20 KB JSON, and the client **tears down and rebuilds the DOM**. Nothing is cached at any layer.

**Gemini support is a genuine regression multiplier, not a one-time cost.** It added a permanently-growing append-only stream (+693 activity records) **and** new sessions (+10 of 56) to the re-parsed/re-derived set — and because the derive is O(sessions × records), Gemini bumped *both* factors. Measured marginal cost: **+29 ms / 17 %** of `build_state` today, rising forever as the stream grows. Separately, a past duplicate-watcher replay bug left **158 MB of 99.9 %-duplicate records** (140,386 checkpoint lines → 208 unique) in the repo-**default** ledger `~/.agent-histograph`, making a bare exe double-click take **3.25–8.7 s per poll**.

**All five facets converged on the same remedy hierarchy with no contradictions:** (1) stop doing the work on unchanged polls (cache + ETag/304), (2) make the derive itself fast (index by session, fix `parse_ts`), (3) bound growth so cost stays flat (retention/compaction), (4) clean the 158 MB landmine + prevent recurrence, (5) stop the per-poll DOM rebuild + perpetual paint.

### Cross-facet reconciliation (the one tension, resolved)

The lead's pre-synthesis worry was "aggressive ledger caching vs. the watcher constantly mutating that ledger." **Resolved by Tail's measurement:** the Gemini watcher writes only `*.gemini.jsonl`, only on real new records, and its idle loop is 0.28 ms with zero writes. On an append-only ledger, a `(path, mtime_ns, size)` fingerprint therefore hits **~100 % on idle polls** — the cache is safe and the two facets are complementary, not competing.

## Measured baseline (live `~/.agentlog`, ~7,990 records, 56 sessions / 4 live)

| Metric | Value |
|---|---|
| `/api/state` full poll | **~235–278 ms** (read+sort 62–71 ms, derive ~170 ms) |
| `/api/state` payload | **20,285 bytes** (uncompressed; 4.7 KB gzipped) |
| Idle polls | **byte-identical** except 1 byte (`generatedAt`) |
| `_acts(sid)` calls/request | **341** (each a full O(7990) scan) → 2,380× slower than an index |
| `parse_ts` calls/request | **25,828** (strptime "fast-path" is 10× *slower* than `fromisoformat`) |
| Cheap change signal (stat+hash 7 files) | **0.11 ms** (~2,400× cheaper than the derive) |
| `/api/ledger` (settings-open) | **~3,900 ms** (re-reads every candidate incl. the 158 MB default) |
| **158 MB default ledger** `~/.agent-histograph` | load **3.25 s**, full poll **8.7 s** — request pile-up on a 1.5 s interval |
| Gemini marginal derive cost | **+29 ms / 17 %** (693 recs + 10 sessions) |
| Watcher idle loop | 0.28 ms/tick (~16 s CPU/day) — **NOT the regression** |
| Watcher state file `_seen` | 87 KB of 91 KB (95 %) is dead-weight SHA1 hashes |

## Findings / Output — ranked improvement vectors

Severity/confidence/effort are the agents' measured assessments. IDs cross-reference the agent findings.

### Tier 1 — Stop doing the work on unchanged polls (highest leverage, common case)

- **V1. ETag/304 + `(path,mtime_ns,size)` state cache.** [Wire NET-1, Cacheworth DATA-1, Tail WATCH-2] Fingerprint the globbed ledger files **+ the focus/dismissed/annotation config stores** (~0.11 ms); if unchanged, return cached state / `304` with no body and **skip the entire derive**. Keep `generatedAt`/relative-now out of the signature; recompute cheap freshness labels from cached `last_work_ts` + now. **Measured 235–270 ms → 0.11 ms (~2,400×)** on unchanged polls — which is essentially every idle poll and most active ones. Effort **M**, low correctness risk (304 = "reuse what you have"). **The single highest-leverage cross-cutting win.**

### Tier 2 — Make the derive itself fast (for polls that do rebuild; de-risks the large-ledger case)

- **V2. Index the ledger by `session_id` once per build.** [Profiler BE-1, Cacheworth DATA-4, Tail WATCH-2] `Ledger._acts/_cps` full-scan the whole list every call (341×/req). Build `defaultdict(list)` indexes in `__init__` **after** the sort. **Measured 170 → 108 ms alone; 2,380× faster per `_acts`.** This is what makes any provider's marginal cost **linear (additive)** instead of multiplicative — the direct fix for "the whole app got slower after Gemini." Effort **S**, low risk.
- **V3. `parse_ts`: `fromisoformat`-first + memoize.** [Profiler BE-2, Cacheworth DATA-3] 25,828 calls/req; the strptime "fast-path" loads locale machinery per call and is **10× slower** than `fromisoformat`. Reorder + memoize (timestamps repeat heavily). **Combined with V2 → 45 ms (3.8×); warm cache → 14 ms (12×)**; kills the 41 ms sort overhead too. Effort **S**, low risk (preserve `0.0`-on-failure + `Z` normalization; bound the cache).
- **V4. Memoize `story_id_for` + build the `story_id→[sids]` inverse map once; cache `git_branch` per cwd.** [Profiler BE-3, Cacheworth DATA-5] O(sessions²) recompute (118 `story_id_for` + 100 `.git/HEAD` FS stats per req). **Becomes critical the moment `epics.json` is populated** (roadmap → O(epics×stories×sessions×records)). Effort S–M.
- **V5. Single-pass per-session derivation; compute `acked_ids` once.** [Profiler BE-5] `live_sessions` re-scans each sid 4× (last_work/first_work/has_substance/ended_at); `_build_terminal` calls `last_work_ts` again; `acked_ids` re-scans the whole ledger per session. Effort M, medium risk (different meta-exclusion sets — verify equivalence). Largely collapses once V2 lands.

### Tier 3 — Bound growth so cost stays flat forever (durable structural fix)

- **V6. Retention / compaction / read-window.** [Cacheworth DATA-2 & DATA-6, Tail WATCH-3] The ledger never prunes; the board only renders `LIVE_WINDOW_SECS = 86400` (<24 h) sessions yet re-parses all history (337 K dead records in the worst case). (a) read-side window (parse only records newer than now−window — safe, non-destructive); (b) compaction of closed/old sessions into a cold archive the board never reads; (c) incremental tail-load (byte offset per file, parse only appended bytes — the watcher already does this; fall back to full re-read on truncation/rotation — note `hook.log` rotates at 5 MB, so rotation happens). Caps per-poll parse at **constant** (live-window) instead of **linear-forever**. Effort M, medium risk (preserve cross-session story continuity).

### Tier 4 — Clean the 158 MB landmine + prevent recurrence

- **V7. One-time cleanup of `~/.agent-histograph` residue + guards.** [Tail WATCH-1 & WATCH-4, Cacheworth DATA-2] 158 MB = 99.9 % duplicate Gemini replay (140,386 → 208 unique). (a) Back up, then rewrite canonical files keeping unique records → 158 MB → <1 MB, **3.25 s → <0.1 s load**. (b) Watcher startup assertion that it only ever writes `*.gemini.jsonl` + a canonical-file size-sanity refusal. (c) **Global single-instance lock** on a fixed path (the current lock is namespaced *per `AGENTLOG_DIR`*, so a live watcher and a bare-default watcher held independent locks — exactly why the duplicate-watcher incident could write the same canonical files) **+ boot-epoch in the lock** (`_pid_alive` is PID-only → unsafe across reboots / PID reuse). Effort **S**. Urgent-if-bare-launched; Matt's live board reads the clean `~/.agentlog`, so his current slowness is the structural per-poll cost (Tiers 1–3), but this is a sitting catastrophe for any double-click launch.

### Tier 5 — Frontend: stop rebuilding + perpetual painting

- **V8. Gate the fleet list on a signature + reconcile by key.** [Pixel FE-1] `renderTriage()` clears + full-rebuilds the entire lane list every poll (no early-out) — ~130–160 nodes + 32 listeners re-bound/poll, scaling with lane count. Mirror the existing `focusSig` gate + keyed reconciliation. Effort M. Pairs with V1 (a 304 lets the client skip paint entirely).
- **V9. Make pulse animations compositor-safe.** [Pixel FE-2] `hgPulse` animates `box-shadow` (**not** compositor-safe → perpetual per-frame paint per lane dot, runs forever even when hidden on desktop). Re-express as a `transform: scale()` + `opacity` `::after` ring; `will-change: transform`; pause on `document.hidden`. Effort M. Likely the biggest "whole app feels heavier" contributor on the frameless WebView2 as lanes grow (Gemini adds a perpetually-animating dot).
- **V10. `content-visibility: auto` + `contain` on rows.** [Pixel FE-4] Zero containment anywhere; off-screen transcript/lane rows pay full layout+paint. Add to `.hg-entry`/`.hg-trow` with `contain-intrinsic-size`. Effort **S**, high leverage, low risk — directly counteracts Gemini-driven content growth.
- **V11. `renderFocus` reflow batching + keyed trail reconciliation.** [Pixel FE-3] read-then-write forced sync layout + full unkeyed trail rebuild + multi-frame ResizeObserver settle. Effort **L** — the auto-scroll policy is hard-won; do V8/V9/V10 first.

### Tier 6 — Transport hygiene

- **V12. Fix `/api/ledger` candidate scan (3.9 s → <50 ms).** [Wire NET-3] `dir_stats` does a full `from_dir` per candidate incl. the 158 MB default → settings-modal open hangs ~3.9 s. Use stat/tail/cached heuristic for session counts. Effort M (largely mooted for the active dir by V7, but full-parse-per-candidate is still wrong).
- **V13. Collapse annotate's double-refetch; HTTP/1.1 keep-alive; gzip only under 304.** [Wire NET-5, NET-4, NET-2] `requestAnnotate` fires **2** sequential full-derive refetches (~540 ms/click); focus/dismiss add one each. HTTP/1.0 → new TCP per poll. gzip is near-worthless on loopback (skip, or only under the 304 path). Mostly resolved by V1. Effort S, low priority.

## Recommended sequence

1. **V1 + V2 + V3** — immediate, measured, low-risk. Rebuild polls 270 ms → 14–45 ms; unchanged polls → ~0.1 ms. This alone makes the board "snappier than ever."
2. **V7** — kill the 158 MB landmine + prevent recurrence (global lock + canonical-write guard).
3. **V9 + V10 + V8** — compositor-safe animation, containment, fleet-gate (stop perpetual paint + per-poll rebuild).
4. **V6** — retention/compaction (the durable flat-cost fix).
5. **V4, V5, V11, V12, V13** — cleanup tier.

## Unresolved items / for the user

- ~~These are improvement **vectors for review**, not yet implemented.~~ **All implemented 2026-06-18** (V1–V5, V7–V13), uncommitted on `main`. V6 (retention/compaction) was deliberately **deferred** — see Implementation below.
- V5/V11 correctness risks were retired by preserving exact logic (V5 = byte-identical memoization of now-independent functions, NOT a hand-merged single pass; V11 = the `applyScroll` policy is called verbatim, only node reuse changed). The differing meta-exclusion sets between `agentlog_read` and `serve_state` were preserved (a test caught one mis-modeled assumption).
- Token usage per agent unavailable in this adapted run.

---

## Implementation (2026-06-18)

All vectors implemented with TDD (logic) / test-after (UI), **uncommitted on `main`** (the `feature/gemini-integration` branch was already merged + the working tree is on `main`; per the branch-first rule, a commit should branch off `main` first). **393 tests green** (248 agentlog + 135 capture-proof + 10 mjs) and an integrated live-server smoke passes.

### What shipped

| Vector | Where | Note |
|---|---|---|
| **V3** parse_ts | `agentlog_read.py` | `fromisoformat`-first + `lru_cache(131072)`. Byte-identical to the old two-tier parser (pinned by an inlined-oracle test). |
| **V2** session index | `agentlog_read.py` | `_cps_by_sid`/`_acts_by_sid` defaultdicts built once after sort → `_cps`/`_acts` O(1). |
| **V1** parse cache + 304 | `serve_http.py`, `app.js` | Parsed `Ledger` cached on a `(path,mtime,size)` fingerprint per dir; `build_state` still re-derives every poll (freshness/working stay live). ETag over the payload-minus-`generatedAt`; client sends `If-None-Match`, skips parse+paint on 304. |
| **V4** story/branch memo | `serve_state.py` | Per-Ledger memo of `story_id_for` + `git_branch` + an inverse `story_id→sids` index (kills O(sessions²)). |
| **V5** session memos | `serve_state.py`, `agentlog_read.py` | `acked_ids` + `last_work_ts`/`first_work_ts`/`session_has_substance` memoized per Ledger (now-independent). |
| **V7** residue + lock | `compact_ledger.py` (new), `gemini_watcher.py` | Lossless de-dup tool (safe-by-default, backs up); ran it: **158 MB → 209 KB** (337,647 → 391 lines). Watcher lock now machine-global + heartbeat-stale reclaim (defeats PID reuse). |
| **V10** containment | `app.css` | `contain: layout` on `.hg-entry` (scroll-geometry-safe); `content-visibility:auto` on `.hg-trow`. **NOT** content-visibility on entries — it fights the `ae-scroll-area` auto-follow. |
| **V9** compositor pulse | `markers.css`, `app.css`, `app.js` | `box-shadow` ring → transform/opacity `::after` ring (`hgRing`); pause on hidden browser tab. |
| **V8** fleet reconcile | `render.js` | `renderTriage` keyed reconcile (reuse unchanged lane nodes + scroll). |
| **V11** focus reconcile | `render.js` | Keyed transcript reconcile; scroll-area + unchanged entries reused; `applyScroll` policy unchanged. Shares the generic `reconcileKeyed` with V8. |
| **V12** /api/ledger | `serve_ledger.py` | `_dir_quickstats` streaming scan (no full Ledger per candidate). |
| **V13** transport | `app.js`, `serve_http.py` | Annotate double-refetch → single; HTTP/1.1 keep-alive. gzip intentionally skipped (net-negative on loopback). |

### Measured (bench_state.py, 56 sessions / 7840 records, all live)

- derive **390 → 5.2 ms** (75×); full poll **445 → 23 ms** (19×); warm cached poll (V1, unchanged ledger) **~1.6 ms** (~170× vs the ~270 ms real baseline); bare-exe 158 MB residue path **3.25–8.7 s → 3.6 ms**; `/api/ledger` **3,900 → 29 ms**. Warm 304 poll end-to-end over real HTTP keep-alive: **3.2 ms**.

### Decisions

- **V1 caches the parsed Ledger, NOT the final payload.** The payload is time-derived (`working_now`/`ACTIVE_SECS=45`, `derive_freshness`, `LIVE_WINDOW`), so caching it would re-introduce the "stuck pulsing NOW" bug (fixed 2026-06-15). The 304 is safe because the validator excludes only `generatedAt` — any real change (incl. a freshness tick) flips it.
- **gzip skipped** — on a loopback board the compression CPU exceeds the transfer savings for a ~20 KB body.
- **V6 (retention/compaction) deferred** — the per-poll cost is already constant-ish after V1's cache + V7's residue cleanup, and a correct read-window must not drop records a live cross-session story still references. Re-evaluate if a single dir's *live* (<24h) record count ever dominates a cold parse. Not worth the migration/archive-format risk now.

### New artifacts

- `agentlog/compact_ledger.py` + `test_compact_ledger.py` — reusable lossless ledger de-duplicator.
- `agentlog/bench_state.py` — repeatable read/derive microbenchmark.
- `agentlog/test_agentlog_read.py`, `test_serve_state_perf.py` — perf-vector equivalence tests.
- `histograph/test_triage_reconcile.mjs`, `test_focus_reconcile.mjs` — keyed-reconcile contract tests.

### Still open

- `gemini_watcher.py` has no auto-launch path (flagged in the health page); the hardened lock makes auto-launch safe to add now.
