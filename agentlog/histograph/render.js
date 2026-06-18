// ==========================================================================
// Histograph — render.js
// Pure DOM builders. A THIN renderer of the FROZEN /api/state contract.
// No fetching, no derivation, no business logic — every value rendered here
// is computed by the Python backend (serve_state.py) and handed over as JSON.
// All color / type / spacing comes from --ae-* tokens (in app.css / markers.css);
// this module only chooses class names and ae-* elements, never hex.
//
// Layout (the "Transcript + terminals" design):
//   renderTriage(mountEl, terminals, { onFocus, onDismiss, time })
//       -> the fleet switcher: a header line ("terminals · N need you · M running"
//          + clock) over a needs-you-first, height-capped scroll of one-line lanes,
//          each carrying a NEEDS YOU / ▚ VIEWING / IDLE micro-label.
//   renderFocus(mountEl, focus, { changed, fresh })
//       -> the pinned ORIENTATION HEADER (working-toward epic + story title + a
//          "now —" live line + segmented roadmap bar) over a scrolling TRANSCRIPT
//          TRAIL: a chronological feed of typed entries (▸ intent ◆ decision
//          · step ↺ reversal ○ milestone, a highlighted NOW card, a ghosted next).
//   titlebarMeta(state) -> { needs, count, time } small derived strings.
//
// The contract is null-tolerant by design (cold: focus===null; no-epic:
// focus.epic===null; live-but-empty: activeStory.tasks===[]). Every builder
// guards its nullable inputs and degrades to a calm state rather than throwing.
// ==========================================================================

// ---- tiny DOM helper -----------------------------------------------------

/**
 * el(tag, props, ...children) — terse element factory.
 *  props.class      -> className
 *  props.text       -> textContent (escaped by the DOM, never innerHTML)
 *  props.attrs      -> { name: value } setAttribute pairs (skips null/false)
 *  props.title      -> title attribute
 *  props.on         -> { event: handler }
 *  any other prop is set as an attribute.
 */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "title") node.setAttribute("title", v);
    else if (k === "attrs") {
      for (const [an, av] of Object.entries(v)) {
        if (av == null || av === false) continue;
        node.setAttribute(an, av === true ? "" : String(av));
      }
    } else if (k === "on") {
      for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
    } else {
      node.setAttribute(k, v === true ? "" : String(v));
    }
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function clear(mount) {
  while (mount.firstChild) mount.removeChild(mount.firstChild);
}

// ---- vocab tables (presentation only; the meaning is computed upstream) --

// provider glyph + class. Tints live in markers.css.
const PROVIDER = {
  claude: { glyph: "✳", label: "Claude Code", cls: "hg-provider--claude" },
  codex: { glyph: "❯", label: "Codex", cls: "hg-provider--codex" },
  gemini: { glyph: "✦", label: "Gemini", cls: "hg-provider--gemini" },
  unknown: { glyph: "•", label: "Agent", cls: "hg-provider--unknown" },
};

// integrity glyph + tooltip text + class (UX §6).
const INTEGRITY = {
  reconstructed: { glyph: "◇", label: "reconstructed", cls: "hg-integrity--reconstructed" },
  volunteered: { glyph: "◈", label: "volunteered", cls: "hg-integrity--volunteered" },
  "human-confirmed": { glyph: "✓", label: "human-confirmed", cls: "hg-integrity--human-confirmed" },
  passive: { glyph: "▫", label: "passive", cls: "hg-integrity--passive" },
};

const STATUS_DOT = {
  active: "hg-statusdot--active",
  "needs-you": "hg-statusdot--needs-you",
  stale: "hg-statusdot--stale",
  parked: "hg-statusdot--parked",
  done: "hg-statusdot--done",
};

function providerOf(p) {
  return PROVIDER[p] || PROVIDER.unknown;
}
function integrityOf(i) {
  return INTEGRITY[i] || INTEGRITY.reconstructed;
}

// A lane "needs you" by its status OR by an open blocking-ask status line.
function isNeedsYou(t) {
  return t.status === "needs-you" || (t.statusLine && t.statusLine.kind === "needs-you");
}

// freshness tone -> class, clamped to the known set (muted/warning/danger) with a
// muted fallback; a "mid-turn" beat reads warning even when the backend collapsed it.
function freshToneKey(term) {
  const FRESH_TONES = { muted: 1, warning: 1, danger: 1 };
  let toneKey = FRESH_TONES[term.freshnessTone] ? term.freshnessTone : "muted";
  if (term.freshnessLabel === "mid-turn") toneKey = "warning";
  return toneKey;
}

// tool glyph for an in-flight activity node (the live tool stream). Presentation
// only — the backend just classifies the tool name.
const TOOL_GLYPH = {
  Edit: "✎", Write: "✎", NotebookEdit: "✎",
  Read: "◎", Bash: "❯", Grep: "⌕", Glob: "⌕",
  Task: "◆", Agent: "◆", WebFetch: "⌖", WebSearch: "⌖", TodoWrite: "☰",
};
function toolGlyph(tool) {
  return TOOL_GLYPH[tool] || "▸";
}

// Which completed-task tool accordions the reader has expanded — keyed by task id.
// Persisted at module scope so an open accordion survives a focus-pane rebuild
// (a new tool action landing elsewhere) instead of snapping shut mid-read.
const openTools = new Set();

// A completed turn's tool calls, folded behind a click-to-expand disclosure. The
// summary shows the count; expanding lists each call (glyph + tool + target + time),
// reusing the faint activity styling. Returns null when the task has no calls.
function toolAccordion(task) {
  const calls = Array.isArray(task.toolCalls) ? task.toolCalls : [];
  if (!calls.length) return null;
  const count = task.toolCount || calls.length;
  const id = task.id;

  const details = el("details", {
    class: "hg-tools",
    attrs: { open: id && openTools.has(id) },
    on: {
      toggle: (e) => {
        if (!id) return;
        if (e.target.open) openTools.add(id);
        else openTools.delete(id);
      },
    },
  });
  details.append(
    el(
      "summary",
      { class: "hg-tools__summary" },
      el("span", { class: "hg-tools__caret", attrs: { "aria-hidden": "true" }, text: "▸" }),
      el("span", {
        class: "hg-tools__count",
        text: `${count} tool ${count === 1 ? "call" : "calls"}`,
      })
    )
  );

  const listEl = el("div", { class: "hg-tools__list" });
  // when the turn's stream was capped, name the earlier calls we didn't carry.
  const omitted = count - calls.length;
  if (omitted > 0) {
    listEl.append(el("div", { class: "hg-tools__more", text: `+ ${omitted} earlier` }));
  }
  for (const c of calls) {
    const row = el(
      "div",
      { class: "hg-tools__row" },
      el("span", { class: "hg-tools__glyph", attrs: { "aria-hidden": "true" }, text: toolGlyph(c.tool) }),
      el("span", { class: "hg-tools__tool", text: c.tool || "tool" })
    );
    if (c.target) row.append(el("span", { class: "hg-tools__target", text: c.target }));
    if (c.desc) row.append(el("span", { class: "hg-tools__desc", text: c.desc }));
    const t = clock(c.at);
    if (t) row.append(el("span", { class: "hg-tools__time", text: t }));
    listEl.append(row);
  }
  details.append(listEl);
  return details;
}

