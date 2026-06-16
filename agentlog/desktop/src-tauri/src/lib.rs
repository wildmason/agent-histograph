//! Histograph — a low-chrome Tauri 2 wrapper around `agentlog serve`.
//!
//! The window is frameless and pins beside terminal sessions. It does NOT bundle
//! the histograph frontend: it spawns `agentlog serve` (a Python stdlib HTTP
//! server) as a managed child, parses the ephemeral port from its stdout banner,
//! and navigates the webview to that loopback URL. The Python `serve_state`
//! derivation stays the single source of truth.

// Refuse to compile a RELEASE binary with devtools on — that would hand a
// debugger + the IPC bridge to any XSS. (Verbatim from helm/src-tauri/src/lib.rs.)
#[cfg(all(feature = "devtools", not(debug_assertions)))]
compile_error!(
    "the `devtools` feature must not be built into a release binary — remove \
     `--features devtools` from the build command, or run a debug build if \
     devtools access is genuinely needed"
);

mod jobobject;
mod process_hygiene;
mod sidecar;
mod window;

use std::sync::{Arc, Mutex as StdMutex};

use tauri::{Emitter, Listener, Manager, RunEvent, WindowEvent};
use tauri_plugin_log::{Target, TargetKind};

use sidecar::SidecarState;

/// Coordinates sidecar-error delivery with the splash's listener registration.
/// `emit` is fire-and-forget, so a FAST sidecar failure (missing python /
/// agentlog.py) can fire before the splash webview has run splash.js and
/// subscribed — the event would be dropped and the splash would spin forever.
/// The splash emits `splash-ready` once subscribed; until then any error is held
/// here and flushed on that signal.
#[derive(Default, Clone)]
struct SplashComm(Arc<StdMutex<SplashState>>);

#[derive(Default)]
struct SplashState {
    ready: bool,
    pending_error: Option<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("histograph".into()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                .max_file_size(10 * 1024 * 1024)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        // Persist only window position+size; decorations/always-on-top stay from
        // the builder so a restore can't fight the frameless/pinned config.
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::POSITION
                        | tauri_plugin_window_state::StateFlags::SIZE,
                )
                .build(),
        )
        .manage(SidecarState::default())
        .setup(|app| {
            let handle = app.handle().clone();

            // Show the frameless splash immediately; the sidecar boots below.
            window::build_main_window(&handle)?;

            #[cfg(debug_assertions)]
            if let Some(w) = handle.get_webview_window("main") {
                w.open_devtools();
            }

            let comm = SplashComm::default();

            // When the splash signals it has registered its sidecar-error listener,
            // flush any error that already occurred (lost-race recovery).
            {
                let comm = comm.clone();
                let h = handle.clone();
                handle.listen("splash-ready", move |_evt| {
                    let pending = {
                        let mut s = comm.0.lock().unwrap();
                        s.ready = true;
                        s.pending_error.take()
                    };
                    if let Some(err) = pending {
                        let _ = h.emit("sidecar-error", err);
                    }
                });
            }

            // Spawn `agentlog serve`, capture its port, navigate the window to it.
            let comm = comm.clone();
            tauri::async_runtime::spawn(async move {
                let dir = sidecar::agentlog_dir();
                log::info!("resolving agentlog dir: {}", dir.display());
                match sidecar::spawn_histograph_sidecar(&dir).await {
                    Ok(spawned) => {
                        log::info!("histograph serve up at {}", spawned.url);
                        // Stash child + kill-on-close job for teardown BEFORE navigating.
                        handle
                            .state::<SidecarState>()
                            .store(spawned.child, spawned.job)
                            .await;
                        if let Some(win) = handle.get_webview_window("main") {
                            match spawned.url.parse::<tauri::Url>() {
                                Ok(url) => {
                                    if let Err(e) = win.navigate(url) {
                                        log::error!("navigate to histograph failed: {e}");
                                    }
                                }
                                Err(e) => log::error!("bad sidecar url {:?}: {e}", spawned.url),
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("histograph sidecar failed to start: {e}");
                        // Deliver to the splash, or hold until it's ready (race-safe).
                        let mut s = comm.0.lock().unwrap();
                        if s.ready {
                            drop(s);
                            let _ = handle.emit("sidecar-error", e);
                        } else {
                            s.pending_error = Some(e);
                        }
                    }
                }
            });

            Ok(())
        })
        // Window closed (vs app-quit): reap the sidecar. The event loop is still
        // alive here, so a detached task is safe.
        .on_window_event(|win, event| {
            if let WindowEvent::Destroyed = event {
                let state = win.state::<SidecarState>().inner().clone();
                tauri::async_runtime::spawn(async move { state.kill().await });
            }
        })
        // Two-stage build/run so we get the RunEvent callback. This is the
        // orphan-prevention linchpin: on app exit, BLOCK until the child is dead
        // (a detached task could be cut off as the process image tears down).
        .build(tauri::generate_context!())
        .expect("error while building Histograph")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                let state = app.state::<SidecarState>();
                tauri::async_runtime::block_on(state.kill());
            }
        });
}
