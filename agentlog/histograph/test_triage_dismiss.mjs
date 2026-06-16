// Headless DOM-stub test for the triage close-out affordance. No browser here, so
// a minimal document stub exercises render.js's real renderTriage(): it asserts the
// × is a non-nested SIBLING of the role="button" row (no nested interactives), the
// header carries an alignment spacer, and clicks route to onDismiss / onFocus.
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
  // depth-first descendants (excludes self)
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children) { out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter(pred); }
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
  { id: "term-1", project: "Mortar", provider: "claude", status: "active",
    story: { title: "wire the parser" }, freshnessLabel: "2m", freshnessTone: "muted",
    focused: false },
  { id: "term-2", project: "Bridge", provider: "codex", status: "needs-you",
    story: { title: "review the diff" }, freshnessLabel: "5m", freshnessTone: "warning",
    focused: true, statusLine: { kind: "needs-you", text: "needs you" } },
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
const spacers = mount.queryAll((n) => n.hasClass("hg-trow__close-spacer"));

ok("one close button per lane (2)", closes.length === 2);
ok("two lane rows", rows.length === 2);
ok("two row wraps", wraps.length === 2);
ok("header has exactly one alignment spacer", spacers.length === 1);

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

// clicking the × dismisses that lane and does NOT focus it.
const closeForTerm1 = closes.find((c) => /term-1/.test(c.getAttribute("aria-label")));
closeForTerm1.click();
ok("clicking × calls onDismiss(term-1)", dismissed.length === 1 && dismissed[0] === "term-1");
ok("clicking × does not trigger focus", focused.length === 0);

// clicking the row focuses it.
const row1 = rows.find((r) => r.getAttribute("data-terminal") === "term-1");
row1.click();
ok("clicking the row calls onFocus(term-1)", focused.length === 1 && focused[0] === "term-1");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
