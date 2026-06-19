// Headless render test for the "while you were away" digest sheet (#1).
//   • renderDigest names the project + paints the milestone/reversal/waiting flags
//   • Done invokes onDismiss; the Copy buttons invoke onExport with the right format
//   • an empty digest renders the empty state, not project groups
//   • digestToMarkdown serializes the beats (deterministic, no LLM)
//
// Run: node histograph/test_digest.mjs   (exit 0 = pass)

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
  focus() { this._focused = true; }
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

const { renderDigest, digestToMarkdown, digestToHtml, fmtUsd } = await import("./render.js");

let failed = 0;
function ok(cond, msg) { if (!cond) { console.error("FAIL:", msg); failed++; } }
function fireClick(node) { (node._handlers.click || []).forEach((fn) => fn({})); }
function findByText(mount, cls, text) {
  return mount.queryAll((n) => n.hasClass(cls)).find((n) => n.textContent.indexOf(text) !== -1);
}

const SAMPLE = {
  since: 1000, now: 1000 + 3 * 3600, generatedAt: "2026-06-19T10:00:00Z", empty: false,
  projects: [{
    project: "Mortar", providers: ["claude", "codex"],
    decisions: [
      { topic: "billing provider", choice: "switch to Stripe", class: "billing", highClass: true },
      { topic: "button color", choice: "use teal", class: "local", highClass: false },
    ],
    milestones: [{ topic: "billing provider", choice: "switch to Stripe", highClass: true }],
    reversals: [{ topic: "db choice", choice: "use mysql", supersededSummary: "use postgres" }],
    waiting: [{ terminalId: "term-1", provider: "claude", question: "ship it?" }],
    newlyStale: [{ terminalId: "term-2", provider: "codex", story: "st-x" }],
    filesChanged: ["src/a.py", "src/b.py"],
    counts: { decisions: 2, milestones: 1, reversals: 1, newlyStale: 1, waiting: 1, filesChanged: 2 },
  }],
  totals: { decisions: 2, milestones: 1, reversals: 1, newlyStale: 1, waiting: 1, filesChanged: 2 },
};

// --- renderDigest names the project + paints the flags ---
{
  const mount = new El("div");
  renderDigest(mount, SAMPLE, {});
  ok(findByText(mount, "hg-digest__project", "Mortar"), "digest names the project");
  ok(mount.queryAll((n) => n.hasClass("hg-digest__flag--milestone")).length === 1, "renders a milestone flag");
  ok(mount.queryAll((n) => n.hasClass("hg-digest__flag--reversal")).length === 1, "renders a reversal flag");
  ok(mount.queryAll((n) => n.hasClass("hg-digest__flag--waiting")).length === 1, "renders a waiting flag");
  ok(mount.queryAll((n) => n.hasClass("hg-digest__flag--stale")).length === 1, "renders a stale flag");
  const rev = mount.queryAll((n) => n.hasClass("hg-digest__flag--reversal"))[0];
  ok(rev.textContent.indexOf("mysql") !== -1 && rev.textContent.indexOf("postgres") !== -1,
    "reversal row shows both the new choice and the superseded one");
}

// --- Done invokes onDismiss; Copy buttons invoke onExport with the format ---
{
  const mount = new El("div");
  let dismissed = 0;
  const exported = [];
  renderDigest(mount, SAMPLE, { onDismiss: () => dismissed++, onExport: (fmt, content) => exported.push([fmt, content]) });
  const buttons = mount.queryAll((n) => n.tagName === "AE-BUTTON");
  const done = buttons.find((b) => b.textContent === "Mark as read");
  const mk = buttons.find((b) => b.textContent.indexOf("Markdown") !== -1);
  const ht = buttons.find((b) => b.textContent.indexOf("HTML") !== -1);
  ok(done && mk && ht, "the sheet has Mark as read + Copy Markdown + Copy HTML actions");
  fireClick(done);
  ok(dismissed === 1, "Mark as read invokes onDismiss once");
  fireClick(mk);
  ok(exported.length === 1 && exported[0][0] === "markdown", "Markdown button invokes onExport('markdown', ...)");
  ok(typeof exported[0][1] === "string" && exported[0][1].indexOf("Stripe") !== -1,
    "the exported Markdown contains the digest content");
  fireClick(ht);
  ok(exported.length === 2 && exported[1][0] === "html", "HTML button invokes onExport('html', ...)");
}

