# agent-histograph

A **low-chrome desktop command center for your AI coding agents.** It captures
what your **Claude Code, Codex, and Gemini** sessions are doing and renders a
live, pinnable board — terminals, the work each is on, the decision trail — in a
**frameless, always-on-top window** you keep beside your terminals. No browser
tabs, no URL bar, nothing to wander off into.

All three providers land on one board: Claude Code and Codex via lifecycle hooks,
and Gemini (Antigravity CLI) via a transcript watcher the board auto-starts (it has
no hook surface of its own). See [How it works](#how-it-works) and
[Gemini capture](#gemini-capture).

This is a focused extraction of the histograph surface from a larger internal
control-plane project — just the command-center view and the capture that feeds
it. The research/gate/audit apparatus is intentionally left out.

```
┌─ Histograph (frameless Tauri window) ─┐
│  histograph · 4 terminals · all clear │   ← pin / minimize / close
│  ───────────────────────────────────  │
│  ▦ ▦ ▦ ▦   (triage mosaic)            │
│  ┌ focused story ───────────────────┐ │
│  │ decision trail … ● now           │ │
│  └──────────────────────────────────┘ │
└───────────────────────────────────────┘
```

## How it works

Three layers, one data source:

1. **Capture** — each agent appends its activity + decision checkpoints to
   `~/.agent-histograph/*.jsonl` (one per-host file per provider, unioned at read):
   - **Claude Code** — lifecycle hooks (`capture-proof/`), fired by Claude Code.
   - **Codex** — lifecycle hooks plus a SessionStart-spawned process watcher.
   - **Gemini (Antigravity CLI)** — has no hook surface, so a standalone tailer
     (`capture-proof/gemini_watcher.py`) reads `~/.gemini/antigravity-cli/brain/*/
     .system_generated/logs/transcript.jsonl` and mirrors it. The board's `serve`
     process **auto-starts this watcher** (single-instance), so Gemini lanes appear
     with no extra step — see *Gemini capture* below.
2. **Serve** — a tiny Python stdlib HTTP server (`agentlog/agentlog.py serve`)
   re-reads that ledger on every request and derives the board state. All logic
   lives here; it is the single source of truth. It also auto-starts the Gemini
   watcher in a daemon thread (disable with `--no-gemini-watch`).
3. **View** — the desktop app (`agentlog/desktop/`) is a frameless Tauri 2
   window. It does **not** bundle a frontend: on launch it spawns
   `agentlog.py serve --port 0 --no-browser` as a managed child, parses the
   ephemeral port from its banner, and navigates the webview to the loopback URL.
   The same page renders in a plain browser too.

The board is a *window onto the ledger* — so **capture must be running for it to
show anything.** Set that up first.

## Prerequisites

- **Python 3.9+** (stdlib only — no pip installs). Required at runtime.
- To **build the desktop app**: [Rust](https://rustup.rs) + the Tauri CLI
  (`cargo install tauri-cli` or `cargo binstall tauri-cli`) + Node 20+.
- **Cross-platform.** All Windows-specific code (console-suppression, the
  kill-on-close job) is `#[cfg(windows)]`-gated, so the crate compiles cleanly on
  macOS and Linux too. `bundle.targets` is `"all"`, so `cargo tauri build` emits
  the right installer for the host: `msi`/`nsis` on Windows, `app`/`dmg` on macOS,
  `deb`/`rpm`/`appimage` on Linux.

### macOS

```sh
xcode-select --install      # one-time: Command Line Tools (linker + SDK)
cd agentlog/desktop && cargo tauri build      # -> .app + .dmg under src-tauri/target/release/bundle/
```

The build is **unsigned**, so first launch needs **right-click → Open** (or
`xattr -dr com.apple.quarantine "<path to>.app"`) to clear Gatekeeper. The board
stays live while the window is unfocused/covered on macOS too — the Windows
occlusion/throttling flags no-op there, but a cross-platform poll guard keeps it
ticking regardless.

## Quick start

Three steps — **pull → configure → compile** — each a runnable command, no
machine-specific path editing anywhere (the configurator resolves paths from your
clone, and the board auto-starts Gemini capture):

```sh
# 1. pull
git clone https://github.com/wildmason/agent-histograph && cd agent-histograph

# 2. configure capture for the agents you use (paths auto-resolved from this checkout)
python capture-proof/install_hooks.py            # Claude Code  -> ~/.claude/settings.json
python capture-proof/install_hooks.py --codex    # Codex        -> ~/.codex/hooks.json
#   Gemini needs nothing — the board auto-starts its watcher.

# 3. compile the desktop board (needs Rust + Tauri CLI + Node — see Prerequisites)
cd agentlog/desktop && cargo tauri build         # installer under src-tauri/target/release/bundle/
```

That's the whole setup. The rest of this section expands each step.

### 1. Turn on capture (so the board has data)

```sh
python capture-proof/install_hooks.py            # Claude Code: hooks -> ~/.claude/settings.json
python capture-proof/install_hooks.py --codex    # Codex:       hooks -> ~/.codex/hooks.json
```

The installer resolves the hook paths from THIS checkout + your Python interpreter, so
there's nothing to hand-edit; it merges idempotently and preserves any other hooks you
have. Then **arm** capture for the sessions you want on the board, and start/restart the agent:

```sh
# PowerShell (persistent):   setx AGENTLOG_CAPTURE_ACTIVE 1     # then open a new terminal
# bash (one session):        export AGENTLOG_CAPTURE_ACTIVE=1
```

Un-armed, the hooks only passively log and cannot disrupt a session.
`AGENTLOG_DISABLE=1` no-ops everything. `--uninstall` removes them (add `--codex` to target Codex).

**Codex specifics.** `install_hooks.py --codex` writes `~/.codex/hooks.json` with the
correct paths — no editing. Approve the hooks once with `/hooks` in the Codex TUI (a
one-time trust step Codex requires). The Codex producer adds a passive `PostToolUse`
hook for live activity, armed-only declared-intent capture from `intent: <what> -- <why>`
assistant lines, an armed-only `PreToolUse` materiality reminder/audit for planned
billing/license/auth/migration/API/dependency/data-loss work, and a SessionStart-spawned
detached process watcher that records `session_end source=process_exit` when the Codex TUI
exits. Quiet Codex checkpoints are extracted through
`codex exec --output-schema capture-proof/checkpoint.schema.json` so prompt-injection audit
refusals can't replace the checkpoint ledger shape; shell/tool payload details remain
best-effort vs the Claude Code producer. (`capture-proof/codex-hooks.json` is a manual-merge
fallback if you'd rather wire it by hand — replace the `/ABSOLUTE/PATH/TO/...` placeholders.)

### 2. See the board

In a browser (quickest check):

```sh
python agentlog/agentlog.py serve            # opens http://127.0.0.1:8080/
```

As the pinnable desktop app:

```sh
cd agentlog/desktop
cargo tauri dev                              # run from source
cargo tauri build                            # -> installer under src-tauri/target/release/bundle/
```

**Day-to-day launcher.** Once built, start the board with the launcher at the
repo root — it resolves the Python backend relative to itself (no hard-coded
paths) and reads the `~/.agent-histograph` ledger:

```sh
run-histograph.cmd        # Windows  (double-click or run)
./run-histograph.sh       # macOS / Linux
```

**Pointing at a different ledger.** Set `AGENTLOG_DIR` before launching. The
clean way is a personal, **gitignored** `run-histograph.local.cmd` (or
`.local.sh`) that sets it and delegates to the generic launcher:

```bat
@echo off
set "AGENTLOG_DIR=%USERPROFILE%\.agentlog"
call "%~dp0run-histograph.cmd"
```

`*.local.cmd` / `*.local.sh` are gitignored, so a per-machine ledger choice never
lands in the repo.

**Switching the ledger from inside the app (no relaunch).** Open **Settings** (the
gear) → **Ledger** and pick a detected ledger directory — the board scans for sibling
`~/.agent*` dirs that hold a ledger and lists each with its session count (so
`~/.agentlog · 44 sessions` vs an empty `~/.agent-histograph` is obvious at a glance) —
or type a custom path. The board re-reads the new dir on its next poll and remembers
the choice in `~/.histograph/config.json`, so it **persists across restarts even when
you launch by double-clicking the exe with no `AGENTLOG_DIR` set** (the override beats
the env/default; "Reset to default" clears it). This is the durable fix for the classic
"the board is empty because it's pointed at the wrong/empty ledger" trap: when the board
has no live lanes **and** the dir it's reading is empty or missing, the empty state now
**names that dir** and offers a one-click **Change ledger…** action instead of a silent
blank.

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `AGENTLOG_DIR` | Where the ledger lives / is read from (the in-app **Settings → Ledger** override takes precedence over this) | `~/.agent-histograph` |
| `HISTOGRAPH_CONFIG_DIR` | Where the board persists its own settings — the in-app ledger-dir override **and** the theme/scheme/zoom prefs — so they survive a close/reopen even though the desktop app's ephemeral port wipes browser `localStorage` each launch | `~/.histograph` |
| `AGENTLOG_HOME` | Dir holding `agentlog.py` — **required for an installed desktop build** (point it at `<this repo>/agentlog`) | dev-relative to the crate |
| `AGENTLOG_PYTHON` | Explicit Python interpreter for the desktop app to spawn | auto-probes `py -3` / `python` / `python3` |
| `AGENTLOG_CAPTURE_ACTIVE` | `1` arms capture for the session | unset (passive only) |
| `AGENTLOG_DISABLE` | `1` no-ops all hooks | unset |
| `AGENTLOG_CODEX_WATCH_PROCESS_EXIT` | `0` disables the Codex SessionStart process-exit watcher | enabled |

A built/installed app can't see this source tree, so set `AGENTLOG_HOME` (and
ensure Python is on PATH, or set `AGENTLOG_PYTHON`) on the machine you install on.

### Gemini capture

Gemini (the Antigravity CLI) has no lifecycle-hook surface, so capture rides a
standalone tailer, `capture-proof/gemini_watcher.py`, that reads Gemini's transcripts
under `~/.gemini/antigravity-cli/brain/*/.system_generated/logs/transcript.jsonl` and
writes `activity.gemini.jsonl` / `checkpoints.gemini.jsonl` into your `AGENTLOG_DIR`.

You normally don't start it yourself: **`agentlog serve` auto-starts it** in a
single-instance daemon thread on launch (so it runs whenever the board is up, and the
desktop app gets it for free). The single-instance lock is machine-global with a
heartbeat — running two boards never produces two watchers (the duplicate-replay bug
that once bloated the ledger), and a crashed/killed watcher is reclaimed automatically.

- Opt out: `agentlog serve --no-gemini-watch`.
- Run it standalone (e.g. you view the board in a browser without `serve`, or want it
  decoupled from the board's lifetime): `python capture-proof/gemini_watcher.py` and
  leave it running. The same lock means this and the serve-managed thread can't both
  capture at once.

Maintenance: if a ledger ever accumulates duplicate residue,
`python agentlog/compact_ledger.py <dir>` reports a lossless de-dup (add `--apply` to
rewrite in place after backing the files up).

## What's included / not

**Included:** the histograph board (`agentlog/serve_*.py`, `histograph/`,
the Tauri shell), the `serve` + `epic` CLI, and the capture producer hooks.

**Not included** (left in the upstream control-plane project): the recall-audit /
gate / experiment apparatus, the spec docs, and the gate result artifacts. The
`agentlog` CLI here is a slim `serve`+`epic` entry point, not the full research CLI.

## Layout

```
agent-histograph/
├── agentlog/                 # serve layer + frontend + desktop shell
│   ├── agentlog.py           # CLI: `serve` (the board) + `epic` (roadmap)
│   ├── serve_http.py         # stdlib HTTP server (+ CSP/security headers)
│   ├── serve_state.py        # pure derivation of /api/state (the board)
│   ├── serve_epics.py        # epics.json load/derive (the roadmap band)
│   ├── agentlog_read.py      # the read surface over ~/.agent-histograph/*.jsonl
│   ├── histograph/           # the page: thin renderer on vendored Aegis v2 (self-contained)
│   ├── test_serve_*.py       # view tests (stdlib unittest)
│   └── desktop/              # the frameless Tauri 2 window
│       └── src-tauri/        # Rust shell: spawn serve, navigate, window chrome
└── capture-proof/            # Claude Code (+ Codex) capture producer
    ├── install_hooks.py      # portable hook registration into settings.json
    ├── *.py                  # the lifecycle hooks + the extractor
    ├── capture_prompt.txt    # the pinned checkpoint-extraction prompt
    └── checkpoint.schema.json # Codex exec response schema for quiet checkpoints
```

Run the view tests: `python -m unittest discover -s agentlog -p 'test_*.py'`.

## Notes

- **The sensitive thing is your ledger, not this repo.** The captured ledger
  (`~/.agent-histograph`, or wherever `AGENTLOG_DIR` points) holds your session
  content — keep *that* to yourself. It lives in your home directory, is never part
  of the repo, and is gitignored if it ever shows up here; the repo itself ships only
  code + vendored assets, no captured data. The board serves on `127.0.0.1` only and
  sets a strict CSP, so the ledger is never exposed off-machine.
- The vendored Aegis v2 assets (`agentlog/histograph/static/aegis/`) are checked
  in so the board is self-contained — you do not need the Aegis source to run it.
