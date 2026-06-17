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
    this.style = {};
    this._popoverOpen = false;
    this._showPopoverCalls = 0;
    this._hidePopoverCalls = 0;
  }
  set textContent(v) { this._text = String(v); }
  get textContent() {
    return this.children.length
      ? this.children.map((c) => c.textContent).join("")
      : this._text;
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k === "class") this.className = String(v);
  }
  removeAttribute(k) { delete this.attrs[k]; }
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
    const ev = { type: "click", target: this, stopPropagation() {}, preventDefault() {} };
    for (const fn of this._handlers.click || []) fn(ev);
  }
  dispatch(type, init = {}) {
    const ev = {
      type,
      target: this,
      clientX: init.clientX || 0,
      clientY: init.clientY || 0,
      key: init.key,
      stopPropagation() {},
      preventDefault() { this.defaultPrevented = true; },
      defaultPrevented: false,
    };
    for (const fn of this._handlers[type] || []) fn(ev);
    return ev;
  }
  contextmenu(init = {}) { return this.dispatch("contextmenu", init); }
  contains(node) {
    if (node === this) return true;
    return this.descendants().includes(node);
  }
  showPopover() {
    this._popoverOpen = true;
    this._showPopoverCalls++;
  }
  hidePopover() {
    this._popoverOpen = false;
    this._hidePopoverCalls++;
  }
  focus() {}
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
  body: new El("body"),
  _handlers: {},
  createElement: (t) => new El(t),
  createElementNS: (_ns, t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); },
  removeEventListener(type, fn) {
    this._handlers[type] = (this._handlers[type] || []).filter((x) => x !== fn);
  },
};

const { renderTriage } = await import("./render.js");

// ---- fixture -------------------------------------------------------------- //
let focused = [];
let dismissed = [];
let annotated = [];
let promptCalls = [];
globalThis.prompt = (message, current) => {
  promptCalls.push({ message, current });
  return "working on updating codex to use new histograph features";
};
const terminals = [
  // focused + active -> ▚ VIEWING pill; an active lane is "running".
  { id: "term-1", project: "Mortar", provider: "claude", status: "active",
    story: { title: "wire the parser" }, freshnessLabel: "2m", freshnessTone: "muted",
    focused: true, annotation: "existing note" },
  // needs-you (not focused) -> NEEDS YOU pill. Does NOT reorder: it keeps its slot.
  { id: "term-2", project: "Bridge", provider: "codex", status: "needs-you",
    story: { title: "review the diff" }, freshnessLabel: "5m", freshnessTone: "warning",
    focused: false, statusLine: { kind: "needs-you", text: "needs you" } },
];

const mount = new El("div");
renderTriage(mount, terminals, {
  onFocus: (id) => focused.push(id),
  onDismiss: (id) => dismissed.push(id),
  onAnnotate: (id, text) => annotated.push({ id, text }),
});

// ---- assertions ----------------------------------------------------------- //
let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };

const closes = mount.queryAll((n) => n.tagName === "BUTTON" && n.hasClass("hg-trow__close"));
const rows = mount.queryAll((n) => n.hasClass("hg-trow"));
const wraps = mount.queryAll((n) => n.hasClass("hg-trow-wrap"));
const heads = mount.queryAll((n) => n.hasClass("hg-terms__head"));
const annotations = mount.queryAll((n) => n.hasClass("hg-trow__annotation"));
const annotationIcons = mount.queryAll((n) => n.hasClass("hg-trow__annotation-icon"));

ok("one close button per lane (2)", closes.length === 2);
ok("two lane rows", rows.length === 2);
ok("two row wraps", wraps.length === 2);
ok("fleet header rendered once", heads.length === 1);
ok("annotation renders as dimmed lane text",
   annotations.length === 1 && annotations[0].textContent === "existing note");
ok("annotation renders a leading icon",
   annotationIcons.length === 1 && annotations[0].descendants().includes(annotationIcons[0]));
// lanes render in the order given — needs-you NO LONGER floats to the top (that
// reshuffle read as confusing churn). term-1 was passed first, so it stays first;
// the blocked lane is surfaced by its dot + the header count + its pill, not position.
const orderedTerms = rows.map((r) => r.getAttribute("data-terminal"));
ok("lanes render in backend order — no needs-you reshuffle",
   orderedTerms[0] === "term-1" && orderedTerms[1] === "term-2");
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

// right-clicking a lane opens the context menu without focusing or dismissing it.
row1.contextmenu({ clientX: 40, clientY: 50 });
const menu = document.body.queryAll((n) => n.hasClass("hg-context-menu"))[0];
const menuItems = document.body.queryAll((n) => n.hasClass("hg-context-menu__item"));
const menuIcons = document.body.queryAll((n) => n.hasClass("hg-context-menu__icon"));
ok("right-click opens a terminal context menu", !!menu);
ok("context menu uses native manual popover when available",
   menu.getAttribute("popover") === "manual" &&
   menu._popoverOpen === true &&
   menu._showPopoverCalls === 1);
ok("annotated row context menu includes remove annotation",
   menuItems.map((n) => n.textContent).join("|") === "Annotate|Remove annotation|Delete");
ok("annotated row context menu renders an icon for each action", menuIcons.length === 3);
ok("right-click does not focus or dismiss",
   focused.length === 1 && dismissed.length === 1);

menuItems.find((n) => n.textContent === "Remove annotation").click();
ok("remove annotation clears through the annotate callback",
   annotated.length === 1 &&
   annotated[0].id === "term-1" &&
   annotated[0].text === "");
ok("remove annotation closes the context menu",
   document.body.queryAll((n) => n.hasClass("hg-context-menu")).length === 0 &&
   menu._hidePopoverCalls === 1);

row1.contextmenu({ clientX: 40, clientY: 50 });
const menuItemsAgain = document.body.queryAll((n) => n.hasClass("hg-context-menu__item"));
menuItemsAgain.find((n) => n.textContent === "Annotate").click();
ok("annotate prompts with the current note",
   promptCalls.length === 1 && promptCalls[0].current === "existing note");
ok("annotate routes terminal id and one-line text",
   annotated.length === 2 &&
   annotated[1].id === "term-1" &&
   annotated[1].text === "working on updating codex to use new histograph features");
ok("annotate closes the context menu",
   document.body.queryAll((n) => n.hasClass("hg-context-menu")).length === 0);

const row2 = rows.find((r) => r.getAttribute("data-terminal") === "term-2");
row2.contextmenu({ clientX: 80, clientY: 90 });
const row2Items = document.body.queryAll((n) => n.hasClass("hg-context-menu__item"));
ok("unannotated row context menu omits remove annotation",
   row2Items.map((n) => n.textContent).join("|") === "Annotate|Delete");
const deleteItem = row2Items.find((n) => n.textContent === "Delete");
deleteItem.click();
ok("context-menu delete calls the same onDismiss path",
   dismissed.length === 2 && dismissed[1] === "term-2");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
