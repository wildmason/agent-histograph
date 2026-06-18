// Headless logic test for zoom.js. No browser — minimal document/localStorage/
// element stubs exercise the real resolveZoom / zoomFontSize / applyZoom / initZoom:
// clamping of corrupt input, the rem→px mapping, that 100% UNSETS the root size
// (so a user/OS base is respected), select population, ae-change apply+persist,
// and boot restore from storage.
//
// Run: node histograph/test_zoom.mjs   (exit 0 = pass)

// ---- stubs ---------------------------------------------------------------- //
class Style {
  constructor() {
    this.fontSize = undefined;
  }
  removeProperty(name) {
    if (name === "font-size") this.fontSize = "";
  }
}
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.attrs = {};
    this.children = [];
    this._handlers = {};
    this._text = "";
    this.style = new Style();
  }
  set innerHTML(v) {
    if (v === "") this.children = [];
  }
  set textContent(v) {
    this._text = String(v);
  }
  get textContent() {
    return this._text;
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
  }
  getAttribute(k) {
    return k in this.attrs ? this.attrs[k] : null;
  }
  addEventListener(t, fn) {
    (this._handlers[t] ||= []).push(fn);
  }
  append(...nodes) {
    for (const n of nodes) {
      n.parentNode = this;
      this.children.push(n);
    }
  }
  dispatch(type, detail) {
    const ev = { type, detail };
    for (const fn of this._handlers[type] || []) fn(ev);
  }
}

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.document = {
  createElement: (t) => new El(t),
  documentElement: new El("html"),
};

const Z = await import("./zoom.js");

// ---- assertions ----------------------------------------------------------- //
let failures = 0;
const ok = (name, cond) => {
  if (!cond) {
    failures++;
    console.log("  ✗ " + name);
  } else console.log("  ✓ " + name);
};

// resolveZoom — only the 4 supported factors survive; everything else → 100%.
ok("resolveZoom passes supported factors", Z.resolveZoom("1") === 1 && Z.resolveZoom("1.1") === 1.1 && Z.resolveZoom("1.25") === 1.25 && Z.resolveZoom("1.5") === 1.5);
ok("resolveZoom accepts numeric input", Z.resolveZoom(1.5) === 1.5 && Z.resolveZoom(1.1) === 1.1);
ok("resolveZoom clamps out-of-range to default", Z.resolveZoom("2") === 1 && Z.resolveZoom("0.9") === 1 && Z.resolveZoom("200%") === 1);
ok("resolveZoom clamps junk/empty to default", Z.resolveZoom("banana") === 1 && Z.resolveZoom(null) === 1 && Z.resolveZoom(undefined) === 1);

// zoomFontSize — rem base 16px × factor.
ok("zoomFontSize maps 100/110/125/150 → 16/17.6/20/24px", Z.zoomFontSize(1) === "16px" && Z.zoomFontSize(1.1) === "17.6px" && Z.zoomFontSize(1.25) === "20px" && Z.zoomFontSize(1.5) === "24px");
ok("zoomFontSize clamps invalid → 16px", Z.zoomFontSize("nope") === "16px");

// applyZoom — writes px for a real zoom, UNSETS at 100% (respect UA/user base).
const root = new El("html");
ok("applyZoom(1.1) sets root font-size 17.6px", Z.applyZoom(1.1, root) === 1.1 && root.style.fontSize === "17.6px");
ok("applyZoom(1.25) sets root font-size 20px", Z.applyZoom(1.25, root) === 1.25 && root.style.fontSize === "20px");
ok("applyZoom(1.5) sets root font-size 24px", Z.applyZoom(1.5, root) === 1.5 && root.style.fontSize === "24px");
ok("applyZoom(1) unsets root font-size", Z.applyZoom(1, root) === 1 && (root.style.fontSize === "" || root.style.fontSize == null));
ok("applyZoom(corrupt) falls back to default + unsets", Z.applyZoom("xxx", root) === 1 && root.style.fontSize === "");

// initZoom — populates the select with the 4 levels and selects the current.
const sel = new El("ae-select");
const ctl = Z.initZoom({ zoomSelect: sel });
ok("select populated with 4 ae-option levels", sel.children.length === 4 && sel.children.every((c) => c.tagName === "AE-OPTION"));
ok("options carry the right value+label", sel.children.map((c) => c.getAttribute("value")).join(",") === "1,1.1,1.25,1.5" && sel.children.map((c) => c.textContent).join(",") === "100%,110%,125%,150%");
ok("default current is 100%", ctl.current === 1 && sel.getAttribute("value") === "1");

// ae-change drives apply + persist.
sel.dispatch("ae-change", { value: "1.5" });
ok("ae-change to 150% applies to document root", document.documentElement.style.fontSize === "24px");
ok("ae-change persists the factor", localStorage.getItem(Z.ZOOM_STORAGE_KEY) === "1.5");
ok("control reflects the new current", ctl.current === 1.5 && sel.getAttribute("value") === "1.5");

// boot restore — a persisted factor is applied + reflected by a fresh init.
store.set(Z.ZOOM_STORAGE_KEY, "1.25");
document.documentElement = new El("html");
const sel2 = new El("ae-select");
const ctl2 = Z.initZoom({ zoomSelect: sel2 });
ok("init restores persisted zoom (font-size + selection)", ctl2.current === 1.25 && document.documentElement.style.fontSize === "20px" && sel2.getAttribute("value") === "1.25");

// corrupt storage never breaks boot.
store.set(Z.ZOOM_STORAGE_KEY, "banana");
document.documentElement = new El("html");
const ctl3 = Z.initZoom({ zoomSelect: new El("ae-select") });
ok("corrupt stored zoom → default 100%, root unset", ctl3.current === 1 && (document.documentElement.style.fontSize === "" || document.documentElement.style.fontSize === undefined));

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
