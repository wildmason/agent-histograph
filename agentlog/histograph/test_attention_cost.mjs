// Headless render test for the attention (#3) + cost (#2) lane surfaces.
//   • a stuck term paints the stuck dot + STUCK pill, and its row carries hg-trow--stuck
//   • needs-you OUTRANKS stuck in the pill (a both-true lane shows NEEDS YOU)
//   • a priced lane renders a tiny .hg-trow__cost; a gemini/unavailable lane renders
//     NO cost (never a false $0)
//   • the fleet header renders .hg-terms__stat--cost, and changing fleetCost repaints it
//     (the cost must be folded into headSig or the header silently won't update)
//
// Run: node histograph/test_attention_cost.mjs   (exit 0 = pass)

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

let failed = 0;
function ok(cond, msg) { if (!cond) { console.error("FAIL:", msg); failed++; } }
function has(node, cls) { return node.queryAll((n) => n.hasClass(cls)).length > 0; }

function term(over) {
  return Object.assign({
    id: "t1", provider: "claude", project: "Mortar",
    status: "active", freshnessLabel: "mid-turn", freshnessTone: "muted",
    story: { title: "doing work" }, epic: null, annotation: "", focused: false,
    statusLine: { text: "", kind: "status" },
    attention: { kind: null, needsYou: false, stuck: false, stuckSignature: null, stuckCount: 0 },
    cost: null,
  }, over || {});
}

// --- stuck lane paints the stuck dot + STUCK pill + row modifier ---
{
  const mount = new El("div");
  const t = term({ id: "s1", attention: { kind: "stuck", needsYou: false, stuck: true, stuckSignature: "x", stuckCount: 3 } });
  renderTriage(mount, [t], {});
  ok(has(mount, "hg-statusdot--stuck"), "stuck lane renders the stuck status dot");
  ok(has(mount, "hg-trow__pill--stuck"), "stuck lane renders the STUCK pill");
  ok(has(mount, "hg-trow--stuck"), "stuck lane row carries hg-trow--stuck");
  const pill = mount.queryAll((n) => n.hasClass("hg-trow__pill--stuck"))[0];
  ok(pill && pill.textContent === "STUCK", "STUCK pill text is correct");
}

// --- needs-you OUTRANKS stuck in the pill ---
{
  const mount = new El("div");
  const t = term({ id: "ns1", status: "needs-you", attention: { kind: "needs-you", needsYou: true, stuck: true, stuckSignature: "x", stuckCount: 3 } });
  renderTriage(mount, [t], {});
  ok(has(mount, "hg-trow__pill--attn"), "needs-you+stuck shows the NEEDS YOU pill");
  ok(!has(mount, "hg-trow__pill--stuck"), "needs-you+stuck does NOT show the STUCK pill");
}

// --- priced lane renders a cost; gemini/unavailable renders none (no false $0) ---
{
  const mount = new El("div");
  const priced = term({ id: "p1", cost: { usd: 0.42, tokens: { total: 1000 }, accuracy: "approximate", model: "claude-opus-4-8", provider: "claude" } });
  const gem = term({ id: "g1", provider: "gemini", cost: { usd: null, tokens: null, accuracy: "unavailable", priced: false, provider: "gemini", reason: "no usage in transcript" } });
  renderTriage(mount, [priced, gem], {});
  const costs = mount.queryAll((n) => n.hasClass("hg-trow__cost"));
  ok(costs.length === 1, "exactly one lane (the priced one) renders a cost figure");
  ok(costs[0].textContent.indexOf("$") === 0, "the cost figure is a $ amount");
}

// --- fleet header cost stat + repaint-on-change (headSig fold) ---
{
  const mount = new El("div");
  const t = term({ id: "f1", cost: { usd: 0.5, tokens: { total: 100 }, accuracy: "approximate", provider: "claude" } });
  const fc1 = { usd: 1.5, sessionsPriced: 2, sessionsUnavailable: 1, tokens: { total: 300 },
    byProvider: { claude: { usd: 1.0, tokens: 100 }, codex: { usd: 0.5, tokens: 200 }, gemini: { usd: null, tokens: null } } };
  renderTriage(mount, [t], { fleetCost: fc1, time: "10:00" });
  let stat = mount.queryAll((n) => n.hasClass("hg-terms__stat--cost"))[0];
  ok(stat, "fleet header renders the cost stat");
  ok(stat && stat.textContent.indexOf("$1.5") !== -1, "cost stat shows the fleet total");
  ok(has(mount, "hg-terms__cost-flag"), "the partial-cost flag (*) shows when lanes are unavailable");

  // change the fleet cost -> the header must repaint (cost folded into headSig)
  const fc2 = Object.assign({}, fc1, { usd: 2.0, byProvider: { claude: { usd: 1.5, tokens: 100 }, codex: { usd: 0.5, tokens: 200 }, gemini: { usd: null, tokens: null } } });
  renderTriage(mount, [t], { fleetCost: fc2, time: "10:00" });
  stat = mount.queryAll((n) => n.hasClass("hg-terms__stat--cost"))[0];
  ok(stat && stat.textContent.indexOf("$2") !== -1, "cost stat repaints when fleetCost changes (headSig fold)");
}

if (failed) { console.error(`\n${failed} assertion(s) failed`); process.exit(1); }
console.log("test_attention_cost.mjs: PASS");
