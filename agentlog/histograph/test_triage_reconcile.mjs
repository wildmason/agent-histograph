// Headless test for V8 — renderTriage's keyed reconcile. The fleet list used to
// clear() + rebuild every poll (≈150 nodes + 32 listeners recreated, fleet scroll +
// hover reset). The reconcile must instead REUSE the DOM node for an unchanged lane
// across renders and rebuild ONLY the rows whose content changed — adding/removing/
// reordering lanes without touching the rest, and updating the header in place.
//
// This is a behavioral contract (node identity is reused), so it fails against the
// old clear+rebuild and passes only with a real reconcile. Stub adds insertBefore
// (the reconcile path needs it; the single-call existing tests never hit it).
//
// Run: node histograph/test_triage_reconcile.mjs   (exit 0 = pass)

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
    this.style = {};
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() {
    return this.children.length ? this.children.map((c) => c.textContent).join("") : this._text;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "class") this.className = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
  append(...nodes) {
    for (const n of nodes) {
      if (n.parentNode) n.parentNode.removeChild(n);
      n.parentNode = this;
      this.children.push(n);
    }
  }
  insertBefore(newNode, refNode) {
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    newNode.parentNode = this;
    if (refNode == null) { this.children.push(newNode); return newNode; }
    const i = this.children.indexOf(refNode);
    if (i === -1) this.children.push(newNode);
    else this.children.splice(i, 0, newNode);
    return newNode;
  }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get firstChild() { return this.children[0] || null; }
  get classes() { return this.className.split(/\s+/).filter(Boolean); }
  hasClass(c) { return this.classes.includes(c); }
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter((n) => n.nodeType === 1 && pred(n)); }
}
class TextNode { constructor(t) { this.nodeType = 3; this._text = String(t); this.parentNode = null; } get textContent() { return this._text; } }

globalThis.document = {
  body: new El("body"),
  createElement: (t) => new El(t),
  createElementNS: (_n, t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  addEventListener() {},
  removeEventListener() {},
};

const { renderTriage } = await import("./render.js");

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

const rowsOf = (mount) => mount.queryAll((n) => n.hasClass("hg-trow-wrap"));
const rowById = (mount, id) =>
  rowsOf(mount).find((w) => (w.children[0] && w.children[0].getAttribute("data-terminal")) === id);

const mk = (over) => ({
  id: "term-1", project: "Mortar", provider: "claude", status: "active",
  story: { title: "wire parser" }, freshnessLabel: "2m", freshnessTone: "muted",
  focused: true, statusLine: { kind: "status", text: "working" }, annotation: "", ...over,
});

const mount = new El("div");
const opts = { onFocus() {}, onDismiss() {}, onAnnotate() {}, time: "10:00" };

// ---- 1. unchanged data across two renders REUSES the row nodes -------------
const A = mk({ id: "term-1", project: "Mortar" });
const B = mk({ id: "term-2", project: "Bridge", focused: false, status: "needs-you",
              statusLine: { kind: "needs-you", text: "approve?" } });
renderTriage(mount, [A, B], opts);
const a1 = rowById(mount, "term-1");
const b1 = rowById(mount, "term-2");
ok("first render builds both lanes", !!a1 && !!b1 && rowsOf(mount).length === 2);

renderTriage(mount, [mk({ id: "term-1", project: "Mortar" }),
                     mk({ id: "term-2", project: "Bridge", focused: false, status: "needs-you",
                          statusLine: { kind: "needs-you", text: "approve?" } })], opts);
ok("unchanged lanes reuse the SAME DOM nodes (no rebuild)",
   rowById(mount, "term-1") === a1 && rowById(mount, "term-2") === b1);
ok("still exactly two lanes", rowsOf(mount).length === 2);

// ---- 2. changing ONE lane rebuilds only that row ---------------------------
renderTriage(mount, [mk({ id: "term-1", project: "Mortar", freshnessLabel: "9m" }),  // changed
                     mk({ id: "term-2", project: "Bridge", focused: false, status: "needs-you",
                          statusLine: { kind: "needs-you", text: "approve?" } })], opts);  // same
const a2 = rowById(mount, "term-1");
const b2 = rowById(mount, "term-2");
ok("the changed lane's node is rebuilt", a2 !== a1);
ok("the unchanged lane's node is reused", b2 === b1);
ok("the rebuilt row reflects the new freshness",
   a2.queryAll((n) => n.hasClass("hg-trow__age")).some((n) => n.textContent === "9m"));

// ---- 3. adding a lane inserts it, keeps the rest ---------------------------
renderTriage(mount, [mk({ id: "term-1", project: "Mortar", freshnessLabel: "9m" }),
                     mk({ id: "term-2", project: "Bridge", focused: false, status: "needs-you",
                          statusLine: { kind: "needs-you", text: "approve?" } }),
                     mk({ id: "term-3", project: "Aegis", focused: false })], opts);
ok("a new lane is appended (3 lanes now)", rowsOf(mount).length === 3);
ok("existing lanes still reused after an add",
   rowById(mount, "term-1") === a2 && rowById(mount, "term-2") === b1);
const order3 = rowsOf(mount).map((w) => w.children[0].getAttribute("data-terminal"));
ok("order matches the backend list order", order3.join(",") === "term-1,term-2,term-3");

// ---- 4. removing a lane drops it, keeps the rest ---------------------------
renderTriage(mount, [mk({ id: "term-1", project: "Mortar", freshnessLabel: "9m" }),
                     mk({ id: "term-3", project: "Aegis", focused: false })], opts);
ok("removed lane is gone, others remain (2 lanes)",
   rowsOf(mount).length === 2 && !rowById(mount, "term-2"));
ok("survivors reused across the removal", rowById(mount, "term-1") === a2);

// ---- 5. header updates in place; body rows untouched -----------------------
const survivor = rowById(mount, "term-1");
renderTriage(mount, [mk({ id: "term-1", project: "Mortar", freshnessLabel: "9m" }),
                     mk({ id: "term-3", project: "Aegis", focused: false })],
             { ...opts, time: "10:42" });
const heads = mount.queryAll((n) => n.hasClass("hg-terms__head"));
ok("exactly one header after a time-only change", heads.length === 1);
ok("header reflects the new time", heads[0].textContent.includes("10:42"));
ok("a time-only change does NOT rebuild body rows", rowById(mount, "term-1") === survivor);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
