// ==========================================================================
// Histograph — theme.js
// Live theme switching wired to the vendored Aegis v2 registry. A brand axis
// and a scheme axis, each an ae-select dropdown. Defaults to Crucible · Molten
// (crucible / dark) to match the mockup. Persists the selection to
// localStorage and restores it on load.
//
// Two axes (per the Aegis themes model):
//   brand   -> data-theme   (default | cinnabar | editorial | metro | crucible | spectrum)
//   scheme  -> data-variant
//     · scheme brands: light | dark | high-contrast (per brand's offered set)
//     · spectrum (a COLLECTION brand): one of its 12 palette variants
//       (stone-moss | warm-light | …) — the variant IS the scheme, so the
//       scheme control repopulates with the palette list for spectrum.
// applyTheme({ theme, variant }) stamps data-theme + data-collection +
// data-variant on <html>; the layered theme CSS (linked in <head>) does the
// rest with no FOUC.
// ==========================================================================

import {
  applyTheme,
  THEME_REGISTRY,
  getThemeBrand,
  brandsByFamily,
  resolveSystemScheme,
  DEFAULT_THEME_SELECTION,
} from "/static/aegis/aegis.js";

const STORAGE_KEY = "histograph.theme";

// UI default per the build plan / mockup.
const FALLBACK = { theme: "crucible", variant: "dark" };

// The brands the switcher offers, in this order (plan-specified).
const BRAND_ORDER = ["default", "cinnabar", "editorial", "metro", "crucible", "spectrum"];

// The scheme segments the control offers.
const SCHEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "high-contrast", label: "Contrast" },
];

// ---- selection helpers ---------------------------------------------------

function brandById(id) {
  return getThemeBrand(id);
}

// Does a brand ship a given scheme variant? Crucible has no high-contrast;
// spectrum's variants are palette names, not light/dark/high-contrast.
function brandSupportsScheme(brandId, scheme) {
  const b = brandById(brandId);
  if (!b) return false;
  return (b.variants || []).some((v) => v.id === scheme);
}

// For a brand whose variants aren't the three schemes (spectrum), fall back to
// the brand's declared defaultVariant.
function isSchemeBrand(brandId) {
  return SCHEMES.some((s) => brandSupportsScheme(brandId, s.value));
}

// The segment set the scheme control should show for a brand. Scheme brands
// (default/cinnabar/editorial/metro/crucible) get the fixed light/dark/contrast
// triple, with the cells the brand lacks disabled. A COLLECTION brand
// (spectrum) has no light/dark/contrast axis — its variants ARE its schemes —
// so the control repopulates with the brand's own palette variants, labelled
// from variant.label ("Stone & Moss", "Warm Light", …). Without this, spectrum
// shows three disabled cells and all 12 palettes are unreachable. (C2)
function segmentsForBrand(brandId) {
  if (isSchemeBrand(brandId)) {
    return SCHEMES.map((s) => ({
      value: s.value,
      label: s.label,
      disabled: !brandSupportsScheme(brandId, s.value),
    }));
  }
  const b = brandById(brandId);
  return (b?.variants || []).map((v) => ({
    value: v.id,
    label: v.label || v.id,
    disabled: false,
  }));
}

// (Re)populate the scheme select's options for a brand, then select the active
// variant. Rebuilds the option SET (not just disabled flags) so a scheme-brand
// ⇄ collection-brand switch swaps the whole option list (3 schemes vs
// spectrum's 12 palettes).
function rebuildScheme(schemeSelect, brandId, variant) {
  if (!schemeSelect) return;
  schemeSelect.innerHTML = "";
  for (const seg of segmentsForBrand(brandId)) {
    const item = document.createElement("ae-option");
    item.setAttribute("value", seg.value);
    item.textContent = seg.label;
    if (seg.disabled) item.setAttribute("disabled", "");
    schemeSelect.append(item);
  }
  if (variant != null) schemeSelect.setAttribute("value", variant);
}