// HH:MM from an ISO-8601 string; "" when null/unparseable (pending tasks).
function clock(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function oneLine(text) {
  return String(text == null ? "" : text).replace(/\s+/g, " ").trim();
}

const FA_EDIT_PATH = "M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z";
const FA_TRASH_PATH = "M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z";
const FA_FEATHER_PATH = "M416 64C457 64 496.3 80.3 525.2 109.2L530.7 114.7C559.7 143.7 576 183 576 223.9C576 248 570.3 271.5 559.8 292.7C557.9 296.4 554.5 299.2 550.5 300.4L438.5 334C434.6 335.2 432 338.7 432 342.8C432 347.9 436.1 352 441.2 352L473.4 352C487.7 352 494.8 369.2 484.7 379.3L462.3 401.7C460.4 403.6 458.1 404.9 455.6 405.7L374.6 430C370.7 431.2 368.1 434.7 368.1 438.8C368.1 443.9 372.2 448 377.3 448C390.5 448 396.2 463.7 385.1 470.9C344 497.5 295.8 512 246.1 512L160.1 512L112.1 560C103.3 568.8 88.9 568.8 80.1 560C71.3 551.2 71.3 536.8 80.1 528L320 288C328.8 279.2 328.8 264.8 320 256C311.2 247.2 296.8 247.2 288 256L143.5 400.5C137.8 406.2 128 402.2 128 394.1C128 326.2 155 261.1 203 213.1L306.8 109.2C335.7 80.3 375 64 416 64z";
const FA_REMOVE_ANNOTATION_PATH = "M88 256L232 256C241.7 256 250.5 250.2 254.2 241.2C257.9 232.2 255.9 221.9 249 215L202.3 168.3C277.6 109.7 386.6 115 455.8 184.2C530.8 259.2 530.8 380.7 455.8 455.7C380.8 530.7 259.3 530.7 184.3 455.7C174.1 445.5 165.3 434.4 157.9 422.7C148.4 407.8 128.6 403.4 113.7 412.9C98.8 422.4 94.4 442.2 103.9 457.1C113.7 472.7 125.4 487.5 139 501C239 601 401 601 501 501C601 401 601 239 501 139C406.8 44.7 257.3 39.3 156.7 122.8L105 71C98.1 64.2 87.8 62.1 78.8 65.8C69.8 69.5 64 78.3 64 88L64 232C64 245.3 74.7 256 88 256z";

function svgIcon(pathD, cls) {
  if (!document.createElementNS) {
    return el("span", { class: cls, attrs: { "aria-hidden": "true" } });
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", cls);
  svg.setAttribute("viewBox", "0 0 640 640");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.append(path);
  return svg;
}

function menuIcon(pathD) {
  return svgIcon(pathD, "hg-context-menu__icon");
}

// ==========================================================================
// TERMINALS — the fleet switcher (top section)
// ==========================================================================

let activeTerminalMenu = null;
let activeTerminalMenuCleanup = null;

function closeTerminalMenu() {
  if (activeTerminalMenu && typeof activeTerminalMenu.hidePopover === "function") {
    try {
      activeTerminalMenu.hidePopover();
    } catch {
      /* already hidden or unsupported; remove below still cleans up */
    }
  }
  if (activeTerminalMenu && activeTerminalMenu.parentNode) {
    activeTerminalMenu.parentNode.removeChild(activeTerminalMenu);
  }
  activeTerminalMenu = null;
  if (activeTerminalMenuCleanup) {
    activeTerminalMenuCleanup();
    activeTerminalMenuCleanup = null;
  }
}

function menuPosition(menu, x, y) {
  const margin = 8;
  const width = 188;
  const itemCount = menu && menu.children ? menu.children.length : 2;
  const height = 12 + itemCount * 34;
  const maxX = typeof window !== "undefined" && window.innerWidth
    ? window.innerWidth - width - margin
    : x;
  const maxY = typeof window !== "undefined" && window.innerHeight
    ? window.innerHeight - height - margin
    : y;
  const left = Math.max(margin, Math.min(x || margin, maxX));
  const top = Math.max(margin, Math.min(y || margin, maxY));
  if (menu.style) {
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  } else {
    menu.setAttribute("style", `left:${left}px;top:${top}px`);
  }
}

function showTerminalMenu(term, name, point, { onAnnotate, onDismiss } = {}) {
  if (!onAnnotate && !onDismiss) return;
  const host = document.body || document.documentElement;
  if (!host || !host.append) return;
  closeTerminalMenu();
  const currentAnnotation = oneLine(term.annotation);

  const annotateBtn = el("button", {
    class: "hg-context-menu__item",
    attrs: { type: "button", role: "menuitem" },
  }, menuIcon(FA_EDIT_PATH), el("span", { text: "Annotate" }));
  annotateBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeTerminalMenu();
    if (!onAnnotate) return;
    const ask = typeof window !== "undefined" && typeof window.prompt === "function"
      ? window.prompt
      : (typeof globalThis !== "undefined" && typeof globalThis.prompt === "function"
        ? globalThis.prompt
        : null);
    if (!ask) return;
    const next = ask(`Annotation for ${name}`, currentAnnotation);
    if (next !== null && next !== undefined) onAnnotate(term.id, next);
  });

  const items = [annotateBtn];
  if (currentAnnotation) {
    const removeAnnotationBtn = el("button", {
      class: "hg-context-menu__item",
      attrs: { type: "button", role: "menuitem" },
    }, menuIcon(FA_REMOVE_ANNOTATION_PATH), el("span", { text: "Remove annotation" }));
    removeAnnotationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTerminalMenu();
      if (onAnnotate) onAnnotate(term.id, "");
    });
    items.push(removeAnnotationBtn);
  }

  const deleteBtn = el("button", {
    class: "hg-context-menu__item hg-context-menu__item--danger",
    attrs: { type: "button", role: "menuitem" },
  }, menuIcon(FA_TRASH_PATH), el("span", { text: "Delete" }));
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeTerminalMenu();
    if (onDismiss) onDismiss(term.id);
  });
  items.push(deleteBtn);

  const menu = el(
    "div",
    { class: "hg-context-menu", attrs: { role: "menu", "aria-label": `Actions for ${name}` } },
    ...items
  );
  const usePopover = typeof menu.showPopover === "function";
  if (usePopover) menu.setAttribute("popover", "manual");
  host.append(menu);
  menuPosition(menu, point && point.x, point && point.y);
  if (usePopover) {
    try {
      menu.showPopover();
      // The top layer uses viewport positioning; re-apply after promotion so the
      // menu stays anchored to the context-click point rather than UA defaults.
      menuPosition(menu, point && point.x, point && point.y);
    } catch {
      if (menu.removeAttribute) menu.removeAttribute("popover");
    }
  }
  activeTerminalMenu = menu;

  const onPointerDown = (e) => {
    if (menu.contains && menu.contains(e.target)) return;
    closeTerminalMenu();
  };
  const onKeyDown = (e) => {
    if (e.key === "Escape") closeTerminalMenu();
  };
  if (document.addEventListener) {
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    activeTerminalMenuCleanup = () => {
      if (document.removeEventListener) {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      }
    };
  }
  if (annotateBtn.focus) annotateBtn.focus();
}

