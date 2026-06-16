//! Subprocess spawn helper that suppresses the Windows console window flash when
//! a Tauri GUI process invokes a console-mode child (`python`, etc.). Without
//! `CREATE_NO_WINDOW` Windows allocates a new console for the child, which pops a
//! visible black window on every spawn — distracting and looks like a virus on a
//! GUI desktop app. No-op on non-Windows platforms.
//!
//! Verbatim from the house pattern (bridge/src-tauri/src/process_hygiene.rs).

use std::ffi::OsStr;
use std::process::Command;

/// Sync `Command` with the platform's "don't show a console window" flag applied.
/// Kept for completeness; the sidecar uses the tokio variant.
#[allow(dead_code)]
pub fn silent_command<S: AsRef<OsStr>>(program: S) -> Command {
    let mut cmd = Command::new(program);
    apply_no_window(&mut cmd);
    cmd
}

/// `tokio::process::Command` variant — use from async contexts so the subprocess
/// wait yields back to the runtime instead of blocking a worker thread.
pub fn silent_tokio_command<S: AsRef<OsStr>>(program: S) -> tokio::process::Command {
    let mut cmd = tokio::process::Command::new(program);
    apply_no_window_tokio(&mut cmd);
    cmd
}

#[cfg(windows)]
#[allow(dead_code)]
fn apply_no_window(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    // CREATE_NO_WINDOW — see Microsoft Process Creation Flags.
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
#[allow(dead_code)]
fn apply_no_window(_cmd: &mut Command) {}

#[cfg(windows)]
fn apply_no_window_tokio(cmd: &mut tokio::process::Command) {
    // tokio::process::Command exposes creation_flags inherently on Windows.
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn apply_no_window_tokio(_cmd: &mut tokio::process::Command) {}