// Resolve a {theme, variant} that the registry actually supports, repairing
// stored/selected combos that don't exist (e.g. crucible + high-contrast).
function resolveSelection(sel) {
  const wanted = { ...FALLBACK, ...(sel || {}) };
  const brand = brandById(wanted.theme) ? wanted.theme : FALLBACK.theme;
  const b = brandById(brand);

  // brand follows OS (the default brand) and no explicit scheme stored?
  let variant = wanted.variant;

  if (!isSchemeBrand(brand)) {
    // a palette-brand (spectrum): its variant IS its scheme; clamp to a known
    // variant or the brand default.
    const ok = (b.variants || []).some((v) => v.id === variant);
    if (!ok) variant = b.defaultVariant;
  } else if (!brandSupportsScheme(brand, variant)) {
    // requested scheme not offered by this brand — nudge to the closest:
    // prefer the brand default, else dark, else its first variant.
    if (brandSupportsScheme(brand, b.defaultVariant)) variant = b.defaultVariant;
    else if (brandSupportsScheme(brand, "dark")) variant = "dark";
    else variant = (b.variants[0] || {}).id || "dark";
  }
  return { theme: brand, variant };
}

// ---- persistence ---------------------------------------------------------

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.theme === "string") return parsed;
  } catch {
    /* corrupt / unavailable storage — fall through to default */
  }
  return null;
}

function persist(sel) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
  } catch {
    /* storage unavailable (private mode) — selection still applies for the session */
  }
}

// ---- control wiring ------------------------------------------------------

/**
 * Initialise the theme switcher.
 * @param {object} opts
 * @param {HTMLElement} opts.brandSelect   the brand <ae-select> element
 * @param {HTMLElement} opts.schemeSelect  the scheme <ae-select> element
 */
export function initThemeSwitcher({ brandSelect, schemeSelect }) {
  // current selection: stored → resolved, else fallback.
  let current = resolveSelection(load() || FALLBACK);

  // Populate the brand select from the registry. ae-select's listbox rides the
  // browser top layer (Popover API), so it opens above the settings modal.
  if (brandSelect) {
    brandSelect.innerHTML = "";
    for (const id of BRAND_ORDER) {
      const b = brandById(id);
      if (!b) continue;
      const item = document.createElement("ae-option");
      item.setAttribute("value", id);
      item.textContent = b.label || id;
      brandSelect.append(item);
    }
    brandSelect.setAttribute("value", current.theme);
  }

  // Populate the scheme select for the starting brand.
  let renderedBrand = current.theme;
  rebuildScheme(schemeSelect, current.theme, current.variant);

  // Reflect a selection into both controls + the document, and persist.
  function commit(next, { silent } = {}) {
    current = resolveSelection(next);
    applyTheme(current);
    persist(current);

    if (brandSelect && brandSelect.getAttribute("value") !== current.theme) {
      brandSelect.setAttribute("value", current.theme);
    }
    if (schemeSelect) {
      if (current.theme !== renderedBrand) {
        // brand changed → the option SET differs (scheme triple vs spectrum's
        // 12 palettes), so rebuild the options, don't just toggle disabled.
        rebuildScheme(schemeSelect, current.theme, current.variant);
        renderedBrand = current.theme;
      } else if (schemeSelect.getAttribute("value") !== current.variant) {
        schemeSelect.setAttribute("value", current.variant);
      }
    }
    return current;
  }

  // brand change → keep the scheme if the new brand supports it, else repair.
  if (brandSelect) {
    brandSelect.addEventListener("ae-change", (e) => {
      const theme = (e.detail && e.detail.value) || brandSelect.getAttribute("value");
      commit({ theme, variant: current.variant });
    });
  }

  // scheme change → swap variant on the current brand.
  if (schemeSelect) {
    schemeSelect.addEventListener("ae-change", (e) => {
      const variant = (e.detail && e.detail.value) || schemeSelect.getAttribute("value");
      commit({ theme: current.theme, variant });
    });
  }

  // Apply the restored/default selection immediately (idempotent with the
  // inline boot stamp in index.html, which prevents FOUC before modules load).
  commit(current, { silent: true });

  return {
    get current() {
      return { ...current };
    },
    set(sel) {
      return commit(sel);
    },
  };
}

// Export the resolver + constants for the inline boot script + tests.
export { resolveSelection, FALLBACK, BRAND_ORDER, SCHEMES };
