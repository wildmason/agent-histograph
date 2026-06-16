// ==========================================================================
// Histograph — render.js
// Pure DOM builders. A THIN renderer of the FROZEN /api/state contract.
// No fetching, no derivation, no business logic — every value rendered here
// is computed by the Python backend (serve_state.py) and handed over as JSON.
// All color / type / spacing comes from --ae-* tokens (in app.css / markers.css);
// this module only chooses class names and ae-* elements, never hex.
//
// Public surface:
//   renderTriage(mountEl, terminals, { onFocus })   -> draws the mosaic
//   renderFocus(mountEl, focus)                      -> draws the hero column
//   renderTitlebarMeta(state)                        -> { needs, terminals, time }
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
// TRIAGE — the status mosaic
// ==========================================================================

/**
 * One triage card. ae-card (interactive) hosts a bespoke body:
 *   identity line: provider glyph + name + status dot + freshness
 *   story line:    the active story title (bold)
 *   epic micro-label OR statusLine/needs-you callout
 */
export function renderTriageCard(term, { onFocus } = {}) {
  const prov = providerOf(term.provider);
  const quiet = term.status === "stale" || term.status === "parked" || term.status === "done";

  // Identity label. When the project couldn't be resolved (codex lanes carry no
  // cwd, so project falls back to a session-id fragment that equals the id),
  // show the id alone rather than a misleading id-as-project suffix (m1).
  const hasProject = term.project && term.project !== term.id;
  const identityLabel = hasProject ? `${term.id} · ${term.project}` : term.id;

  const card = el("ae-card", {
    class: "hg-card" + (quiet ? " hg-card--quiet" : ""),
    attrs: {
      elevation: "low",
      padding: "sm",
      interactive: true,
      role: "button",
      tabindex: "0",
      "aria-pressed": term.focused ? "true" : "false",
      "aria-label": `Focus ${identityLabel}`,
      "data-terminal": term.id,
    },
  });

  // focused-cell ring is painted in CSS via .hg-card[aria-pressed="true"]::part(card)
  // so it clips to the card's rounded inner surface and layers on TOP of the
  // needs-you border tint instead of clobbering the host box-shadow (M2/M3).
  // Here we only set the needs-you border tint (a host token the inner .card
  // consumes); a card that is both focused AND needs-you keeps this tint and
  // gets the focus ring from the ::part rule.
  if (term.status === "needs-you") {
    card.style.setProperty(
      "--ae-card-border",
      "color-mix(in oklch, var(--ae-color-danger) 40%, var(--ae-color-border))"
    );
  }

  // freshness tone. Clamp to the known class set (muted/warning/danger) with a
  // muted fallback so an unexpected tone can't emit an unstyled class (L3). A
  // "mid-turn" beat is the spec's honest "actively turning" tell and must read
  // warning amber even though the backend collapses sub-10-min idle to muted —
  // the LABEL carries the meaning the tone field lost (M3).
  const FRESH_TONES = { muted: 1, warning: 1, danger: 1 };
  let toneKey = FRESH_TONES[term.freshnessTone] ? term.freshnessTone : "muted";
  if (term.freshnessLabel === "mid-turn") toneKey = "warning";
  const freshTone = "hg-card__fresh--" + toneKey;

  const identity = el(
    "div",
    { class: "hg-card__identity" },
    el("span", {
      class: "hg-provider " + prov.cls,
      title: prov.label,
      attrs: { "aria-hidden": "true" },
      text: prov.glyph,
    }),
    el("span", { class: "hg-card__name", text: identityLabel }),
    el("span", {
      class: "hg-statusdot " + (STATUS_DOT[term.status] || "hg-statusdot--stale"),
      attrs: { "aria-hidden": "true" },
    }),
    el("span", { class: "hg-card__fresh " + freshTone, text: term.freshnessLabel || "" })
  );

  const story = el("div", {
    class: "hg-card__story",
    text: (term.story && term.story.title) || "—",
  });

  const body = el("div", { class: "hg-card-body" }, identity, story);

  // status row: needs-you callout owns the eye; otherwise epic micro-label +
  // status line.
  if (term.statusLine && term.statusLine.kind === "needs-you") {
    body.append(
      el(
        "div",
        { class: "hg-card__needs" },
        el("ae-tag", { attrs: { tone: "danger", variant: "soft", size: "sm" } }, "needs you")
      )
    );
  } else {
    if (term.epic) {
      body.append(
        el(
          "div",
          { class: "hg-card__epic" },
          el("span", { attrs: { "aria-hidden": "true" } }, "▚"),
          `${term.epic.title} · ${term.epic.done}/${term.epic.total}`
        )
      );
    } else {
      body.append(
        el("div", { class: "hg-card__epic hg-card__epic--standalone" }, "standalone · no epic")
      );
    }
    if (term.statusLine && term.statusLine.text) {
      body.append(renderStatusLine(term.statusLine.text));
    }
  }

  card.append(body);

  const activate = () => onFocus && onFocus(term.id);
  card.addEventListener("click", activate);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });

  return card;
}

