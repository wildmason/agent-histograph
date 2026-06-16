// Splash behaviour. Kept external (not inline) because the bundled CSP is
// `script-src 'self'` with no unsafe-inline. The window-drag + pin/close
// controls come from the Rust-injected init script (window.rs), NOT here.
//
// This surfaces a sidecar startup FAILURE: if the Rust side can't spawn
// `agentlog serve`, it emits a `sidecar-error` event with the message, and we
// swap the splash into an error state instead of spinning forever.
//
// `emit` is fire-and-forget, so a FAST failure (missing python / agentlog.py)
// can fire before this listener registers. To close that race we emit
// `splash-ready` AFTER subscribing; the Rust side holds any already-occurred
// error and flushes it on that signal.
(() => {
  const T = window.__TAURI__;
  if (!T || !T.event || !T.event.listen) return;

  T.event.listen('sidecar-error', (e) => {
    const main = document.querySelector('.splash');
    const msg = document.getElementById('msg');
    const sub = document.getElementById('sub');
    if (main) main.classList.add('splash--error');
    if (msg) msg.textContent = 'histograph could not start';
    if (sub) sub.textContent = String((e && e.payload) || 'the local serve failed to launch');
  });

  // Subscribed — tell Rust to flush any error that already happened.
  if (T.event.emit) {
    T.event.emit('splash-ready').catch(() => {});
  }
})();
