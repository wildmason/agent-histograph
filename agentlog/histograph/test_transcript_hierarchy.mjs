// Headless DOM-stub test for the transcript-trail PARENT→CHILD hierarchy: genuine
// tool-call entries (an in-flight activity node, and the live NOW tip when it IS a
// tool) must render INDENTED as visual children of the task above them — they carry
// the `hg-entry--child` marker that drives the indent + connector rail in app.css.
// Task-level entries (intent / decision / step / milestone / pending, and a 'live'
// CHECKPOINT bloom rendered as the NOW card) must stay at the ROOT indent and NOT
// carry that marker. This guards the visual distinction between high-level work and
// the low-level tool actions beneath it.
//
// These tests exercise the REAL renderEntry/renderFocus over realistic wire tasks
// and assert the structural distinction (which entries get the child marker, which
// don't) — not a constant-equals-itself tautology: if the child marker were applied
// to the wrong kinds (or dropped from the right ones), these fail.
//
// Run: node histograph/test_transcript_hierarchy.mjs   (exit 0 = pass)

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
  get lastElementChild() {
    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i].nodeType === 1) return this.children[i];
    }
    return null;
  }
  removeChild(c) {
    this.children = this.children.filter((x) => x !== c);
    c.parentNode = null;
    return c;
  }
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
    const match =
      sel[0] === "."
        ? (n) => n.hasClass && n.hasClass(sel.slice(1))
        : (n) => n.tagName === sel.toUpperCase();
    return this.descendants().find(match) || null;
  }
}

globalThis.document = {
  createElement: (t) => new El(t),
  createTextNode: (t) => ({ nodeType: 3, _text: String(t), get textContent() { return this._text; } }),
};
globalThis.requestAnimationFrame = () => 0;

const { renderFocus } = await import("./render.js");

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

// Render a focus whose active story carries the given tasks, return the mount.
function renderTasks(tasks, opts = {}) {
  const mount = new El("section");
  const focus = {
    terminalId: "term-h",
    parkedEpicSeam: null,
    workingNow: true,
    epic: null, // standalone — keeps the orientation header minimal; trail is the focus
    stories: [],
    activeStory: { id: "st-h", title: "hierarchy fixture", nowLine: { text: "", working: true }, tasks },
  };
  renderFocus(mount, focus, { fresh: true, ...opts });
  return mount;
}

// pull the single entry carrying a kind-class, and report whether it is a child.
const entryIsChild = (mount, cls) => {
  const e = mount.queryAll((n) => n.hasClass(cls))[0];
  return e ? e.hasClass("hg-entry--child") : null; // null = not found (distinct from false)
};

// ====================================================================== //
// 1. The full mixed trail: tool nodes indent, task-level entries don't.    //
//    A non-live activity node and an activity-flavored live NOW tip are     //
//    children; intent/decision/step/milestone/pending are roots.            //
// ====================================================================== //
const mixed = renderTasks([
  { id: "intent-0", kind: "intent", summary: "Wire the half-close path",
    detail: "Ordering matters; close-then-drain.", integrity: "volunteered", at: "2026-06-10T14:00:00Z" },
  { id: "dec-0", kind: "decision", summary: "Single bidi stream",
    detail: "Halves setup.", integrity: "volunteered", at: "2026-06-10T14:01:00Z" },
  { id: "step-0", kind: "step", summary: "Regenerated stubs",
    detail: "", integrity: "passive", at: "2026-06-10T14:02:00Z" },
  { id: "ms-0", kind: "milestone", summary: "Half-close wired",
    detail: "", integrity: "volunteered", at: "2026-06-10T14:03:00Z" },
  // a genuine, earlier (non-live) tool action -> CHILD
  { id: "act-0", kind: "activity", tool: "Bash", summary: "cargo build", now: false,
    detail: "Compile the streaming client", integrity: "passive", at: "2026-06-10T14:04:00Z" },
  // the live edge IS a tool -> the activity-flavored NOW tip -> CHILD
  { id: "act-now", kind: "activity", tool: "Bash", summary: "cargo test", now: true,
    detail: "", integrity: "passive", at: "2026-06-10T14:05:00Z" },
  { id: "pend-0", kind: "pending", summary: "Backport to unary client",
    detail: "", integrity: "passive", at: null },
]);