// statusLine.text may carry a "mid-turn" beat we want to tint warning.
function renderStatusLine(text) {
  const wrap = el("div", { class: "hg-card__statusline" });
  const parts = String(text).split(/(mid-turn)/g);
  for (const p of parts) {
    if (p === "mid-turn") wrap.append(el("span", { class: "hg-card__midturn", text: p }));
    else if (p) wrap.append(document.createTextNode(p));
  }
  return wrap;
}

// Short status word when the backend hands over no explicit statusLine.text.
const STATUS_WORD = {
  active: "active", "needs-you": "needs you", stale: "idle", parked: "parked", done: "done",
};

/**
 * One process-table lane row: status dot · provider glyph + id · focus title ·
 * status · age. Clickable + keyboard-operable; the focused lane gets an inset
 * accent bar. Token-driven (no hex) — the dot, provider tint, and freshness tone
 * reuse the same --ae-* classes the old cards used. The full "id · project"
 * rides the row's title so the project survives the denser layout (hover).
 */
function renderTriageRow(term, { onFocus, onDismiss } = {}) {
  const prov = providerOf(term.provider);
  const needsYou =
    term.status === "needs-you" || (term.statusLine && term.statusLine.kind === "needs-you");
  const quiet = term.status === "stale" || term.status === "parked" || term.status === "done";

  const hasProject = term.project && term.project !== term.id;
  const fullLabel = hasProject ? `${term.id} · ${term.project}` : term.id;

  // age tone — clamp to the known class set (muted/warning/danger) with a muted
  // fallback; a "mid-turn" beat reads warning even when the backend collapsed it.
  const FRESH_TONES = { muted: 1, warning: 1, danger: 1 };
  let toneKey = FRESH_TONES[term.freshnessTone] ? term.freshnessTone : "muted";
  if (term.freshnessLabel === "mid-turn") toneKey = "warning";

  // status cell: needs-you owns the eye (danger); else the backend's short
  // status text; else a plain status word.
  const statusText = needsYou
    ? "needs you"
    : (term.statusLine && term.statusLine.text) || STATUS_WORD[term.status] || "";
  const statusTone = needsYou ? "danger" : quiet ? "muted" : "success";

  const row = el(
    "div",
    {
      class: "hg-trow" + (term.focused ? " hg-trow--selected" : "") + (quiet ? " hg-trow--quiet" : ""),
      title: fullLabel,
      attrs: {
        role: "button",
        tabindex: "0",
        "aria-pressed": term.focused ? "true" : "false",
        "aria-label": `Focus ${fullLabel}` + (needsYou ? " — needs you" : ""),
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
      { class: "hg-trow__term" },
      el("span", {
        class: "hg-provider " + prov.cls,
        title: prov.label,
        attrs: { "aria-hidden": "true" },
        text: prov.glyph,
      }),
      el("span", { class: "hg-trow__id", text: term.id })
    ),
    el("span", { class: "hg-trow__focus", text: (term.story && term.story.title) || "—" }),
    el("span", { class: "hg-trow__status hg-trow__status--" + statusTone, text: statusText }),
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

  // Close-out (×) — a SIBLING of the row, never nested inside the role="button"
  // (nested interactives break assistive tech). It stays hidden until the lane is
  // hovered or focus-enters, and reads danger on hover (a destructive low-emphasis
  // ghost, per Aegis). Dismissing hides the lane until it does new work.
  const closeBtn = el("button", {
    class: "hg-trow__close",
    attrs: {
      type: "button",
      "aria-label": `Close out ${fullLabel}`,
      title: "Close out — hides this lane until it does new work",
    },
    text: "×",
  });
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onDismiss) onDismiss(term.id);
  });

  return el(
    "div",
    { class: "hg-trow-wrap", attrs: { role: "listitem" } },
    row,
    closeBtn
  );
}

