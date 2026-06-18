// Headless test for ledger.js — the live ledger-dir picker logic. Stubs document +
// fetch (no browser, no server) and exercises the real initLedger(): option population
// (candidates + the Custom/Reset sentinels), the POST payload for each selection branch,
// the custom-path reveal, and the error-hint path. This is the logic that makes
// switching ledgers in-app actually hit /api/ledger-dir with the right body.
//
// Run: node histograph/test_ledger.mjs   (exit 0 = pass)

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this.attrs = {};
    this.children = [];
    this.parentNode = null;
    this._handlers = {};
    this._text = "";
    this.value = "";
    this.hidden = false;
  }
  set textContent(v) { this._text = String(v); }
  get textContent() {
    return this.children.length ? this.children.map((c) => c.textContent).join("") : this._text;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
  append(...nodes) { for (const n of nodes) { n.parentNode = this; this.children.push(n); } }
  get firstChild() { return this.children[0] || null; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; }
  fire(type, detail) { for (const fn of this._handlers[type] || []) fn({ type, detail, stopPropagation() {} }); }
  click() { this.fire("click"); }
}
globalThis.document = { createElement: (t) => new El(t) };

// ---- fetch stub ----------------------------------------------------------- //
let calls = [];
let infoPayload = {
  current: "C:\\Users\\dev\\.agent-histograph",
  source: "default",
  default: "C:\\Users\\dev\\.agent-histograph",
  candidates: [
    { dir: "C:\\Users\\dev\\.agentlog", exists: true, sessions: 44, hasData: true, isCurrent: false, isDefault: false },
    { dir: "C:\\Users\\dev\\.agent-histograph", exists: true, sessions: 0, hasData: false, isCurrent: true, isDefault: true },
  ],
};
let postOk = true;
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url, opts });
  if (url === "/api/ledger") {
    return { ok: true, status: 200, json: async () => infoPayload };
  }
  // /api/ledger-dir
  if (postOk) return { ok: true, status: 200, json: async () => ({ ok: true, dir: "X", source: "override" }) };
  return { ok: false, status: 400, json: async () => ({ error: "no such directory: X" }) };
};

const { initLedger } = await import("./ledger.js");

let failures = 0;
const ok = (name, cond) => { if (!cond) { failures++; console.log("  ✗ " + name); } else console.log("  ✓ " + name); };
const tick = () => new Promise((r) => setTimeout(r, 0)); // let a fired async handler settle

function mkEls() {
  return {
    select: new El("ae-select"),
    customRow: new El("div"),
    customInput: new El("ae-input"),
    customApply: new El("ae-button"),
    current: new El("span"),
  };
}

// ---- 1. refresh() populates options incl. sentinels, preselects current ---- //
{
  calls = [];
  const els = mkEls();
  const applied = [];
  const ctl = initLedger(els, () => applied.push(1));
  await ctl.refresh();
  const opts = els.select.children;
  const values = opts.map((o) => o.getAttribute("value"));
  ok("refresh fetched /api/ledger", calls.some((c) => c.url === "/api/ledger"));
  ok("both candidate dirs become options", values.includes("C:\\Users\\dev\\.agentlog") && values.includes("C:\\Users\\dev\\.agent-histograph"));
  ok("a Custom path… sentinel option is appended", values.includes("__custom__"));
  ok("no Reset option when source is default", !values.includes("__reset__"));
  ok("candidate label carries the session count", opts.some((o) => /44 sessions/.test(o.textContent)));
  ok("select preselects the active dir", els.select.value === infoPayload.current);
  ok("hint names the active dir + source", /agent-histograph/.test(els.current.textContent) && /default/.test(els.current.textContent));
}

// ---- 2. selecting a real dir POSTs {dir} and re-fetches state -------------- //
{
  calls = [];
  postOk = true;
  const els = mkEls();
  const applied = [];
  const ctl = initLedger(els, () => applied.push(1));
  await ctl.refresh();
  calls = [];
  els.select.fire("ae-change", { value: "C:\\Users\\dev\\.agentlog" });
  await tick();
  const post = calls.find((c) => c.url === "/api/ledger-dir");
  ok("selecting a dir POSTs to /api/ledger-dir", !!post && post.opts.method === "POST");
  ok("POST body is {dir: <selected>}", !!post && JSON.parse(post.opts.body).dir === "C:\\Users\\dev\\.agentlog");
  ok("onApplied fired so the board re-fetches", applied.length === 1);
}

// ---- 3. Reset sentinel POSTs {reset:true} --------------------------------- //
{
  // source override -> the Reset option is offered
  infoPayload = { ...infoPayload, source: "override" };
  calls = [];
  postOk = true;
  const els = mkEls();
  const ctl = initLedger(els, () => {});
  await ctl.refresh();
  const values = els.select.children.map((o) => o.getAttribute("value"));
  ok("Reset option offered when an override is active", values.includes("__reset__"));
  calls = [];
  els.select.fire("ae-change", { value: "__reset__" });
  await tick();
  const post = calls.find((c) => c.url === "/api/ledger-dir");
  ok("Reset POSTs {reset:true}", !!post && JSON.parse(post.opts.body).reset === true);
  infoPayload = { ...infoPayload, source: "default" };
}

// ---- 4. Custom sentinel reveals the path field, does NOT POST ------------- //
{
  calls = [];
  const els = mkEls();
  const ctl = initLedger(els, () => {});
  await ctl.refresh();
  calls = [];
  els.select.fire("ae-change", { value: "__custom__" });
  await tick();
  ok("Custom reveals the custom row", els.customRow.hidden === false);
  ok("Custom does not POST anything", !calls.some((c) => c.url === "/api/ledger-dir"));
  // typing a path + Use commits it
  els.customInput.value = "D:\\ledgers\\mine";
  els.customApply.click();
  await tick();
  const post = calls.find((c) => c.url === "/api/ledger-dir");
  ok("Use commits the typed path as {dir}", !!post && JSON.parse(post.opts.body).dir === "D:\\ledgers\\mine");
}

// ---- 5. a rejected switch surfaces an error hint -------------------------- //
{
  postOk = false;
  calls = [];
  const els = mkEls();
  const ctl = initLedger(els, () => {});
  await ctl.refresh();
  els.select.fire("ae-change", { value: "C:\\nope" });
  await tick();
  ok("a 400 sets the error hint text", /no such directory/i.test(els.current.textContent));
  ok("the hint is flagged as an error", els.current.getAttribute("data-error") === "true");
  postOk = true;
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