console.log("# mixed trail — tool nodes are children, task entries are roots");
// sanity: every kind we asked for actually rendered (so the assertions below mean something)
ok("intent entry present", mixed.queryAll((n) => n.hasClass("hg-entry--intent")).length === 1);
ok("decision entry present", mixed.queryAll((n) => n.hasClass("hg-entry--decision")).length === 1);
ok("step entry present", mixed.queryAll((n) => n.hasClass("hg-entry--step")).length === 1);
ok("milestone entry present", mixed.queryAll((n) => n.hasClass("hg-entry--milestone")).length === 1);
ok("pending entry present", mixed.queryAll((n) => n.hasClass("hg-entry--next")).length === 1);
ok("activity entry present", mixed.queryAll((n) => n.hasClass("hg-entry--activity")).length === 1);
ok("a single NOW card present (the live tool tip)", mixed.queryAll((n) => n.hasClass("hg-entry--now")).length === 1);

// the load-bearing distinction:
ok("non-live activity node IS a child (indented)", entryIsChild(mixed, "hg-entry--activity") === true);
ok("activity-flavored NOW tip IS a child (indented)", entryIsChild(mixed, "hg-entry--now") === true);
ok("intent stays at root indent (NOT a child)", entryIsChild(mixed, "hg-entry--intent") === false);
ok("decision stays at root indent (NOT a child)", entryIsChild(mixed, "hg-entry--decision") === false);
ok("step stays at root indent (NOT a child)", entryIsChild(mixed, "hg-entry--step") === false);
ok("milestone stays at root indent (NOT a child)", entryIsChild(mixed, "hg-entry--milestone") === false);
ok("pending stays at root indent (NOT a child)", entryIsChild(mixed, "hg-entry--next") === false);

// exactly the two tool nodes are children — no task-level entry leaked the marker.
const childCount = mixed.queryAll((n) => n.hasClass("hg-entry--child")).length;
ok("exactly two child (tool) entries in the mixed trail", childCount === 2);

// ====================================================================== //
// 2. A 'live' CHECKPOINT bloom rendered as the NOW card is a TASK-level     //
//    entry — it must NOT indent (the activity-vs-live NOW distinction).     //
// ====================================================================== //
const liveCheckpoint = renderTasks([
  { id: "dec-1", kind: "decision", summary: "Adopt the new teardown order",
    detail: "Drain before cancel.", integrity: "volunteered", at: "2026-06-10T14:10:00Z" },
  // kind:"live" -> entryNow renders the checkpoint bloom (summary), NOT a tool tip.
  { id: "live-0", kind: "live", summary: "Checkpoint: streaming client passes integration",
    detail: "All bidi round-trips green; ready to backport.",
    integrity: "human-confirmed", at: "2026-06-10T14:11:00Z" },
]);

console.log("\n# 'live' checkpoint NOW card is a task-level entry (not a tool child)");
const liveNow = liveCheckpoint.queryAll((n) => n.hasClass("hg-entry--now"))[0];
ok("the live checkpoint renders as the NOW card", !!liveNow);
ok("live-checkpoint NOW card carries the checkpoint summary, not a tool tip",
   /Checkpoint: streaming client passes integration/.test(
     (liveNow.queryAll((n) => n.hasClass("hg-entry__title"))[0] || {}).textContent || ""));
ok("live-checkpoint NOW card is NOT a child (stays at root indent)",
   liveNow.hasClass("hg-entry--child") === false);
ok("no child entries at all in a checkpoint-only trail",
   liveCheckpoint.queryAll((n) => n.hasClass("hg-entry--child")).length === 0);

// ====================================================================== //
// 3. The child marker rides ON the entry root (so the rail/indent CSS,     //
//    keyed off .hg-entry--child, actually applies to the whole row) — not   //
//    on an inner body/gutter node.                                          //
// ====================================================================== //
console.log("\n# the child marker sits on the entry root, with the kind class");
const actEntry = mixed.queryAll((n) => n.hasClass("hg-entry--activity"))[0];
ok("activity child marker is co-located with hg-entry on the root node",
   actEntry.hasClass("hg-entry") && actEntry.hasClass("hg-entry--activity") && actEntry.hasClass("hg-entry--child"));
const nowEntry = mixed.queryAll((n) => n.hasClass("hg-entry--now"))[0];
ok("NOW-tip child marker is co-located with hg-entry on the root node",
   nowEntry.hasClass("hg-entry") && nowEntry.hasClass("hg-entry--now") && nowEntry.hasClass("hg-entry--child"));

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
