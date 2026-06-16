# Histograph (desktop)

A low-chrome [Tauri 2](https://v2.tauri.app) wrapper around `agentlog serve`. It
gives you the histograph board as a **frameless, always-on-top window you can pin
beside your terminal sessions** — no browser tabs, no URL bar, no opportunity to
wander off into another tab and lose context.

## How it works

This app does **not** bundle the histograph frontend. On launch it:

1. Shows a tiny bundled splash ("starting histograph…").
2. Spawns `python agentlog.py serve --port 0 --host 127.0.0.1 --no-browser` as a
   **managed child process** (no console flash; killed on exit so it's never
   orphaned).
3. Parses the OS-assigned port from the server's stdout banner.
4. Navigates the webview to `http://127.0.0.1:<port>/` — the same histograph page
   `agentlog serve` renders in a browser.

The Python `serve_state` derivation stays the single source of truth; this is
purely a window around it. Because the window is frameless, the histograph page's
own `.hg-titlebar` is the drag handle, and the app injects **pin / minimize /
close** controls into it.

> **Windows-primary.** A built/installed app can't see this source tree, so an
> installed build on another machine **must** set `AGENTLOG_HOME` to its
> `agent-histograph/agentlog` directory (see below) — there is no baked path.
> Bundle targets are Windows (`msi`/`nsis`); macOS/Linux builds work but need the
> env overrides below.

## Running it

Prerequisites: Rust + the Tauri CLI (`cargo install tauri-cli` or `cargo binstall
tauri-cli`), Node, and Python. The histograph's Aegis assets are already vendored
and checked in (`../histograph/static/aegis/`), so the served page has its theme
out of the box — `vendor_aegis.sh` is only needed to RE-vendor from an Aegis source
checkout, which this repo does not include.

```sh
# from agentlog/desktop/
cargo tauri dev          # stages the splash once + launches the shell
                         # (restart `dev` to pick up splash edits — no splash HMR)
cargo tauri build        # release build -> installers under src-tauri/target/release/bundle/
```

Debug builds open devtools automatically. A release build with the `devtools`
feature is a **compile error** by design.

### Pointing at a different agentlog checkout / Python

The app resolves the agentlog directory in this order:

1. `AGENTLOG_HOME` env var (if it contains `agentlog.py`),
2. dev-relative to this crate (`../..` — i.e. the parent `agentlog/` dir).

A packaged build with neither resolving fails with a concrete
`agentlog.py not found at <path> — set AGENTLOG_HOME …` error (no silent baked path).

The Python interpreter is resolved as: `AGENTLOG_PYTHON` env override → else the
first of (`py -3`, `python`, `python3` on Windows; `python3`, `python` on POSIX)
whose `--version` succeeds. This sidesteps the Microsoft Store App-Execution-Alias
stub and POSIX's `python3`-only convention. Set `AGENTLOG_HOME` / `AGENTLOG_PYTHON`
to run against another checkout or interpreter.

## Security posture

Follows [[Tauri Best Practices]]. Notably:

- **`tauri >= 2.11.1`** is pinned (not the fleet's bare `"2"`): this app grants
  IPC to a remote (loopback) origin on Windows, which is exactly the threat model
  of CVE-2026-42184 (`is_local_url()` origin confusion), patched in 2.11.1.
- **Split capabilities.** The loopback histograph origin is granted *only* four
  window-chrome commands (`start-dragging`, `set-always-on-top`, `minimize`,
  `close`) via `capabilities/remote.json`. It gets no `core:default`, no fs, no
  shell, no dialog. The bundled splash's broader permissions live in
  `capabilities/default.json` (local-only, no `remote` field).
- **No `shell:execute`.** The sidecar is spawned directly via `tokio::process`
  with `CREATE_NO_WINDOW`, not through the shell plugin — smaller attack surface.
- **CSP on the served page.** Tauri's compile-time CSP can only reach bundled
  assets (the splash), so the histograph page sets its own via `serve_http.py`
  response headers (`connect-src 'self'`, `object-src 'none'`, `frame-ancestors
  'none'`, `base-uri 'self'`, + `X-Content-Type-Options: nosniff`). That closes
  the exfil path on the only origin that holds IPC.
- **Never-orphaned sidecar.** Graceful exit reaps the child (RunEvent::Exit +
  WindowEvent::Destroyed), `kill_on_drop` covers panic-unwind, and a Windows Job
  Object (`KILL_ON_JOB_CLOSE`) backstops a force-kill / crash of the parent.
- **Release-mode devtools guard** + `windows_subsystem = "windows"`.

## Known limitations / deferred

- **External links don't escape to the browser.** `on_navigation` traps any
  off-origin navigation (correct — the pinned window shouldn't wander off the
  board), but there's no system-browser handoff. The current histograph page has
  no external links, so this is latent; if one is added, wire `tauri-plugin-shell`
  `open` into `on_navigation`'s reject path.
- **Ephemeral-port trust is loopback-wide.** The remote IPC capability wildcards
  the port (`http://127.0.0.1:*`) because `--port 0` is unknowable at static-config
  time. Bounded by the cosmetic-only 4-command + 1-getter set; acceptable for a
  personal tool.

## Layout

```
desktop/
├── ui/                     # the bundled splash (no framework)
│   ├── build.mjs           # stages src/ -> dist/ (beforeBuildCommand)
│   └── src/{index.html,splash.css,splash.js}
└── src-tauri/
    ├── tauri.conf.json     # withGlobalTauri, frameless, house CSP (splash only)
    ├── capabilities/{default,remote}.json
    └── src/
        ├── main.rs         # windows_subsystem guard -> lib::run()
        ├── lib.rs          # builder: plugins, setup, kill-on-exit
        ├── sidecar.rs      # spawn serve, parse port, manage child
        ├── window.rs       # frameless window + injected drag/pin/close + on_navigation
        └── process_hygiene.rs  # CREATE_NO_WINDOW spawn helper
```
