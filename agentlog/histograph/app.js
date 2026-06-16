// ==========================================================================
// Histograph — app.js
// The thin controller: fetch /api/state, render via render.js, poll on an
// interval, wire the theme switcher, and POST /api/focus when a triage card is
// clicked. No derivation lives here — the backend computes everything; this
// file only moves JSON onto the DOM and back.
// ==========================================================================

import { renderTriage, renderFocus, titlebarMeta } from "/render.js";
import { initThemeSwitcher } from "/theme.js";

// Adaptive poll cadence: snappy while the focused lane is actively turning (so
// the live tool stream moves in near-real-time), calm otherwise. The backend's
// focus.workingNow says whether a tool fired in the last ~45s.
const POLL_IDLE_MS = 4000; // calm glance cadence — this is a status mosaic
const POLL_ACTIVE_MS = 1500; // the focused lane is working: refresh quickly
const STATE_URL = "/api/state";
const FOCUS_URL = "/api/focus";

// ---- element handles -----------------------------------------------------
const els = {
  mosaic: document.getElementById("mosaic"),
  focus: document.getElementById("focus"),
  needs: document.getElementById("tb-needs"),
  count: document.getElementById("tb-count"),
  time: document.getElementById("tb-time"),
  conn: document.getElementById("conn"),
  brandSelect: document.getElementById("brand-select"),
  schemeSelect: document.getElementById("scheme-select"),
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

  // titlebar meta
  const meta = titlebarMeta(state);
  if (els.needs) {
    if (meta.needs > 0) {
      els.needs.textContent = `${meta.needs} needs you`;
      els.needs.style.display = "";
      // re-emphasize: a board that went clear → needs-you must drop the muted
      // de-emphasis class, or the indicator stays quiet exactly when it most
      // needs to surface. (LOW-1)
      els.needs.classList.remove("hg-titlebar__time");
    } else {
      els.needs.textContent = "all clear";
      els.needs.classList.add("hg-titlebar__time"); // de-emphasize when calm
    }
  }
  if (els.count) els.count.textContent = `${meta.count} terminal${meta.count === 1 ? "" : "s"}`;
  if (els.time) els.time.textContent = meta.time;

  renderTriage(els.mosaic, state.terminals, { onFocus: requestFocus });

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

// pause polling when the tab is hidden (second-monitor companion); resume +
// refresh immediately when it returns.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPolling();
  } else {
    startPolling(); // the loop fetches immediately
  }
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

// ---- boot ----------------------------------------------------------------
startPolling(); // the loop fetches immediately, then self-schedules adaptively