/**
 * Draw (or redraw) the triage as a process table: a column-hint header + a
 * height-capped, scrollable body of one-line lane rows. Lanes that NEED YOU
 * float to the top (then a divider), so triage is "the stuck ones are already
 * on top," not "read all of them." The 120px cap (CSS) keeps a high terminal
 * count from ever swallowing the trail below — at scale it scrolls instead.
 */
export function renderTriage(mountEl, terminals, opts = {}) {
  clear(mountEl);
  const list = Array.isArray(terminals) ? terminals : [];
  if (list.length === 0) {
    // cold / no lanes — a calm placeholder rather than an empty table.
    mountEl.append(
      el(
        "ae-empty-state",
        { attrs: { compact: true } },
        el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph" }, "▚"),
        el("span", { attrs: { slot: "title" } }, "No live terminals"),
        "Start an agent and it appears here within a few seconds."
      )
    );
    return;
  }

  // needs-you-first (stable within each group — preserves the backend's order).
  const needs = [];
  const rest = [];
  for (const t of list) {
    (t.status === "needs-you" || (t.statusLine && t.statusLine.kind === "needs-you") ? needs : rest).push(t);
  }

  const table = el("div", { class: "hg-triage-table" });
  table.append(
    el(
      "div",
      { class: "hg-triage__head", attrs: { "aria-hidden": "true" } },
      el("span", { class: "hg-trow__dot" }),
      el("span", { class: "hg-trow__term", text: "term" }),
      el("span", { class: "hg-trow__focus", text: "focus" }),
      el("span", { class: "hg-trow__status", text: "status" }),
      el("span", { class: "hg-trow__age", text: "age" }),
      // spacer so the header columns line up with rows, which carry a trailing × .
      el("span", { class: "hg-trow__close-spacer", attrs: { "aria-hidden": "true" } })
    )
  );

  // list semantics: a list of clickable lanes; each row is role="button", wrapped
  // in a role="listitem" so AT gets the "N items" count without double-roling.
  const body = el("div", {
    class: "hg-triage__scroll hg-scroll",
    attrs: { role: "list", "aria-label": `${list.length} terminal${list.length === 1 ? "" : "s"}` },
  });
  const add = (t) => body.append(renderTriageRow(t, opts));
  needs.forEach(add);
  if (needs.length && rest.length) {
    body.append(el("div", { class: "hg-triage__divider", attrs: { "aria-hidden": "true" } }));
  }
  rest.forEach(add);

  table.append(body);
  mountEl.append(table);
}

// ==========================================================================
// FOCUS — the hero column (epic band + story rail + task trail)
// ==========================================================================

/** parked-epic crumb (UX §4.1) — typed epic seam, one muted line. */
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

/** the bespoke segmented roadmap bar (done / active / not-started / blocked). */
function renderRoadmapBar(segments) {
  const bar = el("div", { class: "hg-roadmap", attrs: { "aria-hidden": "true" } });
  const segs = Array.isArray(segments) ? segments : [];
  for (const s of segs) {
    bar.append(el("span", { class: "hg-roadmap__seg hg-roadmap__seg--" + (s.state || "not-started") }));
  }
  return bar;
}

