//! Spawns `agentlog serve` (the Python histograph HTTP server) as a managed
//! child, parses the OS-ephemeral port from its stdout banner, and exposes a
//! handle for killing it on app exit so it is never orphaned.

use std::collections::VecDeque;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Child;
use tokio::sync::Mutex;

use crate::jobobject::KillOnCloseJob;
use crate::process_hygiene::silent_tokio_command;

/// Substring marking the bound-URL token in serve_http.py's banner:
///   agentlog histograph serving at http://127.0.0.1:<PORT>/  (Ctrl-C to stop)
const URL_MARK: &str = "http://127.0.0.1:";

/// How many stderr lines to retain so a Python startup crash surfaces its actual
/// traceback in the error shown on the splash, not a generic "serve failed".
const STDERR_TAIL: usize = 12;

/// Interpreter candidates to try in order, as (program, prefix-args). On Windows
/// the `py -3` launcher is preferred (immune to the Microsoft Store App-Execution-
/// Alias stub); on POSIX `python3` is canonical.
#[cfg(windows)]
const PY_CANDIDATES: &[(&str, &[&str])] = &[("py", &["-3"]), ("python", &[]), ("python3", &[])];
#[cfg(not(windows))]
const PY_CANDIDATES: &[(&str, &[&str])] = &[("python3", &[]), ("python", &[])];

/// A running sidecar: the parsed loopback URL, the live child to manage, and the
/// optional kill-on-close job that backstops a force-kill/crash of the parent.
pub struct Spawned {
    pub url: String,
    pub child: Child,
    pub job: Option<KillOnCloseJob>,
}

/// Tauri-managed handle to the running sidecar. Cloning shares the same child +
/// job (Arc), so the window-event path and the app-exit path act on the same
/// process.
#[derive(Default, Clone)]
pub struct SidecarState {
    child: Arc<Mutex<Option<Child>>>,
    job: Arc<Mutex<Option<KillOnCloseJob>>>,
}

impl SidecarState {
    pub async fn store(&self, child: Child, job: Option<KillOnCloseJob>) {
        *self.child.lock().await = Some(child);
        *self.job.lock().await = job;
    }

    /// Kill the sidecar if still running. Idempotent. The Python server runs
    /// `serve_forever()` in-process with no grandchild workers (see serve_http.py),
    /// so killing the `python` PID is sufficient — there is no process tree to reap.
    /// Dropping the job (KILL_ON_JOB_CLOSE) is a redundant belt to the explicit kill.
    pub async fn kill(&self) {
        let _ = self.job.lock().await.take();
        let mut guard = self.child.lock().await;
        if let Some(mut child) = guard.take() {
            let _ = child.kill().await;
            let _ = child.wait().await;
        }
    }
}

