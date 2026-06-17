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

// ==========================================================================
// TERMINALS — the fleet switcher (top section)
// ==========================================================================

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
function renderTerminalRow(term, { onFocus, onDismiss } = {}) {
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

  const row = el(
    "div",
    {
      class:
        "hg-trow" +
        (term.focused ? " hg-trow--selected" : "") +
        (quiet ? " hg-trow--quiet" : "") +
        (needsYou ? " hg-trow--attn" : ""),
      title: `${name} · ${taskText}`,
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
    el("span", {
      class: "hg-provider " + prov.cls,
      title: prov.label,
      attrs: { "aria-hidden": "true" },
      text: prov.glyph,
    }),
    el("span", { class: "hg-trow__name", text: name }),
    el("span", { class: "hg-trow__task", text: taskText }),
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
export function renderTriage(mountEl, terminals, opts = {}) {
  clear(mountEl);
  const list = Array.isArray(terminals) ? terminals : [];

  const needs = list.filter(isNeedsYou).length;
  const running = list.filter((t) => t.status === "active" && !isNeedsYou(t)).length;

  const head = el(
    "div",
    { class: "hg-terms__head" },
    el("span", { class: "hg-terms__label", text: "terminals" })
  );
  if (needs) {
    head.append(el("span", { class: "hg-terms__stat hg-terms__stat--attn", text: `· ${needs} need you` }));
  }
  if (running) {
    head.append(el("span", { class: "hg-terms__stat hg-terms__stat--run", text: `· ${running} running` }));
  }
  if (opts.time) head.append(el("span", { class: "hg-terms__time", text: opts.time }));
  mountEl.append(head);

  if (list.length === 0) {
    // cold / no lanes — calm "agents are quiet", or an actionable diagnostic when the
    // ledger we're reading is empty/missing (the wrong-folder failure mode).
    mountEl.append(renderColdState(opts.ledger, opts.onChangeLedger));
    return;
  }

  // needs-you-first (stable within each group — preserves the backend's order).
  const needsRows = [];
  const rest = [];
  for (const t of list) (isNeedsYou(t) ? needsRows : rest).push(t);

  const body = el("div", {
    class: "hg-terms__scroll hg-scroll",
    attrs: { role: "list", "aria-label": `${list.length} terminal${list.length === 1 ? "" : "s"}` },
  });
  const add = (t) => body.append(renderTerminalRow(t, opts));
  needsRows.forEach(add);
  if (needsRows.length && rest.length) {
    body.append(el("div", { class: "hg-terms__divider", attrs: { "aria-hidden": "true" } }));
  }
  rest.forEach(add);
  mountEl.append(body);
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
// green NOW label + dot.
function entryNow(task) {
  let title;
  if (task.kind === "activity") {
    const tool = task.tool || "tool";
    title = task.summary ? `${tool} · ${task.summary}` : tool;
  } else {
    title = task.summary || "";
  }
  const gutter = el(
    "div",
    { class: "hg-entry__gutter" },
    el("span", { class: "hg-entry__nowlabel", text: "NOW" }),
    el("span", { class: "hg-entry__nowdot hg-pulse", attrs: { "aria-hidden": "true" } })
  );
  const body = el(
    "div",
    { class: "hg-entry__body" },
    el("div", { class: "hg-entry__title hg-entry__title--now", text: title })
  );
  if (task.detail) body.append(el("div", { class: "hg-entry__detail", text: task.detail }));
  return el("div", { class: "hg-entry hg-entry--now" }, gutter, body);
}

// an earlier in-flight tool node (not the live edge) — faint telemetry threading
// the trail: a small tool glyph + a muted "tool · target" line.
function entryActivity(task) {
  const tool = task.tool || "tool";
  const gutter = el(
    "div",
    { class: "hg-entry__gutter" },
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
  return el("div", { class: "hg-entry hg-entry--activity" }, gutter, body);
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

// the ghosted next item — the latest next_action, dashed ○ + "next" label.
function entryPending(task) {
  const gutter = el(
    "div",
    { class: "hg-entry__gutter" },
    el("span", { class: "hg-entry__nextlabel", text: "next" }),
    el("span", { class: "hg-entry__glyph hg-entry__glyph--pending", attrs: { "aria-hidden": "true" }, text: "○" })
  );
  return el(
    "div",
    { class: "hg-entry hg-entry--next" },
    gutter,
    entryBody(task, { titleCls: "hg-entry__title--next" })
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
export function renderFocus(mountEl, focus, opts = {}) {
  // Capture the prior scroll position BEFORE rebuilding so the auto-scroll policy
  // can honor it.
  const prevVp = scrollViewportOf(mountEl.querySelector(".hg-focus__scroll"));
  let wasAtBottom = true; // first render / no prior scroller → land at the tip
  let prevTop = 0;
  if (prevVp && !opts.fresh) {
    prevTop = prevVp.scrollTop;
    wasAtBottom = prevVp.scrollHeight - prevVp.scrollTop - prevVp.clientHeight <= 10;
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

  // pinned orientation header.
  const pinned = el("div", { class: "hg-focus__pinned" });
  pinned.append(renderOrient(focus));
  mountEl.append(pinned);

  // scrolling transcript — ae-scroll-area for design-system scrollbars + edge fades.
  const scroll = el("ae-scroll-area", {
    class: "hg-focus__scroll",
    attrs: { shadow: true, "max-height": "100%" },
  });
  const region = el("div", { class: "hg-transcript-region" });

  const tasks = focus.activeStory && Array.isArray(focus.activeStory.tasks) ? focus.activeStory.tasks : [];
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

  const transcript = el("div", { class: "hg-transcript" });
  for (const t of tasks) transcript.append(renderEntry(t));
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