// --- multi-project: a vertical rail picks which single pane is visible ---
{
  const role = (n, r) => n.getAttribute("role") === r;
  const fireKey = (node, key) =>
    (node._handlers.keydown || []).forEach((fn) => fn({ key, preventDefault() {} }));
  const beat = (over) => ({
    project: "P", providers: ["claude"], decisions: [], milestones: [], reversals: [],
    waiting: [], newlyStale: [], filesChanged: [], counts: {}, ...over,
  });
  const MULTI = {
    since: 0, now: 3600, empty: false, totals: {},
    projects: [
      beat({ project: "Quiet", decisions: [{ topic: "a", choice: "decided a" }, { topic: "b", choice: "decided b" }] }),
      beat({ project: "Blocked", waiting: [{ terminalId: "t1", provider: "claude", question: "merge to main?" }] }),
      beat({ project: "Stale", newlyStale: [{ terminalId: "t2", provider: "codex", story: "s" }] }),
    ],
  };
  const mount = new El("div");
  renderDigest(mount, MULTI, {});

  const tablist = mount.queryAll((n) => role(n, "tablist"));
  ok(tablist.length === 1, "multi-project digest renders exactly one tablist (the rail)");
  const tabs = mount.queryAll((n) => role(n, "tab"));
  ok(tabs.length === 3, "one rail tab per project");
  const panels = mount.queryAll((n) => role(n, "tabpanel"));
  ok(panels.length === 1, "only one project pane is visible at a time");

  // ordered most-urgent first: waiting (Blocked) > stale (Stale) > plain decisions (Quiet)
  ok(tabs[0].textContent.indexOf("Blocked") !== -1, "the waiting project sorts to the top of the rail");
  ok(tabs[0].getAttribute("aria-selected") === "true", "the top (most urgent) tab is selected by default");
  ok(tabs[1].getAttribute("aria-selected") === "false" && tabs[1].getAttribute("tabindex") === "-1",
    "unselected tabs are aria-selected=false and removed from the tab order (roving tabindex)");
  ok(panels[0].textContent.indexOf("merge to main?") !== -1, "the visible pane is the selected (Blocked) project");

  // rail count badges reflect the beat count (Quiet has 2 decisions)
  const quietTab = tabs.find((t) => t.textContent.indexOf("Quiet") !== -1);
  ok(quietTab.queryAll((n) => n.hasClass("hg-digest__rail-count"))[0].textContent === "2",
    "the rail badge counts a project's beats");

  // click a different tab -> the pane swaps, selection moves
  (quietTab._handlers.click || []).forEach((fn) => fn({}));
  const panelsAfter = mount.queryAll((n) => role(n, "tabpanel"));
  ok(panelsAfter.length === 1 && panelsAfter[0].textContent.indexOf("decided a") !== -1,
    "clicking a tab swaps the visible pane to that project");
  ok(quietTab.getAttribute("aria-selected") === "true" && tabs[0].getAttribute("aria-selected") === "false",
    "selection moves to the clicked tab and leaves the old one");

  // keyboard: ArrowDown from the selected tab moves selection (automatic activation)
  const rail = tablist[0];
  // reset to the top tab, then arrow down to the second
  (tabs[0]._handlers.click || []).forEach((fn) => fn({}));
  fireKey(rail, "ArrowDown");
  const panelNow = mount.queryAll((n) => role(n, "tabpanel"))[0];
  ok(tabs[1].getAttribute("aria-selected") === "true",
    "ArrowDown advances rail selection to the next tab");
  ok(panelNow.textContent.indexOf("went quiet") !== -1,
    "ArrowDown also swaps the pane (automatic activation) to the 2nd project");
}

// --- empty digest -> empty state, no project groups ---
{
  const mount = new El("div");
  renderDigest(mount, { empty: true, projects: [], since: 0, now: 0, totals: {} }, {});
  ok(mount.queryAll((n) => n.tagName === "AE-EMPTY-STATE").length === 1, "empty digest renders the empty state");
  ok(mount.queryAll((n) => n.hasClass("hg-digest__group")).length === 0, "empty digest has no project groups");
}

// --- digestToMarkdown serializes the beats ---
{
  const md = digestToMarkdown(SAMPLE);
  ok(md.indexOf("## Mortar") !== -1, "markdown has a project heading");
  ok(md.indexOf("**MILESTONE**") !== -1 && md.indexOf("Stripe") !== -1, "markdown flags the milestone");
  ok(md.indexOf("**REVERSAL**") !== -1 && md.indexOf("postgres") !== -1, "markdown notes the reversal + prior");
  ok(md.indexOf("**WAITING**") !== -1, "markdown flags the waiting lane");
}

// --- digestToHtml escapes untrusted agent text (no XSS in the copied HTML) ---
{
  const evil = {
    since: 0, now: 0, empty: false, totals: {},
    projects: [{
      project: "Mortar", providers: ["claude"],
      decisions: [], milestones: [{ topic: "x", choice: "<script>alert(1)</script> & <b>bold</b>" }],
      reversals: [], waiting: [{ question: "ship <img src=x onerror=1>?" }], newlyStale: [], filesChanged: [],
      counts: {},
    }],
  };
  const html = digestToHtml(evil);
  ok(html.indexOf("<script>") === -1, "digestToHtml does not emit a raw <script> tag");
  ok(html.indexOf("&lt;script&gt;") !== -1, "digestToHtml escapes < and > to entities");
  ok(html.indexOf("&amp;") !== -1, "digestToHtml escapes & to &amp;");
  ok(html.indexOf("onerror=") !== -1 ? html.indexOf("<img") === -1 : true, "no raw <img> survives");
  ok(html.indexOf("<strong>MILESTONE</strong>") !== -1, "html keeps the structural MILESTONE tag");
}

// --- fmtUsd boundary contract (zero / sub-cent / dollar tiers / separators) ---
{
  ok(fmtUsd(null) === "" && fmtUsd(NaN) === "", "fmtUsd(null/NaN) is the empty sentinel");
  ok(fmtUsd(0) === "$0", "fmtUsd(0) is $0 (true zero)");
  ok(fmtUsd(0.004) === "<$0.01", "sub-cent reads <$0.01, never $0 (would imply free)");
  ok(fmtUsd(0.01) === "$0.01", "the cent boundary renders 2dp");
  ok(fmtUsd(0.42) === "$0.42" && fmtUsd(9.99) === "$9.99", "2dp tier below $10");
  ok(fmtUsd(10) === "$10.0" && fmtUsd(999.9) === "$999.9", "1dp tier from $10 to <$1000");
  ok(/^\$1,500$/.test(fmtUsd(1500)), "thousands tier rounds with a separator and no decimal");
}

if (failed) { console.error(`\n${failed} assertion(s) failed`); process.exit(1); }
console.log("test_digest.mjs: PASS");