// the NEEDS YOU / ▚ VIEWING / IDLE micro-label. Bare colored text (not a chip) —
// faithful to the mockup; ae-tag would impose a chip background. needs-you wins
// over viewing (a stuck lane you happen to be on still shouts), then viewing, then
// idle; an active running lane carries no label.
function lanePill(term, needsYou, quiet) {
  if (needsYou) {
    return el("span", { class: "hg-trow__pill hg-trow__pill--attn", text: "NEEDS YOU" });
  }
  if (term.focused) {
    return el(
      "span",
      { class: "hg-trow__pill hg-trow__pill--view" },
      el("span", { attrs: { "aria-hidden": "true" } }, "▚ "),
      "VIEWING"
    );
  }
  if (quiet) {
    return el("span", { class: "hg-trow__pill hg-trow__pill--idle", text: "IDLE" });
  }
  return null;
}

/**
 * One fleet-switcher lane: status dot · provider glyph · project · task summary ·
 * pill · age. Clickable + keyboard-operable; the focused lane
 * gets a full-fill raised surface (no edge bar). The × close-out rides alongside
 * as a SIBLING of the role="button" row (never nested — nested interactives break
 * assistive tech), revealed on hover/focus.
 */
function renderTerminalRow(term, { onFocus, onDismiss, onAnnotate } = {}) {
  const prov = providerOf(term.provider);
  const needsYou = isNeedsYou(term);
  const quiet = term.status === "stale" || term.status === "parked" || term.status === "done";

  // Identity = the PROJECT (what the lane is, in human terms). The internal term-N
  // (a hash of the session id) is never shown — it carries no meaning for the reader
  // and is kept only as the DOM/focus/dismiss key (data-terminal). When the project
  // can't be resolved (e.g. a codex lane with no cwd → project falls back to a
  // session-id fragment that equals the id), show the provider name instead of a
  // meaningless hash; the story summary below still says what it's doing.
  const hasProject = term.project && term.project !== term.id;
  const name = hasProject ? term.project : prov.label || "session";
  const taskText = (term.story && term.story.title) || "—";
  const toneKey = freshToneKey(term);
  const annotation = oneLine(term.annotation);
  const main = el(
    "span",
    { class: "hg-trow__main" },
    el(
      "span",
      { class: "hg-trow__line" },
      el("span", { class: "hg-trow__name", text: name }),
      el("span", { class: "hg-trow__task", text: taskText })
    ),
    annotation
      ? el(
        "span",
        { class: "hg-trow__annotation", title: annotation },
        svgIcon(FA_FEATHER_PATH, "hg-trow__annotation-icon"),
        el("span", { class: "hg-trow__annotation-text", text: annotation })
      )
      : null
  );

  const row = el(
    "div",
    {
      class:
        "hg-trow" +
        (term.focused ? " hg-trow--selected" : "") +
        (quiet ? " hg-trow--quiet" : "") +
        (needsYou ? " hg-trow--attn" : "") +
        (annotation ? " hg-trow--annotated" : ""),
      title: `${name} · ${taskText}` + (annotation ? ` · ${annotation}` : ""),
      attrs: {
        role: "button",
        tabindex: "0",
        "aria-pressed": term.focused ? "true" : "false",
        "aria-label": `Focus ${name}` + (needsYou ? " — needs you" : ""),
        "data-terminal": term.id,
      },
    },
    el(
      "span",
      { class: "hg-trow__dot" },
      el("span", {
        class: "hg-statusdot " + (STATUS_DOT[term.status] || "hg-statusdot--stale"),
        attrs: { "aria-hidden": "true" },
      })
    ),
    el(
      "span",
      {
        class: "hg-provider " + prov.cls,
        title: prov.label,
        attrs: { "aria-hidden": "true" },
      },
      // the brand mark (Fireside SVG, masked + tinted in markers.css); an empty child whose
      // shape comes entirely from CSS, so the renderer stays createElement-only (no SVG DOM,
      // no innerHTML — CSP-safe and DOM-stub-test-safe).
      el("span", { class: "hg-provider__icon" })
    ),
    main,
    lanePill(term, needsYou, quiet),
    el("span", { class: "hg-trow__age hg-card__fresh--" + toneKey, text: term.freshnessLabel || "" })
  );

  const activate = () => onFocus && onFocus(term.id);
  row.addEventListener("click", activate);
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });
  row.addEventListener("contextmenu", (e) => {
    if (!onAnnotate && !onDismiss) return;
    e.preventDefault();
    e.stopPropagation();
    showTerminalMenu(term, name, { x: e.clientX || 0, y: e.clientY || 0 }, { onAnnotate, onDismiss });
  });

  // Close-out (×) — a SIBLING of the row, never nested inside the role="button".
  // Hidden until hover/focus; danger on hover. Dismissing hides the lane until it
  // does new work.
  const closeBtn = el("button", {
    class: "hg-trow__close",
    attrs: {
      type: "button",
      "aria-label": `Close out ${name}`,
      title: "Close out — hides this lane until it does new work",
    },
    text: "×",
  });
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onDismiss) onDismiss(term.id);
  });

  return el("div", { class: "hg-trow-wrap", attrs: { role: "listitem" } }, row, closeBtn);
}

// The cold (no-live-lanes) placeholder. Two very different situations land here and
// they must NOT read the same:
//   • the ledger we're reading is EMPTY or MISSING — almost always a misconfiguration
//     (the board is pointed at the wrong folder while capture writes elsewhere; the
//     exact "double-clicked the exe → read the empty default → nothing rendered" bug).
//     Name the dir and offer a one-click "Change ledger…" so it's self-fixing, not a
//     silent blank.
//   • the ledger HAS data, there's just nothing live right now — the legitimate "your
//     agents are quiet" case. Stay calm; no alarm, no action.
// `ledger` is the /api/state ledger block ({dir, exists, sessions, hasData, source});
// undefined on an old payload / transient cold shell → treat as the calm case.
function renderColdState(ledger, onChangeLedger) {
  const known = ledger && typeof ledger === "object";
  const misconfigured = known && !ledger.hasData; // empty OR missing dir
  if (!misconfigured) {
    return el(
      "ae-empty-state",
      { attrs: { compact: true } },
      el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph" }, "▚"),
      el("span", { attrs: { slot: "title" } }, "No live terminals"),
      "Start an agent and it appears here within a few seconds."
    );
  }
  const missing = !ledger.exists;
  const detail = el(
    "span",
    { class: "hg-empty__detail" },
    document.createTextNode(missing ? "Configured to read " : "Reading "),
    el("code", { class: "hg-empty__dir", text: ledger.dir || "(unknown)" }),
    document.createTextNode(
      missing
        ? " — that folder doesn't exist. Capture is likely writing to a different one."
        : " — no sessions here yet. If your agents are running, capture is writing to a different folder."
    )
  );
  const children = [
    el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph" }, "▚"),
    el("span", { attrs: { slot: "title" } }, missing ? "Ledger folder not found" : "This ledger is empty"),
    detail,
  ];
  if (onChangeLedger) {
    children.push(
      el(
        "span",
        { attrs: { slot: "actions" } },
        el(
          "ae-button",
          { attrs: { variant: "primary", size: "sm" }, on: { click: () => onChangeLedger() } },
          "Change ledger…"
        )
      )
    );
  }
  return el("ae-empty-state", { attrs: { compact: true } }, ...children);
}

