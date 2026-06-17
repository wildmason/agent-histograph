// ==========================================================================
// Histograph — zoom.js
// Board zoom: 100% / 125% / 150%. The whole UI is painted from rem-based
// Aegis v2 tokens (--ae-space-*, --ae-font-size-* are all in rem), so scaling
// the ROOT <html> font-size scales every spacing/type value uniformly — a true
// content zoom with no per-element work.
//
// The injected window controls (pin / minimize / close / drag) are sized in PX
// (see window.rs), so they deliberately do NOT scale — the window chrome stays
// a constant, comfortable hit-target at every zoom level, like OS window
// buttons, while the board content grows/shrinks.
//
// Persisted to localStorage and re-applied on boot (the FOUC guard in
// index.html stamps the font-size before first paint so the board never flashes
// at 100% then jumps).
// ==========================================================================

const STORAGE_KEY = "histograph.zoom";

// The supported levels, in menu order. value is the raw scale factor (a string,
// since that's what ae-select round-trips); label is what the user sees.
export const ZOOM_LEVELS = [
  { value: "1", label: "100%" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
];

const DEFAULT_ZOOM = 1;
// The user-agent default <html> font-size the rem scale is authored against.
// 100% == 16px so 1rem stays 16px; 125% == 20px; 150% == 24px.
const BASE_PX = 16;

const ALLOWED = ZOOM_LEVELS.map((z) => parseFloat(z.value));

// Coerce any stored/selected value to a SUPPORTED factor. Corrupt, out-of-range,
// or unknown input (NaN, "200%", 0.9, null) falls back to 100% — the control can
// never drive the board to an unsupported scale.
export function resolveZoom(raw) {
  const n = typeof raw === "number" ? raw : parseFloat(raw);
  return ALLOWED.includes(n) ? n : DEFAULT_ZOOM;
}

// The CSS font-size a factor maps to. Always a clamped, valid value.
export function zoomFontSize(factor) {
  return BASE_PX * resolveZoom(factor) + "px";
}

// Stamp the resolved zoom onto the document root. Exported so the boot guard and
// tests can apply it directly.
export function applyZoom(factor, root) {
  const el = root || (typeof document !== "undefined" && document.documentElement);
  if (!el) return DEFAULT_ZOOM;
  const f = resolveZoom(factor);
  // 100% leaves the root font-size unset (inherit the UA default) so a user/OS
  // base size is respected; only a real zoom writes an explicit px value.
  if (f === 1) el.style.removeProperty("font-size");
  else el.style.fontSize = zoomFontSize(f);
  return f;
}

// ---- persistence (mirrors theme.js) --------------------------------------

function load() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persist(factor) {
  try {
    localStorage.setItem(STORAGE_KEY, String(factor));
  } catch {
    /* storage unavailable (private mode) — applies for the session anyway */
  }
}

// ---- control wiring ------------------------------------------------------

/**
 * Initialise the zoom control.
 * @param {object} opts
 * @param {HTMLElement} [opts.zoomSelect] the zoom <ae-select> element
 * @returns {{ current: number, set: (f:any)=>number }}
 */
export function initZoom({ zoomSelect } = {}) {
  let current = resolveZoom(load());
  applyZoom(current); // idempotent with the inline boot stamp in index.html

  if (zoomSelect) {
    zoomSelect.innerHTML = "";
    for (const z of ZOOM_LEVELS) {
      const opt = document.createElement("ae-option");
      opt.setAttribute("value", z.value);
      opt.textContent = z.label;
      zoomSelect.append(opt);
    }
    zoomSelect.setAttribute("value", String(current));
    zoomSelect.addEventListener("ae-change", (e) => {
      const v = (e.detail && e.detail.value) || zoomSelect.getAttribute("value");
      current = applyZoom(v);
      persist(current);
      if (zoomSelect.getAttribute("value") !== String(current)) {
        zoomSelect.setAttribute("value", String(current));
      }
    });
  }

  return {
    get current() {
      return current;
    },
    set(factor) {
      current = applyZoom(factor);
      persist(current);
      return current;
    },
  };
}

export { STORAGE_KEY as ZOOM_STORAGE_KEY, DEFAULT_ZOOM, BASE_PX };
