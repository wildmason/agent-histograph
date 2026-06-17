// ==========================================================================
// Histograph — ledger.js
// The settings "Ledger" control: pick which ~/.agent* ledger the board reads,
// LIVE (no relaunch). The server (serve_ledger) detects candidate dirs and
// persists the choice; this module just renders the picker, POSTs the choice,
// and asks the controller to re-fetch state. Mirrors theme.js / zoom.js: a self-
// contained init that owns its own elements + listeners.
//
// Why this exists: the board's ledger dir was a launch-time-only binding, so
// double-clicking the exe (no AGENTLOG_DIR) read the empty default and rendered
// nothing. This makes the dir a first-class, in-app, runtime choice.
// ==========================================================================

const LEDGER_URL = "/api/ledger";
const LEDGER_DIR_URL = "/api/ledger-dir";

const CUSTOM = "__custom__"; // sentinel option: reveal the free-text path field
const RESET = "__reset__"; // sentinel option: clear the override (back to default)

// Collapse a home-prefixed absolute path to ~ for compact display. The full path
// still shows verbatim in the cold-state diagnostic; this is display-only sugar.
function prettyDir(d) {
  if (!d) return "(unknown)";
  return d
    .replace(/^[A-Za-z]:\\Users\\[^\\]+\\/, "~\\")
    .replace(/^\/(?:home|Users)\/[^/]+\//, "~/");
}

function candidateLabel(c) {
  const n = c.sessions || 0;
  const sess = c.exists ? `${n} session${n === 1 ? "" : "s"}` : "missing";
  const tail = c.isCurrent ? " · current" : c.isDefault ? " · default" : "";
  return `${prettyDir(c.dir)} · ${sess}${tail}`;
}

/**
 * Wire the ledger picker. Returns { refresh() } so the controller can re-pull the
 * candidate list whenever the settings modal opens (counts/current stay fresh).
 *   els.select        ae-select of detected ledger dirs (+ custom / reset sentinels)
 *   els.customRow      wrapper revealed when "Custom path…" is chosen
 *   els.customInput    ae-input for a free-text path
 *   els.customApply    ae-button that commits the custom path
 *   els.current        a hint line showing the active dir + source (or an error)
 *   onApplied()        called after a successful switch so the board re-fetches state
 */
export function initLedger(els, onApplied) {
  if (!els || !els.select) return { refresh() {} };
  const apply = typeof onApplied === "function" ? onApplied : () => {};
  let lastInfo = null;

  function showCustom(show) {
    if (els.customRow) els.customRow.hidden = !show;
  }

  function setHint(text, isError) {
    if (!els.current) return;
    els.current.textContent = text || "";
    els.current.setAttribute("data-error", isError ? "true" : "false");
  }

  function describeSource(src) {
    if (src === "override") return "set here";
    if (src === "env") return "from AGENTLOG_DIR";
    return "default";
  }

  // (re)render the dropdown from a fresh /api/ledger payload.
  function render(info) {
    lastInfo = info;
    const sel = els.select;
    while (sel.firstChild) sel.removeChild(sel.firstChild);
    const cands = Array.isArray(info.candidates) ? info.candidates : [];
    for (const c of cands) {
      const opt = document.createElement("ae-option");
      opt.setAttribute("value", c.dir);
      opt.textContent = candidateLabel(c);
      sel.append(opt);
    }
    const custom = document.createElement("ae-option");
    custom.setAttribute("value", CUSTOM);
    custom.textContent = "Custom path…";
    sel.append(custom);
    if (info.source === "override") {
      const reset = document.createElement("ae-option");
      reset.setAttribute("value", RESET);
      reset.textContent = "Reset to default";
      sel.append(reset);
    }
    // preselect the active dir so the trigger shows where the board points now.
    sel.value = info.current || "";
    setHint(`Reading ${prettyDir(info.current)} (${describeSource(info.source)})`, false);
    showCustom(false);
  }

  async function refresh() {
    try {
      const res = await fetch(LEDGER_URL, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      render(await res.json());
    } catch {
      setHint("Couldn't load ledger options — is the server reachable?", true);
    }
  }

  // POST a {dir} or {reset} choice; on success refresh the picker + re-fetch state.
  async function commit(payload) {
    try {
      const res = await fetch(LEDGER_DIR_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHint(body.error || `Couldn't switch (HTTP ${res.status})`, true);
        return false;
      }
      await refresh();
      apply(); // board re-fetches /api/state against the new dir
      return true;
    } catch {
      setHint("Couldn't reach the server to switch ledgers.", true);
      return false;
    }
  }

  els.select.addEventListener("ae-change", (e) => {
    const v = (e.detail && e.detail.value) || els.select.value || "";
    if (v === CUSTOM) {
      showCustom(true);
      if (els.customInput && lastInfo) els.customInput.value = lastInfo.current || "";
      return;
    }
    if (v === RESET) {
      commit({ reset: true });
      return;
    }
    if (v) commit({ dir: v });
  });

  function commitCustom() {
    const v = els.customInput ? (els.customInput.value || "").trim() : "";
    if (!v) {
      setHint("Enter a folder path.", true);
      return;
    }
    commit({ dir: v });
  }
  if (els.customApply) els.customApply.addEventListener("click", commitCustom);
  if (els.customInput) {
    // Enter commits the typed path (ae-input fires ae-change on Enter/blur).
    els.customInput.addEventListener("ae-change", commitCustom);
  }

  return { refresh };
}
