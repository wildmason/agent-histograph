// ==========================================================================
// Histograph — app.js
// The thin controller: fetch /api/state, render via render.js, poll on an
// interval, wire the theme switcher, POST /api/focus when a triage lane is
// clicked, and POST /api/dismiss when its × is. No derivation lives here — the
// backend computes everything; this file only moves JSON onto the DOM and back.
// ==========================================================================

import { renderTriage, renderFocus, titlebarMeta } from "/render.js";
import { initThemeSwitcher } from "/theme.js";
import { initZoom } from "/zoom.js";

// Adaptive poll cadence: snappy while the focused lane is actively turning (so
// the live tool stream moves in near-real-time), calm otherwise. The backend's
// focus.workingNow says whether a tool fired in the last ~45s.
const POLL_IDLE_MS = 4000; // calm glance cadence — this is a status mosaic
const POLL_ACTIVE_MS = 1500; // the focused lane is working: refresh quickly
const STATE_URL = "/api/state";
const FOCUS_URL = "/api/focus";
const DISMISS_URL = "/api/dismiss";

// ---- element handles -----------------------------------------------------
const els = {
  mosaic: document.getElementById("mosaic"),
  focus: document.getElementById("focus"),
  conn: document.getElementById("conn"),
  brandSelect: document.getElementById("brand-select"),
  schemeSelect: document.getElementById("scheme-select"),
  zoomSelect: document.getElementById("zoom-select"),
  settingsBtn: document.getElementById("settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  settingsDone: document.getElementById("settings-done"),
};

// last good state, so a transient fetch failure doesn't blank the screen.
let lastState = null;
let pollTimer = null;
let polling = false;
let inFlight = false;
// focus-pane render memo — drives the auto-scroll policy in paint().
let lastFocusSig = null;
let lastFocusTerminal = null;

// ---- theme switcher + settings modal -------------------------------------
initThemeSwitcher({
  brandSelect: els.brandSelect,
  schemeSelect: els.schemeSelect,
});

// board zoom (100/125/150%) — rem-based, scales the root font-size. The injected
// px-sized window controls stay native; only the board content scales.
initZoom({ zoomSelect: els.zoomSelect });

// the theme picker lives behind a settings modal (gear in the titlebar).
if (els.settingsBtn && els.settingsModal) {
  els.settingsBtn.addEventListener("click", () => {
    els.settingsModal.open = true;
  });
}
if (els.settingsDone && els.settingsModal) {
  els.settingsDone.addEventListener("click", () => {
    els.settingsModal.open = false;
  });
}

// ---- render --------------------------------------------------------------

// A cheap content signature of the focus pane: changes only when the focused
// lane's meaningful content does (most-recent task, task count, active story,
// story states, epic progress). Lets paint() tell an IDLE re-render (freshness
// ticks, an unrelated lane moving) apart from real new activity, so we rebuild +
// follow the trail only when something in it actually changed.
function focusSig(focus) {
  if (!focus) return "null";
  const a = focus.activeStory;
  const tasks = (a && a.tasks) || [];
  const last = tasks[tasks.length - 1];
  return [
    focus.terminalId,
    focus.epic ? focus.epic.done + "/" + focus.epic.total : "-",
    (focus.stories || []).map((s) => s.id + ":" + s.state).join(","),
    a && a.id,
    tasks.length,
    // the live edge — hash its CONTENT, not just its id. The in-flight activity
    // window slides positional ids (act-0..act-N), so a new tool action can keep
    // the same last id + count; including kind/at/summary/tool/now makes a fresh
    // tool action register so the trail grows + auto-scrolls in real time.
    last && [last.kind, last.at, last.summary, last.tool, last.now].join("·"),
  ].join("|");
}

function paint(state) {
  lastState = state;

  // The needs/running counts + clock now ride the fleet-switcher header (rendered
  // by renderTriage), per the Transcript + terminals design — the titlebar is just
  // the wordmark + settings + window controls. We still derive the board clock here
  // and hand it to renderTriage.
  const meta = titlebarMeta(state);

  renderTriage(els.mosaic, state.terminals, {
    onFocus: requestFocus,
    onDismiss: requestDismiss,
    time: meta.time,
  });

  // Focus pane: only (re)build it when the focused lane SWITCHES (fresh) or its
  // content actually CHANGES. Idle polls leave the existing DOM — and the
  // reader's scroll position — completely untouched. Rebuilding every 4s churned
  // the trail and, worse, the rebuilt content laid out a frame after the scroll
  // was restored, so the trail jumped a few nodes up off the live tip on every
  // poll. Skipping the no-op rebuild removes that churn entirely.
  //   • fresh (terminal switch) → rebuild, land at the newest tip to orient
  //   • changed + parked at bottom → rebuild, follow to the newest tip
  //   • changed + scrolled up → rebuild, keep the reader's position
  //   • unchanged (idle) → do nothing
  const sig = focusSig(state.focus);
  const fresh = (state.focus ? state.focus.terminalId : null) !== lastFocusTerminal;
  const changed = sig !== lastFocusSig;
  if (fresh || changed) {
    renderFocus(els.focus, state.focus, { changed, fresh });
  }
  lastFocusSig = sig;
  lastFocusTerminal = state.focus ? state.focus.terminalId : null;
}

// ---- connection status (calm) --------------------------------------------

function showConnTrouble(show) {
  if (!els.conn) return;
  els.conn.setAttribute("data-visible", show ? "true" : "false");
}

// ---- fetch + poll --------------------------------------------------------

async function fetchState() {
  if (inFlight) return;
  inFlight = true;
  try {
    const res = await fetch(STATE_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    showConnTrouble(false);
    paint(state);
  } catch (err) {
    // calm degradation: keep the last good render, surface a quiet strip.
    // Never blank the screen or throw a modal.
    showConnTrouble(true);
    if (!lastState) {
      // first load failed — show a calm cold shell so the page isn't empty.
      paint({ generatedAt: null, terminals: [], focus: null });
    }
  } finally {
    inFlight = false;
  }
}

// the interval until the next poll, chosen from the last state's workingNow.
function nextDelay() {
  return lastState && lastState.focus && lastState.focus.workingNow
    ? POLL_ACTIVE_MS
    : POLL_IDLE_MS;
}

// self-scheduling loop (not setInterval) so the cadence can adapt each tick and
// a slow fetch never overlaps the next one.
function startPolling() {
  if (polling) return;
  polling = true;
  const loop = async () => {
    if (!polling) return;
    await fetchState();
    if (!polling) return;
    pollTimer = setTimeout(loop, nextDelay());
  };
  loop(); // fetch immediately, then schedule
}

function stopPolling() {
  polling = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

// Pause polling only in a BROWSER tab when hidden (second-monitor companion) to
// save work. In the Tauri desktop app the board is a pinned companion meant to
// stay live while you work in ANOTHER window, so it must NOT stop when merely
// covered/unfocused — and a webview can flag a backgrounded window
// `document.hidden` (WebView2 occlusion on Windows; WKWebView/App-Nap on macOS).
// The window-level `additional_browser_args` neutralizes that on Windows but
// no-ops on macOS, so this guard is what keeps the board live cross-platform.
// Desktop host is detected via the injected global (withGlobalTauri).
const IS_DESKTOP = typeof window !== "undefined" && !!window.__TAURI__;
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    startPolling(); // visible (or back in view): ensure polling + immediate fetch
  } else if (!IS_DESKTOP) {
    stopPolling(); // browser tab hidden: pause to save work
  }
  // desktop + hidden (covered/minimized): keep polling — it's a pinned companion
});

