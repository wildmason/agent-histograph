// Headless DOM-stub test for the "Transcript + terminals" focus pane. A minimal
// document stub exercises render.js's real renderFocus(): it asserts the pinned
// orientation header (epic + story + now line + roadmap bar) and the chronological
// transcript of typed entries — decision (with its rationale as a second line),
// reversal stitch ("overturns HH:MM · reversible"), the highlighted NOW card built
// from the live tool tip, and the ghosted next — all render from the wire contract.
//
// Run: node histograph/test_transcript.mjs   (exit 0 = pass)

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
  // ELEMENT descendants only — recurse through all children, collect elements.
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  queryAll(pred) { return this.descendants().filter((n) => n.nodeType === 1 && pred(n)); }
  // minimal querySelector: ".class" or "tag" -> first matching descendant or null.
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
// renderFocus drives an async scroll-settle loop; in the stub the ae-scroll-area
// has no shadow viewport, so the loop no-ops. Stub rAF so it doesn't ReferenceError.
globalThis.requestAnimationFrame = () => 0;

const { renderFocus } = await import("./render.js");

// ---- fixture: a working lane mid-turn, with a rich decision trail ---------- //
const focus = {
  terminalId: "term-1",
  parkedEpicSeam: null,
  workingNow: true,
  epic: { title: "Protocol parity with competitors", done: 2, total: 4 },
  stories: [
    { id: "st-a", title: "workstream switch", state: "done" },
    { id: "st-b", title: "long poll", state: "done" },
    { id: "st-c", title: "gRPC bidi streaming", state: "active" },
    { id: "st-d", title: "server-sent events", state: "not-started" },
  ],
  activeStory: {
    id: "st-c",
    title: "gRPC client / bidi streaming",
    indexLabel: "active · 3 of 4",
    nowLine: { text: "Bash · cargo test", working: true },
    tasks: [
      { id: "intent-0", kind: "intent", summary: "Model the client as a single bidi stream",
        detail: "Preserves server-side message ordering and halves connection setup — paired unary calls would reorder under load.",
        integrity: "volunteered", at: "2026-06-10T14:05:00Z" },
      { id: "tk-1", kind: "decision", summary: "Model the client as a single bidi stream",
        detail: "Preserves server-side ordering and halves connection setup.",
        integrity: "volunteered", at: "2026-06-10T14:09:00Z" },
      { id: "tk-2", kind: "step", summary: "Regenerated protobuf stubs",
        detail: "", integrity: "passive", at: "2026-06-10T14:21:00Z" },
      { id: "tk-3", kind: "supersedes", summary: "CloseSend() first, then drain",
        detail: "The cancel-first path raced the drain loop and dropped frames.",
        integrity: "human-confirmed", at: "2026-06-10T14:41:00Z",
        reversal: { supersededSummary: "teardown gated on context cancellation",
                    supersededAt: "2026-06-10T14:33:00Z", reversibility: "high" } },
      { id: "tk-4", kind: "milestone", summary: "Half-close wired end-to-end",
        detail: "First clean shutdown that round-trips without an RST.",
        integrity: "volunteered", at: "2026-06-10T14:52:00Z",
        toolCalls: [{ tool: "Bash", target: "cargo build", desc: "Compile the streaming client",
                      at: "2026-06-10T14:50:00Z" }],
        toolCount: 1 },
      { id: "act-x", kind: "activity", tool: "Bash", summary: "cargo build", now: false,
        detail: "Compile the streaming client", integrity: "passive", at: "2026-06-10T14:53:00Z" },
      { id: "act-0", kind: "activity", tool: "Bash", summary: "cargo test", now: true,
        detail: "", integrity: "passive", at: "2026-06-10T14:54:00Z" },
      { id: "tk-pending", kind: "pending", summary: "Backport to the unary fallback client",
        detail: "", integrity: "passive", at: null },
    ],
  },
};

const mount = new El("section");
renderFocus(mount, focus, { fresh: true });

// ---- assertions ----------------------------------------------------------- //
let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };
const one = (cls) => mount.queryAll((n) => n.hasClass(cls));
const first = (cls) => one(cls)[0] || null;

// ---- orientation header ----
ok("pinned orientation header present", !!first("hg-orient"));
ok("working-toward eyebrow rendered", (first("hg-orient__label") || {}).textContent === "working toward");
ok("epic title surfaces", /Protocol parity/.test((first("hg-orient__epic-title") || {}).textContent || ""));
ok("progress count shows done (2)", (first("hg-orient__epic-done") || {}).textContent === "2");
ok("hero story title is the active story",
   (first("hg-orient__story") || {}).textContent === "gRPC client / bidi streaming");
const nowText = (first("hg-orient__now-text") || {}).textContent || "";
ok("now line reads the live edge", /now — Bash · cargo test/.test(nowText));
ok("now line marked working (pulsing dot)", !!mount.queryAll((n) => n.hasClass("hg-orient__now--working")).length);
const segs = one("hg-roadmap__seg");
ok("roadmap bar has one segment per story (4)", segs.length === 4);
ok("done/active/not-started segments are typed",
   segs[0].hasClass("hg-roadmap__seg--done") &&
   segs[2].hasClass("hg-roadmap__seg--active") &&
   segs[3].hasClass("hg-roadmap__seg--not-started"));
ok("a segment carries its story title as a tooltip",
   /gRPC bidi streaming/.test(segs[2].getAttribute("title") || ""));

