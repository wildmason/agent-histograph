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
import { initLedger } from "/ledger.js";

// Adaptive poll cadence: snappy while the focused lane is actively turning (so
// the live tool stream moves in near-real-time), calm otherwise. The backend's
// focus.workingNow says whether a tool fired in the last ~45s.
const POLL_IDLE_MS = 4000; // calm glance cadence — this is a status mosaic
const POLL_ACTIVE_MS = 1500; // the focused lane is working: refresh quickly
const STATE_URL = "/api/state";
const FOCUS_URL = "/api/focus";
const DISMISS_URL = "/api/dismiss";
const ANNOTATE_URL = "/api/annotate";

// ---- element handles -----------------------------------------------------
const els = {
  mosaic: document.getElementById("mosaic"),
  focus: document.getElementById("focus"),
  conn: document.getElementById("conn"),
  brandSelect: document.getElementById("brand-select"),
  schemeSelect: document.getElementById("scheme-select"),
  zoomSelect: document.getElementById("zoom-select"),
  ledgerSelect: document.getElementById("ledger-select"),
  ledgerCustom: document.getElementById("ledger-custom"),
  ledgerCustomInput: document.getElementById("ledger-custom-input"),
  ledgerCustomApply: document.getElementById("ledger-custom-apply"),
  ledgerCurrent: document.getElementById("ledger-current"),
  settingsBtn: document.getElementById("settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  settingsDone: document.getElementById("settings-done"),
};

// last good state, so a transient fetch failure doesn't blank the screen.
let lastState = null;
// the ETag of the last /api/state body we painted. Sent back as If-None-Match so the
// server can answer 304 (identical board) and we skip the parse + full re-render. The
// server excludes generatedAt from the validator, so a 304 only ever means "nothing
// meaningful changed" — freshness ticks flip the ETag and come back as a 200.
let lastEtag = null;
let pollTimer = null;
let polling = false;
let inFlight = false;
// focus-pane render memo — drives the auto-scroll policy in paint().
let lastFocusSig = null;
let lastFocusTerminal = null;
let stateRequestSeq = 0;
let latestPaintedStateSeq = 0;
let focusMutationSeq = 0;
let pendingFocus = null;
let annotationMutationSeq = 0;
const pendingAnnotations = new Map();

// ---- theme switcher + settings modal -------------------------------------
initThemeSwitcher({
  brandSelect: els.brandSelect,
  schemeSelect: els.schemeSelect,
});

// board zoom (100/125/150%) — rem-based, scales the root font-size. The injected
// px-sized window controls stay native; only the board content scales.
initZoom({ zoomSelect: els.zoomSelect });

// ledger picker — switch which ~/.agent* ledger the board reads, live. onApplied
// re-fetches /api/state against the newly-chosen dir (no relaunch).
const ledgerCtl = initLedger(
  {
    select: els.ledgerSelect,
    customRow: els.ledgerCustom,
    customInput: els.ledgerCustomInput,
    customApply: els.ledgerCustomApply,
    current: els.ledgerCurrent,
  },
  () => fetchState()
);

// Open settings and refresh the ledger candidate list (counts/current stay live).
// Shared by the titlebar gear AND the cold-state "Change ledger…" diagnostic action.
function openSettings() {
  if (els.settingsModal) els.settingsModal.open = true;
  ledgerCtl.refresh();
}

// the theme/ledger picker lives behind a settings modal (gear in the titlebar).
if (els.settingsBtn) {
  els.settingsBtn.addEventListener("click", openSettings);
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
  state = stateWithPendingFocus(state);
  state = stateWithPendingAnnotations(state);
  lastState = state;

  // The needs/running counts + clock now ride the fleet-switcher header (rendered
  // by renderTriage), per the Transcript + terminals design — the titlebar is just
  // the wordmark + settings + window controls. We still derive the board clock here
  // and hand it to renderTriage.
  const meta = titlebarMeta(state);

  renderTriage(els.mosaic, state.terminals, {
    onFocus: requestFocus,
    onDismiss: requestDismiss,
    onAnnotate: requestAnnotate,
    time: meta.time,
    // the ledger block drives the cold-state diagnostic; the action opens settings
    // (where the picker lets you switch to the right dir).
    ledger: state.ledger,
    onChangeLedger: openSettings,
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

function stateWithPendingFocus(state) {
  if (!pendingFocus || !state || !Array.isArray(state.terminals)) {
    return state;
  }
  const terminalId = pendingFocus.terminalId;
  let sawTarget = false;
  const terminals = state.terminals.map((t) => {
    const focused = t.id === terminalId;
    if (focused) sawTarget = true;
    return t.focused === focused ? t : { ...t, focused };
  });
  if (!sawTarget) return state;
  let focus = state.focus;
  if ((!focus || focus.terminalId !== terminalId) &&
      lastState && lastState.focus && lastState.focus.terminalId === terminalId) {
    focus = lastState.focus;
  }
  return { ...state, terminals, focus };
}

function stateWithPendingAnnotations(state) {
  if (!pendingAnnotations.size || !state || !Array.isArray(state.terminals)) {
    return state;
  }
  let changed = false;
  const terminals = state.terminals.map((t) => {
    const pending = pendingAnnotations.get(t.id);
    if (!pending) return t;
    if (t.annotation === pending.text) return t;
    changed = true;
    return { ...t, annotation: pending.text };
  });
  return changed ? { ...state, terminals } : state;
}

// ---- connection status (calm) --------------------------------------------

function showConnTrouble(show) {
  if (!els.conn) return;
  els.conn.setAttribute("data-visible", show ? "true" : "false");
}

// ---- fetch + poll --------------------------------------------------------

async function fetchState({ allowOverlap = false } = {}) {
  if (inFlight && !allowOverlap) return false;
  const seq = ++stateRequestSeq;
  if (!allowOverlap) inFlight = true;
  try {
    const headers = { accept: "application/json" };
    if (lastEtag) headers["if-none-match"] = lastEtag;
    const res = await fetch(STATE_URL, { headers });
    // 304 Not Modified: the board is byte-identical to what we last painted (only the
    // excluded generatedAt could have changed). Skip the JSON parse AND the full
    // re-render — this is the dominant idle-poll saving. (304 is NOT res.ok, so it
    // must be handled before the throw below.)
    if (res.status === 304) {
      showConnTrouble(false);
      return true;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const state = await res.json();
    // Mutation-triggered refreshes may intentionally overlap an older poll. If the
    // older poll returns later, do not let it repaint stale state over the newer
    // mutation response.
    if (seq < latestPaintedStateSeq) return true;
    latestPaintedStateSeq = seq;
    // adopt this body's validator only when we actually paint it, so lastEtag always
    // matches the on-screen board (a discarded stale overlap must not set it).
    lastEtag = res.headers.get("ETag") || lastEtag;
    showConnTrouble(false);
    paint(state);
    return true;
  } catch (err) {
    // calm degradation: keep the last good render, surface a quiet strip.
    // Never blank the screen or throw a modal.
    showConnTrouble(true);
    if (!lastState) {
      // first load failed — show a calm cold shell so the page isn't empty.
      paint({ generatedAt: null, terminals: [], focus: null });
    }
    return false;
  } finally {
    if (!allowOverlap) inFlight = false;
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
  const root = document.documentElement;
  if (!document.hidden) {
    if (root) root.classList.remove("hg-anim-paused"); // resume the live-edge pulse
    startPolling(); // visible (or back in view): ensure polling + immediate fetch
  } else if (!IS_DESKTOP) {
    // browser tab hidden: pause polling AND the GPU pulse animations (no point
    // compositing a ring nobody can see). The desktop companion skips this.
    if (root) root.classList.add("hg-anim-paused");
    stopPolling();
  }
  // desktop + hidden (covered/minimized): keep polling — it's a pinned companion
});

// ---- focus switch --------------------------------------------------------

async function requestFocus(terminalId) {
  if (!terminalId) return;
  const mutationSeq = ++focusMutationSeq;
  pendingFocus = { terminalId, seq: mutationSeq };
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
    await fetchState({ allowOverlap: true });
    if (pendingFocus && pendingFocus.seq === mutationSeq) {
      pendingFocus = null;
    }
  } catch {
    if (pendingFocus && pendingFocus.seq === mutationSeq) {
      pendingFocus = null;
    }
    await fetchState({ allowOverlap: true });
    // focus POST failed — the next poll will reconcile; surface the quiet strip.
    showConnTrouble(true);
  }
}

// ---- annotation ----------------------------------------------------------

async function requestAnnotate(terminalId, annotationText) {
  if (!terminalId) return;
  const annotation = String(annotationText == null ? "" : annotationText)
    .replace(/\s+/g, " ")
    .trim();
  const mutationSeq = ++annotationMutationSeq;
  pendingAnnotations.set(terminalId, { text: annotation, seq: mutationSeq });
  if (lastState && Array.isArray(lastState.terminals)) {
    paint({
      ...lastState,
      terminals: lastState.terminals.map((t) =>
        t.id === terminalId ? { ...t, annotation } : t
      ),
    });
  }
  try {
    const res = await fetch(ANNOTATE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ terminalId, annotation }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json().catch(() => null); // drain the body; the value rides /api/state
    // The POST has persisted, so /api/state now carries the authoritative annotation.
    // Drop the optimistic overlay BEFORE the refetch so a SINGLE refetch paints the
    // backend's value directly — the old code fetched twice (once with the overlay,
    // once after clearing it), doubling the work for no extra confirmation.
    if ((pendingAnnotations.get(terminalId) || {}).seq === mutationSeq) {
      pendingAnnotations.delete(terminalId);
    }
    await fetchState({ allowOverlap: true });
  } catch {
    if ((pendingAnnotations.get(terminalId) || {}).seq === mutationSeq) {
      pendingAnnotations.delete(terminalId);
    }
    await fetchState({ allowOverlap: true });
    // annotation POST failed — the authoritative refetch restores the note.
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
