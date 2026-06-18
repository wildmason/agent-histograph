// Headless test for V11 — renderFocus's keyed TRANSCRIPT reconcile. The focus pane
// used to clear() + rebuild the entire transcript (and re-init the ae-scroll-area)
// on every focus change, recreating dozens of entry nodes and re-running the scroll
// settle from scratch every ~1.5s during active work. The reconcile must instead, on
// a SAME-terminal update (not `fresh`), KEEP the scroll-area element (so scroll
// geometry is preserved) and REUSE the DOM node of every unchanged trail entry —
// rebuilding only the changed tip / live group — while the scroll policy is applied
// by the exact same applyScroll call as before.
//
// Contract (fails against the old clear+rebuild, passes only with a real reconcile):
//   • the ae-scroll-area + transcript elements persist across a !fresh update;
//   • unchanged head entries keep their exact DOM nodes;
//   • the trailing pending node is reused;
//   • a fresh (terminal-switch) render still rebuilds from scratch.
//
// Run: node histograph/test_focus_reconcile.mjs   (exit 0 = pass)

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
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "class") this.className = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
  append(...nodes) {
    for (const n of nodes) {
      if (n.parentNode) n.parentNode.removeChild(n);
      n.parentNode = this; this.children.push(n);
    }
  }
  insertBefore(newNode, refNode) {
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    newNode.parentNode = this;
    if (refNode == null) { this.children.push(newNode); return newNode; }
    const i = this.children.indexOf(refNode);
    if (i === -1) this.children.push(newNode); else this.children.splice(i, 0, newNode);
    return newNode;
  }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get firstChild() { return this.children[0] || null; }
  get lastElementChild() {
    for (let i = this.children.length - 1; i >= 0; i--) if (this.children[i].nodeType === 1) return this.children[i];
    return null;
  }
  get classes() { return this.className.split(/\s+/).filter(Boolean); }
  hasClass(c) { return this.classes.includes(c); }
  descendants() {
    const out = [];
    const walk = (n) => { for (const c of n.children || []) { if (c.nodeType === 1) out.push(c); walk(c); } };
    walk(this); return out;
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

const clone = (o) => JSON.parse(JSON.stringify(o));
const baseFocus = {
  terminalId: "term-1", parkedEpicSeam: null, workingNow: true,
  epic: { title: "Parity", done: 2, total: 4 },
  stories: [{ id: "st-c", title: "gRPC", state: "active" }],
  activeStory: {
    id: "st-c", title: "gRPC client", indexLabel: "active · 1 of 1",
    nowLine: { text: "Bash · cargo test", working: true },
    tasks: [
      { id: "tk-1", kind: "decision", summary: "single bidi stream", detail: "ordering",
        integrity: "volunteered", at: "2026-06-10T14:09:00Z" },
      { id: "tk-2", kind: "step", summary: "regen stubs", detail: "", integrity: "passive",
        at: "2026-06-10T14:21:00Z" },
      { id: "tk-4", kind: "milestone", summary: "half-close wired", detail: "clean shutdown",
        integrity: "volunteered", at: "2026-06-10T14:52:00Z" },
      { id: "act-0", kind: "activity", tool: "Bash", summary: "cargo test", now: true,
        detail: "", integrity: "passive", at: "2026-06-10T14:54:00Z" },
      { id: "tk-pending", kind: "pending", summary: "backport", detail: "", integrity: "passive", at: null },
    ],
  },
};

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

const mount = new El("section");
// ---- 1. fresh build stamps reconcile keys ---------------------------------
renderFocus(mount, clone(baseFocus), { fresh: true });
const scroll1 = mount.querySelector(".hg-focus__scroll");
const transcript1 = mount.querySelector(".hg-transcript");
const kids1 = transcript1.children;
const byKey1 = (k) => kids1.find((c) => c.getAttribute("data-rk") === k);
const tk1a = byKey1("e:tk-1");
const tk4a = byKey1("e:tk-4");
const penda = byKey1("e:tk-pending");
ok("fresh build creates the pane + keyed entries",
   !!scroll1 && !!transcript1 && !!tk1a && !!tk4a && !!penda);

// ---- 2. same-terminal update: new live tip; head + pending reused ----------
const f2 = clone(baseFocus);
f2.activeStory.nowLine = { text: "Bash · cargo clippy", working: true };
// the prior tip is no longer "now"; a new activity tip lands before the pending.
f2.activeStory.tasks.find((t) => t.id === "act-0").now = false;
f2.activeStory.tasks.splice(4, 0, { id: "act-1", kind: "activity", tool: "Bash",
  summary: "cargo clippy", now: true, detail: "", integrity: "passive", at: "2026-06-10T14:55:00Z" });
renderFocus(mount, f2, { changed: true });

const scroll2 = mount.querySelector(".hg-focus__scroll");
const transcript2 = mount.querySelector(".hg-transcript");
const kids2 = transcript2.children;
const byKey2 = (k) => kids2.find((c) => c.getAttribute("data-rk") === k);
ok("the ae-scroll-area element persists across a !fresh update", scroll2 === scroll1);
ok("the transcript element persists", transcript2 === transcript1);
ok("unchanged head decision/milestone nodes are REUSED",
   byKey2("e:tk-1") === tk1a && byKey2("e:tk-4") === tk4a);
ok("the trailing pending node is reused", byKey2("e:tk-pending") === penda);
ok("the new live tip is present in the trail",
   transcript2.queryAll((n) => n.hasClass && n.hasClass("hg-entry")).some(
     (n) => /cargo clippy/.test(n.textContent)));

// ---- 3. a changed head entry IS rebuilt ------------------------------------
const f3 = clone(f2);
f3.activeStory.tasks.find((t) => t.id === "tk-2").summary = "regen stubs (v2)";
renderFocus(mount, f3, { changed: true });
const kids3 = mount.querySelector(".hg-transcript").children;
const byKey3 = (k) => kids3.find((c) => c.getAttribute("data-rk") === k);
ok("an unchanged sibling is still reused after another update", byKey3("e:tk-1") === tk1a);
ok("the changed entry was rebuilt (new node) and shows new text",
   byKey3("e:tk-2") !== byKey1("e:tk-2") && /regen stubs \(v2\)/.test(byKey3("e:tk-2").textContent));

// ---- 4. a fresh (terminal switch) still rebuilds the pane from scratch ------
const f4 = clone(baseFocus);
f4.terminalId = "term-2";
renderFocus(mount, f4, { fresh: true });
const scroll4 = mount.querySelector(".hg-focus__scroll");
ok("a fresh render rebuilds the scroll-area (new pane on terminal switch)", scroll4 !== scroll1);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