// ---- focus switch --------------------------------------------------------

async function requestFocus(terminalId) {
  if (!terminalId) return;
  // optimistic: flip focus locally for instant feedback, then confirm.
  if (lastState && Array.isArray(lastState.terminals)) {
    const optimistic = {
      ...lastState,
      terminals: lastState.terminals.map((t) => ({ ...t, focused: t.id === terminalId })),
    };
    paint(optimistic);
  }
  try {
    const res = await fetch(FOCUS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ terminalId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // re-fetch authoritative state (the focus pane + epic band change).
    await fetchState();
  } catch {
    // focus POST failed — the next poll will reconcile; surface the quiet strip.
    showConnTrouble(true);
  }
}

// ---- close-out -----------------------------------------------------------

async function requestDismiss(terminalId) {
  if (!terminalId) return;
  // optimistic: drop the lane locally for instant feedback, then confirm. The
  // backend hides it until it does new work; the re-fetch re-picks focus if the
  // dismissed lane was the focused one.
  if (lastState && Array.isArray(lastState.terminals)) {
    paint({ ...lastState, terminals: lastState.terminals.filter((t) => t.id !== terminalId) });
  }
  try {
    const res = await fetch(DISMISS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ terminalId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchState();
  } catch {
    // dismiss POST failed — the next poll restores the lane; surface the strip.
    showConnTrouble(true);
  }
}

// ---- boot ----------------------------------------------------------------
startPolling(); // the loop fetches immediately, then self-schedules adaptively
