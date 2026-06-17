// Headless DOM-stub test for the fleet-switcher close-out affordance. No browser
// here, so a minimal document stub exercises render.js's real renderTriage(): it
// asserts the × is a non-nested SIBLING of the role="button" lane (no nested
// interactives), and that clicks route to onDismiss / onFocus.
//
// Run: node histograph/test_triage_dismiss.mjs   (exit 0 = pass)

let NODE_ID = 0;
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this._id = ++NODE_ID;
    this.className = "";
    this.attrs = {};
    this.children = [];
    this.parentNode = null;
    this._handlers = {};
    this._text = "";
  }
  set textContent(v) { this._text = String(v); }
  get textContent() {
    return this.children.length
      ? this.children.map((c) => c.textContent).join("")
      : this._text;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
  append(...nodes) {
    for (const n of nodes) { n.parentNode = this; this.children.push(n); }
  }
  get firstChild() { return this.children[0] || null; }
  removeChild(c) {
    this.children = this.children.filter((x) => x !== c);
    c.parentNode = null;
    return c;
  }
  get classes() { return this.className.split(/\s+/).filter(Boolean); }
  hasClass(c) { return this.classes.includes(c); }
  click() {
    const ev = { type: "click", stopPropagation() {}, preventDefault() {} };
    for (const fn of this._handlers.click || []) fn(ev);
  }
  // depth-first ELEMENT descendants (excludes self + text nodes). Recurses through
  // all children but collects only elements, so raw .every()/.find() predicates can
  // safely call hasClass/getAttribute (a TextNode — e.g. the "▚ VIEWING" pill label
  // — has neither, and no `.children` to iterate).
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter((n) => n.nodeType === 1 && pred(n)); }
}

class TextNode {
  constructor(t) { this.nodeType = 3; this._text = String(t); this.parentNode = null; }
  get textContent() { return this._text; }
}

globalThis.document = {
  createElement: (t) => new El(t),
  createTextNode: (t) => new TextNode(t),
};

const { renderTriage } = await import("./render.js");

// ---- fixture -------------------------------------------------------------- //
let focused = [];
let dismissed = [];
const terminals = [
  // focused + active -> ▚ VIEWING pill; an active lane is "running".
  { id: "term-1", project: "Mortar", provider: "claude", status: "active",
    story: { title: "wire the parser" }, freshnessLabel: "2m", freshnessTone: "muted",
    focused: true },
  // needs-you (not focused) -> NEEDS YOU pill; floats to the top.
  { id: "term-2", project: "Bridge", provider: "codex", status: "needs-you",
    story: { title: "review the diff" }, freshnessLabel: "5m", freshnessTone: "warning",
    focused: false, statusLine: { kind: "needs-you", text: "needs you" } },
];

const mount = new El("div");
renderTriage(mount, terminals, {
  onFocus: (id) => focused.push(id),
  onDismiss: (id) => dismissed.push(id),
});

// ---- assertions ----------------------------------------------------------- //
let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

const closes = mount.queryAll((n) => n.tagName === "BUTTON" && n.hasClass("hg-trow__close"));
const rows = mount.queryAll((n) => n.hasClass("hg-trow"));
const wraps = mount.queryAll((n) => n.hasClass("hg-trow-wrap"));
const heads = mount.queryAll((n) => n.hasClass("hg-terms__head"));

ok("one close button per lane (2)", closes.length === 2);
ok("two lane rows", rows.length === 2);
ok("two row wraps", wraps.length === 2);
ok("fleet header rendered once", heads.length === 1);
// the needs-you lane (term-2) floats to the top, ahead of the active lane.
const orderedTerms = rows.map((r) => r.getAttribute("data-terminal"));
ok("needs-you lane sorts first", orderedTerms[0] === "term-2");
// the focused lane carries a ▚ VIEWING pill; the needs-you lane a NEEDS YOU pill.
const pills = mount.queryAll((n) => n.hasClass("hg-trow__pill"));
ok("a VIEWING pill is rendered for the focused lane",
   pills.some((p) => /VIEWING/.test(p.textContent)));
ok("a NEEDS YOU pill is rendered for the blocked lane",
   pills.some((p) => /NEEDS YOU/.test(p.textContent)));

// the lane NAME is the human project, never the meaningless internal term-N id.
const names = mount.queryAll((n) => n.hasClass("hg-trow__name"));
ok("lane name shows the project, not term-N",
   names.some((n) => n.textContent === "Mortar") && names.some((n) => n.textContent === "Bridge"));
ok("no lane name leaks the term-N id", names.every((n) => !/^term-/.test(n.textContent)));

// the × is a SIBLING of the row inside the wrap, NOT a descendant of it.
ok("close shares the wrap parent with its row", closes.every((c) => c.parentNode && c.parentNode.hasClass("hg-trow-wrap")));
ok("close is never a descendant of the role=button row",
   rows.every((r) => r.descendants().every((d) => !(d.tagName === "BUTTON" && d.hasClass("hg-trow__close")))));

// no nested interactives inside the role=button row.
ok("row carries role=button", rows.every((r) => r.getAttribute("role") === "button"));
ok("no nested interactive inside any row",
   rows.every((r) => r.descendants().every((d) => d.tagName !== "BUTTON" && d.getAttribute("role") !== "button")));

// close has an accessible label + type=button.
ok("close has aria-label + type=button",
   closes.every((c) => /Close out/.test(c.getAttribute("aria-label") || "") && c.getAttribute("type") === "button"));

// clicking the × dismisses that lane and does NOT focus it. The close is labelled
// by the human project name now (no term-N), so find the Mortar lane's × (term-1).
const closeForTerm1 = closes.find((c) => /Mortar/.test(c.getAttribute("aria-label")));
closeForTerm1.click();
ok("clicking × calls onDismiss(term-1)", dismissed.length === 1 && dismissed[0] === "term-1");
ok("clicking × does not trigger focus", focused.length === 0);

// clicking the row focuses it.
const row1 = rows.find((r) => r.getAttribute("data-terminal") === "term-1");
row1.click();
ok("clicking the row calls onFocus(term-1)", focused.length === 1 && focused[0] === "term-1");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