/**
 * Draw (or redraw) the fleet switcher: a "terminals · N need you · M running" +
 * clock header over a height-capped, scrollable, needs-you-first list of lanes.
 * The cap (CSS) keeps a high lane count from ever swallowing the transcript below.
 * opts.time is the board clock (HH:MM) the controller derives from generatedAt.
 * opts.ledger / opts.onChangeLedger drive the cold-state diagnostic (see renderColdState).
 */
// the first child of `parent` whose class list includes `cls`, else null. Portable
// across the real DOM and the headless test stub (both expose `className`).
function childByClass(parent, cls) {
  for (const c of parent.children || []) {
    const cn = c.className || (c.getAttribute && c.getAttribute("class")) || "";
    if (typeof cn === "string" && cn.split(/\s+/).indexOf(cls) !== -1) return c;
  }
  return null;
}

function buildTriageHead(needs, running, time) {
  const head = el("div", { class: "hg-terms__head" },
    el("span", { class: "hg-terms__label", text: "terminals" }));
  if (needs) head.append(el("span", { class: "hg-terms__stat hg-terms__stat--attn", text: `· ${needs} need you` }));
  if (running) head.append(el("span", { class: "hg-terms__stat hg-terms__stat--run", text: `· ${running} running` }));
  if (time) head.append(el("span", { class: "hg-terms__time", text: time }));
  return head;
}

// A per-lane content signature. The row is a pure function of its `term` (the opts
// callbacks are stable across polls), so JSON of the term is a COMPLETE validator —
// any field the row paints changing flips it, and nothing else does. Used to decide
// whether to reuse a lane's existing DOM node or rebuild just that one.
function triageRowSig(t) {
  try { return JSON.stringify(t); } catch { return String(t && t.id); }
}

/**
 * Draw the fleet switcher via a KEYED RECONCILE rather than a clear()+rebuild. The
 * old path recreated every lane node (and its listeners) on every poll, which also
 * reset the lane list's scroll position and any hover state. Now: the header updates
 * in place, an UNCHANGED lane keeps its exact DOM node (and listeners), only a lane
 * whose content changed is rebuilt, and adds/removes/reorders touch just those lanes.
 * The body element itself persists, so the reader's scroll position survives.
 */
export function renderTriage(mountEl, terminals, opts = {}) {
  const list = Array.isArray(terminals) ? terminals : [];
  const needs = list.filter(isNeedsYou).length;
  const running = list.filter((t) => t.status === "active" && !isNeedsYou(t)).length;
  const headSig = `${needs}|${running}|${opts.time || ""}`;

  // ---- header: reuse if unchanged, else swap in place (never disturbs the body) ----
  let head = childByClass(mountEl, "hg-terms__head");
  if (!head) {
    head = buildTriageHead(needs, running, opts.time);
    head.setAttribute("data-sig", headSig);
    mountEl.append(head); // first build on an empty mount → head lands first
  } else if (head.getAttribute("data-sig") !== headSig) {
    const fresh = buildTriageHead(needs, running, opts.time);
    fresh.setAttribute("data-sig", headSig);
    mountEl.insertBefore(fresh, head);
    mountEl.removeChild(head);
    head = fresh;
  }

  // ---- cold / no lanes: drop the body, show the calm/diagnostic empty state ----
  if (list.length === 0) {
    const body = childByClass(mountEl, "hg-terms__scroll");
    if (body) mountEl.removeChild(body);
    // rebuild the cold state only if it isn't already present (rare transition; the
    // empty board's polls 304 so this doesn't run on a loop).
    const hasCold = (mountEl.children || []).some((c) => c.tagName === "AE-EMPTY-STATE");
    if (!hasCold) mountEl.append(renderColdState(opts.ledger, opts.onChangeLedger));
    return;
  }

  // leaving cold → live: clear any lingering empty-state before the lane list.
  for (const c of Array.from(mountEl.children || [])) {
    if (c.tagName === "AE-EMPTY-STATE") mountEl.removeChild(c);
  }

  // ---- body: a height-capped scroll of lanes in the backend's STABLE creation order
  // (oldest first). We deliberately do NOT float needs-you lanes up — a positional
  // reshuffle reads as churn; attention is shown by the dot, the NEEDS YOU pill, and
  // the header count, never by moving a lane. The list persists across renders. ----
  let body = childByClass(mountEl, "hg-terms__scroll");
  if (!body) {
    body = el("div", {
      class: "hg-terms__scroll hg-scroll",
      attrs: { role: "list" },
    });
    mountEl.append(body);
  }
  body.setAttribute("aria-label", `${list.length} terminal${list.length === 1 ? "" : "s"}`);
  reconcileLaneRows(body, list, opts);
}

// Generic keyed reconcile: bring `parent`'s children into line with `desired` (a list
// of {key, sig, build}). A child whose (key, sig) is unchanged keeps its exact DOM
// node — and its listeners + hover/focus/scroll state; only a changed or new one is
// built (via `build`); the rest are moved/removed to match `desired` order. Nodes are
// tagged data-rk (key) + data-rs (sig) so the NEXT call can find and diff them. The
// first build (empty parent) takes an append-only path, so the headless single-render
// tests never touch insertBefore. Shared by the fleet list (V8) and the focus
// transcript (V11).
function reconcileKeyed(parent, desired) {
  const existing = new Map();
  for (const node of Array.from(parent.children || [])) {
    const k = node.getAttribute && node.getAttribute("data-rk");
    if (k != null) existing.set(k, node);
  }
  const out = [];
  for (const spec of desired) {
    const old = existing.get(spec.key);
    if (old && old.getAttribute("data-rs") === spec.sig) {
      existing.delete(spec.key); // reuse — mark as kept
      out.push(old);
    } else {
      const fresh = spec.build();
      fresh.setAttribute("data-rk", spec.key);
      fresh.setAttribute("data-rs", spec.sig);
      out.push(fresh); // a changed node's stale predecessor stays in `existing` → removed below
    }
  }
  // drop children no longer present + the stale nodes of rebuilt entries
  for (const node of existing.values()) {
    if (node.parentNode === parent) parent.removeChild(node);
  }
  // place `out` in order: already-correct nodes are left alone; the rest are appended
  // (first build / new tail) or moved into position (reorder/insert).
  for (let i = 0; i < out.length; i++) {
    const want = out[i];
    const have = (parent.children || [])[i];
    if (have === want) continue;
    if (have == null) parent.append(want);
    else parent.insertBefore(want, have);
  }
}