/**
 * epic band (tier 1) — ae-page-header for eyebrow + title; the progress
 * read-out rides the header's default (trailing) slot; the roadmap bar sits
 * beneath. Boxless: the page-header rule is suppressed in CSS.
 */
function renderEpicBand(epic, integrity) {
  const header = el("ae-page-header", {
    attrs: {
      level: "1",
      eyebrow: `EPIC · ${epic.project || epic.eyebrow || ""}`.trim(),
      heading: epic.title || "",
    },
  });

  // eyebrow mark icon (the ▚ glyph) in the dedicated icon slot
  const iconSpan = el("span", {
    attrs: { slot: "icon", "aria-hidden": "true" },
    class: "hg-epic__eyebrow-mark",
  });
  iconSpan.textContent = "▚";
  header.append(iconSpan);

  // progress read-out — "N / M stories", N tinted success. Default slot →
  // sits in the page-header's right status/actions column.
  const progress = el("div", { class: "hg-epic__progress" });
  progress.append(
    el("span", { class: "hg-epic__progress-count", text: String(epic.done) }),
    ` / ${epic.total} stories`
  );
  // integrity hint: reconstructed epics read faintly; confirmed ones are plain.
  if (integrity === "reconstructed") {
    progress.append(
      el("span", {
        title: "epic name reconstructed — not yet human-confirmed",
        class: "hg-integrity hg-integrity--reconstructed",
        style: "margin-left:var(--ae-space-2)",
        text: "◇",
      })
    );
  }
  header.append(progress);

  const band = el("div", { class: "hg-epic" }, header, renderRoadmapBar(epic.roadmapSegments));
  return band;
}

/** a done / not-started / blocked story row on the continuous rail. */
function renderStoryRow(story) {
  const state = story.state || "not-started";
  const markerCls =
    state === "done"
      ? "hg-story__marker--done"
      : state === "blocked"
        ? "hg-story__marker--blocked"
        : "hg-story__marker--not-started";

  const markerGlyph = state === "done" ? "✓" : state === "blocked" ? "!" : "";

  const crumb =
    state === "done"
      ? `${story.decisionCount || 0} decision${story.decisionCount === 1 ? "" : "s"}`
      : state === "blocked"
        ? "blocked"
        : "not started";

  return el(
    "div",
    { class: `hg-story hg-story--row hg-story--${state}` },
    el("span", { class: "hg-story__marker " + markerCls, attrs: { "aria-hidden": "true" } }, markerGlyph),
    el("span", { class: "hg-story__title", text: story.title || "—" }),
    el("span", { class: "hg-story__crumb", text: crumb })
  );
}

/** the active story bloomed open inline + its nested task trail. */
function renderActiveStory(activeStory, state) {
  const blocked = state === "blocked";
  const head = el(
    "div",
    { class: "hg-story__head" },
    el("span", {
      class: "hg-story__pulse" + (blocked ? "" : " hg-pulse"),
      attrs: { "aria-hidden": "true" },
    }),
    el("div", { class: "hg-story__active-title", text: activeStory.title || "—" }),
    el("span", {
      class: "hg-story__index" + (blocked ? " hg-story__index--blocked" : ""),
      text: activeStory.indexLabel || "active",
    })
  );

  const wrap = el("div", { class: "hg-story hg-story--active" }, head);
  wrap.append(renderTrail(activeStory.tasks));
  return wrap;
}

/** the task trail (tier 3). tasks oldest→newest; live tip + pending at end. */
function renderTrail(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  if (list.length === 0) {
    // live-but-empty — calm, not broken (UX §10.6).
    return el("div", { class: "hg-trail--empty" }, "No decisions yet — the agent just picked this up.");
  }
  const trail = el("div", { class: "hg-trail" });
  for (const t of list) trail.append(renderTask(t));
  return trail;
}

