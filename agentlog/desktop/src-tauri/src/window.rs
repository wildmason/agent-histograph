//! The frameless main window + the script injected into its content to provide
//! window chrome (drag / pin / minimize / close) for a decorations-less window
//! whose page is a REMOTE (loopback) origin Tauri did not bundle.

use tauri::{AppHandle, Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_window_state::{StateFlags, WindowExt};

/// Injected into EVERY top-level navigation — the bundled splash AND the remote
/// histograph page. It makes the in-page `.hg-titlebar` a drag handle and renders
/// pin / minimize / close controls in a FIXED top-right overlay.
///
/// Why an overlay and not appended-into-the-titlebar: the histograph titlebar is
/// `justify-content:space-between` with its own children (brand, live meta, the
/// settings gear). Appending controls into it displaced the gear and could
/// overflow the 320px min window. A fixed overlay is decoupled from the page's
/// flex model and works identically on the splash, the histograph, and any future
/// page; a reserved `padding-right` keeps the page's own titlebar content clear.
///
/// Why `window.__TAURI__` and not an ES import: the histograph page is served by
/// Python with no bundler/import-map, so `import('@tauri-apps/api/window')` can't
/// resolve. `app.withGlobalTauri = true` injects the global instead. The IPC this
/// performs is authorized for the loopback origin by capabilities/remote.json, and
/// the served page's CSP (serve_http.py) whitelists `ipc:`/`http://ipc.localhost`
/// so the invoke transport itself isn't blocked.
///
/// Styling is token-driven (`--ae-*`, with literal fallbacks for the splash, which
/// has no Aegis tokens) so the controls track whichever of the histograph's 20
/// themes is active. Icons are inline SVG built via the DOM — not `ae-icon` — so
/// they don't depend on `aegis.js` having registered its custom elements yet.
const DRAG_PIN_CLOSE_JS: &str = r##"
(() => {
  const T = window.__TAURI__;
  if (!T) return;
  // Defense in depth behind on_navigation: only wire on our own origins, so a
  // foreign localhost page that ever slipped the gate gets no chrome bridge.
  const okHost = location.hostname === '127.0.0.1'
    || location.hostname === 'tauri.localhost'
    || location.protocol === 'tauri:';
  if (!okHost) return;

  const appWindow =
    (T.window && T.window.getCurrentWindow && T.window.getCurrentWindow()) ||
    (T.webviewWindow && T.webviewWindow.getCurrentWebviewWindow && T.webviewWindow.getCurrentWebviewWindow());
  if (!appWindow) return;

  // The window API methods return PROMISES, so a synchronous try/catch around the
  // call site (the old code's `try { appWindow.minimize() } catch {}`) could never
  // catch an async rejection — a denied/blocked IPC just vanished. Route every
  // call through here so a failure lands in the devtools console instead.
  const call = (p, what) => {
    try { Promise.resolve(p).catch((e) => console.error('[histograph] window.' + what + ' failed', e)); }
    catch (e) { console.error('[histograph] window.' + what + ' threw', e); }
  };

  const SVGNS = 'http://www.w3.org/2000/svg';
  // Build a 24x24 stroke icon from one or more path `d` strings (Lucide geometry:
  // stroke-width 2, round caps/joins). Returns the <svg> and its <path>s so the
  // pin can toggle its head fill.
  const icon = (paths) => {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    const made = [];
    for (const d of paths) {
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', d);
      s.appendChild(p);
      made.push(p);
    }
    return { svg: s, paths: made };
  };

  const wire = () => {
    const bar = document.querySelector('.hg-titlebar');
    if (!bar || bar.dataset.tauriWired) return;
    bar.dataset.tauriWired = '1';

    // Drag the frameless window by the titlebar (left button, not on a control).
    bar.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, a, input, select, ae-button, [data-hg-affordance]')) return;
      call(appWindow.startDragging(), 'startDragging');
    });

    const barH = Math.round(bar.getBoundingClientRect().height) || 34;
    const style = document.createElement('style');
    style.setAttribute('data-hg-affordance', '');
    style.textContent = [
      '.hg-titlebar{-webkit-user-select:none;user-select:none;padding-right:108px !important;}',
      '#hg-winctl{position:fixed;top:0;right:0;display:flex;align-items:center;gap:2px;padding:0 6px;z-index:2147483647;pointer-events:none;}',
      // NB: do NOT reintroduce `all:unset` here. The previous build set
      // pointer-events:auto and THEN ran all:unset, which — because pointer-events
      // is an inherited property — reset it to inherit the container's
      // pointer-events:none, leaving every control unclickable (and dead to :hover,
      // so the title tooltips never showed). Each reset below is explicit so the
      // pointer-events:auto on the buttons is never clobbered.
      '#hg-winctl button{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;width:28px;height:22px;margin:0;padding:0;border:0;border-radius:var(--ae-radius-sm,4px);background:transparent;color:var(--ae-color-fg-subtle,#94a3b8);font:inherit;cursor:pointer;transition:background var(--ae-duration-fast,100ms) var(--ae-easing-ease-out,ease),color var(--ae-duration-fast,100ms) var(--ae-easing-ease-out,ease);}',
      '#hg-winctl button:hover{background:var(--ae-color-hover-overlay,rgba(148,163,184,.18));color:var(--ae-color-fg,#e2e8f0);}',
      '#hg-winctl button:focus-visible{outline:var(--ae-focus-ring-width,2px) solid var(--ae-color-focus-ring,#5b9dd9);outline-offset:-2px;}',
      '#hg-winctl button.hg-close:hover{background:var(--ae-color-danger,#e5484d);color:var(--ae-color-fg-on-danger,#fff);}',
      '#hg-winctl button.hg-pin[aria-pressed="true"]{color:var(--ae-color-accent,#5b9dd9);}',
      '#hg-winctl svg{width:14px;height:14px;display:block;}'
    ].join('');
    document.head.appendChild(style);

    const ctl = document.createElement('div');
    ctl.id = 'hg-winctl';
    ctl.setAttribute('data-hg-affordance', '');
    ctl.style.height = barH + 'px';

    const mk = (cls, label, title, ic) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      b.title = title;
      b.appendChild(ic.svg);
      return b;
    };

    // Pin (always-on-top). A thumbtack — the previous bare ● read as an
    // unexplained circle (the user couldn't tell what it did). Filled head +
    // accent colour = pinned; hollow outline = floats normally. The OS state is
    // read on wire so a re-inject after navigation can't desync the glyph.
    const pinIc = icon([
      'M12 17v5',
      'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'
    ]);
    const pinBody = pinIc.paths[1];
    let pinned = true;
    const pin = mk('hg-pin', 'Unpin from top', 'Pinned on top — click to unpin', pinIc);
    const reflect = () => {
      pin.setAttribute('aria-pressed', pinned ? 'true' : 'false');
      pinBody.setAttribute('fill', pinned ? 'currentColor' : 'none');
      pin.title = pinned ? 'Pinned on top — click to unpin' : 'Pin on top';
      pin.setAttribute('aria-label', pinned ? 'Unpin from top' : 'Pin on top');
    };
    if (appWindow.isAlwaysOnTop) {
      appWindow.isAlwaysOnTop()
        .then((v) => { pinned = !!v; reflect(); })
        .catch((e) => console.error('[histograph] window.isAlwaysOnTop failed', e));
    }
    pin.addEventListener('click', async () => {
      const next = !pinned;
      try { await appWindow.setAlwaysOnTop(next); pinned = next; }
      catch (e) { console.error('[histograph] window.setAlwaysOnTop failed', e); }
      reflect();
    });
    reflect();

    const min = mk('hg-min', 'Minimize', 'Minimize', icon(['M5 12h14']));
    min.addEventListener('click', () => call(appWindow.minimize(), 'minimize'));

    const close = mk('hg-close', 'Close', 'Close', icon(['M6 6l12 12', 'M18 6 6 18']));
    close.addEventListener('click', () => call(appWindow.close(), 'close'));

    ctl.append(pin, min, close);
    document.body.appendChild(ctl);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
"##;

/// Build the frameless, always-on-top window showing the bundled splash. It is
/// created here (not declared in tauri.conf.json) because both `on_navigation`
/// and `initialization_script` are builder-only:
///
/// - `on_navigation` is REQUIRED — Tauri locks webview navigation to the
///   `tauri://` origin by default and would silently CANCEL `navigate()` to the
///   remote loopback page without it (the #1 silent-failure trap here).
/// - `initialization_script` injects the window-chrome driver above.
pub fn build_main_window(app: &AppHandle) -> tauri::Result<()> {
    let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("Histograph")
        .decorations(false)
        .inner_size(420.0, 900.0)
        .min_inner_size(320.0, 480.0)
        .always_on_top(true)
        .visible(false)
        // Keep the board LIVE while it's pinned-but-unfocused/covered — its entire
        // job is to be glanceable while you work in another window. By default
        // WebView2 (Chromium) does two things that freeze a backgrounded window:
        // (1) its native occlusion detection flags a covered window as `hidden`, and
        //     the histograph's app.js deliberately `stopPolling()`s on
        //     `document.hidden` (correct for a browser TAB, wrong for a pinned app);
        // (2) it throttles/suspends timers in backgrounded/occluded renderers.
        // Disabling `CalculateNativeWinOcclusion` (so `document.hidden` stays false
        // when merely covered) + the backgrounding/throttling flags keeps the poll
        // running. We must repeat wry's default `--disable-features=…` because this
        // setter REPLACES it; CalculateNativeWinOcclusion is appended to that list
        // (Chromium honors only the last `--disable-features`). No-op off Windows.
        .additional_browser_args(
            "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection,CalculateNativeWinOcclusion \
             --disable-background-timer-throttling \
             --disable-backgrounding-occluded-windows \
             --disable-renderer-backgrounding",
        )
        .on_navigation(|url: &Url| {
            // Allow exactly our real origins: the bundled splash (tauri:// →
            // tauri.localhost on Windows) and the loopback sidecar (http 127.0.0.1).
            // Deny everything else — including https and `localhost`, which the
            // sidecar (bound to --host 127.0.0.1, plain http) never actually uses —
            // so a coerced external/cross-service navigation can't carry the window
            // away from the board or hand the chrome IPC to a foreign localhost app.
            match (url.scheme(), url.host_str().unwrap_or_default()) {
                ("tauri", _) => true,
                ("http", "tauri.localhost") => true,
                ("http", "127.0.0.1") => true,
                _ => false,
            }
        })
        .initialization_script(DRAG_PIN_CLOSE_JS)
        .build()?;

    // Restore remembered geometry (position+size only), THEN reveal — the window
    // is built visible:false so first paint lands at the remembered spot rather
    // than flashing at the default position. No-op on first ever launch.
    let _ = win.restore_state(StateFlags::POSITION | StateFlags::SIZE);
    win.show()?;
    Ok(())
}