// Keyed reconcile of the lane rows into `body` (keyed by terminal id). Reuses an
// unchanged lane's node (and its listeners); rebuilds only a changed lane.
function reconcileLaneRows(body, list, opts) {
  reconcileKeyed(body, list.map((t) => ({
    key: t.id, sig: triageRowSig(t), build: () => renderTerminalRow(t, opts),
  })));
}

// ==========================================================================
// ORIENTATION HEADER — the pinned "where am I" block (selected terminal)
// ==========================================================================

/** parked-epic crumb (UX §4.1) — typed epic seam, one muted line above the header. */
function renderSeam(seam) {
  if (!seam) return null;
  const outcomeCls =
    seam.outcome === "passed"
      ? "hg-seam__outcome--passed"
      : seam.outcome === "handed-off"
        ? "hg-seam__outcome--handed-off"
        : "hg-seam__outcome--parked";

  const kindLabel =
    seam.kind === "clear"
      ? "⌇ /clear seam"
      : seam.kind === "compaction"
        ? "⌇ compaction"
        : "⇄ workstream switch";

  const row = el(
    "div",
    { class: "hg-seam" },
    el("span", { class: "hg-seam__arrow", attrs: { "aria-hidden": "true" } }, "↑"),
    el(
      "span",
      { class: "hg-seam__label" },
      "parked epic: " + seam.label + (seam.project ? " · " + seam.project : "")
    )
  );
  if (seam.outcome) {
    row.append(el("span", { class: outcomeCls }, seam.outcome));
  }
  row.append(
    el("span", { class: "hg-seam__sep" }, "|"),
    el("span", { class: "hg-seam__kind" }, kindLabel)
  );
  const at = clock(seam.at);
  if (at) row.append(el("span", { class: "hg-seam__sep" }, "·"), el("span", {}, at));
  return row;
}

/**
 * The segmented roadmap bar (one segment per linked story, in link order). Built
 * from focus.stories so each segment carries the story's title + state as a hover
 * tooltip — this preserves the per-story detail the flat transcript layout drops
 * from the body (the old design listed every story; here the bar IS the roadmap).
 */
function renderOrientBar(stories) {
  const bar = el("div", { class: "hg-orient__bar", attrs: { role: "img", "aria-label": "story roadmap" } });
  for (const s of stories) {
    const state = s.state || "not-started";
    bar.append(
      el("span", {
        class: "hg-roadmap__seg hg-roadmap__seg--" + state,
        title: (s.title || "untitled story") + " — " + state,
      })
    );
  }
  return bar;
}

/**
 * The pinned orientation header for the focused lane: "working toward" epic +
 * "N / M stories" · the big active-story title · a live "now —" line · the
 * segmented roadmap bar. Degrades cleanly when the lane is standalone (no epic):
 * a faint "standalone · no epic" eyebrow and no progress count/bar.
 */
function renderOrient(focus) {
  const a = focus.activeStory || {};
  const wrap = el("div", { class: "hg-orient" });

  // parked-epic crumb (typed seam), restored above the header.
  const seam = renderSeam(focus.parkedEpicSeam);
  if (seam) wrap.append(seam);

  if (focus.epic) {
    wrap.append(el("div", { class: "hg-orient__label", text: "working toward" }));
    const epicLine = el(
      "div",
      { class: "hg-orient__epic" },
      el("span", { class: "hg-orient__epic-mark", attrs: { "aria-hidden": "true" }, text: "▚" }),
      el("span", {
        class: "hg-orient__epic-title",
        text: focus.epic.title || "—",
        title: focus.epic.title || "",
      }),
      el(
        "span",
        { class: "hg-orient__epic-count" },
        el("span", { class: "hg-orient__epic-done", text: String(focus.epic.done) }),
        ` / ${focus.epic.total} stories`
      )
    );
    wrap.append(epicLine);
  } else {
    wrap.append(
      el("div", { class: "hg-orient__label hg-orient__label--standalone", text: "standalone · no epic" })
    );
  }

  // the big active-story title (the hero line).
  wrap.append(el("div", { class: "hg-orient__story", text: a.title || "—" }));

  // the live "now —" line: a pulsing green dot + the live edge when working; a
  // calm muted dot + the last thing done when idle. nowLine is backend-derived.
  const now = a.nowLine || { text: "", working: !!focus.workingNow };
  const nowRow = el(
    "div",
    { class: "hg-orient__now" + (now.working ? " hg-orient__now--working" : "") },
    el("span", { class: "hg-orient__now-dot", attrs: { "aria-hidden": "true" } }),
    el(
      "span",
      { class: "hg-orient__now-text" },
      el("span", { class: "hg-orient__now-label", text: (now.working ? "now" : "idle") + " — " }),
      now.text || (now.working ? "working…" : "paused")
    )
  );
  wrap.append(nowRow);

  // segmented roadmap bar — only when an epic owns this story (the bar represents
  // the epic's stories). Standalone lanes show no bar.
  if (focus.epic && Array.isArray(focus.stories) && focus.stories.length) {
    wrap.append(renderOrientBar(focus.stories));
  }

  return wrap;
}

// ==========================================================================
// TRANSCRIPT TRAIL — the chronological feed of typed entries
// ==========================================================================

// The quiet integrity glyph in an entry's gutter. Surfaced only when it carries
// signal (reconstructed/volunteered/human-confirmed); a routine "passive" record
// shows none, keeping the trail calm. The glyph names its meaning ONCE for AT via
// role="img" + aria-label; sighted hover gets a native title (no double-announce).
function entryIntegrity(integrity) {
  if (!integrity || integrity === "passive") return null;
  const intg = integrityOf(integrity);
  return el("span", {
    class: "hg-entry__intg hg-integrity " + intg.cls,
    title: "integrity: " + intg.label,
    attrs: { role: "img", "aria-label": "integrity: " + intg.label },
    text: intg.glyph,
  });
}

// the left gutter: the timestamp on top, then a single marks row carrying the type
// glyph + the quiet integrity glyph side-by-side (NOT stacked). `warn` tints the
// time amber (a reversal's time reads with the stitch).
function entryGutter(task, glyph, glyphCls, { warn = false } = {}) {
  return el(
    "div",
    { class: "hg-entry__gutter" },
    el("span", { class: "hg-entry__time" + (warn ? " hg-entry__time--warn" : ""), text: clock(task.at) }),
    el(
      "div",
      { class: "hg-entry__marks" },
      el("span", {
        class: "hg-entry__glyph hg-entry__glyph--" + glyphCls,
        title: glyphCls,
        attrs: { "aria-hidden": "true" },
        text: glyph,
      }),
      entryIntegrity(task.integrity)
    )
  );
}

