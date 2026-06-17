// Headless DOM-stub test for the cold-state DIAGNOSTIC in render.js's renderTriage().
// The bug this guards: the board read an empty/wrong ledger dir and rendered a silent
// "No live terminals" with no hint why. The cold state must now (a) name the dir and
// offer a "Change ledger…" action when the ledger is empty/missing, yet (b) stay calm
// when the ledger genuinely just has no live lanes right now.
//
// Run: node histograph/test_empty_state.mjs   (exit 0 = pass)

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
  append(...nodes) { for (const n of nodes) { n.parentNode = this; this.children.push(n); } }
  get firstChild() { return this.children[0] || null; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get classes() { return this.className.split(/\s+/).filter(Boolean); }
  hasClass(c) { return this.classes.includes(c); }
  click() {
    const ev = { type: "click", stopPropagation() {}, preventDefault() {} };
    for (const fn of this._handlers.click || []) fn(ev);
  }
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter((n) => n.nodeType === 1 && pred(n)); }
  slotAttr(name) { return this.queryAll((n) => n.getAttribute("slot") === name); }
}
class TextNode {
  constructor(t) { this.nodeType = 3; this._text = String(t); this.parentNode = null; }
  get textContent() { return this._text; }
}
globalThis.document = { createElement: (t) => new El(t), createTextNode: (t) => new TextNode(t) };

const { renderTriage } = await import("./render.js");

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

const DIR = "C:\\Users\\Matt\\.agent-histograph";

// ---- 1. empty ledger that EXISTS -> actionable diagnostic naming the dir ---- //
{
  let changed = 0;
  const mount = new El("div");
  renderTriage(mount, [], {
    ledger: { dir: DIR, exists: true, sessions: 0, hasData: false, source: "default" },
    onChangeLedger: () => changed++,
  });
  const dirCode = mount.queryAll((n) => n.hasClass("hg-empty__dir"))[0];
  ok("empty-exists: names the ledger dir in a <code>", !!dirCode && dirCode.textContent.includes(DIR));
  const title = mount.queryAll((n) => n.getAttribute("slot") === "title")[0];
  ok("empty-exists: title says the ledger is empty", !!title && /empty/i.test(title.textContent));
  const btn = mount.queryAll((n) => n.tagName === "AE-BUTTON")[0];
  ok("empty-exists: a Change ledger… action button is rendered", !!btn && /change ledger/i.test(btn.textContent));
  ok("empty-exists: the button lives in the actions slot",
     !!btn && btn.parentNode && btn.parentNode.getAttribute("slot") === "actions");
  if (btn) btn.click();
  ok("empty-exists: clicking the button invokes onChangeLedger", changed === 1);
}

// ---- 2. ledger dir MISSING -> "not found" framing -------------------------- //
{
  const mount = new El("div");
  renderTriage(mount, [], {
    ledger: { dir: DIR, exists: false, sessions: 0, hasData: false, source: "default" },
    onChangeLedger: () => {},
  });
  const title = mount.queryAll((n) => n.getAttribute("slot") === "title")[0];
  ok("missing: title says the folder was not found", !!title && /not found/i.test(title.textContent));
  const dirCode = mount.queryAll((n) => n.hasClass("hg-empty__dir"))[0];
  ok("missing: still names the configured dir", !!dirCode && dirCode.textContent.includes(DIR));
}

// ---- 3. ledger HAS data, just nothing live -> calm, NO action -------------- //
{
  let changed = 0;
  const mount = new El("div");
  renderTriage(mount, [], {
    ledger: { dir: DIR, exists: true, sessions: 12, hasData: true, source: "override" },
    onChangeLedger: () => changed++,
  });
  const title = mount.queryAll((n) => n.getAttribute("slot") === "title")[0];
  ok("has-data: calm 'No live terminals' title", !!title && /no live terminals/i.test(title.textContent));
  const btn = mount.queryAll((n) => n.tagName === "AE-BUTTON")[0];
  ok("has-data: no Change ledger… button (not a misconfig)", !btn);
  ok("has-data: no dir diagnostic code", mount.queryAll((n) => n.hasClass("hg-empty__dir")).length === 0);
}

// ---- 4. no ledger block at all (old payload / cold shell) -> calm ---------- //
{
  const mount = new El("div");
  renderTriage(mount, [], {});
  const title = mount.queryAll((n) => n.getAttribute("slot") === "title")[0];
  ok("no-ledger: degrades to the calm placeholder", !!title && /no live terminals/i.test(title.textContent));
  ok("no-ledger: no action button", mount.queryAll((n) => n.tagName === "AE-BUTTON").length === 0);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