// ---- transcript entries ----
ok("one intent entry", one("hg-entry--intent").length === 1);
ok("one decision entry", one("hg-entry--decision").length === 1);
ok("one step entry", one("hg-entry--step").length === 1);
ok("one milestone entry", one("hg-entry--milestone").length === 1);
ok("one reversal entry", one("hg-entry--reversal").length === 1);
ok("one NOW card", one("hg-entry--now").length === 1);
ok("one next (pending) entry", one("hg-entry--next").length === 1);

// the declared-intent entry: the agent's first-party "what & why", surviving alongside
// the reconstructed decision of the same name (a distinct, durable entry).
const intent = first("hg-entry--intent");
ok("intent title is the declared task",
   /Model the client as a single bidi stream/.test((intent.queryAll((n) => n.hasClass("hg-entry__title"))[0] || {}).textContent || ""));
ok("intent detail line is the verbatim why",
   /paired unary calls would reorder under load/.test((intent.queryAll((n) => n.hasClass("hg-entry__detail"))[0] || {}).textContent || ""));
ok("intent carries the volunteered integrity glyph",
   intent.queryAll((n) => n.hasClass("hg-entry__intg")).length === 1);
ok("intent persists alongside the same-named reconstructed decision",
   one("hg-entry--intent").length === 1 && one("hg-entry--decision").length === 1);

// a non-live activity node now renders the tool's first-party `desc` second line.
const activity = first("hg-entry--activity");
ok("activity desc line renders the tool's description",
   /Compile the streaming client/.test((activity.queryAll((n) => n.hasClass("hg-entry__activity-desc"))[0] || {}).textContent || ""));

// the tool-call gutter rides the timestamp + the type glyph on ONE line (the inline
// gutter variant) — both are direct children of a single .hg-entry__gutter--inline,
// not stacked across two rows.
const actGutter = activity.queryAll((n) => n.hasClass("hg-entry__gutter--inline"))[0] || null;
ok("activity gutter is the single-line inline variant", !!actGutter);
ok("activity gutter holds the timestamp and type glyph side-by-side",
   !!actGutter &&
   actGutter.children.some((c) => c.hasClass && c.hasClass("hg-entry__time")) &&
   actGutter.children.some((c) => c.hasClass && c.hasClass("hg-entry__glyph--activity")));

// the completed-turn accordion also surfaces the tool's first-party desc per call.
ok("accordion row renders the tool's first-party desc",
   /Compile the streaming client/.test((first("hg-tools__desc") || {}).textContent || ""));

// the decision's rationale renders as the second line (detail), distinct from title.
const decision = first("hg-entry--decision");
ok("decision title is the choice",
   /Model the client as a single bidi stream/.test((decision.queryAll((n) => n.hasClass("hg-entry__title"))[0] || {}).textContent || ""));
ok("decision detail line is the rationale",
   /Preserves server-side ordering/.test((decision.queryAll((n) => n.hasClass("hg-entry__detail"))[0] || {}).textContent || ""));

// a step with empty detail renders NO detail line.
ok("step with no rationale renders no detail line",
   first("hg-entry--step").queryAll((n) => n.hasClass("hg-entry__detail")).length === 0);

// the reversal tag carries "overturns HH:MM · reversible: high".
const revMeta = (first("hg-entry__revtag-meta") || {}).textContent || "";
// clock() renders LOCAL time, so assert the HH:MM shape, not a zone-pinned value.
ok("reversal tag names the overturned time", /overturns \d\d:\d\d/.test(revMeta));
ok("reversal tag names reversibility", /reversible: high/.test(revMeta));

// the NOW card built from the live activity reads "tool · target".
const nowCard = first("hg-entry--now");
const nowTitle = (nowCard.queryAll((n) => n.hasClass("hg-entry__title"))[0] || {}).textContent || "";
ok("NOW card title is the live tool tip", nowTitle === "Bash · cargo test");

// the live edge is marked by the glowing dot alone — the "NOW" word was removed.
const liveDot = nowCard.queryAll((n) => n.hasClass("hg-entry__nowdot"))[0] || null;
ok("NOW card keeps the pulsing live dot", !!liveDot && liveDot.hasClass("hg-pulse"));
ok("the live dot carries an accessible name (replacing the removed label)",
   !!liveDot && liveDot.getAttribute("aria-label") === "live");
ok("NOW card no longer renders the 'NOW' label",
   nowCard.queryAll((n) => n.hasClass("hg-entry__nowlabel")).length === 0);

// integrity glyph surfaces only when it carries signal (not for passive records).
ok("volunteered decision shows an integrity glyph",
   decision.queryAll((n) => n.hasClass("hg-entry__intg")).length === 1);
ok("passive step shows NO integrity glyph",
   first("hg-entry--step").queryAll((n) => n.hasClass("hg-entry__intg")).length === 0);

// entries are threaded oldest -> newest (decision before reversal before now).
const entries = one("hg-entry");
const idxOf = (cls) => entries.findIndex((e) => e.hasClass(cls));
ok("entries are oldest -> newest (intent < decision < reversal < now < next)",
   idxOf("hg-entry--intent") < idxOf("hg-entry--decision") &&
   idxOf("hg-entry--decision") < idxOf("hg-entry--reversal") &&
   idxOf("hg-entry--reversal") < idxOf("hg-entry--now") &&
   idxOf("hg-entry--now") < idxOf("hg-entry--next"));

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