// the body: a bold title + an optional reasoning line (the decision's rationale,
// "" for steps/pending) + the completed-turn tool accordion when present.
function entryBody(task, { titleCls = "" } = {}) {
  const body = el(
    "div",
    { class: "hg-entry__body" },
    el("div", { class: "hg-entry__title" + (titleCls ? " " + titleCls : ""), text: task.summary || "" })
  );
  if (task.detail) {
    body.append(el("div", { class: "hg-entry__detail", text: task.detail }));
  }
  const acc = toolAccordion(task);
  if (acc) body.append(acc);
  return body;
}

// a generic typed entry (decision ◆ / step · / milestone ○).
function entryTyped(task, cls, glyph) {
  return el(
    "div",
    { class: "hg-entry hg-entry--" + cls },
    entryGutter(task, glyph, cls),
    entryBody(task)
  );
}

// the reversal "stitch": an amber ↺, a "reversed · overturns HH:MM · reversible:X"
// tag, then the surviving successor (= task.summary) + its rationale. The struck
// superseded line is preserved as the title's hover tooltip.
function entryReversal(task) {
  const rev = task.reversal || {};
  const body = el("div", { class: "hg-entry__body" });

  const tag = el(
    "div",
    { class: "hg-entry__revtag" },
    el("span", { class: "hg-entry__revtag-label", text: "reversed" })
  );
  const metaParts = [];
  const overturns = clock(rev.supersededAt);
  if (overturns) metaParts.push("overturns " + overturns);
  if (rev.reversibility) metaParts.push("reversible: " + rev.reversibility);
  if (metaParts.length) {
    tag.append(el("span", { class: "hg-entry__revtag-meta", text: metaParts.join(" · ") }));
  }
  body.append(tag);

  body.append(
    el("div", {
      class: "hg-entry__title hg-entry__title--rev",
      text: task.summary || "",
      title: rev.supersededSummary ? "overturns: " + rev.supersededSummary : null,
    })
  );
  if (task.detail) body.append(el("div", { class: "hg-entry__detail", text: task.detail }));
  const acc = toolAccordion(task);
  if (acc) body.append(acc);

  return el(
    "div",
    { class: "hg-entry hg-entry--reversal" },
    entryGutter(task, "↺", "reversal", { warn: true }),
    body
  );
}

// the highlighted NOW card — the live edge. A 'live' bloom carries the checkpoint
// summary (+ its rationale); an 'activity' tip carries "tool · target". Pulsing
// green NOW label + dot. When the live edge is a TOOL action (kind === "activity"),
// it is a child of the task above and indents under it (hg-entry--child) so the
// live tool tip lines up with the rest of the tool stream, not the task spine; a
// 'live' checkpoint bloom is a task-level entry and stays at the root indent.
function entryNow(task) {
  let title;
  const isTool = task.kind === "activity";
  if (isTool) {
    const tool = task.tool || "tool";
    title = task.summary ? `${tool} · ${task.summary}` : tool;
  } else {
    title = task.summary || "";
  }
  // the live edge needs no "NOW" word — the glowing green dot alone signals it. The
  // dot keeps an accessible name (the label's old job) so AT still announces "live".
  const gutter = el(
    "div",
    { class: "hg-entry__gutter hg-entry__gutter--now" },
    el("span", {
      class: "hg-entry__nowdot hg-pulse",
      attrs: { role: "img", "aria-label": "live" },
    })
  );
  const body = el(
    "div",
    { class: "hg-entry__body" },
    el("div", { class: "hg-entry__title hg-entry__title--now", text: title })
  );
  if (task.detail) body.append(el("div", { class: "hg-entry__detail", text: task.detail }));
  return el("div", { class: "hg-entry hg-entry--now" + (isTool ? " hg-entry--child" : "") }, gutter, body);
}

// an earlier in-flight tool node (not the live edge) — faint telemetry threading
// the trail: a small tool glyph + a muted "tool · target" line.
function entryActivity(task) {
  const tool = task.tool || "tool";
  // tool-call gutter: the timestamp and the type glyph ride ONE line (not stacked),
  // in a column held wide enough that they never wrap (see .hg-entry__gutter--inline).
  const gutter = el(
    "div",
    { class: "hg-entry__gutter hg-entry__gutter--inline" },
    el("span", { class: "hg-entry__time", text: clock(task.at) }),
    el("span", {
      class: "hg-entry__glyph hg-entry__glyph--activity",
      attrs: { "aria-hidden": "true" },
      text: toolGlyph(tool),
    })
  );
  const line = el(
    "div",
    { class: "hg-entry__activity" },
    el("span", { class: "hg-entry__activity-tool", text: tool })
  );
  if (task.summary) line.append(el("span", { class: "hg-entry__activity-target", text: task.summary }));
  const body = el("div", { class: "hg-entry__body" }, line);
  // the agent's first-party one-liner for this action (the tool's `description`),
  // a faint second line beneath the telemetry — "" renders nothing.
  if (task.detail) body.append(el("div", { class: "hg-entry__activity-desc", text: task.detail }));
  // a tool node is a CHILD of the task above it: hg-entry--child indents it and
  // draws the connector rail so it reads as subordinate, not a sibling task.
  return el("div", { class: "hg-entry hg-entry--activity hg-entry--child" }, gutter, body);
}

// a declared-intent entry — the agent's first-party "what I'm doing and why", stated
// live as it picks up a task (▸). Renders like a typed entry (bold title + the why as
// the second line); its 'volunteered' integrity glyph (◈) marks it as the agent's own
// words, distinct from a reconstructed decision (◇).
function entryIntent(task) {
  return el(
    "div",
    { class: "hg-entry hg-entry--intent" },
    entryGutter(task, "▸", "intent"),
    entryBody(task)
  );
}

// the ghosted next item — dashed ○ + "next" label. The text is the agent's OWN declared
// next task (`▸ next:`) or planned next (TodoWrite), shown as first-party (volunteered ◈);
// only when neither was stated does it fall back to the reconstructed next_action GUESS
// (◇, read more tentatively). A declaration a later checkpoint overtook reads "may be
// done". Surfacing provenance is the point: a guess must never look as authoritative as
// the agent's own word. `source`/`stale` are backend-derived; undefined on an old payload
// degrades to the reconstructed look.
function entryPending(task) {
  const source = task.source || "reconstructed";
  const firstParty = source === "declared" || source === "todo";
  const stale = !!task.stale;
  const gutter = el(
    "div",
    { class: "hg-entry__gutter" },
    el("span", { class: "hg-entry__nextlabel", text: "next" }),
    el("span", { class: "hg-entry__glyph hg-entry__glyph--pending", attrs: { "aria-hidden": "true" }, text: "○" })
  );
  const body = entryBody(task, { titleCls: "hg-entry__title--next" });
  // a quiet provenance row: the integrity glyph (◈ volunteered / ◇ reconstructed, the same
  // vocabulary the rest of the trail uses) + a one-word source, so the reader can weight it.
  const sourceLabel = source === "declared" ? "declared" : source === "todo" ? "from plan" : "guess";
  const prov = el(
    "div",
    { class: "hg-entry__nextprov" },
    entryIntegrity(firstParty ? "volunteered" : "reconstructed"),
    el("span", { class: "hg-entry__nextsource", text: sourceLabel })
  );
  if (stale) {
    prov.append(el("span", { class: "hg-entry__nextstale", text: "· may be done" }));
  }
  body.append(prov);
  return el(
    "div",
    {
      class:
        "hg-entry hg-entry--next" +
        (firstParty ? " hg-entry--next-declared" : " hg-entry--next-guess") +
        (stale ? " hg-entry--next-stale" : ""),
    },
    gutter,
    body
  );
}