function renderTask(task) {
  let node;
  switch (task.kind) {
    case "decision":
      node = taskRow(task, "decision");
      break;
    case "step":
      node = taskRow(task, "step");
      break;
    case "milestone":
      node = taskRow(task, "milestone");
      break;
    case "supersedes":
      node = renderReversal(task);
      break;
    case "live":
      node = renderLive(task);
      break;
    case "activity":
      // the in-flight live view — always visible, never folded into an accordion.
      return renderActivity(task);
    case "pending":
      return renderPending(task);
    default:
      node = taskRow(task, "step");
  }
  // a COMPLETED task tucks its turn's tool calls into a click-to-expand accordion:
  // the historical record stays one click away without cluttering the decision trail.
  const acc = toolAccordion(task);
  if (acc) (node.querySelector(".hg-task__body") || node).append(acc);
  return node;
}

// an in-flight tool-activity node — the live work stream the decision trail
// otherwise hides. Faint + compact so it never competes with a decision; the
// most recent (task.now) is the live edge and gets a pulsing "● now". tool +
// target (file basename / short command) come pre-cleaned from the backend.
function renderActivity(task) {
  const now = !!task.now;
  const left = el(
    "div",
    { class: "hg-task__gutter-left" },
    el(
      "span",
      {
        class:
          "hg-node hg-node--activity" + (now ? " hg-node--activity-now hg-pulse" : ""),
        attrs: { "aria-hidden": "true" },
      },
      toolGlyph(task.tool)
    )
  );
  const line = el("div", { class: "hg-activity__line" });
  if (now) line.append(el("span", { class: "hg-activity__now" }, "● now"));
  line.append(el("span", { class: "hg-activity__tool", text: task.tool || "tool" }));
  if (task.summary) {
    line.append(el("span", { class: "hg-activity__target", text: task.summary }));
  }
  const time = el(
    "div",
    { class: "hg-task__meta" },
    el("span", { class: "hg-task__time", text: clock(task.at) })
  );
  return el(
    "div",
    { class: "hg-task hg-task--activity" + (now ? " hg-task--activity-now" : "") },
    left,
    el("div", { class: "hg-task__body" }, line),
    time
  );
}

// the quiet metadata gutter: integrity glyph + timestamp.
// The glyph carries its meaning ONCE for AT via role="img" + aria-label. We do
// NOT also anchor an ae-tooltip to it: ae-tooltip wires aria-describedby onto
// the anchor, which would make a screen reader announce the integrity word
// twice (name + description). Sighted hover gets a native `title` tooltip
// instead — visible, quiet, no double-announce (m4/H4). aria-hidden="false" is
// dropped (it's the default and some AT mishandle an explicit false).
function metaGutter(task) {
  const intg = integrityOf(task.integrity);
  const glyph = el("span", {
    class: "hg-integrity " + intg.cls,
    title: "integrity: " + intg.label,
    attrs: { role: "img", "aria-label": "integrity: " + intg.label },
    text: intg.glyph,
  });
  return el(
    "div",
    { class: "hg-task__meta" },
    glyph,
    el("span", { class: "hg-task__time", text: clock(task.at) })
  );
}

// generic decision/step/milestone row
function taskRow(task, kind) {
  return el(
    "div",
    { class: `hg-task hg-task--${kind}` },
    el(
      "div",
      { class: "hg-task__gutter-left" },
      el("span", { class: `hg-node hg-node--${kind}`, attrs: { "aria-hidden": "true" } })
    ),
    el("div", { class: "hg-task__body" }, el("div", { class: "hg-task__summary", text: task.summary || "" })),
    metaGutter(task)
  );
}

// the reversal "stitch" — struck superseded line, supersedes label +
// reversibility, then the surviving successor (= task.summary). The one node
// that keeps full detail.
function renderReversal(task) {
  const rev = task.reversal || {};
  const body = el("div", { class: "hg-task__body" });

  if (rev.supersededSummary) {
    body.append(el("div", { class: "hg-reversal__superseded", text: rev.supersededSummary }));
  }
  const rel = el("div", { class: "hg-reversal__rel" }, el("span", { class: "hg-reversal__label" }, "supersedes"));
  if (rev.reversibility) {
    rel.append(el("span", { class: "hg-reversal__reversibility", text: "reversible: " + rev.reversibility }));
  }
  body.append(rel);
  body.append(el("div", { class: "hg-reversal__successor", text: task.summary || "" }));

  return el(
    "div",
    { class: "hg-task hg-task--reversal" },
    el(
      "div",
      { class: "hg-task__gutter-left" },
      el("span", { class: "hg-node hg-node--reversal", attrs: { "aria-hidden": "true" } }, "↺")
    ),
    body,
    metaGutter(task)
  );
}

