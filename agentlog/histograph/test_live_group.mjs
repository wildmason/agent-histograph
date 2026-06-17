// Headless DOM-stub test for the OPEN-turn "in progress" live group in render.js's renderFocus.
// The feature: while a turn is open its tool calls have no parent task node (they bind to a
// task only at COMPLETION), so the in-flight tools render as an explicit OWNED group — a
// pulsing "in progress" header the tools nest under — instead of floating at the trail tail
// as siblings of the completed decisions. Gated on focus.workingNow; a bloomed-`live`
// checkpoint (not a tool run) must NOT form a group. Run: node histograph/test_live_group.mjs

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

function render(tasks, working) {
  const focus = {
    terminalId: "term-lg",
    parkedEpicSeam: null,
    workingNow: working,
    epic: null,
    stories: [],
    activeStory: { id: "st-lg", title: "live-group fixture", nowLine: { text: "", working }, tasks },
  };
  const mount = new El("section");
  renderFocus(mount, focus, { fresh: true });
  return mount;
}
const all = (m, c) => m.queryAll((n) => n.hasClass(c));

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

// ---- 1. working + an in-flight tool run -> an owned "in progress" group ----
console.log("# working turn with in-flight tools -> an owned 'in progress' group");
{
  const m = render([
    { id: "dec-0", kind: "decision", summary: "Single bidi stream", detail: "Halves setup.",
      integrity: "volunteered", at: "2026-06-10T14:00:00Z" },
    { id: "act-0", kind: "activity", tool: "Read", summary: "client.rs", now: false,
      detail: "", integrity: "passive", at: "2026-06-10T14:01:00Z" },
    { id: "act-now", kind: "activity", tool: "Bash", summary: "cargo test", now: true,
      detail: "", integrity: "passive", at: "2026-06-10T14:02:00Z" },
    { id: "pend-0", kind: "pending", summary: "Backport to unary client", detail: "",
      integrity: "reconstructed", at: null, source: "reconstructed", stale: false },
  ], true);

  const group = all(m, "hg-livegroup")[0];
  ok("a live group is rendered", !!group);
  const head = group && all(group, "hg-livegroup__head")[0];
  ok("the group header reads 'in progress'", /in progress/i.test((head || {}).textContent || ""));
  ok("the header carries a (pulsing) live dot", !!(group && all(group, "hg-livegroup__dot").length === 1));

  const body = group && all(group, "hg-livegroup__body")[0];
  ok("the earlier in-flight tool node is INSIDE the group body",
     !!body && all(body, "hg-entry--activity").length === 1);
  ok("the live NOW tip is INSIDE the group body",
     !!body && all(body, "hg-entry--now").length === 1);
  ok("a completed decision is NOT inside the group", !!group && all(group, "hg-entry--decision").length === 0);
  ok("the pending 'next' is NOT inside the group", !!group && all(group, "hg-entry--next").length === 0);

  // the non-grouped entries still render exactly once, outside the group.
  ok("the decision still renders (outside the group)", all(m, "hg-entry--decision").length === 1);
  ok("the pending still renders (outside the group)", all(m, "hg-entry--next").length === 1);
  ok("exactly one NOW card overall", all(m, "hg-entry--now").length === 1);
}

// ---- 2. idle lane (not working) -> NO group; tools render loose (history) ----
console.log("\n# idle lane -> no group (a leftover tool run is just history)");
{
  const m = render([
    { id: "dec-1", kind: "decision", summary: "Adopt teardown order", detail: "Drain first.",
      integrity: "volunteered", at: "2026-06-10T14:10:00Z" },
    { id: "act-1", kind: "activity", tool: "Read", summary: "teardown.rs", now: false,
      detail: "", integrity: "passive", at: "2026-06-10T14:11:00Z" },
  ], false);
  ok("no live group when the lane is idle", all(m, "hg-livegroup").length === 0);
  ok("the idle tool node still renders (loose)", all(m, "hg-entry--activity").length === 1);
}

// ---- 3. working + a bloomed-`live` checkpoint (no tool run) -> NO group ----
console.log("\n# working but the live edge is a bloomed checkpoint (kind 'live') -> no group");
{
  const m = render([
    { id: "dec-2", kind: "decision", summary: "Wire half-close", detail: "Close then drain.",
      integrity: "volunteered", at: "2026-06-10T14:20:00Z" },
    { id: "live-0", kind: "live", summary: "Checkpoint: integration green", detail: "Ready to backport.",
      integrity: "human-confirmed", at: "2026-06-10T14:21:00Z" },
  ], true);
  ok("no live group for a bloomed-live checkpoint (it is not a tool run)", all(m, "hg-livegroup").length === 0);
  ok("the bloomed-live NOW card still renders", all(m, "hg-entry--now").length === 1);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