// route a wire task to its entry builder.
function renderEntry(task) {
  switch (task.kind) {
    case "supersedes":
      return entryReversal(task);
    case "live":
      return entryNow(task);
    case "activity":
      return task.now ? entryNow(task) : entryActivity(task);
    case "pending":
      return entryPending(task);
    case "intent":
      return entryIntent(task);
    case "decision":
      return entryTyped(task, "decision", "◆");
    case "milestone":
      return entryTyped(task, "milestone", "○");
    case "step":
      return entryTyped(task, "step", "·");
    default:
      return entryTyped(task, "step", "·");
  }
}

// The OPEN turn's live tool run, rendered as an explicit OWNED group: a pulsing "in progress"
// header with the in-flight tool calls (and the NOW tip) nested beneath it under a single
// connector rail. This is what gives an open task a visible owner — tool calls only bind to a
// task at task COMPLETION (they fold into that checkpoint's accordion), so before the turn's
// checkpoint lands its in-flight tools would otherwise float at the trail tail at the same
// level as completed decisions, leaving it ambiguous which task owns them. `run` is the
// trailing activity nodes, oldest → live tip.
function renderLiveGroup(run) {
  const head = el(
    "div",
    { class: "hg-livegroup__head" },
    el("span", { class: "hg-livegroup__dot hg-pulse", attrs: { "aria-hidden": "true" } }),
    el("span", { class: "hg-livegroup__label", text: "in progress" })
  );
  const body = el("div", { class: "hg-livegroup__body" });
  for (const t of run) body.append(renderEntry(t));
  return el(
    "div",
    { class: "hg-livegroup", attrs: { role: "group", "aria-label": "current turn — in progress" } },
    head,
    body
  );
}

// ---- focus assembly ------------------------------------------------------

// The scrollable element inside an <ae-scroll-area> is its part="viewport"
// (in shadow DOM). Returns null if the shadow root isn't ready yet (skip).
function scrollViewportOf(scrollEl) {
  if (!scrollEl || !scrollEl.shadowRoot) return null;
  return scrollEl.shadowRoot.querySelector('[part~="viewport"]');
}

// Handle to cancel an in-flight scroll-settle loop when the focus pane is
// rebuilt by the next render (each render replaces the scroll element).
let cancelScroll = null;

/**
 * Drive the transcript's scroll position and HOLD it across the async layout
 * window. `intent` is either "bottom" (pin to the newest tip and keep re-pinning
 * as geometry settles) or a number (restore that scrollTop — the reader's prior
 * position when they'd scrolled up).
 *
 * Robust to the <ae-scroll-area> viewport not existing synchronously: Lit
 * renders the shadow viewport a microtask AFTER we append it, so on a fresh
 * render it isn't queryable on the first call — we poll a few frames for it,
 * then install a ResizeObserver that re-applies the intent on every geometry
 * change (the trail grows as nodes settle) until a bounded window closes or the
 * reader grabs the scroll. This is what stops the trail landing short of the tip.
 */
function applyScroll(scroll, rail, intent) {
  if (cancelScroll) cancelScroll();
  const toBottom = intent === "bottom";

  let done = false;
  let ro = null;
  let timer = 0;
  let vpRef = null;
  let tries = 0;

  const set = () => {
    const vp = scrollViewportOf(scroll);
    if (vp) {
      vp.scrollTop = toBottom ? vp.scrollHeight : intent;
    } else if (toBottom) {
      const last = rail.lastElementChild;
      if (last && last.scrollIntoView) last.scrollIntoView({ block: "end" });
    }
  };

  const onUser = () => stop(); // reader grabbed the scroll → yield immediately
  function stop() {
    if (done) return;
    done = true;
    if (ro) ro.disconnect();
    if (timer) clearTimeout(timer);
    if (vpRef) {
      vpRef.removeEventListener("wheel", onUser);
      vpRef.removeEventListener("touchmove", onUser);
      vpRef.removeEventListener("pointerdown", onUser);
    }
    if (cancelScroll === stop) cancelScroll = null;
  }
  cancelScroll = stop;

  // Arm: apply best-effort each frame until the viewport exists, then attach the
  // ResizeObserver settle loop that re-applies the intent as geometry moves.
  const arm = () => {
    if (done) return;
    set();
    const vp = scrollViewportOf(scroll);
    if (vp && typeof ResizeObserver === "function") {
      vpRef = vp;
      ro = new ResizeObserver(() => {
        if (!done) set();
      });
      ro.observe(vp); // viewport clientHeight (pinned band upgrading)
      ro.observe(rail); // content/scrollHeight (late node layout)
      vp.addEventListener("wheel", onUser, { passive: true });
      vp.addEventListener("touchmove", onUser, { passive: true });
      vp.addEventListener("pointerdown", onUser);
      // bounded settle window — long enough for the trail to finish laying out,
      // short enough to release control quickly.
      timer = setTimeout(stop, 1400);
      set();
      return;
    }
    if (tries++ < 30) {
      requestAnimationFrame(arm);
    } else {
      // viewport never resolved (no shadow / no ResizeObserver) — final best-effort.
      requestAnimationFrame(() => {
        set();
        stop();
      });
    }
  };

  set(); // immediate
  arm();
}

/**
 * Render the focus column: a pinned ORIENTATION HEADER + a scrolling TRANSCRIPT
 * TRAIL. The header (epic + story + now line + roadmap bar) never leaves view; the
 * transcript of typed entries scrolls beneath it.
 *
 * mountEl is rebuilt each render:
 *   .hg-focus__pinned  — orientation header
 *   .hg-focus__scroll  — ae-scroll-area hosting the transcript
 *
 * opts: { changed, fresh } drive the auto-scroll policy:
 *   • fresh (terminal switch) / first render → land at the newest tip to orient
 *   • changed + reader parked at bottom        → follow to the newest tip
 *   • changed + reader scrolled up             → keep their position
 *   • unchanged (idle)                          → caller skips the rebuild entirely
 */