/// Resolve the agentlog project dir holding `agentlog.py`:
///   1. `AGENTLOG_HOME` env override (required for an installed/packaged build —
///      point it at `<your checkout>/agentlog`), else
///   2. dev-relative to this crate (`<crate>/../..` == the `agentlog/` dir, since
///      the layout is `agentlog/desktop/src-tauri`).
/// The dev-relative path is returned as the last resort even if it doesn't
/// validate, so a packaged build with no `AGENTLOG_HOME` set fails with a concrete
/// "agentlog.py not found at <path>" rather than a silent baked machine path.
pub fn agentlog_dir() -> PathBuf {
    if let Ok(p) = std::env::var("AGENTLOG_HOME") {
        let pb = PathBuf::from(p);
        if pb.join("agentlog.py").is_file() {
            return pb;
        }
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("..")
}

/// Resolve a working Python interpreter as (program, prefix-args). Honors
/// `AGENTLOG_PYTHON`, else probes the platform candidate chain with `--version`.
/// Falls back to the last candidate so the real spawn still attempts something
/// (and surfaces a concrete error) if nothing probes clean.
async fn resolve_python() -> (String, Vec<String>) {
    if let Ok(p) = std::env::var("AGENTLOG_PYTHON") {
        if !p.trim().is_empty() {
            return (p, Vec::new());
        }
    }
    for (prog, prefix) in PY_CANDIDATES {
        if probe_interpreter(prog, prefix).await {
            return (prog.to_string(), prefix.iter().map(|s| s.to_string()).collect());
        }
    }
    let (prog, prefix) = PY_CANDIDATES[PY_CANDIDATES.len() - 1];
    (prog.to_string(), prefix.iter().map(|s| s.to_string()).collect())
}

/// True if `<prog> <prefix> --version` runs and exits 0 within 3s. Rejects a
/// disabled Microsoft Store alias stub and missing interpreters.
async fn probe_interpreter(prog: &str, prefix: &[&str]) -> bool {
    let mut cmd = silent_tokio_command(prog);
    cmd.args(prefix)
        .arg("--version")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    matches!(
        tokio::time::timeout(Duration::from_secs(3), cmd.status()).await,
        Ok(Ok(status)) if status.success()
    )
}

/// Spawn the sidecar; return once it prints its serving banner (or error/timeout).
pub async fn spawn_histograph_sidecar(dir: &Path) -> Result<Spawned, String> {
    let script = dir.join("agentlog.py");
    if !script.is_file() {
        return Err(format!(
            "agentlog.py not found at {} — set AGENTLOG_HOME to your \
             agent-histograph/agentlog directory",
            script.display()
        ));
    }

    let (prog, prefix) = resolve_python().await;
    log::info!("python interpreter: {} {}", prog, prefix.join(" "));

    // `-u` forces unbuffered stdout so the banner line arrives promptly over the
    // pipe (block-buffering would stall the splash->navigate handoff).
    let mut cmd = silent_tokio_command(&prog);
    cmd.args(&prefix)
        .arg("-u")
        .arg(&script)
        .args(["serve", "--port", "0", "--host", "127.0.0.1", "--no-browser"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        // Backstop: if the managed State is never reached on a panic-unwind,
        // dropping the Child still terminates python.
        .kill_on_drop(true);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("failed to spawn `{prog} {} serve`: {e}", script.display()))?;

    let stdout = child.stdout.take().ok_or("sidecar produced no stdout handle")?;
    let mut lines = BufReader::new(stdout).lines();

    // Retain the tail of stderr so a Python startup crash (bad import, syntax error)
    // surfaces its traceback in the error rather than only in the rotating log.
    let stderr_tail: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));
    if let Some(stderr) = child.stderr.take() {
        let tail = stderr_tail.clone();
        let mut elines = BufReader::new(stderr).lines();
        tauri::async_runtime::spawn(async move {
            while let Ok(Some(line)) = elines.next_line().await {
                log::warn!("[serve:stderr] {line}");
                let mut buf = tail.lock().await;
                if buf.len() == STDERR_TAIL {
                    buf.pop_front();
                }
                buf.push_back(line);
            }
        });
    }

    // Wait for the banner, bounded so a server that never prints it fails loudly.
    let url: String = match tokio::time::timeout(Duration::from_secs(15), async {
        while let Ok(Some(line)) = lines.next_line().await {
            log::info!("[serve] {line}");
            if let Some(u) = parse_url(&line) {
                return Ok::<String, String>(u);
            }
        }
        Err("sidecar stdout closed before printing the serving banner".to_string())
    })
    .await
    {
        Ok(Ok(u)) => u,
        Ok(Err(e)) => return Err(enrich_with_stderr(e, &stderr_tail).await),
        Err(_) => {
            return Err(enrich_with_stderr(
                "timed out after 15s waiting for the histograph serving banner".to_string(),
                &stderr_tail,
            )
            .await)
        }
    };

    // Backstop the graceful-exit kill paths with a Windows kill-on-close job so a
    // force-kill / crash of Histograph still terminates this serve (best-effort).
    let job = child.id().and_then(crate::jobobject::assign);
    if job.is_some() {
        log::info!("sidecar assigned to kill-on-close job object");
    }

    // Keep draining stdout for the child's lifetime. The wrapped server is
    // effectively silent after the banner (per-request logging is no-op'd in
    // serve_http.py and the only other stdout write is the Ctrl-C shutdown line,
    // which a kill() never triggers), so this parks on next_line() rather than
    // doing real work — belt-and-suspenders, not a required backpressure relief.
    tauri::async_runtime::spawn(async move {
        while let Ok(Some(line)) = lines.next_line().await {
            log::info!("[serve] {line}");
        }
    });

    Ok(Spawned { url, child, job })
}

/// Append the retained stderr tail to an error message (after a short grace for
/// the drain task to flush the traceback), so the splash shows the real cause.
async fn enrich_with_stderr(mut msg: String, tail: &Arc<Mutex<VecDeque<String>>>) -> String {
    tokio::time::sleep(Duration::from_millis(250)).await;
    let lines: Vec<String> = tail.lock().await.iter().cloned().collect();
    if !lines.is_empty() {
        msg.push_str(" — python stderr: ");
        msg.push_str(&lines.join(" | "));
    }
    msg
}

/// Extract `http://127.0.0.1:<port>/` from a banner line. Robust to the two
/// spaces before `(Ctrl-C to stop)` — take the first whitespace-delimited token
/// starting at the URL mark, and require a numeric port.
fn parse_url(line: &str) -> Option<String> {
    let idx = line.find(URL_MARK)?;
    let token = line[idx..].split_whitespace().next()?;
    let after = &token[URL_MARK.len()..];
    let port_part = after.trim_end_matches('/');
    if !port_part.is_empty() && port_part.chars().all(|c| c.is_ascii_digit()) {
        Some(token.to_string())
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::parse_url;

    #[test]
    fn parses_ephemeral_port_banner() {
        // Exact shape from serve_http.py (two spaces before the hint, trailing /).
        let line = "agentlog histograph serving at http://127.0.0.1:54123/  (Ctrl-C to stop)";
        assert_eq!(parse_url(line).as_deref(), Some("http://127.0.0.1:54123/"));
    }

    #[test]
    fn parses_default_port_without_hint() {
        let line = "agentlog histograph serving at http://127.0.0.1:8080/";
        assert_eq!(parse_url(line).as_deref(), Some("http://127.0.0.1:8080/"));
    }

    #[test]
    fn rejects_unrelated_and_portless_lines() {
        assert_eq!(parse_url("some other log line"), None);
        assert_eq!(parse_url("listening on http://127.0.0.1:/ now"), None);
        // a non-loopback host must not match (we only trust 127.0.0.1)
        assert_eq!(parse_url("serving at http://0.0.0.0:9000/"), None);
    }
}