// the live tip — pulsing pin + green wash + "● now · <fresh>".
function renderLive(task) {
  const body = el(
    "div",
    { class: "hg-task__body" },
    el("div", { class: "hg-task__summary", text: task.summary || "" }),
    el("div", { class: "hg-task__nowtag" }, "● now" + (clock(task.at) ? " · " + clock(task.at) : ""))
  );
  return el(
    "div",
    { class: "hg-task hg-task--live" },
    el(
      "div",
      { class: "hg-task__gutter-left" },
      el("span", { class: "hg-node hg-node--live hg-pulse", attrs: { "aria-hidden": "true" } })
    ),
    body
  );
}

// pending task — dashed ghost ring, "next" marker on the first one is handled
// by the caller order; here we render a simple ghosted row.
function renderPending(task) {
  return el(
    "div",
    { class: "hg-task hg-task--pending" },
    el(
      "div",
      { class: "hg-task__gutter-left" },
      el("span", { class: "hg-node hg-node--pending", attrs: { "aria-hidden": "true" } })
    ),
    el("div", { class: "hg-task__body" }, el("div", { class: "hg-task__summary", text: task.summary || "" })),
    el("span", { class: "hg-task__next" }, "next")
  );
}

// ---- focus assembly ------------------------------------------------------

/**
 * Render the focus column. Splits into a pinned head (seam + epic band) and a
 * scrolling rail. Per UX §10.2 BOTH the epic band (tier 1) and the active-story
 * header (tier 2) must stay in view as the trail grows. We pin the epic band in
 * .hg-focus__pinned, and the active-story header pins via position:sticky;top:0
 * INSIDE the scroll area (see .hg-story__head in markers.css) — so the trail
 * scrolls under the current story title while the title itself never leaves
 * view, and the "one continuous rail" geometry stays intact (the header is
 * still threaded in rail order, not lifted out of it).
 *
 * mountEl is rebuilt each render:
 *   .hg-focus__pinned  — epic band (+ seam)
 *   .hg-focus__scroll  — ae-scroll-area hosting the rail (done stories →
 *                        sticky active-story head + trail → ghost stories)
 */
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
 * Drive the focus trail's scroll position and HOLD it across the async layout
 * window. `intent` is either "bottom" (pin to the newest tip and keep re-pinning
 * as geometry settles) or a number (restore that scrollTop — the reader's prior
 * position when they'd scrolled up).
 *
 * Robust to the <ae-scroll-area> viewport not existing synchronously: Lit
 * renders the shadow viewport a microtask AFTER we append it, so on a fresh
 * render it isn't queryable on the first call — we poll a few frames for it,
 * then install a ResizeObserver that re-applies the intent on every geometry
 * change (the rail grows as nodes + the sticky active-story head settle) until a
 * bounded window closes or the reader grabs the scroll. This is what stops the
 * trail landing a few nodes short of the live tip.
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
      ro.observe(rail); // content/scrollHeight (late node + sticky-head layout)
      vp.addEventListener("wheel", onUser, { passive: true });
      vp.addEventListener("touchmove", onUser, { passive: true });
      vp.addEventListener("pointerdown", onUser);
      // bounded settle window — long enough for the rail to finish laying out,
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

export function renderFocus(mountEl, focus, opts = {}) {
  // Capture the prior scroll position BEFORE rebuilding so the auto-scroll
  // policy can honor it (see app.js → paint). opts: { changed, fresh }.
  const prevVp = scrollViewportOf(mountEl.querySelector(".hg-focus__scroll"));
  let wasAtBottom = true; // first render / no prior scroller → land at the tip
  let prevTop = 0;
  if (prevVp && !opts.fresh) {
    prevTop = prevVp.scrollTop;
    wasAtBottom = prevVp.scrollHeight - prevVp.scrollTop - prevVp.clientHeight <= 10;
  }
  // A prior settle loop targets the about-to-be-detached scroll element — stop
  // it before we rebuild so it can't pin (or restore) the new pane out from
  // under this render.
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

  const pinned = el("div", { class: "hg-focus__pinned" });

  // parked-epic crumb (typed seam), restored above the band.
  const seam = renderSeam(focus.parkedEpicSeam);
  if (seam) pinned.append(seam);

  // epic band (tier 1) — present only when the work rolls up to an epic.
  if (focus.epic) {
    pinned.append(renderEpicBand(focus.epic, focus.epic.integrity));
  } else {
    // NO-EPIC degrade (UX §10.6): open at the story tier. A faint eyebrow
    // states the absence rather than fabricating an initiative.
    pinned.append(
      el(
        "div",
        { class: "hg-epic" },
        el("div", { class: "hg-seam", style: "margin-bottom:0" },
          el("span", { class: "hg-seam__label" }, "standalone story · no epic")
        )
      )
    );
  }
  mountEl.append(pinned);

  // scrolling rail — ae-scroll-area for design-system scrollbars + edge fades.
  const scroll = el("ae-scroll-area", {
    class: "hg-focus__scroll",
    attrs: { shadow: true, "max-height": "100%" },
  });
  const railRegion = el("div", { class: "hg-rail-region" });
  const rail = el("div", { class: "hg-rail" });

  const stories = Array.isArray(focus.stories) ? focus.stories : [];
  const active = focus.activeStory;
  const activeId = active && active.id;

  // EMPTY state — epic with no stories yet, or a story with no active chunk.
  if (stories.length === 0 && !active) {
    railRegion.append(
      el(
        "div",
        { class: "hg-empty" },
        el(
          "ae-empty-state",
          { attrs: { compact: true } },
          el("span", { attrs: { slot: "icon" }, class: "hg-empty__glyph" }, "○"),
          el("span", { attrs: { slot: "title" } }, "Roadmap not scoped yet"),
          "No stories enumerated — the scoping conversation hasn't happened."
        )
      )
    );
    scroll.append(railRegion);
    mountEl.append(scroll);
    return;
  }

  // Thread the rail in roadmap order. The active story blooms open inline
  // exactly where it sits in the order (matched by id when possible).
  let activePlaced = false;
  for (const story of stories) {
    if (active && story.id === activeId) {
      rail.append(renderActiveStory(active, story.state || "active"));
      activePlaced = true;
    } else {
      rail.append(renderStoryRow(story));
    }
  }
  // If the active story isn't represented in stories[] (e.g. single-story
  // no-epic shape), render it on its own.
  if (active && !activePlaced) {
    rail.append(renderActiveStory(active, "active"));
  }

  railRegion.append(rail);
  scroll.append(railRegion);
  mountEl.append(scroll);

  // Auto-scroll policy (UX §4 "auto-scroll to newest", bounded by user intent):
  //   • terminal switch / first render (fresh)       → land at the bottom (the tip)
  //   • new content AND user parked within 10px       → follow to the bottom
  //   • idle (no change) OR user scrolled >10px up     → keep their position
  const follow = opts.fresh || (opts.changed && wasAtBottom);
  // follow → pin to the newest tip; otherwise hold the reader's prior position.
  // Both are held across the async layout window by applyScroll's settle loop.
  applyScroll(scroll, rail, follow ? "bottom" : prevTop);
}

// ==========================================================================
// TITLEBAR META — small derived strings for the chrome.
// ==========================================================================
export function titlebarMeta(state) {
  const terms = Array.isArray(state.terminals) ? state.terminals : [];
  const needs = terms.filter((t) => t.status === "needs-you").length;
  let time = "";
  if (state.generatedAt) {
    const d = new Date(state.generatedAt);
    if (!Number.isNaN(d.getTime())) {
      time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    }
  }
  return { needs, count: terms.length, time };
}