// Header signature: every field renderOrient paints EXCEPT activeStory.tasks (those
// drive the transcript, not the header). Lets the reconcile rebuild the pinned header
// only when its content actually changed — so the live-edge pulse on the now-dot is
// NOT restarted on every poll that merely grows the trail.
function focusHeaderSig(focus) {
  try {
    const a = focus.activeStory || {};
    return JSON.stringify({
      seam: focus.parkedEpicSeam, epic: focus.epic, stories: focus.stories,
      workingNow: focus.workingNow,
      a: { id: a.id, title: a.title, indexLabel: a.indexLabel, startedAt: a.startedAt, nowLine: a.nowLine },
    });
  } catch {
    return "x";
  }
}

// The ordered transcript children as reconcile specs, using the SAME head / live-run /
// pending split the full build uses: head entries, then (while working) the in-flight
// tool run as one owned "live group", then the trailing pending "next". Each entry is
// keyed by its task id; the live group is one keyed unit (rebuilt wholesale when its
// run changes — it's small and a change means new tools).
function transcriptChildSpecs(focus, tasks) {
  const head = tasks.slice();
  const pendingTail = [];
  while (head.length && head[head.length - 1].kind === "pending") pendingTail.unshift(head.pop());
  const liveRun = [];
  if (focus.workingNow) {
    while (head.length && head[head.length - 1].kind === "activity") liveRun.unshift(head.pop());
  }
  const specs = [];
  for (const t of head) specs.push({ key: "e:" + t.id, sig: JSON.stringify(t), build: () => renderEntry(t) });
  if (liveRun.length) {
    specs.push({ key: "__livegroup", sig: JSON.stringify(liveRun), build: () => renderLiveGroup(liveRun) });
  }
  for (const t of pendingTail) specs.push({ key: "e:" + t.id, sig: JSON.stringify(t), build: () => renderEntry(t) });
  return specs;
}

export function renderFocus(mountEl, focus, opts = {}) {
  // Capture the prior scroll position BEFORE any change so the auto-scroll policy
  // can honor it.
  const existingScroll = mountEl.querySelector(".hg-focus__scroll");
  const prevVp = scrollViewportOf(existingScroll);
  let wasAtBottom = true; // first render / no prior scroller → land at the tip
  let prevTop = 0;
  if (prevVp && !opts.fresh) {
    prevTop = prevVp.scrollTop;
    wasAtBottom = prevVp.scrollHeight - prevVp.scrollTop - prevVp.clientHeight <= 10;
  }

  const tasks =
    focus && focus.activeStory && Array.isArray(focus.activeStory.tasks) ? focus.activeStory.tasks : [];

  // RECONCILE IN PLACE when this is a same-terminal update of a live trail with an
  // existing pane: keep the ae-scroll-area (so the shadow viewport + scroll geometry
  // survive), rebuild the header only if it changed, and keyed-reconcile the transcript
  // entries (reuse unchanged ones, rebuild only the changed tip / live group). The
  // scroll policy is then applied by the SAME applyScroll call as the full build, so
  // the hard-won auto-scroll behavior is byte-for-byte unchanged. Everything else
  // (fresh terminal switch, cold, live-but-empty, first render) takes the full rebuild.
  const canReconcile =
    !opts.fresh && !!focus && tasks.length > 0 && !!existingScroll &&
    !!mountEl.querySelector(".hg-transcript") && !!mountEl.querySelector(".hg-focus__pinned");

  if (canReconcile) {
    const pinned = mountEl.querySelector(".hg-focus__pinned");
    const osig = focusHeaderSig(focus);
    if (pinned.getAttribute("data-osig") !== osig) {
      clear(pinned);
      pinned.append(renderOrient(focus));
      pinned.setAttribute("data-osig", osig);
    }
    const transcript = mountEl.querySelector(".hg-transcript");
    reconcileKeyed(transcript, transcriptChildSpecs(focus, tasks));
    const follow = opts.fresh || (opts.changed && wasAtBottom);
    applyScroll(existingScroll, transcript, follow ? "bottom" : prevTop);
    return;
  }

  // A prior settle loop targets the about-to-be-detached scroll element — stop it
  // before we rebuild so it can't pin (or restore) the new pane out from under us.
  if (cancelScroll) cancelScroll();

  clear(mountEl);

  // COLD state — focus null (UX §10.6): a calm "pick a terminal" message.
  if (!focus) {
    mountEl.append(
      el(
        "div",
        { class: "hg-empty" },
        el(
          "ae-empty-state",
          {},
          el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph hg-empty__glyph--calm" }, "◇"),
          el("span", { attrs: { slot: "title" } }, "Nothing in focus"),
          "Pick a terminal above to re-load its thread, or all your agents are quiet."
        )
      )
    );
    return;
  }

  // pinned orientation header (tagged with its content sig so a later same-terminal
  // reconcile can tell whether it needs a rebuild).
  const pinned = el("div", { class: "hg-focus__pinned" });
  pinned.append(renderOrient(focus));
  pinned.setAttribute("data-osig", focusHeaderSig(focus));
  mountEl.append(pinned);

  // scrolling transcript — ae-scroll-area for design-system scrollbars + edge fades.
  const scroll = el("ae-scroll-area", {
    class: "hg-focus__scroll",
    attrs: { shadow: true, "max-height": "100%" },
  });
  const region = el("div", { class: "hg-transcript-region" });

  if (tasks.length === 0) {
    // live-but-empty — calm, not broken (UX §10.6).
    region.append(
      el(
        "div",
        { class: "hg-empty" },
        el(
          "ae-empty-state",
          { attrs: { compact: true } },
          el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph" }, "○"),
          el("span", { attrs: { slot: "title" } }, "No decisions yet"),
          "The agent just picked this up — its first decision will land here."
        )
      )
    );
    scroll.append(region);
    mountEl.append(scroll);
    return;
  }

  // The transcript children are built through the SAME keyed reconcile the in-place
  // update uses (here against an empty node, so it's a plain ordered build) — this is
  // what stamps the data-rk/data-rs keys so the next same-terminal poll can reuse these
  // exact nodes instead of recreating them. transcriptChildSpecs owns the head /
  // live-group / pending split: the OPEN turn's in-flight tool run renders as one owned
  // "in progress" group, a bloomed-`live` checkpoint stays a normal entry, and the
  // trailing pending "next" sorts last.
  const transcript = el("div", { class: "hg-transcript" });
  reconcileKeyed(transcript, transcriptChildSpecs(focus, tasks));
  region.append(transcript);
  scroll.append(region);
  mountEl.append(scroll);

  // Auto-scroll policy (UX §4 "auto-scroll to newest", bounded by user intent).
  const follow = opts.fresh || (opts.changed && wasAtBottom);
  applyScroll(scroll, transcript, follow ? "bottom" : prevTop);
}

// ==========================================================================
// TITLEBAR META — small derived strings for the chrome.
// ==========================================================================
export function titlebarMeta(state) {
  const terms = Array.isArray(state.terminals) ? state.terminals : [];
  const needs = terms.filter((t) => isNeedsYou(t)).length;
  let time = "";
  if (state.generatedAt) {
    const d = new Date(state.generatedAt);
    if (!Number.isNaN(d.getTime())) {
      time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
  }
  return { needs, count: terms.length, time };
}
