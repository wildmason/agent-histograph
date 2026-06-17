// Headless DOM-stub test for the "next" provenance row in render.js's entryPending.
// The point of the feature: a first-party next (declared `▸ next:` or the TodoWrite plan)
// reads as the agent's OWN word (volunteered ◈), while the reconstructed next_action GUESS
// reads tentatively (◇); a declaration a later checkpoint overtook reads "may be done"; and
// a declared next's why renders as the detail line. Each renders through the REAL renderFocus
// and asserts the structural distinction. Run: node histograph/test_next_provenance.mjs
//
// (DOM stub mirrors test_transcript.mjs — render.js builds nodes via textContent, never innerHTML.)

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
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() {
    return this.children.length ? this.children.map((c) => c.textContent).join("") : this._text;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
  append(...nodes) { for (const n of nodes) { n.parentNode = this; this.children.push(n); } }
  get firstChild() { return this.children[0] || null; }
  get lastElementChild() {
    for (let i = this.children.length - 1; i >= 0; i--) if (this.children[i].nodeType === 1) return this.children[i];
    return null;
  }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get classes() { return this.className.split(/\s+/).filter(Boolean); }
  hasClass(c) { return this.classes.includes(c); }
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter((n) => n.nodeType === 1 && pred(n)); }
  querySelector(sel) {
    const match = sel[0] === "." ? (n) => n.hasClass && n.hasClass(sel.slice(1)) : (n) => n.tagName === sel.toUpperCase();
    return this.descendants().find(match) || null;
  }
}

globalThis.document = {
  createElement: (t) => new El(t),
  createTextNode: (t) => ({ nodeType: 3, _text: String(t), get textContent() { return this._text; } }),
};
globalThis.requestAnimationFrame = () => 0;

const { renderFocus } = await import("./render.js");

// A minimal focused trail: a decision + the pending node under test.
function render(pending) {
  const focus = {
    terminalId: "term-1", parkedEpicSeam: null, workingNow: false, epic: null,
    stories: [{ id: "st-a", title: "a story", state: "active" }],
    activeStory: {
      id: "st-a", title: "a story", indexLabel: "active · 1 of 1",
      nowLine: { text: "", working: false },
      tasks: [
        { id: "tk-1", kind: "decision", summary: "did a thing", detail: "because",
          integrity: "volunteered", at: "2026-06-10T10:00:00Z" },
        pending,
      ],
    },
  };
  const mount = new El("section");
  renderFocus(mount, focus, { fresh: true });
  return mount;
}
const nextOf = (m) => m.queryAll((n) => n.hasClass("hg-entry--next"))[0];
const klass = (node, c) => node.queryAll((n) => n.hasClass(c));
const text = (node, c) => (klass(node, c)[0] || {}).textContent || "";

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

// ---- declared (`▸ next:`) — first-party, with a why ----
{
  const n = nextOf(render({ id: "tk-pending", kind: "pending", summary: "wire the retry budget",
    detail: "the last gap before ship", integrity: "volunteered", at: null, source: "declared", stale: false }));
  ok("declared: entry marked first-party", n.hasClass("hg-entry--next-declared"));
  ok("declared: NOT marked as a guess", !n.hasClass("hg-entry--next-guess"));
  ok("declared: carries the volunteered (◈) integrity glyph", klass(n, "hg-integrity--volunteered").length === 1);
  ok("declared: source label reads 'declared'", text(n, "hg-entry__nextsource") === "declared");
  ok("declared: the why renders as the detail line", /the last gap before ship/.test(text(n, "hg-entry__detail")));
  ok("declared (not stale): no 'may be done' hint", klass(n, "hg-entry__nextstale").length === 0);
}

// ---- todo (TodoWrite plan) — first-party, no why ----
{
  const n = nextOf(render({ id: "tk-pending", kind: "pending", summary: "the next task",
    detail: "", integrity: "volunteered", at: null, source: "todo", stale: false }));
  ok("todo: entry marked first-party", n.hasClass("hg-entry--next-declared"));
  ok("todo: source label reads 'from plan'", text(n, "hg-entry__nextsource") === "from plan");
  ok("todo: carries the volunteered (◈) integrity glyph", klass(n, "hg-integrity--volunteered").length === 1);
}

// ---- reconstructed — the guess, read tentatively ----
{
  const n = nextOf(render({ id: "tk-pending", kind: "pending", summary: "a reconstructed guess",
    detail: "", integrity: "reconstructed", at: null, source: "reconstructed", stale: false }));
  ok("guess: entry marked as a guess", n.hasClass("hg-entry--next-guess"));
  ok("guess: NOT marked first-party", !n.hasClass("hg-entry--next-declared"));
  ok("guess: carries the reconstructed (◇) glyph, not volunteered",
     klass(n, "hg-integrity--reconstructed").length === 1 && klass(n, "hg-integrity--volunteered").length === 0);
  ok("guess: source label reads 'guess'", text(n, "hg-entry__nextsource") === "guess");
}

// ---- stale declaration — overtaken, reads "may be done" ----
{
  const n = nextOf(render({ id: "tk-pending", kind: "pending", summary: "declared but overtaken",
    detail: "", integrity: "volunteered", at: null, source: "declared", stale: true }));
  ok("stale: entry marked stale", n.hasClass("hg-entry--next-stale"));
  ok("stale: shows the 'may be done' hint",
     klass(n, "hg-entry__nextstale").length === 1 && /may be done/.test(text(n, "hg-entry__nextstale")));
}

// ---- backward-compat: an old payload (no source/stale) degrades to the guess look ----
{
  const n = nextOf(render({ id: "tk-pending", kind: "pending", summary: "legacy", detail: "",
    integrity: "passive", at: null }));
  ok("legacy: undefined source degrades to the guess look", n.hasClass("hg-entry--next-guess"));
  ok("legacy: no stale marker", !n.hasClass("hg-entry--next-stale"));
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
