var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i7 = decorators.length - 1, decorator; i7 >= 0; i7--)
    if (decorator = decorators[i7])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// src/tokens/theme-registry.ts
var THEME_FAMILIES = [
  { id: "aegis", label: "Aegis", description: "The native v2 system brands." },
  {
    id: "spectrum",
    label: "Spectrum",
    description: "The ported v1 Aegis themeset \u2014 one brand, 12 hand-tuned looks led by Stone & Moss."
  }
];
function variant(id, direction, label, description, swatch) {
  return {
    id,
    direction,
    label,
    description,
    isDark: direction === "dark",
    isHighContrast: id === "high-contrast",
    swatch
  };
}
var THEME_REGISTRY = [
  {
    id: "default",
    family: "aegis",
    label: "Aegis",
    description: "The neutral system flagship \u2014 indigo accent on cool grays; the only theme that follows your OS light / dark / contrast.",
    defaultVariant: "light",
    followsSystem: true,
    variants: [
      variant("light", "light", "Light", "Neutral Aegis \u2014 indigo accent on cool light grays.", {
        bg: "oklch(0.99 0 0)",
        surface: "oklch(0.99 0 0)",
        fg: "oklch(0.15 0.005 240)",
        accent: "oklch(0.54 0.19 255)"
      }),
      variant("dark", "dark", "Dark", "Neutral Aegis \u2014 indigo accent on deep cool grays.", {
        bg: "oklch(0.08 0.003 240)",
        surface: "oklch(0.15 0.005 240)",
        fg: "oklch(0.98 0.002 240)",
        accent: "oklch(0.62 0.16 255)"
      }),
      variant("high-contrast", "light", "High contrast", "Maximum-contrast black-on-white for AAA legibility.", {
        bg: "oklch(1 0 0)",
        surface: "oklch(1 0 0)",
        fg: "oklch(0 0 0)",
        accent: "oklch(0.25 0.16 255)"
      })
    ]
  },
  {
    id: "cinnabar",
    family: "aegis",
    label: "Cinnabar",
    description: "Cinnabar \u2014 vermilion accent (the mineral vermilion is ground from) over warm grays.",
    defaultVariant: "light",
    followsSystem: false,
    variants: [
      variant("light", "light", "Quarry", "Vermilion accent over warm light stone.", {
        bg: "oklch(0.99 0.002 60)",
        surface: "oklch(0.99 0.002 60)",
        fg: "oklch(0.15 0.008 60)",
        accent: "oklch(0.48 0.21 30)"
      }),
      variant("dark", "dark", "Lacquer", "Vermilion accent over deep warm stone.", {
        bg: "oklch(0.08 0.005 60)",
        surface: "oklch(0.15 0.008 60)",
        fg: "oklch(0.98 0.004 60)",
        accent: "oklch(0.62 0.18 30)"
      })
    ]
  },
  {
    id: "editorial",
    family: "aegis",
    label: "Editorial",
    description: "Bridge editorial direction \u2014 flax accent, Fraunces serif, warm stone.",
    defaultVariant: "dark",
    followsSystem: false,
    variants: [
      variant("dark", "dark", "Antique Brown", "Flax accent, Fraunces serif, warm dark stone.", {
        bg: "#13120f",
        surface: "#1c1b18",
        fg: "#e8e6df",
        accent: "oklch(0.75 0.1 85)"
      }),
      variant("light", "light", "Daylight", "Flax accent, Fraunces serif, warm paper.", {
        bg: "oklch(0.95 0.007 80)",
        surface: "oklch(0.95 0.007 80)",
        fg: "#13120f",
        accent: "oklch(0.75 0.1 85)"
      })
    ]
  },
  {
    id: "metro",
    family: "aegis",
    label: "Metro",
    description: "Paper Ticket transit signage \u2014 ink rules, mono type, zero radius.",
    defaultVariant: "light",
    followsSystem: false,
    variants: [
      variant("light", "light", "Paper Ticket", "Transit signage \u2014 ink rules, mono type, zero radius.", {
        bg: "oklch(0.945 0.018 85)",
        surface: "oklch(0.945 0.018 85)",
        fg: "oklch(0.14 0.005 85)",
        accent: "oklch(0.55 0.17 35)"
      }),
      variant("dark", "dark", "Night Depot", "After-dark transit board \u2014 paper ink on deep night.", {
        bg: "oklch(0.1 0.004 85)",
        surface: "oklch(0.14 0.005 85)",
        fg: "oklch(0.945 0.018 85)",
        accent: "oklch(0.55 0.17 35)"
      })
    ]
  },
  {
    id: "crucible",
    family: "aegis",
    label: "Crucible",
    description: "Bioluminescent glassmorphism \u2014 frosted slate surfaces over a variegated atmosphere, lit by a molten amber-gold accent.",
    defaultVariant: "dark",
    followsSystem: false,
    variants: [
      variant("dark", "dark", "Molten", "The lit forge \u2014 molten amber on deep GitHub-slate, frosted glass over a green/blue/ember atmosphere.", {
        bg: "#0d1117",
        surface: "#161b22",
        fg: "#f6f8fa",
        accent: "oklch(0.8 0.155 60)"
      }),
      variant("light", "light", "Quench", "The cooled forge \u2014 molten amber on bright slate-white, frosted glass over a soft atmosphere.", {
        bg: "#ffffff",
        surface: "#f6f8fa",
        fg: "#0d1117",
        accent: "oklch(0.72 0.15 59)"
      })
    ]
  },
  /* ── Spectrum — the ported v1 Aegis themeset ───────────────────────────
   * ONE brand (`data-theme="spectrum"`), 12 palette variants. Each variant is
   * a fixed v1 look that self-declares its own color-scheme, so a Spectrum
   * variant never follows the OS and never light/dark-toggles — it IS its
   * scheme. Stone & Moss leads; the rest follow v1's order. The four light
   * variants are warm-light, neutral-light, solarized-precision, sage-linen. */
  {
    id: "spectrum",
    family: "spectrum",
    label: "Spectrum",
    description: "The ported v1 Aegis themeset \u2014 12 hand-tuned looks led by Stone & Moss.",
    defaultVariant: "stone-moss",
    followsSystem: false,
    variants: [
      variant("stone-moss", "dark", "Stone & Moss", "Forest-Moss green over cool, deep stone grays \u2014 the v1 Wildmason flagship.", {
        bg: "#2a2c2b",
        surface: "#464a49",
        fg: "#d8e0d8",
        accent: "#82a682"
      }),
      variant("warm-light", "light", "Warm Light", "Solarized-adjacent light: teal-blue ink on warm putty paper, petrol-blue accent.", {
        bg: "#ececea",
        surface: "#d2d2ce",
        fg: "#002b36",
        accent: "#105987"
      }),
      variant("neutral-light", "light", "Neutral Light", "Chromaless light: near-black ink on plain light grey, royal-blue accent.", {
        bg: "#ebebeb",
        surface: "#d0d0d0",
        fg: "#111111",
        accent: "#1b4a9e"
      }),
      variant("arctic-night", "dark", "Arctic Night", "Nord polar twilight: blue-slate stone under a glacial-teal accent.", {
        bg: "#2e3440",
        surface: "#434c5e",
        fg: "#eceff4",
        accent: "#8fc4d3"
      }),
      variant("vampires-kiss", "dark", "Vampire's Kiss", "Dracula gothic: purple-slate stone, lavender accent, neon status.", {
        bg: "#21222c",
        surface: "#44475a",
        fg: "#f8f8f2",
        accent: "#c9a7fa"
      }),
      variant("twilight-peach", "dark", "Twilight Peach", "Warm peach accent over deep indigo twilight surfaces.", {
        bg: "#171827",
        surface: "#292a48",
        fg: "#eeedf8",
        accent: "#f5986a"
      }),
      variant("thistle-mocha", "dark", "Thistle Mocha", "Thistle-lavender accent over warm espresso-mocha surfaces.", {
        bg: "#221918",
        surface: "#403635",
        fg: "#ede9e1",
        accent: "#c4a8d8"
      }),
      variant("solarized-precision", "light", "Solarized Precision", "Warm Solarized light: blue-grey ink on cream/tan, teal-blue accent.", {
        bg: "#ede7d2",
        surface: "#d4cba8",
        fg: "#2c3e48",
        accent: "#185c78"
      }),
      variant("posh-sandalwood", "dark", "Posh Sandalwood", "Monokai hot-pink accent over warm olive-brown sandalwood.", {
        bg: "#27271f",
        surface: "#403c30",
        fg: "#fdf0e0",
        accent: "#f92672"
      }),
      variant("crepuscular-sky", "dark", "Crepuscular Sky", "Golden-orange crepuscular-ray accent over deep navy.", {
        bg: "#121523",
        surface: "#1d2338",
        fg: "#edd9a3",
        accent: "#c09d06"
      }),
      variant("source-control-dark", "dark", "Source Control Dark", "GitHub-dark developer console: near-black blue stone, emerald accent.", {
        bg: "#0d1117",
        surface: "#21262d",
        fg: "#f0f6fc",
        accent: "#3fb950"
      }),
      variant("sage-linen", "light", "Sage & Linen", "Cool eucalyptus light: forest ink on sage-green paper, forest-green accent.", {
        bg: "#d4ded4",
        surface: "#e6efe5",
        fg: "#1e2822",
        accent: "#3a5a43"
      })
    ]
  }
];
function brandsByFamily() {
  return THEME_FAMILIES.map((family) => ({
    family,
    brands: THEME_REGISTRY.filter((b3) => b3.family === family.id)
  })).filter((group) => group.brands.length > 0);
}
var DEFAULT_THEME_SELECTION = { theme: "default", variant: null };
function getThemeBrand(id) {
  return THEME_REGISTRY.find((b3) => b3.id === id);
}
function getThemeVariant(brand, id) {
  return getThemeBrand(brand)?.variants.find((v2) => v2.id === id);
}
function brandSupportsVariant(brand, variant2) {
  return !!getThemeBrand(brand)?.variants.some((v2) => v2.id === variant2);
}
function resolveSystemScheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  if (window.matchMedia("(prefers-contrast: more)").matches) return "high-contrast";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}
function resolveEffectiveVariant(selection) {
  if (selection.variant) return selection.variant;
  const brand = getThemeBrand(selection.theme);
  if (brand?.followsSystem) return resolveSystemScheme();
  return brand?.defaultVariant ?? "light";
}
function applyTheme(selection, root = typeof document !== "undefined" ? document.documentElement : void 0) {
  if (!root) return;
  for (const b3 of THEME_REGISTRY) {
    if (b3.id !== "default") root.classList.remove(b3.id);
    for (const v2 of b3.variants) root.classList.remove(v2.id);
  }
  for (const f3 of THEME_FAMILIES) root.classList.remove(f3.id);
  const brand = selection.theme ? getThemeBrand(selection.theme) : void 0;
  if (selection.theme && selection.theme !== "default" && brand) {
    root.setAttribute("data-theme", selection.theme);
    root.setAttribute("data-collection", brand.family);
  } else {
    root.removeAttribute("data-theme");
    root.removeAttribute("data-collection");
  }
  if (selection.variant) {
    root.setAttribute("data-variant", selection.variant);
  } else {
    root.removeAttribute("data-variant");
  }
}

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t5, e8, o9) {
    if (this._$cssResult$ = true, o9 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t5, this.t = e8;
  }
  get styleSheet() {
    let t5 = this.o;
    const s4 = this.t;
    if (e && void 0 === t5) {
      const e8 = void 0 !== s4 && 1 === s4.length;
      e8 && (t5 = o.get(s4)), void 0 === t5 && ((this.o = t5 = new CSSStyleSheet()).replaceSync(this.cssText), e8 && o.set(s4, t5));
    }
    return t5;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t5) => new n("string" == typeof t5 ? t5 : t5 + "", void 0, s);
var i = (t5, ...e8) => {
  const o9 = 1 === t5.length ? t5[0] : e8.reduce((e9, s4, o10) => e9 + ((t6) => {
    if (true === t6._$cssResult$) return t6.cssText;
    if ("number" == typeof t6) return t6;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t6 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t5[o10 + 1], t5[0]);
  return new n(o9, t5, s);
};
var S = (s4, o9) => {
  if (e) s4.adoptedStyleSheets = o9.map((t5) => t5 instanceof CSSStyleSheet ? t5 : t5.styleSheet);
  else for (const e8 of o9) {
    const o10 = document.createElement("style"), n6 = t.litNonce;
    void 0 !== n6 && o10.setAttribute("nonce", n6), o10.textContent = e8.cssText, s4.appendChild(o10);
  }
};
var c = e ? (t5) => t5 : (t5) => t5 instanceof CSSStyleSheet ? ((t6) => {
  let e8 = "";
  for (const s4 of t6.cssRules) e8 += s4.cssText;
  return r(e8);
})(t5) : t5;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t5, s4) => t5;
var u = { toAttribute(t5, s4) {
  switch (s4) {
    case Boolean:
      t5 = t5 ? l : null;
      break;
    case Object:
    case Array:
      t5 = null == t5 ? t5 : JSON.stringify(t5);
  }
  return t5;
}, fromAttribute(t5, s4) {
  let i7 = t5;
  switch (s4) {
    case Boolean:
      i7 = null !== t5;
      break;
    case Number:
      i7 = null === t5 ? null : Number(t5);
      break;
    case Object:
    case Array:
      try {
        i7 = JSON.parse(t5);
      } catch (t6) {
        i7 = null;
      }
  }
  return i7;
} };
var f = (t5, s4) => !i2(t5, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t5) {
    this._$Ei(), (this.l ??= []).push(t5);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t5, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t5) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t5, s4), !s4.noAccessor) {
      const i7 = Symbol(), h3 = this.getPropertyDescriptor(t5, i7, s4);
      void 0 !== h3 && e2(this.prototype, t5, h3);
    }
  }
  static getPropertyDescriptor(t5, s4, i7) {
    const { get: e8, set: r6 } = h(this.prototype, t5) ?? { get() {
      return this[s4];
    }, set(t6) {
      this[s4] = t6;
    } };
    return { get: e8, set(s5) {
      const h3 = e8?.call(this);
      r6?.call(this, s5), this.requestUpdate(t5, h3, i7);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t5) {
    return this.elementProperties.get(t5) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t5 = n2(this);
    t5.finalize(), void 0 !== t5.l && (this.l = [...t5.l]), this.elementProperties = new Map(t5.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t6 = this.properties, s4 = [...r2(t6), ...o2(t6)];
      for (const i7 of s4) this.createProperty(i7, t6[i7]);
    }
    const t5 = this[Symbol.metadata];
    if (null !== t5) {
      const s4 = litPropertyMetadata.get(t5);
      if (void 0 !== s4) for (const [t6, i7] of s4) this.elementProperties.set(t6, i7);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t6, s4] of this.elementProperties) {
      const i7 = this._$Eu(t6, s4);
      void 0 !== i7 && this._$Eh.set(i7, t6);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i7 = [];
    if (Array.isArray(s4)) {
      const e8 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e8) i7.unshift(c(s5));
    } else void 0 !== s4 && i7.push(c(s4));
    return i7;
  }
  static _$Eu(t5, s4) {
    const i7 = s4.attribute;
    return false === i7 ? void 0 : "string" == typeof i7 ? i7 : "string" == typeof t5 ? t5.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t5) => this.enableUpdating = t5), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t5) => t5(this));
  }
  addController(t5) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t5), void 0 !== this.renderRoot && this.isConnected && t5.hostConnected?.();
  }
  removeController(t5) {
    this._$EO?.delete(t5);
  }
  _$E_() {
    const t5 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i7 of s4.keys()) this.hasOwnProperty(i7) && (t5.set(i7, this[i7]), delete this[i7]);
    t5.size > 0 && (this._$Ep = t5);
  }
  createRenderRoot() {
    const t5 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t5, this.constructor.elementStyles), t5;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t5) => t5.hostConnected?.());
  }
  enableUpdating(t5) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t5) => t5.hostDisconnected?.());
  }
  attributeChangedCallback(t5, s4, i7) {
    this._$AK(t5, i7);
  }
  _$ET(t5, s4) {
    const i7 = this.constructor.elementProperties.get(t5), e8 = this.constructor._$Eu(t5, i7);
    if (void 0 !== e8 && true === i7.reflect) {
      const h3 = (void 0 !== i7.converter?.toAttribute ? i7.converter : u).toAttribute(s4, i7.type);
      this._$Em = t5, null == h3 ? this.removeAttribute(e8) : this.setAttribute(e8, h3), this._$Em = null;
    }
  }
  _$AK(t5, s4) {
    const i7 = this.constructor, e8 = i7._$Eh.get(t5);
    if (void 0 !== e8 && this._$Em !== e8) {
      const t6 = i7.getPropertyOptions(e8), h3 = "function" == typeof t6.converter ? { fromAttribute: t6.converter } : void 0 !== t6.converter?.fromAttribute ? t6.converter : u;
      this._$Em = e8;
      const r6 = h3.fromAttribute(s4, t6.type);
      this[e8] = r6 ?? this._$Ej?.get(e8) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t5, s4, i7, e8 = false, h3) {
    if (void 0 !== t5) {
      const r6 = this.constructor;
      if (false === e8 && (h3 = this[t5]), i7 ??= r6.getPropertyOptions(t5), !((i7.hasChanged ?? f)(h3, s4) || i7.useDefault && i7.reflect && h3 === this._$Ej?.get(t5) && !this.hasAttribute(r6._$Eu(t5, i7)))) return;
      this.C(t5, s4, i7);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t5, s4, { useDefault: i7, reflect: e8, wrapped: h3 }, r6) {
    i7 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t5) && (this._$Ej.set(t5, r6 ?? s4 ?? this[t5]), true !== h3 || void 0 !== r6) || (this._$AL.has(t5) || (this.hasUpdated || i7 || (s4 = void 0), this._$AL.set(t5, s4)), true === e8 && this._$Em !== t5 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t5));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t6) {
      Promise.reject(t6);
    }
    const t5 = this.scheduleUpdate();
    return null != t5 && await t5, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t7, s5] of this._$Ep) this[t7] = s5;
        this._$Ep = void 0;
      }
      const t6 = this.constructor.elementProperties;
      if (t6.size > 0) for (const [s5, i7] of t6) {
        const { wrapped: t7 } = i7, e8 = this[s5];
        true !== t7 || this._$AL.has(s5) || void 0 === e8 || this.C(s5, void 0, i7, e8);
      }
    }
    let t5 = false;
    const s4 = this._$AL;
    try {
      t5 = this.shouldUpdate(s4), t5 ? (this.willUpdate(s4), this._$EO?.forEach((t6) => t6.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t5 = false, this._$EM(), s5;
    }
    t5 && this._$AE(s4);
  }
  willUpdate(t5) {
  }
  _$AE(t5) {
    this._$EO?.forEach((t6) => t6.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t5)), this.updated(t5);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t5) {
    return true;
  }
  update(t5) {
    this._$Eq &&= this._$Eq.forEach((t6) => this._$ET(t6, this[t6])), this._$EM();
  }
  updated(t5) {
  }
  firstUpdated(t5) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t5) => t5;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t5) => t5 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t5) => null === t5 || "object" != typeof t5 && "function" != typeof t5;
var u2 = Array.isArray;
var d2 = (t5) => u2(t5) || "function" == typeof t5?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t5) => (i7, ...s4) => ({ _$litType$: t5, strings: i7, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t5, i7) {
  if (!u2(t5) || !t5.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i7) : i7;
}
var N = (t5, i7) => {
  const s4 = t5.length - 1, e8 = [];
  let n6, l4 = 2 === i7 ? "<svg>" : 3 === i7 ? "<math>" : "", c5 = v;
  for (let i8 = 0; i8 < s4; i8++) {
    const s5 = t5[i8];
    let a4, u4, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c5.lastIndex = f3, u4 = c5.exec(s5), null !== u4); ) f3 = c5.lastIndex, c5 === v ? "!--" === u4[1] ? c5 = _ : void 0 !== u4[1] ? c5 = m : void 0 !== u4[2] ? (y2.test(u4[2]) && (n6 = RegExp("</" + u4[2], "g")), c5 = p2) : void 0 !== u4[3] && (c5 = p2) : c5 === p2 ? ">" === u4[0] ? (c5 = n6 ?? v, d3 = -1) : void 0 === u4[1] ? d3 = -2 : (d3 = c5.lastIndex - u4[2].length, a4 = u4[1], c5 = void 0 === u4[3] ? p2 : '"' === u4[3] ? $ : g) : c5 === $ || c5 === g ? c5 = p2 : c5 === _ || c5 === m ? c5 = v : (c5 = p2, n6 = void 0);
    const x2 = c5 === p2 && t5[i8 + 1].startsWith("/>") ? " " : "";
    l4 += c5 === v ? s5 + r3 : d3 >= 0 ? (e8.push(a4), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i8 : x2);
  }
  return [V(t5, l4 + (t5[s4] || "<?>") + (2 === i7 ? "</svg>" : 3 === i7 ? "</math>" : "")), e8];
};
var S2 = class _S {
  constructor({ strings: t5, _$litType$: i7 }, e8) {
    let r6;
    this.parts = [];
    let l4 = 0, a4 = 0;
    const u4 = t5.length - 1, d3 = this.parts, [f3, v2] = N(t5, i7);
    if (this.el = _S.createElement(f3, e8), P.currentNode = this.el.content, 2 === i7 || 3 === i7) {
      const t6 = this.el.content.firstChild;
      t6.replaceWith(...t6.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u4; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t6 of r6.getAttributeNames()) if (t6.endsWith(h2)) {
          const i8 = v2[a4++], s4 = r6.getAttribute(t6).split(o3), e9 = /([.?@])?(.*)/.exec(i8);
          d3.push({ type: 1, index: l4, name: e9[2], strings: s4, ctor: "." === e9[1] ? I : "?" === e9[1] ? L : "@" === e9[1] ? z : H }), r6.removeAttribute(t6);
        } else t6.startsWith(o3) && (d3.push({ type: 6, index: l4 }), r6.removeAttribute(t6));
        if (y2.test(r6.tagName)) {
          const t6 = r6.textContent.split(o3), i8 = t6.length - 1;
          if (i8 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i8; s4++) r6.append(t6[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l4 });
            r6.append(t6[i8], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l4 });
      else {
        let t6 = -1;
        for (; -1 !== (t6 = r6.data.indexOf(o3, t6 + 1)); ) d3.push({ type: 7, index: l4 }), t6 += o3.length - 1;
      }
      l4++;
    }
  }
  static createElement(t5, i7) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t5, s4;
  }
};
function M(t5, i7, s4 = t5, e8) {
  if (i7 === E) return i7;
  let h3 = void 0 !== e8 ? s4._$Co?.[e8] : s4._$Cl;
  const o9 = a2(i7) ? void 0 : i7._$litDirective$;
  return h3?.constructor !== o9 && (h3?._$AO?.(false), void 0 === o9 ? h3 = void 0 : (h3 = new o9(t5), h3._$AT(t5, s4, e8)), void 0 !== e8 ? (s4._$Co ??= [])[e8] = h3 : s4._$Cl = h3), void 0 !== h3 && (i7 = M(t5, h3._$AS(t5, i7.values), h3, e8)), i7;
}
var R = class {
  constructor(t5, i7) {
    this._$AV = [], this._$AN = void 0, this._$AD = t5, this._$AM = i7;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t5) {
    const { el: { content: i7 }, parts: s4 } = this._$AD, e8 = (t5?.creationScope ?? l2).importNode(i7, true);
    P.currentNode = e8;
    let h3 = P.nextNode(), o9 = 0, n6 = 0, r6 = s4[0];
    for (; void 0 !== r6; ) {
      if (o9 === r6.index) {
        let i8;
        2 === r6.type ? i8 = new k(h3, h3.nextSibling, this, t5) : 1 === r6.type ? i8 = new r6.ctor(h3, r6.name, r6.strings, this, t5) : 6 === r6.type && (i8 = new Z(h3, this, t5)), this._$AV.push(i8), r6 = s4[++n6];
      }
      o9 !== r6?.index && (h3 = P.nextNode(), o9++);
    }
    return P.currentNode = l2, e8;
  }
  p(t5) {
    let i7 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t5, s4, i7), i7 += s4.strings.length - 2) : s4._$AI(t5[i7])), i7++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t5, i7, s4, e8) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t5, this._$AB = i7, this._$AM = s4, this.options = e8, this._$Cv = e8?.isConnected ?? true;
  }
  get parentNode() {
    let t5 = this._$AA.parentNode;
    const i7 = this._$AM;
    return void 0 !== i7 && 11 === t5?.nodeType && (t5 = i7.parentNode), t5;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t5, i7 = this) {
    t5 = M(this, t5, i7), a2(t5) ? t5 === A || null == t5 || "" === t5 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t5 !== this._$AH && t5 !== E && this._(t5) : void 0 !== t5._$litType$ ? this.$(t5) : void 0 !== t5.nodeType ? this.T(t5) : d2(t5) ? this.k(t5) : this._(t5);
  }
  O(t5) {
    return this._$AA.parentNode.insertBefore(t5, this._$AB);
  }
  T(t5) {
    this._$AH !== t5 && (this._$AR(), this._$AH = this.O(t5));
  }
  _(t5) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t5 : this.T(l2.createTextNode(t5)), this._$AH = t5;
  }
  $(t5) {
    const { values: i7, _$litType$: s4 } = t5, e8 = "number" == typeof s4 ? this._$AC(t5) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e8) this._$AH.p(i7);
    else {
      const t6 = new R(e8, this), s5 = t6.u(this.options);
      t6.p(i7), this.T(s5), this._$AH = t6;
    }
  }
  _$AC(t5) {
    let i7 = C.get(t5.strings);
    return void 0 === i7 && C.set(t5.strings, i7 = new S2(t5)), i7;
  }
  k(t5) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i7 = this._$AH;
    let s4, e8 = 0;
    for (const h3 of t5) e8 === i7.length ? i7.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i7[e8], s4._$AI(h3), e8++;
    e8 < i7.length && (this._$AR(s4 && s4._$AB.nextSibling, e8), i7.length = e8);
  }
  _$AR(t5 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t5 !== this._$AB; ) {
      const s5 = i3(t5).nextSibling;
      i3(t5).remove(), t5 = s5;
    }
  }
  setConnected(t5) {
    void 0 === this._$AM && (this._$Cv = t5, this._$AP?.(t5));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t5, i7, s4, e8, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t5, this.name = i7, this._$AM = e8, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t5, i7 = this, s4, e8) {
    const h3 = this.strings;
    let o9 = false;
    if (void 0 === h3) t5 = M(this, t5, i7, 0), o9 = !a2(t5) || t5 !== this._$AH && t5 !== E, o9 && (this._$AH = t5);
    else {
      const e9 = t5;
      let n6, r6;
      for (t5 = h3[0], n6 = 0; n6 < h3.length - 1; n6++) r6 = M(this, e9[s4 + n6], i7, n6), r6 === E && (r6 = this._$AH[n6]), o9 ||= !a2(r6) || r6 !== this._$AH[n6], r6 === A ? t5 = A : t5 !== A && (t5 += (r6 ?? "") + h3[n6 + 1]), this._$AH[n6] = r6;
    }
    o9 && !e8 && this.j(t5);
  }
  j(t5) {
    t5 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t5 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t5) {
    this.element[this.name] = t5 === A ? void 0 : t5;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t5) {
    this.element.toggleAttribute(this.name, !!t5 && t5 !== A);
  }
};
var z = class extends H {
  constructor(t5, i7, s4, e8, h3) {
    super(t5, i7, s4, e8, h3), this.type = 5;
  }
  _$AI(t5, i7 = this) {
    if ((t5 = M(this, t5, i7, 0) ?? A) === E) return;
    const s4 = this._$AH, e8 = t5 === A && s4 !== A || t5.capture !== s4.capture || t5.once !== s4.once || t5.passive !== s4.passive, h3 = t5 !== A && (s4 === A || e8);
    e8 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t5), this._$AH = t5;
  }
  handleEvent(t5) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t5) : this._$AH.handleEvent(t5);
  }
};
var Z = class {
  constructor(t5, i7, s4) {
    this.element = t5, this.type = 6, this._$AN = void 0, this._$AM = i7, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t5) {
    M(this, t5);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.3");
var D = (t5, i7, s4) => {
  const e8 = s4?.renderBefore ?? i7;
  let h3 = e8._$litPart$;
  if (void 0 === h3) {
    const t6 = s4?.renderBefore ?? null;
    e8._$litPart$ = h3 = new k(i7.insertBefore(c3(), t6), t6, void 0, s4 ?? {});
  }
  return h3._$AI(t5), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t5 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t5.firstChild, t5;
  }
  update(t5) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t5), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// node_modules/@lit/reactive-element/decorators/custom-element.js
var t3 = (t5) => (e8, o9) => {
  void 0 !== o9 ? o9.addInitializer(() => {
    customElements.define(t5, e8);
  }) : customElements.define(t5, e8);
};

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t5 = o5, e8, r6) => {
  const { kind: n6, metadata: i7 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i7);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i7, s4 = /* @__PURE__ */ new Map()), "setter" === n6 && ((t5 = Object.create(t5)).wrapped = true), s4.set(r6.name, t5), "accessor" === n6) {
    const { name: o9 } = r6;
    return { set(r7) {
      const n7 = e8.get.call(this);
      e8.set.call(this, r7), this.requestUpdate(o9, n7, t5, true, r7);
    }, init(e9) {
      return void 0 !== e9 && this.C(o9, void 0, t5, e9), e9;
    } };
  }
  if ("setter" === n6) {
    const { name: o9 } = r6;
    return function(r7) {
      const n7 = this[o9];
      e8.call(this, r7), this.requestUpdate(o9, n7, t5, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n6);
};
function n4(t5) {
  return (e8, o9) => "object" == typeof o9 ? r4(t5, e8, o9) : ((t6, e9, o10) => {
    const r6 = e9.hasOwnProperty(o10);
    return e9.constructor.createProperty(o10, t6), r6 ? Object.getOwnPropertyDescriptor(e9, o10) : void 0;
  })(t5, e8, o9);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// node_modules/@lit/reactive-element/decorators/base.js
var e4 = (e8, t5, c5) => (c5.configurable = true, c5.enumerable = true, Reflect.decorate && "object" != typeof t5 && Object.defineProperty(e8, t5, c5), c5);

// node_modules/@lit/reactive-element/decorators/query.js
function e5(e8, r6) {
  return (n6, s4, i7) => {
    const o9 = (t5) => t5.renderRoot?.querySelector(e8) ?? null;
    if (r6) {
      const { get: e9, set: r7 } = "object" == typeof s4 ? n6 : i7 ?? (() => {
        const t5 = Symbol();
        return { get() {
          return this[t5];
        }, set(e10) {
          this[t5] = e10;
        } };
      })();
      return e4(n6, s4, { get() {
        let t5 = e9.call(this);
        return void 0 === t5 && (t5 = o9(this), (null !== t5 || this.hasUpdated) && r7.call(this, t5)), t5;
      } });
    }
    return e4(n6, s4, { get() {
      return o9(this);
    } });
  };
}

// node_modules/@lit/reactive-element/decorators/query-assigned-elements.js
function o6(o9) {
  return (e8, n6) => {
    const { slot: r6, selector: s4 } = o9 ?? {}, c5 = "slot" + (r6 ? `[name=${r6}]` : ":not([name])");
    return e4(e8, n6, { get() {
      const t5 = this.renderRoot?.querySelector(c5), e9 = t5?.assignedElements(o9) ?? [];
      return void 0 === s4 ? e9 : e9.filter((t6) => t6.matches(s4));
    } });
  };
}

// src/primitives/ae-visually-hidden.ts
var AeVisuallyHidden = class extends i4 {
  render() {
    return b2`<slot></slot>`;
  }
};
AeVisuallyHidden.styles = i`
    :host {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
  `;
AeVisuallyHidden = __decorateClass([
  t3("ae-visually-hidden")
], AeVisuallyHidden);

// src/primitives/ae-portal.ts
var AePortal = class extends i4 {
  constructor() {
    super(...arguments);
    this.target = "";
    this.disabled = false;
    this._destination = null;
    this._portaled = /* @__PURE__ */ new Set();
    this._onSlotChange = () => {
      this._reconcile();
    };
  }
  render() {
    return b2`<slot @slotchange=${this._onSlotChange}></slot>`;
  }
  updated(changed) {
    if (changed.has("disabled") || changed.has("target")) {
      this._reconcile();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._releaseAll();
  }
  _reconcile() {
    if (this.disabled) {
      this._releaseAll();
      return;
    }
    const target = this._resolveTarget();
    if (!target) return;
    if (target !== this._destination) {
      this._releaseAll();
      this._destination = target;
    }
    const slot = this.shadowRoot?.querySelector("slot");
    if (!slot) return;
    const assigned = slot.assignedNodes({ flatten: false });
    for (const node of assigned) {
      if (!this._portaled.has(node)) {
        target.appendChild(node);
        this._portaled.add(node);
      }
    }
  }
  _releaseAll() {
    for (const node of this._portaled) {
      if (node instanceof Element) node.remove();
    }
    this._portaled.clear();
    this._destination = null;
  }
  _resolveTarget() {
    if (!this.target) return document.body;
    const el = document.querySelector(this.target);
    return el instanceof HTMLElement ? el : document.body;
  }
};
AePortal.styles = i`
    :host {
      display: none;
    }
    :host([disabled]) {
      display: contents;
    }
  `;
__decorateClass([
  n4({ type: String })
], AePortal.prototype, "target", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AePortal.prototype, "disabled", 2);
AePortal = __decorateClass([
  t3("ae-portal")
], AePortal);

// src/shared/styles.ts
var focusRing = i`
  outline: var(--ae-focus-ring-width) var(--ae-focus-ring-style)
    var(--ae-color-focus-ring);
  outline-offset: var(--ae-focus-ring-offset);
`;
var invalidRing = i`
  outline-color: var(--ae-color-danger);
`;
var baseHost = i`
  :host {
    box-sizing: border-box;
    font-family: var(--ae-font-family-sans);
    font-size: var(--ae-font-size-default);
    line-height: var(--ae-line-height-default);
    color: var(--ae-color-fg);
  }
  :host([hidden]) {
    display: none !important;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;
var visuallyHidden = i`
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
`;
var autofillReset = i`
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  textarea:-webkit-autofill:active,
  input:autofill,
  textarea:autofill {
    -webkit-text-fill-color: var(--ae-input-autofill-fg, var(--ae-color-fg));
    -webkit-box-shadow: inset 0 0 0 1000px
      var(--ae-input-autofill-bg, transparent);
    box-shadow: inset 0 0 0 1000px
      var(--ae-input-autofill-bg, transparent);
    caret-color: var(--ae-input-autofill-fg, var(--ae-color-fg));
    transition:
      background-color 600000s 0s,
      color 600000s 0s;
  }
`;

// src/components/button/ae-button.ts
var AeButton = class extends i4 {
  constructor() {
    super();
    this.variant = "secondary";
    this.size = "md";
    this.type = "button";
    this.disabled = false;
    this.loading = false;
    this.loadingBar = "bottom";
    this.fullWidth = false;
    this._onClick = (e8) => {
      if (this.disabled || this.loading) {
        e8.preventDefault();
        e8.stopImmediatePropagation();
        return;
      }
      if (this.type === "submit" || this.type === "reset") {
        const form = this._internals.form;
        if (form) {
          if (this.type === "submit") {
            form.requestSubmit();
          } else {
            form.reset();
          }
        }
      }
    };
    this._internals = this.attachInternals();
  }
  render() {
    return b2`
      <button
        part="button"
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        aria-disabled=${this.disabled ? "true" : A}
        aria-busy=${this.loading ? "true" : A}
        @click=${this._onClick}
      >
        <span class="button-inner">
          ${this.loading ? b2`<span class="loading-spin" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <circle class="track" cx="16" cy="16" r="13"></circle>
                  <circle class="ind" cx="16" cy="16" r="13"></circle>
                </svg>
              </span>` : A}
          <span class="start-slot"><slot name="start"></slot></span>
          <slot></slot>
          <span class="end-slot"><slot name="end"></slot></span>
        </span>
        ${this.loading ? b2`<span
              class="loading-bar"
              part="loading-bar"
              aria-hidden="true"
            ></span>` : A}
      </button>
    `;
  }
  focus(options) {
    this._btn?.focus(options);
  }
  blur() {
    this._btn?.blur();
  }
};
AeButton.formAssociated = true;
AeButton.styles = i`
    /*
     * --ae-button-bg / --ae-button-bg-hover / --ae-button-bg-active / --ae-button-fg /
     * --ae-button-border are declared at :host so the variant selectors
     * (:host([variant='primary']) etc.) can rewrite them per-variant.
     * Their fallback chain to semantic --ae-color-* tokens is what lets
     * dark / cinnabar / high-contrast themes affect button colors (those
     * themes override the semantic tokens, not the button tokens).
     *
     * Typography Tier 3 tokens (--ae-button-font-family / -font-weight /
     * -letter-spacing / -text-transform) and shape tokens
     * (--ae-button-radius) are deliberately NOT declared at :host. A
     * :host declaration would shadow inherited root-level theme
     * overrides because directly-applied rules win over inheritance. They
     * are resolved at the consumption point below via var(--token, default)
     * so themes can override them at :root.<theme> and the values cascade
     * into the shadow root through inheritance.
     */
    :host {
      --ae-button-bg: var(--ae-color-bg-subtle);
      --ae-button-bg-hover: var(--ae-color-bg-muted);
      --ae-button-bg-active: var(--ae-color-bg-muted);
      --ae-button-fg: var(--ae-color-fg);
      --ae-button-border: var(--ae-color-border);

      display: inline-flex;
      vertical-align: middle;
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    button {
      all: unset;
      box-sizing: border-box;
      position: relative;
      /* Clips the absolutely-positioned loading bar to the button's
       * rounded corners. Safe for the focus ring — focusRing uses an
       * outline, which overflow never clips. */
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ae-button-gap, var(--ae-space-2));
      cursor: pointer;
      user-select: none;
      font-family: var(--ae-button-font-family, var(--ae-font-family-ui));
      font-weight: var(--ae-button-font-weight, var(--ae-font-weight-medium));
      letter-spacing: var(--ae-button-letter-spacing, var(--ae-letter-spacing-normal));
      text-transform: var(--ae-button-text-transform, none);
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      background: var(--ae-button-bg);
      color: var(--ae-button-fg);
      border: var(--ae-border-width-1) solid var(--ae-button-border);
      border-radius: var(--ae-button-radius, var(--ae-radius-default));
      /* Default none — a brand can set an accent glow (e.g. Crucible's molten
       * halo) without forking the component. Already in the transition list. */
      box-shadow: var(--ae-button-shadow, none);
      /* Frosted-glass hook — defaults to none (NOT the global surface filter)
       * so opaque primary/danger fills and chromeless ghost/tertiary buttons
       * aren't frosted. A brand opts the translucent secondary variant in via
       * --ae-button-backdrop-filter (Crucible). */
      backdrop-filter: var(--ae-button-backdrop-filter, none);
      -webkit-backdrop-filter: var(--ae-button-backdrop-filter, none);
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        box-shadow var(--ae-duration-fast) var(--ae-easing-ease-out);
      width: 100%;
    }

    button:hover:not(:disabled) {
      background: var(--ae-button-bg-hover);
    }

    button:active:not(:disabled) {
      background: var(--ae-button-bg-active);
    }

    button:focus-visible {
      ${focusRing}
    }

    button:disabled {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    /*
     * A loading button is set disabled to block activation, but it
     * must NOT inherit the disabled DIMMING — otherwise the label and
     * the loading bar render at 0.55 opacity and read as washed out.
     * A loading button stays full-strength; the bar conveys "busy",
     * and the cursor signals progress rather than "not allowed".
     */
    :host([loading]) button:disabled {
      opacity: 1;
      cursor: progress;
    }

    /*
     * Sizes. Each metric resolves through a per-size token whose fallback is
     * the original v2 value, so the default / cinnabar / editorial / metro
     * brands render unchanged while a brand (e.g. Spectrum's Stone & Moss) can
     * pin the exact v1 control geometry — height, padding, font-size, and the
     * per-size corner radius (v1 rounds sm tighter than md/lg).
     */
    :host([size='sm']) button {
      font-size: var(--ae-button-font-size-sm, var(--ae-font-size-sm));
      padding: var(--ae-button-padding-sm, var(--ae-space-1) var(--ae-space-3));
      min-height: var(--ae-button-height-sm, 1.75rem);
      border-radius: var(--ae-button-radius-sm, var(--ae-button-radius, var(--ae-radius-default)));
    }
    :host([size='md']) button {
      font-size: var(--ae-button-font-size-md, var(--ae-font-size-sm));
      padding: var(--ae-button-padding-md, var(--ae-space-2) var(--ae-space-4));
      min-height: var(--ae-button-height-md, 2.25rem);
    }
    :host([size='lg']) button {
      font-size: var(--ae-button-font-size-lg, var(--ae-font-size-md));
      padding: var(--ae-button-padding-lg, var(--ae-space-3) var(--ae-space-5));
      min-height: var(--ae-button-height-lg, 2.75rem);
    }

    /* Variants */
    :host([variant='primary']) {
      /* Resting / hover / active fills flow through overridable tokens so a
       * brand can give the primary button a custom fill — e.g. Crucible's
       * molten amber gradient — without disturbing other brands. Mirrors the
       * --ae-button-secondary-bg indirection. Resolved here (not :host) so a
       * :root brand override reaches the shadow root via inheritance. */
      --ae-button-bg: var(--ae-button-primary-bg, var(--ae-color-accent));
      --ae-button-bg-hover: var(--ae-button-primary-bg-hover, var(--ae-color-accent-hover));
      --ae-button-bg-active: var(--ae-button-primary-bg-active, var(--ae-color-accent-active));
      --ae-button-fg: var(--ae-color-fg-on-accent);
      --ae-button-border: transparent;
    }
    :host([variant='secondary']) {
      /* Resting fill flows through an overridable token so a brand can make
       * secondary a transparent outline button (v1 Spectrum) rather than the
       * default filled secondary, without disturbing other brands. */
      --ae-button-bg: var(--ae-button-secondary-bg, var(--ae-color-bg));
      --ae-button-bg-hover: var(--ae-color-bg-subtle);
      --ae-button-bg-active: var(--ae-color-bg-muted);
      --ae-button-fg: var(--ae-color-fg);
      --ae-button-border: var(--ae-color-border-strong);
    }
    :host([variant='tertiary']) {
      --ae-button-bg: transparent;
      --ae-button-bg-hover: var(--ae-color-bg-subtle);
      --ae-button-bg-active: var(--ae-color-bg-muted);
      --ae-button-fg: var(--ae-color-fg);
      --ae-button-border: transparent;
    }
    :host([variant='ghost']) {
      --ae-button-bg: transparent;
      --ae-button-bg-hover: var(--ae-color-hover-overlay);
      --ae-button-bg-active: var(--ae-color-active-overlay);
      --ae-button-fg: var(--ae-color-fg-muted);
      --ae-button-border: transparent;
    }
    :host([variant='danger']) {
      --ae-button-bg: var(--ae-color-danger);
      --ae-button-bg-hover: var(--ae-color-danger-emphasis);
      --ae-button-bg-active: var(--ae-color-danger-emphasis);
      --ae-button-fg: var(--ae-color-fg-on-danger);
      --ae-button-border: transparent;
    }

    .button-inner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    /*
     * Icon spacing is applied as a margin on the ACTUALLY-slotted start/end
     * content, not as a flex gap on .button-inner. The wrapper spans render
     * unconditionally, so a flex gap would add phantom width to every
     * icon-less button (two gaps = mis-centered + ~12px too wide vs the v1
     * .wm-btn, which only spaces between real items). With margins on
     * ::slotted content, an empty start/end wrapper contributes nothing.
     */
    ::slotted([slot='start']) {
      margin-inline-end: var(--ae-button-gap, var(--ae-space-2));
    }
    ::slotted([slot='end']) {
      margin-inline-start: var(--ae-button-gap, var(--ae-space-2));
    }

    /*
     * Loading affordances. One token set selects three theme-specific
     * visuals so a theme picks its loading language without forking the
     * component:
     *
     *   - Flat bar (DEFAULT) — a solid segment slides along an edge of the
     *     button (.loading-bar::before); the label stays fully visible.
     *   - Spinner — an inline arc next to the label (.loading-spin),
     *     revealed by flipping the display tokens (Editorial uses this).
     *   - Barber-pole / hazard tape — opt-in textured bar set via the
     *     --ae-button-loading-bar-image token. This is Metro-ONLY; every
     *     other theme uses the flat bar or the spinner.
     *
     * Defaults render the flat bar: the barber-pole layer is transparent
     * (image: none) and the sliding segment is shown. A theme opts into a
     * different visual purely through tokens.
     */
    .loading-bar {
      display: var(--ae-button-loading-bar-display, block);
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: var(--ae-button-loading-bar-height, 4px);
      overflow: hidden;
      pointer-events: none;
      /* Barber-pole layer — transparent unless a theme sets an image (Metro).
       * background-position scrolls it one tile per cycle for a seamless loop. */
      background-image: var(--ae-button-loading-bar-image, none);
      background-size: var(--ae-button-loading-bar-stripe, 0.5rem)
        var(--ae-button-loading-bar-stripe, 0.5rem);
      animation: ae-button-loading-scroll
        var(--ae-button-loading-bar-duration, 0.8s) linear infinite;
    }
    /*
     * Flat-bar segment — the DEFAULT visual. A solid block ~40% of the
     * track wide, sliding edge to edge. A theme that wants the textured bar
     * instead (Metro) hides this via --ae-button-loading-segment-display.
     */
    .loading-bar::before {
      content: '';
      display: var(--ae-button-loading-segment-display, block);
      position: absolute;
      top: 0;
      bottom: 0;
      left: -40%;
      width: 40%;
      background: var(--ae-button-loading-bar-fill, var(--ae-button-fg));
      animation: ae-button-loading-slide
        var(--ae-button-loading-slide-duration, 1.15s)
        var(--ae-easing-ease-in-out, ease-in-out) infinite;
    }
    :host([loading-bar='top']) .loading-bar {
      bottom: auto;
      top: 0;
    }

    /*
     * Inline spinner — opt-in (Editorial). Sits next to the label inside
     * .button-inner; hidden by default. A simple rotating arc matching the
     * standalone ae-spinner so they read consistently. Color defaults to
     * currentColor (the button text), so it contrasts every variant.
     */
    .loading-spin {
      display: var(--ae-button-loading-spinner-display, none);
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      flex: 0 0 auto;
      /* Space the spinner from the label the same way a slotted start icon
       * is spaced — .button-inner has no flex gap by design, so without this
       * the arc butts directly against the label. Defaults to the button's
       * icon gap; Editorial tightens it to --ae-space-1 (4px). */
      margin-inline-end: var(--ae-button-loading-spinner-gap, var(--ae-button-gap, var(--ae-space-2)));
    }
    .loading-spin svg {
      width: 100%;
      height: 100%;
      animation: ae-button-spin-rotate 0.8s linear infinite;
    }
    .loading-spin circle {
      fill: none;
      stroke-width: 3.5;
      stroke-linecap: round;
    }
    .loading-spin .track {
      stroke: color-mix(in oklch, currentColor 25%, transparent);
    }
    .loading-spin .ind {
      stroke: var(--ae-button-loading-spinner-color, currentColor);
      stroke-dasharray: 55 200;
    }

    @keyframes ae-button-loading-scroll {
      to {
        background-position: var(--ae-button-loading-bar-stripe, 0.5rem) 0;
      }
    }
    @keyframes ae-button-loading-slide {
      0% { left: -40%; }
      100% { left: 100%; }
    }
    @keyframes ae-button-spin-rotate {
      to { transform: rotate(360deg); }
    }

    /*
     * Reduced motion: stop all loading motion. The flat segment would
     * otherwise rest off-screen (left:-40%), so pin it to a static, dim,
     * full-width fill so the busy state stays perceivable; the spinner and
     * hazard bar keep a static visible frame. aria-busy carries the state.
     */
    @media (prefers-reduced-motion: reduce) {
      .loading-bar,
      .loading-spin svg {
        animation: none;
      }
      .loading-bar::before {
        animation: none;
        left: 0;
        width: 100%;
        opacity: 0.55;
      }
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeButton.prototype, "variant", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeButton.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], AeButton.prototype, "type", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeButton.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeButton.prototype, "loading", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "loading-bar" })
], AeButton.prototype, "loadingBar", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "full-width" })
], AeButton.prototype, "fullWidth", 2);
__decorateClass([
  e5("button")
], AeButton.prototype, "_btn", 2);
AeButton = __decorateClass([
  t3("ae-button")
], AeButton);

// node_modules/lit-html/directive.js
var t4 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
var e6 = (t5) => (...e8) => ({ _$litDirective$: t5, values: e8 });
var i5 = class {
  constructor(t5) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t5, e8, i7) {
    this._$Ct = t5, this._$AM = e8, this._$Ci = i7;
  }
  _$AS(t5, e8) {
    return this.update(t5, e8);
  }
  update(t5, e8) {
    return this.render(...e8);
  }
};

// node_modules/lit-html/directives/unsafe-html.js
var e7 = class extends i5 {
  constructor(i7) {
    if (super(i7), this.it = A, i7.type !== t4.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(r6) {
    if (r6 === A || null == r6) return this._t = void 0, this.it = r6;
    if (r6 === E) return r6;
    if ("string" != typeof r6) throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (r6 === this.it) return this._t;
    this.it = r6;
    const s4 = [r6];
    return s4.raw = s4, this._t = { _$litType$: this.constructor.resultType, strings: s4, values: [] };
  }
};
e7.directiveName = "unsafeHTML", e7.resultType = 1;
var o7 = e6(e7);

// src/components/icon/ae-icon.ts
var iconRegistry = /* @__PURE__ */ new Map();
function registerIcons(icons) {
  for (const [name, svg] of Object.entries(icons)) {
    iconRegistry.set(name, svg);
  }
}
function unregisterIcon(name) {
  iconRegistry.delete(name);
}
function listRegisteredIcons() {
  return [...iconRegistry.keys()].sort();
}
var AeIcon = class extends i4 {
  constructor() {
    super(...arguments);
    this.name = "";
    this.label = "";
    this.size = "";
  }
  render() {
    const decorative = !this.label;
    const registered = this.name ? iconRegistry.get(this.name) : void 0;
    return b2`
      <span
        part="svg"
        class="svg-wrap"
        role=${decorative ? A : "img"}
        aria-label=${decorative ? A : this.label}
        aria-hidden=${decorative ? "true" : A}
      >
        ${registered ? o7(registered) : b2`<slot></slot>`}
      </span>
    `;
  }
};
AeIcon.styles = i`
    :host {
      --ae-icon-size: 1em;
      --ae-icon-color: currentColor;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ae-icon-size);
      height: var(--ae-icon-size);
      flex-shrink: 0;
      line-height: 1;
      color: var(--ae-icon-color);
    }
    :host([size='xs']) { --ae-icon-size: 0.75rem; }
    :host([size='sm']) { --ae-icon-size: 1rem; }
    :host([size='md']) { --ae-icon-size: 1.25rem; }
    :host([size='lg']) { --ae-icon-size: 1.5rem; }
    :host([size='xl']) { --ae-icon-size: 2rem; }

    .svg-wrap,
    ::slotted(svg) {
      display: block;
      width: 100%;
      height: 100%;
    }
    .svg-wrap svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeIcon.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], AeIcon.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeIcon.prototype, "size", 2);
AeIcon = __decorateClass([
  t3("ae-icon")
], AeIcon);

// src/components/stack/ae-stack.ts
var AeStack = class extends i4 {
  constructor() {
    super(...arguments);
    this.direction = "column";
    this.gap = "md";
    this.align = "";
    this.justify = "";
    this.wrap = false;
    this.inline = false;
  }
  render() {
    return b2`<slot></slot>`;
  }
};
AeStack.styles = i`
    :host {
      display: flex;
      box-sizing: border-box;
      min-width: 0;
    }
    :host([inline]) { display: inline-flex; }

    :host([direction='column']) { flex-direction: column; }
    :host([direction='row'])    { flex-direction: row; }

    :host([gap='none']) { gap: 0; }
    :host([gap='xs'])   { gap: var(--ae-space-1); }
    :host([gap='sm'])   { gap: var(--ae-space-2); }
    :host([gap='md'])   { gap: var(--ae-space-4); }
    :host([gap='lg'])   { gap: var(--ae-space-6); }
    :host([gap='xl'])   { gap: var(--ae-space-8); }
    :host([gap='2xl']) { gap: var(--ae-space-12); }

    :host([align='start'])    { align-items: flex-start; }
    :host([align='center'])   { align-items: center; }
    :host([align='end'])      { align-items: flex-end; }
    :host([align='stretch'])  { align-items: stretch; }
    :host([align='baseline']) { align-items: baseline; }

    :host([justify='start'])   { justify-content: flex-start; }
    :host([justify='center'])  { justify-content: center; }
    :host([justify='end'])     { justify-content: flex-end; }
    :host([justify='between']) { justify-content: space-between; }
    :host([justify='around'])  { justify-content: space-around; }
    :host([justify='evenly'])  { justify-content: space-evenly; }

    :host([wrap]) { flex-wrap: wrap; }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeStack.prototype, "direction", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStack.prototype, "gap", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStack.prototype, "align", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStack.prototype, "justify", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeStack.prototype, "wrap", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeStack.prototype, "inline", 2);
AeStack = __decorateClass([
  t3("ae-stack")
], AeStack);

// src/components/divider/ae-divider.ts
var AeDivider = class extends i4 {
  constructor() {
    super(...arguments);
    this.orientation = "horizontal";
    this.decorative = false;
    this.weight = "regular";
    this._onSlotChange = () => this.requestUpdate();
  }
  /** True when the default slot has any meaningful (non-whitespace) content. */
  _hasLabel() {
    return Array.from(this.childNodes).some(
      (n6) => n6.nodeType === Node.ELEMENT_NODE || n6.nodeType === Node.TEXT_NODE && (n6.textContent ?? "").trim() !== ""
    );
  }
  render() {
    const role = this.decorative ? "none" : "separator";
    const hasLabel = this._hasLabel();
    return b2`
      <span
        class="rule"
        role=${role}
        aria-orientation=${this.decorative ? A : this.orientation}
      ></span>
      <span class="label" ?hidden=${!hasLabel}>
        <slot @slotchange=${this._onSlotChange}></slot>
      </span>
      <span class="rule" aria-hidden="true" ?hidden=${!hasLabel}></span>
    `;
  }
};
AeDivider.styles = i`
    :host {
      --ae-divider-color: var(--ae-color-border);
      --_w: var(--ae-border-width-1);
      display: flex;
      align-items: center;
      gap: var(--ae-space-3);
      color: var(--ae-color-fg-muted);
      font-size: var(--ae-font-size-xs);
      line-height: 1;
    }
    :host([weight='thin']) { --_w: 1px; }
    :host([weight='regular']) { --_w: var(--ae-border-width-1); }
    :host([weight='strong']) { --_w: var(--ae-border-width-2); }

    :host([orientation='horizontal']) {
      width: 100%;
    }
    :host([orientation='vertical']) {
      flex-direction: column;
      height: 100%;
      width: auto;
      align-self: stretch;
    }

    .rule {
      flex: 1 1 auto;
      background: var(--ae-divider-color);
    }
    :host([orientation='horizontal']) .rule { height: var(--_w); }
    :host([orientation='vertical']) .rule { width: var(--_w); }

    .label {
      display: inline-flex;
      flex: 0 0 auto;
      white-space: nowrap;
    }
    /* When no label is slotted, the label box and trailing rule collapse so the
       single remaining rule spans edge-to-edge with no flex gap left dangling. */
    .label[hidden],
    .rule[hidden] { display: none; }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeDivider.prototype, "orientation", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDivider.prototype, "decorative", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDivider.prototype, "weight", 2);
AeDivider = __decorateClass([
  t3("ae-divider")
], AeDivider);

// src/components/card/ae-card.ts
var AeCard = class extends i4 {
  constructor() {
    super(...arguments);
    this.elevation = "low";
    this.padding = "md";
    this.interactive = false;
    this._hasHeader = false;
    this._hasFooter = false;
    this._onSlotChange = (e8) => {
      const slot = e8.target;
      const assigned = slot.assignedNodes({ flatten: true }).length > 0;
      if (slot.name === "header") this._hasHeader = assigned;
      if (slot.name === "footer") this._hasFooter = assigned;
      this.requestUpdate();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._hasHeader = this.querySelector(':scope > [slot="header"]') !== null;
    this._hasFooter = this.querySelector(':scope > [slot="footer"]') !== null;
  }
  render() {
    return b2`
      <div part="card" class="card">
        <div part="header" class="header" ?hidden=${!this._hasHeader}>
          <slot name="header" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div part="body" class="body">
          <slot></slot>
        </div>
        <div part="footer" class="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }
};
AeCard.styles = i`
    :host {
      --ae-card-bg: var(--ae-color-bg-elevated);
      --ae-card-fg: var(--ae-color-fg);
      --ae-card-border: var(--ae-color-border);
      --ae-card-radius: var(--ae-radius-lg);
      --ae-card-padding: var(--ae-space-4);
      --ae-card-title-font-family: var(--ae-font-family-display);
      display: block;
    }

    .card {
      background: var(--ae-card-bg);
      backdrop-filter: var(--ae-card-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-card-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-card-fg);
      border: var(--ae-border-width-1) solid var(--ae-card-border);
      border-radius: var(--ae-card-radius);
      overflow: hidden;
      transition: box-shadow var(--ae-duration-fast) var(--ae-easing-ease-out),
        transform var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([elevation='flat']) .card { box-shadow: var(--ae-shadow-none); }
    :host([elevation='low']) .card  { box-shadow: var(--ae-shadow-xs); }
    :host([elevation='mid']) .card  { box-shadow: var(--ae-shadow-md); }
    :host([elevation='high']) .card { box-shadow: var(--ae-shadow-lg); }

    :host([interactive]) .card {
      cursor: pointer;
    }
    :host([interactive]) .card:hover {
      box-shadow: var(--ae-shadow-md);
    }
    :host([interactive]) .card:active {
      transform: translateY(1px);
    }

    .header,
    .body,
    .footer {
      padding: var(--ae-card-padding);
    }
    .header { border-bottom: var(--ae-border-width-1) solid var(--ae-color-border-subtle); }
    .footer { border-top: var(--ae-border-width-1) solid var(--ae-color-border-subtle); background: var(--ae-color-bg-subtle); }

    /* Route slotted heading-level title to the display font family.
     * Editorial-direction themes flip --ae-font-family-display to a
     * serif stack, so card titles automatically pick up the serif. */
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
      font-family: var(--ae-card-title-font-family);
    }

    :host([padding='none']) .header,
    :host([padding='none']) .body,
    :host([padding='none']) .footer { padding: 0; }
    :host([padding='sm']) { --ae-card-padding: var(--ae-space-3); }
    :host([padding='md']) { --ae-card-padding: var(--ae-space-4); }
    :host([padding='lg']) { --ae-card-padding: var(--ae-space-6); }

    /* Hide header/footer wrappers when their slots are empty */
    .header:not(:has(slot[name='header']:not([data-empty]))) { display: none; }
    .footer:not(:has(slot[name='footer']:not([data-empty]))) { display: none; }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeCard.prototype, "elevation", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeCard.prototype, "padding", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCard.prototype, "interactive", 2);
AeCard = __decorateClass([
  t3("ae-card")
], AeCard);

// src/components/tag/ae-tag.ts
var AeTag = class extends i4 {
  constructor() {
    super(...arguments);
    this.tone = "neutral";
    this.variant = "soft";
    this.size = "md";
    this.removable = false;
    this._onRemove = (e8) => {
      e8.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("ae-remove", { bubbles: true, composed: true })
      );
    };
  }
  render() {
    return b2`
      <span part="tag" class="tag">
        <slot name="start"></slot>
        <slot></slot>
        ${this.removable ? b2`<button
              part="remove"
              class="remove"
              aria-label="Remove"
              @click=${this._onRemove}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true" width="10" height="10">
                <path
                  d="M3 3 L9 9 M9 3 L3 9"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>` : A}
      </span>
    `;
  }
};
AeTag.styles = i`
    :host {
      --_bg: var(--ae-color-bg-muted);
      --_fg: var(--ae-color-fg);
      --_border: transparent;
      display: inline-flex;
      vertical-align: middle;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      background: var(--_bg);
      backdrop-filter: var(--ae-tag-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-tag-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--_fg);
      border: var(--ae-border-width-1) solid var(--_border);
      /* Default to pill (--ae-radius-full); theme packs can flatten to
       * rectangle via --ae-tag-radius. Token is consumed via var()
       * with a fallback so themes can override at :root.<name> without
       * the cascade-shadowing trap that a :host default would create. */
      border-radius: var(--ae-tag-radius, var(--ae-radius-full));
      font-size: var(--ae-tag-font-size, var(--ae-font-size-xs));
      font-weight: var(--ae-tag-font-weight, var(--ae-font-weight-medium));
      line-height: var(--ae-tag-line-height, 1);
      white-space: nowrap;
      padding: var(--ae-tag-padding, var(--ae-space-1) var(--ae-space-2));
    }
    :host([size='sm']) .tag {
      font-size: 0.6875rem;
      padding: 2px var(--ae-space-2);
    }

    /* Tone × variant matrix */
    :host([tone='neutral'][variant='soft']) {
      --_bg: var(--ae-color-bg-muted);
      --_fg: var(--ae-color-fg);
    }
    :host([tone='neutral'][variant='solid']) {
      --_bg: var(--ae-color-gray-800);
      --_fg: var(--ae-color-gray-0);
    }
    :host([tone='neutral'][variant='outline']) {
      --_bg: transparent;
      --_fg: var(--ae-color-fg);
      --_border: var(--ae-color-border-strong);
    }

    :host([tone='accent'][variant='soft']) {
      --_bg: var(--ae-color-accent-subtle);
      --_fg: var(--ae-color-accent-emphasis);
    }
    :host([tone='accent'][variant='solid']) {
      --_bg: var(--ae-color-accent);
      --_fg: var(--ae-color-fg-on-accent);
    }
    :host([tone='accent'][variant='outline']) {
      --_bg: transparent;
      --_fg: var(--ae-color-accent-emphasis);
      --_border: var(--ae-color-accent);
    }

    :host([tone='success'][variant='soft']) {
      --_bg: var(--ae-color-success-subtle);
      --_fg: var(--ae-color-success-emphasis);
    }
    :host([tone='success'][variant='solid']) {
      --_bg: var(--ae-color-success);
      --_fg: var(--ae-color-fg-on-success);
    }

    :host([tone='warning'][variant='soft']) {
      --_bg: var(--ae-color-warning-subtle);
      --_fg: var(--ae-color-warning-emphasis);
    }
    :host([tone='warning'][variant='solid']) {
      --_bg: var(--ae-color-warning);
      --_fg: var(--ae-color-fg-on-warning);
    }

    :host([tone='danger'][variant='soft']) {
      --_bg: var(--ae-color-danger-subtle);
      --_fg: var(--ae-color-danger-emphasis);
    }
    :host([tone='danger'][variant='solid']) {
      --_bg: var(--ae-color-danger);
      --_fg: var(--ae-color-fg-on-danger);
    }

    :host([tone='info'][variant='soft']) {
      --_bg: var(--ae-color-info-subtle);
      --_fg: var(--ae-color-info-emphasis);
    }
    :host([tone='info'][variant='solid']) {
      --_bg: var(--ae-color-info);
      --_fg: var(--ae-color-fg-on-info);
    }

    .remove {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      border-radius: 50%;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      transition: opacity var(--ae-duration-fast);
    }
    .remove:hover,
    .remove:focus-visible {
      opacity: 1;
    }
    .remove:focus-visible {
      outline: var(--ae-focus-ring-width) var(--ae-focus-ring-style)
        var(--ae-color-focus-ring);
      outline-offset: 1px;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTag.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTag.prototype, "variant", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTag.prototype, "size", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTag.prototype, "removable", 2);
AeTag = __decorateClass([
  t3("ae-tag")
], AeTag);

// src/components/badge/ae-badge.ts
var AeBadge = class extends i4 {
  constructor() {
    super(...arguments);
    this.tone = "danger";
    this.variant = "number";
    this.max = 99;
    this.label = "";
  }
  render() {
    if (this.variant === "dot") {
      return this.label ? b2`<span class="badge" role="img" aria-label=${this.label}></span>` : b2`<span class="badge" aria-hidden="true"></span>`;
    }
    const display = typeof this.count === "number" ? this.count > this.max ? `${this.max}+` : String(this.count) : A;
    return this.label ? b2`<span class="badge" role="img" aria-label=${this._numberAriaLabel(display)}
          ><span aria-hidden="true">${display}<slot></slot></span
        ></span>` : b2`<span class="badge">${display}<slot></slot></span>`;
  }
  _numberAriaLabel(display) {
    const num = typeof display === "string" ? display : "";
    return num ? `${num} ${this.label}`.trim() : this.label;
  }
};
AeBadge.styles = i`
    :host {
      --_bg: var(--ae-color-danger);
      --_fg: var(--ae-color-fg-on-danger);
      display: inline-flex;
      vertical-align: middle;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--_bg);
      color: var(--_fg);
      font-size: 0.6875rem;
      font-weight: var(--ae-font-weight-semibold);
      line-height: 1;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 var(--ae-space-1);
      border-radius: var(--ae-radius-full);
      box-sizing: border-box;
    }

    :host([variant='dot']) .badge {
      min-width: 0.5rem;
      height: 0.5rem;
      padding: 0;
    }

    :host([tone='neutral']) { --_bg: var(--ae-color-gray-600); --_fg: var(--ae-color-gray-0); }
    :host([tone='accent'])  { --_bg: var(--ae-color-accent); --_fg: var(--ae-color-fg-on-accent); }
    :host([tone='success']) { --_bg: var(--ae-color-success); --_fg: var(--ae-color-fg-on-success); }
    :host([tone='warning']) { --_bg: var(--ae-color-warning); --_fg: var(--ae-color-fg-on-warning); }
    :host([tone='danger'])  { --_bg: var(--ae-color-danger); --_fg: var(--ae-color-fg-on-danger); }
    :host([tone='info'])    { --_bg: var(--ae-color-info); --_fg: var(--ae-color-fg-on-info); }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeBadge.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeBadge.prototype, "variant", 2);
__decorateClass([
  n4({ type: Number })
], AeBadge.prototype, "max", 2);
__decorateClass([
  n4({ type: Number })
], AeBadge.prototype, "count", 2);
__decorateClass([
  n4({ type: String })
], AeBadge.prototype, "label", 2);
AeBadge = __decorateClass([
  t3("ae-badge")
], AeBadge);

// src/components/spinner/ae-spinner.ts
var AeSpinner = class extends i4 {
  constructor() {
    super(...arguments);
    this.size = "md";
    this.label = "Loading";
  }
  render() {
    return b2`
      <svg viewBox="0 0 32 32" role="status" aria-label=${this.label}>
        <circle class="track" cx="16" cy="16" r="13"></circle>
        <circle class="indicator" cx="16" cy="16" r="13"></circle>
      </svg>
      <span class="stripe-ring" role="status" aria-label=${this.label}></span>
    `;
  }
};
AeSpinner.styles = i`
    /*
     * Tier 3 spinner tokens (--ae-spinner-size / -track / -color) are
     * consumed via var(--token, fallback) below rather than declared
     * at :host. A :host declaration would shadow inherited root-level
     * theme overrides — see ae-input.ts for the cascade reasoning.
     *
     * The size attribute selectors below DO set --ae-spinner-size at
     * :host because that's a per-instance size variant, not a token
     * themes care about — themes wanting to override size would target
     * the element directly.
     */
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ae-spinner-size, 1.25rem);
      height: var(--ae-spinner-size, 1.25rem);
    }
    :host([size='xs']) { --ae-spinner-size: 0.75rem; }
    :host([size='sm']) { --ae-spinner-size: 1rem; }
    :host([size='md']) { --ae-spinner-size: 1.25rem; }
    :host([size='lg']) { --ae-spinner-size: 1.75rem; }
    :host([size='xl']) { --ae-spinner-size: 2.5rem; }

    svg {
      width: 100%;
      height: 100%;
      display: var(--ae-spinner-svg-display, block);
      animation: ae-spinner-rotate 1.4s linear infinite;
    }
    circle {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      transform-origin: center;
    }
    .track {
      stroke: var(--ae-spinner-track, color-mix(in oklch, currentColor 20%, transparent));
    }
    .indicator {
      stroke: var(--ae-spinner-color, currentColor);
      stroke-dasharray: 80, 200;
      stroke-dashoffset: 0;
      animation: ae-spinner-dash 1.4s ease-in-out infinite;
    }

    /*
     * Optional stripe-ring variant. Hidden by default (display: none);
     * a theme opts in by flipping --ae-spinner-stripe-display to block
     * AND --ae-spinner-svg-display to none. The square element is
     * painted with --ae-spinner-stripe (a color or gradient) and
     * masked into a ring band so the diagonal hazard tape shows through a
     * STATIC ring window. The tape scrolls left→right via background-position
     * (it does NOT rotate) — the same trick ae-button's loading bar uses — and
     * Metro feeds it the same --ae-hazard-tape gradient as --ae-progress-fill.
     * SVG strokes can't take a CSS gradient, which is why this is a separate
     * masked div rather than a token on the arc.
     */
    .stripe-ring {
      display: var(--ae-spinner-stripe-display, none);
      width: 100%;
      height: 100%;
      background: var(--ae-spinner-stripe, transparent);
      /* Tile the tape into a fixed square = one full 45° period in BOTH axes
         (an 8px tape → 8·√2 ≈ 11.3137px). Tiling then reconstructs the gradient
         seamlessly, and because the scroll shifts by this SAME distance the loop
         lands on an identical tile — pixel-exact, no reset hitch. Without a fixed
         tile the gradient renders at element size and background-repeat seams it,
         which jumps on the ring (it's hidden on the thin loading bar). */
      background-size:
        var(--ae-spinner-stripe-cycle, 11.3137px)
        var(--ae-spinner-stripe-cycle, 11.3137px);
      /*
       * Ring mask. The four stops matter: transparent center → opaque
       * band → hard transparent at 100%. Without the final transparent
       * stop the gradient's last color continues past the inscribed
       * circle out to the SQUARE's corners, rendering as "a square with
       * a hole punched in it" rather than a ring.
       */
      -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - var(--ae-spinner-stripe-band, 3px)),
        #000 calc(100% - var(--ae-spinner-stripe-band, 3px)),
        #000 100%,
        transparent 100%
      );
      mask: radial-gradient(
        farthest-side,
        transparent calc(100% - var(--ae-spinner-stripe-band, 3px)),
        #000 calc(100% - var(--ae-spinner-stripe-band, 3px)),
        #000 100%,
        transparent 100%
      );
      animation: ae-spinner-stripe-scroll var(--ae-spinner-stripe-duration, 0.8s)
        linear infinite;
    }

    @keyframes ae-spinner-stripe-scroll {
      /* Static ring; scroll the tape left→right. A 45° tape with an 8px diagonal
         period repeats after an 8·√2 ≈ 11.3137px horizontal shift — one seamless
         cycle, the same background-position scroll as ae-button's loading bar. */
      to { background-position: var(--ae-spinner-stripe-cycle, 11.3137px) 0; }
    }

    @keyframes ae-spinner-rotate {
      to { transform: rotate(360deg); }
    }
    @keyframes ae-spinner-dash {
      0%   { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50%  { stroke-dasharray: 90, 200; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 200; stroke-dashoffset: -124; }
    }

    /*
     * Reduced-motion: stop the continuous spin. The static arc (.indicator
     * keeps its base 80,200 dasharray) plus role="status" / aria-label keep
     * the loading state perceivable without vestibular-triggering motion.
     * The global token reset can't reach these hardcoded-duration keyframes.
     */
    @media (prefers-reduced-motion: reduce) {
      svg,
      .indicator,
      .stripe-ring {
        animation: none;
      }
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSpinner.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], AeSpinner.prototype, "label", 2);
AeSpinner = __decorateClass([
  t3("ae-spinner")
], AeSpinner);

// src/shared/aria-forward.ts
var FORWARDED_ARIA_ATTRS = [
  "aria-label",
  "aria-description"
];
var ForwardAriaController = class {
  constructor(host, getTarget) {
    /** Last aria-description value we moved onto the target, so that stripping
     *  it from the host (below) doesn't then clear it from the target. */
    this._descForwarded = null;
    /** Whether THIS controller set the target's aria-label, so we never clear a
     *  label the component rendered itself (e.g. from its own `label` prop). */
    this._labelForwarded = false;
    this._host = host;
    this._getTarget = getTarget;
    host.addController(this);
  }
  hostConnected() {
    if (typeof MutationObserver === "function") {
      this._observer = new MutationObserver(() => this._host.requestUpdate());
      this._observer.observe(this._host, {
        attributes: true,
        attributeFilter: [...FORWARDED_ARIA_ATTRS]
      });
    }
    this.sync();
  }
  hostDisconnected() {
    this._observer?.disconnect();
    this._observer = void 0;
  }
  hostUpdated() {
    this.sync();
  }
  /**
   * Copy each forwarded attribute from host → inner control. An empty or
   * absent value clears the corresponding attribute on the target so that
   * removing a label on the host removes it on the control too.
   *
   * The attribute is intentionally LEFT on the host as well: the host
   * wrapper carries no implicit ARIA role, so a stray `aria-label` on it is
   * not surfaced as a separate accessible node — but stripping it would
   * fight `ae-form-field`, which sets the attribute on the host and would
   * otherwise see it vanish on the next mutation tick.
   */
  sync() {
    const target = this._getTarget();
    if (!target) return;
    const label = this._host.getAttribute("aria-label");
    if (label !== null && label !== "") {
      if (target.getAttribute("aria-label") !== label) {
        target.setAttribute("aria-label", label);
      }
      this._labelForwarded = true;
    } else if (this._labelForwarded) {
      target.removeAttribute("aria-label");
      this._labelForwarded = false;
    }
    const desc = this._host.getAttribute("aria-description");
    if (desc !== null && desc !== "") {
      if (target.getAttribute("aria-description") !== desc) {
        target.setAttribute("aria-description", desc);
      }
      this._descForwarded = desc;
      this._host.removeAttribute("aria-description");
    } else if (this._descForwarded === null && target.hasAttribute("aria-description")) {
      target.removeAttribute("aria-description");
    }
  }
};

// src/components/input/ae-input.ts
var AeInput = class extends i4 {
  constructor() {
    super();
    this.type = "text";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.readonly = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.size = "md";
    this.min = "";
    this.max = "";
    this.step = "";
    this.autocomplete = "";
    this.inputmode = "";
    this.pattern = "";
    this.spellcheck = true;
    this.autofocus = false;
    this.clearable = false;
    this._hasStart = false;
    this._hasEnd = false;
    /**
     * Forwards the host's `aria-label` / `aria-description` onto the inner
     * native `<input>` so a standalone `<ae-input aria-label="…">` and an
     * enclosing `<ae-form-field>` both name the control AT actually focuses.
     * IDREF naming (`aria-labelledby`) cannot cross the shadow boundary; pass
     * label text instead — see ForwardAriaController.
     */
    this._ariaForward = new ForwardAriaController(this, () => this._input);
    this._onStartSlotChange = (e8) => {
      const slot = e8.target;
      this._hasStart = slot.assignedNodes({ flatten: true }).length > 0;
    };
    this._onEndSlotChange = (e8) => {
      const slot = e8.target;
      this._hasEnd = slot.assignedNodes({ flatten: true }).length > 0;
    };
    this._onInput = (e8) => {
      this.value = e8.target.value;
      this.dispatchEvent(
        new CustomEvent("ae-input", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
    this._onChange = () => {
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
    this._onClear = () => {
      this.value = "";
      this.dispatchEvent(
        new CustomEvent("ae-clear", { bubbles: true, composed: true })
      );
      this.dispatchEvent(
        new CustomEvent("ae-input", {
          bubbles: true,
          composed: true,
          detail: { value: "" }
        })
      );
      this._input?.focus();
    };
    this._onStepUp = () => this._stepValue(1);
    this._onStepDown = () => this._stepValue(-1);
    // Keep the input focused when a stepper button is pressed (the button isn't
    // focusable, so without this the input would blur on mousedown).
    this._preventBlur = (e8) => e8.preventDefault();
    this._internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  }
  connectedCallback() {
    super.connectedCallback();
    this._hasStart = this.querySelector(':scope > [slot="start"]') !== null;
    this._hasEnd = this.querySelector(':scope > [slot="end"]') !== null;
  }
  render() {
    const showClear = this.clearable && !this.disabled && !this.readonly && this.value !== "";
    return b2`
      <div part="wrapper" class="wrapper">
        <span class="affix affix-start" ?hidden=${!this._hasStart}>
          <slot name="start" @slotchange=${this._onStartSlotChange}></slot>
        </span>
        <input
          part="input"
          type=${this.type}
          .value=${this.value}
          placeholder=${this.placeholder || A}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-invalid=${this.invalid ? "true" : A}
          name=${this.name || A}
          min=${this.min || A}
          max=${this.max || A}
          step=${this.step || A}
          autocomplete=${this.autocomplete || A}
          inputmode=${this.inputmode || A}
          pattern=${this.pattern || A}
          spellcheck=${this.spellcheck ? A : "false"}
          @input=${this._onInput}
          @change=${this._onChange}
        />
        ${this.type === "number" ? b2`<span part="stepper" class="stepper">
              <button
                part="stepper-up"
                class="stepper-btn"
                type="button"
                tabindex="-1"
                aria-label="Increase"
                ?disabled=${this.disabled || this.readonly || this._atBound(1)}
                @mousedown=${this._preventBlur}
                @click=${this._onStepUp}
              >
                <svg viewBox="0 0 10 10" aria-hidden="true" width="10" height="10">
                  <path
                    d="M2 6.25 L5 3.25 L8 6.25"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button
                part="stepper-down"
                class="stepper-btn"
                type="button"
                tabindex="-1"
                aria-label="Decrease"
                ?disabled=${this.disabled || this.readonly || this._atBound(-1)}
                @mousedown=${this._preventBlur}
                @click=${this._onStepDown}
              >
                <svg viewBox="0 0 10 10" aria-hidden="true" width="10" height="10">
                  <path
                    d="M2 3.75 L5 6.75 L8 3.75"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </span>` : A}
        ${showClear ? b2`<button
              part="clear"
              class="clear"
              type="button"
              aria-label="Clear input"
              @click=${this._onClear}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true" width="10" height="10">
                <path
                  d="M3 3 L9 9 M9 3 L3 9"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>` : A}
        <span class="affix affix-end" ?hidden=${!this._hasEnd}>
          <slot name="end" @slotchange=${this._onEndSlotChange}></slot>
        </span>
      </div>
    `;
  }
  willUpdate(changed) {
    if (changed.has("value") && typeof this.value !== "string") {
      this.value = this.value == null ? "" : String(this.value);
    }
  }
  updated(changed) {
    if (changed.has("value") || changed.has("required")) {
      this._syncFormState();
    }
  }
  _syncFormState() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && this.value === "") {
      this._internals.setValidity({ valueMissing: true }, "Please fill out this field.", this._input);
    } else {
      this._internals.setValidity({});
    }
  }
  // -- Number stepper ---------------------------------------------------
  // type="number" renders a ± spinner (v1 number-input parity). The native UA
  // spinners are stripped in CSS; these give a consistent, larger hit target
  // and themeable chrome. Keyboard users still get the native ArrowUp/Down on
  // the focused input, so the buttons are mouse affordance (tabindex -1) — the
  // behavior stays keyboard-operable without adding redundant tab stops.
  /** Numeric step, defaulting to 1. `step="any"` and invalid values → 1. */
  _numericStep() {
    const s4 = (this.step ?? "").trim();
    if (!s4 || s4 === "any") return 1;
    const n6 = Number(s4);
    return Number.isFinite(n6) && n6 > 0 ? n6 : 1;
  }
  /** Parse a numeric bound attr to a number, or null when unset/blank. */
  _bound(raw) {
    const s4 = (raw ?? "").trim();
    if (s4 === "") return null;
    const n6 = Number(s4);
    return Number.isFinite(n6) ? n6 : null;
  }
  _currentNumber() {
    const s4 = this.value.trim();
    if (s4 === "") return null;
    const n6 = Number(s4);
    return Number.isFinite(n6) ? n6 : null;
  }
  /** Decimal places implied by the step, so we round away float drift. */
  _stepDecimals(step) {
    const s4 = String(step);
    const dot = s4.indexOf(".");
    return dot === -1 ? 0 : s4.length - dot - 1;
  }
  /** True when stepping in `dir` is impossible (value already at the bound). */
  _atBound(dir) {
    const cur = this._currentNumber();
    if (cur == null) return false;
    const min = this._bound(this.min);
    const max = this._bound(this.max);
    if (dir > 0) return max != null && cur >= max;
    return min != null && cur <= min;
  }
  _stepValue(dir) {
    if (this.disabled || this.readonly) return;
    const step = this._numericStep();
    const min = this._bound(this.min);
    const max = this._bound(this.max);
    const cur = this._currentNumber();
    let next;
    if (cur == null) {
      next = dir > 0 ? min ?? step : max ?? -step;
    } else {
      next = cur + dir * step;
    }
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    const decimals = this._stepDecimals(step);
    if (decimals > 0) next = Number(next.toFixed(Math.min(decimals, 100)));
    const str = String(next);
    if (str === this.value) {
      this._input?.focus();
      return;
    }
    this.value = str;
    this.dispatchEvent(
      new CustomEvent("ae-input", { bubbles: true, composed: true, detail: { value: this.value } })
    );
    this.dispatchEvent(
      new CustomEvent("ae-change", { bubbles: true, composed: true, detail: { value: this.value } })
    );
    this._input?.focus();
  }
  focus(options) {
    this._input?.focus(options);
  }
  blur() {
    this._input?.blur();
  }
  firstUpdated() {
    if (this.autofocus) this._input?.focus();
  }
  /** Form-association lifecycle: invoked when the host form is reset. */
  formResetCallback() {
    this.value = "";
  }
};
AeInput.formAssociated = true;
AeInput.styles = i`
    /*
     * Tier 3 tokens (--ae-input-bg / -bg-hover / -bg-focus / -border /
     * -border-hover / -border-focus / -fg / -radius / -placeholder) are
     * read inside the .wrapper rules via var(--token, fallback) rather
     * than declared at :host. A :host declaration would be a directly-
     * applied rule on the shadow host that shadows root-level theme
     * overrides via the cascade (inheritance loses to direct rules),
     * which prevents themes from overriding these tokens at :root.<name>.
     * Using var() fallback at the consumption point lets root overrides
     * flow into the shadow root through inheritance.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
      width: 100%;
    }

    .wrapper {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
      width: 100%;
      background: var(--ae-input-bg, var(--ae-color-bg));
      /* Frosted-glass hook: inert (none) for every theme except those that set
       * --ae-surface-backdrop-filter (Crucible). The field bg must be
       * translucent for the blur to refract — Crucible makes --ae-input-bg so. */
      backdrop-filter: var(--ae-input-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-input-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-input-fg, var(--ae-color-fg));
      border: var(--ae-border-width-1) solid
        var(--ae-input-border, var(--ae-color-border-strong));
      border-radius: var(--ae-input-radius, var(--ae-radius-default));
      padding: 0 var(--ae-space-3);
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        box-shadow var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    .wrapper:hover:not(:focus-within) {
      background: var(--ae-input-bg-hover, var(--ae-input-bg, var(--ae-color-bg)));
      border-color: var(--ae-input-border-hover,
        var(--ae-input-border, var(--ae-color-border-strong)));
    }

    .wrapper:focus-within {
      ${focusRing}
      background: var(--ae-input-bg-focus, var(--ae-input-bg, var(--ae-color-bg)));
      border-color: var(--ae-input-border-focus, var(--ae-color-accent));
    }

    :host([invalid]) .wrapper,
    :host([invalid]) .wrapper:hover:not(:focus-within),
    :host([invalid]) .wrapper:focus-within {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .wrapper:focus-within {
      ${invalidRing}
    }

    :host([disabled]) .wrapper {
      background: var(--ae-color-bg-subtle);
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
    }

    :host([readonly]) .wrapper {
      background: var(--ae-color-bg-subtle);
    }

    input {
      all: unset;
      flex: 1 1 auto;
      min-width: 0;
      font: inherit;
      color: inherit;
      background: transparent;
      line-height: 1;
    }
    input::placeholder {
      color: var(--ae-input-placeholder, var(--ae-color-fg-subtle));
      opacity: 1;
    }
    input:disabled {
      cursor: not-allowed;
    }
    /* Remove number-input UA spinners (consistent across sizes/themes). */
    input[type='number']::-webkit-outer-spin-button,
    input[type='number']::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }

    /* Sizes */
    :host([size='sm']) .wrapper {
      font-size: var(--ae-font-size-sm);
      min-height: 1.75rem;
    }
    :host([size='md']) .wrapper {
      font-size: var(--ae-font-size-sm);
      min-height: 2.25rem;
    }
    :host([size='lg']) .wrapper {
      font-size: var(--ae-font-size-md);
      min-height: 2.75rem;
    }
    :host([size='sm']) input { padding: var(--ae-space-1) 0; }
    :host([size='md']) input { padding: var(--ae-space-2) 0; }
    :host([size='lg']) input { padding: var(--ae-space-3) 0; }

    .affix {
      display: inline-flex;
      align-items: center;
      align-self: stretch;
      color: var(--ae-color-fg-muted);
      flex: 0 0 auto;
      background: var(--ae-input-affix-bg, transparent);
      padding: var(--ae-input-affix-padding, 0);
    }
    .affix-start {
      /* Pull the start affix flush against the wrapper's left edge
       * so themes that style it as a paper-2 cell (Metro) read as a
       * contiguous prefix block rather than a floating icon. The
       * negative margin matches the wrapper's horizontal padding. */
      margin-left: var(--ae-input-affix-pull, 0);
      margin-right: var(--ae-input-affix-gap, 0);
      border-right: var(--ae-input-affix-separator, 0 solid transparent);
    }
    .affix-end {
      margin-right: var(--ae-input-affix-pull, 0);
      margin-left: var(--ae-input-affix-gap, 0);
      border-left: var(--ae-input-affix-separator, 0 solid transparent);
    }
    .affix[hidden] { display: none; }

    .clear {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25em;
      height: 1.25em;
      border-radius: 50%;
      cursor: pointer;
      color: var(--ae-color-fg-muted);
      opacity: 0.7;
      transition: opacity var(--ae-duration-fast);
    }
    .clear:hover,
    .clear:focus-visible {
      opacity: 1;
    }
    .clear:focus-visible {
      ${focusRing}
    }

    /* Number stepper (type="number"). A vertical ± strip on the trailing edge,
     * replacing the stripped UA spinners. Geometry defaults to v1's metrics
     * (20x14 buttons, 10px chevrons) so every theme gets a clean spinner and
     * the Spectrum collection matches v1 with no extra overrides; colors flow
     * from semantic tokens so each theme is correct automatically. */
    .stepper {
      display: flex;
      flex-direction: column;
      flex: none;
      align-self: center;
      justify-content: center;
      gap: var(--ae-input-stepper-gap, 1px);
      padding: var(--ae-input-stepper-padding, 0 2px 0 0);
    }
    .stepper-btn {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ae-input-stepper-btn-width, 1.25rem);
      height: var(--ae-input-stepper-btn-height, 0.875rem);
      border-radius: var(--ae-input-stepper-radius, var(--ae-radius-xs));
      color: var(--ae-input-stepper-color, var(--ae-color-fg-muted));
      cursor: pointer;
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        opacity var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .stepper-btn:hover:not(:disabled) {
      color: var(--ae-input-stepper-color-hover, var(--ae-color-fg));
      background: var(--ae-input-stepper-bg-hover, var(--ae-color-hover-overlay));
    }
    .stepper-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }
    .stepper-btn svg {
      width: var(--ae-input-stepper-icon-size, 10px);
      height: var(--ae-input-stepper-icon-size, 10px);
      display: block;
    }

    ${autofillReset}
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeInput.prototype, "type", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeInput.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeInput.prototype, "readonly", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeInput.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeInput.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeInput.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeInput.prototype, "size", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "min", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "max", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "step", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "autocomplete", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "inputmode", 2);
__decorateClass([
  n4({ type: String })
], AeInput.prototype, "pattern", 2);
__decorateClass([
  n4({ type: Boolean })
], AeInput.prototype, "spellcheck", 2);
__decorateClass([
  n4({ type: Boolean })
], AeInput.prototype, "autofocus", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeInput.prototype, "clearable", 2);
__decorateClass([
  r5()
], AeInput.prototype, "_hasStart", 2);
__decorateClass([
  r5()
], AeInput.prototype, "_hasEnd", 2);
__decorateClass([
  e5("input")
], AeInput.prototype, "_input", 2);
AeInput = __decorateClass([
  t3("ae-input")
], AeInput);

// src/components/textarea/ae-textarea.ts
var AeTextarea = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.readonly = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.size = "md";
    this.rows = 3;
    this.autoresize = false;
    this.spellcheck = true;
    /** Forwards host `aria-label` / `aria-description` onto the inner
     *  `<textarea>` so standalone and form-field-wrapped use both name it. */
    this._ariaForward = new ForwardAriaController(this, () => this._ta);
    this._onInput = (e8) => {
      this.value = e8.target.value;
      this.dispatchEvent(
        new CustomEvent("ae-input", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
    this._onChange = () => {
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
    this._internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  }
  render() {
    return b2`
      <div part="wrapper" class="wrapper">
        <textarea
          part="textarea"
          .value=${this.value}
          rows=${this.rows}
          placeholder=${this.placeholder || A}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-invalid=${this.invalid ? "true" : A}
          name=${this.name || A}
          maxlength=${this.maxlength ?? A}
          minlength=${this.minlength ?? A}
          spellcheck=${this.spellcheck ? A : "false"}
          @input=${this._onInput}
          @change=${this._onChange}
        ></textarea>
      </div>
    `;
  }
  updated(changed) {
    if (changed.has("value") || changed.has("required")) {
      this._syncFormState();
    }
    if (this.autoresize && changed.has("value") && !this._supportsFieldSizing()) {
      this._autosize();
    }
  }
  _supportsFieldSizing() {
    return CSS?.supports?.("field-sizing", "content") ?? false;
  }
  _autosize() {
    const ta = this._ta;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }
  _syncFormState() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && this.value === "") {
      this._internals.setValidity({ valueMissing: true }, "Please fill out this field.", this._ta);
    } else {
      this._internals.setValidity({});
    }
  }
  focus(options) {
    this._ta?.focus(options);
  }
  blur() {
    this._ta?.blur();
  }
  formResetCallback() {
    this.value = "";
  }
};
AeTextarea.formAssociated = true;
AeTextarea.styles = i`
    /*
     * Tier 3 tokens read via var(--token, fallback) instead of declared
     * at :host — see the equivalent comment in ae-input.ts for the
     * cascade-shadowing reasoning.
     */
    :host {
      display: inline-flex;
      vertical-align: top;
      width: 100%;
    }

    .wrapper {
      box-sizing: border-box;
      display: flex;
      width: 100%;
      background: var(--ae-textarea-bg, var(--ae-color-bg));
      /* Frosted-glass hook — see ae-input.ts. Inert unless a theme sets
       * --ae-surface-backdrop-filter and a translucent --ae-textarea-bg. */
      backdrop-filter: var(--ae-textarea-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-textarea-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-textarea-fg, var(--ae-color-fg));
      border: var(--ae-border-width-1) solid
        var(--ae-textarea-border, var(--ae-color-border-strong));
      border-radius: var(--ae-textarea-radius, var(--ae-radius-default));
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        box-shadow var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    .wrapper:hover:not(:focus-within) {
      background: var(--ae-textarea-bg-hover, var(--ae-textarea-bg, var(--ae-color-bg)));
      border-color: var(--ae-textarea-border-hover,
        var(--ae-textarea-border, var(--ae-color-border-strong)));
    }

    .wrapper:focus-within {
      ${focusRing}
      background: var(--ae-textarea-bg-focus, var(--ae-textarea-bg, var(--ae-color-bg)));
      border-color: var(--ae-textarea-border-focus, var(--ae-color-accent));
    }

    :host([invalid]) .wrapper,
    :host([invalid]) .wrapper:hover:not(:focus-within),
    :host([invalid]) .wrapper:focus-within {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .wrapper:focus-within {
      ${invalidRing}
    }

    :host([disabled]) .wrapper {
      background: var(--ae-color-bg-subtle);
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
    }
    :host([readonly]) .wrapper {
      background: var(--ae-color-bg-subtle);
    }

    textarea {
      all: unset;
      flex: 1 1 auto;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      font: inherit;
      color: inherit;
      background: transparent;
      line-height: var(--ae-line-height-normal);
      resize: vertical;
      padding: var(--ae-space-2) var(--ae-space-3);
    }
    textarea::placeholder {
      color: var(--ae-textarea-placeholder, var(--ae-color-fg-subtle));
      opacity: 1;
    }
    textarea:disabled {
      cursor: not-allowed;
      resize: none;
    }

    /* Native sizing-with-content where supported. */
    :host([autoresize]) textarea {
      field-sizing: content;
      resize: none;
    }

    /* Sizes */
    :host([size='sm']) .wrapper { font-size: var(--ae-font-size-sm); }
    :host([size='md']) .wrapper { font-size: var(--ae-font-size-sm); }
    :host([size='lg']) .wrapper { font-size: var(--ae-font-size-md); }

    ${autofillReset}
  `;
__decorateClass([
  n4({ type: String })
], AeTextarea.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], AeTextarea.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTextarea.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTextarea.prototype, "readonly", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTextarea.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTextarea.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTextarea.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTextarea.prototype, "size", 2);
__decorateClass([
  n4({ type: Number })
], AeTextarea.prototype, "rows", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTextarea.prototype, "autoresize", 2);
__decorateClass([
  n4({ type: Number })
], AeTextarea.prototype, "maxlength", 2);
__decorateClass([
  n4({ type: Number })
], AeTextarea.prototype, "minlength", 2);
__decorateClass([
  n4({ type: Boolean })
], AeTextarea.prototype, "spellcheck", 2);
__decorateClass([
  e5("textarea")
], AeTextarea.prototype, "_ta", 2);
AeTextarea = __decorateClass([
  t3("ae-textarea")
], AeTextarea);

// src/components/checkbox/ae-checkbox.ts
var AeCheckbox = class extends i4 {
  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.value = "on";
    /** Forwards a host-level `aria-label`/`aria-description` (e.g. from a
     *  wrapping `ae-form-field`) onto the inner role="checkbox" button. */
    this._ariaForward = new ForwardAriaController(this, () => this._btn);
    this._onToggle = () => {
      if (this.disabled) return;
      if (this.indeterminate) {
        this.indeterminate = false;
        this.checked = true;
      } else {
        this.checked = !this.checked;
      }
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { checked: this.checked }
        })
      );
    };
    this._onKeyDown = (e8) => {
      if (e8.key === " " || e8.code === "Space") {
        e8.preventDefault();
        this._onToggle();
      }
    };
    this._internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  }
  render() {
    let ariaChecked = "false";
    if (this.indeterminate) ariaChecked = "mixed";
    else if (this.checked) ariaChecked = "true";
    return b2`
      <button
        class="host-button"
        type="button"
        role="checkbox"
        aria-checked=${ariaChecked}
        aria-disabled=${this.disabled ? "true" : A}
        aria-required=${this.required ? "true" : A}
        aria-invalid=${this.invalid ? "true" : A}
        ?disabled=${this.disabled}
        @click=${this._onToggle}
        @keydown=${this._onKeyDown}
      >
        <span part="control" class="control">
          ${this.indeterminate ? b2`<svg class="icon" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 7 L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>` : this.checked ? b2`<svg class="icon" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M3 7 L6 10 L11 4"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>` : A}
        </span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }
  updated(changed) {
    if (changed.has("checked") || changed.has("required")) {
      this._syncFormState();
    }
  }
  _syncFormState() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.checked ? this.value : null);
    if (this.required && !this.checked) {
      this._internals.setValidity({ valueMissing: true }, "Please check this box if you want to proceed.", this._btn);
    } else {
      this._internals.setValidity({});
    }
  }
  focus(options) {
    this._btn?.focus(options);
  }
  blur() {
    this._btn?.blur();
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
    this.indeterminate = this.hasAttribute("indeterminate");
  }
};
AeCheckbox.formAssociated = true;
AeCheckbox.styles = i`
    /*
     * Theme-overridable tokens (--ae-checkbox-bg, -bg-checked, -border,
     * -border-checked, -fg, -radius) are NOT declared at :host — a :host
     * declaration would shadow inherited root-level theme overrides
     * because directly-applied rules win over inheritance. They are
     * resolved at the consumption point below via var(--token, default)
     * so themes can override them at :root.<theme> and the values
     * cascade into the shadow root through inheritance. Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .host-button {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
      cursor: pointer;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      line-height: var(--ae-line-height-snug);
    }

    .host-button:focus-visible .control {
      ${focusRing}
    }

    .control {
      box-sizing: border-box;
      width: 1.125rem;
      height: 1.125rem;
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--ae-checkbox-bg, var(--ae-color-bg));
      border: var(--ae-checkbox-border-width, var(--ae-border-width-1)) solid
        var(--ae-checkbox-border, var(--ae-color-border-strong));
      border-radius: var(--ae-checkbox-radius, var(--ae-radius-sm));
      color: var(--ae-checkbox-fg, var(--ae-color-fg-on-accent));
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([checked]) .control,
    :host([indeterminate]) .control {
      background: var(--ae-checkbox-bg-checked, var(--ae-color-accent));
      border-color: var(--ae-checkbox-border-checked, var(--ae-color-accent));
      /* Bioluminescent accent: a brand (Crucible) can set a molten glow on the
       * checked box without forking the component. Default none. */
      box-shadow: var(--ae-checkbox-glow, none);
    }

    :host([disabled]) .host-button {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    /* Invalid: recolor the indicator border to danger. Placed AFTER the
     * checked/indeterminate rule so the danger border wins in every state,
     * matching ae-input's "always danger when invalid" behavior. */
    :host([invalid]) .control {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .host-button:focus-visible .control {
      ${invalidRing}
    }

    .icon {
      width: var(--ae-checkbox-icon-size, 0.875rem);
      height: var(--ae-checkbox-icon-size, 0.875rem);
      display: block;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCheckbox.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCheckbox.prototype, "indeterminate", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCheckbox.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCheckbox.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCheckbox.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeCheckbox.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], AeCheckbox.prototype, "value", 2);
__decorateClass([
  e5(".host-button")
], AeCheckbox.prototype, "_btn", 2);
AeCheckbox = __decorateClass([
  t3("ae-checkbox")
], AeCheckbox);

// src/components/radio/ae-radio.ts
var groups = /* @__PURE__ */ new Map();
function registerRadio(r6) {
  if (!r6.name) return;
  let set = groups.get(r6.name);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    groups.set(r6.name, set);
  }
  set.add(r6);
}
function unregisterRadio(r6) {
  if (!r6.name) return;
  const set = groups.get(r6.name);
  if (!set) return;
  set.delete(r6);
  if (set.size === 0) groups.delete(r6.name);
}
function siblings(r6) {
  const set = groups.get(r6.name);
  if (!set) return [];
  return [...set].filter((other) => other !== r6 && other.isConnected);
}
var AeRadio = class extends i4 {
  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.value = "on";
    this._previousName = "";
    /** Forwards a host-level `aria-label`/`aria-description` (e.g. from a
     *  wrapping `ae-form-field`) onto the inner role="radio" button. */
    this._ariaForward = new ForwardAriaController(this, () => this._btn);
    this._onClick = () => {
      if (this.disabled || this.checked) return;
      this.checked = true;
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
    this._onKeyDown = (e8) => {
      if (this.disabled) return;
      if (e8.key === " " || e8.code === "Space") {
        e8.preventDefault();
        this._onClick();
        return;
      }
      if (e8.key === "ArrowRight" || e8.key === "ArrowDown" || e8.key === "ArrowLeft" || e8.key === "ArrowUp") {
        e8.preventDefault();
        this._moveFocus(e8.key === "ArrowRight" || e8.key === "ArrowDown" ? 1 : -1);
      }
    };
    this._internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  }
  connectedCallback() {
    super.connectedCallback();
    registerRadio(this);
    this._previousName = this.name;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    unregisterRadio(this);
  }
  render() {
    return b2`
      <button
        class="host-button"
        type="button"
        role="radio"
        aria-checked=${this.checked ? "true" : "false"}
        aria-disabled=${this.disabled ? "true" : A}
        aria-required=${this.required ? "true" : A}
        aria-invalid=${this.invalid ? "true" : A}
        ?disabled=${this.disabled}
        tabindex=${this._tabindexValue()}
        @click=${this._onClick}
        @keydown=${this._onKeyDown}
      >
        <span part="control" class="control"><span class="dot"></span></span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }
  updated(changed) {
    if (changed.has("name")) {
      const prev = this._previousName;
      if (prev) {
        const set = groups.get(prev);
        if (set) {
          set.delete(this);
          if (set.size === 0) groups.delete(prev);
        }
      }
      registerRadio(this);
      this._previousName = this.name;
    }
    if (changed.has("checked")) {
      this._syncFormState();
      if (this.checked) {
        for (const other of siblings(this)) {
          if (other.checked) other.checked = false;
        }
      }
    }
    if (changed.has("required")) {
      this._syncFormState();
    }
  }
  _tabindexValue() {
    if (this.disabled) return "-1";
    const set = groups.get(this.name);
    if (!set || set.size === 0) return "0";
    const anyChecked = [...set].some((r6) => r6.checked);
    if (anyChecked) return this.checked ? "0" : "-1";
    const first = [...set].find((r6) => r6.isConnected);
    return first === this ? "0" : "-1";
  }
  _syncFormState() {
    if (typeof this._internals?.setFormValue !== "function") return;
    if (this.checked) {
      this._internals.setFormValue(this.value);
    } else {
      this._internals.setFormValue(null);
    }
    const groupRequired = [...groups.get(this.name) ?? []].some((r6) => r6.required);
    const groupChecked = [...groups.get(this.name) ?? []].some((r6) => r6.checked);
    if (groupRequired && !groupChecked) {
      this._internals.setValidity({ valueMissing: true }, "Please select one of these options.", this._btn);
    } else {
      this._internals.setValidity({});
    }
  }
  _moveFocus(delta) {
    const set = groups.get(this.name);
    if (!set) return;
    const list = [...set].filter((r6) => !r6.disabled && r6.isConnected);
    if (list.length === 0) return;
    const i7 = list.indexOf(this);
    if (i7 === -1) return;
    const next = list[(i7 + delta + list.length) % list.length];
    next.checked = true;
    next.focus();
    next.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { value: next.value }
      })
    );
  }
  focus(options) {
    this._btn?.focus(options);
  }
  blur() {
    this._btn?.blur();
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
};
AeRadio.formAssociated = true;
AeRadio.styles = i`
    /*
     * Theme-overridable tokens (--ae-radio-bg, -bg-checked, -border,
     * -border-checked) are NOT declared at :host — :host declarations
     * would shadow inherited root-level theme overrides. Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .host-button {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
      cursor: pointer;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      line-height: var(--ae-line-height-snug);
    }

    .host-button:focus-visible .control {
      ${focusRing}
      outline-offset: 3px;
    }

    .control {
      box-sizing: border-box;
      width: 1.125rem;
      height: 1.125rem;
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--ae-radio-bg, var(--ae-color-bg));
      border: var(--ae-border-width-1) solid
        var(--ae-radio-border, var(--ae-color-border-strong));
      border-radius: 50%;
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([checked]) .control {
      border-color: var(--ae-radio-border-checked, var(--ae-color-accent));
      /* Bioluminescent accent — see ae-checkbox.ts. Default none. */
      box-shadow: var(--ae-radio-glow, none);
    }

    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--ae-radio-bg-checked, var(--ae-color-accent));
      transform: scale(0);
      transition: transform var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([checked]) .dot {
      transform: scale(1);
    }

    :host([disabled]) .host-button {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    /* Invalid: recolor the ring border to danger. Placed AFTER the checked
     * rule so the danger border wins in every state, matching ae-input. */
    :host([invalid]) .control {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .host-button:focus-visible .control {
      ${invalidRing}
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeRadio.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeRadio.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeRadio.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeRadio.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeRadio.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], AeRadio.prototype, "value", 2);
__decorateClass([
  e5(".host-button")
], AeRadio.prototype, "_btn", 2);
AeRadio = __decorateClass([
  t3("ae-radio")
], AeRadio);

// src/components/radio/ae-radio-group.ts
var AeRadioGroup = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
    this.hideLabel = false;
    this.name = "";
    this.required = false;
    this.orientation = "vertical";
    this._legendId = `ae-radio-group-legend-${++AeRadioGroup._idSeq}`;
    this._onSlotChange = () => {
      this._forwardName();
    };
  }
  updated(changed) {
    if (changed.has("name")) {
      this._forwardName();
    }
  }
  /** Forward the group `name` to child radios that don't declare their own. */
  _forwardName() {
    if (!this.name) return;
    const radios = Array.from(
      this.querySelectorAll(":scope > ae-radio")
    );
    for (const radio of radios) {
      if (!radio.getAttribute("name")) radio.setAttribute("name", this.name);
    }
  }
  render() {
    const hasLabel = this.label || this._hasLabelSlot;
    return b2`
      ${hasLabel ? b2`<span
            part="legend"
            class="legend ${this.hideLabel ? "hidden" : ""}"
            id=${this._legendId}
          >
            ${this.label ? b2`${this.label}` : b2`<slot name="label"></slot>`}
            ${this.required ? b2`<span class="required-mark" aria-hidden="true">*</span>` : A}
          </span>` : A}
      <div
        part="group"
        class="group"
        role="radiogroup"
        aria-labelledby=${hasLabel ? this._legendId : A}
        aria-required=${this.required ? "true" : A}
      >
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
  get _hasLabelSlot() {
    return this.querySelector(':scope > [slot="label"]') !== null;
  }
};
AeRadioGroup._idSeq = 0;
AeRadioGroup.styles = i`
    :host {
      display: inline-flex;
      flex-direction: column;
      gap: var(--ae-space-2);
      font-family: var(--ae-font-family-sans);
    }
    .legend {
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-font-weight-medium);
      color: var(--ae-color-fg);
      line-height: var(--ae-line-height-snug);
    }
    .legend.hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .required-mark {
      /* Danger glyph on the page bg — text-tuned -emphasis stop, matching
       * ae-form-field's required mark and the library-wide danger-text convention. */
      color: var(--ae-color-danger-emphasis);
      margin-left: 2px;
    }
    .group {
      display: flex;
      flex-direction: column;
      gap: var(--ae-space-2);
    }
    :host([orientation='horizontal']) .group {
      flex-direction: row;
      gap: var(--ae-space-4);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeRadioGroup.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "hide-label" })
], AeRadioGroup.prototype, "hideLabel", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeRadioGroup.prototype, "name", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeRadioGroup.prototype, "required", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeRadioGroup.prototype, "orientation", 2);
AeRadioGroup = __decorateClass([
  t3("ae-radio-group")
], AeRadioGroup);

// src/components/switch/ae-switch.ts
var AeSwitch = class extends i4 {
  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.value = "on";
    this.label = "";
    this.size = "md";
    /** Forwards a host-level `aria-label`/`aria-description` (e.g. set by a
     *  wrapping `ae-form-field`) onto the inner role="switch" button so it is
     *  named — host ARIA does not reach the shadow control. */
    this._ariaForward = new ForwardAriaController(this, () => this._btn);
    this._onToggle = () => {
      if (this.disabled) return;
      this.checked = !this.checked;
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { checked: this.checked }
        })
      );
    };
    this._onKeyDown = (e8) => {
      if (e8.key === " " || e8.code === "Space") {
        e8.preventDefault();
        this._onToggle();
      }
    };
    this._internals = typeof this.attachInternals === "function" ? this.attachInternals() : null;
  }
  render() {
    return b2`
      <button
        class="host-button"
        type="button"
        role="switch"
        aria-checked=${this.checked ? "true" : "false"}
        aria-disabled=${this.disabled ? "true" : A}
        aria-required=${this.required ? "true" : A}
        aria-invalid=${this.invalid ? "true" : A}
        aria-label=${this.label || A}
        ?disabled=${this.disabled}
        @click=${this._onToggle}
        @keydown=${this._onKeyDown}
      >
        <span part="track" class="track">
          <span part="thumb" class="thumb"></span>
        </span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }
  updated(changed) {
    if (changed.has("checked") || changed.has("required")) {
      this._syncFormState();
    }
  }
  _syncFormState() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.checked ? this.value : null);
    if (this.required && !this.checked) {
      this._internals.setValidity({ valueMissing: true }, "Please toggle this switch.", this._btn);
    } else {
      this._internals.setValidity({});
    }
  }
  focus(options) {
    this._btn?.focus(options);
  }
  blur() {
    this._btn?.blur();
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
};
AeSwitch.formAssociated = true;
AeSwitch.styles = i`
    /*
     * Theme-overridable tokens (--ae-switch-bg, -bg-checked, -thumb,
     * -thumb-checked, -radius, -thumb-radius, -border-shadow) are NOT
     * declared at :host — :host declarations would shadow inherited
     * root-level theme overrides. Resolved at consumption point via
     * var(--token, default). Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .host-button {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
      cursor: pointer;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      line-height: var(--ae-line-height-snug);
    }

    .host-button:focus-visible .track {
      ${focusRing}
    }

    /* The md track size, thumb inset, and thumb shadow are tokenized so a
     * brand can resize the toggle (the Spectrum collection runs v1's larger
     * 40x22 track on a 3px inset). The thumb size and travel are DERIVED from
     * the track + inset so they stay self-consistent at any size:
     *   thumb  = track-height - 2*inset
     *   travel = track-width  - track-height
     * Both default calcs reduce to the prior literals, so default rendering is
     * byte-identical. */
    .track {
      box-sizing: border-box;
      position: relative;
      display: inline-block;
      width: var(--ae-switch-track-width, 2.25rem);
      height: var(--ae-switch-track-height, 1.25rem);
      background: var(--ae-switch-bg, var(--ae-color-border-strong));
      border-radius: var(--ae-switch-radius, var(--ae-radius-full));
      box-shadow: var(--ae-switch-border-shadow, none);
      transition: background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
      flex: 0 0 auto;
    }

    .thumb {
      position: absolute;
      top: var(--ae-switch-thumb-inset, 2px);
      left: var(--ae-switch-thumb-inset, 2px);
      width: calc(var(--ae-switch-track-height, 1.25rem) - 2 * var(--ae-switch-thumb-inset, 2px));
      height: calc(var(--ae-switch-track-height, 1.25rem) - 2 * var(--ae-switch-thumb-inset, 2px));
      background: var(--ae-switch-thumb, var(--ae-color-bg));
      border-radius: var(--ae-switch-thumb-radius, 50%);
      box-shadow: var(--ae-switch-thumb-shadow, var(--ae-shadow-xs));
      transition:
        transform var(--ae-duration-fast) var(--ae-easing-ease-out),
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([checked]) .track {
      background: var(--ae-switch-bg-checked, var(--ae-color-accent));
      /* Bioluminescent accent: a molten glow on the "on" track. Falls back to
       * the resting border-shadow so non-glow themes are unchanged. */
      box-shadow: var(--ae-switch-glow, var(--ae-switch-border-shadow, none));
    }

    :host([checked]) .thumb {
      transform: translateX(calc(var(--ae-switch-track-width, 2.25rem) - var(--ae-switch-track-height, 1.25rem)));
      background: var(--ae-switch-thumb-checked,
        var(--ae-switch-thumb, var(--ae-color-bg)));
    }

    /* Sizes (v2-only — v1 ships a single toggle size). Thumb sizes derive from
     * the shared inset token so they stay centered under any brand's inset. */
    :host([size='sm']) .track { width: 1.75rem; height: 1rem; }
    :host([size='sm']) .thumb {
      width: calc(1rem - 2 * var(--ae-switch-thumb-inset, 2px));
      height: calc(1rem - 2 * var(--ae-switch-thumb-inset, 2px));
    }
    :host([size='sm'][checked]) .thumb { transform: translateX(calc(1.75rem - 1rem)); }

    :host([size='lg']) .track { width: 2.75rem; height: 1.5rem; }
    :host([size='lg']) .thumb {
      width: calc(1.5rem - 2 * var(--ae-switch-thumb-inset, 2px));
      height: calc(1.5rem - 2 * var(--ae-switch-thumb-inset, 2px));
    }
    :host([size='lg'][checked]) .thumb { transform: translateX(calc(2.75rem - 1.5rem)); }

    :host([disabled]) .host-button {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    /* Invalid: the track is a filled pill with no border, so signal the
     * error with a danger outline ring around it. When focused, the focus
     * ring takes over the outline and invalidRing recolors it to danger so
     * the two states stay visually consistent. */
    :host([invalid]) .track {
      outline: var(--ae-focus-ring-width) solid var(--ae-color-danger);
      outline-offset: 2px;
    }
    :host([invalid]) .host-button:focus-visible .track {
      ${invalidRing}
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSwitch.prototype, "checked", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSwitch.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSwitch.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSwitch.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSwitch.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], AeSwitch.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], AeSwitch.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSwitch.prototype, "size", 2);
__decorateClass([
  e5(".host-button")
], AeSwitch.prototype, "_btn", 2);
AeSwitch = __decorateClass([
  t3("ae-switch")
], AeSwitch);

// src/components/form-field/ae-form-field.ts
var AeFormField = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
    this.helper = "";
    this.error = "";
    this.required = false;
    this.disabled = false;
    this._controlId = `ae-form-field-${++AeFormField._idSeq}`;
    /** Effective id used for the `<label for="…">`. Updates if the slotted control already has an id. */
    this._labelTargetId = this._controlId;
    this._hasSingleControl = true;
    this._hasSlotMap = /* @__PURE__ */ new Map();
    this._onSlotChange = (e8) => {
      const slot = e8.target;
      const nodes = slot.assignedNodes({ flatten: true }).filter(
        (n6) => n6.nodeType === Node.ELEMENT_NODE
      );
      if (!slot.name) {
        this._hasSingleControl = nodes.length === 1;
        const control = nodes[0];
        if (control) {
          if (!control.id) control.id = this._controlId;
          this._labelTargetId = control.id;
          this._applyStateToControl(control);
        }
      } else {
        this._hasSlotMap.set(slot.name, nodes.length > 0);
        const control = this.shadowRoot?.querySelector("slot:not([name])")?.assignedElements({ flatten: true })[0];
        if (control) this._applyStateToControl(control);
      }
      this.requestUpdate();
    };
  }
  render() {
    const hasError = this.error !== "";
    const labelId = `${this._controlId}-label`;
    const helperId = `${this._controlId}-helper`;
    const errorId = `${this._controlId}-error`;
    return b2`
      ${this.label || this._hasSlot("label") ? b2`<label
            part="label"
            class="label"
            id=${labelId}
            for=${this._labelTargetId}
          >
            ${this.label ? b2`${this.label}` : b2`<slot name="label"></slot>`}
            ${this.required ? b2`<span class="required-mark" aria-hidden="true">*</span>` : A}
          </label>` : A}

      <div
        class="control-wrap"
        role=${this._hasSingleControl ? A : "group"}
        aria-labelledby=${this._hasSingleControl ? A : this.label || this._hasSlot("label") ? labelId : A}
      >
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>

      ${hasError ? b2`<div part="error" class="error" id=${errorId} role="alert">
            ${this.error || b2`<slot name="error"></slot>`}
          </div>` : this.helper || this._hasSlot("helper") ? b2`<div part="helper" class="helper" id=${helperId}>
              ${this.helper || b2`<slot name="helper"></slot>`}
            </div>` : A}
    `;
  }
  _hasSlot(name) {
    return this._hasSlotMap.get(name) === true;
  }
  updated(changed) {
    if (changed.has("error") || changed.has("required") || changed.has("disabled") || changed.has("label")) {
      const slot = this.shadowRoot?.querySelector("slot:not([name])");
      const control = slot?.assignedElements({ flatten: true })[0];
      if (control) this._applyStateToControl(control);
    }
  }
  _applyStateToControl(control) {
    if (this.error) {
      control.setAttribute("invalid", "");
      control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("invalid");
      control.removeAttribute("aria-invalid");
    }
    if (this.required) {
      control.setAttribute("required", "");
    }
    if (this.disabled) {
      control.setAttribute("disabled", "");
    }
    if (!control.id) {
      control.id = this._controlId;
    }
    control.removeAttribute("aria-describedby");
    const labelText = this._labelText;
    if (labelText) {
      const owns = control.hasAttribute("data-ae-field-label");
      if (owns || !control.hasAttribute("aria-label")) {
        control.setAttribute("aria-label", labelText);
        control.setAttribute("data-ae-field-label", "");
      }
    } else if (control.hasAttribute("data-ae-field-label")) {
      control.removeAttribute("aria-label");
      control.removeAttribute("data-ae-field-label");
    }
    const descText = this._descriptionText;
    if (descText) {
      control.setAttribute("aria-description", descText);
      control.setAttribute("data-ae-field-desc", "");
    } else if (control.hasAttribute("data-ae-field-desc")) {
      control.removeAttribute("aria-description");
      control.removeAttribute("data-ae-field-desc");
    }
  }
  /** Visible label text, from the `label` attribute or the label slot. */
  get _labelText() {
    return (this.label || this._slotText("label")).trim();
  }
  /** The active description text: error takes precedence over helper. */
  get _descriptionText() {
    if (this.error || this._hasSlot("error")) {
      return (this.error || this._slotText("error")).trim();
    }
    if (this.helper || this._hasSlot("helper")) {
      return (this.helper || this._slotText("helper")).trim();
    }
    return "";
  }
  _slotText(name) {
    const slot = this.shadowRoot?.querySelector(
      `slot[name="${name}"]`
    );
    if (!slot) return "";
    return slot.assignedNodes({ flatten: true }).map((n6) => n6.textContent ?? "").join(" ").trim();
  }
};
AeFormField._idSeq = 0;
AeFormField.styles = i`
    :host {
      --ae-form-field-gap: var(--ae-space-1);
      --ae-form-field-label-fg: var(--ae-color-fg);
      --ae-form-field-helper-fg: var(--ae-color-fg-muted);
      /* Error text sits ON the page bg, so it uses the text-tuned -emphasis
       * danger stop — the same token alert / toast / tag / link use for danger
       * text. (Plain --ae-color-danger is the FILL stop, darkened on some dark
       * themes so white text crosses AA on a danger button; as text-on-bg it can
       * fall under 4.5:1 — e.g. editorial, where it measured 2.75:1.) */
      --ae-form-field-error-fg: var(--ae-color-danger-emphasis);

      display: flex;
      flex-direction: column;
      gap: var(--ae-form-field-gap);
      font-family: var(--ae-font-family-sans);
    }

    .label {
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-font-weight-medium);
      color: var(--ae-form-field-label-fg);
      line-height: var(--ae-line-height-snug);
    }
    .required-mark {
      /* Danger glyph on the page bg — text-tuned -emphasis stop (see error-fg). */
      color: var(--ae-color-danger-emphasis);
      margin-left: 2px;
    }

    .helper {
      font-size: var(--ae-font-size-xs);
      color: var(--ae-form-field-helper-fg);
      line-height: var(--ae-line-height-snug);
    }

    .error {
      font-size: var(--ae-font-size-xs);
      color: var(--ae-form-field-error-fg);
      line-height: var(--ae-line-height-snug);
    }

    ::slotted(*) {
      margin-top: var(--ae-space-1);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeFormField.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeFormField.prototype, "helper", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeFormField.prototype, "error", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFormField.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFormField.prototype, "disabled", 2);
AeFormField = __decorateClass([
  t3("ae-form-field")
], AeFormField);

// src/components/ghost-field/ae-ghost-field.ts
var AeGhostField = class extends i4 {
  render() {
    return b2`<slot></slot>`;
  }
};
AeGhostField.styles = i`
    :host {
      display: block;
      /* Resting: null the slotted control's chrome color so it looks like
         static text. The border BOX is preserved by the control itself, so the
         reveal below is zero-layout-shift. */
      --ae-input-bg: transparent;
      --ae-input-border: transparent;
      --ae-textarea-bg: transparent;
      --ae-textarea-border: transparent;
      --ae-select-bg: transparent;
      --ae-select-border: transparent;
    }

    /* Reveal on hover or while editing: inherit hands each token back to the
       control, which then falls through to its own var(--tok, fallback)
       default (theme-aware) — including its native :hover / :focus chrome. */
    :host(:hover),
    :host(:focus-within) {
      --ae-input-bg: inherit;
      --ae-input-border: inherit;
      --ae-textarea-bg: inherit;
      --ae-textarea-border: inherit;
      --ae-select-bg: inherit;
      --ae-select-border: inherit;
    }

    ::slotted(*) {
      width: 100%;
    }
  `;
AeGhostField = __decorateClass([
  t3("ae-ghost-field")
], AeGhostField);

// src/shared/aom-refs.ts
function supports(prop) {
  return typeof Element !== "undefined" && prop in Element.prototype;
}
function assignIdl(host, prop, value) {
  host[prop] = value;
}
function setSingleRef(host, idlProp, attr, target) {
  if (supports(idlProp)) {
    assignIdl(host, idlProp, target);
    host.removeAttribute(attr);
  } else if (target && target.id) {
    host.setAttribute(attr, target.id);
  } else {
    host.removeAttribute(attr);
  }
}
function setListRef(host, idlProp, attr, targets) {
  const clean = targets.filter((t5) => !!t5);
  if (supports(idlProp)) {
    assignIdl(host, idlProp, clean.length ? clean : null);
    host.removeAttribute(attr);
  } else {
    const ids = clean.map((t5) => t5.id).filter(Boolean);
    if (ids.length) host.setAttribute(attr, ids.join(" "));
    else host.removeAttribute(attr);
  }
}
function setActiveDescendant(host, target) {
  setSingleRef(host, "ariaActiveDescendantElement", "aria-activedescendant", target);
}
function setControls(host, targets) {
  setListRef(host, "ariaControlsElements", "aria-controls", targets);
}
function setLabelledBy(host, targets) {
  setListRef(host, "ariaLabelledByElements", "aria-labelledby", targets);
}

// src/components/select/ae-option.ts
var AeOption = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = null;
    this.disabled = false;
    this.active = false;
    this.selected = false;
    this.filterHidden = false;
  }
  /** Resolves the display label: explicit attribute, else slotted text. */
  get textLabel() {
    if (this.label !== null && this.label !== "") return this.label;
    return (this.textContent ?? "").trim();
  }
  render() {
    return b2`
      <span part="option" class="row" role="presentation">
        <svg
          class="check"
          viewBox="0 0 16 16"
          aria-hidden="true"
          width="12"
          height="12"
        >
          <path
            d="M3 8 L7 12 L13 4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <slot></slot>
      </span>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "option");
    }
  }
  /**
   * Mirror the parent-driven selection and disabled state onto the ARIA
   * attributes a `role="option"` requires. The `selected` / `disabled`
   * boolean attributes are styling hooks the parent toggles; on their own
   * they carry no semantics, so assistive technology never hears which
   * option is chosen or which are unavailable. `aria-selected` is emitted
   * unconditionally as `true`/`false` (the listbox option contract), while
   * `aria-disabled` is present only when the option is disabled.
   */
  updated() {
    this.setAttribute("aria-selected", this.selected ? "true" : "false");
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }
};
AeOption.styles = i`
    :host {
      --ae-option-bg-active: var(--ae-color-bg-muted);
      --ae-option-fg-active: var(--ae-color-fg);
      --ae-option-bg-selected: var(--ae-color-accent-subtle);
      --ae-option-padding-y: var(--ae-space-2);
      --ae-option-padding-x: var(--ae-space-3);

      display: block;
      cursor: pointer;
      user-select: none;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      border-radius: var(--ae-radius-sm);
      line-height: var(--ae-line-height-snug);
    }

    :host([disabled]) {
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
    }

    :host([active]:not([disabled])) {
      background: var(--ae-option-bg-active);
      color: var(--ae-option-fg-active);
    }

    :host([selected]) {
      background: var(--ae-option-bg-selected);
      color: var(--ae-color-accent-emphasis);
      font-weight: var(--ae-font-weight-medium);
    }

    :host([filter-hidden]) {
      display: none;
    }

    /*
     * Padding lives on the row, NOT on :host. A consumer's global reset such
     * as \`* { padding: 0 }\` is a document-tree declaration, and in the cascade
     * a normal document declaration overrides a normal \`:host\` declaration —
     * so host padding silently collapses to 0 under such a reset (a very
     * common one). A document-scope \`*\` selector cannot reach an element
     * inside this shadow tree, so the row's padding is immune. The
     * \`--ae-option-padding-*\` custom props (defined on :host) still drive it,
     * so per-instance overrides keep working.
     */
    .row {
      display: flex;
      align-items: center;
      gap: var(--ae-space-2);
      padding: var(--ae-option-padding-y) var(--ae-option-padding-x);
    }

    .check {
      width: 1em;
      height: 1em;
      flex: none;
      opacity: 0;
    }
    :host([selected]) .check {
      opacity: 1;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeOption.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeOption.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeOption.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeOption.prototype, "active", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeOption.prototype, "selected", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "filter-hidden" })
], AeOption.prototype, "filterHidden", 2);
AeOption = __decorateClass([
  t3("ae-option")
], AeOption);

// src/components/select/ae-select.ts
var AeSelect = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.placeholder = "Select\u2026";
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.multiple = false;
    this.name = "";
    this.size = "md";
    this._open = false;
    this._activeId = "";
    /** Forwards host `aria-label` / `aria-description` onto the combobox
     *  trigger button so an enclosing `<ae-form-field>` (or a standalone
     *  `aria-label`) names the control AT focuses. */
    this._ariaForward = new ForwardAriaController(this, () => this._trigger);
    this._typeBuffer = "";
    this._typeTimer = 0;
    this._listboxId = `ae-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
    this._docListenersBound = false;
    this._listboxEl = null;
    /** True when the open listbox is a top-layer popover (in the shadow root);
     *  false when it falls back to the legacy `document.body` portal. */
    this._popover = false;
    this._onScrollOrResize = () => {
      this._positionListbox();
    };
    this._onDocPointerDown = (e8) => {
      const target = e8.target;
      if (!target) return;
      if (this.contains(target)) return;
      if (this._listboxEl && this._listboxEl.contains(target)) return;
      this._open = false;
    };
    // -- Event handlers --------------------------------------------------
    this._onSlotChange = () => {
      this._syncSelectionFlags();
    };
    this._onTriggerClick = (e8) => {
      if (this.disabled) return;
      e8.preventDefault();
      this._open = !this._open;
    };
    this._onTriggerBlur = (e8) => {
      const next = e8.relatedTarget;
      if (next && this._listboxEl && this._listboxEl.contains(next)) return;
      queueMicrotask(() => {
        const active = document.activeElement;
        if (active && this._listboxEl && this._listboxEl.contains(active)) return;
        if (active === this._trigger) return;
        this._open = false;
      });
    };
    this._onTriggerKeyDown = (e8) => {
      if (this.disabled) return;
      const key = e8.key;
      if (!this._open) {
        if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
          e8.preventDefault();
          this._open = true;
          return;
        }
        if (key.length === 1 && /\S/.test(key)) {
          this._open = true;
          this._typeahead(key);
          return;
        }
        return;
      }
      switch (key) {
        case "Escape":
          e8.preventDefault();
          this._open = false;
          this._trigger?.focus();
          return;
        case "ArrowDown":
          e8.preventDefault();
          this._moveActive(1);
          return;
        case "ArrowUp":
          e8.preventDefault();
          this._moveActive(-1);
          return;
        case "Home":
          e8.preventDefault();
          this._moveToEdge("start");
          return;
        case "End":
          e8.preventDefault();
          this._moveToEdge("end");
          return;
        case "Enter":
        case " ": {
          e8.preventDefault();
          const active = this.options.find((o9) => o9.id === this._activeId);
          if (active) this._commitSelection(active);
          return;
        }
        case "Tab":
          this._open = false;
          return;
        default:
          if (key.length === 1 && /\S/.test(key)) {
            this._typeahead(key);
          }
      }
    };
    // The listbox is portaled to <body>, and its <ae-option> rows are not
    // focusable. Pressing one would otherwise blur the trigger button, and the
    // trigger's blur handler closes the listbox on the next microtask — tearing
    // it out of the DOM before the option's `click` can commit the selection
    // (symptom: "the menu closes without selecting"). Preventing the mousedown
    // default keeps focus on the trigger, so no blur fires and the click lands.
    // Scoped to option presses so a scrollbar drag still works normally.
    this._onListboxMouseDown = (e8) => {
      const target = e8.target;
      if (target && target.closest("ae-option")) e8.preventDefault();
    };
    this._onListboxClick = (e8) => {
      const target = e8.target;
      if (!target) return;
      const opt = target.closest("ae-option");
      if (!opt) return;
      e8.preventDefault();
      this._commitSelection(opt);
    };
    this._onListboxHover = (e8) => {
      const target = e8.target;
      if (!target) return;
      const opt = target.closest("ae-option");
      if (!opt || opt.disabled) return;
      if (opt.id && opt.id !== this._activeId) this._setActive(opt.id);
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeDocListeners();
    if (this._open) this._closeAndRestore();
  }
  willUpdate(changed) {
    if (changed.has("value") && typeof this.value !== "string") {
      this.value = this.value == null ? "" : String(this.value);
    }
  }
  updated(changed) {
    if (changed.has("value")) {
      this._syncSelectionFlags();
      this._syncFormValue();
    }
    if (changed.has("_open")) {
      const transitioned = changed.get("_open") !== void 0;
      if (this._open) {
        this.setAttribute("data-open", "");
        this._mountListbox();
        this._addDocListeners();
        this._positionListbox();
        this._ensureActive();
        if (transitioned)
          this.dispatchEvent(
            new CustomEvent("ae-open", { bubbles: true, composed: true })
          );
      } else {
        this.removeAttribute("data-open");
        this._closeAndRestore();
        this._removeDocListeners();
        if (transitioned)
          this.dispatchEvent(
            new CustomEvent("ae-close", { bubbles: true, composed: true })
          );
      }
    }
    if (changed.has("_open") || changed.has("_activeId")) {
      this._syncAriaRefs();
    }
  }
  /**
   * Associate the shadow-DOM trigger with the light-DOM portaled listbox
   * (`aria-controls`) and the active option (`aria-activedescendant`).
   * These IDREFs cross a shadow boundary, so they are expressed through
   * AOM element references rather than the string-id attributes the
   * template can emit. See {@link setControls}/{@link setActiveDescendant}.
   */
  _syncAriaRefs() {
    const trigger = this._trigger;
    if (!trigger) return;
    if (this._open && this._listboxEl) {
      setControls(trigger, [this._listboxEl]);
      const active = this._activeId ? this.options.find((o9) => o9.id === this._activeId) ?? null : null;
      setActiveDescendant(trigger, active);
    } else {
      setControls(trigger, []);
      setActiveDescendant(trigger, null);
    }
  }
  /** Returns all `<ae-option>` children regardless of current parent. */
  get options() {
    if (this._listboxEl) {
      return Array.from(this._listboxEl.querySelectorAll(":scope > ae-option"));
    }
    return Array.from(this.querySelectorAll(":scope > ae-option"));
  }
  _optionByValue(v2) {
    return this.options.find((o9) => o9.value === v2);
  }
  get _selectedValues() {
    if (!this.value) return [];
    return this.multiple ? this.value.split(",").map((s4) => s4.trim()).filter(Boolean) : [this.value];
  }
  get _displayLabel() {
    const selected = this._selectedValues;
    if (selected.length === 0) return "";
    const labels = selected.map((v2) => this._optionByValue(v2)?.textLabel ?? "").filter(Boolean);
    return labels.join(", ");
  }
  render() {
    const label = this._displayLabel;
    return b2`
      <button
        part="trigger"
        class="trigger"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this._open ? "true" : "false"}
        aria-required=${this.required ? "true" : A}
        aria-invalid=${this.invalid ? "true" : A}
        aria-disabled=${this.disabled ? "true" : A}
        ?disabled=${this.disabled}
        @click=${this._onTriggerClick}
        @keydown=${this._onTriggerKeyDown}
        @blur=${this._onTriggerBlur}
      >
        <span class="value">
          ${label ? b2`<span>${label}</span>` : b2`<span class="placeholder">${this.placeholder}</span>`}
        </span>
        <svg
          class="caret"
          viewBox="0 0 12 12"
          aria-hidden="true"
          width="10"
          height="10"
        >
          <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <span class="options-host" hidden>
        <slot @slotchange=${this._onSlotChange}></slot>
      </span>
    `;
  }
  // -- Listbox portal --------------------------------------------------
  _mountListbox() {
    if (this._listboxEl) return;
    const wrap = document.createElement("div");
    wrap.id = this._listboxId;
    wrap.setAttribute("role", "listbox");
    wrap.setAttribute("part", "listbox");
    wrap.setAttribute("aria-multiselectable", this.multiple ? "true" : "false");
    wrap.dataset["aeSelectListbox"] = "";
    const usePopover = typeof wrap.showPopover === "function";
    Object.assign(wrap.style, {
      // top-layer popover is viewport-anchored (fixed); the body fallback is
      // page-anchored (absolute, offset by scroll in _positionListbox).
      position: usePopover ? "fixed" : "absolute",
      // the popover UA sheet defaults to `inset:0; margin:auto` (centred); we
      // position explicitly, so neutralise both. z-index is inert in the top
      // layer but load-bearing for the fallback — keep it for that path.
      inset: "auto",
      margin: "0",
      zIndex: "var(--ae-z-popover, 1400)",
      background: "var(--ae-select-listbox-bg, var(--ae-color-bg-elevated))",
      color: "var(--ae-color-fg)",
      border: "1px solid var(--ae-color-border)",
      borderRadius: "var(--ae-select-listbox-radius, var(--ae-radius-md))",
      boxShadow: "var(--ae-select-listbox-shadow, var(--ae-shadow-lg))",
      backdropFilter: "var(--ae-select-listbox-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      WebkitBackdropFilter: "var(--ae-select-listbox-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      padding: "var(--ae-space-1)",
      minWidth: "12rem",
      maxHeight: "16rem",
      overflowY: "auto",
      fontFamily: "var(--ae-font-family-sans)"
    });
    const lightOpts = Array.from(this.querySelectorAll(":scope > ae-option"));
    for (const opt of lightOpts) {
      wrap.appendChild(opt);
    }
    wrap.addEventListener("mousedown", this._onListboxMouseDown);
    wrap.addEventListener("click", this._onListboxClick);
    wrap.addEventListener("mousemove", this._onListboxHover);
    if (usePopover) {
      wrap.setAttribute("popover", "manual");
      this.renderRoot.appendChild(wrap);
      this._listboxEl = wrap;
      this._popover = true;
      try {
        wrap.showPopover();
      } catch {
        this._popover = false;
        wrap.removeAttribute("popover");
        wrap.style.position = "absolute";
        document.body.appendChild(wrap);
      }
    } else {
      this._popover = false;
      document.body.appendChild(wrap);
      this._listboxEl = wrap;
    }
  }
  _closeAndRestore() {
    if (!this._listboxEl) return;
    const opts = Array.from(this._listboxEl.querySelectorAll(":scope > ae-option"));
    for (const o9 of opts) {
      o9.active = false;
      this.appendChild(o9);
    }
    this._listboxEl.removeEventListener("mousedown", this._onListboxMouseDown);
    this._listboxEl.removeEventListener("click", this._onListboxClick);
    this._listboxEl.removeEventListener("mousemove", this._onListboxHover);
    if (this._popover) {
      try {
        this._listboxEl.hidePopover();
      } catch {
      }
    }
    this._listboxEl.remove();
    this._listboxEl = null;
    this._popover = false;
  }
  _positionListbox() {
    if (!this._listboxEl) return;
    const rect = this.getBoundingClientRect();
    const top = (this._popover ? 0 : window.scrollY) + rect.bottom + 4;
    const left = (this._popover ? 0 : window.scrollX) + rect.left;
    this._listboxEl.style.top = `${top}px`;
    this._listboxEl.style.left = `${left}px`;
    this._listboxEl.style.minWidth = `${rect.width}px`;
  }
  _addDocListeners() {
    if (this._docListenersBound) return;
    window.addEventListener("scroll", this._onScrollOrResize, true);
    window.addEventListener("resize", this._onScrollOrResize);
    document.addEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = true;
  }
  _removeDocListeners() {
    if (!this._docListenersBound) return;
    window.removeEventListener("scroll", this._onScrollOrResize, true);
    window.removeEventListener("resize", this._onScrollOrResize);
    document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = false;
  }
  // -- Selection model -------------------------------------------------
  _syncSelectionFlags() {
    const selected = new Set(this._selectedValues);
    for (const opt of this.options) {
      opt.selected = selected.has(opt.value);
      if (!opt.id) opt.id = `ae-option-${Math.random().toString(36).slice(2, 9)}`;
    }
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, "Please select an option.");
    } else {
      this._internals.setValidity({});
    }
  }
  _ensureActive() {
    const opts = this.options.filter((o9) => !o9.disabled);
    if (opts.length === 0) {
      this._setActive("");
      return;
    }
    const first = this._optionByValue(this._selectedValues[0] ?? "");
    const target = first && !first.disabled ? first : opts[0];
    if (target) this._setActive(target.id);
  }
  _setActive(id) {
    this._activeId = id;
    for (const opt of this.options) {
      opt.active = opt.id === id;
      if (opt.active && this._listboxEl) {
        const r6 = opt.getBoundingClientRect();
        const lr = this._listboxEl.getBoundingClientRect();
        if (r6.top < lr.top || r6.bottom > lr.bottom) {
          opt.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }
  _commitSelection(opt) {
    if (opt.disabled) return;
    if (this.multiple) {
      const current = new Set(this._selectedValues);
      if (current.has(opt.value)) current.delete(opt.value);
      else current.add(opt.value);
      this.value = Array.from(current).join(",");
    } else {
      this.value = opt.value;
      this._open = false;
      this._trigger?.focus();
    }
    this.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      })
    );
  }
  _moveActive(delta) {
    const opts = this.options.filter((o9) => !o9.disabled);
    if (opts.length === 0) return;
    const idx = opts.findIndex((o9) => o9.id === this._activeId);
    const next = (idx + delta + opts.length) % opts.length;
    const target = opts[next < 0 ? 0 : next];
    if (target) this._setActive(target.id);
  }
  _moveToEdge(edge) {
    const opts = this.options.filter((o9) => !o9.disabled);
    const target = edge === "start" ? opts[0] : opts[opts.length - 1];
    if (target) this._setActive(target.id);
  }
  _typeahead(ch) {
    if (this._typeTimer) window.clearTimeout(this._typeTimer);
    this._typeBuffer += ch.toLowerCase();
    this._typeTimer = window.setTimeout(() => {
      this._typeBuffer = "";
    }, 500);
    const opts = this.options.filter((o9) => !o9.disabled);
    const match = opts.find((o9) => o9.textLabel.toLowerCase().startsWith(this._typeBuffer));
    if (match) this._setActive(match.id);
  }
  focus(options) {
    this._trigger?.focus(options);
  }
  blur() {
    this._trigger?.blur();
  }
  /** Programmatic open. Returns once the listbox is mounted in the DOM. */
  async open() {
    if (this.disabled) return;
    this._open = true;
    await this.updateComplete;
  }
  /** Programmatic close. */
  async close() {
    this._open = false;
    await this.updateComplete;
  }
  /** Whether the listbox is currently open. */
  get isOpen() {
    return this._open;
  }
  /** Form-associated validity state, delegated to ElementInternals. */
  get validity() {
    return this._internals.validity;
  }
  /** Current validation message, delegated to ElementInternals. */
  get validationMessage() {
    return this._internals.validationMessage;
  }
  /** Trigger validation reporting, delegated to ElementInternals. */
  reportValidity() {
    return this._internals.reportValidity();
  }
  /** Check whether the control is currently valid. */
  checkValidity() {
    return this._internals.checkValidity();
  }
};
AeSelect.formAssociated = true;
AeSelect.styles = i`
    /*
     * Tier 3 select tokens are read via var(--token, fallback) inside
     * the consumption rules below so root-level theme overrides cascade
     * into the shadow DOM. See ae-input.ts for the cascade reasoning.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      min-width: 12rem;
    }

    button.trigger {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ae-space-2);
      width: 100%;
      cursor: pointer;
      font-family: var(--ae-font-family-ui);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-select-fg, var(--ae-color-fg));
      background: var(--ae-select-bg, var(--ae-color-bg));
      /* Frosted-glass hook — see ae-input.ts. */
      backdrop-filter: var(--ae-select-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-select-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid
        var(--ae-select-border, var(--ae-color-border-strong));
      border-radius: var(--ae-select-radius, var(--ae-radius-default));
      padding: var(--ae-select-padding, var(--ae-space-2) var(--ae-space-3));
      min-height: 2.25rem;
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        box-shadow var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    :host([size='sm']) button.trigger {
      font-size: var(--ae-font-size-sm);
      padding: var(--ae-space-1) var(--ae-space-2);
      min-height: 1.75rem;
    }
    :host([size='lg']) button.trigger {
      font-size: var(--ae-font-size-md);
      padding: var(--ae-space-3) var(--ae-space-4);
      min-height: 2.75rem;
    }

    button.trigger:hover:not(:disabled) {
      background: var(--ae-select-bg-hover, var(--ae-select-bg, var(--ae-color-bg)));
      border-color: var(--ae-select-border-hover, var(--ae-color-accent));
    }
    button.trigger:focus-visible {
      ${focusRing}
      background: var(--ae-select-bg-focus, var(--ae-select-bg, var(--ae-color-bg)));
      border-color: var(--ae-select-border-focus, var(--ae-color-accent));
    }
    button.trigger:disabled {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    :host([invalid]) button.trigger,
    :host([invalid]) button.trigger:hover:not(:disabled),
    :host([invalid]) button.trigger:focus-visible {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) button.trigger:focus-visible {
      ${invalidRing}
    }

    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
      text-align: start;
    }
    .placeholder {
      color: var(--ae-select-placeholder, var(--ae-color-fg-subtle));
    }
    .caret {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ae-color-fg-muted);
      padding: 0 var(--ae-space-1);
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        transform var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .caret:hover {
      color: var(--ae-color-fg);
    }
    :host([data-open]) .caret {
      transform: rotate(180deg);
    }

    .options-host {
      display: none;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSelect.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSelect.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSelect.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSelect.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSelect.prototype, "invalid", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSelect.prototype, "multiple", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSelect.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSelect.prototype, "size", 2);
__decorateClass([
  r5()
], AeSelect.prototype, "_open", 2);
__decorateClass([
  r5()
], AeSelect.prototype, "_activeId", 2);
__decorateClass([
  e5("button")
], AeSelect.prototype, "_trigger", 2);
AeSelect = __decorateClass([
  t3("ae-select")
], AeSelect);

// src/components/combobox/ae-combobox.ts
var AeCombobox = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.freeform = false;
    this.filter = false;
    this.name = "";
    this._open = false;
    this._activeId = "";
    /** Forwards host `aria-label` / `aria-description` onto the inner combobox
     *  input so a wrapping `<ae-form-field>` (or standalone) names it. */
    this._ariaForward = new ForwardAriaController(this, () => this._input);
    this._listboxId = `ae-combobox-listbox-${Math.random().toString(36).slice(2, 9)}`;
    this._listboxEl = null;
    this._docListenersBound = false;
    this._onScrollOrResize = () => this._positionListbox();
    this._onDocPointerDown = (e8) => {
      const target = e8.target;
      if (!target) return;
      if (this.contains(target)) return;
      if (this._listboxEl && this._listboxEl.contains(target)) return;
      this._commitOnBlur();
      this._open = false;
    };
    // -- Event handlers --------------------------------------------------
    this._onSlotChange = () => {
      this._syncSelectionFlags();
    };
    this._onInput = (e8) => {
      const v2 = e8.target.value;
      if (!this._open) this._open = true;
      if (this.filter) this._applyFilter();
      this._ensureActive();
      this.dispatchEvent(
        new CustomEvent("ae-input", {
          bubbles: true,
          composed: true,
          detail: { value: v2 }
        })
      );
    };
    // Set while committing a selection so the input refocus that follows a commit
    // doesn't bounce the listbox back open via _onFocus. (In a real browser the
    // pointer-commit keeps the input focused, so the refocus is a no-op; this
    // guard makes the "closes on commit" behavior deterministic even when focus
    // had moved — e.g. keyboard activation or a browser that ignores the
    // mousedown preventDefault.)
    this._suppressReopenOnFocus = false;
    this._onFocus = () => {
      if (this._suppressReopenOnFocus) return;
      if (this.options.length > 0) this._open = true;
    };
    this._onBlur = (e8) => {
      const next = e8.relatedTarget;
      if (next && this._listboxEl && this._listboxEl.contains(next)) return;
      queueMicrotask(() => {
        const active = document.activeElement;
        if (active && this._listboxEl && this._listboxEl.contains(active)) return;
        if (active === this._input) return;
        this._commitOnBlur();
        this._open = false;
      });
    };
    this._onCaretClick = (e8) => {
      e8.preventDefault();
      if (this.disabled) return;
      this._open = !this._open;
      if (this._open) this._input.focus();
    };
    this._onKeyDown = (e8) => {
      if (this.disabled) return;
      const key = e8.key;
      if (!this._open) {
        if (key === "ArrowDown" || key === "ArrowUp") {
          e8.preventDefault();
          this._open = true;
          return;
        }
      }
      switch (key) {
        case "Escape":
          if (this._open) {
            e8.preventDefault();
            this._open = false;
          }
          return;
        case "ArrowDown":
          e8.preventDefault();
          this._moveActive(1);
          return;
        case "ArrowUp":
          e8.preventDefault();
          this._moveActive(-1);
          return;
        case "Home":
          if (this._open) {
            e8.preventDefault();
            this._moveToEdge("start");
          }
          return;
        case "End":
          if (this._open) {
            e8.preventDefault();
            this._moveToEdge("end");
          }
          return;
        case "Enter": {
          const raw = this._input.value;
          const exactLabel = this._matchByLabel(raw);
          if (this.freeform && raw && !exactLabel) {
            e8.preventDefault();
            this._commitOnBlur();
            this._open = false;
            return;
          }
          const active = this.options.find((o9) => o9.id === this._activeId);
          if (this._open && active) {
            e8.preventDefault();
            this._commitOption(active);
          } else if (this.freeform) {
            e8.preventDefault();
            this._commitOnBlur();
          }
          return;
        }
        case "Tab":
          if (this._open) {
            this._commitOnBlur();
            this._open = false;
          }
          return;
      }
    };
    // Portaled listbox rows are not focusable, so pressing one would blur the
    // input; the input's blur handler then commits-on-blur and closes the
    // listbox on the next microtask, tearing it out before the option's `click`
    // can fire (symptom: "the menu closes without selecting"). Preventing the
    // mousedown default keeps the input focused so the click lands. Scoped to
    // option presses so a scrollbar drag still works.
    this._onListboxMouseDown = (e8) => {
      const target = e8.target;
      if (target && target.closest("ae-option")) e8.preventDefault();
    };
    this._onListboxClick = (e8) => {
      const target = e8.target;
      if (!target) return;
      const opt = target.closest("ae-option");
      if (!opt) return;
      e8.preventDefault();
      this._commitOption(opt);
    };
    this._onListboxHover = (e8) => {
      const target = e8.target;
      if (!target) return;
      const opt = target.closest("ae-option");
      if (!opt || opt.disabled || opt.filterHidden) return;
      if (opt.id !== this._activeId) this._setActive(opt.id);
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeDocListeners();
    if (this._listboxEl) this._closeAndRestore();
  }
  updated(changed) {
    if (changed.has("value")) {
      this._syncSelectionFlags();
      this._syncFormValue();
    }
    if (changed.has("_open")) {
      const transitioned = changed.get("_open") !== void 0;
      if (this._open) {
        this.setAttribute("data-open", "");
        this._mountListbox();
        this._addDocListeners();
        this._positionListbox();
        this._applyFilter();
        this._ensureActive();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this.removeAttribute("data-open");
        this._closeAndRestore();
        this._removeDocListeners();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
    }
    if (changed.has("_open") || changed.has("_activeId")) {
      this._syncAriaRefs();
    }
  }
  /**
   * Associate the shadow-DOM input with the light-DOM portaled listbox
   * (`aria-controls`) and the active option (`aria-activedescendant`)
   * through AOM element references, since those IDREFs cross the shadow
   * boundary and cannot be expressed with string ids in the template.
   */
  _syncAriaRefs() {
    const input = this._input;
    if (!input) return;
    if (this._open && this._listboxEl) {
      setControls(input, [this._listboxEl]);
      const active = this._activeId ? this.options.find((o9) => o9.id === this._activeId) ?? null : null;
      setActiveDescendant(input, active);
    } else {
      setControls(input, []);
      setActiveDescendant(input, null);
    }
  }
  get options() {
    if (this._listboxEl) {
      return Array.from(this._listboxEl.querySelectorAll(":scope > ae-option"));
    }
    return Array.from(this.querySelectorAll(":scope > ae-option"));
  }
  _visibleOptions() {
    return this.options.filter((o9) => !o9.disabled && !o9.filterHidden);
  }
  render() {
    return b2`
      <div class="field">
        <input
          part="input"
          type="text"
          role="combobox"
          aria-autocomplete=${this.filter ? "list" : "none"}
          aria-expanded=${this._open ? "true" : "false"}
          aria-required=${this.required ? "true" : A}
          aria-invalid=${this.invalid ? "true" : A}
          aria-disabled=${this.disabled ? "true" : A}
          placeholder=${this.placeholder || A}
          ?disabled=${this.disabled}
          .value=${this.value}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
          @focus=${this._onFocus}
          @blur=${this._onBlur}
        />
        <button
          class="caret"
          type="button"
          tabindex="-1"
          aria-label="Toggle options"
          @click=${this._onCaretClick}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" width="10" height="10">
            <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <span class="options-host" hidden>
        <slot @slotchange=${this._onSlotChange}></slot>
      </span>
    `;
  }
  // -- Portal -----------------------------------------------------------
  _mountListbox() {
    if (this._listboxEl) return;
    const wrap = document.createElement("div");
    wrap.id = this._listboxId;
    wrap.setAttribute("role", "listbox");
    wrap.setAttribute("part", "listbox");
    wrap.dataset["aeComboboxListbox"] = "";
    Object.assign(wrap.style, {
      position: "absolute",
      zIndex: "var(--ae-z-popover, 1400)",
      background: "var(--ae-color-bg-elevated)",
      color: "var(--ae-color-fg)",
      border: "1px solid var(--ae-color-border)",
      borderRadius: "var(--ae-combobox-listbox-radius, var(--ae-radius-md))",
      boxShadow: "var(--ae-combobox-listbox-shadow, var(--ae-shadow-lg))",
      backdropFilter: "var(--ae-combobox-listbox-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      WebkitBackdropFilter: "var(--ae-combobox-listbox-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      padding: "var(--ae-space-1)",
      minWidth: "14rem",
      maxHeight: "16rem",
      overflowY: "auto",
      fontFamily: "var(--ae-font-family-sans)"
    });
    const lightOpts = Array.from(this.querySelectorAll(":scope > ae-option"));
    for (const opt of lightOpts) wrap.appendChild(opt);
    wrap.addEventListener("mousedown", this._onListboxMouseDown);
    wrap.addEventListener("click", this._onListboxClick);
    wrap.addEventListener("mousemove", this._onListboxHover);
    document.body.appendChild(wrap);
    this._listboxEl = wrap;
  }
  _closeAndRestore() {
    if (!this._listboxEl) return;
    const opts = Array.from(this._listboxEl.querySelectorAll(":scope > ae-option"));
    for (const o9 of opts) {
      o9.active = false;
      o9.filterHidden = false;
      this.appendChild(o9);
    }
    this._listboxEl.removeEventListener("mousedown", this._onListboxMouseDown);
    this._listboxEl.removeEventListener("click", this._onListboxClick);
    this._listboxEl.removeEventListener("mousemove", this._onListboxHover);
    this._listboxEl.remove();
    this._listboxEl = null;
  }
  _positionListbox() {
    if (!this._listboxEl) return;
    const rect = this.getBoundingClientRect();
    this._listboxEl.style.top = `${window.scrollY + rect.bottom + 4}px`;
    this._listboxEl.style.left = `${window.scrollX + rect.left}px`;
    this._listboxEl.style.minWidth = `${rect.width}px`;
  }
  _addDocListeners() {
    if (this._docListenersBound) return;
    window.addEventListener("scroll", this._onScrollOrResize, true);
    window.addEventListener("resize", this._onScrollOrResize);
    document.addEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = true;
  }
  _removeDocListeners() {
    if (!this._docListenersBound) return;
    window.removeEventListener("scroll", this._onScrollOrResize, true);
    window.removeEventListener("resize", this._onScrollOrResize);
    document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = false;
  }
  // -- Selection / filter ----------------------------------------------
  _syncSelectionFlags() {
    for (const opt of this.options) {
      opt.selected = opt.value === this.value;
      if (!opt.id) opt.id = `ae-option-${Math.random().toString(36).slice(2, 9)}`;
    }
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, "Please complete this field.");
    } else if (!this.freeform && this.value && !this._matchByValue(this.value) && !this._matchByLabel(this.value)) {
      this._internals.setValidity({ customError: true }, "Value must match an option.");
    } else {
      this._internals.setValidity({});
    }
  }
  _matchByValue(v2) {
    return this.options.find((o9) => o9.value === v2);
  }
  _matchByLabel(v2) {
    const norm = v2.toLowerCase();
    return this.options.find((o9) => o9.textLabel.toLowerCase() === norm);
  }
  _applyFilter() {
    if (!this.filter) {
      for (const o9 of this.options) o9.filterHidden = false;
      return;
    }
    const q = this._input?.value.toLowerCase() ?? "";
    for (const o9 of this.options) {
      o9.filterHidden = q.length > 0 && !o9.textLabel.toLowerCase().includes(q);
    }
  }
  _ensureActive() {
    const opts = this._visibleOptions();
    if (opts.length === 0) {
      this._activeId = "";
      return;
    }
    const current = opts.find((o9) => o9.id === this._activeId);
    if (current) return;
    const sel = opts.find((o9) => o9.value === this.value) ?? opts[0];
    if (sel) this._setActive(sel.id);
  }
  _setActive(id) {
    this._activeId = id;
    for (const opt of this.options) {
      opt.active = opt.id === id;
      if (opt.active && this._listboxEl) {
        const r6 = opt.getBoundingClientRect();
        const lr = this._listboxEl.getBoundingClientRect();
        if (r6.top < lr.top || r6.bottom > lr.bottom) {
          opt.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }
  _commitOption(opt) {
    if (opt.disabled) return;
    this.value = opt.value;
    this._input.value = opt.textLabel;
    this._open = false;
    this.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      })
    );
    this._suppressReopenOnFocus = true;
    this._input.focus();
    this._suppressReopenOnFocus = false;
  }
  _commitOnBlur() {
    const raw = this._input?.value ?? "";
    if (this.freeform) {
      if (raw !== this.value) {
        this.value = raw;
        this.dispatchEvent(
          new CustomEvent("ae-change", {
            bubbles: true,
            composed: true,
            detail: { value: this.value }
          })
        );
      }
      return;
    }
    const match = this._matchByLabel(raw) ?? this._matchByValue(raw);
    if (match) {
      if (this.value !== match.value) {
        this.value = match.value;
        this._input.value = match.textLabel;
        this.dispatchEvent(
          new CustomEvent("ae-change", {
            bubbles: true,
            composed: true,
            detail: { value: this.value }
          })
        );
      } else {
        this._input.value = match.textLabel;
      }
    } else {
      const cur = this._matchByValue(this.value);
      this._input.value = cur ? cur.textLabel : "";
    }
  }
  _moveActive(delta) {
    const opts = this._visibleOptions();
    if (opts.length === 0) return;
    const idx = opts.findIndex((o9) => o9.id === this._activeId);
    const next = (idx + delta + opts.length) % opts.length;
    const target = opts[next < 0 ? 0 : next];
    if (target) this._setActive(target.id);
  }
  _moveToEdge(edge) {
    const opts = this._visibleOptions();
    const target = edge === "start" ? opts[0] : opts[opts.length - 1];
    if (target) this._setActive(target.id);
  }
  focus(options) {
    this._input?.focus(options);
  }
  blur() {
    this._input?.blur();
  }
  /** Programmatic open. */
  async open() {
    if (this.disabled) return;
    this._open = true;
    await this.updateComplete;
  }
  /** Programmatic close. */
  async close() {
    this._open = false;
    await this.updateComplete;
  }
  /** Whether the listbox is currently open. */
  get isOpen() {
    return this._open;
  }
  /** Form-associated validity state, delegated to ElementInternals. */
  get validity() {
    return this._internals.validity;
  }
  /** Current validation message, delegated to ElementInternals. */
  get validationMessage() {
    return this._internals.validationMessage;
  }
  /** Trigger validation reporting, delegated to ElementInternals. */
  reportValidity() {
    return this._internals.reportValidity();
  }
  /** Check whether the control is currently valid. */
  checkValidity() {
    return this._internals.checkValidity();
  }
};
AeCombobox.formAssociated = true;
AeCombobox.styles = i`
    /*
     * Tier 3 combobox tokens are read via var(--token, fallback) inside
     * the consumption rules — see ae-input.ts for the cascade reasoning.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      min-width: 14rem;
    }

    .field {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      min-height: 2.25rem;
      font-size: var(--ae-font-size-sm);
      gap: var(--ae-combobox-gap, var(--ae-space-2));
      width: 100%;
      background: var(--ae-combobox-bg, var(--ae-color-bg));
      /* Frosted-glass hook — see ae-input.ts. */
      backdrop-filter: var(--ae-combobox-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-combobox-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid
        var(--ae-combobox-border, var(--ae-color-border-strong));
      border-radius: var(--ae-combobox-radius, var(--ae-radius-default));
      padding: var(--ae-combobox-padding, 0 var(--ae-space-2) 0 var(--ae-space-3));
      transition:
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .field:hover:not(:has(input:focus-visible)) {
      background: var(--ae-combobox-bg-hover,
        var(--ae-combobox-bg, var(--ae-color-bg)));
      border-color: var(--ae-combobox-border-hover,
        var(--ae-combobox-border, var(--ae-color-border-strong)));
    }
    .field:has(input:focus-visible) {
      ${focusRing}
      background: var(--ae-combobox-bg-focus,
        var(--ae-combobox-bg, var(--ae-color-bg)));
      border-color: var(--ae-combobox-border-focus, var(--ae-color-accent));
    }
    :host([disabled]) .field {
      opacity: var(--ae-opacity-disabled, 0.55);
      cursor: not-allowed;
    }

    :host([invalid]) .field,
    :host([invalid]) .field:hover:not(:has(input:focus-visible)),
    :host([invalid]) .field:has(input:focus-visible) {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .field:has(input:focus-visible) {
      ${invalidRing}
    }

    input {
      all: unset;
      flex: 1 1 auto;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      font-family: var(--ae-font-family-ui);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-combobox-fg, var(--ae-color-fg));
      /* The .field owns the 36px box (border-box min-height) and centers the
       * input, matching ae-select's trigger model. The input adds no vertical
       * padding/height of its own — otherwise it inflated the field ~3px past
       * the select height. */
      padding: 0;
    }
    input::placeholder {
      color: var(--ae-combobox-placeholder, var(--ae-color-fg-subtle));
    }

    .caret {
      all: unset;
      box-sizing: border-box;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ae-color-fg-muted);
      padding: 0 var(--ae-space-1);
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        transform var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .caret:hover {
      color: var(--ae-color-fg);
    }
    :host([data-open]) .caret {
      transform: rotate(180deg);
    }

    .options-host {
      display: none;
    }

    ${autofillReset}
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeCombobox.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeCombobox.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCombobox.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCombobox.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCombobox.prototype, "invalid", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCombobox.prototype, "freeform", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCombobox.prototype, "filter", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeCombobox.prototype, "name", 2);
__decorateClass([
  r5()
], AeCombobox.prototype, "_open", 2);
__decorateClass([
  r5()
], AeCombobox.prototype, "_activeId", 2);
__decorateClass([
  e5("input")
], AeCombobox.prototype, "_input", 2);
AeCombobox = __decorateClass([
  t3("ae-combobox")
], AeCombobox);

// src/components/slider/ae-slider.ts
var AeSlider = class extends i4 {
  constructor() {
    super();
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.value = 0;
    this.disabled = false;
    this.invalid = false;
    this.name = "";
    this.orientation = "horizontal";
    this.range = false;
    this.marks = false;
    this._activeThumb = 0;
    this._pointerDragging = false;
    this._draggingThumb = 0;
    // -- Keyboard --------------------------------------------------------
    this._onThumbKeyDown = (e8) => {
      if (this.disabled) return;
      const thumb = Number(e8.currentTarget.dataset["thumb"]);
      this._activeThumb = thumb;
      const big = this.step * 10;
      let delta = 0;
      switch (e8.key) {
        case "ArrowRight":
        case "ArrowUp":
          delta = e8.shiftKey ? big : this.step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          delta = -(e8.shiftKey ? big : this.step);
          break;
        case "PageUp":
          delta = big;
          break;
        case "PageDown":
          delta = -big;
          break;
        case "Home":
          e8.preventDefault();
          this._setThumb(thumb, this.min);
          return;
        case "End":
          e8.preventDefault();
          this._setThumb(thumb, this.max);
          return;
        default:
          return;
      }
      e8.preventDefault();
      const [lo, hi] = this._values;
      const cur = thumb === 0 ? lo : hi;
      this._setThumb(thumb, cur + delta);
    };
    // -- Pointer ---------------------------------------------------------
    this._onTrackPointerDown = (e8) => {
      if (this.disabled) return;
      if (e8.target.classList.contains("thumb")) return;
      const v2 = this._valueFromPointer(e8);
      if (v2 === null) return;
      if (this.range) {
        const [lo, hi] = this._values;
        const target = Math.abs(v2 - lo) <= Math.abs(v2 - hi) ? 0 : 1;
        this._setThumb(target, v2);
        this._activeThumb = target;
      } else {
        this._setThumb(0, v2);
      }
      this._startDrag(this._activeThumb, e8);
    };
    this._onThumbPointerDown = (e8) => {
      if (this.disabled) return;
      const thumb = Number(e8.currentTarget.dataset["thumb"]);
      this._activeThumb = thumb;
      this._startDrag(thumb, e8);
    };
    this._onPointerMove = (e8) => {
      if (!this._pointerDragging) return;
      const v2 = this._valueFromPointer(e8);
      if (v2 === null) return;
      this._setThumb(this._draggingThumb, v2);
    };
    this._onPointerUp = () => {
      this._pointerDragging = false;
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
    if (typeof MutationObserver === "function") {
      this._ariaObserver = new MutationObserver(() => this.requestUpdate());
      this._ariaObserver.observe(this, {
        attributes: true,
        attributeFilter: ["aria-label", "aria-description"]
      });
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._ariaObserver?.disconnect();
    this._ariaObserver = void 0;
  }
  /** Host-level accessible name, applied to the thumb(s). */
  get _hostLabel() {
    return this.getAttribute("aria-label") ?? "";
  }
  get _hostDescription() {
    return this.getAttribute("aria-description") ?? "";
  }
  /** Per-thumb accessible name. In range mode the two thumbs are
   *  distinguished as the minimum and maximum handles. */
  _thumbLabel(thumb) {
    const base = this._hostLabel;
    if (!base) return A;
    if (!this.range) return base;
    return thumb === 0 ? `${base}, minimum` : `${base}, maximum`;
  }
  _valueText(v2) {
    return this.formatValue ? this.formatValue(v2) : A;
  }
  updated(changed) {
    if (changed.has("value") || changed.has("min") || changed.has("max") || changed.has("range")) {
      this._syncFormValue();
    }
  }
  get _values() {
    if (this.range) {
      const v2 = Array.isArray(this.value) ? this.value : [this.min, this.max];
      return [
        this._clamp(this._snap(v2[0] ?? this.min)),
        this._clamp(this._snap(v2[1] ?? this.max))
      ];
    }
    const n6 = typeof this.value === "number" ? this.value : this.min;
    return [this._clamp(this._snap(n6)), 0];
  }
  _clamp(n6) {
    return Math.min(this.max, Math.max(this.min, n6));
  }
  _snap(n6) {
    if (!Number.isFinite(this.step) || this.step <= 0) return n6;
    const offset = this.min;
    const snapped = Math.round((n6 - offset) / this.step) * this.step + offset;
    const decimals = (`${this.step}`.split(".")[1] ?? "").length;
    return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
  }
  _percentFor(n6) {
    if (this.max === this.min) return 0;
    return (n6 - this.min) / (this.max - this.min) * 100;
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    const v2 = this.range ? Array.isArray(this.value) ? `${this.value[0]},${this.value[1]}` : `${this.min},${this.max}` : `${typeof this.value === "number" ? this.value : this.min}`;
    this._internals.setFormValue(v2);
  }
  render() {
    const [lo, hi] = this._values;
    const isVertical = this.orientation === "vertical";
    const percentA = this._percentFor(lo);
    const percentB = this._percentFor(hi);
    const fillStart = this.range ? Math.min(percentA, percentB) : 0;
    const fillEnd = this.range ? Math.max(percentA, percentB) : percentA;
    const fillStyle = isVertical ? `bottom:${fillStart}%; height:${fillEnd - fillStart}%; left:0; right:0;` : `left:${fillStart}%; width:${fillEnd - fillStart}%;`;
    const thumbAStyle = isVertical ? `bottom:${percentA}%; left:50%;` : `left:${percentA}%; top:50%;`;
    const thumbBStyle = isVertical ? `bottom:${percentB}%; left:50%;` : `left:${percentB}%; top:50%;`;
    const marks = this.marks ? this._renderMarks() : A;
    return b2`
      <div class="wrap">
        <div
          class="track"
          part="track"
          @pointerdown=${this._onTrackPointerDown}
        >
          <div class="fill" part="fill" style=${fillStyle}></div>
          ${marks}
          <div
            class="thumb"
            part="thumb"
            role="slider"
            tabindex=${this.disabled ? -1 : 0}
            aria-valuemin=${this.min}
            aria-valuemax=${this.range ? hi : this.max}
            aria-valuenow=${lo}
            aria-valuetext=${this._valueText(lo)}
            aria-orientation=${this.orientation}
            aria-label=${this._thumbLabel(0)}
            aria-description=${this._hostDescription || A}
            aria-disabled=${this.disabled ? "true" : A}
            aria-invalid=${this.invalid ? "true" : A}
            data-thumb="0"
            style=${thumbAStyle}
            @keydown=${this._onThumbKeyDown}
            @pointerdown=${this._onThumbPointerDown}
            @focus=${() => this._activeThumb = 0}
          ></div>
          ${this.range ? b2`<div
                class="thumb"
                part="thumb"
                role="slider"
                tabindex=${this.disabled ? -1 : 0}
                aria-valuemin=${lo}
                aria-valuemax=${this.max}
                aria-valuenow=${hi}
                aria-valuetext=${this._valueText(hi)}
                aria-orientation=${this.orientation}
                aria-label=${this._thumbLabel(1)}
                aria-description=${this._hostDescription || A}
                aria-disabled=${this.disabled ? "true" : A}
                aria-invalid=${this.invalid ? "true" : A}
                data-thumb="1"
                style=${thumbBStyle}
                @keydown=${this._onThumbKeyDown}
                @pointerdown=${this._onThumbPointerDown}
                @focus=${() => this._activeThumb = 1}
              ></div>` : A}
        </div>
      </div>
    `;
  }
  _renderMarks() {
    if (!Number.isFinite(this.step) || this.step <= 0) return A;
    const marks = [];
    const count = Math.floor((this.max - this.min) / this.step);
    if (count > 64) return A;
    const isVertical = this.orientation === "vertical";
    for (let i7 = 0; i7 <= count; i7++) {
      const v2 = this.min + i7 * this.step;
      if (v2 > this.max) break;
      const pct = this._percentFor(v2);
      const style = isVertical ? `bottom:${pct}%; left:50%;` : `left:${pct}%; top:50%;`;
      marks.push(b2`<span class="mark" part="mark" style=${style}></span>`);
    }
    return marks;
  }
  _setThumb(thumb, raw) {
    const next = this._clamp(this._snap(raw));
    let [lo, hi] = this._values;
    if (this.range) {
      if (thumb === 0) lo = Math.min(next, hi);
      else hi = Math.max(next, lo);
      this.value = [lo, hi];
    } else {
      this.value = next;
    }
    this.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value }
      })
    );
  }
  _startDrag(thumb, e8) {
    this._pointerDragging = true;
    this._draggingThumb = thumb;
    const target = e8.currentTarget;
    try {
      target.setPointerCapture(e8.pointerId);
    } catch {
    }
    target.addEventListener("pointermove", this._onPointerMove);
    target.addEventListener("pointerup", this._onPointerUp, { once: true });
    target.addEventListener("pointercancel", this._onPointerUp, { once: true });
  }
  _valueFromPointer(e8) {
    const track = this._trackEl;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    let ratio;
    if (this.orientation === "vertical") {
      ratio = 1 - (e8.clientY - rect.top) / rect.height;
    } else {
      ratio = (e8.clientX - rect.left) / rect.width;
    }
    ratio = Math.max(0, Math.min(1, ratio));
    return this.min + ratio * (this.max - this.min);
  }
  /** Form-associated validity state, delegated to ElementInternals. */
  get validity() {
    return this._internals.validity;
  }
  /** Validation message. */
  get validationMessage() {
    return this._internals.validationMessage;
  }
};
AeSlider.formAssociated = true;
AeSlider.styles = i`
    /*
     * Theme-overridable tokens (--ae-slider-track-bg, -track-fill,
     * -track-radius, -track-size, -thumb-bg, -thumb-border,
     * -thumb-radius, -thumb-rotate) are NOT declared at :host — :host
     * declarations would shadow inherited root-level theme overrides.
     * Resolved at the consumption point via var(--token, default).
     * Locked down by src/theme-integration.test.ts.
     *
     * --ae-slider-thumb-size remains at :host — it's a consumer-
     * instance concern, not a theme one.
     */
    :host {
      --ae-slider-thumb-size: 1.125rem;

      display: inline-block;
      width: 16rem;
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
    }
    :host([orientation='vertical']) {
      width: auto;
      height: 12rem;
    }
    :host([disabled]) {
      opacity: var(--ae-opacity-disabled, 0.55);
      pointer-events: none;
    }

    /*
     * The hit-area padding lives on .wrap, NOT on :host. A consumer's global
     * reset (\`* { padding: 0 }\`) is a document-tree declaration and overrides
     * a normal :host one in the cascade, so host padding would silently
     * collapse to 0 — shrinking the slider's clickable area to the bare track.
     * A document \`*\` selector can't reach inside this shadow tree, so .wrap's
     * padding is immune.
     */
    .wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: var(--ae-space-3) 0;
      box-sizing: border-box;
    }
    :host([orientation='vertical']) .wrap {
      flex-direction: column;
      justify-content: center;
      padding: 0 var(--ae-space-3);
    }

    .track {
      position: relative;
      width: 100%;
      height: var(--ae-slider-track-size, 4px);
      background: var(--ae-slider-track-bg, var(--ae-color-border));
      border-radius: var(--ae-slider-track-radius, var(--ae-radius-full));
      cursor: pointer;
    }
    :host([orientation='vertical']) .track {
      width: var(--ae-slider-track-size, 4px);
      height: 100%;
    }

    .fill {
      position: absolute;
      background: var(--ae-slider-track-fill, var(--ae-color-accent));
      border-radius: var(--ae-slider-track-radius, var(--ae-radius-full));
      /* Bioluminescent accent: a brand (Crucible) can make the filled track
       * glow molten. Default none. */
      box-shadow: var(--ae-slider-fill-glow, none);
      top: 0;
      bottom: 0;
    }
    :host([orientation='vertical']) .fill {
      left: 0;
      right: 0;
      top: auto;
      bottom: auto;
    }

    .thumb {
      position: absolute;
      width: var(--ae-slider-thumb-size);
      height: var(--ae-slider-thumb-size);
      background: var(--ae-slider-thumb-bg, var(--ae-color-bg-elevated));
      border: 2px solid
        var(--ae-slider-thumb-border, var(--ae-color-accent));
      border-radius: var(--ae-slider-thumb-radius, 50%);
      box-shadow: var(--ae-slider-thumb-shadow, var(--ae-shadow-sm));
      top: 50%;
      /* --ae-slider-thumb-rotate slots between the centering translate
       * and any further transforms a theme might inject. Default is
       * rotate(0deg) (identity) so the thumb sits axis-aligned;
       * themes like Metro override to rotate(45deg) for a diamond. */
      transform:
        translate(-50%, -50%)
        var(--ae-slider-thumb-rotate, rotate(0deg));
      cursor: grab;
      touch-action: none;
      transition: box-shadow var(--ae-duration-fast);
    }
    :host([orientation='vertical']) .thumb {
      top: auto;
      left: 50%;
      transform:
        translate(-50%, 50%)
        var(--ae-slider-thumb-rotate, rotate(0deg));
    }
    .thumb:focus-visible {
      ${focusRing}
      box-shadow: var(--ae-shadow-md);
    }
    .thumb:active {
      cursor: grabbing;
    }

    /* Invalid: recolor the thumb border + focus ring to danger. */
    :host([invalid]) .thumb {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .thumb:focus-visible {
      ${invalidRing}
    }

    .mark {
      position: absolute;
      width: 2px;
      height: 8px;
      background: var(--ae-color-fg-subtle);
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      border-radius: var(--ae-radius-xs);
    }
    :host([orientation='vertical']) .mark {
      width: 8px;
      height: 2px;
      left: 50%;
      top: auto;
      transform: translate(-50%, 50%);
    }
  `;
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSlider.prototype, "min", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSlider.prototype, "max", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSlider.prototype, "step", 2);
__decorateClass([
  n4({ reflect: true, converter: {
    fromAttribute: (val) => {
      if (val === null) return 0;
      if (val.includes(",")) {
        const parts = val.split(",").map((p3) => Number(p3.trim()));
        if (parts.length === 2 && parts.every((n7) => Number.isFinite(n7))) {
          return [parts[0], parts[1]];
        }
      }
      const n6 = Number(val);
      return Number.isFinite(n6) ? n6 : 0;
    },
    toAttribute: (v2) => {
      if (Array.isArray(v2)) return `${v2[0]},${v2[1]}`;
      return String(v2);
    }
  } })
], AeSlider.prototype, "value", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSlider.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSlider.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSlider.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSlider.prototype, "orientation", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSlider.prototype, "range", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSlider.prototype, "marks", 2);
__decorateClass([
  r5()
], AeSlider.prototype, "_activeThumb", 2);
__decorateClass([
  e5(".track")
], AeSlider.prototype, "_trackEl", 2);
AeSlider = __decorateClass([
  t3("ae-slider")
], AeSlider);

// src/components/date-picker/ae-date-picker.ts
var AeDatePicker = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.min = "";
    this.max = "";
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.format = "YYYY-MM-DD";
    this.weekstart = 0;
    this._open = false;
    this._viewYear = (/* @__PURE__ */ new Date()).getFullYear();
    this._viewMonth = (/* @__PURE__ */ new Date()).getMonth();
    this._focusedISO = "";
    /** Forwards host `aria-label` / `aria-description` onto the inner date
     *  input so a wrapping `<ae-form-field>` (or standalone) names it. */
    this._ariaForward = new ForwardAriaController(this, () => this._input);
    this._calId = `ae-date-cal-${Math.random().toString(36).slice(2, 9)}`;
    this._calEl = null;
    this._docListenersBound = false;
    this._onScrollOrResize = () => this._positionCalendar();
    this._onDocPointerDown = (e8) => {
      const target = e8.target;
      if (!target) return;
      if (this.contains(target)) return;
      if (this._calEl && this._calEl.contains(target)) return;
      this._open = false;
    };
    // -- Event handlers --------------------------------------------------
    this._onToggleClick = (e8) => {
      if (this.disabled) return;
      e8.preventDefault();
      this._open = !this._open;
    };
    this._onInput = (e8) => {
      const v2 = e8.target.value;
      const iso = parseAnyDate(v2, this.format);
      if (iso) {
        this.value = iso;
        this.dispatchEvent(
          new CustomEvent("ae-change", { bubbles: true, composed: true, detail: { value: this.value } })
        );
      }
    };
    this._onInputBlur = () => {
      this._input.value = this._displayValue();
    };
    this._onInputKeyDown = (e8) => {
      if (e8.key === "ArrowDown" && !this._open) {
        e8.preventDefault();
        this._open = true;
      } else if (e8.key === "Escape" && this._open) {
        e8.preventDefault();
        this._open = false;
        this._input.focus();
      }
    };
    this._onCalendarClick = (e8) => {
      const target = e8.target;
      if (!target) return;
      const navBtn = target.closest("[data-nav]");
      if (navBtn) {
        e8.preventDefault();
        this._navigateMonth(navBtn.dataset["nav"] === "next" ? 1 : -1);
        return;
      }
      const dayBtn = target.closest("[data-iso]");
      if (dayBtn) {
        e8.preventDefault();
        const iso = dayBtn.dataset["iso"];
        this._selectDate(iso);
      }
    };
    this._onCalendarKeyDown = (e8) => {
      const key = e8.key;
      const handled = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Enter", " ", "Escape"].includes(key);
      if (!handled) return;
      e8.preventDefault();
      if (key === "Escape") {
        this._open = false;
        this._input.focus();
        return;
      }
      if (key === "Enter" || key === " ") {
        this._selectDate(this._focusedISO);
        return;
      }
      const cur = parseISO(this._focusedISO);
      if (!cur) return;
      const next = new Date(cur);
      switch (key) {
        case "ArrowLeft":
          next.setDate(cur.getDate() - 1);
          break;
        case "ArrowRight":
          next.setDate(cur.getDate() + 1);
          break;
        case "ArrowUp":
          next.setDate(cur.getDate() - 7);
          break;
        case "ArrowDown":
          next.setDate(cur.getDate() + 7);
          break;
        case "PageUp":
          if (e8.shiftKey) next.setFullYear(cur.getFullYear() - 1);
          else next.setMonth(cur.getMonth() - 1);
          break;
        case "PageDown":
          if (e8.shiftKey) next.setFullYear(cur.getFullYear() + 1);
          else next.setMonth(cur.getMonth() + 1);
          break;
        case "Home":
          next.setDate(cur.getDate() - cur.getDay() + this.weekstart);
          break;
        case "End":
          next.setDate(cur.getDate() + (6 - cur.getDay() + this.weekstart));
          break;
      }
      this._focusedISO = toISO(next);
      this._viewYear = next.getFullYear();
      this._viewMonth = next.getMonth();
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
    this._seedViewFromValue();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeDocListeners();
    if (this._calEl) this._unmountCalendar();
  }
  updated(changed) {
    if (changed.has("value")) {
      this._syncFormValue();
      this._seedViewFromValue();
    }
    if (changed.has("_open") || changed.has("_viewYear") || changed.has("_viewMonth") || changed.has("_focusedISO") || changed.has("value")) {
      if (this._open) {
        if (!this._calEl) this._mountCalendar();
        this._positionCalendar();
        this._renderCalendar();
      }
    }
    if (changed.has("_open")) {
      const transitioned = changed.get("_open") !== void 0;
      if (this._open) {
        this.setAttribute("data-open", "");
        this._addDocListeners();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this.removeAttribute("data-open");
        this._unmountCalendar();
        this._removeDocListeners();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
      this._syncAriaRefs();
    }
  }
  /**
   * Point the shadow-DOM input's `aria-controls` at the portaled calendar
   * dialog (light DOM) via an AOM element reference. The relationship
   * crosses the shadow boundary, so the string-id form on the input can't
   * resolve it; AOM can. Cleared when the calendar is closed.
   */
  _syncAriaRefs() {
    const input = this._input;
    if (!input) return;
    setControls(input, this._open && this._calEl ? [this._calEl] : []);
  }
  _seedViewFromValue() {
    const d3 = parseISO(this.value);
    if (d3) {
      this._viewYear = d3.getFullYear();
      this._viewMonth = d3.getMonth();
      this._focusedISO = this.value;
    } else if (!this._focusedISO) {
      const today = /* @__PURE__ */ new Date();
      this._focusedISO = toISO(today);
    }
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, "Please choose a date.");
    } else if (this.value) {
      const d3 = parseISO(this.value);
      if (!d3) {
        this._internals.setValidity({ badInput: true }, "Invalid date.");
      } else if (this.min && d3 < parseISO(this.min)) {
        this._internals.setValidity({ rangeUnderflow: true }, `Date must be on or after ${this.min}.`);
      } else if (this.max && d3 > parseISO(this.max)) {
        this._internals.setValidity({ rangeOverflow: true }, `Date must be on or before ${this.max}.`);
      } else {
        this._internals.setValidity({});
      }
    } else {
      this._internals.setValidity({});
    }
  }
  render() {
    return b2`
      <div class="field">
        <input
          part="input"
          type="text"
          inputmode="numeric"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded=${this._open ? "true" : "false"}
          aria-required=${this.required ? "true" : A}
          aria-invalid=${this.invalid ? "true" : A}
          aria-disabled=${this.disabled ? "true" : A}
          ?disabled=${this.disabled}
          placeholder=${this.format}
          .value=${this._displayValue()}
          @input=${this._onInput}
          @blur=${this._onInputBlur}
          @keydown=${this._onInputKeyDown}
        />
        <button
          class="toggle"
          type="button"
          tabindex="-1"
          aria-label="Open calendar"
          @click=${this._onToggleClick}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14">
            <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <line x1="2" y1="6.5" x2="14" y2="6.5" stroke="currentColor" stroke-width="1.4" />
            <line x1="5.5" y1="2" x2="5.5" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            <line x1="10.5" y1="2" x2="10.5" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    `;
  }
  _displayValue() {
    if (!this.value) return "";
    const d3 = parseISO(this.value);
    if (!d3) return this.value;
    return formatDate(d3, this.format);
  }
  // -- Calendar portal -------------------------------------------------
  _mountCalendar() {
    if (this._calEl) return;
    const cal = document.createElement("div");
    cal.id = this._calId;
    cal.setAttribute("role", "dialog");
    cal.setAttribute("aria-label", "Choose a date");
    cal.setAttribute("part", "calendar");
    Object.assign(cal.style, {
      position: "absolute",
      zIndex: "var(--ae-z-popover, 1400)",
      background: "var(--ae-date-picker-cal-bg, var(--ae-color-bg-elevated))",
      backdropFilter: "var(--ae-date-picker-cal-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      WebkitBackdropFilter: "var(--ae-date-picker-cal-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      color: "var(--ae-color-fg)",
      border: "var(--ae-date-picker-cal-border, 1px solid var(--ae-color-border))",
      borderRadius: "var(--ae-date-picker-cal-radius, var(--ae-radius-md))",
      boxShadow: "var(--ae-shadow-lg)",
      padding: "var(--ae-space-3)",
      fontFamily: "var(--ae-font-family-sans)",
      fontSize: "var(--ae-font-size-sm)",
      minWidth: "17rem"
    });
    cal.addEventListener("click", this._onCalendarClick);
    cal.addEventListener("keydown", this._onCalendarKeyDown);
    document.body.appendChild(cal);
    this._calEl = cal;
  }
  _unmountCalendar() {
    if (!this._calEl) return;
    this._calEl.removeEventListener("click", this._onCalendarClick);
    this._calEl.removeEventListener("keydown", this._onCalendarKeyDown);
    this._calEl.remove();
    this._calEl = null;
  }
  _positionCalendar() {
    if (!this._calEl) return;
    const rect = this.getBoundingClientRect();
    this._calEl.style.top = `${window.scrollY + rect.bottom + 4}px`;
    this._calEl.style.left = `${window.scrollX + rect.left}px`;
  }
  _renderCalendar() {
    if (!this._calEl) return;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayHeaders = this._dayHeaders();
    const grid = this._monthGrid(this._viewYear, this._viewMonth);
    const minD = parseISO(this.min);
    const maxD = parseISO(this.max);
    const header = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--ae-space-2);">
        <button type="button" data-nav="prev" aria-label="Previous month"
          style="all:unset; cursor:pointer; padding:var(--ae-space-1) var(--ae-space-2); border-radius:var(--ae-radius-sm);">\u2039</button>
        <span style="font-weight:var(--ae-font-weight-semibold);">
          ${monthNames[this._viewMonth]} ${this._viewYear}
        </span>
        <button type="button" data-nav="next" aria-label="Next month"
          style="all:unset; cursor:pointer; padding:var(--ae-space-1) var(--ae-space-2); border-radius:var(--ae-radius-sm);">\u203A</button>
      </div>
    `;
    const headers = dayHeaders.map(
      (d3) => `<div style="text-align:center; font-size:var(--ae-font-size-xs); color:var(--ae-color-fg-subtle); font-weight:var(--ae-font-weight-semibold); padding:var(--ae-space-1) 0;">${d3}</div>`
    ).join("");
    const cells = grid.map((cell) => {
      const iso = toISO(cell.date);
      const isCurrentMonth = cell.date.getMonth() === this._viewMonth;
      const isSelected = iso === this.value;
      const isFocused = iso === this._focusedISO;
      const isDisabled = minD && cell.date < minD || maxD && cell.date > maxD;
      const styles = [
        "all:unset",
        "cursor:" + (isDisabled ? "not-allowed" : "pointer"),
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "aspect-ratio:1",
        "border-radius:var(--ae-date-picker-cal-day-radius, var(--ae-radius-sm))",
        "font-size:var(--ae-font-size-sm)",
        isCurrentMonth ? "color:var(--ae-color-fg)" : "color:var(--ae-color-fg-subtle)",
        isSelected ? "background:var(--ae-date-picker-cal-day-selected-bg, var(--ae-color-accent));color:var(--ae-date-picker-cal-day-selected-fg, var(--ae-color-fg-on-accent));" : "",
        isFocused && !isSelected ? "outline:2px solid var(--ae-color-accent);outline-offset:-2px;" : "",
        isDisabled ? "opacity:0.4" : ""
      ].join(";");
      return `<button type="button" part="day" data-iso="${iso}" ${isDisabled ? 'aria-disabled="true" disabled' : ""} aria-selected="${isSelected}" tabindex="${isFocused ? 0 : -1}" style="${styles}">${cell.date.getDate()}</button>`;
    }).join("");
    this._calEl.innerHTML = `
      ${header}
      <div role="grid" aria-label="Calendar" style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px;">
        ${headers}
        ${cells}
      </div>
    `;
    const focusBtn = this._calEl.querySelector(`[data-iso="${this._focusedISO}"]`);
    if (focusBtn) focusBtn.focus({ preventScroll: true });
  }
  _dayHeaders() {
    const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (this.weekstart === 1) return [...base.slice(1), base[0]];
    return base;
  }
  _monthGrid(year, month) {
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();
    const startOffset = (firstWeekday - this.weekstart + 7) % 7;
    const startDate = new Date(year, month, 1 - startOffset);
    const cells = [];
    for (let i7 = 0; i7 < 42; i7++) {
      const d3 = new Date(startDate);
      d3.setDate(startDate.getDate() + i7);
      cells.push({ date: d3 });
    }
    return cells;
  }
  _addDocListeners() {
    if (this._docListenersBound) return;
    window.addEventListener("scroll", this._onScrollOrResize, true);
    window.addEventListener("resize", this._onScrollOrResize);
    document.addEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = true;
  }
  _removeDocListeners() {
    if (!this._docListenersBound) return;
    window.removeEventListener("scroll", this._onScrollOrResize, true);
    window.removeEventListener("resize", this._onScrollOrResize);
    document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = false;
  }
  _navigateMonth(delta) {
    const next = new Date(this._viewYear, this._viewMonth + delta, 1);
    this._viewYear = next.getFullYear();
    this._viewMonth = next.getMonth();
  }
  _selectDate(iso) {
    const d3 = parseISO(iso);
    if (!d3) return;
    const minD = parseISO(this.min);
    const maxD = parseISO(this.max);
    if (minD && d3 < minD) return;
    if (maxD && d3 > maxD) return;
    this.value = iso;
    this.dispatchEvent(
      new CustomEvent("ae-change", { bubbles: true, composed: true, detail: { value: iso } })
    );
    this._open = false;
    this._input.focus();
  }
  focus(options) {
    this._input?.focus(options);
  }
  blur() {
    this._input?.blur();
  }
  /** Programmatic open. */
  async open() {
    if (this.disabled) return;
    this._open = true;
    await this.updateComplete;
  }
  /** Programmatic close. */
  async close() {
    this._open = false;
    await this.updateComplete;
  }
  /** Whether the calendar is currently open. */
  get isOpen() {
    return this._open;
  }
  /** Form-associated validity state. */
  get validity() {
    return this._internals.validity;
  }
  /** Validation message. */
  get validationMessage() {
    return this._internals.validationMessage;
  }
};
AeDatePicker.formAssociated = true;
AeDatePicker.styles = i`
    /*
     * Theme-overridable tokens (--ae-date-picker-bg, -border, -radius,
     * -toggle-bg, -toggle-border, -cal-bg, -cal-border, -cal-radius,
     * -cal-day-radius, -cal-day-selected-bg/-fg) are NOT declared at
     * :host — :host declarations would shadow inherited theme overrides.
     * Resolved at consumption point via var(--token, default). Locked
     * down by src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      min-width: 12rem;
    }

    .field {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      background: var(--ae-date-picker-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-date-picker-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-date-picker-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid
        var(--ae-date-picker-border, var(--ae-color-border-strong));
      border-radius: var(--ae-date-picker-radius, var(--ae-radius-default));
      transition: border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .field:has(input:focus-visible) {
      ${focusRing}
      border-color: var(--ae-color-accent);
    }
    :host([disabled]) .field {
      opacity: var(--ae-opacity-disabled, 0.55);
      cursor: not-allowed;
    }

    :host([invalid]) .field,
    :host([invalid]) .field:has(input:focus-visible) {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .field:has(input:focus-visible) {
      ${invalidRing}
    }

    input {
      all: unset;
      flex: 1 1 auto;
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      padding: var(--ae-space-2) var(--ae-space-3);
      min-height: 2.25rem;
    }

    /* Affix-style toggle button — sits inside the field with its own
     * background and an optional separator border. By default the
     * affix is transparent + has no separator (looks like an embedded
     * icon button); Metro overrides both to render a paper-2 affix
     * with a 2px ink left-border separator. */
    .toggle {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--ae-space-2);
      color: var(--ae-color-fg-muted);
      background: var(--ae-date-picker-toggle-bg, transparent);
      border-left: var(--ae-date-picker-toggle-border, 0 solid transparent);
      flex-shrink: 0;
    }
    .toggle:focus-visible {
      ${focusRing}
    }

    ${autofillReset}
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeDatePicker.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDatePicker.prototype, "min", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDatePicker.prototype, "max", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDatePicker.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDatePicker.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDatePicker.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDatePicker.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDatePicker.prototype, "format", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeDatePicker.prototype, "weekstart", 2);
__decorateClass([
  r5()
], AeDatePicker.prototype, "_open", 2);
__decorateClass([
  r5()
], AeDatePicker.prototype, "_viewYear", 2);
__decorateClass([
  r5()
], AeDatePicker.prototype, "_viewMonth", 2);
__decorateClass([
  r5()
], AeDatePicker.prototype, "_focusedISO", 2);
__decorateClass([
  e5("input")
], AeDatePicker.prototype, "_input", 2);
AeDatePicker = __decorateClass([
  t3("ae-date-picker")
], AeDatePicker);
function toISO(d3) {
  const y3 = d3.getFullYear().toString().padStart(4, "0");
  const m2 = (d3.getMonth() + 1).toString().padStart(2, "0");
  const day = d3.getDate().toString().padStart(2, "0");
  return `${y3}-${m2}-${day}`;
}
function parseISO(s4) {
  if (!s4) return null;
  const m2 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s4);
  if (!m2) return null;
  const [, y3, mo, d3] = m2;
  const yr = Number(y3);
  const mm = Number(mo) - 1;
  const dd = Number(d3);
  if (!Number.isFinite(yr) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  const date = new Date(yr, mm, dd);
  if (date.getFullYear() !== yr || date.getMonth() !== mm || date.getDate() !== dd) {
    return null;
  }
  return date;
}
function formatDate(d3, format) {
  return format.replace(/YYYY/g, d3.getFullYear().toString().padStart(4, "0")).replace(/YY/g, d3.getFullYear().toString().slice(-2)).replace(/MM/g, (d3.getMonth() + 1).toString().padStart(2, "0")).replace(/M/g, (d3.getMonth() + 1).toString()).replace(/DD/g, d3.getDate().toString().padStart(2, "0")).replace(/D/g, d3.getDate().toString());
}
function parseAnyDate(v2, format) {
  if (!v2) return null;
  const iso = parseISO(v2);
  if (iso) return toISO(iso);
  const tokens = [];
  const pattern = format.replace(/YYYY|YY|MM|M|DD|D/g, (m3) => {
    if (m3 === "YYYY") {
      tokens.push({ key: "Y", len: 4 });
      return "(\\d{4})";
    }
    if (m3 === "YY") {
      tokens.push({ key: "Y", len: 2 });
      return "(\\d{2})";
    }
    if (m3 === "MM") {
      tokens.push({ key: "M", len: 2 });
      return "(\\d{2})";
    }
    if (m3 === "M") {
      tokens.push({ key: "M", len: 1 });
      return "(\\d{1,2})";
    }
    if (m3 === "DD") {
      tokens.push({ key: "D", len: 2 });
      return "(\\d{2})";
    }
    if (m3 === "D") {
      tokens.push({ key: "D", len: 1 });
      return "(\\d{1,2})";
    }
    return m3;
  });
  const re = new RegExp(`^${pattern}$`);
  const m2 = re.exec(v2);
  if (!m2) return null;
  let y3 = 0, mo = 0, d3 = 0;
  for (let i7 = 0; i7 < tokens.length; i7++) {
    const t5 = tokens[i7];
    const val = Number(m2[i7 + 1]);
    if (t5.key === "Y") y3 = t5.len === 2 ? 2e3 + val : val;
    else if (t5.key === "M") mo = val;
    else if (t5.key === "D") d3 = val;
  }
  const iso2 = `${y3.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d3.toString().padStart(2, "0")}`;
  return parseISO(iso2) ? iso2 : null;
}

// src/components/time-picker/ae-time-picker.ts
var AeTimePicker = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.step = 15;
    this.min = "";
    this.max = "";
    this.format = 24;
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this._open = false;
    this._activeIdx = -1;
    /** Forwards host `aria-label` / `aria-description` onto the inner time
     *  input so a wrapping `<ae-form-field>` (or standalone) names it. */
    this._ariaForward = new ForwardAriaController(this, () => this._input);
    this._popupId = `ae-time-popup-${Math.random().toString(36).slice(2, 9)}`;
    this._popupEl = null;
    this._docListenersBound = false;
    this._onScrollOrResize = () => this._positionPopup();
    this._onDocPointerDown = (e8) => {
      const target = e8.target;
      if (!target) return;
      if (this.contains(target)) return;
      if (this._popupEl && this._popupEl.contains(target)) return;
      this._open = false;
    };
    // -- Events ----------------------------------------------------------
    this._onToggleClick = (e8) => {
      if (this.disabled) return;
      e8.preventDefault();
      this._open = !this._open;
      if (this._open) this._input.focus();
    };
    this._onFocus = () => {
    };
    this._onInput = (e8) => {
      const v2 = e8.target.value;
      const iso = parseTimeInput(v2);
      if (iso !== null) {
        this.value = iso;
        this.dispatchEvent(
          new CustomEvent("ae-change", { bubbles: true, composed: true, detail: { value: iso } })
        );
      }
    };
    this._onBlur = () => {
      this._input.value = displayTime(this.value, this.format);
      queueMicrotask(() => {
        const active = document.activeElement;
        if (active && this._popupEl && this._popupEl.contains(active)) return;
        if (active === this._input) return;
        this._open = false;
      });
    };
    this._onKeyDown = (e8) => {
      if (this.disabled) return;
      const key = e8.key;
      if (!this._open && (key === "ArrowDown" || key === "ArrowUp")) {
        e8.preventDefault();
        this._open = true;
        return;
      }
      if (!this._open) return;
      switch (key) {
        case "Escape":
          e8.preventDefault();
          this._open = false;
          this._input.focus();
          return;
        case "ArrowDown":
          e8.preventDefault();
          this._moveActive(1);
          return;
        case "ArrowUp":
          e8.preventDefault();
          this._moveActive(-1);
          return;
        case "Home":
          e8.preventDefault();
          this._activeIdx = 0;
          return;
        case "End":
          e8.preventDefault();
          this._activeIdx = this._generateOptions().length - 1;
          return;
        case "Enter":
        case " ": {
          e8.preventDefault();
          const opts = this._generateOptions();
          const sel = opts[this._activeIdx];
          if (sel) this._commit(sel);
          return;
        }
        case "Tab":
          this._open = false;
          return;
      }
    };
    this._onPopupClick = (e8) => {
      const target = e8.target;
      if (!target) return;
      const btn = target.closest("[data-value]");
      if (!btn) return;
      e8.preventDefault();
      const v2 = btn.dataset["value"];
      this._commit(v2);
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._removeDocListeners();
    if (this._popupEl) this._unmountPopup();
  }
  updated(changed) {
    if (changed.has("value")) this._syncFormValue();
    if (changed.has("_open")) {
      const transitioned = changed.get("_open") !== void 0;
      if (this._open) {
        this.setAttribute("data-open", "");
        this._mountPopup();
        this._addDocListeners();
        this._positionPopup();
        this._renderPopup();
        this._scrollActiveIntoView();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this.removeAttribute("data-open");
        this._unmountPopup();
        this._syncActiveDescendant();
        this._removeDocListeners();
        if (transitioned)
          this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
    } else if (changed.has("_activeIdx") && this._open) {
      this._renderPopup();
      this._scrollActiveIntoView();
    } else if (changed.has("value") && this._open) {
      this._renderPopup();
    }
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value);
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, "Please choose a time.");
    } else if (this.value && !parseTime(this.value)) {
      this._internals.setValidity({ badInput: true }, "Invalid time.");
    } else if (this.value) {
      const cur = parseTime(this.value);
      const minM = parseTime(this.min);
      const maxM = parseTime(this.max);
      if (cur !== null && minM !== null && cur < minM) {
        this._internals.setValidity({ rangeUnderflow: true }, `Time must be at or after ${this.min}.`);
      } else if (cur !== null && maxM !== null && cur > maxM) {
        this._internals.setValidity({ rangeOverflow: true }, `Time must be at or before ${this.max}.`);
      } else {
        this._internals.setValidity({});
      }
    } else {
      this._internals.setValidity({});
    }
  }
  render() {
    return b2`
      <div class="field">
        <input
          part="input"
          type="text"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this._open ? "true" : "false"}
          aria-required=${this.required ? "true" : A}
          aria-invalid=${this.invalid ? "true" : A}
          aria-disabled=${this.disabled ? "true" : A}
          ?disabled=${this.disabled}
          placeholder=${this.format === 12 ? "h:mm AM" : "HH:MM"}
          .value=${displayTime(this.value, this.format)}
          @input=${this._onInput}
          @blur=${this._onBlur}
          @keydown=${this._onKeyDown}
          @focus=${this._onFocus}
        />
        <button
          class="toggle"
          type="button"
          tabindex="-1"
          aria-label="Open time list"
          @click=${this._onToggleClick}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M8 4 L8 8 L11 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    `;
  }
  // -- Options ---------------------------------------------------------
  _generateOptions() {
    const step = Math.max(1, Number(this.step) || 15);
    const minM = parseTime(this.min) ?? 0;
    const maxM = parseTime(this.max) ?? 24 * 60 - 1;
    const out = [];
    for (let m2 = minM; m2 <= maxM; m2 += step) {
      out.push(minutesToISO(m2));
    }
    return out;
  }
  // -- Popup -----------------------------------------------------------
  _mountPopup() {
    if (this._popupEl) return;
    const wrap = document.createElement("div");
    wrap.id = this._popupId;
    wrap.setAttribute("role", "listbox");
    wrap.setAttribute("part", "popup");
    Object.assign(wrap.style, {
      position: "absolute",
      zIndex: "var(--ae-z-popover, 1400)",
      background: "var(--ae-time-picker-popup-bg, var(--ae-color-bg-elevated))",
      backdropFilter: "var(--ae-time-picker-popup-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      WebkitBackdropFilter: "var(--ae-time-picker-popup-backdrop-filter, var(--ae-surface-backdrop-filter, none))",
      color: "var(--ae-color-fg)",
      border: "var(--ae-time-picker-popup-border, 1px solid var(--ae-color-border))",
      borderRadius: "var(--ae-time-picker-popup-radius, var(--ae-radius-md))",
      boxShadow: "var(--ae-shadow-lg)",
      padding: "var(--ae-space-1)",
      minWidth: "10rem",
      maxHeight: "14rem",
      overflowY: "auto",
      fontFamily: "var(--ae-font-family-sans)",
      fontSize: "var(--ae-font-size-sm)"
    });
    wrap.addEventListener("click", this._onPopupClick);
    document.body.appendChild(wrap);
    this._popupEl = wrap;
  }
  _unmountPopup() {
    if (!this._popupEl) return;
    this._popupEl.removeEventListener("click", this._onPopupClick);
    this._popupEl.remove();
    this._popupEl = null;
  }
  _positionPopup() {
    if (!this._popupEl) return;
    const rect = this.getBoundingClientRect();
    this._popupEl.style.top = `${window.scrollY + rect.bottom + 4}px`;
    this._popupEl.style.left = `${window.scrollX + rect.left}px`;
    this._popupEl.style.minWidth = `${rect.width}px`;
  }
  _renderPopup() {
    if (!this._popupEl) return;
    const options = this._generateOptions();
    const selected = parseTime(this.value);
    if (this._activeIdx < 0 || this._activeIdx >= options.length) {
      const matchIdx = options.findIndex((o9) => parseTime(o9) === selected);
      this._activeIdx = matchIdx >= 0 ? matchIdx : 0;
    }
    this._popupEl.innerHTML = options.map((iso, i7) => {
      const isSelected = parseTime(iso) === selected;
      const isActive = i7 === this._activeIdx;
      const styles = [
        "all:unset",
        "display:block",
        "cursor:pointer",
        "padding:var(--ae-space-2) var(--ae-space-3)",
        "border-radius:var(--ae-radius-sm)",
        "user-select:none",
        isActive ? "background:var(--ae-color-bg-muted)" : "",
        isSelected ? "color:var(--ae-color-accent-emphasis); font-weight:var(--ae-font-weight-medium); background:var(--ae-color-accent-subtle);" : ""
      ].join(";");
      return `<button type="button" role="option" part="option" id="${this._popupId}-opt-${i7}" data-idx="${i7}" data-value="${iso}" aria-selected="${isSelected}" style="${styles}">${displayTime(iso, this.format)}</button>`;
    }).join("");
    this._syncActiveDescendant();
  }
  /**
   * Associate the shadow-DOM combobox input with the body-portaled listbox
   * (`aria-controls`) and the currently-highlighted option
   * (`aria-activedescendant`). Both relationships cross the shadow boundary
   * — the popup lives in `document.body` — so they are expressed through AOM
   * element references rather than the string-id attributes a shadow root
   * cannot resolve. Cleared when the popup is closed.
   */
  _syncActiveDescendant() {
    const input = this._input;
    if (!input) return;
    if (this._open && this._popupEl) {
      setControls(input, [this._popupEl]);
      const active = this._popupEl.querySelector(
        `[data-idx="${this._activeIdx}"]`
      );
      setActiveDescendant(input, active);
    } else {
      setControls(input, []);
      setActiveDescendant(input, null);
    }
  }
  _scrollActiveIntoView() {
    if (!this._popupEl) return;
    const btn = this._popupEl.querySelector(`[data-idx="${this._activeIdx}"]`);
    if (!btn) return;
    const r6 = btn.getBoundingClientRect();
    const lr = this._popupEl.getBoundingClientRect();
    if (r6.top < lr.top || r6.bottom > lr.bottom) btn.scrollIntoView({ block: "nearest" });
  }
  _addDocListeners() {
    if (this._docListenersBound) return;
    window.addEventListener("scroll", this._onScrollOrResize, true);
    window.addEventListener("resize", this._onScrollOrResize);
    document.addEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = true;
  }
  _removeDocListeners() {
    if (!this._docListenersBound) return;
    window.removeEventListener("scroll", this._onScrollOrResize, true);
    window.removeEventListener("resize", this._onScrollOrResize);
    document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    this._docListenersBound = false;
  }
  _moveActive(delta) {
    const opts = this._generateOptions();
    if (opts.length === 0) return;
    const next = (this._activeIdx + delta + opts.length) % opts.length;
    this._activeIdx = next < 0 ? 0 : next;
  }
  _commit(iso) {
    this.value = iso;
    this._input.value = displayTime(iso, this.format);
    this._open = false;
    this.dispatchEvent(
      new CustomEvent("ae-change", { bubbles: true, composed: true, detail: { value: iso } })
    );
    this._input.focus();
  }
  focus(options) {
    this._input?.focus(options);
  }
  blur() {
    this._input?.blur();
  }
  async open() {
    if (this.disabled) return;
    this._open = true;
    await this.updateComplete;
  }
  async close() {
    this._open = false;
    await this.updateComplete;
  }
  get isOpen() {
    return this._open;
  }
  get validity() {
    return this._internals.validity;
  }
  get validationMessage() {
    return this._internals.validationMessage;
  }
};
AeTimePicker.formAssociated = true;
AeTimePicker.styles = i`
    /*
     * Theme-overridable tokens (--ae-time-picker-bg, -border, -radius,
     * -toggle-bg, -toggle-border, -popup-bg, -popup-border, -popup-radius)
     * are NOT declared at :host — :host declarations would shadow
     * inherited theme overrides. Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      min-width: 10rem;
    }

    .field {
      display: inline-flex;
      align-items: stretch;
      width: 100%;
      background: var(--ae-time-picker-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-time-picker-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-time-picker-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid
        var(--ae-time-picker-border, var(--ae-color-border-strong));
      border-radius: var(--ae-time-picker-radius, var(--ae-radius-default));
    }
    .field:has(input:focus-visible) {
      ${focusRing}
      border-color: var(--ae-color-accent);
    }
    :host([disabled]) .field {
      opacity: var(--ae-opacity-disabled, 0.55);
      cursor: not-allowed;
    }

    :host([invalid]) .field,
    :host([invalid]) .field:has(input:focus-visible) {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .field:has(input:focus-visible) {
      ${invalidRing}
    }

    input {
      all: unset;
      flex: 1 1 auto;
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg);
      padding: var(--ae-space-2) var(--ae-space-3);
      min-height: 2.25rem;
    }
    input::placeholder {
      color: var(--ae-color-fg-subtle);
    }

    .toggle {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--ae-space-2);
      color: var(--ae-color-fg-muted);
      background: var(--ae-time-picker-toggle-bg, transparent);
      border-left: var(--ae-time-picker-toggle-border, 0 solid transparent);
      flex-shrink: 0;
    }
    .toggle:focus-visible {
      ${focusRing}
    }

    ${autofillReset}
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimePicker.prototype, "value", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeTimePicker.prototype, "step", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimePicker.prototype, "min", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimePicker.prototype, "max", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeTimePicker.prototype, "format", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTimePicker.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTimePicker.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTimePicker.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimePicker.prototype, "name", 2);
__decorateClass([
  r5()
], AeTimePicker.prototype, "_open", 2);
__decorateClass([
  r5()
], AeTimePicker.prototype, "_activeIdx", 2);
__decorateClass([
  e5("input")
], AeTimePicker.prototype, "_input", 2);
AeTimePicker = __decorateClass([
  t3("ae-time-picker")
], AeTimePicker);
function parseTime(s4) {
  if (!s4) return null;
  const m2 = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s4);
  if (!m2) return null;
  const h3 = Number(m2[1]);
  const mm = Number(m2[2]);
  if (h3 < 0 || h3 > 23 || mm < 0 || mm > 59) return null;
  return h3 * 60 + mm;
}
function minutesToISO(m2) {
  const h3 = Math.floor(m2 / 60);
  const mm = m2 % 60;
  return `${h3.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}
function displayTime(s4, fmt) {
  if (!s4) return "";
  const minutes = parseTime(s4);
  if (minutes === null) return s4;
  const h3 = Math.floor(minutes / 60);
  const m2 = minutes % 60;
  if (fmt === 24) return minutesToISO(minutes);
  const ampm = h3 < 12 ? "AM" : "PM";
  let h12 = h3 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m2.toString().padStart(2, "0")} ${ampm}`;
}
function parseTimeInput(v2) {
  if (!v2) return null;
  const isoMatch = parseTime(v2);
  if (isoMatch !== null) return minutesToISO(isoMatch);
  const m2 = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/.exec(v2.trim());
  if (m2) {
    let h3 = Number(m2[1]);
    const mm = Number(m2[2]);
    const ampm = m2[3].toUpperCase();
    if (h3 < 1 || h3 > 12 || mm < 0 || mm > 59) return null;
    if (ampm === "AM") {
      if (h3 === 12) h3 = 0;
    } else {
      if (h3 !== 12) h3 += 12;
    }
    return minutesToISO(h3 * 60 + mm);
  }
  return null;
}

// src/components/file-input/ae-file-input.ts
var AeFileInput = class extends i4 {
  constructor() {
    super();
    this.accept = "";
    this.multiple = false;
    this.disabled = false;
    this.required = false;
    this.invalid = false;
    this.name = "";
    this.capture = "";
    this.label = "Choose file\u2026";
    this._files = [];
    this._dragOver = false;
    this._onTriggerClick = () => {
      if (this.disabled) return;
      this._input?.click();
    };
    this._onFileChange = (e8) => {
      const input = e8.target;
      const next = Array.from(input.files ?? []);
      this._setFiles(next);
    };
    this._onDragOver = (e8) => {
      if (this.disabled) return;
      if (!e8.dataTransfer) return;
      e8.preventDefault();
      e8.dataTransfer.dropEffect = "copy";
      if (!this._dragOver) {
        this._dragOver = true;
        this.setAttribute("data-dragging", "");
      }
    };
    this._onDragLeave = (e8) => {
      if (this.disabled) return;
      e8.preventDefault();
      const next = e8.relatedTarget;
      if (next && e8.currentTarget.contains(next)) return;
      this._dragOver = false;
      this.removeAttribute("data-dragging");
    };
    this._onDrop = (e8) => {
      if (this.disabled) return;
      e8.preventDefault();
      this._dragOver = false;
      this.removeAttribute("data-dragging");
      const dropped = Array.from(e8.dataTransfer?.files ?? []);
      if (dropped.length === 0) return;
      const next = this.multiple ? dropped : dropped.slice(0, 1);
      this._setFiles(next);
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
  }
  updated(changed) {
    if (changed.has("_files")) this._syncFormValue();
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    if (this._files.length === 0) {
      this._internals.setFormValue(null);
      if (this.required) {
        this._internals.setValidity({ valueMissing: true }, "Please choose a file.");
      } else {
        this._internals.setValidity({});
      }
      return;
    }
    const fd = new FormData();
    for (const file of this._files) {
      fd.append(this.name || "file", file, file.name);
    }
    this._internals.setFormValue(fd);
    this._internals.setValidity({});
  }
  /** Public read-only access to the current selection. */
  get files() {
    return this._files;
  }
  render() {
    return b2`
      <div
        class="dropzone"
        part="dropzone"
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <span class="start-row">
          <slot name="start"></slot>
          <span class="label">
            <span class="label-emphasis">${this.label}</span> or drag and drop
          </span>
        </span>
        <button
          class="trigger"
          part="trigger"
          type="button"
          aria-disabled=${this.disabled ? "true" : A}
          aria-invalid=${this.invalid ? "true" : A}
          ?disabled=${this.disabled}
          @click=${this._onTriggerClick}
        >
          Browse files
        </button>
        <input
          type="file"
          tabindex="-1"
          aria-hidden="true"
          accept=${this.accept || A}
          ?multiple=${this.multiple}
          ?required=${this.required}
          ?disabled=${this.disabled}
          capture=${this.capture || A}
          @change=${this._onFileChange}
        />
      </div>
      ${this._files.length > 0 ? b2`<ul class="file-list">
            ${this._files.map(
      (f3, i7) => b2`<li class="file-row" part="file">
                <span class="file-name" title=${f3.name}>${f3.name}</span>
                <span class="file-size">${formatBytes(f3.size)}</span>
                <button
                  class="remove"
                  type="button"
                  aria-label=${`Remove ${f3.name}`}
                  ?disabled=${this.disabled}
                  @click=${() => this._removeFile(i7)}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true" width="12" height="12">
                    <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>
              </li>`
    )}
          </ul>` : A}
    `;
  }
  _removeFile(idx) {
    const next = this._files.slice();
    next.splice(idx, 1);
    this._setFiles(next);
    if (this._input) this._input.value = "";
  }
  _setFiles(next) {
    this._files = next;
    this.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { files: next.slice() }
      })
    );
  }
  focus(options) {
    const trigger = this.shadowRoot?.querySelector(".trigger");
    trigger?.focus(options);
  }
  /** Form-associated validity. */
  get validity() {
    return this._internals.validity;
  }
  /** Validation message. */
  get validationMessage() {
    return this._internals.validationMessage;
  }
};
AeFileInput.formAssociated = true;
AeFileInput.styles = i`
    /* Surface defaults live in the var() fallbacks (not declared at :host) so a
     * brand can recolor the drop zone at :root without being shadowed. Metro
     * turns it into the source FileDrop: a 3px dashed ink frame on paper-2 with
     * a ticket-styled (ink-framed, uppercase mono) browse trigger. */
    :host {
      display: block;
      font-family: var(--ae-font-family-sans);
    }

    .dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ae-space-2);
      background: var(--ae-file-input-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-file-input-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-file-input-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-file-input-border-width, var(--ae-border-width-1)) dashed
        var(--ae-file-input-border, var(--ae-color-border-strong));
      border-radius: var(--ae-file-input-radius, var(--ae-radius-default));
      padding: var(--ae-file-input-padding, var(--ae-space-4));
      text-align: center;
      transition:
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    :host([data-dragging]) .dropzone {
      border-color: var(--ae-file-input-border-active, var(--ae-color-accent));
      background: var(--ae-color-accent-subtle);
    }
    :host([disabled]) .dropzone {
      opacity: var(--ae-opacity-disabled, 0.55);
      cursor: not-allowed;
    }

    /* Invalid: recolor the (dashed) drop-zone border to danger so the
     * error reads even before the trigger is focused. */
    :host([invalid]) .dropzone {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .trigger {
      border-color: var(--ae-color-danger);
    }
    :host([invalid]) .trigger:focus-visible {
      ${invalidRing}
    }

    .start-row {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
    }
    .start-row ::slotted(*) {
      color: var(--ae-color-fg-muted);
    }

    .label {
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg-muted);
    }
    .label-emphasis {
      color: var(--ae-color-accent-emphasis);
      font-weight: var(--ae-font-weight-medium);
    }

    .trigger {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
      padding: var(--ae-space-2) var(--ae-space-3);
      border: var(--ae-border-width-1) solid
        var(--ae-file-input-trigger-border, var(--ae-color-border-strong));
      border-radius: var(--ae-file-input-trigger-radius, var(--ae-radius-default));
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-file-input-trigger-weight, inherit);
      letter-spacing: var(--ae-file-input-trigger-tracking, normal);
      text-transform: var(--ae-file-input-trigger-transform, none);
      color: var(--ae-color-fg);
      background: var(--ae-file-input-trigger-bg, var(--ae-color-bg));
    }
    .trigger:hover:not(:disabled) {
      background: var(--ae-color-bg-subtle);
    }
    .trigger:focus-visible {
      ${focusRing}
    }
    .trigger:disabled {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }

    input[type='file'] {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .file-list {
      list-style: none;
      margin: var(--ae-space-3) 0 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ae-space-2);
      width: 100%;
    }

    .file-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ae-space-2);
      padding: var(--ae-space-2) var(--ae-space-3);
      background: var(--ae-color-bg-subtle);
      border-radius: var(--ae-radius-sm);
      font-size: var(--ae-font-size-sm);
    }
    .file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
      min-width: 0;
    }
    .file-size {
      flex: none;
      color: var(--ae-color-fg-subtle);
      font-size: var(--ae-font-size-xs);
      font-variant-numeric: tabular-nums;
    }
    .remove {
      all: unset;
      cursor: pointer;
      color: var(--ae-color-fg-muted);
      padding: var(--ae-space-1);
      border-radius: var(--ae-radius-sm);
      display: inline-flex;
    }
    .remove:hover {
      color: var(--ae-color-danger-emphasis);
    }
    .remove:focus-visible {
      ${focusRing}
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeFileInput.prototype, "accept", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFileInput.prototype, "multiple", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFileInput.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFileInput.prototype, "required", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeFileInput.prototype, "invalid", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeFileInput.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeFileInput.prototype, "capture", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeFileInput.prototype, "label", 2);
__decorateClass([
  r5()
], AeFileInput.prototype, "_files", 2);
__decorateClass([
  r5()
], AeFileInput.prototype, "_dragOver", 2);
__decorateClass([
  e5('input[type="file"]')
], AeFileInput.prototype, "_input", 2);
AeFileInput = __decorateClass([
  t3("ae-file-input")
], AeFileInput);
function formatBytes(n6) {
  if (n6 < 1024) return `${n6} B`;
  if (n6 < 1024 * 1024) return `${(n6 / 1024).toFixed(1)} KB`;
  if (n6 < 1024 * 1024 * 1024) return `${(n6 / 1024 / 1024).toFixed(1)} MB`;
  return `${(n6 / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// src/components/popover/ae-popover.ts
var AePopover = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.placement = "bottom";
    this.offset = 8;
    this.flip = true;
    this.closeOnClickOutside = true;
    this.closeOnEscape = true;
    this.anchor = "";
    this._resolvedPlacement = "bottom";
    this._panelEl = null;
    this._movedChildren = [];
    this._placeholder = null;
    this._scrollAncestors = [];
    this._rafId = 0;
    this._previouslyFocused = null;
    this._scheduleReposition = () => {
      if (!this.open) return;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        this._rafId = 0;
        this._position();
      });
    };
    this._onKeyDown = (e8) => {
      if (!this.open) return;
      if (e8.key === "Escape" && this.closeOnEscape) {
        e8.stopPropagation();
        this.open = false;
      }
    };
    this._onPointerDown = (e8) => {
      if (!this.open || !this.closeOnClickOutside) return;
      const panel = this._panelEl;
      const anchor = this._resolveAnchor();
      const target = e8.target;
      const path = typeof e8.composedPath === "function" ? e8.composedPath() : [];
      if (containedBy(panel, target, path)) return;
      if (containedBy(anchor, target, path)) return;
      this.open = false;
    };
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._scheduleReposition, { passive: true });
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("pointerdown", this._onPointerDown, true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._scheduleReposition);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("pointerdown", this._onPointerDown, true);
    this._releaseScrollAncestors();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._teardownPanel();
  }
  updated(changed) {
    if (changed.has("open")) {
      const anchor = this._resolveAnchor();
      if (this.open) {
        this._previouslyFocused = document.activeElement ?? null;
        this._mountPanel();
        this._attachScrollAncestors();
        this._scheduleReposition();
        anchor?.setAttribute("aria-haspopup", "dialog");
        anchor?.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => {
          if (!this.open || !this._panelEl) return;
          const focusable = this._panelEl.querySelector(AePopover.FOCUSABLE);
          (focusable ?? this._panelEl).focus();
        });
        this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this._unmountPanel();
        this._releaseScrollAncestors();
        anchor?.setAttribute("aria-expanded", "false");
        const restore = this._previouslyFocused;
        this._previouslyFocused = null;
        restore?.focus?.();
        this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
    } else if (this.open && (changed.has("placement") || changed.has("offset") || changed.has("flip") || changed.has("anchor"))) {
      this._scheduleReposition();
    }
  }
  /** Returns the body-portal panel element for tests / consumers. */
  getPanel() {
    return this._panelEl;
  }
  _mountPanel() {
    if (this._panelEl) return;
    const panel = document.createElement("div");
    panel.setAttribute("part", "panel");
    panel.classList.add("ae-popover-panel");
    panel.setAttribute("role", "dialog");
    panel.tabIndex = -1;
    const lbl = this.getAttribute("aria-label");
    const lblBy = this.getAttribute("aria-labelledby");
    if (lbl) panel.setAttribute("aria-label", lbl);
    if (lblBy) panel.setAttribute("aria-labelledby", lblBy);
    panel.dataset["placement"] = this._resolvedPlacement;
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--ae-z-popover, 1400);
      min-width: var(--ae-popover-min-width, 12rem);
      max-width: min(calc(100vw - 16px), 24rem);
      background: var(--ae-popover-bg, var(--ae-color-bg-elevated));
      color: var(--ae-popover-fg, var(--ae-color-fg));
      border: var(--ae-popover-border-width, var(--ae-border-width-1, 1px)) solid var(--ae-popover-border, var(--ae-color-border));
      border-radius: var(--ae-popover-radius, var(--ae-radius-md));
      box-shadow: var(--ae-popover-shadow, var(--ae-shadow-md));
      backdrop-filter: var(--ae-popover-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-popover-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      padding: var(--ae-popover-padding, var(--ae-space-3));
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-default);
      line-height: var(--ae-line-height-default);
      pointer-events: auto;
    `;
    this._placeholder = document.createComment("ae-popover-children");
    this.appendChild(this._placeholder);
    this._movedChildren = [];
    const original = Array.from(this.childNodes);
    for (const node of original) {
      if (node === this._placeholder) continue;
      this._movedChildren.push(node);
      panel.appendChild(node);
    }
    document.body.appendChild(panel);
    this._panelEl = panel;
  }
  _unmountPanel() {
    if (!this._panelEl) return;
    if (this._placeholder && this._placeholder.parentNode === this) {
      for (const node of this._movedChildren) {
        this.insertBefore(node, this._placeholder);
      }
      this._placeholder.remove();
    }
    this._movedChildren = [];
    this._placeholder = null;
    this._panelEl.remove();
    this._panelEl = null;
  }
  _teardownPanel() {
    if (this._panelEl) {
      this._panelEl.remove();
      this._panelEl = null;
    }
    this._movedChildren = [];
    this._placeholder = null;
  }
  _resolveAnchor() {
    if (this.anchor instanceof HTMLElement) return this.anchor;
    if (typeof this.anchor === "string" && this.anchor) {
      const root = this.getRootNode();
      const el = root.querySelector?.(this.anchor) ?? document.querySelector(this.anchor);
      return el instanceof HTMLElement ? el : null;
    }
    return this.previousElementSibling instanceof HTMLElement ? this.previousElementSibling : null;
  }
  _position() {
    const anchor = this._resolveAnchor();
    const panel = this._panelEl;
    if (!anchor || !panel) return;
    const a4 = anchor.getBoundingClientRect();
    const p3 = panel.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const off = this.offset;
    const compute = (place) => {
      let x2 = 0;
      let y3 = 0;
      const [side, align = "center"] = place.split("-");
      switch (side) {
        case "top":
          y3 = a4.top - p3.height - off;
          x2 = a4.left + a4.width / 2 - p3.width / 2;
          if (align === "start") x2 = a4.left;
          if (align === "end") x2 = a4.right - p3.width;
          break;
        case "bottom":
          y3 = a4.bottom + off;
          x2 = a4.left + a4.width / 2 - p3.width / 2;
          if (align === "start") x2 = a4.left;
          if (align === "end") x2 = a4.right - p3.width;
          break;
        case "left":
          x2 = a4.left - p3.width - off;
          y3 = a4.top + a4.height / 2 - p3.height / 2;
          if (align === "start") y3 = a4.top;
          if (align === "end") y3 = a4.bottom - p3.height;
          break;
        case "right":
          x2 = a4.right + off;
          y3 = a4.top + a4.height / 2 - p3.height / 2;
          if (align === "start") y3 = a4.top;
          if (align === "end") y3 = a4.bottom - p3.height;
          break;
      }
      return { x: x2, y: y3 };
    };
    const wouldOverflow = (place, pos2) => {
      const side = place.split("-")[0];
      if (side === "top") return pos2.y < 0;
      if (side === "bottom") return pos2.y + p3.height > vh;
      if (side === "left") return pos2.x < 0;
      if (side === "right") return pos2.x + p3.width > vw;
      return false;
    };
    let chosen = this.placement;
    let pos = compute(chosen);
    if (this.flip && wouldOverflow(chosen, pos)) {
      const flipped = this._flipPlacement(chosen);
      const flippedPos = compute(flipped);
      if (!wouldOverflow(flipped, flippedPos)) {
        chosen = flipped;
        pos = flippedPos;
      }
    }
    pos.x = Math.max(4, Math.min(pos.x, Math.max(4, vw - p3.width - 4)));
    pos.y = Math.max(4, Math.min(pos.y, Math.max(4, vh - p3.height - 4)));
    this._resolvedPlacement = chosen;
    panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    panel.dataset["placement"] = chosen;
  }
  _flipPlacement(p3) {
    const [side, align] = p3.split("-");
    const opposite = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left"
    };
    const next = opposite[side] ?? side;
    return align ? `${next}-${align}` : next;
  }
  _attachScrollAncestors() {
    this._releaseScrollAncestors();
    const anchor = this._resolveAnchor();
    if (!anchor) return;
    let node = anchor.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        node.addEventListener("scroll", this._scheduleReposition, { passive: true });
        this._scrollAncestors.push(node);
      }
      node = node.parentElement;
    }
    window.addEventListener("scroll", this._scheduleReposition, { passive: true });
  }
  _releaseScrollAncestors() {
    for (const node of this._scrollAncestors) {
      node.removeEventListener("scroll", this._scheduleReposition);
    }
    this._scrollAncestors = [];
    window.removeEventListener("scroll", this._scheduleReposition);
  }
  render() {
    return b2``;
  }
};
AePopover.FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
AePopover.styles = i`
    :host {
      display: contents;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AePopover.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AePopover.prototype, "placement", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AePopover.prototype, "offset", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AePopover.prototype, "flip", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-click-outside" })
], AePopover.prototype, "closeOnClickOutside", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AePopover.prototype, "closeOnEscape", 2);
__decorateClass([
  n4()
], AePopover.prototype, "anchor", 2);
__decorateClass([
  r5()
], AePopover.prototype, "_resolvedPlacement", 2);
AePopover = __decorateClass([
  t3("ae-popover")
], AePopover);
function containedBy(container, target, path) {
  if (!container) return false;
  if (target === container) return true;
  if (path.includes(container)) return true;
  if (target && typeof container.contains === "function" && container.contains(target)) return true;
  let node = target;
  while (node) {
    if (node === container) return true;
    node = node.parentNode;
  }
  return false;
}

// src/components/tooltip/ae-tooltip.ts
var _tooltipIdCounter = 0;
var AeTooltip = class extends i4 {
  constructor() {
    super(...arguments);
    this.for = "";
    this.target = null;
    this.placement = "top";
    this.delay = 200;
    this.disabled = false;
    this._open = false;
    this._tipEl = null;
    this._anchorEl = null;
    this._showTimer = null;
    this._hideTimer = null;
    this._tooltipId = `ae-tooltip-${++_tooltipIdCounter}`;
    this._rafId = 0;
    this._scrollAncestors = [];
    this._onMouseEnter = () => {
      if (this.disabled) return;
      this._cancelHide();
      this._scheduleShow();
    };
    this._onMouseLeave = () => {
      this._cancelShow();
      this._scheduleHide();
    };
    this._onTipEnter = () => {
      this._cancelHide();
    };
    this._onTipLeave = () => {
      this._hide();
    };
    this._onFocusIn = () => {
      if (this.disabled) return;
      this._show();
    };
    this._onFocusOut = () => {
      this._cancelShow();
      this._hide();
    };
    this._onKeyDown = (e8) => {
      if (this._open && e8.key === "Escape") {
        this._hide();
      }
    };
    this._scheduleReposition = () => {
      if (!this._open) return;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        this._rafId = 0;
        this._position();
      });
    };
  }
  connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this._wireAnchor());
    window.addEventListener("resize", this._scheduleReposition, { passive: true });
    document.addEventListener("keydown", this._onKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unwireAnchor();
    window.removeEventListener("resize", this._scheduleReposition);
    document.removeEventListener("keydown", this._onKeyDown);
    if (this._showTimer) clearTimeout(this._showTimer);
    if (this._hideTimer) clearTimeout(this._hideTimer);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._releaseScrollAncestors();
    this._hide();
  }
  updated(changed) {
    if (changed.has("for") || changed.has("target")) {
      this._unwireAnchor();
      this._wireAnchor();
    }
  }
  _resolveAnchor() {
    if (this.target instanceof HTMLElement) return this.target;
    if (this.for) {
      const root = this.getRootNode();
      const el = root.getElementById?.(this.for) ?? document.getElementById(this.for);
      return el instanceof HTMLElement ? el : null;
    }
    return this.previousElementSibling instanceof HTMLElement ? this.previousElementSibling : null;
  }
  _wireAnchor() {
    const anchor = this._resolveAnchor();
    if (!anchor) return;
    this._anchorEl = anchor;
    const existing = anchor.getAttribute("aria-describedby") ?? "";
    const ids = existing.split(/\s+/).filter(Boolean);
    if (!ids.includes(this._tooltipId)) {
      ids.push(this._tooltipId);
      anchor.setAttribute("aria-describedby", ids.join(" "));
    }
    anchor.addEventListener("mouseenter", this._onMouseEnter);
    anchor.addEventListener("mouseleave", this._onMouseLeave);
    anchor.addEventListener("focusin", this._onFocusIn);
    anchor.addEventListener("focusout", this._onFocusOut);
  }
  _unwireAnchor() {
    if (!this._anchorEl) return;
    const existing = this._anchorEl.getAttribute("aria-describedby") ?? "";
    const ids = existing.split(/\s+/).filter((x2) => x2 && x2 !== this._tooltipId);
    if (ids.length) {
      this._anchorEl.setAttribute("aria-describedby", ids.join(" "));
    } else {
      this._anchorEl.removeAttribute("aria-describedby");
    }
    this._anchorEl.removeEventListener("mouseenter", this._onMouseEnter);
    this._anchorEl.removeEventListener("mouseleave", this._onMouseLeave);
    this._anchorEl.removeEventListener("focusin", this._onFocusIn);
    this._anchorEl.removeEventListener("focusout", this._onFocusOut);
    this._anchorEl = null;
  }
  _scheduleShow() {
    this._cancelShow();
    this._showTimer = setTimeout(() => {
      this._showTimer = null;
      this._show();
    }, this.delay);
  }
  _cancelShow() {
    if (this._showTimer) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
  }
  /** Grace period before hiding, so the pointer can reach the tip (1.4.13). */
  _scheduleHide() {
    this._cancelHide();
    this._hideTimer = setTimeout(() => {
      this._hideTimer = null;
      this._hide();
    }, 150);
  }
  _cancelHide() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }
  _show() {
    this._cancelHide();
    if (this.disabled || this._open) return;
    this._open = true;
    this._mountTip();
    this._attachScrollAncestors();
    this._scheduleReposition();
  }
  _hide() {
    if (!this._open) return;
    this._open = false;
    this._unmountTip();
    this._releaseScrollAncestors();
  }
  _mountTip() {
    if (this._tipEl) return;
    const tip = document.createElement("div");
    tip.id = this._tooltipId;
    tip.setAttribute("role", "tooltip");
    tip.setAttribute("part", "tip");
    tip.classList.add("ae-tooltip-tip");
    tip.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--ae-z-tooltip, 1500);
      background: var(--ae-tooltip-bg, var(--ae-color-bg-inverse));
      color: var(--ae-tooltip-fg, var(--ae-color-fg-inverse));
      font-family: var(--ae-tooltip-font-family, var(--ae-font-family-sans));
      font-size: var(--ae-tooltip-font-size, var(--ae-font-size-xs));
      font-weight: var(--ae-tooltip-font-weight, normal);
      letter-spacing: var(--ae-tooltip-tracking, normal);
      line-height: var(--ae-tooltip-line-height, var(--ae-line-height-snug));
      padding: var(--ae-tooltip-padding, 4px 8px);
      border-radius: var(--ae-tooltip-radius, var(--ae-radius-sm));
      box-shadow: var(--ae-tooltip-shadow, var(--ae-shadow-sm));
      backdrop-filter: var(--ae-tooltip-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-tooltip-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      max-width: var(--ae-tooltip-max-width, 16rem);
      pointer-events: auto;
      box-sizing: border-box;
    `;
    tip.textContent = this.textContent ?? "";
    tip.addEventListener("mouseenter", this._onTipEnter);
    tip.addEventListener("mouseleave", this._onTipLeave);
    document.body.appendChild(tip);
    this._tipEl = tip;
  }
  _unmountTip() {
    if (this._tipEl) {
      this._tipEl.remove();
      this._tipEl = null;
    }
  }
  _position() {
    const anchor = this._anchorEl;
    const tip = this._tipEl;
    if (!anchor || !tip) return;
    const a4 = anchor.getBoundingClientRect();
    const t5 = tip.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const off = 8;
    const [side, align = "center"] = this.placement.split("-");
    let x2 = 0;
    let y3 = 0;
    switch (side) {
      case "top":
        y3 = a4.top - t5.height - off;
        x2 = a4.left + a4.width / 2 - t5.width / 2;
        if (align === "start") x2 = a4.left;
        if (align === "end") x2 = a4.right - t5.width;
        break;
      case "bottom":
        y3 = a4.bottom + off;
        x2 = a4.left + a4.width / 2 - t5.width / 2;
        if (align === "start") x2 = a4.left;
        if (align === "end") x2 = a4.right - t5.width;
        break;
      case "left":
        x2 = a4.left - t5.width - off;
        y3 = a4.top + a4.height / 2 - t5.height / 2;
        if (align === "start") y3 = a4.top;
        if (align === "end") y3 = a4.bottom - t5.height;
        break;
      case "right":
        x2 = a4.right + off;
        y3 = a4.top + a4.height / 2 - t5.height / 2;
        if (align === "start") y3 = a4.top;
        if (align === "end") y3 = a4.bottom - t5.height;
        break;
    }
    x2 = Math.max(4, Math.min(x2, Math.max(4, vw - t5.width - 4)));
    y3 = Math.max(4, Math.min(y3, Math.max(4, vh - t5.height - 4)));
    tip.style.transform = `translate(${x2}px, ${y3}px)`;
  }
  _attachScrollAncestors() {
    this._releaseScrollAncestors();
    const anchor = this._anchorEl;
    if (!anchor) return;
    let node = anchor.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        node.addEventListener("scroll", this._scheduleReposition, { passive: true });
        this._scrollAncestors.push(node);
      }
      node = node.parentElement;
    }
    window.addEventListener("scroll", this._scheduleReposition, { passive: true });
  }
  _releaseScrollAncestors() {
    for (const node of this._scrollAncestors) {
      node.removeEventListener("scroll", this._scheduleReposition);
    }
    this._scrollAncestors = [];
    window.removeEventListener("scroll", this._scheduleReposition);
  }
  /** Returns the body-attached tip element for tests / consumers. */
  getTip() {
    return this._tipEl;
  }
  /** Force-show without delay. Useful for programmatic activation and tests. */
  show() {
    this._show();
  }
  /** Force-hide. */
  hide() {
    this._cancelShow();
    this._hide();
  }
  render() {
    return b2``;
  }
};
AeTooltip.styles = i`
    :host {
      display: none;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTooltip.prototype, "for", 2);
__decorateClass([
  n4()
], AeTooltip.prototype, "target", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTooltip.prototype, "placement", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeTooltip.prototype, "delay", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTooltip.prototype, "disabled", 2);
__decorateClass([
  r5()
], AeTooltip.prototype, "_open", 2);
AeTooltip = __decorateClass([
  t3("ae-tooltip")
], AeTooltip);

// src/shared/inert-background.ts
var BackgroundInert = class {
  constructor() {
    this._inerted = [];
    this._bodyOverflow = null;
    this._active = false;
  }
  /**
   * Inert all body-level siblings except the one that contains `live`, and
   * (unless `lockScroll` is false) lock body scroll.
   *
   * @param live       Any element inside the overlay subtree. Its
   *                   top-level ancestor under `<body>` is kept interactive.
   * @param lockScroll Whether to also set `overflow: hidden` on `<body>`.
   */
  activate(live, lockScroll = true) {
    if (this._active) return;
    this._active = true;
    const keep = live ? topLevelAncestor(live) : null;
    for (const child of Array.from(document.body.children)) {
      if (child === keep) continue;
      if (child instanceof HTMLElement && !child.inert) {
        child.inert = true;
        this._inerted.push(child);
      }
    }
    if (lockScroll) {
      this._bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
  }
  /** Restore the inert flags this controller set and unlock body scroll. */
  release() {
    if (!this._active) return;
    this._active = false;
    for (const el of this._inerted) {
      el.inert = false;
    }
    this._inerted = [];
    if (this._bodyOverflow !== null) {
      document.body.style.overflow = this._bodyOverflow;
      this._bodyOverflow = null;
    }
  }
  /** Whether the background is currently inerted. */
  get active() {
    return this._active;
  }
};
function topLevelAncestor(el) {
  let cur = el;
  while (cur.parentElement && cur.parentElement !== document.body) {
    cur = cur.parentElement;
  }
  return cur;
}

// src/components/modal/ae-modal.ts
var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"], ae-button:not([disabled])';
var AeModal = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.size = "md";
    this.closeOnClickOutside = false;
    this.closeOnEscape = true;
    this.labelledby = "";
    this.describedby = "";
    this._previouslyFocused = null;
    this._previousBodyOverflow = "";
    this._hasHeader = false;
    this._hasFooter = false;
    /** Background inert for the degraded path only — native `showModal()`
     *  already inerts everything outside the top-layer dialog. */
    this._bgInert = new BackgroundInert();
    this._onCancel = (e8) => {
      if (!this.closeOnEscape) {
        e8.preventDefault();
        return;
      }
      e8.preventDefault();
      this.open = false;
      this.dispatchEvent(new CustomEvent("ae-close-cancel", { bubbles: true, composed: true }));
    };
    this._onDialogClick = (e8) => {
      if (!this.closeOnClickOutside) return;
      if (e8.target === this._dialog) {
        this.open = false;
        this.dispatchEvent(new CustomEvent("ae-close-cancel", { bubbles: true, composed: true }));
      }
    };
    this._onKeyDown = (e8) => {
      if (e8.key === "Tab") {
        const focusables = this._getFocusables();
        if (focusables.length === 0) {
          e8.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = this.getRootNode().activeElement;
        if (e8.shiftKey && active === first) {
          e8.preventDefault();
          last.focus();
        } else if (!e8.shiftKey && active === last) {
          e8.preventDefault();
          first.focus();
        }
      }
    };
    this._onSlotChange = (e8) => {
      const slot = e8.target;
      const assigned = slot.assignedNodes({ flatten: true }).length > 0;
      if (slot.name === "header") this._hasHeader = assigned;
      if (slot.name === "footer") this._hasFooter = assigned;
      this.requestUpdate();
    };
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this._openDialog();
      } else {
        this._closeDialog();
      }
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._bgInert.release();
    this._restoreBodyScroll();
  }
  _openDialog() {
    if (!this._dialog) return;
    this._previouslyFocused = document.activeElement ?? null;
    this._lockBodyScroll();
    let usedShowModal = false;
    if (typeof this._dialog.showModal === "function") {
      try {
        this._dialog.showModal();
        usedShowModal = true;
      } catch {
        this._dialog.setAttribute("open", "");
      }
    } else {
      this._dialog.setAttribute("open", "");
    }
    if (!usedShowModal) {
      this._bgInert.activate(this, false);
    }
    if (this.labelledby) this._dialog.setAttribute("aria-labelledby", this.labelledby);
    if (this.describedby) this._dialog.setAttribute("aria-describedby", this.describedby);
    queueMicrotask(() => this._focusFirst());
    this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
  }
  _closeDialog() {
    if (!this._dialog) return;
    if (typeof this._dialog.close === "function") {
      try {
        this._dialog.close();
      } catch {
        this._dialog.removeAttribute("open");
      }
    } else {
      this._dialog.removeAttribute("open");
    }
    this._bgInert.release();
    this._restoreBodyScroll();
    this._previouslyFocused?.focus?.();
    this._previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
  }
  _lockBodyScroll() {
    this._previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  _restoreBodyScroll() {
    if (this._previousBodyOverflow !== void 0) {
      document.body.style.overflow = this._previousBodyOverflow;
    }
  }
  _focusFirst() {
    const focusables = this._getFocusables();
    const first = focusables[0];
    first?.focus();
  }
  _getFocusables() {
    if (!this._dialog) return [];
    const all = Array.from(this.querySelectorAll(FOCUSABLE_SELECTOR));
    return all.filter((el) => el.offsetParent !== null || el === document.activeElement);
  }
  render() {
    return b2`
      <dialog
        part="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this.labelledby || A}
        aria-describedby=${this.describedby || A}
        @cancel=${this._onCancel}
        @click=${this._onDialogClick}
        @keydown=${this._onKeyDown}
      >
        <div class="inner">
          <div part="header" class="header" ?hidden=${!this._hasHeader}>
            <slot name="header" @slotchange=${this._onSlotChange}></slot>
          </div>
          <div part="body" class="body">
            <slot></slot>
          </div>
          <div part="footer" class="footer" ?hidden=${!this._hasFooter}>
            <slot name="footer" @slotchange=${this._onSlotChange}></slot>
          </div>
        </div>
      </dialog>
    `;
  }
};
AeModal.styles = i`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
      /* Default to a transparent (effectively borderless) edge so existing
       * themes are unchanged, but make --ae-modal-border live so a brand can
       * give the panel a defined edge (v1's dialog panel has a 1px border). */
      border: var(--ae-modal-border-width, var(--ae-border-width-1)) solid var(--ae-modal-border, transparent);
      background: var(--ae-modal-bg, var(--ae-color-bg-elevated));
      color: var(--ae-modal-fg, var(--ae-color-fg));
      border-radius: var(--ae-modal-radius, var(--ae-radius-lg));
      box-shadow: var(--ae-modal-shadow, var(--ae-shadow-2xl));
      backdrop-filter: var(--ae-modal-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-modal-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      width: var(--ae-modal-width, 28rem);
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 32px);
      overflow: hidden;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-default);
      line-height: var(--ae-line-height-default);
      z-index: var(--ae-z-modal);
    }

    dialog::backdrop {
      background: var(--ae-modal-backdrop, var(--ae-color-bg-overlay));
      /*
       * Frost + desaturate the page BEHIND the scrim — the editorial
       * "DimmedPage" treatment. Distinct from --ae-modal-backdrop-filter,
       * which frosts the modal surface itself. Default none, so only an
       * opted-in theme (editorial) blurs the page behind the modal.
       */
      backdrop-filter: var(--ae-modal-backdrop-page-filter, none);
      -webkit-backdrop-filter: var(--ae-modal-backdrop-page-filter, none);
    }

    :host([size='sm']) { --ae-modal-width: 20rem; }
    :host([size='md']) { --ae-modal-width: 28rem; }
    :host([size='lg']) { --ae-modal-width: 36rem; }
    :host([size='xl']) { --ae-modal-width: 48rem; }
    :host([size='full']) {
      --ae-modal-width: 100vw;
    }
    :host([size='full']) dialog {
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }

    .inner {
      display: grid;
      grid-template-rows: auto 1fr auto;
      max-height: inherit;
    }

    .header,
    .body,
    .footer {
      padding: var(--ae-modal-padding, var(--ae-space-5));
    }
    .header {
      border-bottom: var(--ae-modal-divider-width, var(--ae-border-width-1)) solid
        var(--ae-modal-divider, var(--ae-color-border-subtle));
      font-family: var(--ae-modal-title-font-family, var(--ae-font-family-display));
      font-weight: var(--ae-modal-title-font-weight, var(--ae-font-weight-semibold));
      letter-spacing: var(--ae-modal-title-tracking, normal);
      font-size: var(--ae-modal-title-font-size, var(--ae-font-size-lg));
    }
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
      font-family: var(--ae-modal-title-font-family, var(--ae-font-family-display));
      /* A slotted heading carries the UA-default heading margin + size;
       * the .header region owns the title's sizing and padding, so the
       * heading must collapse its own box to sit flush. font: inherit
       * pulls the .header's font-size/weight onto the title. */
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: var(--ae-line-height-tight, 1.25);
    }
    .footer {
      border-top: var(--ae-modal-divider-width, var(--ae-border-width-1)) solid
        var(--ae-modal-divider, var(--ae-color-border-subtle));
      background: var(--ae-modal-footer-bg, var(--ae-color-bg-subtle));
      display: flex;
      gap: var(--ae-space-2);
      justify-content: flex-end;
    }
    .body {
      overflow: auto;
    }

    [hidden] {
      display: none !important;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeModal.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeModal.prototype, "size", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-click-outside" })
], AeModal.prototype, "closeOnClickOutside", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AeModal.prototype, "closeOnEscape", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeModal.prototype, "labelledby", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeModal.prototype, "describedby", 2);
__decorateClass([
  e5("dialog")
], AeModal.prototype, "_dialog", 2);
AeModal = __decorateClass([
  t3("ae-modal")
], AeModal);

// src/components/dialog/ae-dialog.ts
var FOCUSABLE_SELECTOR2 = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"], ae-button:not([disabled])';
var AeDialog = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.title = "";
    this.description = "";
    this.confirmLabel = "OK";
    this.cancelLabel = "Cancel";
    this.tone = "neutral";
    this.closeOnEscape = true;
    this._portalEl = null;
    this._slotMount = null;
    this._bodyChildren = [];
    this._bodyPlaceholder = null;
    this._previouslyFocused = null;
    /** Inerts + scroll-locks the background while the dialog is open
     *  (this is a custom portal overlay, not a native `<dialog>`, so the
     *  browser does not supply top-layer inert for us). */
    this._bgInert = new BackgroundInert();
    this._onConfirm = () => {
      this.dispatchEvent(new CustomEvent("ae-confirm", { bubbles: true, composed: true }));
      this.open = false;
    };
    this._onCancel = () => {
      this.dispatchEvent(new CustomEvent("ae-cancel", { bubbles: true, composed: true }));
      this.open = false;
    };
    this._onKeyDown = (e8) => {
      if (!this.open) return;
      if (e8.key === "Escape" && this.closeOnEscape) {
        e8.stopPropagation();
        this._onCancel();
      }
    };
    this._onTrapKey = (e8) => {
      if (e8.key !== "Tab") return;
      const focusables = this._getFocusables();
      if (focusables.length === 0) {
        e8.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e8.shiftKey && active === first) {
        e8.preventDefault();
        last.focus();
      } else if (!e8.shiftKey && active === last) {
        e8.preventDefault();
        first.focus();
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onKeyDown);
    this._bgInert.release();
    if (this._portalEl) this._teardownPortal();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) this._openDialog();
      else this._closeDialog();
    } else if (this.open) {
      this._renderInPortal();
    }
  }
  _openDialog() {
    this._ensurePortal();
    this._renderInPortal();
    this._mountSlottedChildren();
    this._previouslyFocused = document.activeElement ?? null;
    this._bgInert.activate(this._portalEl);
    queueMicrotask(() => this._focusFirst());
  }
  _closeDialog() {
    this._unmountSlottedChildren();
    this._bgInert.release();
    this._teardownPortal();
    this._previouslyFocused?.focus?.();
    this._previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
  }
  _ensurePortal() {
    if (this._portalEl) return;
    const div = document.createElement("div");
    div.dataset["aeDialogPortal"] = "";
    document.body.appendChild(div);
    this._portalEl = div;
  }
  _teardownPortal() {
    if (this._portalEl) {
      D(A, this._portalEl);
      this._portalEl.remove();
      this._portalEl = null;
      this._slotMount = null;
    }
  }
  _renderInPortal() {
    if (!this._portalEl) return;
    const labelledById = this.title ? "ae-dialog-title" : void 0;
    const describedById = "ae-dialog-body";
    const variant2 = this.tone === "danger" ? "danger" : "primary";
    D(
      b2`
        <style>
          .overlay {
            position: fixed;
            inset: 0;
            z-index: var(--ae-z-modal, 1300);
            display: grid;
            place-items: center;
            background: var(--ae-color-bg-overlay);
            padding: 16px;
            box-sizing: border-box;
          }
          .surface {
            background: var(--ae-dialog-bg, var(--ae-color-bg-elevated));
            color: var(--ae-color-fg);
            border: var(--ae-dialog-border-width, var(--ae-border-width-1)) solid var(--ae-dialog-border, transparent);
            border-radius: var(--ae-dialog-radius, var(--ae-radius-lg));
            box-shadow: var(--ae-dialog-shadow, var(--ae-shadow-2xl));
            backdrop-filter: var(--ae-dialog-backdrop-filter, var(--ae-surface-backdrop-filter, none));
            -webkit-backdrop-filter: var(--ae-dialog-backdrop-filter, var(--ae-surface-backdrop-filter, none));
            width: var(--ae-dialog-width, 24rem);
            max-width: 100%;
            max-height: calc(100vh - 32px);
            overflow: hidden;
            display: grid;
            grid-template-rows: auto 1fr auto;
            font-family: var(--ae-font-family-sans);
            font-size: var(--ae-font-size-default);
            line-height: var(--ae-line-height-default);
          }
          .title {
            padding: var(--ae-space-4) var(--ae-space-5) 0;
            font-family: var(--ae-dialog-title-font-family, var(--ae-font-family-display));
            font-weight: var(--ae-dialog-title-font-weight, var(--ae-font-weight-semibold));
            letter-spacing: var(--ae-dialog-title-tracking, normal);
            font-size: var(--ae-dialog-title-font-size, var(--ae-font-size-lg));
          }
          .body {
            padding: var(--ae-space-3) var(--ae-space-5) var(--ae-space-4);
            color: var(--ae-color-fg-muted);
            overflow: auto;
          }
          .footer {
            padding: var(--ae-space-3) var(--ae-space-4);
            display: flex;
            gap: var(--ae-space-2);
            justify-content: flex-end;
            background: var(--ae-dialog-footer-bg, var(--ae-color-bg-subtle));
            border-top: var(--ae-dialog-divider-width, var(--ae-border-width-1)) solid
              var(--ae-dialog-divider, var(--ae-color-border-subtle));
          }
          .btn {
            all: unset;
            box-sizing: border-box;
            cursor: pointer;
            padding: var(--ae-space-2) var(--ae-space-4);
            border-radius: var(--ae-radius-md);
            border: var(--ae-border-width-1) solid var(--ae-color-border-strong);
            font-weight: var(--ae-font-weight-medium);
            font-size: var(--ae-font-size-sm);
            background: var(--ae-color-bg);
            color: var(--ae-color-fg);
          }
          .btn:focus-visible {
            outline: var(--ae-focus-ring-width) var(--ae-focus-ring-style) var(--ae-color-focus-ring);
            outline-offset: var(--ae-focus-ring-offset);
          }
          .btn[data-variant='primary'] {
            background: var(--ae-color-accent);
            border-color: transparent;
            color: var(--ae-color-fg-on-accent);
          }
          .btn[data-variant='danger'] {
            background: var(--ae-color-danger);
            border-color: transparent;
            color: var(--ae-color-fg-on-danger);
          }
        </style>
        <div class="overlay" part="overlay" @keydown=${this._onTrapKey}>
          <div
            class="surface"
            part="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby=${labelledById ?? A}
            aria-describedby=${describedById}
          >
            ${this.title ? b2`<div part="title" id="ae-dialog-title" class="title">${this.title}</div>` : A}
            <div part="body" id="ae-dialog-body" class="body">
              <div class="slot-mount"></div>
              ${this.description ? b2`<p>${this.description}</p>` : A}
            </div>
            <div part="footer" class="footer">
              <button
                type="button"
                part="cancel"
                class="btn"
                data-action="cancel"
                @click=${this._onCancel}
              >${this.cancelLabel}</button>
              <button
                type="button"
                part="confirm"
                class="btn"
                data-action="confirm"
                data-variant=${variant2}
                @click=${this._onConfirm}
              >${this.confirmLabel}</button>
            </div>
          </div>
        </div>
      `,
      this._portalEl
    );
    this._slotMount = this._portalEl.querySelector(".slot-mount");
  }
  _mountSlottedChildren() {
    if (!this._slotMount) return;
    if (this._bodyPlaceholder) return;
    this._bodyPlaceholder = document.createComment("ae-dialog-children");
    this.appendChild(this._bodyPlaceholder);
    this._bodyChildren = [];
    const children = Array.from(this.childNodes);
    for (const node of children) {
      if (node === this._bodyPlaceholder) continue;
      this._bodyChildren.push(node);
      this._slotMount.appendChild(node);
    }
  }
  _unmountSlottedChildren() {
    if (this._bodyPlaceholder && this._bodyPlaceholder.parentNode === this) {
      for (const node of this._bodyChildren) {
        this.insertBefore(node, this._bodyPlaceholder);
      }
      this._bodyPlaceholder.remove();
    }
    this._bodyChildren = [];
    this._bodyPlaceholder = null;
  }
  _getFocusables() {
    if (!this._portalEl) return [];
    return Array.from(this._portalEl.querySelectorAll(FOCUSABLE_SELECTOR2));
  }
  _focusFirst() {
    if (this.tone === "danger") {
      const cancel = this._portalEl?.querySelector('[data-action="cancel"]');
      cancel?.focus();
      return;
    }
    const confirm = this._portalEl?.querySelector('[data-action="confirm"]');
    confirm?.focus();
  }
  /** Returns the dialog surface element for tests / consumers. */
  getSurface() {
    return this._portalEl?.querySelector(".surface") ?? null;
  }
  render() {
    return b2``;
  }
};
AeDialog.styles = i`
    :host {
      display: contents;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDialog.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDialog.prototype, "title", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDialog.prototype, "description", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "confirm-label" })
], AeDialog.prototype, "confirmLabel", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "cancel-label" })
], AeDialog.prototype, "cancelLabel", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDialog.prototype, "tone", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AeDialog.prototype, "closeOnEscape", 2);
AeDialog = __decorateClass([
  t3("ae-dialog")
], AeDialog);

// src/components/drawer/ae-drawer.ts
var FOCUSABLE_SELECTOR3 = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"], ae-button:not([disabled])';
var AeDrawer = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.placement = "end";
    this.size = "md";
    this.closeOnClickOutside = true;
    this.closeOnEscape = true;
    this.labelledby = "";
    this._hasHeader = false;
    this._hasFooter = false;
    this._previouslyFocused = null;
    this._previousBodyOverflow = "";
    // Tracks whether the panel is "visually" mounted (after open=true) vs. dismounted.
    this._mounted = false;
    this._onKeyDown = (e8) => {
      if (!this.open) return;
      if (e8.key === "Escape" && this.closeOnEscape) {
        e8.stopPropagation();
        this.open = false;
      }
      if (e8.key === "Tab") {
        this._trapTab(e8);
      }
    };
    this._onBackdropClick = () => {
      if (this.closeOnClickOutside) this.open = false;
    };
    this._onTransitionEnd = (e8) => {
      if (e8.propertyName !== "transform") return;
      const target = e8.target;
      if (target && target.getAttribute?.("part") !== "drawer") return;
      if (this.open) {
        this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
    };
    this._onSlotChange = (e8) => {
      const slot = e8.target;
      const assigned = slot.assignedNodes({ flatten: true }).length > 0;
      if (slot.name === "header") this._hasHeader = assigned;
      if (slot.name === "footer") this._hasFooter = assigned;
      this.requestUpdate();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onKeyDown);
    this._restoreBodyScroll();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) this._openDrawer();
      else this._closeDrawer();
    }
  }
  _openDrawer() {
    this._mounted = true;
    this._previouslyFocused = document.activeElement ?? null;
    this._lockBodyScroll();
    queueMicrotask(() => this._focusFirst());
  }
  _closeDrawer() {
    this._restoreBodyScroll();
    this._previouslyFocused?.focus?.();
    this._previouslyFocused = null;
  }
  _lockBodyScroll() {
    this._previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  _restoreBodyScroll() {
    document.body.style.overflow = this._previousBodyOverflow;
  }
  _trapTab(e8) {
    const focusables = this._getFocusables();
    if (focusables.length === 0) {
      e8.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.getRootNode().activeElement;
    if (e8.shiftKey && active === first) {
      e8.preventDefault();
      last.focus();
    } else if (!e8.shiftKey && active === last) {
      e8.preventDefault();
      first.focus();
    }
  }
  _getFocusables() {
    return Array.from(this.querySelectorAll(FOCUSABLE_SELECTOR3));
  }
  _focusFirst() {
    const focusables = this._getFocusables();
    focusables[0]?.focus();
  }
  render() {
    void this._mounted;
    return b2`
      <div part="backdrop" class="backdrop" @click=${this._onBackdropClick} aria-hidden="true"></div>
      <aside
        part="drawer"
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${this.labelledby || A}
        aria-hidden=${this.open ? "false" : "true"}
        @transitionend=${this._onTransitionEnd}
      >
        <div part="header" class="header" ?hidden=${!this._hasHeader}>
          <slot name="header" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div part="body" class="body">
          <slot></slot>
        </div>
        <div part="footer" class="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._onSlotChange}></slot>
        </div>
      </aside>
    `;
  }
};
AeDrawer.styles = i`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--ae-z-overlay);
      background: var(--ae-drawer-backdrop, var(--ae-color-bg-overlay));
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--ae-duration-normal) var(--ae-easing-ease-out);
    }

    .drawer {
      position: fixed;
      z-index: var(--ae-z-modal);
      background: var(--ae-drawer-bg, var(--ae-color-bg-elevated));
      color: var(--ae-drawer-fg, var(--ae-color-fg));
      box-shadow: var(--ae-drawer-shadow, var(--ae-shadow-2xl));
      backdrop-filter: var(--ae-drawer-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-drawer-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-default);
      line-height: var(--ae-line-height-default);
      display: grid;
      grid-template-rows: auto 1fr auto;
      box-sizing: border-box;
      transition: transform var(--ae-duration-normal) var(--ae-easing-ease-out);
    }

    /* Placement & size */
    :host([size='sm']) { --ae-drawer-size: 18rem; }
    :host([size='md']) { --ae-drawer-size: 24rem; }
    :host([size='lg']) { --ae-drawer-size: 32rem; }
    :host([size='full']) { --ae-drawer-size: 100%; }

    :host([placement='start']) .drawer,
    :host([placement='end']) .drawer {
      top: 0;
      bottom: 0;
      width: var(--ae-drawer-size, 24rem);
      max-width: 100vw;
    }
    :host([placement='top']) .drawer,
    :host([placement='bottom']) .drawer {
      left: 0;
      right: 0;
      height: var(--ae-drawer-size, 24rem);
      max-height: 100vh;
    }

    /* Leading-edge border (the edge facing the content). Off by default
     * (width 0 / transparent); Metro draws the source SlidePanel's 3px ink
     * rule along it. */
    :host([placement='start']) .drawer {
      left: 0; transform: translateX(-100%);
      border-right: var(--ae-drawer-border-width, 0) solid var(--ae-drawer-border, transparent);
    }
    :host([placement='end']) .drawer {
      right: 0; transform: translateX(100%);
      border-left: var(--ae-drawer-border-width, 0) solid var(--ae-drawer-border, transparent);
    }
    :host([placement='top']) .drawer {
      top: 0;  transform: translateY(-100%);
      border-bottom: var(--ae-drawer-border-width, 0) solid var(--ae-drawer-border, transparent);
    }
    :host([placement='bottom']) .drawer {
      bottom: 0; transform: translateY(100%);
      border-top: var(--ae-drawer-border-width, 0) solid var(--ae-drawer-border, transparent);
    }

    :host([open]) .backdrop {
      opacity: 1;
      pointer-events: auto;
    }
    :host([open]) .drawer {
      transform: translate(0, 0);
    }

    /*
     * When closed, hide the panel so its focusable content leaves the tab
     * order (otherwise off-screen-transformed content stays Tab-reachable —
     * a focus-management defect). visibility:hidden is DELAYED until after
     * the slide-out transition so the exit animation still plays. This
     * CSS-only "unmount" replaces the is-dismounted class, which was
     * never actually applied to the element.
     */
    :host(:not([open])) .drawer {
      visibility: hidden;
      transition:
        transform var(--ae-duration-normal) var(--ae-easing-ease-out),
        visibility 0s linear var(--ae-duration-normal);
    }
    :host([open]) .drawer {
      visibility: visible;
    }

    .header,
    .body,
    .footer {
      padding: var(--ae-space-5);
    }
    .header {
      border-bottom: var(--ae-drawer-divider-width, var(--ae-border-width-1)) solid
        var(--ae-drawer-divider, var(--ae-color-border-subtle));
      font-weight: var(--ae-drawer-title-font-weight, var(--ae-font-weight-semibold));
      letter-spacing: var(--ae-drawer-title-tracking, normal);
      font-size: var(--ae-font-size-lg);
    }
    .body {
      overflow: auto;
    }
    .footer {
      border-top: var(--ae-drawer-divider-width, var(--ae-border-width-1)) solid
        var(--ae-drawer-divider, var(--ae-color-border-subtle));
      background: var(--ae-drawer-footer-bg, var(--ae-color-bg-subtle));
      display: flex;
      gap: var(--ae-space-2);
      justify-content: flex-end;
    }
    [hidden] { display: none !important; }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeDrawer.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDrawer.prototype, "placement", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDrawer.prototype, "size", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-click-outside" })
], AeDrawer.prototype, "closeOnClickOutside", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AeDrawer.prototype, "closeOnEscape", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDrawer.prototype, "labelledby", 2);
__decorateClass([
  e5('[part="drawer"]')
], AeDrawer.prototype, "_panel", 2);
AeDrawer = __decorateClass([
  t3("ae-drawer")
], AeDrawer);

// src/components/toast/ae-toast.ts
var AeToast = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.tone = "neutral";
    this.duration = 5e3;
    this.dismissible = true;
    this._hideTimer = null;
    /**
     * WCAG 2.2.1 (Timing Adjustable): the auto-dismiss countdown is a time
     * limit, so it must pause while the user is interacting with the toast.
     * Hovering or focusing pauses; leaving/blurring restarts the full duration
     * (erring toward giving the user more time, never less).
     */
    this._pauseAutoDismiss = () => {
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }
    };
    this._resumeAutoDismiss = () => {
      if (this.open) this._scheduleAutoDismiss();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.open) this._scheduleAutoDismiss();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this._scheduleAutoDismiss();
      } else if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }
    }
    if (changed.has("duration") && this.open) {
      this._scheduleAutoDismiss();
    }
  }
  _scheduleAutoDismiss() {
    if (this._hideTimer) clearTimeout(this._hideTimer);
    if (this.duration <= 0) return;
    this._hideTimer = setTimeout(() => {
      this._hideTimer = null;
      this.dismiss();
    }, this.duration);
  }
  /** Dismisses the toast and fires ae-dismiss. */
  dismiss() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent("ae-dismiss", { bubbles: true, composed: true }));
  }
  get _isAssertive() {
    return this.tone === "warning" || this.tone === "danger";
  }
  render() {
    const role = this._isAssertive ? "alert" : "status";
    const live = this._isAssertive ? "assertive" : "polite";
    return b2`
      <div
        part="toast"
        class="toast"
        role=${role}
        aria-live=${live}
        aria-atomic="true"
        @mouseenter=${this._pauseAutoDismiss}
        @mouseleave=${this._resumeAutoDismiss}
        @focusin=${this._pauseAutoDismiss}
        @focusout=${this._resumeAutoDismiss}
      >
        <div class="content">
          <div part="title" class="title"><slot name="title"></slot></div>
          <div part="body" class="body"><slot></slot></div>
        </div>
        <div class="actions">
          <slot name="action"></slot>
          ${this.dismissible ? b2`<button
                type="button"
                part="dismiss"
                class="dismiss"
                aria-label="Dismiss"
                @click=${this.dismiss}
              >×</button>` : A}
        </div>
      </div>
    `;
  }
};
AeToast.styles = i`
    :host {
      /* Tone-driven surface tokens stay declared here (the tone modifiers
       * below re-point them); their values read theme-aware semantic vars so a
       * brand still recolors them. Geometry tokens (radius/shadow) must NOT be
       * declared at :host — a :host declaration would shadow a brand's
       * :root[data-collection] override (e.g. Spectrum's tighter toast). Their
       * defaults live at the consumption point via var(--token, fallback). */
      --ae-toast-bg: var(--ae-toast-neutral-bg, var(--ae-color-bg-elevated));
      --ae-toast-fg: var(--ae-toast-neutral-fg, var(--ae-color-fg));
      --ae-toast-border: var(--ae-toast-neutral-border, var(--ae-color-border));
      --ae-toast-strip: var(--ae-toast-neutral-strip, inset 0 0 0 0 transparent);
      display: block;
      pointer-events: auto;
    }

    .toast {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--ae-toast-gap, var(--ae-space-3));
      align-items: start;
      background: var(--ae-toast-bg);
      backdrop-filter: var(--ae-toast-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-toast-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-toast-fg);
      border: var(--ae-border-width-1) solid var(--ae-toast-border);
      border-radius: var(--ae-toast-radius, var(--ae-radius-md));
      /* The leading inset is the optional tone edge-strip (Metro's ticket-stub
         color rule); it stacks before the drop shadow and is a no-op
         (transparent, 0-width) until a theme points --ae-toast-*-strip at a
         real inset. */
      box-shadow: var(--ae-toast-strip, inset 0 0 0 0 transparent),
        var(--ae-toast-shadow, var(--ae-shadow-lg));
      padding: var(--ae-toast-padding, var(--ae-space-3) var(--ae-space-4));
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-toast-font-size, var(--ae-font-size-sm));
      line-height: var(--ae-toast-line-height, var(--ae-line-height-snug));
      min-width: var(--ae-toast-min-width, 16rem);
      max-width: var(--ae-toast-max-width, 28rem);
      box-sizing: border-box;
    }

    .content {
      display: grid;
      gap: var(--ae-space-1);
    }

    .title {
      font-weight: var(--ae-toast-title-weight, var(--ae-font-weight-semibold));
      text-transform: var(--ae-toast-title-transform, none);
      letter-spacing: var(--ae-toast-title-tracking, normal);
      font-size: var(--ae-toast-title-size, inherit);
    }

    .actions {
      display: flex;
      gap: var(--ae-space-1);
      align-items: center;
      /* Metro divides the action column from the body with a 2px ink rule
         (the source's bordered action button); off by default. */
      border-inline-start: var(--ae-toast-actions-divider, none);
      padding-inline-start: var(--ae-toast-actions-pad, 0);
    }

    button.dismiss {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      padding: var(--ae-space-1);
      border-radius: var(--ae-radius-sm);
      color: var(--ae-color-fg-muted);
      line-height: 1;
      font-size: var(--ae-font-size-md);
    }
    button.dismiss:focus-visible {
      outline: var(--ae-focus-ring-width) var(--ae-focus-ring-style) var(--ae-color-focus-ring);
      outline-offset: var(--ae-focus-ring-offset);
    }
    button.dismiss:hover {
      background: var(--ae-color-bg-muted);
      color: var(--ae-color-fg);
    }

    /* Tone styling. Each tone re-points the surface tokens through a per-tone
     * indirection (--ae-toast-<tone>-bg/-fg/-border/-strip) that defaults to the
     * subtle-tint treatment. A brand recolors a tone by SETTING those
     * indirection vars at :root (inherited) — it can't override --ae-toast-bg
     * directly because this :host([tone]) declaration would shadow it. Metro
     * uses this to flip tones to solid signal bg + paper/ink text + an edge
     * strip (the source's ticket-stub toast). */
    :host([tone='accent']) {
      --ae-toast-bg: var(--ae-toast-accent-bg, var(--ae-color-accent-subtle));
      --ae-toast-border: var(--ae-toast-accent-border, var(--ae-color-accent));
      --ae-toast-fg: var(--ae-toast-accent-fg, var(--ae-color-accent-emphasis));
      --ae-toast-strip: var(--ae-toast-accent-strip, inset 0 0 0 0 transparent);
    }
    :host([tone='success']) {
      --ae-toast-bg: var(--ae-toast-success-bg, var(--ae-color-success-subtle));
      --ae-toast-border: var(--ae-toast-success-border, var(--ae-color-success));
      --ae-toast-fg: var(--ae-toast-success-fg, var(--ae-color-success-emphasis));
      --ae-toast-strip: var(--ae-toast-success-strip, inset 0 0 0 0 transparent);
    }
    :host([tone='warning']) {
      --ae-toast-bg: var(--ae-toast-warning-bg, var(--ae-color-warning-subtle));
      --ae-toast-border: var(--ae-toast-warning-border, var(--ae-color-warning));
      --ae-toast-fg: var(--ae-toast-warning-fg, var(--ae-color-warning-emphasis));
      --ae-toast-strip: var(--ae-toast-warning-strip, inset 0 0 0 0 transparent);
    }
    :host([tone='danger']) {
      --ae-toast-bg: var(--ae-toast-danger-bg, var(--ae-color-danger-subtle));
      --ae-toast-border: var(--ae-toast-danger-border, var(--ae-color-danger));
      --ae-toast-fg: var(--ae-toast-danger-fg, var(--ae-color-danger-emphasis));
      --ae-toast-strip: var(--ae-toast-danger-strip, inset 0 0 0 0 transparent);
    }
    :host([tone='info']) {
      --ae-toast-bg: var(--ae-toast-info-bg, var(--ae-color-info-subtle));
      --ae-toast-border: var(--ae-toast-info-border, var(--ae-color-info));
      --ae-toast-fg: var(--ae-toast-info-fg, var(--ae-color-info-emphasis));
      --ae-toast-strip: var(--ae-toast-info-strip, inset 0 0 0 0 transparent);
    }
    :host(:not([open])) {
      display: none;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeToast.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeToast.prototype, "tone", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeToast.prototype, "duration", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeToast.prototype, "dismissible", 2);
AeToast = __decorateClass([
  t3("ae-toast")
], AeToast);
var REGION_ID = "ae-toast-region";
function ensureRegion(region) {
  const id = `${REGION_ID}-${region}`;
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement("div");
  el.id = id;
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", "Notifications");
  el.style.cssText = `
    position: fixed;
    z-index: var(--ae-z-toast, 1600);
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    padding: 16px;
    box-sizing: border-box;
    max-width: 100vw;
  `;
  const [y3, x2] = region.split("-");
  if (y3 === "top") {
    el.style.top = "0";
    el.style.bottom = "";
  } else {
    el.style.bottom = "0";
    el.style.top = "";
    el.style.flexDirection = "column-reverse";
  }
  if (x2 === "start") {
    el.style.left = "0";
    el.style.right = "";
    el.style.alignItems = "flex-start";
  } else {
    el.style.right = "0";
    el.style.left = "";
    el.style.alignItems = "flex-end";
  }
  document.body.appendChild(el);
  return el;
}
function toast(opts) {
  const t5 = document.createElement("ae-toast");
  t5.tone = opts.tone ?? "neutral";
  t5.duration = opts.duration ?? 5e3;
  t5.dismissible = opts.dismissible ?? true;
  if (opts.title) {
    const titleEl = document.createElement("span");
    titleEl.slot = "title";
    titleEl.textContent = opts.title;
    t5.appendChild(titleEl);
  }
  if (typeof opts.message === "string") {
    const msgEl = document.createElement("span");
    msgEl.textContent = opts.message;
    t5.appendChild(msgEl);
  } else {
    t5.appendChild(opts.message);
  }
  if (opts.action) {
    const btn = document.createElement("button");
    btn.slot = "action";
    btn.type = "button";
    btn.textContent = opts.action.label;
    btn.style.cssText = `
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid currentColor;
      font: inherit;
    `;
    btn.addEventListener("click", () => opts.action.onClick(t5));
    t5.appendChild(btn);
  }
  const region = ensureRegion(opts.region ?? "bottom-end");
  region.appendChild(t5);
  t5.open = true;
  t5.addEventListener("ae-dismiss", () => {
    queueMicrotask(() => t5.remove());
  });
  return t5;
}

// src/components/menu/ae-menu-item.ts
var AeMenuItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.type = "item";
    this.name = "";
    this.disabled = false;
    this.selected = false;
    this._onClick = (e8) => {
      if (this.disabled) {
        e8.preventDefault();
        e8.stopPropagation();
        return;
      }
      this._activate();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
    if (!this.hasAttribute("role")) this.setAttribute("role", "menuitem");
  }
  updated() {
    this._syncAria();
  }
  /**
   * Drive the host role and checked/disabled ARIA state from the reactive
   * `type` / `selected` / `disabled` properties. Checkbox and radio items
   * own their role outright; a plain item respects a consumer-supplied role
   * but otherwise reverts to `menuitem` (including when `type` flips back
   * from checkbox/radio).
   */
  _syncAria() {
    if (this.type === "checkbox") {
      this.setAttribute("role", "menuitemcheckbox");
    } else if (this.type === "radio") {
      this.setAttribute("role", "menuitemradio");
    } else {
      const role = this.getAttribute("role");
      if (!role || role === "menuitemcheckbox" || role === "menuitemradio") {
        this.setAttribute("role", "menuitem");
      }
    }
    if (this.type === "checkbox" || this.type === "radio") {
      this.setAttribute("aria-checked", this.selected ? "true" : "false");
    } else {
      this.removeAttribute("aria-checked");
    }
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }
  /** Programmatic activation (used by parent for keyboard handling). */
  activate() {
    if (this.disabled) return;
    this._activate();
  }
  _activate() {
    if (this.type === "checkbox") {
      this.selected = !this.selected;
    } else if (this.type === "radio") {
      this.selected = true;
    }
    this.dispatchEvent(
      new CustomEvent("ae-select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, item: this, checked: this.selected }
      })
    );
  }
  /** Text content used for typeahead matching. */
  get matchText() {
    return (this.textContent ?? "").trim().toLowerCase();
  }
  render() {
    return b2`
      <div part="item" class="item" @click=${this._onClick}>
        <span class="start"><slot name="start"></slot></span>
        <span part="label" class="label"><slot></slot></span>
        <span class="end"><slot name="end"></slot></span>
      </div>
    `;
  }
};
AeMenuItem.styles = i`
    /* Item tokens live in the var() fallbacks (not declared at :host) so a brand
     * theme can recolor the row / its highlight at :root without being shadowed
     * by a directly-matched :host declaration. Metro squares the corners and
     * lights the active row gold (matching the command-palette selected row). */
    :host {
      display: block;
    }

    .item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: var(--ae-space-2);
      align-items: center;
      padding: var(--ae-menu-item-padding, var(--ae-space-2) var(--ae-space-3));
      color: var(--ae-menu-item-fg, var(--ae-color-fg));
      border-radius: var(--ae-menu-item-radius, var(--ae-radius-sm));
      cursor: pointer;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      line-height: 1.25;
      user-select: none;
      transition: background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([disabled]) .item {
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([data-active]) .item {
      background: var(--ae-menu-item-bg-hover, var(--ae-color-bg-muted));
      color: var(--ae-menu-item-fg-active, var(--ae-menu-item-fg, var(--ae-color-fg)));
      outline: none;
    }

    .item:hover:not([data-disabled]) {
      background: var(--ae-menu-item-bg-hover, var(--ae-color-bg-muted));
      color: var(--ae-menu-item-fg-active, var(--ae-menu-item-fg, var(--ae-color-fg)));
    }

    .start,
    .end {
      display: inline-flex;
      align-items: center;
      color: var(--ae-color-fg-muted);
    }
    .start:empty,
    .end:empty {
      display: none;
    }

    :host([selected]) .end::after {
      content: '✓';
      color: var(--ae-color-accent-emphasis);
    }
    /* Radio items use a filled disc rather than a check, the convention
       that distinguishes single-choice from multi-choice menu items. */
    :host([type='radio'][selected]) .end::after {
      content: '•';
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeMenuItem.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeMenuItem.prototype, "type", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeMenuItem.prototype, "name", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeMenuItem.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeMenuItem.prototype, "selected", 2);
AeMenuItem = __decorateClass([
  t3("ae-menu-item")
], AeMenuItem);

// src/components/menu/ae-menu.ts
var AeMenu = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.placement = "bottom-start";
    this.closeOnClickOutside = true;
    this.closeOnEscape = true;
    this.anchor = "";
    this._activeIndex = -1;
    this._panelEl = null;
    this._movedChildren = [];
    this._placeholder = null;
    this._typeahead = "";
    this._typeaheadTimer = null;
    this._previouslyFocused = null;
    this._rafId = 0;
    this._scheduleReposition = () => {
      if (!this.open) return;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        this._rafId = 0;
        this._position();
      });
    };
    this._onKeyDown = (e8) => {
      if (!this.open) return;
      switch (e8.key) {
        case "ArrowDown":
        case "ArrowRight":
          e8.preventDefault();
          this._move(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e8.preventDefault();
          this._move(-1);
          break;
        case "Home":
          e8.preventDefault();
          this._moveTo(this._firstEnabledIndex());
          break;
        case "End": {
          e8.preventDefault();
          const items = this.items;
          for (let i7 = items.length - 1; i7 >= 0; i7--) {
            if (!items[i7].disabled) {
              this._activeIndex = i7;
              this._focusActive();
              return;
            }
          }
          break;
        }
        case "Enter":
        case " ": {
          e8.preventDefault();
          const it = this.items[this._activeIndex];
          if (it && !it.disabled) it.activate();
          break;
        }
        case "Escape":
          if (this.closeOnEscape) {
            e8.preventDefault();
            e8.stopPropagation();
            this.open = false;
          }
          break;
        case "Tab":
          this.open = false;
          break;
        default:
          if (e8.key.length === 1 && /\S/.test(e8.key)) {
            this._typeaheadMatch(e8.key);
          }
      }
    };
    this._onPointerDown = (e8) => {
      if (!this.open || !this.closeOnClickOutside) return;
      const panel = this._panelEl;
      const anchor = this._resolveAnchor();
      const target = e8.target;
      const path = typeof e8.composedPath === "function" ? e8.composedPath() : [];
      if (_isWithin(panel, target, path)) return;
      if (_isWithin(anchor, target, path)) return;
      this.open = false;
    };
    this._onSelect = (e8) => {
      const item = e8.detail.item;
      if (item?.disabled) return;
      if (item && (item.type === "checkbox" || item.type === "radio")) {
        if (item.type === "radio") this._clearRadioGroup(item);
        return;
      }
      this.open = false;
    };
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("pointerdown", this._onPointerDown, true);
    window.addEventListener("resize", this._scheduleReposition, { passive: true });
    window.addEventListener("scroll", this._scheduleReposition, { passive: true });
    this.addEventListener("ae-select", this._onSelect);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("pointerdown", this._onPointerDown, true);
    window.removeEventListener("resize", this._scheduleReposition);
    window.removeEventListener("scroll", this._scheduleReposition);
    this.removeEventListener("ae-select", this._onSelect);
    this._teardownPanel();
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this._mountPanel();
        this._previouslyFocused = document.activeElement ?? null;
        this._activeIndex = this._firstEnabledIndex();
        this._scheduleReposition();
        this._focusActive();
        this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
      } else {
        this._unmountPanel();
        this._previouslyFocused?.focus?.();
        this._previouslyFocused = null;
        this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
      }
    } else if (this.open) {
      this._scheduleReposition();
    }
    if (changed.has("_activeIndex")) {
      this._highlightActive();
    }
  }
  /** Returns the body-attached panel for tests / consumers. */
  getPanel() {
    return this._panelEl;
  }
  /** Returns the menu items currently rendered. */
  get items() {
    if (this._panelEl) {
      return Array.from(this._panelEl.querySelectorAll("ae-menu-item"));
    }
    return Array.from(this.querySelectorAll("ae-menu-item"));
  }
  _firstEnabledIndex() {
    return this.items.findIndex((it) => !it.disabled);
  }
  _resolveAnchor() {
    if (this.anchor instanceof HTMLElement) return this.anchor;
    if (typeof this.anchor === "string" && this.anchor) {
      const root = this.getRootNode();
      const el = root.querySelector?.(this.anchor) ?? document.querySelector(this.anchor);
      return el instanceof HTMLElement ? el : null;
    }
    return this.previousElementSibling instanceof HTMLElement ? this.previousElementSibling : null;
  }
  _mountPanel() {
    if (this._panelEl) return;
    const panel = document.createElement("div");
    panel.setAttribute("part", "panel");
    panel.setAttribute("role", "menu");
    panel.classList.add("ae-menu-panel");
    panel.tabIndex = -1;
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--ae-z-popover, 1400);
      min-width: 10rem;
      max-width: 18rem;
      background: var(--ae-menu-bg, var(--ae-color-bg-elevated));
      color: var(--ae-menu-fg, var(--ae-color-fg));
      border: var(--ae-menu-border-width, var(--ae-border-width-1, 1px)) solid var(--ae-menu-border, var(--ae-color-border));
      border-radius: var(--ae-menu-radius, var(--ae-radius-md));
      box-shadow: var(--ae-menu-shadow, var(--ae-shadow-md));
      backdrop-filter: var(--ae-menu-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-menu-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      padding: var(--ae-menu-padding, var(--ae-space-1));
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-snug);
      outline: none;
    `;
    this._placeholder = document.createComment("ae-menu-children");
    this.appendChild(this._placeholder);
    this._movedChildren = [];
    const original = Array.from(this.childNodes);
    for (const node of original) {
      if (node === this._placeholder) continue;
      this._movedChildren.push(node);
      panel.appendChild(node);
    }
    panel.addEventListener("ae-select", (e8) => {
      const detail = e8.detail;
      this.dispatchEvent(
        new CustomEvent("ae-select", {
          bubbles: true,
          composed: true,
          detail
        })
      );
    });
    document.body.appendChild(panel);
    this._panelEl = panel;
  }
  _unmountPanel() {
    if (!this._panelEl) return;
    if (this._placeholder && this._placeholder.parentNode === this) {
      for (const node of this._movedChildren) {
        this.insertBefore(node, this._placeholder);
      }
      this._placeholder.remove();
    }
    this._movedChildren = [];
    this._placeholder = null;
    this._panelEl.remove();
    this._panelEl = null;
  }
  _teardownPanel() {
    if (this._panelEl) {
      this._panelEl.remove();
      this._panelEl = null;
    }
    this._movedChildren = [];
    this._placeholder = null;
  }
  _position() {
    const anchor = this._resolveAnchor();
    const panel = this._panelEl;
    if (!anchor || !panel) return;
    const a4 = anchor.getBoundingClientRect();
    const p3 = panel.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const off = 4;
    const [side, align = "center"] = this.placement.split("-");
    let x2 = 0;
    let y3 = 0;
    switch (side) {
      case "top":
        y3 = a4.top - p3.height - off;
        x2 = a4.left + a4.width / 2 - p3.width / 2;
        if (align === "start") x2 = a4.left;
        if (align === "end") x2 = a4.right - p3.width;
        break;
      case "bottom":
        y3 = a4.bottom + off;
        x2 = a4.left + a4.width / 2 - p3.width / 2;
        if (align === "start") x2 = a4.left;
        if (align === "end") x2 = a4.right - p3.width;
        break;
      case "left":
        x2 = a4.left - p3.width - off;
        y3 = a4.top + a4.height / 2 - p3.height / 2;
        break;
      case "right":
        x2 = a4.right + off;
        y3 = a4.top + a4.height / 2 - p3.height / 2;
        break;
    }
    x2 = Math.max(4, Math.min(x2, Math.max(4, vw - p3.width - 4)));
    y3 = Math.max(4, Math.min(y3, Math.max(4, vh - p3.height - 4)));
    panel.style.transform = `translate(${x2}px, ${y3}px)`;
  }
  _highlightActive() {
    const items = this.items;
    items.forEach((it, i7) => {
      if (i7 === this._activeIndex) it.setAttribute("data-active", "");
      else it.removeAttribute("data-active");
    });
  }
  _focusActive() {
    const item = this.items[this._activeIndex];
    item?.focus();
  }
  _move(delta) {
    const items = this.items;
    if (items.length === 0) return;
    let next = this._activeIndex;
    for (let step = 0; step < items.length; step++) {
      next = (next + delta + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    this._activeIndex = next;
    this._focusActive();
  }
  _moveTo(idx) {
    const items = this.items;
    if (idx < 0 || idx >= items.length) return;
    if (items[idx].disabled) return;
    this._activeIndex = idx;
    this._focusActive();
  }
  _typeaheadMatch(ch) {
    if (this._typeaheadTimer) clearTimeout(this._typeaheadTimer);
    this._typeahead += ch.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeahead = "";
      this._typeaheadTimer = null;
    }, 500);
    const items = this.items;
    const startIdx = (this._activeIndex + 1) % Math.max(1, items.length);
    for (let i7 = 0; i7 < items.length; i7++) {
      const idx = (startIdx + i7) % items.length;
      const it = items[idx];
      if (it.disabled) continue;
      if (it.matchText.startsWith(this._typeahead)) {
        this._activeIndex = idx;
        this._focusActive();
        return;
      }
    }
  }
  /** Deselect the other radio items sharing the activated item's group. */
  _clearRadioGroup(active) {
    for (const other of this.items) {
      if (other !== active && other.type === "radio" && other.name === active.name) {
        other.selected = false;
      }
    }
  }
  render() {
    return b2``;
  }
};
AeMenu.styles = i`
    :host {
      display: contents;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeMenu.prototype, "open", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeMenu.prototype, "placement", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-click-outside" })
], AeMenu.prototype, "closeOnClickOutside", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AeMenu.prototype, "closeOnEscape", 2);
__decorateClass([
  n4()
], AeMenu.prototype, "anchor", 2);
__decorateClass([
  r5()
], AeMenu.prototype, "_activeIndex", 2);
AeMenu = __decorateClass([
  t3("ae-menu")
], AeMenu);
function _isWithin(container, target, path) {
  if (!container) return false;
  if (target === container) return true;
  if (path.includes(container)) return true;
  if (target && typeof container.contains === "function" && container.contains(target)) return true;
  let node = target;
  while (node) {
    if (node === container) return true;
    node = node.parentNode;
  }
  return false;
}

// src/components/context-menu/ae-context-menu.ts
var AeContextMenu = class extends i4 {
  constructor() {
    super(...arguments);
    this.target = "";
    this.closeOnClickOutside = true;
    this.closeOnEscape = true;
    this._open = false;
    this._activeIndex = -1;
    this._panelEl = null;
    this._movedChildren = [];
    this._placeholder = null;
    this._targetEl = null;
    this._typeahead = "";
    this._typeaheadTimer = null;
    this._previouslyFocused = null;
    this._cursorX = 0;
    this._cursorY = 0;
    this._onContextMenu = (e8) => {
      e8.preventDefault();
      this._cursorX = e8.clientX;
      this._cursorY = e8.clientY;
      this._show();
    };
    this._onKeyDown = (e8) => {
      if (!this._open) return;
      switch (e8.key) {
        case "ArrowDown":
        case "ArrowRight":
          e8.preventDefault();
          this._move(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e8.preventDefault();
          this._move(-1);
          break;
        case "Home":
          e8.preventDefault();
          this._moveTo(this._firstEnabledIndex());
          break;
        case "End": {
          e8.preventDefault();
          const items = this.items;
          for (let i7 = items.length - 1; i7 >= 0; i7--) {
            if (!items[i7].disabled) {
              this._activeIndex = i7;
              this._focusActive();
              return;
            }
          }
          break;
        }
        case "Enter":
        case " ": {
          e8.preventDefault();
          const it = this.items[this._activeIndex];
          if (it && !it.disabled) it.activate();
          break;
        }
        case "Escape":
          if (this.closeOnEscape) {
            e8.preventDefault();
            e8.stopPropagation();
            this._hide();
          }
          break;
        case "Tab":
          this._hide();
          break;
        default:
          if (e8.key.length === 1 && /\S/.test(e8.key)) {
            this._typeaheadMatch(e8.key);
          }
      }
    };
    this._onPointerDown = (e8) => {
      if (!this._open || !this.closeOnClickOutside) return;
      const panel = this._panelEl;
      const target = e8.target;
      const path = typeof e8.composedPath === "function" ? e8.composedPath() : [];
      if (_isWithinCm(panel, target, path)) return;
      this._hide();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this._wireTarget());
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("pointerdown", this._onPointerDown, true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unwireTarget();
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("pointerdown", this._onPointerDown, true);
    this._teardownPanel();
  }
  updated(changed) {
    if (changed.has("target")) {
      this._unwireTarget();
      this._wireTarget();
    }
    if (changed.has("_activeIndex")) {
      this._highlightActive();
    }
  }
  /** Returns the body-attached panel for tests / consumers. */
  getPanel() {
    return this._panelEl;
  }
  get items() {
    if (this._panelEl) {
      return Array.from(this._panelEl.querySelectorAll("ae-menu-item"));
    }
    return Array.from(this.querySelectorAll("ae-menu-item"));
  }
  /** Programmatically open at a viewport position. */
  openAt(x2, y3) {
    this._cursorX = x2;
    this._cursorY = y3;
    this._show();
  }
  _resolveTarget() {
    if (this.target instanceof HTMLElement) return this.target;
    if (typeof this.target === "string" && this.target) {
      const root = this.getRootNode();
      const el = root.querySelector?.(this.target) ?? document.querySelector(this.target);
      return el instanceof HTMLElement ? el : null;
    }
    return this.previousElementSibling instanceof HTMLElement ? this.previousElementSibling : null;
  }
  _wireTarget() {
    const t5 = this._resolveTarget();
    if (!t5) return;
    this._targetEl = t5;
    t5.addEventListener("contextmenu", this._onContextMenu);
    if (!t5.hasAttribute("aria-haspopup")) {
      t5.setAttribute("aria-haspopup", "menu");
      t5.dataset["aeCmHaspopup"] = "";
    }
  }
  _unwireTarget() {
    if (!this._targetEl) return;
    this._targetEl.removeEventListener("contextmenu", this._onContextMenu);
    if (this._targetEl.dataset["aeCmHaspopup"] !== void 0) {
      this._targetEl.removeAttribute("aria-haspopup");
      delete this._targetEl.dataset["aeCmHaspopup"];
    }
    this._targetEl = null;
  }
  _show() {
    if (this._open) {
      this._position();
      return;
    }
    this._open = true;
    this._mountPanel();
    this._previouslyFocused = document.activeElement ?? null;
    this._activeIndex = this._firstEnabledIndex();
    this._position();
    this._focusActive();
    this.dispatchEvent(new CustomEvent("ae-open", { bubbles: true, composed: true }));
  }
  _hide() {
    if (!this._open) return;
    this._open = false;
    this._unmountPanel();
    this._previouslyFocused?.focus?.();
    this._previouslyFocused = null;
    this.dispatchEvent(new CustomEvent("ae-close", { bubbles: true, composed: true }));
  }
  _firstEnabledIndex() {
    return this.items.findIndex((it) => !it.disabled);
  }
  /** Deselect the other radio items sharing the activated item's group. */
  _clearRadioGroup(active) {
    for (const other of this.items) {
      if (other !== active && other.type === "radio" && other.name === active.name) {
        other.selected = false;
      }
    }
  }
  _mountPanel() {
    if (this._panelEl) return;
    const panel = document.createElement("div");
    panel.setAttribute("part", "panel");
    panel.setAttribute("role", "menu");
    panel.classList.add("ae-context-menu-panel");
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--ae-z-popover, 1400);
      min-width: 10rem;
      max-width: 18rem;
      background: var(--ae-menu-bg, var(--ae-color-bg-elevated));
      color: var(--ae-menu-fg, var(--ae-color-fg));
      border: var(--ae-menu-border-width, var(--ae-border-width-1, 1px)) solid var(--ae-menu-border, var(--ae-color-border));
      border-radius: var(--ae-menu-radius, var(--ae-radius-md));
      box-shadow: var(--ae-menu-shadow, var(--ae-shadow-md));
      backdrop-filter: var(--ae-menu-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-menu-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      padding: var(--ae-menu-padding, var(--ae-space-1));
      box-sizing: border-box;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-snug);
    `;
    this._placeholder = document.createComment("ae-context-menu-children");
    this.appendChild(this._placeholder);
    this._movedChildren = [];
    const original = Array.from(this.childNodes);
    for (const node of original) {
      if (node === this._placeholder) continue;
      this._movedChildren.push(node);
      panel.appendChild(node);
    }
    panel.addEventListener("ae-select", (e8) => {
      const detail = e8.detail;
      const item = detail.item;
      if (item?.disabled) return;
      this.dispatchEvent(
        new CustomEvent("ae-select", {
          bubbles: true,
          composed: true,
          detail
        })
      );
      if (item && (item.type === "checkbox" || item.type === "radio")) {
        if (item.type === "radio") this._clearRadioGroup(item);
        return;
      }
      this._hide();
    });
    document.body.appendChild(panel);
    this._panelEl = panel;
  }
  _unmountPanel() {
    if (!this._panelEl) return;
    if (this._placeholder && this._placeholder.parentNode === this) {
      for (const node of this._movedChildren) {
        this.insertBefore(node, this._placeholder);
      }
      this._placeholder.remove();
    }
    this._movedChildren = [];
    this._placeholder = null;
    this._panelEl.remove();
    this._panelEl = null;
  }
  _teardownPanel() {
    if (this._panelEl) {
      this._panelEl.remove();
      this._panelEl = null;
    }
    this._movedChildren = [];
    this._placeholder = null;
  }
  _position() {
    const panel = this._panelEl;
    if (!panel) return;
    const p3 = panel.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    let x2 = this._cursorX;
    let y3 = this._cursorY;
    if (x2 + p3.width > vw - 4) x2 = Math.max(4, vw - p3.width - 4);
    if (y3 + p3.height > vh - 4) y3 = Math.max(4, vh - p3.height - 4);
    panel.style.transform = `translate(${x2}px, ${y3}px)`;
  }
  _highlightActive() {
    const items = this.items;
    items.forEach((it, i7) => {
      if (i7 === this._activeIndex) it.setAttribute("data-active", "");
      else it.removeAttribute("data-active");
    });
  }
  _focusActive() {
    const item = this.items[this._activeIndex];
    item?.focus();
  }
  _move(delta) {
    const items = this.items;
    if (items.length === 0) return;
    let next = this._activeIndex;
    for (let step = 0; step < items.length; step++) {
      next = (next + delta + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    this._activeIndex = next;
    this._focusActive();
  }
  _moveTo(idx) {
    const items = this.items;
    if (idx < 0 || idx >= items.length) return;
    if (items[idx].disabled) return;
    this._activeIndex = idx;
    this._focusActive();
  }
  _typeaheadMatch(ch) {
    if (this._typeaheadTimer) clearTimeout(this._typeaheadTimer);
    this._typeahead += ch.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeahead = "";
      this._typeaheadTimer = null;
    }, 500);
    const items = this.items;
    const startIdx = (this._activeIndex + 1) % Math.max(1, items.length);
    for (let i7 = 0; i7 < items.length; i7++) {
      const idx = (startIdx + i7) % items.length;
      const it = items[idx];
      if (it.disabled) continue;
      if (it.matchText.startsWith(this._typeahead)) {
        this._activeIndex = idx;
        this._focusActive();
        return;
      }
    }
  }
  render() {
    return b2``;
  }
};
AeContextMenu.styles = i`
    :host {
      display: contents;
    }
  `;
__decorateClass([
  n4()
], AeContextMenu.prototype, "target", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-click-outside" })
], AeContextMenu.prototype, "closeOnClickOutside", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "close-on-escape" })
], AeContextMenu.prototype, "closeOnEscape", 2);
__decorateClass([
  r5()
], AeContextMenu.prototype, "_open", 2);
__decorateClass([
  r5()
], AeContextMenu.prototype, "_activeIndex", 2);
AeContextMenu = __decorateClass([
  t3("ae-context-menu")
], AeContextMenu);
function _isWithinCm(container, target, path) {
  if (!container) return false;
  if (target === container) return true;
  if (path.includes(container)) return true;
  if (target && typeof container.contains === "function" && container.contains(target)) return true;
  let node = target;
  while (node) {
    if (node === container) return true;
    node = node.parentNode;
  }
  return false;
}

// src/components/tabs/ae-tab.ts
var AeTab = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "";
    this.disabled = false;
    this.active = false;
  }
  render() {
    return b2`
      <div
        class="panel"
        role="tabpanel"
        id="panel-${this.value}"
        ?hidden=${!this.active}
        tabindex=${this.active ? "0" : "-1"}
      >
        <slot name="panel"></slot>
      </div>
    `;
  }
  /** The rendered `role="tabpanel"` element, for cross-shadow ARIA wiring. */
  get panelElement() {
    return this.renderRoot?.querySelector(".panel") ?? null;
  }
  /** Plain-text label, used when slotted content can't be extracted. */
  get triggerLabel() {
    return this.label || this.textContent?.trim() || this.value;
  }
};
AeTab.styles = i`
    :host {
      display: contents;
    }
    .panel {
      display: block;
    }
    :host(:not([active])) .panel {
      display: none;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTab.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTab.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTab.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTab.prototype, "active", 2);
AeTab = __decorateClass([
  t3("ae-tab")
], AeTab);

// src/components/tabs/ae-tabs.ts
var AeTabs = class extends i4 {
  constructor() {
    super(...arguments);
    this.selected = "";
    this.orientation = "horizontal";
    this.variant = "line";
    this.keyboardActivation = "auto";
    this._focusIndex = 0;
    this._onSlotChange = () => {
      if (!this.selected && this._tabs?.length) {
        const first = this._tabs.find((t5) => !t5.disabled);
        if (first) this.selected = first.value;
      }
      this._syncTabs();
      this.requestUpdate();
      void this._syncPanelRefs();
    };
  }
  render() {
    const tabs = this._tabs ?? [];
    const orientation = this.orientation;
    return b2`
      <div
        part="tablist"
        class="tablist"
        role="tablist"
        aria-orientation=${orientation}
      >
        ${tabs.map((tab, i7) => {
      const selected = tab.value === this.selected;
      const tabIndex = i7 === this._focusIndex ? 0 : -1;
      return b2`
            <button
              part="tab"
              class="tab"
              role="tab"
              type="button"
              id="tab-${tab.value}"
              aria-selected=${selected ? "true" : "false"}
              tabindex=${tabIndex}
              ?disabled=${tab.disabled}
              data-index=${i7}
              @click=${() => this._onTabClick(i7)}
              @keydown=${(e8) => this._onKeyDown(e8, i7)}
            >
              ${tab.triggerLabel}
            </button>
          `;
    })}
      </div>
      <div part="panels" class="panels">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
  firstUpdated() {
    if (!this.selected && this._tabs?.length) {
      const first = this._tabs.find((t5) => !t5.disabled);
      if (first) this.selected = first.value;
    }
    this._syncTabs();
    void this._syncPanelRefs();
  }
  updated(changed) {
    if (changed.has("selected")) {
      this._syncTabs();
    }
    void this._syncPanelRefs();
  }
  /**
   * Bidirectionally associate each tab trigger (rendered in this shadow
   * root) with its panel (rendered inside the corresponding `<ae-tab>`'s
   * own shadow root). Each relationship — the trigger's `aria-controls`
   * and the panel's `aria-labelledby` — crosses a shadow boundary, so it
   * is expressed with AOM element references rather than string IDREFs.
   * The string-id fallback (`tab-*` / `panel-*`) stays on the elements for
   * runtimes without element reflection.
   */
  async _syncPanelRefs() {
    await this.updateComplete;
    const tabs = this._tabs ?? [];
    await Promise.all(tabs.map((t5) => t5.updateComplete));
    for (let i7 = 0; i7 < tabs.length; i7++) {
      const tab = tabs[i7];
      const btn = this.shadowRoot?.querySelector(
        `button.tab[data-index="${i7}"]`
      );
      const panel = tab.panelElement;
      if (!btn || !panel) continue;
      setControls(btn, [panel]);
      setLabelledBy(panel, [btn]);
    }
  }
  _syncTabs() {
    const tabs = this._tabs ?? [];
    let foundActive = false;
    for (let i7 = 0; i7 < tabs.length; i7++) {
      const tab = tabs[i7];
      const isActive = tab.value === this.selected && !tab.disabled;
      tab.active = isActive;
      if (isActive) {
        foundActive = true;
        this._focusIndex = i7;
      }
    }
    if (!foundActive && tabs.length) {
      const first = tabs.findIndex((t5) => !t5.disabled);
      if (first >= 0) this._focusIndex = first;
    }
  }
  _onTabClick(index) {
    const tab = this._tabs[index];
    if (!tab || tab.disabled) return;
    this._focusIndex = index;
    this._select(tab.value);
  }
  _onKeyDown(e8, _index) {
    const tabs = this._tabs ?? [];
    const horizontal = this.orientation === "horizontal";
    const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
    let nextIndex = this._focusIndex;
    let consumed = false;
    if (e8.key === nextKey) {
      nextIndex = this._nextEnabled(this._focusIndex, 1);
      consumed = true;
    } else if (e8.key === prevKey) {
      nextIndex = this._nextEnabled(this._focusIndex, -1);
      consumed = true;
    } else if (e8.key === "Home") {
      nextIndex = this._nextEnabled(-1, 1);
      consumed = true;
    } else if (e8.key === "End") {
      nextIndex = this._nextEnabled(tabs.length, -1);
      consumed = true;
    } else if (e8.key === "Enter" || e8.key === " ") {
      const tab = tabs[this._focusIndex];
      if (tab && !tab.disabled) {
        this._select(tab.value);
      }
      consumed = true;
    }
    if (consumed) {
      e8.preventDefault();
      e8.stopPropagation();
      this._focusIndex = nextIndex;
      const moved = tabs[nextIndex];
      this.updateComplete.then(() => {
        const btn = this.shadowRoot?.querySelector(
          `button.tab[data-index="${nextIndex}"]`
        );
        btn?.focus();
        if (this.keyboardActivation === "auto" && moved && !moved.disabled) {
          this._select(moved.value);
        }
      });
    }
  }
  _nextEnabled(from, delta) {
    const tabs = this._tabs ?? [];
    const n6 = tabs.length;
    if (n6 === 0) return 0;
    let i7 = from;
    for (let step = 0; step < n6; step++) {
      i7 = (i7 + delta + n6) % n6;
      if (!tabs[i7]?.disabled) return i7;
    }
    return Math.max(0, from);
  }
  _select(value) {
    if (value === this.selected) return;
    const previousValue = this.selected;
    this.selected = value;
    this.dispatchEvent(
      new CustomEvent("ae-tab-change", {
        bubbles: true,
        composed: true,
        detail: { value, previousValue }
      })
    );
  }
};
AeTabs.styles = i`
    :host {
      display: block;
      font-family: var(--ae-font-family-sans);
    }

    :host([orientation='vertical']) {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--ae-space-4);
    }

    .tablist {
      display: inline-flex;
      gap: var(--ae-tabs-tablist-gap, var(--ae-space-1));
      background: var(--ae-tabs-tablist-bg, transparent);
      border-bottom: var(--ae-tabs-tablist-border-width, var(--ae-border-width-1))
        solid var(--ae-tabs-tablist-border-color, var(--ae-color-border));
    }
    :host([orientation='vertical']) .tablist {
      flex-direction: column;
      border-bottom: 0;
      border-right: var(--ae-tabs-tablist-border-width, var(--ae-border-width-1))
        solid var(--ae-tabs-tablist-border-color, var(--ae-color-border));
      padding-right: var(--ae-space-2);
      align-items: stretch;
    }

    .panels {
      padding-top: var(--ae-space-4);
    }
    :host([orientation='vertical']) .panels {
      padding-top: 0;
    }

    button.tab {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ae-tabs-tab-gap, var(--ae-space-2));
      padding: var(--ae-space-2) var(--ae-space-4);
      font-family: var(--ae-tabs-tab-font-family, inherit);
      font-size: var(--ae-tabs-tab-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-tabs-tab-font-weight, var(--ae-font-weight-medium));
      letter-spacing: var(--ae-tabs-tab-letter-spacing, normal);
      text-transform: var(--ae-tabs-tab-text-transform, none);
      color: var(--ae-tabs-tab-fg-inactive, var(--ae-color-fg-muted));
      border-radius: var(--ae-radius-default);
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
      position: relative;
      white-space: nowrap;
    }
    button.tab:hover:not(:disabled) {
      color: var(--ae-color-fg);
    }
    button.tab:focus-visible {
      ${focusRing}
    }
    button.tab:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Variant: line (default) */
    :host([variant='line']) button.tab {
      border-radius: 0;
      padding: var(--ae-tabs-tab-padding, var(--ae-space-2) var(--ae-space-3));
      margin-bottom: -1px;
      border-bottom:
        var(--ae-tabs-indicator-height, 2px) solid transparent;
      /* Optional separator between adjacent tabs — used by Metro to
       * draw a 2px ink rule between file-tab cells. Default none. */
      border-right: var(--ae-tabs-tab-separator, 0 solid transparent);
    }
    :host([variant='line']) button.tab[aria-selected='true'] {
      background: var(--ae-tabs-tab-bg-active, transparent);
      color: var(--ae-tabs-tab-fg-active, var(--ae-color-accent-emphasis));
      border-bottom-color:
        var(--ae-tabs-indicator-color, var(--ae-color-accent));
    }
    /* Optional pre-label status dot on the active line tab — the source
     * design's vermilion signal dot. Defaults to display:none so only the
     * opted-in themes (Metro) render it, and a hidden pseudo consumes no flex
     * gap. Metro flips display to inline-block, 8px, accent. */
    :host([variant='line']) button.tab[aria-selected='true']::before {
      content: '';
      display: var(--ae-tabs-active-marker-display, none);
      flex: 0 0 auto;
      width: var(--ae-tabs-active-marker-size, 0.5rem);
      height: var(--ae-tabs-active-marker-size, 0.5rem);
      border-radius: var(--ae-radius-full);
      background: var(--ae-tabs-active-marker-color, var(--ae-color-accent));
    }
    :host([orientation='vertical'][variant='line']) button.tab {
      margin-bottom: 0;
      margin-right: -1px;
      border-bottom: 0;
      border-right:
        var(--ae-tabs-indicator-height, 2px) solid transparent;
      justify-content: flex-start;
    }
    :host([orientation='vertical'][variant='line']) button.tab[aria-selected='true'] {
      border-right-color:
        var(--ae-tabs-indicator-color, var(--ae-color-accent));
    }

    /* Variant: pill */
    :host([variant='pill']) .tablist {
      /* Default invisible; a theme can opt into a hairline frame around the
       * pill track by setting the width token. Kept independent of the line
       * variant's bottom border. */
      border: var(--ae-tabs-pill-tablist-border-width, 0) solid
        var(--ae-color-border-subtle);
      /* Themeable so a pack can flip the pill canvas independently of the line
       * variant's --ae-tabs-tablist-bg. Metro points this at ink (its file-tab
       * canvas) so its light paper@70% inactive-tab text stays legible — on the
       * default --ae-color-bg-muted, a light inactive fg would wash out. */
      background: var(--ae-tabs-pill-tablist-bg, var(--ae-color-bg-muted));
      /* Frosted-glass hook on the pill track — inert unless a theme opts in
       * (Crucible) via --ae-surface-backdrop-filter over a translucent track. */
      backdrop-filter: var(--ae-tabs-pill-tablist-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-tabs-pill-tablist-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      padding: var(--ae-space-1);
      border-radius: var(--ae-radius-default);
      /* Independent of the line tablist gap (--ae-tabs-tablist-gap) so the line
       * variant can open to a wide gap without pulling the pill track apart. */
      gap: var(--ae-tabs-pill-tablist-gap, 2px);
    }
    :host([variant='pill']) button.tab {
      /* Pill tabs inherit the base padding by default; tokenized so a theme
       * can size pill tabs independently of the line variant. Fallback equals
       * the inherited base padding to keep default rendering byte-identical. */
      padding: var(--ae-tabs-pill-tab-padding, var(--ae-space-2) var(--ae-space-4));
    }
    :host([variant='pill']) button.tab[aria-selected='true'] {
      background: var(--ae-tabs-pill-tab-bg-active, var(--ae-color-bg));
      color: var(--ae-tabs-pill-tab-fg-active, var(--ae-color-fg));
      box-shadow: var(--ae-tabs-pill-tab-shadow-active, var(--ae-shadow-xs));
      /* The raised active pill can frost over the track (Crucible). */
      backdrop-filter: var(--ae-tabs-pill-tab-backdrop-filter, none);
      -webkit-backdrop-filter: var(--ae-tabs-pill-tab-backdrop-filter, none);
    }

    /* Variant: enclosed */
    :host([variant='enclosed']) button.tab {
      border: var(--ae-border-width-1) solid transparent;
      border-radius: var(--ae-radius-default) var(--ae-radius-default) 0 0;
      margin-bottom: -1px;
    }
    :host([variant='enclosed']) button.tab[aria-selected='true'] {
      background: var(--ae-color-bg);
      border-color: var(--ae-color-border);
      border-bottom-color: var(--ae-color-bg);
      color: var(--ae-color-fg);
    }

    .panels ::slotted(ae-tab) {
      display: block;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTabs.prototype, "selected", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTabs.prototype, "orientation", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTabs.prototype, "variant", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "keyboard-activation" })
], AeTabs.prototype, "keyboardActivation", 2);
__decorateClass([
  r5()
], AeTabs.prototype, "_focusIndex", 2);
__decorateClass([
  o6({ selector: "ae-tab" })
], AeTabs.prototype, "_tabs", 2);
AeTabs = __decorateClass([
  t3("ae-tabs")
], AeTabs);

// src/components/breadcrumb/ae-breadcrumb-item.ts
var AeBreadcrumbItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.href = "";
    this.current = false;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }
  render() {
    if (this.current || !this.href) {
      return b2`<span class="current" aria-current=${this.current ? "page" : A}>
        <slot name="start"></slot><slot></slot>
      </span>`;
    }
    return b2`<a href=${this.href}>
      <slot name="start"></slot><slot></slot>
    </a>`;
  }
};
AeBreadcrumbItem.styles = i`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      font-family: var(--ae-breadcrumb-item-font-family, inherit);
      font-size: var(--ae-breadcrumb-item-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-breadcrumb-item-font-weight, inherit);
      letter-spacing: var(--ae-breadcrumb-item-tracking, normal);
      text-transform: var(--ae-breadcrumb-item-transform, none);
      color: var(--ae-breadcrumb-item-fg, var(--ae-color-fg-muted));
      line-height: 1;
    }

    /* Current page. Metro fills the cell with signage gold + full-ink text —
       the same active-cell treatment pagination uses — while default themes
       just ink the text and bump the weight. The fill sits on the host so it
       spans the whole stretched cell; the inner padding insets the label. */
    :host([current]) {
      color: var(--ae-breadcrumb-item-fg-current, var(--ae-color-fg));
      font-weight: var(--ae-breadcrumb-item-font-weight-current, var(--ae-font-weight-medium));
      background: var(--ae-breadcrumb-item-bg-current, transparent);
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      color: inherit;
      text-decoration: none;
      border-radius: var(--ae-radius-xs);
      /* The cell box. Default keeps a padded hit-area with a negative margin so
         it adds no visible inset (a compact trail); Metro overrides to a real
         8x14 ticket cell with 0 margin so cells sit flush inside the ink rule. */
      padding: var(--ae-breadcrumb-item-padding, 2px 4px);
      margin: var(--ae-breadcrumb-item-margin, -2px -4px);
      transition: color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    a:hover {
      color: var(--ae-color-accent-emphasis);
      text-decoration: underline;
      text-underline-offset: 0.18em;
    }
    a:focus-visible {
      ${focusRing}
    }

    .current {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      /* Match the link cell's box so the gold fill + flush layout apply to the
         current page too. Default themes leave it inset-free (0/0). */
      padding: var(--ae-breadcrumb-item-padding, 0);
      margin: var(--ae-breadcrumb-item-margin, 0);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeBreadcrumbItem.prototype, "href", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeBreadcrumbItem.prototype, "current", 2);
AeBreadcrumbItem = __decorateClass([
  t3("ae-breadcrumb-item")
], AeBreadcrumbItem);

// src/components/breadcrumb/ae-breadcrumb.ts
var AeBreadcrumb = class extends i4 {
  constructor() {
    super(...arguments);
    this.separator = "/";
    this._onSlotChange = () => this._syncSeparators();
  }
  render() {
    return b2`
      <nav aria-label="Breadcrumb">
        <ol part="list" role="list">
          <slot @slotchange=${this._onSlotChange}></slot>
        </ol>
      </nav>
    `;
  }
  /**
   * Insert one separator after every item except the last.
   *
   * This MUST be idempotent. Separators live in the LIGHT DOM (so they project
   * through the slot and sit between items), which means inserting/removing one
   * re-fires `slotchange` — and `slotchange` is async, so a re-entrancy flag
   * reset synchronously can't gate it. The old version removed-and-re-added
   * every separator on each call, so every `slotchange` mutated again and
   * re-fired `slotchange`: an infinite microtask loop that starves the task
   * queue, so `DOMContentLoaded` never fires and the page hangs.
   *
   * Idempotency breaks the cascade: once the separators are already correct
   * this makes NO structural mutation (text-only edits don't fire slotchange),
   * so the second pass is a no-op and the loop terminates. happy-dom doesn't
   * replicate the async slotchange microtask queue, so only a real browser
   * exhibited the hang — caught by the visual-QA sweep.
   */
  _syncSeparators() {
    const items = Array.from(
      this.querySelectorAll(":scope > ae-breadcrumb-item")
    );
    const valid = /* @__PURE__ */ new Set();
    for (let i7 = 0; i7 < items.length - 1; i7++) {
      const next = items[i7].nextElementSibling;
      if (next instanceof HTMLElement && next.dataset.aeSep === "") {
        if (next.textContent !== this.separator) next.textContent = this.separator;
        valid.add(next);
      } else {
        const sep = this._makeSeparator();
        items[i7].after(sep);
        valid.add(sep);
      }
    }
    for (const sep of this.querySelectorAll(":scope > [data-ae-sep]")) {
      if (!valid.has(sep)) sep.remove();
    }
  }
  _makeSeparator() {
    const sep = document.createElement("span");
    sep.dataset.aeSep = "";
    sep.setAttribute("aria-hidden", "true");
    sep.setAttribute("part", "separator");
    sep.className = "separator";
    sep.textContent = this.separator;
    sep.style.cssText = "display:inline-flex;align-items:center;user-select:none;padding:var(--ae-breadcrumb-separator-padding, 0 var(--ae-space-2));color:var(--ae-breadcrumb-separator-color, var(--ae-color-fg-subtle));font-size:var(--ae-breadcrumb-separator-font-size, var(--ae-font-size-sm));font-weight:var(--ae-breadcrumb-separator-font-weight, inherit);border-inline-end:var(--ae-breadcrumb-separator-divider, none);";
    return sep;
  }
  updated(changed) {
    if (changed.has("separator")) {
      this._syncSeparators();
    }
  }
  /** Returns currently slotted item elements. */
  get items() {
    return this._items ?? [];
  }
};
AeBreadcrumb.styles = i`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(--ae-font-family-sans);
    }

    nav {
      display: inline-block;
    }

    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: inline-flex;
      flex-wrap: wrap;
      /* stretch (Metro) lets the current cell's fill + the ink-rule dividers
         span the full strip height; default themes keep center for a plain
         trail where every part is the same single-line height anyway. */
      align-items: var(--ae-breadcrumb-align, center);
      gap: 0;
      /* Themeable container chrome. Metro wraps the whole trail in a 2px ink
         rule on a paper ground (a route-ticket strip); default themes paint
         nothing, so the trail stays borderless inline text. */
      background: var(--ae-breadcrumb-bg, transparent);
      border: var(--ae-breadcrumb-border, none);
    }

    li {
      display: inline-flex;
      align-items: center;
    }

    .separator {
      display: inline-flex;
      align-items: center;
      padding: 0 var(--ae-space-2);
      color: var(--ae-color-fg-subtle);
      user-select: none;
      font-size: var(--ae-font-size-sm);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeBreadcrumb.prototype, "separator", 2);
__decorateClass([
  o6({ selector: "ae-breadcrumb-item" })
], AeBreadcrumb.prototype, "_items", 2);
AeBreadcrumb = __decorateClass([
  t3("ae-breadcrumb")
], AeBreadcrumb);

// src/components/command-palette/ae-command-palette.ts
var AeCommandPalette = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.placeholder = "Search\u2026";
    this.items = [];
    this._query = "";
    this._activeIndex = 0;
    /** Element focused before the palette opened, restored on close (2.4.3). */
    this._previouslyFocused = null;
    /** Inerts + scroll-locks the background while the palette (an aria-modal
     *  dialog teleported to body) is open. */
    this._bgInert = new BackgroundInert();
    this._onBackdropClick = (e8) => {
      if (e8.target === e8.currentTarget) {
        this.open = false;
      }
    };
    this._onInput = (e8) => {
      this._query = e8.target.value;
      this._activeIndex = 0;
    };
    this._onKeyDown = (e8) => {
      const items = this._filtered();
      if (e8.key === "Escape") {
        e8.preventDefault();
        this.open = false;
        return;
      }
      if (e8.key === "Tab") {
        this._trapTab(e8);
        return;
      }
      if (e8.key === "ArrowDown") {
        e8.preventDefault();
        if (items.length === 0) return;
        this._activeIndex = (this._activeIndex + 1) % items.length;
        return;
      }
      if (e8.key === "ArrowUp") {
        e8.preventDefault();
        if (items.length === 0) return;
        this._activeIndex = (this._activeIndex - 1 + items.length) % items.length;
        return;
      }
      if (e8.key === "Home") {
        e8.preventDefault();
        this._activeIndex = 0;
        return;
      }
      if (e8.key === "End") {
        e8.preventDefault();
        this._activeIndex = Math.max(0, items.length - 1);
        return;
      }
      if (e8.key === "Enter") {
        e8.preventDefault();
        const item = items[this._activeIndex];
        if (item) this._activate(item);
      }
    };
  }
  /** Finds the search input wherever it lives (portaled to body). */
  _findInput() {
    const portal = this.renderRoot.querySelector("ae-portal");
    if (!portal) return null;
    const slot = portal.shadowRoot?.querySelector("slot");
    const nodes = slot?.assignedNodes({ flatten: true }) ?? [];
    for (const node of nodes) {
      if (node instanceof Element) {
        const input = node.querySelector?.("input.ae-cp-search");
        if (input instanceof HTMLInputElement) return input;
      }
    }
    return document.querySelector("input.ae-cp-search");
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.open) {
      requestAnimationFrame(() => this._bgInert.activate(this._findInput()));
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._bgInert.release();
  }
  updated(changed) {
    if (changed.has("open")) {
      if (this.open) {
        this._query = "";
        this._activeIndex = 0;
        this._previouslyFocused = document.activeElement ?? null;
        this.updateComplete.then(() => {
          requestAnimationFrame(() => {
            const input = this._findInput();
            input?.focus();
            this._bgInert.activate(input);
          });
        });
        this.dispatchEvent(
          new CustomEvent("ae-open-change", {
            bubbles: true,
            composed: true,
            detail: { open: true }
          })
        );
      } else {
        this._bgInert.release();
        const restore = this._previouslyFocused;
        this._previouslyFocused = null;
        restore?.focus?.();
        this.dispatchEvent(
          new CustomEvent("ae-open-change", {
            bubbles: true,
            composed: true,
            detail: { open: false }
          })
        );
      }
    }
  }
  /** Filtered items based on the current query. */
  _filtered() {
    const q = this._query.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((it) => {
      const hay = [
        it.label,
        it.hint ?? "",
        (it.keywords ?? []).join(" ")
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  /** Items grouped by `group` field (in original order). */
  _grouped() {
    const filtered = this._filtered();
    const out = [];
    const indexByLabel = /* @__PURE__ */ new Map();
    for (const it of filtered) {
      const label = it.group ?? null;
      let i7 = indexByLabel.get(label);
      if (i7 === void 0) {
        i7 = out.length;
        indexByLabel.set(label, i7);
        out.push({ label, items: [] });
      }
      out[i7].items.push(it);
    }
    return out;
  }
  render() {
    if (!this.open) return A;
    const groups2 = this._grouped();
    const flat = this._filtered();
    const activeItem = flat[this._activeIndex];
    const activeId = activeItem ? `ae-cp-item-${activeItem.id}` : "";
    return b2`
      <ae-portal>
        <style>${AeCommandPalette.PORTAL_CSS}</style>
        <div
          class="ae-cp-backdrop"
          @click=${this._onBackdropClick}
          @keydown=${this._onKeyDown}
        >
          <div
            class="ae-cp-card"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            @click=${(e8) => e8.stopPropagation()}
          >
            <div class="ae-cp-search-wrap">
              <svg
                class="ae-cp-search-icon"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M11 11 L14 14"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <input
                class="ae-cp-search"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="ae-cp-list"
                aria-activedescendant=${activeId || A}
                aria-autocomplete="list"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                .value=${this._query}
                placeholder=${this.placeholder}
                @input=${this._onInput}
              />
            </div>
            ${flat.length === 0 ? b2`<div class="ae-cp-empty">No results</div>` : b2`<ul
                  id="ae-cp-list"
                  class="ae-cp-list"
                  role="listbox"
                  aria-label="Commands"
                >
                  ${this._renderGroups(groups2, flat)}
                </ul>`}
            <!-- Polite result-count announcement so filtering is conveyed (4.1.3). -->
            <div class="ae-cp-status" role="status" aria-live="polite">
              ${flat.length} result${flat.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </ae-portal>
    `;
  }
  _renderGroups(groups2, flat) {
    return groups2.map(
      (g2) => b2`
        ${g2.label ? b2`<li class="ae-cp-group-label" role="presentation">${g2.label}</li>` : A}
        ${g2.items.map((item) => {
        const flatIndex = flat.indexOf(item);
        const isActive = flatIndex === this._activeIndex;
        return b2`<li
            class="ae-cp-item"
            role="option"
            id="ae-cp-item-${item.id}"
            aria-selected=${isActive ? "true" : "false"}
            data-index=${flatIndex}
            @mousemove=${() => this._activeIndex = flatIndex}
            @click=${() => this._activate(item)}
          >
            <span class="ae-cp-item-label">${item.label}</span>
            ${item.hint ? b2`<span class="ae-cp-item-hint">${item.hint}</span>` : A}
          </li>`;
      })}
      `
    );
  }
  /** Keep Tab focus cycling within the palette card (aria-modal trap). */
  _trapTab(e8) {
    const card = e8.currentTarget?.querySelector?.(".ae-cp-card");
    if (!card) return;
    const focusables = Array.from(
      card.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusables.length === 0) {
      e8.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e8.shiftKey && (active === first || !card.contains(active))) {
      e8.preventDefault();
      last.focus();
    } else if (!e8.shiftKey && (active === last || !card.contains(active))) {
      e8.preventDefault();
      first.focus();
    }
  }
  _activate(item) {
    this.dispatchEvent(
      new CustomEvent("ae-select", {
        bubbles: true,
        composed: true,
        detail: { item }
      })
    );
    try {
      item.action?.();
    } catch {
    }
    this.open = false;
  }
};
AeCommandPalette.styles = i`
    :host {
      display: contents;
    }
  `;
/**
 * Styles travel with the portaled DOM via an inline `<style>` element so
 * the moved nodes don't lose their visual rules when leaving the
 * component's shadow tree.
 */
AeCommandPalette.PORTAL_CSS = `
    .ae-cp-backdrop {
      position: fixed;
      inset: 0;
      background: var(--ae-color-bg-overlay);
      z-index: var(--ae-z-modal);
      display: grid;
      place-items: start center;
      padding-top: 12vh;
      animation: ae-cp-fade-in var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .ae-cp-card {
      width: min(640px, calc(100vw - 2rem));
      max-height: 70vh;
      background: var(--ae-command-palette-bg, var(--ae-color-bg-elevated));
      border: var(--ae-command-palette-border-width, var(--ae-border-width-1))
        solid var(--ae-command-palette-border, var(--ae-color-border));
      border-radius: var(--ae-command-palette-radius, var(--ae-radius-xl));
      box-shadow: var(--ae-command-palette-shadow, var(--ae-shadow-2xl));
      backdrop-filter: var(--ae-command-palette-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-command-palette-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--ae-command-palette-font-family, var(--ae-font-family-sans));
      color: var(--ae-color-fg);
    }
    .ae-cp-search-wrap {
      display: flex;
      align-items: center;
      gap: var(--ae-space-2);
      padding: var(--ae-space-3) var(--ae-space-4);
      border-bottom: var(--ae-command-palette-header-border-width, var(--ae-border-width-1))
        solid var(--ae-command-palette-header-border, var(--ae-color-border));
    }
    .ae-cp-search-icon { color: var(--ae-color-fg-subtle); flex: 0 0 auto; }
    .ae-cp-search {
      all: unset;
      flex: 1 1 auto;
      font-family: inherit;
      font-size: var(--ae-font-size-md);
      color: var(--ae-color-fg);
    }
    .ae-cp-search::placeholder { color: var(--ae-color-fg-subtle); }
    .ae-cp-list {
      list-style: none; margin: 0; padding: var(--ae-space-2) 0;
      overflow-y: auto; flex: 1 1 auto;
    }
    .ae-cp-group-label {
      padding: var(--ae-space-2) var(--ae-space-4) var(--ae-space-1);
      font-size: var(--ae-font-size-xs);
      text-transform: uppercase;
      letter-spacing: var(--ae-command-palette-section-tracking, var(--ae-letter-spacing-wide));
      font-weight: var(--ae-font-weight-semibold);
      background: var(--ae-command-palette-section-bg, transparent);
      color: var(--ae-command-palette-section-fg, var(--ae-color-fg-subtle));
    }
    .ae-cp-item {
      display: flex; align-items: center; gap: var(--ae-space-3);
      padding: var(--ae-space-2) var(--ae-space-4);
      cursor: pointer; color: var(--ae-color-fg);
      font-size: var(--ae-font-size-sm);
      border-bottom: var(--ae-command-palette-item-divider, none);
    }
    .ae-cp-item[aria-selected='true'] {
      background: var(--ae-command-palette-selected-bg, var(--ae-color-accent-subtle));
      color: var(--ae-command-palette-selected-fg, var(--ae-color-accent-emphasis));
    }
    .ae-cp-item-label {
      flex: 1 1 auto; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ae-cp-item-hint {
      flex: 0 0 auto;
      color: var(--ae-color-fg-subtle);
      font-size: var(--ae-font-size-xs);
    }
    .ae-cp-empty {
      padding: var(--ae-space-6) var(--ae-space-4);
      text-align: center;
      color: var(--ae-color-fg-subtle);
      font-size: var(--ae-font-size-sm);
    }
    .ae-cp-status {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0);
      white-space: nowrap; border: 0;
    }
    @keyframes ae-cp-fade-in {
      from { opacity: 0; } to { opacity: 1; }
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCommandPalette.prototype, "open", 2);
__decorateClass([
  n4({ type: String })
], AeCommandPalette.prototype, "placeholder", 2);
__decorateClass([
  n4({ attribute: false })
], AeCommandPalette.prototype, "items", 2);
__decorateClass([
  r5()
], AeCommandPalette.prototype, "_query", 2);
__decorateClass([
  r5()
], AeCommandPalette.prototype, "_activeIndex", 2);
AeCommandPalette = __decorateClass([
  t3("ae-command-palette")
], AeCommandPalette);

// src/components/pagination/ae-pagination.ts
var AePagination = class extends i4 {
  constructor() {
    super(...arguments);
    this.count = 1;
    this.page = 1;
    this.siblings = 1;
    this.boundaries = 1;
    this.disabled = false;
  }
  /**
   * Computes the page list as numbers + 'ellipsis' markers.
   * Always includes boundary pages, the current page, and siblings.
   */
  _pages() {
    const total = Math.max(1, Math.floor(this.count));
    const current = Math.min(total, Math.max(1, Math.floor(this.page)));
    const boundaries = Math.max(0, Math.floor(this.boundaries));
    const siblings2 = Math.max(0, Math.floor(this.siblings));
    const minVisible = boundaries * 2 + siblings2 * 2 + 3;
    if (total <= minVisible) {
      return Array.from({ length: total }, (_2, i7) => i7 + 1);
    }
    const startPages = Array.from({ length: boundaries }, (_2, i7) => i7 + 1);
    const endPages = Array.from(
      { length: boundaries },
      (_2, i7) => total - boundaries + 1 + i7
    );
    const siblingStart = Math.max(
      Math.min(current - siblings2, total - boundaries - siblings2 * 2 - 1),
      boundaries + 2
    );
    const siblingEnd = Math.min(
      Math.max(current + siblings2, boundaries + siblings2 * 2 + 2),
      total - boundaries - 1
    );
    const result = [];
    result.push(...startPages);
    if (siblingStart > boundaries + 2) {
      result.push("ellipsis-start");
    } else if (boundaries + 1 < siblingStart) {
      result.push(boundaries + 1);
    }
    for (let p3 = siblingStart; p3 <= siblingEnd; p3++) result.push(p3);
    if (siblingEnd < total - boundaries - 1) {
      result.push("ellipsis-end");
    } else if (siblingEnd < total - boundaries) {
      result.push(total - boundaries);
    }
    result.push(...endPages);
    const seen = /* @__PURE__ */ new Set();
    return result.filter((v2) => {
      if (seen.has(v2)) return false;
      seen.add(v2);
      return true;
    });
  }
  render() {
    const total = Math.max(1, Math.floor(this.count));
    const current = Math.min(total, Math.max(1, Math.floor(this.page)));
    const canPrev = !this.disabled && current > 1;
    const canNext = !this.disabled && current < total;
    return b2`
      <nav part="nav" aria-label="Pagination">
        <ul part="list">
          <li>
            <button
              part="prev"
              class="item"
              type="button"
              aria-label="Previous page"
              ?disabled=${!canPrev}
              @click=${() => this._go(current - 1)}
            >
              ‹
            </button>
          </li>
          ${this._pages().map((p3) => {
      if (p3 === "ellipsis-start" || p3 === "ellipsis-end") {
        return b2`<li>
                <span class="ellipsis" aria-hidden="true">…</span>
              </li>`;
      }
      const active = p3 === current;
      return b2`<li>
              <button
                part="item"
                class="item"
                type="button"
                aria-label="Page ${p3}"
                aria-current=${active ? "page" : A}
                ?disabled=${this.disabled}
                data-page=${p3}
                @click=${() => this._go(p3)}
              >
                ${p3}
              </button>
            </li>`;
    })}
          <li>
            <button
              part="next"
              class="item"
              type="button"
              aria-label="Next page"
              ?disabled=${!canNext}
              @click=${() => this._go(current + 1)}
            >
              ›
            </button>
          </li>
        </ul>
      </nav>
    `;
  }
  _go(next) {
    const total = Math.max(1, Math.floor(this.count));
    const target = Math.min(total, Math.max(1, Math.floor(next)));
    if (target === this.page || this.disabled) return;
    const previousPage = this.page;
    this.page = target;
    this.dispatchEvent(
      new CustomEvent("ae-page-change", {
        bubbles: true,
        composed: true,
        detail: { page: target, previousPage }
      })
    );
  }
};
AePagination.styles = i`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(--ae-font-family-sans);
    }

    nav {
      display: inline-block;
    }

    ul {
      display: inline-flex;
      gap: var(--ae-pagination-gap, var(--ae-space-1));
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
      border: var(--ae-pagination-list-border, none);
    }

    li {
      display: inline-flex;
    }

    button.item {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      padding: 0 var(--ae-space-2);
      border-radius:
        var(--ae-pagination-item-radius, var(--ae-radius-default));
      cursor: pointer;
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-font-weight-medium);
      color: var(--ae-color-fg-muted);
      background: transparent;
      border: var(--ae-border-width-1) solid transparent;
      /* Optional separator between adjacent items — used by Metro to
       * draw a 2px ink right-rule between cells in a connected row. */
      border-right:
        var(--ae-pagination-item-separator, 0 solid transparent);
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        background-color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    button.item:hover:not(:disabled) {
      background: var(--ae-color-bg-muted);
      color: var(--ae-color-fg);
    }
    button.item:focus-visible {
      ${focusRing}
    }
    button.item:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    button.item[aria-current='page'] {
      background:
        var(--ae-pagination-item-bg-active, var(--ae-color-accent));
      color:
        var(--ae-pagination-item-fg-active, var(--ae-color-fg-on-accent));
    }
    button.item[aria-current='page']:hover {
      background:
        var(--ae-pagination-item-bg-active, var(--ae-color-accent-hover));
      color:
        var(--ae-pagination-item-fg-active, var(--ae-color-fg-on-accent));
    }

    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      color: var(--ae-color-fg-subtle);
      font-size: var(--ae-font-size-sm);
      user-select: none;
    }

    /* Last item in the row drops the separator border so the right
     * edge sits flush against the container border. */
    li:last-child button.item,
    li:last-child .ellipsis {
      border-right: 0 solid transparent;
    }
  `;
__decorateClass([
  n4({ type: Number, reflect: true })
], AePagination.prototype, "count", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AePagination.prototype, "page", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AePagination.prototype, "siblings", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AePagination.prototype, "boundaries", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AePagination.prototype, "disabled", 2);
AePagination = __decorateClass([
  t3("ae-pagination")
], AePagination);

// src/components/link/ae-link.ts
var AeLink = class extends i4 {
  constructor() {
    super(...arguments);
    this.href = "";
    this.target = "";
    this.rel = "";
    this.download = "";
    this.variant = "default";
    this.tone = "default";
    this.disabled = false;
    this._onDisabledClick = (e8) => {
      if (this.disabled) {
        e8.preventDefault();
        e8.stopImmediatePropagation();
      }
    };
  }
  _computedRel() {
    if (this.rel) return this.rel;
    if (this.target === "_blank") return "noopener noreferrer";
    return A;
  }
  render() {
    const start = b2`<slot name="start"></slot>`;
    const label = b2`<slot></slot>`;
    const end = b2`<slot name="end"></slot>`;
    if (this.disabled || !this.href) {
      return b2`
        <span
          part="link"
          class="link"
          role="link"
          aria-disabled=${this.disabled ? "true" : A}
          tabindex=${this.disabled ? A : "0"}
          @click=${this._onDisabledClick}
        >
          ${start}${label}${end}
        </span>
      `;
    }
    return b2`
      <a
        part="link"
        class="link"
        href=${this.href}
        target=${this.target || A}
        rel=${this._computedRel()}
        download=${this.download || A}
      >
        ${start}${label}${end}
      </a>
    `;
  }
};
AeLink.styles = i`
    :host {
      --ae-link-fg: var(--ae-color-accent-emphasis);
      --ae-link-fg-hover: var(--ae-color-accent);
      --ae-link-underline: currentColor;

      display: inline;
      vertical-align: baseline;
    }

    :host([tone='danger']) {
      --ae-link-fg: var(--ae-color-danger-emphasis);
      --ae-link-fg-hover: var(--ae-color-danger);
    }

    :host([variant='subtle']) {
      --ae-link-fg: var(--ae-color-fg-muted);
      --ae-link-fg-hover: var(--ae-color-fg);
    }

    .link {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      color: var(--ae-link-fg);
      font-family: inherit;
      font-size: inherit;
      font-weight: var(--ae-font-weight-medium);
      text-decoration: none;
      cursor: pointer;
      transition:
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        text-decoration-color var(--ae-duration-fast)
          var(--ae-easing-ease-out);
      text-underline-offset: 0.18em;
      text-decoration-thickness: 1px;
    }

    .link:hover {
      color: var(--ae-link-fg-hover);
      text-decoration: underline;
      text-decoration-color: var(--ae-link-underline);
    }

    .link:focus-visible {
      ${focusRing}
      border-radius: var(--ae-radius-xs);
    }

    /* Standalone — always-underlined, sits on its own line. */
    :host([variant='standalone']) .link {
      text-decoration: underline;
      text-decoration-color: var(--ae-link-underline);
    }

    /* Subtle — inherits foreground, underlines on hover only. */
    :host([variant='subtle']) .link {
      font-weight: inherit;
    }

    :host([disabled]) .link {
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
      text-decoration: none;
      pointer-events: none;
    }

    ::slotted([slot='start']),
    ::slotted([slot='end']) {
      display: inline-flex;
      align-items: center;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "href", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "target", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "rel", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "download", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "variant", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeLink.prototype, "tone", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeLink.prototype, "disabled", 2);
AeLink = __decorateClass([
  t3("ae-link")
], AeLink);

// src/components/stepper/ae-step.ts
var AeStep = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
    this.description = "";
    this.status = "upcoming";
    this.optional = false;
    this.clickable = false;
    this.index = 1;
    this._onClick = () => {
      this.dispatchEvent(
        new CustomEvent("ae-step-activate", {
          bubbles: true,
          composed: true,
          detail: { index: this.index - 1 }
        })
      );
    };
  }
  render() {
    const marker = this.status === "complete" ? b2`<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path
              d="M2.5 6.5 L5 9 L9.5 3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>` : this.status === "error" ? b2`!` : b2`${this.index}`;
    const content = b2`
      <span class="marker" aria-hidden="true">${marker}</span>
      <span class="body">
        <span class="label">
          ${this.label}
          ${this.optional ? b2`<span class="optional"> (Optional)</span>` : A}
        </span>
        ${this.description ? b2`<span class="description">${this.description}</span>` : A}
      </span>
    `;
    return b2`
      <div
        class="row"
        aria-current=${this.status === "current" ? "step" : A}
      >
        ${this.clickable ? b2`<button
              class="trigger"
              type="button"
              data-clickable
              @click=${this._onClick}
            >
              ${content}
            </button>` : b2`<span class="trigger">${content}</span>`}
      </div>
    `;
  }
};
AeStep.styles = i`
    :host {
      display: block;
      font-family: var(--ae-font-family-sans);
    }

    .row {
      display: flex;
      align-items: flex-start;
      gap: var(--ae-space-3);
      padding: var(--ae-space-2) 0;
    }

    /* The trigger must dissolve (display: contents) so the marker + body become
     * direct flex children of .row and sit side-by-side. Both the clickable
     * <button> and the static <span> need it — without it the <span> blockifies
     * as a flex item and the block-level .body drops BELOW the inline marker
     * (the label-under-badge bug). all:unset on the button reverts display to
     * inline, so the button re-asserts contents after it. */
    .trigger {
      display: contents;
    }
    button.trigger {
      all: unset;
      display: contents;
      cursor: pointer;
    }
    button.trigger:not([data-clickable]) {
      cursor: default;
    }
    button.trigger:focus-visible .marker {
      ${focusRing}
    }

    /* Marker palette routes through per-status tokens (fallback = the default
     * accent/success/danger). Metro recolors them to the ticket badge: paper
     * upcoming, gold current (ink text), ink complete (paper check), stop error
     * — an 800 marker — without out-specifying these :host([status]) rules. */
    .marker {
      flex: 0 0 auto;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--ae-step-marker-radius, 50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-step-marker-weight, var(--ae-font-weight-semibold));
      background: var(--ae-step-marker-bg, var(--ae-color-bg-muted));
      color: var(--ae-step-marker-fg, var(--ae-color-fg-muted));
      border: var(--ae-border-width-1) solid var(--ae-step-marker-border, var(--ae-color-border-strong));
      transition:
        background var(--ae-duration-fast) var(--ae-easing-ease-out),
        color var(--ae-duration-fast) var(--ae-easing-ease-out),
        border-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }

    :host([status='current']) .marker {
      background: var(--ae-step-current-bg, var(--ae-color-accent));
      color: var(--ae-step-current-fg, var(--ae-color-fg-on-accent));
      border-color: var(--ae-step-current-border, var(--ae-color-accent));
    }
    :host([status='complete']) .marker {
      background: var(--ae-step-complete-bg, var(--ae-color-success));
      color: var(--ae-step-complete-fg, var(--ae-color-fg-on-accent));
      border-color: var(--ae-step-complete-border, var(--ae-color-success));
    }
    :host([status='error']) .marker {
      background: var(--ae-step-error-bg, var(--ae-color-danger));
      color: var(--ae-step-error-fg, var(--ae-color-fg-on-danger));
      border-color: var(--ae-step-error-border, var(--ae-color-danger));
    }

    .body {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .label {
      font-size: var(--ae-font-size-sm);
      font-weight: var(--ae-step-label-weight, var(--ae-font-weight-semibold));
      letter-spacing: var(--ae-step-label-tracking, normal);
      text-transform: var(--ae-step-label-transform, none);
      /* Label color routes through a plumbing token so the horizontal ribbon
       * can recolor labels to match each filled segment (paper on ink, ink on
       * gold). Default = full fg. */
      color: var(--ae-step-label-color, var(--ae-color-fg));
      line-height: 1.2;
    }
    :host([status='upcoming']) .label {
      color: var(--ae-step-label-color, var(--ae-color-fg-muted));
      font-weight: var(--ae-step-label-weight, var(--ae-font-weight-medium));
    }
    .description {
      font-size: var(--ae-font-size-xs);
      color: var(--ae-step-description-color, var(--ae-color-fg-muted));
    }
    .optional {
      font-size: var(--ae-font-size-xs);
      color: var(--ae-color-fg-subtle);
      font-weight: var(--ae-font-weight-normal);
    }

    /* ---- Horizontal ribbon (source WizardSteps / step-form) ----
     * When the parent stepper is horizontal it reflects data-orientation onto
     * each step. In that mode a theme can turn the marker+label row into a
     * filled, butted segment with an inverted marker badge — the canonical
     * connected ticket strip. Every paint routes through a per-status token
     * whose fallback is transparent / inherit, so non-opted-in themes (and the
     * vertical layout, which never gets data-orientation='horizontal') keep the
     * plain marker+label+rail look untouched. The parent draws the seam reset
     * on the last segment and the outer frame; each segment carries its own
     * right-edge seam here. */
    :host([data-orientation='horizontal']) {
      border-right:
        var(--ae-step-seam-width, 0) solid var(--ae-step-seam-color, transparent);
    }
    :host([data-orientation='horizontal']) .row {
      height: 100%;
      box-sizing: border-box;
      align-items: center;
      padding: var(--ae-step-segment-padding, var(--ae-space-2) var(--ae-space-3));
      background: var(--ae-step-segment-bg, transparent);
    }
    :host([data-orientation='horizontal'][status='upcoming']) .row {
      background: var(--ae-step-upcoming-segment-bg, transparent);
    }
    :host([data-orientation='horizontal'][status='current']) .row {
      background: var(--ae-step-current-segment-bg, transparent);
    }
    :host([data-orientation='horizontal'][status='complete']) .row {
      background: var(--ae-step-complete-segment-bg, transparent);
    }
    :host([data-orientation='horizontal'][status='error']) .row {
      background: var(--ae-step-error-segment-bg, transparent);
    }

    /* Segment text follows the fill (plumbing tokens cascade into label +
     * description). Specificity (host + 2 attrs) beats the upcoming-muted rule. */
    :host([data-orientation='horizontal'][status='upcoming']) {
      --ae-step-label-color: var(--ae-step-upcoming-segment-fg, var(--ae-color-fg));
      --ae-step-description-color: var(--ae-step-upcoming-segment-fg, var(--ae-color-fg-muted));
    }
    :host([data-orientation='horizontal'][status='current']) {
      --ae-step-label-color: var(--ae-step-current-segment-fg, var(--ae-color-fg));
      --ae-step-description-color: var(--ae-step-current-segment-fg, var(--ae-color-fg-muted));
    }
    :host([data-orientation='horizontal'][status='complete']) {
      --ae-step-label-color: var(--ae-step-complete-segment-fg, var(--ae-color-fg));
      --ae-step-description-color: var(--ae-step-complete-segment-fg, var(--ae-color-fg-muted));
    }
    :host([data-orientation='horizontal'][status='error']) {
      --ae-step-label-color: var(--ae-step-error-segment-fg, var(--ae-color-fg));
      --ae-step-description-color: var(--ae-step-error-segment-fg, var(--ae-color-fg-muted));
    }

    /* Marker badge inverts to contrast the filled segment (paper badge on the
     * ink complete cell; ink badge on the gold current / paper upcoming cells).
     * Each falls back to the base (vertical) marker palette so a theme that
     * fills segments but doesn't set the inverted badge still renders sanely. */
    :host([data-orientation='horizontal'][status='upcoming']) .marker {
      background: var(--ae-step-upcoming-marker-bg, var(--ae-step-marker-bg, var(--ae-color-bg-muted)));
      color: var(--ae-step-upcoming-marker-fg, var(--ae-step-marker-fg, var(--ae-color-fg-muted)));
      border-color: var(--ae-step-upcoming-marker-border, var(--ae-step-marker-border, var(--ae-color-border-strong)));
    }
    :host([data-orientation='horizontal'][status='current']) .marker {
      background: var(--ae-step-current-marker-bg, var(--ae-step-current-bg, var(--ae-color-accent)));
      color: var(--ae-step-current-marker-fg, var(--ae-step-current-fg, var(--ae-color-fg-on-accent)));
      border-color: var(--ae-step-current-marker-border, var(--ae-step-current-border, var(--ae-color-accent)));
    }
    :host([data-orientation='horizontal'][status='complete']) .marker {
      background: var(--ae-step-complete-marker-bg, var(--ae-step-complete-bg, var(--ae-color-success)));
      color: var(--ae-step-complete-marker-fg, var(--ae-step-complete-fg, var(--ae-color-fg-on-accent)));
      border-color: var(--ae-step-complete-marker-border, var(--ae-step-complete-border, var(--ae-color-success)));
    }
    :host([data-orientation='horizontal'][status='error']) .marker {
      background: var(--ae-step-error-marker-bg, var(--ae-step-error-bg, var(--ae-color-danger)));
      color: var(--ae-step-error-marker-fg, var(--ae-step-error-fg, var(--ae-color-fg-on-danger)));
      border-color: var(--ae-step-error-marker-border, var(--ae-step-error-border, var(--ae-color-danger)));
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeStep.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStep.prototype, "description", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStep.prototype, "status", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeStep.prototype, "optional", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeStep.prototype, "clickable", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeStep.prototype, "index", 2);
AeStep = __decorateClass([
  t3("ae-step")
], AeStep);

// src/components/stepper/ae-stepper.ts
var AeStepper = class extends i4 {
  constructor() {
    super(...arguments);
    this.active = 0;
    this.orientation = "horizontal";
    this.clickable = false;
    this._onSlotChange = () => {
      this._sync();
    };
    this._onStepActivate = (e8) => {
      const detail = e8.detail;
      e8.stopPropagation();
      if (!detail) return;
      this._goTo(detail.index);
    };
  }
  render() {
    return b2`
      <div role="list">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("ae-step-activate", this._onStepActivate);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("ae-step-activate", this._onStepActivate);
  }
  updated(changed) {
    if (changed.has("active") || changed.has("clickable") || changed.has("orientation")) {
      this._sync();
    }
  }
  firstUpdated() {
    this._sync();
  }
  _sync() {
    const steps = this._steps ?? [];
    const active = Math.max(0, Math.min(this.active, steps.length - 1));
    for (let i7 = 0; i7 < steps.length; i7++) {
      const step = steps[i7];
      step.index = i7 + 1;
      step.setAttribute("role", "listitem");
      step.setAttribute("data-orientation", this.orientation);
      const explicitError = step.status === "error";
      let next;
      if (explicitError) {
        next = "error";
      } else if (i7 < active) {
        next = "complete";
      } else if (i7 === active) {
        next = "current";
      } else {
        next = "upcoming";
      }
      step.status = next;
      step.clickable = this.clickable && (i7 <= active || next === "complete");
    }
  }
  /** Public: programmatically jump to a step. */
  goTo(index) {
    this._goTo(index);
  }
  _goTo(index) {
    const steps = this._steps ?? [];
    const target = Math.max(0, Math.min(index, steps.length - 1));
    if (target === this.active) return;
    const previousIndex = this.active;
    this.active = target;
    this.dispatchEvent(
      new CustomEvent("ae-step-change", {
        bubbles: true,
        composed: true,
        detail: { index: target, previousIndex }
      })
    );
  }
};
AeStepper.styles = i`
    :host {
      display: block;
      font-family: var(--ae-font-family-sans);
    }

    [role='list'] {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: var(--ae-stepper-gap, var(--ae-space-4));
    }

    /* Horizontal frame — drawn around the whole strip so a filled-segment
     * ribbon reads as one connected ticket (the source's WizardSteps card).
     * Defaults to none; an opted-in theme (Metro) sets a 3px ink frame and the
     * segments supply their own seams. Vertical never references the token. */
    :host([orientation='horizontal']) [role='list'] {
      border: var(--ae-stepper-list-border, none);
    }

    :host([orientation='vertical']) [role='list'] {
      flex-direction: column;
      gap: var(--ae-space-2);
    }

    ::slotted(ae-step) {
      flex: 1 1 auto;
      position: relative;
    }

    /* The last segment carries no trailing seam (it meets the frame's right
     * edge). Zeroing the seam token directly on the host beats the :root value
     * a theme inherits into the other segments. Harmless when no seam is set. */
    ::slotted(ae-step:last-of-type) {
      --ae-step-seam-width: 0;
    }

    /* Horizontal connector — the thin inter-step rule. Gated behind a display
     * token so a theme that fills + butts the segments into a connected ribbon
     * (Metro) suppresses the floating line; the default of block keeps it for
     * the marker+label layouts that want a visible connector. */
    :host([orientation='horizontal']) ::slotted(ae-step:not(:last-of-type))::after {
      content: '';
      display: var(--ae-stepper-connector-display, block);
      position: absolute;
      top: calc(var(--ae-space-2) + 0.875rem);
      right: calc(-1 * var(--ae-stepper-gap, var(--ae-space-4)));
      width: var(--ae-stepper-gap, var(--ae-space-4));
      height: 1px;
      background: var(--ae-color-border);
    }

    /* Vertical rail — a continuous line centered under each marker, running
     * from the marker's lower edge down to the next marker. The marker is
     * 1.75rem wide, so its center sits 0.875rem from the row's left edge; the
     * old calc added an erroneous --ae-space-2, pushing the rail off-marker and
     * making it read as a disconnected stub. Width/color tokenized so Metro can
     * thicken it into a proper ink rail. */
    :host([orientation='vertical']) ::slotted(ae-step:not(:last-of-type))::after {
      content: '';
      position: absolute;
      left: calc(0.875rem - (var(--ae-stepper-rail-width, 1px) / 2));
      top: calc(var(--ae-space-2) + 1.75rem);
      bottom: calc(-2 * var(--ae-space-2));
      width: var(--ae-stepper-rail-width, 1px);
      background: var(--ae-stepper-rail-color, var(--ae-color-border));
    }
  `;
__decorateClass([
  n4({ type: Number, reflect: true })
], AeStepper.prototype, "active", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeStepper.prototype, "orientation", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeStepper.prototype, "clickable", 2);
__decorateClass([
  o6({ selector: "ae-step" })
], AeStepper.prototype, "_steps", 2);
AeStepper = __decorateClass([
  t3("ae-stepper")
], AeStepper);

// src/components/wizard/ae-wizard-step.ts
var AeWizardStep = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
    this.description = "";
    this.optional = false;
    this.disabled = false;
    this.active = false;
  }
  render() {
    return b2`<div
      class="panel"
      role="group"
      aria-label=${this.label || A}
      ?hidden=${!this.active}
    >
      <slot></slot>
    </div>`;
  }
};
AeWizardStep.styles = i`
    :host {
      display: block;
    }
    :host(:not([active])) {
      display: none;
    }
    .panel {
      padding: var(--ae-space-2) 0;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeWizardStep.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeWizardStep.prototype, "description", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeWizardStep.prototype, "optional", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeWizardStep.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeWizardStep.prototype, "active", 2);
AeWizardStep = __decorateClass([
  t3("ae-wizard-step")
], AeWizardStep);

// src/components/wizard/ae-wizard.ts
var AeWizard = class extends i4 {
  constructor() {
    super(...arguments);
    this.active = 0;
    this.linear = false;
    this._onSlotChange = () => {
      this._syncSteps();
      this.requestUpdate();
    };
    this._onStepperChange = (e8) => {
      e8.stopPropagation();
      const detail = e8.detail;
      this.goTo(detail.index);
    };
    this._onCancel = () => {
      this.dispatchEvent(
        new CustomEvent("ae-cancel", {
          bubbles: true,
          composed: true,
          detail: { index: this.active }
        })
      );
    };
  }
  render() {
    const steps = this._steps ?? [];
    const stepperItems = steps.map(
      (s4) => b2`<ae-step
        label=${s4.label}
        description=${s4.description}
        ?optional=${s4.optional}
      ></ae-step>`
    );
    const isLast = this.active >= steps.length - 1;
    const isFirst = this.active <= 0;
    const canSkip = !this.linear;
    return b2`
      <div part="header" class="header">
        <ae-stepper
          .active=${this.active}
          ?clickable=${canSkip}
          @ae-step-change=${this._onStepperChange}
        >
          ${stepperItems}
        </ae-stepper>
      </div>
      <div part="panel" class="panel">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
      <div part="footer" class="footer">
        <ae-button
          variant="tertiary"
          @click=${this._onCancel}
        >Cancel</ae-button>
        <span class="spacer"></span>
        <ae-button
          variant="secondary"
          ?disabled=${isFirst}
          @click=${this.back}
        >Back</ae-button>
        ${isLast ? b2`<ae-button variant="primary" @click=${this.complete}
              >Finish</ae-button
            >` : b2`<ae-button variant="primary" @click=${this.next}
              >Next</ae-button
            >`}
      </div>
    `;
  }
  updated(changed) {
    if (changed.has("active")) this._syncSteps();
  }
  firstUpdated() {
    this._syncSteps();
  }
  _syncSteps() {
    const steps = this._steps ?? [];
    const active = Math.max(0, Math.min(this.active, steps.length - 1));
    for (let i7 = 0; i7 < steps.length; i7++) {
      steps[i7].active = i7 === active;
    }
  }
  /** Advance one step (clamped to the last step). */
  next() {
    const steps = this._steps ?? [];
    const from = this.active;
    const to = Math.min(steps.length - 1, this.active + 1);
    if (to === from) return;
    this.active = to;
    this.dispatchEvent(
      new CustomEvent("ae-next", {
        bubbles: true,
        composed: true,
        detail: { from, to }
      })
    );
  }
  /** Go back one step (clamped to 0). */
  back() {
    const from = this.active;
    const to = Math.max(0, this.active - 1);
    if (to === from) return;
    this.active = to;
    this.dispatchEvent(
      new CustomEvent("ae-back", {
        bubbles: true,
        composed: true,
        detail: { from, to }
      })
    );
  }
  /** Jump to an arbitrary step (linear mode caps forward jumps to `active + 1`). */
  goTo(index) {
    const steps = this._steps ?? [];
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    if (this.linear && clamped > this.active + 1) return;
    if (clamped === this.active) return;
    const target = steps[clamped];
    if (target?.disabled) return;
    const from = this.active;
    this.active = clamped;
    const type = clamped > from ? "ae-next" : "ae-back";
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: { from, to: clamped }
      })
    );
  }
  /** Fire ae-complete. */
  complete() {
    this.dispatchEvent(
      new CustomEvent("ae-complete", {
        bubbles: true,
        composed: true,
        detail: { index: this.active }
      })
    );
  }
};
AeWizard.styles = i`
    :host {
      display: block;
      font-family: var(--ae-font-family-sans);
    }

    .header {
      margin-bottom: var(--ae-space-6);
    }

    .panel {
      min-height: 4rem;
    }

    .footer {
      display: flex;
      align-items: center;
      gap: var(--ae-space-3);
      margin-top: var(--ae-space-6);
      padding-top: var(--ae-space-4);
      border-top: var(--ae-border-width-1) solid var(--ae-color-border);
    }
    .footer .spacer {
      flex: 1 1 auto;
    }
  `;
__decorateClass([
  n4({ type: Number, reflect: true })
], AeWizard.prototype, "active", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeWizard.prototype, "linear", 2);
__decorateClass([
  o6({ selector: "ae-wizard-step" })
], AeWizard.prototype, "_steps", 2);
AeWizard = __decorateClass([
  t3("ae-wizard")
], AeWizard);

// src/components/virtual-scroller/size-cache.ts
var SizeCache = class {
  constructor() {
    this._map = /* @__PURE__ */ new Map();
    /** Total of all currently-set sizes. Maintained incrementally. */
    this.totalSize = 0;
  }
  /** Number of entries currently in the cache. */
  get size() {
    return this._map.size;
  }
  /**
   * Returns the running average size, or 0 if the cache is empty. Callers
   * that need a stable estimate should fall back to a configured default.
   */
  get averageSize() {
    return this._map.size > 0 ? this.totalSize / this._map.size : 0;
  }
  /** Get a previously-cached size, or undefined if never set. */
  get(key) {
    return this._map.get(key);
  }
  /**
   * Store a measured size under `key`, updating the running total. Overwrites
   * any prior value at the same key (e.g. when an item's height changes due
   * to content reflow).
   */
  set(key, value) {
    const prev = this._map.get(key) ?? 0;
    this._map.set(key, value);
    this.totalSize += value - prev;
  }
  /** Remove a single entry. */
  delete(key) {
    const prev = this._map.get(key);
    if (prev !== void 0) {
      this._map.delete(key);
      this.totalSize -= prev;
    }
  }
  /** Drop everything. */
  clear() {
    this._map.clear();
    this.totalSize = 0;
  }
};

// src/components/virtual-scroller/flow-layout.ts
var SCROLL_HEIGHT_CEILING = 82e5;
var FlowLayout = class {
  constructor(config) {
    this._sizeCache = new SizeCache();
    this._itemCount = 0;
    this._scrollPosition = 0;
    this._viewportHeight = 0;
    this._scrollError = 0;
    this._stable = true;
    /** Index of the first rendered child. */
    this._first = -1;
    /** Index of the last rendered child. */
    this._last = -1;
    /** Index of the first item intersecting the visible viewport. */
    this._firstVisible = -1;
    /** Index of the last item intersecting the visible viewport. */
    this._lastVisible = -1;
    /** Pixel offset of the top edge of the first rendered child. */
    this._physicalMin = 0;
    /** Pixel offset of the bottom edge of the last rendered child. */
    this._physicalMax = 0;
    /** Anchor state — survives across reflows until stability converges. */
    this._anchorIdx = null;
    this._anchorPos = null;
    /** Map of index → measured/estimated bounds for the currently-rendered range. */
    this._physicalItems = /* @__PURE__ */ new Map();
    /** Scratch map for the in-progress reflow. */
    this._newPhysicalItems = /* @__PURE__ */ new Map();
    /** Currently active scroll-into-view pin. Survives unrelated reflows (#15). */
    this._pin = null;
    this._config = {
      overhang: config?.overhang ?? 1e3,
      estimatedItemSize: config?.estimatedItemSize ?? 50,
      gap: config?.gap ?? 0,
      keyForIndex: config?.keyForIndex
    };
  }
  // -------- Public configuration / state setters --------
  setOverhang(overhang) {
    this._config.overhang = overhang;
  }
  setEstimatedItemSize(size) {
    this._config.estimatedItemSize = size;
  }
  setGap(gap) {
    this._config.gap = gap;
  }
  setKeyForIndex(keyForIndex) {
    this._config.keyForIndex = keyForIndex;
  }
  setItemCount(count) {
    this._itemCount = count;
  }
  setViewport(height, scrollTop) {
    this._viewportHeight = height;
    this._scrollPosition = scrollTop;
  }
  /**
   * Drop the entire size cache. Called by the host when the items array
   * reference changes (#10): we can't trust positional sizes when the
   * content at each index may have changed.
   *
   * When `keyForIndex` is configured, the host calls `pruneCacheToKeys`
   * instead, which preserves cached sizes for items that survived the
   * reorder under a stable key.
   */
  clearCache() {
    this._sizeCache.clear();
    this._physicalItems.clear();
    this._newPhysicalItems.clear();
    this._resetReflowState();
  }
  /** Cache an individual item's measured size. */
  updateItemSize(index, size) {
    const key = this._key(index);
    this._sizeCache.set(key, size);
  }
  /**
   * Survive an items-array swap. The new mapping is `newIndex → key`. Any
   * cache entry whose key is NOT in `survivors` is dropped; positions are
   * invalidated either way and the next reflow will lay everything out
   * fresh.
   */
  pruneCacheToKeys(survivors) {
    if (this._config.keyForIndex === void 0) {
      this.clearCache();
      return;
    }
    const surviving = new SizeCache();
    for (const k2 of survivors) {
      const prior = this._sizeCache.get(k2);
      if (prior !== void 0) surviving.set(k2, prior);
    }
    this._sizeCache.clear();
    for (const k2 of survivors) {
      const prior = surviving.get(k2);
      if (prior !== void 0) this._sizeCache.set(k2, prior);
    }
    this._physicalItems.clear();
    this._newPhysicalItems.clear();
    this._resetReflowState();
  }
  // -------- Pin (scroll-into-view) --------
  setPin(pin) {
    this._pin = pin;
  }
  getPin() {
    return this._pin;
  }
  /**
   * Compute the destination scrollTop to align the item at `pin.index`
   * under the configured `block` alignment. Used both by the host's
   * `scrollToIndex` and by the smooth-scroll retargeting loop (#2, #11).
   */
  getScrollIntoViewPosition(pin) {
    const idx = Math.max(0, Math.min(this._itemCount - 1, pin.index));
    const itemPos = this._getPosition(idx);
    const itemSize = this._getSize(idx) ?? this._getAverageSize();
    switch (pin.block) {
      case "start":
        return clamp(itemPos, this._maxScrollTop());
      case "center":
        return clamp(
          itemPos - 0.5 * this._viewportHeight + 0.5 * itemSize,
          this._maxScrollTop()
        );
      case "end":
        return clamp(
          itemPos + itemSize - this._viewportHeight,
          this._maxScrollTop()
        );
      case "nearest": {
        const startDest = itemPos;
        const endDest = itemPos + itemSize - this._viewportHeight;
        return Math.abs(this._scrollPosition - startDest) < Math.abs(this._scrollPosition - endDest) ? clamp(startDest, this._maxScrollTop()) : clamp(endDest, this._maxScrollTop());
      }
    }
  }
  // -------- Reflow --------
  /**
   * Run a full reflow pass. Returns a `StateMessage` the host can act on.
   * The returned `stable` flag indicates whether the layout converged on
   * measured sizes only (true) or used at least one estimate (false).
   */
  reflow() {
    this._stable = true;
    this._setPositionFromPin();
    this._getActiveItems();
    this._updateVisibleIndices();
    return this._buildStateMessage();
  }
  _setPositionFromPin() {
    if (this._pin !== null) {
      const lastScroll = this._scrollPosition;
      this._scrollPosition = this.getScrollIntoViewPosition(this._pin);
      this._scrollError += lastScroll - this._scrollPosition;
    }
  }
  /**
   * Compute the index range to render plus per-item physical positions.
   * Implements the anchor-based expansion that bounds the cost at
   * O(viewportItems) instead of O(itemCount). See research doc for the
   * full derivation.
   */
  _getActiveItems() {
    if (this._viewportHeight === 0 || this._itemCount === 0) {
      this._clearItems();
      return;
    }
    const items = this._newPhysicalItems;
    items.clear();
    let lower = this._scrollPosition - this._config.overhang;
    let upper = this._scrollPosition + this._viewportHeight + this._config.overhang;
    const scrollSize = this._estimateTotalScrollSize();
    if (upper < 0 || lower > scrollSize) {
      this._clearItems();
      return;
    }
    if (this._pin !== null) {
      this._anchorIdx = this._pin.index;
      this._anchorPos = this._getPosition(this._pin.index);
    }
    if (this._anchorIdx === null || this._anchorPos === null) {
      this._anchorIdx = this._chooseAnchor(lower, upper);
      this._anchorPos = this._getPosition(this._anchorIdx);
    }
    let anchorSize = this._getSize(this._anchorIdx);
    if (anchorSize === void 0) {
      this._stable = false;
      anchorSize = this._getAverageSize();
    }
    if (this._anchorIdx === 0) {
      this._anchorPos = 0;
    }
    if (this._anchorIdx === this._itemCount - 1) {
      this._anchorPos = scrollSize - anchorSize;
    }
    let anchorErr = 0;
    if (this._anchorPos + anchorSize < lower) {
      anchorErr = lower - (this._anchorPos + anchorSize);
    }
    if (this._anchorPos > upper) {
      anchorErr = upper - this._anchorPos;
    }
    if (anchorErr) {
      this._scrollPosition -= anchorErr;
      lower -= anchorErr;
      upper -= anchorErr;
      this._scrollError += anchorErr;
    }
    items.set(this._anchorIdx, { pos: this._anchorPos, size: anchorSize });
    this._first = this._last = this._anchorIdx;
    this._physicalMin = this._anchorPos;
    this._physicalMax = this._anchorPos + anchorSize;
    while (this._physicalMin > lower && this._first > 0) {
      let size = this._getSize(--this._first);
      if (size === void 0) {
        this._stable = false;
        size = this._getAverageSize();
      }
      this._physicalMin -= size + this._config.gap;
      const pos = this._physicalMin + this._config.gap;
      items.set(this._first, { pos, size });
    }
    while (this._physicalMax < upper && this._last < this._itemCount - 1) {
      let size = this._getSize(++this._last);
      if (size === void 0) {
        this._stable = false;
        size = this._getAverageSize();
      }
      const pos = this._physicalMax + this._config.gap;
      items.set(this._last, { pos, size });
      this._physicalMax = pos + size;
    }
    const extentErr = this._calculateBoundaryError(scrollSize);
    if (extentErr) {
      this._physicalMin -= extentErr;
      this._physicalMax -= extentErr;
      this._anchorPos -= extentErr;
      this._scrollPosition -= extentErr;
      items.forEach((item) => item.pos -= extentErr);
      this._scrollError += extentErr;
    }
    if (this._stable) {
      this._physicalItems = new Map(items);
    }
  }
  _calculateBoundaryError(scrollSize) {
    if (this._first === 0) {
      return this._physicalMin;
    }
    if (this._last === this._itemCount - 1) {
      return this._physicalMax - scrollSize;
    }
    return 0;
  }
  /** Empty/zero-viewport guard (#12). */
  _clearItems() {
    this._first = -1;
    this._last = -1;
    this._firstVisible = -1;
    this._lastVisible = -1;
    this._physicalMin = 0;
    this._physicalMax = 0;
    this._newPhysicalItems.clear();
    this._physicalItems.clear();
    this._stable = true;
  }
  _resetReflowState() {
    this._anchorIdx = null;
    this._anchorPos = null;
    this._stable = true;
  }
  /**
   * Anchor selection — exposed for tests. Picks an index whose position
   * straddles the viewport (lower, upper). If the current physical range
   * already covers the viewport, walks from `_firstVisible - 1` forward
   * to find the first item whose end lies past `lower`. Otherwise falls
   * back to the average-step estimate.
   */
  chooseAnchor(lower, upper) {
    return this._chooseAnchor(lower, upper);
  }
  _chooseAnchor(lower, upper) {
    if (this._physicalItems.size === 0 || this._first < 0 || this._last < 0) {
      return this._calculateAnchorFromScroll(lower, upper);
    }
    const firstItem = this._physicalItems.get(this._first);
    const lastItem = this._physicalItems.get(this._last);
    const firstMin = firstItem.pos;
    const lastMax = lastItem.pos + lastItem.size;
    if (lastMax < lower || firstMin > upper) {
      return this._calculateAnchorFromScroll(lower, upper);
    }
    let candidateIdx = Math.max(this._first, this._firstVisible - 1);
    let cMax = -Infinity;
    while (cMax < lower && candidateIdx <= this._last) {
      const candidate = this._physicalItems.get(candidateIdx);
      if (candidate === void 0) break;
      cMax = candidate.pos + candidate.size;
      if (cMax < lower) candidateIdx++;
    }
    return Math.max(0, Math.min(this._itemCount - 1, candidateIdx));
  }
  _calculateAnchorFromScroll(lower, upper) {
    if (lower <= 0) return 0;
    const max = this._estimateTotalScrollSize() - this._viewportHeight;
    if (upper > max) return this._itemCount - 1;
    const delta = this._getAverageSize() + this._config.gap;
    if (delta <= 0) return 0;
    return Math.max(
      0,
      Math.min(this._itemCount - 1, Math.floor((lower + upper) / 2 / delta))
    );
  }
  /**
   * Estimated position of the item at `idx`. If the item is in the current
   * physical range, its real position is used; otherwise we extrapolate
   * from the nearest physical edge using `averageSize`.
   */
  _getPosition(idx) {
    const phys = this._physicalItems.get(idx) ?? this._newPhysicalItems.get(idx);
    if (phys) return phys.pos;
    return this._estimatePosition(idx);
  }
  /**
   * Pure-math estimate for a not-yet-rendered item. Exposed for tests.
   * - If we have no rendered items, position is `idx * (avg + gap)`.
   * - If `idx` is below the rendered range, walk up from `_first`.
   * - If `idx` is above the rendered range, walk down from `_last`.
   */
  estimatePosition(idx) {
    return this._estimatePosition(idx);
  }
  _estimatePosition(idx) {
    const avg = this._getAverageSize();
    const delta = avg + this._config.gap;
    if (this._first === -1 || this._last === -1) {
      return idx * delta;
    }
    if (idx < this._first) {
      const distance = this._first - idx;
      const ref = this._physicalItems.get(this._first);
      const refPos = ref?.pos ?? this._first * delta;
      return refPos - distance * delta;
    }
    if (idx > this._last) {
      const distance = idx - this._last;
      const ref = this._physicalItems.get(this._last);
      const refSize = ref?.size ?? avg;
      const refPos = ref?.pos ?? this._last * delta;
      return refPos + refSize + this._config.gap + (distance - 1) * delta;
    }
    const phys = this._physicalItems.get(idx);
    return phys?.pos ?? idx * delta;
  }
  _getSize(idx) {
    return this._sizeCache.get(this._key(idx));
  }
  _getAverageSize() {
    return this._sizeCache.averageSize || this._config.estimatedItemSize;
  }
  _key(idx) {
    return this._config.keyForIndex?.(idx) ?? idx;
  }
  /**
   * Round both sides of the visibility comparison to avoid sub-pixel flicker (#7).
   */
  _updateVisibleIndices() {
    if (this._first === -1 || this._last === -1) return;
    let firstVisible = this._first;
    while (firstVisible < this._last && Math.round(this._physicalItems.get(firstVisible)?.pos ?? 0) + Math.round(this._physicalItems.get(firstVisible)?.size ?? 0) <= Math.round(this._scrollPosition)) {
      firstVisible++;
    }
    let lastVisible = this._last;
    while (lastVisible > this._first && Math.round(this._physicalItems.get(lastVisible)?.pos ?? 0) >= Math.round(this._scrollPosition + this._viewportHeight)) {
      lastVisible--;
    }
    this._firstVisible = firstVisible;
    this._lastVisible = lastVisible;
  }
  _estimateTotalScrollSize() {
    if (this._itemCount === 0) return 0;
    const avg = this._getAverageSize();
    const raw = this._itemCount * avg + (this._itemCount - 1) * this._config.gap;
    return Math.min(SCROLL_HEIGHT_CEILING, Math.max(1, raw));
  }
  _maxScrollTop() {
    return Math.max(0, this._estimateTotalScrollSize() - this._viewportHeight);
  }
  _buildStateMessage() {
    const source = this._stable ? this._physicalItems : this._newPhysicalItems;
    const positions = /* @__PURE__ */ new Map();
    if (this._first !== -1 && this._last !== -1) {
      for (let i7 = this._first; i7 <= this._last; i7++) {
        const phys = source.get(i7);
        if (phys) positions.set(i7, phys.pos);
      }
    }
    const err = this._scrollError;
    this._scrollError = 0;
    return {
      scrollSize: this._estimateTotalScrollSize(),
      range: {
        first: this._first,
        last: this._last,
        firstVisible: this._firstVisible,
        lastVisible: this._lastVisible
      },
      childPositions: positions,
      scrollError: err,
      stable: this._stable
    };
  }
  // -------- Test introspection (intentionally narrow API) --------
  getStable() {
    return this._stable;
  }
  getCachedSize(index) {
    return this._getSize(index);
  }
  getAverageSize() {
    return this._getAverageSize();
  }
  getEstimatedScrollSize() {
    return this._estimateTotalScrollSize();
  }
};
function clamp(v2, max) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(v2, max));
}

// src/components/virtual-scroller/fixed-layout.ts
var SCROLL_HEIGHT_CEILING2 = 82e5;
function getTotalScrollSize(cfg) {
  if (cfg.itemCount <= 0) return 0;
  const gap = cfg.gap ?? 0;
  const raw = cfg.itemCount * cfg.itemHeight + (cfg.itemCount - 1) * gap;
  return Math.min(SCROLL_HEIGHT_CEILING2, Math.max(1, raw));
}
function getItemPosition(index, cfg) {
  const gap = cfg.gap ?? 0;
  return index * (cfg.itemHeight + gap);
}
function getVisibleRange(scrollTop, viewportHeight, cfg) {
  if (cfg.itemCount <= 0 || cfg.itemHeight <= 0 || viewportHeight <= 0) {
    return { first: -1, last: -1, firstVisible: -1, lastVisible: -1 };
  }
  const gap = cfg.gap ?? 0;
  const overhang = cfg.overhang ?? 1e3;
  const step = cfg.itemHeight + gap;
  const lower = Math.round(scrollTop);
  const upper = Math.round(scrollTop + viewportHeight);
  const firstVisible = Math.max(
    0,
    Math.min(cfg.itemCount - 1, Math.floor(lower / step))
  );
  const lastVisible = Math.max(
    0,
    Math.min(cfg.itemCount - 1, Math.ceil(upper / step) - 1)
  );
  const first = Math.max(0, Math.floor((lower - overhang) / step));
  const last = Math.min(
    cfg.itemCount - 1,
    Math.ceil((upper + overhang) / step) - 1
  );
  return { first, last, firstVisible, lastVisible };
}
function getScrollPositionForIndex(index, block, currentScrollTop, viewportHeight, cfg) {
  const idx = Math.max(0, Math.min(cfg.itemCount - 1, index));
  const itemStart = getItemPosition(idx, cfg);
  const itemEnd = itemStart - viewportHeight + cfg.itemHeight;
  switch (block) {
    case "start":
      return Math.max(0, itemStart);
    case "center":
      return Math.max(0, itemStart - 0.5 * viewportHeight + 0.5 * cfg.itemHeight);
    case "end":
      return Math.max(0, itemEnd);
    case "nearest":
      return Math.abs(currentScrollTop - itemStart) < Math.abs(currentScrollTop - itemEnd) ? Math.max(0, itemStart) : Math.max(0, itemEnd);
  }
}

// src/components/virtual-scroller/scroll-controller.ts
var ScrollController = class {
  constructor(target, host) {
    /**
     * Set immediately before a programmatic scroll-error correction. Cleared
     * after a DOUBLE rAF so the synthesized scroll event is unambiguously
     * inside the correction window.
     */
    this.correctingScrollError = false;
    this._destination = null;
    this._retarget = null;
    this._end = null;
    this._target = target;
    this._host = host;
    this._scrollHandler = this._onScroll.bind(this);
    this._target.addEventListener("scroll", this._scrollHandler, { passive: true });
  }
  /** Tear down listeners. Idempotent. */
  destroy() {
    this._target.removeEventListener("scroll", this._scrollHandler);
    this._destination = null;
    this._retarget = null;
    this._end = null;
  }
  /** Replace the controlled scroll target. Used when nesting context changes. */
  retargetElement(target) {
    if (target === this._target) return;
    this._target.removeEventListener("scroll", this._scrollHandler);
    this._target = target;
    this._target.addEventListener("scroll", this._scrollHandler, { passive: true });
  }
  get target() {
    return this._target;
  }
  get scrollTop() {
    return this._target.scrollTop;
  }
  get scrollHeight() {
    return this._target.scrollHeight;
  }
  get clientHeight() {
    return this._target.clientHeight;
  }
  get maxScrollTop() {
    return Math.max(0, this._target.scrollHeight - this._target.clientHeight);
  }
  /** True when a managed smooth scroll is in flight. */
  get scrolling() {
    return this._destination !== null;
  }
  /**
   * Apply a scroll-error correction (#1, #5). The controller marks itself
   * correcting, fires the synthetic scroll, then resumes any in-flight
   * smooth scroll with the (possibly-retargeted) destination.
   */
  correctScrollError(newTop) {
    this.correctingScrollError = true;
    requestAnimationFrame(
      () => requestAnimationFrame(() => this.correctingScrollError = false)
    );
    this._target.scrollTo({ top: newTop });
    if (this._retarget) {
      const updated = this._retarget();
      this._setDestination(updated);
    }
    if (this._destination !== null) {
      this._target.scrollTo({ top: this._destination, behavior: "smooth" });
    }
  }
  /**
   * Begin a managed smooth scroll. The host should call `updateManagedTarget`
   * any time the layout re-renders items that may affect the destination.
   */
  managedScrollTo(target, retarget, end) {
    if (this._end) {
      this._end();
    }
    this._setDestination(target);
    this._retarget = retarget;
    this._end = end;
    this._target.scrollTo({ top: this._destination ?? target, behavior: "smooth" });
  }
  /**
   * Update the destination of an in-flight smooth scroll (#11). Called by
   * the host whenever the target item's true position is re-derived.
   */
  updateManagedTarget(newTarget) {
    if (this._destination === null) return;
    if (this._setDestination(newTarget)) {
      this._target.scrollTo({ top: this._destination, behavior: "smooth" });
    }
  }
  /**
   * Cancel a managed smooth scroll. The `end` callback DOES fire — callers
   * who want a silent abort should clear state themselves first.
   */
  cancelManagedScroll() {
    if (this._end) this._end();
    this._resetScrollState();
  }
  /**
   * Instant scroll — no managed retargeting, no smooth behavior. Used when
   * `scrollToIndex` is called with `behavior: 'auto'` and the target is
   * NOT in the rendered range (the layout pins, the next reflow applies).
   */
  instantScrollTo(top) {
    this._resetScrollState();
    this._target.scrollTo({ top });
  }
  // -------- internals --------
  /**
   * Set destination only if it differs from the current. Returns true when
   * the destination actually changed (so callers can decide whether to
   * issue another native `scrollTo`).
   */
  _setDestination(top) {
    const clamped = Math.max(0, Math.min(top, this.maxScrollTop));
    if (this._destination === clamped) return false;
    this._destination = clamped;
    return true;
  }
  _resetScrollState() {
    this._destination = null;
    this._retarget = null;
    this._end = null;
  }
  /**
   * Scroll handler. Detects arrival at the managed destination, and
   * forwards user scrolls to the host (suppressing programmatic ones).
   */
  _onScroll() {
    if (this.correctingScrollError) {
      return;
    }
    if (this._destination !== null) {
      const diff = Math.abs(this._target.scrollTop - this._destination);
      if (diff < 1) {
        const end = this._end;
        this._resetScrollState();
        end?.();
      }
    }
    this._host.onUserScroll();
  }
};

// src/components/virtual-scroller/clipping-ancestors.ts
function getParentElement(el) {
  const slot = el.assignedSlot;
  if (slot) return slot;
  const parent = el.parentElement;
  if (parent) return parent;
  const node = el.parentNode;
  if (node && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    const host = node.host;
    return host ?? null;
  }
  return null;
}
function getElementAncestors(el, includeSelf = false) {
  const ancestors = [];
  let parent = includeSelf ? el : getParentElement(el);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent);
  }
  return ancestors;
}
function getClippingAncestors(el, includeSelf = false) {
  let foundFixed = false;
  const result = [];
  for (const ancestor of getElementAncestors(el, includeSelf)) {
    if (foundFixed) break;
    const style = getComputedStyle(ancestor);
    if (style.position === "fixed") {
      foundFixed = true;
    }
    if (style.overflow !== "visible") {
      result.push(ancestor);
    }
  }
  return result;
}

// src/components/virtual-scroller/ae-virtual-scroller.ts
var AeVirtualScroller = class extends i4 {
  constructor() {
    super(...arguments);
    this.estimatedItemSize = 50;
    this.mode = "flow";
    this.overhang = 1e3;
    this.gap = 0;
    this.endOfListThreshold = 200;
    // ---- Internal state ----
    this._items = [];
    this._flowLayout = new FlowLayout({
      overhang: this.overhang,
      estimatedItemSize: this.estimatedItemSize,
      gap: this.gap
    });
    this._scroller = null;
    this._resizeObserver = null;
    this._itemRO = null;
    this._clippingAncestors = [];
    /** Microtask coalescing — methods scheduled this tick run once each (#9). */
    this._scheduled = /* @__PURE__ */ new WeakSet();
    /** Pinned scroll-into-view request, survives reflows (#15). */
    this._scrollPin = null;
    this._range = {
      first: -1,
      last: -1,
      firstVisible: -1,
      lastVisible: -1
    };
    /** Position map for the currently-rendered items. */
    this._childPositions = /* @__PURE__ */ new Map();
    this._scrollSize = 0;
    /** Slotted render template, used when `renderItem` is absent. */
    this._slottedTemplate = null;
    /**
     * Coalesce repeated calls to the same method inside one microtask tick (#9).
     * Pattern: add the method ref to a WeakSet, await a microtask, then run.
     * Subsequent calls during the same tick are no-ops.
     */
    this._schedule = (method) => {
      if (this._scheduled.has(method)) return;
      this._scheduled.add(method);
      queueMicrotask(() => {
        this._scheduled.delete(method);
        method.call(this);
      });
    };
    this._runReflow = () => {
      if (!this.isConnected) return;
      if (this.mode === "fixed" && this.itemHeight) {
        this.requestUpdate();
        return;
      }
      const viewport = this._scroller?.clientHeight ?? this.clientHeight;
      const scrollTop = this._scroller?.scrollTop ?? 0;
      this._flowLayout.setViewport(viewport, scrollTop);
      this._flowLayout.setItemCount(this._items.length);
      if (this._scrollPin) {
        this._flowLayout.setPin(this._scrollPin);
      }
      const prev = this._range;
      const state = this._flowLayout.reflow();
      this._range = state.range;
      this._childPositions = state.childPositions;
      this._scrollSize = state.scrollSize;
      if (state.scrollError && this._scroller) {
        const corrected = this._scroller.scrollTop - state.scrollError;
        this._scroller.correctScrollError(corrected);
      }
      if (prev.first !== state.range.first || prev.last !== state.range.last || prev.firstVisible !== state.range.firstVisible || prev.lastVisible !== state.range.lastVisible) {
        this.dispatchEvent(
          new CustomEvent("ae-visible-range-change", {
            detail: { ...state.range },
            bubbles: true,
            composed: true
          })
        );
      }
      if (this._scrollPin && this._scroller?.scrolling) {
        const dest = this._flowLayout.getScrollIntoViewPosition(this._scrollPin);
        this._scroller.updateManagedTarget(dest);
      }
      this.requestUpdate();
    };
    this._onAncestorScroll = () => {
      this._schedule(this._runReflow);
    };
  }
  get items() {
    return this._items;
  }
  set items(next) {
    const prev = this._items;
    if (prev === next) return;
    this._handleItemsChange(prev, next);
    this._items = next;
    this.requestUpdate("items", prev);
  }
  // ---- Imperative API ----
  /**
   * Scroll to the item at `index`. For `behavior: 'smooth'` the scroll
   * retargets as item measurements arrive (#11, #2). For `'auto'` (instant),
   * the layout pins the index and the next reflow applies the final position.
   */
  scrollToIndex(index, opts = {}) {
    const block = opts.block ?? "start";
    const behavior = opts.behavior ?? "auto";
    if (this._items.length === 0) return;
    const clamped = Math.max(0, Math.min(this._items.length - 1, index));
    if (this.mode === "fixed" && this.itemHeight) {
      const dest = getScrollPositionForIndex(
        clamped,
        block,
        this._scroller?.scrollTop ?? 0,
        this._scroller?.clientHeight ?? this.clientHeight,
        {
          itemCount: this._items.length,
          itemHeight: this.itemHeight,
          gap: this.gap
        }
      );
      if (behavior === "smooth" && this._scroller) {
        this._scroller.managedScrollTo(
          dest,
          () => dest,
          () => {
          }
        );
      } else {
        this._scroller?.instantScrollTo(dest);
      }
      return;
    }
    if (behavior === "smooth" && this._scroller) {
      const dest = this._flowLayout.getScrollIntoViewPosition({
        index: clamped,
        block
      });
      this._scrollPin = { index: clamped, block };
      this._flowLayout.setPin({ index: clamped, block });
      this._scroller.managedScrollTo(
        dest,
        () => this._flowLayout.getScrollIntoViewPosition({
          index: clamped,
          block
        }),
        () => {
          this._scrollPin = null;
          this._flowLayout.setPin(null);
        }
      );
      this._schedule(this._runReflow);
    } else {
      this._flowLayout.setPin({ index: clamped, block });
      this._scrollPin = { index: clamped, block };
      this._schedule(this._runReflow);
    }
  }
  /** Current rendered range and visible window. */
  getVisibleRange() {
    if (this.mode === "fixed" && this.itemHeight) {
      return getVisibleRange(
        this._scroller?.scrollTop ?? 0,
        this._scroller?.clientHeight ?? this.clientHeight,
        {
          itemCount: this._items.length,
          itemHeight: this.itemHeight,
          gap: this.gap,
          overhang: this.overhang
        }
      );
    }
    return {
      first: this._range.first,
      last: this._range.last,
      firstVisible: this._range.firstVisible,
      lastVisible: this._range.lastVisible
    };
  }
  connectedCallback() {
    super.connectedCallback();
    const t5 = this.querySelector("template[data-render-item]");
    if (t5) this._slottedTemplate = t5;
    if (!this.hasAttribute("role")) this.setAttribute("role", "list");
  }
  /** Whether the host uses the default list semantics (vs a consumer override). */
  get _usesListSemantics() {
    const role = this.getAttribute("role");
    return role === null || role === "list";
  }
  firstUpdated() {
    this._scroller = new ScrollController(this, {
      onUserScroll: () => this._schedule(this._runReflow)
    });
    this._setupResizeObservers();
    this._observeClippingAncestors();
    this._syncLayoutConfig();
    this._schedule(this._runReflow);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._scroller?.destroy();
    this._scroller = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._itemRO?.disconnect();
    this._itemRO = null;
    for (const a4 of this._clippingAncestors) {
      a4.removeEventListener("scroll", this._onAncestorScroll);
    }
    this._clippingAncestors = [];
  }
  willUpdate(changed) {
    if (changed.has("overhang") || changed.has("estimatedItemSize") || changed.has("gap")) {
      this._syncLayoutConfig();
      this._schedule(this._runReflow);
    }
    if (changed.has("mode") || changed.has("itemHeight")) {
      this._schedule(this._runReflow);
    }
  }
  render() {
    if (this.mode === "fixed" && this.itemHeight) {
      return this._renderFixed();
    }
    return this._renderFlow();
  }
  updated(_changed) {
    this._reattachItemObserver();
    this._positionChildren();
    this._applyHostScrollSize();
    this._maybeFireScrollEndNear();
  }
  // ---- Rendering ----
  _renderFlow() {
    const sizer = b2`<div ae-vs-sizer aria-hidden="true">&nbsp;</div>`;
    const children = [];
    if (this._range.first !== -1 && this._range.last !== -1) {
      for (let i7 = this._range.first; i7 <= this._range.last; i7++) {
        const item = this._items[i7];
        if (item === void 0) continue;
        children.push(
          b2`<div
            part="item-host"
            ae-vs-item
            data-index=${i7}
            role=${this._usesListSemantics ? "listitem" : A}
            aria-setsize=${this._usesListSemantics ? this._items.length : A}
            aria-posinset=${this._usesListSemantics ? i7 + 1 : A}
            style=${this._itemStyle(i7)}
          >${this._renderOne(item, i7)}</div>`
        );
      }
    }
    return b2`
      <div part="scroll-container">
        ${sizer}
        ${children}
      </div>
    `;
  }
  _renderFixed() {
    if (!this.itemHeight || this._items.length === 0) {
      return b2`<div part="scroll-container"></div>`;
    }
    const r6 = getVisibleRange(
      this._scroller?.scrollTop ?? 0,
      this._scroller?.clientHeight ?? this.clientHeight,
      {
        itemCount: this._items.length,
        itemHeight: this.itemHeight,
        gap: this.gap,
        overhang: this.overhang
      }
    );
    const cfg = {
      itemCount: this._items.length,
      itemHeight: this.itemHeight,
      gap: this.gap
    };
    const total = getTotalScrollSize(cfg);
    const children = [];
    if (r6.first !== -1) {
      for (let i7 = r6.first; i7 <= r6.last; i7++) {
        const item = this._items[i7];
        if (item === void 0) continue;
        const top = getItemPosition(i7, cfg);
        children.push(
          b2`<div
            part="item-host"
            ae-vs-item
            data-index=${i7}
            role=${this._usesListSemantics ? "listitem" : A}
            aria-setsize=${this._usesListSemantics ? this._items.length : A}
            aria-posinset=${this._usesListSemantics ? i7 + 1 : A}
            style=${`transform: translateY(${top}px); height: ${this.itemHeight}px;`}
          >${this._renderOne(item, i7)}</div>`
        );
      }
    }
    return b2`
      <div part="scroll-container" style=${`height: ${total}px;`}>
        ${children}
      </div>
    `;
  }
  _renderOne(item, index) {
    if (this.renderItem) {
      return this.renderItem(item, index);
    }
    if (this._slottedTemplate) {
      return this._slottedTemplate.content.cloneNode(true);
    }
    return b2`${String(item)}`;
  }
  _itemStyle(index) {
    const top = this._childPositions.get(index) ?? 0;
    return `transform: translateY(${top}px);`;
  }
  // ---- Layout orchestration ----
  _syncLayoutConfig() {
    this._flowLayout.setOverhang(this.overhang);
    this._flowLayout.setEstimatedItemSize(this.estimatedItemSize);
    this._flowLayout.setGap(this.gap);
    this._flowLayout.setKeyForIndex(
      this.keyFn ? (i7) => {
        const item = this._items[i7];
        return item === void 0 ? void 0 : this.keyFn(item, i7);
      } : void 0
    );
    this._flowLayout.setItemCount(this._items.length);
  }
  /**
   * Re-attach the per-item ResizeObserver to the newly-rendered children
   * after each `updated()` cycle. Items that fall out of range have their
   * RO disconnected via `_itemRO.disconnect()` on each cycle and we
   * re-observe only the live set.
   */
  _reattachItemObserver() {
    if (this.mode === "fixed") return;
    if (!this._itemRO) return;
    this._itemRO.disconnect();
    const root = this.renderRoot;
    const items = root.querySelectorAll("[ae-vs-item]");
    items.forEach((node) => this._itemRO.observe(node));
  }
  /**
   * Apply absolute positions to the children. The renderer already inlines
   * `transform: translateY` so this is mostly a no-op now — kept for the
   * code path where positions arrive AFTER the render (during measurement
   * convergence).
   */
  _positionChildren() {
    const root = this.renderRoot;
    const items = root.querySelectorAll("[ae-vs-item]");
    items.forEach((node) => {
      const idx = Number(node.dataset.index);
      if (Number.isNaN(idx)) return;
      const top = this._childPositions.get(idx);
      if (top !== void 0) {
        node.style.transform = `translateY(${top}px)`;
      }
    });
  }
  _applyHostScrollSize() {
    if (this.mode === "fixed" && this.itemHeight) return;
    const root = this.renderRoot;
    const sizer = root.querySelector("[ae-vs-sizer]");
    if (sizer) {
      sizer.style.transform = `translate(0, ${this._scrollSize}px)`;
    }
  }
  _maybeFireScrollEndNear() {
    const s4 = this._scroller;
    if (!s4) return;
    const distanceToEnd = s4.maxScrollTop - s4.scrollTop;
    if (distanceToEnd <= this.endOfListThreshold && s4.scrollTop > 0) {
      this.dispatchEvent(
        new CustomEvent("ae-scroll-end-near", {
          detail: { distanceToEnd },
          bubbles: true,
          composed: true
        })
      );
    }
  }
  // ---- Items change (#10) ----
  _handleItemsChange(prev, next) {
    if (!this.keyFn) {
      this._flowLayout.clearCache();
      return;
    }
    const survivors = /* @__PURE__ */ new Set();
    for (let i7 = 0; i7 < next.length; i7++) {
      const item = next[i7];
      if (item === void 0) continue;
      survivors.add(this.keyFn(item, i7));
    }
    this._flowLayout.pruneCacheToKeys(survivors);
  }
  // ---- Observers ----
  _setupResizeObservers() {
    this._resizeObserver = new ResizeObserver(() => {
      this._schedule(this._runReflow);
    });
    this._resizeObserver.observe(this);
    this._itemRO = new ResizeObserver((entries) => {
      let any = false;
      for (const entry of entries) {
        const node = entry.target;
        const idx = Number(node.dataset.index);
        if (Number.isNaN(idx)) continue;
        const size = entry.contentRect.height;
        if (size > 0) {
          this._flowLayout.updateItemSize(idx, size);
          any = true;
        }
      }
      if (any) this._schedule(this._runReflow);
    });
  }
  _observeClippingAncestors() {
    this._clippingAncestors = getClippingAncestors(this);
    for (const ancestor of this._clippingAncestors) {
      ancestor.addEventListener("scroll", this._onAncestorScroll, {
        passive: true
      });
    }
  }
};
AeVirtualScroller.styles = i`
    :host {
      display: block;
      position: relative;
      overflow: auto;
      contain: size layout;
      /* The scrollbar styling defers to native; tokens stay available
         for downstream theming. */
    }

    [part='scroll-container'] {
      position: relative;
      width: 100%;
    }

    [ae-vs-sizer] {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      visibility: hidden;
      pointer-events: none;
      font-size: 2px;
      margin: -2px 0 0 0;
      padding: 0;
    }

    [part='item-host'] {
      position: absolute;
      left: 0;
      right: 0;
      box-sizing: border-box;
    }
  `;
__decorateClass([
  n4({ attribute: false })
], AeVirtualScroller.prototype, "items", 1);
__decorateClass([
  n4({ attribute: false })
], AeVirtualScroller.prototype, "renderItem", 2);
__decorateClass([
  n4({ attribute: false })
], AeVirtualScroller.prototype, "keyFn", 2);
__decorateClass([
  n4({ type: Number, attribute: "estimated-item-size", reflect: false })
], AeVirtualScroller.prototype, "estimatedItemSize", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeVirtualScroller.prototype, "mode", 2);
__decorateClass([
  n4({ type: Number, attribute: "item-height" })
], AeVirtualScroller.prototype, "itemHeight", 2);
__decorateClass([
  n4({ type: Number, reflect: false })
], AeVirtualScroller.prototype, "overhang", 2);
__decorateClass([
  n4({ type: Number, reflect: false })
], AeVirtualScroller.prototype, "gap", 2);
__decorateClass([
  n4({ type: Number, attribute: "end-of-list-threshold" })
], AeVirtualScroller.prototype, "endOfListThreshold", 2);
__decorateClass([
  r5()
], AeVirtualScroller.prototype, "_range", 2);
__decorateClass([
  r5()
], AeVirtualScroller.prototype, "_scrollSize", 2);
AeVirtualScroller = __decorateClass([
  t3("ae-virtual-scroller")
], AeVirtualScroller);

// src/components/list/ae-list-item.ts
var AeListItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.disabled = false;
    this.selected = false;
    this.active = false;
  }
  updated(changed) {
    if (changed.has("disabled")) {
      if (this.disabled) this.setAttribute("aria-disabled", "true");
      else this.removeAttribute("aria-disabled");
    }
  }
  render() {
    return b2`
      <span part="row" class="row">
        <slot name="start"></slot>
        <span class="label"><slot></slot></span>
        <slot name="end"></slot>
      </span>
    `;
  }
};
AeListItem.styles = i`
    /*
     * Theme-overridable tokens (--ae-list-item-bg-active, -bg-selected,
     * -fg-selected, -shadow-selected) are NOT declared at :host —
     * resolved at consumption point. Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      --ae-list-item-padding-y: var(--ae-space-2);
      --ae-list-item-padding-x: var(--ae-space-3);

      display: block;
      cursor: pointer;
      user-select: none;
      color: var(--ae-color-fg);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-snug);
      border-radius: var(--ae-radius-sm);
    }

    :host([disabled]) {
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
    }

    :host([active]:not([disabled])) {
      background: var(--ae-list-item-bg-active, var(--ae-color-bg-muted));
    }

    :host([selected]) {
      background:
        var(--ae-list-item-bg-selected, var(--ae-color-accent-subtle));
      color:
        var(--ae-list-item-fg-selected, var(--ae-color-accent-emphasis));
      box-shadow: var(--ae-list-item-shadow-selected, none);
    }

    :host(:focus-visible) {
      ${focusRing}
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--ae-space-2);
      padding: var(--ae-list-item-padding-y) var(--ae-list-item-padding-x);
    }

    .label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    ::slotted([slot='end']) {
      margin-left: auto;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeListItem.prototype, "value", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeListItem.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeListItem.prototype, "selected", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeListItem.prototype, "active", 2);
AeListItem = __decorateClass([
  t3("ae-list-item")
], AeListItem);

// src/components/list/ae-list.ts
var AeList = class extends i4 {
  constructor() {
    super(...arguments);
    this.selectionMode = "none";
    this.variant = "default";
    this._selected = /* @__PURE__ */ new Set();
    this._activeIndex = -1;
    this._onSlotChange = () => {
      for (const item of this._items()) {
        if (!item.id) item.id = `ae-list-item-${cryptoRandom()}`;
        if (!item.hasAttribute("role")) item.setAttribute("role", "option");
        item.setAttribute("aria-selected", this._selected.has(item.value) ? "true" : "false");
      }
      this._syncItemSelection();
    };
    this._onFocus = () => {
      if (this._activeIndex < 0) {
        const items = this._enabledItems();
        if (items.length > 0) {
          const first = this._items().indexOf(items[0]);
          this._setActive(first);
        }
      }
    };
    this._onClick = (e8) => {
      const path = e8.composedPath();
      const item = path.find(
        (n6) => n6 instanceof Element && n6.tagName.toLowerCase() === "ae-list-item"
      );
      if (!item || item.disabled) return;
      const items = this._items();
      const index = items.indexOf(item);
      this._setActive(index);
      this._toggleSelection(item);
    };
    this._onKeyDown = (e8) => {
      const items = this._items();
      if (items.length === 0) return;
      const moveTo = (target) => {
        let idx = target;
        const start = idx;
        let safety = items.length + 1;
        while (safety-- > 0 && items[idx]?.disabled) {
          idx = (idx + 1) % items.length;
          if (idx === start) return;
        }
        this._setActive(idx);
        e8.preventDefault();
      };
      switch (e8.key) {
        case "ArrowDown": {
          const next = this._activeIndex < 0 ? 0 : (this._activeIndex + 1) % items.length;
          moveTo(next);
          break;
        }
        case "ArrowUp": {
          const prev = this._activeIndex < 0 ? items.length - 1 : (this._activeIndex - 1 + items.length) % items.length;
          moveTo(prev);
          break;
        }
        case "Home":
          moveTo(0);
          break;
        case "End":
          moveTo(items.length - 1);
          break;
        case " ":
        case "Spacebar": {
          if (this.selectionMode === "none") break;
          const item = items[this._activeIndex];
          if (item && !item.disabled) {
            e8.preventDefault();
            this._toggleSelection(item);
          }
          break;
        }
        default:
          break;
      }
    };
  }
  get selected() {
    return Array.from(this._selected);
  }
  set selected(value) {
    const next = /* @__PURE__ */ new Set();
    if (value) {
      for (const v2 of value) next.add(String(v2));
    }
    const prev = this._selected;
    this._selected = next;
    if (!setsEqual(prev, next)) {
      this._syncItemSelection();
      this.requestUpdate("selected");
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listbox");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this._syncAriaMultiselect();
    this.addEventListener("keydown", this._onKeyDown);
    this.addEventListener("click", this._onClick);
    this.addEventListener("focus", this._onFocus);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this._onKeyDown);
    this.removeEventListener("click", this._onClick);
    this.removeEventListener("focus", this._onFocus);
  }
  updated(changed) {
    if (changed.has("selectionMode")) this._syncAriaMultiselect();
  }
  firstUpdated() {
    this._onSlotChange();
  }
  _syncAriaMultiselect() {
    if (this.selectionMode === "multiple") {
      this.setAttribute("aria-multiselectable", "true");
    } else {
      this.removeAttribute("aria-multiselectable");
    }
  }
  _items() {
    const slot = this.shadowRoot?.querySelector("slot");
    if (!slot) return [];
    const assigned = slot.assignedElements({ flatten: true });
    return assigned.filter(
      (el) => el instanceof AeListItem || el.tagName.toLowerCase() === "ae-list-item"
    );
  }
  _enabledItems() {
    return this._items().filter((i7) => !i7.disabled);
  }
  _syncItemSelection() {
    for (const item of this._items()) {
      item.selected = this._selected.has(item.value);
    }
  }
  _setActive(index) {
    const items = this._items();
    if (index < 0 || index >= items.length) return;
    this._activeIndex = index;
    for (let i7 = 0; i7 < items.length; i7++) {
      items[i7].active = i7 === index;
    }
    const active = items[index];
    this.setAttribute("aria-activedescendant", active.id || (active.id = `ae-list-item-${cryptoRandom()}`));
  }
  _toggleSelection(item) {
    if (this.selectionMode === "none" || !item.value) return;
    const next = new Set(this._selected);
    if (this.selectionMode === "single") {
      if (next.has(item.value)) {
        next.delete(item.value);
      } else {
        next.clear();
        next.add(item.value);
      }
    } else {
      if (next.has(item.value)) next.delete(item.value);
      else next.add(item.value);
    }
    if (setsEqual(this._selected, next)) return;
    this._selected = next;
    this._syncItemSelection();
    for (const child of this._items()) {
      child.setAttribute("aria-selected", this._selected.has(child.value) ? "true" : "false");
    }
    this.dispatchEvent(
      new CustomEvent("ae-selection-change", {
        bubbles: true,
        composed: true,
        detail: { selected: Array.from(this._selected) }
      })
    );
  }
  render() {
    return b2`
      <div part="list" class="list">
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
};
AeList.styles = i`
    :host {
      --ae-list-bg: transparent;
      --ae-list-padding: var(--ae-space-1);
      --ae-list-gap: 0;
      display: block;
      background: var(--ae-list-bg);
      border-radius: var(--ae-radius-md);
      outline: none;
    }
    :host(:focus-visible) {
      ${focusRing}
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: var(--ae-list-gap);
      padding: var(--ae-list-padding);
      margin: 0;
      list-style: none;
    }

    :host([variant='inset']) {
      --ae-list-padding: var(--ae-space-2) var(--ae-space-3);
      background: var(--ae-color-bg-subtle);
      backdrop-filter: var(--ae-list-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-list-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid var(--ae-color-border-subtle);
    }

    :host([variant='striped']) ::slotted(ae-list-item:nth-of-type(odd)) {
      background: var(--ae-color-bg-subtle);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true, attribute: "selection-mode" })
], AeList.prototype, "selectionMode", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeList.prototype, "variant", 2);
__decorateClass([
  n4({ attribute: false })
], AeList.prototype, "selected", 1);
__decorateClass([
  r5()
], AeList.prototype, "_selected", 2);
__decorateClass([
  r5()
], AeList.prototype, "_activeIndex", 2);
AeList = __decorateClass([
  t3("ae-list")
], AeList);
function setsEqual(a4, b3) {
  if (a4.size !== b3.size) return false;
  for (const v2 of a4) if (!b3.has(v2)) return false;
  return true;
}
function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

// src/components/tree/ae-tree-node.ts
var AeTreeNode = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "";
    this.expandable = false;
    this.expanded = false;
    this.disabled = false;
    this.selected = false;
    this.active = false;
    this.level = 1;
    this._onToggleClick = (e8) => {
      e8.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("ae-tree-node-toggle", {
          bubbles: true,
          composed: true,
          detail: { value: this.value }
        })
      );
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "treeitem");
  }
  updated(changed) {
    if (changed.has("level")) {
      this.style.setProperty("--_level", String(this.level));
      this.setAttribute("aria-level", String(this.level));
    }
    if (changed.has("expanded") || changed.has("expandable")) {
      if (this.expandable) {
        this.setAttribute("aria-expanded", this.expanded ? "true" : "false");
      } else {
        this.removeAttribute("aria-expanded");
      }
    }
    if (changed.has("selected")) {
      this.setAttribute("aria-selected", this.selected ? "true" : "false");
    }
    if (changed.has("disabled")) {
      if (this.disabled) this.setAttribute("aria-disabled", "true");
      else this.removeAttribute("aria-disabled");
    }
  }
  /** Convenience: returns the immediate child `<ae-tree-node>` elements. */
  get childNodes_() {
    const slot = this.shadowRoot?.querySelector("slot:not([name])");
    if (!slot) return [];
    return slot.assignedElements({ flatten: true }).filter(
      (el) => el instanceof AeTreeNode || el.tagName.toLowerCase() === "ae-tree-node"
    );
  }
  render() {
    return b2`
      <div part="row" class="row">
        ${this.expandable ? b2`<button
              part="toggle"
              class="toggle"
              aria-hidden="true"
              tabindex="-1"
              @click=${this._onToggleClick}
            >
              <svg viewBox="0 0 12 12" width="10" height="10">
                <path
                  d="M4 2 L8 6 L4 10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>` : b2`<span class="toggle-placeholder"></span>`}
        <slot name="start"></slot>
        <span part="label" class="label">${this.label || A}<slot name="label"></slot></span>
      </div>
      <div part="children" class="children" role="group">
        <slot></slot>
      </div>
    `;
  }
};
AeTreeNode.styles = i`
    :host {
      --ae-tree-node-indent: 1.25rem;
      display: block;
      color: var(--ae-color-fg);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-snug);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--ae-space-1);
      padding: var(--ae-space-1) var(--ae-space-2);
      border-radius: var(--ae-radius-sm);
      cursor: pointer;
      user-select: none;
      padding-left: calc(var(--ae-tree-node-indent) * (var(--_level, 1) - 1) + var(--ae-space-2));
    }

    :host([disabled]) .row {
      color: var(--ae-color-fg-disabled);
      cursor: not-allowed;
    }

    :host([active]:not([disabled])) .row {
      background:
        var(--ae-tree-node-bg-active, var(--ae-color-bg-muted));
    }

    :host([selected]) .row {
      background:
        var(--ae-tree-node-bg-selected, var(--ae-color-accent-subtle));
      color:
        var(--ae-tree-node-fg-selected, var(--ae-color-accent-emphasis));
      box-shadow: var(--ae-tree-node-shadow-selected, none);
    }

    :host(:focus-visible) .row,
    .row:focus-visible {
      ${focusRing}
    }

    .toggle {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      flex: none;
      color: var(--ae-color-fg-muted);
      cursor: pointer;
      border-radius: var(--ae-radius-xs);
    }
    .toggle svg {
      transition: transform var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    :host([expanded]) .toggle svg {
      transform: rotate(90deg);
    }
    .toggle-placeholder {
      width: 1rem;
      height: 1rem;
      flex: none;
    }

    .label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .children {
      display: none;
    }
    :host([expanded]) .children {
      display: block;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTreeNode.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], AeTreeNode.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTreeNode.prototype, "expandable", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTreeNode.prototype, "expanded", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTreeNode.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTreeNode.prototype, "selected", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTreeNode.prototype, "active", 2);
__decorateClass([
  n4({ type: Number, attribute: "data-level" })
], AeTreeNode.prototype, "level", 2);
AeTreeNode = __decorateClass([
  t3("ae-tree-node")
], AeTreeNode);

// src/components/tree/ae-tree.ts
var AeTree = class extends i4 {
  constructor() {
    super(...arguments);
    this.selectionMode = "none";
    this._selected = /* @__PURE__ */ new Set();
    this._expanded = /* @__PURE__ */ new Set();
    this._activeValue = null;
    this._expandedExplicitlySet = false;
    this._selectedExplicitlySet = false;
    this._onSlotChange = () => {
      if (!this._expandedExplicitlySet) {
        const seed = /* @__PURE__ */ new Set();
        for (const node of this._allNodes()) {
          if (node.expandable && node.expanded && node.value) seed.add(node.value);
        }
        if (seed.size > 0) this._expanded = seed;
      }
      if (!this._selectedExplicitlySet) {
        const seed = /* @__PURE__ */ new Set();
        for (const node of this._allNodes()) {
          if (node.selected && node.value) seed.add(node.value);
        }
        if (seed.size > 0) this._selected = seed;
      }
      for (const node of this._allNodes()) {
        if (!node.id) node.id = `ae-tree-node-${rand()}`;
        if (!node.hasAttribute("role")) node.setAttribute("role", "treeitem");
        if (node.expandable) {
          node.expanded = this._expanded.has(node.value);
        }
        node.selected = this._selected.has(node.value);
      }
      if (!this._activeValue) {
        const first = this._visibleNodes().find((n6) => !n6.disabled);
        if (first) {
          this._activeValue = first.value;
          this._syncActive();
        }
      }
    };
    this._onFocus = () => {
      if (!this._activeValue) {
        const first = this._visibleNodes().find((n6) => !n6.disabled);
        if (first) {
          this._activeValue = first.value;
          this._syncActive();
        }
      }
    };
    this._onToggleEvent = (e8) => {
      const target = this._allNodes().find((n6) => n6.value === e8.detail.value);
      if (target) this._toggleExpand(target);
    };
    this._onClick = (e8) => {
      const path = e8.composedPath();
      const node = path.find(
        (n6) => n6 instanceof Element && n6.tagName.toLowerCase() === "ae-tree-node"
      );
      if (!node || node.disabled) return;
      this._activeValue = node.value;
      this._syncActive();
      this._toggleSelection(node);
    };
    this._onKeyDown = (e8) => {
      const visible = this._visibleNodes();
      if (visible.length === 0) return;
      const activeIdx = visible.findIndex((n6) => n6.value === this._activeValue);
      const moveTo = (idx) => {
        if (idx < 0 || idx >= visible.length) return;
        let i7 = idx;
        const start = i7;
        let safety = visible.length + 1;
        while (safety-- > 0 && visible[i7].disabled) {
          i7 = (i7 + 1) % visible.length;
          if (i7 === start) return;
        }
        this._activeValue = visible[i7].value;
        this._syncActive();
        e8.preventDefault();
      };
      switch (e8.key) {
        case "ArrowDown":
          moveTo(activeIdx < 0 ? 0 : Math.min(visible.length - 1, activeIdx + 1));
          break;
        case "ArrowUp":
          moveTo(activeIdx < 0 ? visible.length - 1 : Math.max(0, activeIdx - 1));
          break;
        case "Home":
          moveTo(0);
          break;
        case "End":
          moveTo(visible.length - 1);
          break;
        case "ArrowRight": {
          const node = visible[activeIdx];
          if (!node) break;
          if (node.expandable && !node.expanded) {
            e8.preventDefault();
            this._setExpanded(node, true);
          } else if (node.expandable && node.expanded) {
            const firstChild = node.childNodes_[0];
            if (firstChild) {
              e8.preventDefault();
              this._activeValue = firstChild.value;
              this._syncActive();
            }
          }
          break;
        }
        case "ArrowLeft": {
          const node = visible[activeIdx];
          if (!node) break;
          if (node.expandable && node.expanded) {
            e8.preventDefault();
            this._setExpanded(node, false);
          } else {
            const parent = this._parentOf(node);
            if (parent) {
              e8.preventDefault();
              this._activeValue = parent.value;
              this._syncActive();
            }
          }
          break;
        }
        case "Enter":
        case " ":
        case "Spacebar": {
          const node = visible[activeIdx];
          if (node && !node.disabled) {
            e8.preventDefault();
            this._toggleSelection(node);
          }
          break;
        }
        case "*": {
          const node = visible[activeIdx];
          if (!node) break;
          const parent = this._parentOf(node);
          const siblings2 = parent ? parent.childNodes_ : Array.from(this.children).filter(
            (el) => el instanceof AeTreeNode || el.tagName.toLowerCase() === "ae-tree-node"
          );
          e8.preventDefault();
          for (const s4 of siblings2) {
            if (s4.expandable && !s4.expanded) this._setExpanded(s4, true);
          }
          break;
        }
        default:
          break;
      }
    };
  }
  get selected() {
    return Array.from(this._selected);
  }
  set selected(value) {
    this._selectedExplicitlySet = true;
    const next = normalizeSet(value);
    if (!setsEqual2(this._selected, next)) {
      this._selected = next;
      this._syncNodeSelection();
      this.requestUpdate("selected");
    }
  }
  get expanded() {
    return Array.from(this._expanded);
  }
  set expanded(value) {
    this._expandedExplicitlySet = true;
    const next = normalizeSet(value);
    if (!setsEqual2(this._expanded, next)) {
      this._expanded = next;
      this._syncNodeExpansion();
      this.requestUpdate("expanded");
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "tree");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this._syncAriaMultiselect();
    this.addEventListener("keydown", this._onKeyDown);
    this.addEventListener("click", this._onClick);
    this.addEventListener("focus", this._onFocus);
    this.addEventListener("ae-tree-node-toggle", this._onToggleEvent);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this._onKeyDown);
    this.removeEventListener("click", this._onClick);
    this.removeEventListener("focus", this._onFocus);
    this.removeEventListener("ae-tree-node-toggle", this._onToggleEvent);
  }
  updated(changed) {
    if (changed.has("selectionMode")) this._syncAriaMultiselect();
  }
  firstUpdated() {
    this._onSlotChange();
  }
  _syncAriaMultiselect() {
    if (this.selectionMode === "multiple") {
      this.setAttribute("aria-multiselectable", "true");
    } else {
      this.removeAttribute("aria-multiselectable");
    }
  }
  /**
   * Returns every `<ae-tree-node>` in document order (deep), with the
   * level applied as we go so each node knows its depth.
   */
  _allNodes() {
    const out = [];
    const walk = (parent, level) => {
      const directChildren = Array.from(parent.children).filter(
        (el) => el instanceof AeTreeNode || el.tagName.toLowerCase() === "ae-tree-node"
      );
      const setSize = directChildren.length;
      directChildren.forEach((node, i7) => {
        node.level = level;
        node.setAttribute("aria-setsize", String(setSize));
        node.setAttribute("aria-posinset", String(i7 + 1));
        out.push(node);
        walk(node, level + 1);
      });
    };
    walk(this, 1);
    return out;
  }
  /** Returns nodes whose ancestors are all expanded (i.e. currently visible). */
  _visibleNodes() {
    const visible = [];
    const walk = (parent, parentVisible) => {
      const directChildren = Array.from(parent.children).filter(
        (el) => el instanceof AeTreeNode || el.tagName.toLowerCase() === "ae-tree-node"
      );
      for (const node of directChildren) {
        if (parentVisible) visible.push(node);
        const childrenVisible = parentVisible && (!node.expandable || node.expanded);
        walk(node, childrenVisible);
      }
    };
    walk(this, true);
    return visible;
  }
  _parentOf(target) {
    let p3 = target.parentElement;
    while (p3) {
      if (p3 instanceof AeTreeNode) return p3;
      if (p3 instanceof AeTree) return null;
      p3 = p3.parentElement;
    }
    return null;
  }
  _syncNodeSelection() {
    for (const n6 of this._allNodes()) n6.selected = this._selected.has(n6.value);
  }
  _syncNodeExpansion() {
    for (const n6 of this._allNodes()) n6.expanded = this._expanded.has(n6.value);
  }
  _syncActive() {
    const all = this._allNodes();
    for (const n6 of all) {
      n6.active = n6.value === this._activeValue;
    }
    const active = all.find((n6) => n6.value === this._activeValue);
    if (active) {
      if (!active.id) active.id = `ae-tree-node-${rand()}`;
      this.setAttribute("aria-activedescendant", active.id);
    }
  }
  _setExpanded(node, expanded) {
    if (!node.expandable) return;
    if (node.expanded === expanded) return;
    const next = new Set(this._expanded);
    if (expanded) next.add(node.value);
    else next.delete(node.value);
    this._expanded = next;
    node.expanded = expanded;
    this.dispatchEvent(
      new CustomEvent(expanded ? "ae-expand" : "ae-collapse", {
        bubbles: true,
        composed: true,
        detail: { value: node.value }
      })
    );
  }
  _toggleExpand(node) {
    this._setExpanded(node, !node.expanded);
  }
  _toggleSelection(node) {
    if (this.selectionMode === "none" || !node.value) return;
    const next = new Set(this._selected);
    if (this.selectionMode === "single") {
      if (next.has(node.value)) {
        next.delete(node.value);
      } else {
        next.clear();
        next.add(node.value);
      }
    } else {
      if (next.has(node.value)) next.delete(node.value);
      else next.add(node.value);
    }
    if (setsEqual2(this._selected, next)) return;
    this._selected = next;
    this._syncNodeSelection();
    this.dispatchEvent(
      new CustomEvent("ae-selection-change", {
        bubbles: true,
        composed: true,
        detail: { selected: Array.from(this._selected) }
      })
    );
  }
  render() {
    return b2`<div part="tree">
      <slot @slotchange=${this._onSlotChange}></slot>
    </div>`;
  }
};
AeTree.styles = i`
    :host {
      --ae-tree-padding: var(--ae-space-1);
      display: block;
      outline: none;
    }
    :host(:focus-visible) {
      ${focusRing}
    }
    /*
     * Padding lives on the [part=tree] container, NOT on :host. A consumer's
     * global reset (\`* { padding: 0 }\`) is a document-tree declaration, and in
     * the cascade a normal document declaration overrides a normal :host one —
     * so host padding silently collapses to 0 under that common reset. A
     * document \`*\` selector can't reach inside this shadow tree, so the
     * container's padding is immune. Driven by --ae-tree-padding either way.
     */
    [part='tree'] {
      padding: var(--ae-tree-padding);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true, attribute: "selection-mode" })
], AeTree.prototype, "selectionMode", 2);
__decorateClass([
  n4({ attribute: false })
], AeTree.prototype, "selected", 1);
__decorateClass([
  n4({ attribute: false })
], AeTree.prototype, "expanded", 1);
__decorateClass([
  r5()
], AeTree.prototype, "_selected", 2);
__decorateClass([
  r5()
], AeTree.prototype, "_expanded", 2);
__decorateClass([
  r5()
], AeTree.prototype, "_activeValue", 2);
AeTree = __decorateClass([
  t3("ae-tree")
], AeTree);
function normalizeSet(value) {
  const next = /* @__PURE__ */ new Set();
  if (value) for (const v2 of value) next.add(String(v2));
  return next;
}
function setsEqual2(a4, b3) {
  if (a4.size !== b3.size) return false;
  for (const v2 of a4) if (!b3.has(v2)) return false;
  return true;
}
function rand() {
  return Math.random().toString(36).slice(2, 10);
}

// src/components/table/ae-th.ts
var AeTh = class extends i4 {
  constructor() {
    super(...arguments);
    this.column = null;
    this.align = "start";
    this.sortable = false;
    this.sort = "none";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "columnheader");
  }
  updated(changed) {
    if (changed.has("sort")) {
      if (this.sort === "none") {
        this.removeAttribute("aria-sort");
      } else {
        this.setAttribute("aria-sort", this.sort === "asc" ? "ascending" : "descending");
      }
    }
    if (changed.has("sortable")) {
      if (this.sortable) this.setAttribute("tabindex", "0");
      else this.removeAttribute("tabindex");
    }
  }
  render() {
    return b2`
      <span class="cell">
        <slot></slot>
        ${this.sortable ? b2`<svg class="sort-icon" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M3 5 L6 2 L9 5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3 7 L6 10 L9 7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="${this.sort === "asc" ? "0" : "1"}"
              />
            </svg>` : A}
      </span>
    `;
  }
};
AeTh.styles = i`
    :host {
      --ae-th-padding: var(--ae-space-2) var(--ae-space-3);
      display: table-cell;
      vertical-align: middle;
      text-align: left;
      border-bottom: var(--ae-border-width-1) solid var(--ae-color-border);
      font-weight: inherit;
    }
    :host([align='center']) { text-align: center; }
    :host([align='end']) { text-align: right; }

    :host([sortable]) {
      cursor: pointer;
      user-select: none;
    }
    :host([sortable]:hover) {
      color: var(--ae-color-fg);
    }

    /*
     * Cell padding lives on .cell, NOT on :host. A consumer's global
     * "* { padding: 0 }" reset is a document-tree declaration and overrides a
     * normal :host one in the cascade, so host padding would silently collapse
     * to 0 — cramming header text against the cell edge. A document-scope star
     * selector cannot reach inside this shadow tree, so .cell's padding is safe.
     */
    .cell {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      padding: var(--ae-th-padding);
    }
    :host([align='center']) .cell { justify-content: center; }
    :host([align='end']) .cell { justify-content: flex-end; }

    .sort-icon {
      width: 0.75em;
      height: 0.75em;
      opacity: 0.4;
      flex: none;
    }
    :host([sort='asc']) .sort-icon,
    :host([sort='desc']) .sort-icon {
      opacity: 1;
      color: var(--ae-color-accent-emphasis);
    }
    :host([sort='desc']) .sort-icon {
      transform: rotate(180deg);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTh.prototype, "column", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTh.prototype, "align", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTh.prototype, "sortable", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTh.prototype, "sort", 2);
AeTh = __decorateClass([
  t3("ae-th")
], AeTh);

// src/components/table/ae-thead.ts
var AeThead = class extends i4 {
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "rowgroup");
  }
  render() {
    return b2`<slot></slot>`;
  }
};
AeThead.styles = i`
    /*
     * Background, color, and tracking are read via the same
     * --ae-table-header-* tokens that the data-mode table consumes,
     * so theme packs like Metro that override the header chrome flow
     * through to both render paths.
     */
    :host {
      display: table-header-group;
      background: var(--ae-table-header-bg, var(--ae-color-bg-subtle));
      color: var(--ae-table-header-fg, var(--ae-color-fg-muted));
      font-weight: var(--ae-font-weight-semibold);
      font-size: var(--ae-font-size-xs);
      text-transform: uppercase;
      letter-spacing:
        var(--ae-table-header-letter-spacing,
          var(--ae-letter-spacing-wide));
    }
  `;
AeThead = __decorateClass([
  t3("ae-thead")
], AeThead);

// src/components/table/ae-tbody.ts
var AeTbody = class extends i4 {
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "rowgroup");
  }
  render() {
    return b2`<slot></slot>`;
  }
};
AeTbody.styles = i`
    :host {
      display: table-row-group;
    }
  `;
AeTbody = __decorateClass([
  t3("ae-tbody")
], AeTbody);

// src/components/table/ae-tr.ts
var AeTr = class extends i4 {
  constructor() {
    super(...arguments);
    this.selected = false;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "row");
  }
  render() {
    return b2`<slot></slot>`;
  }
};
AeTr.styles = i`
    :host {
      display: table-row;
      border-bottom: var(--ae-border-width-1) solid var(--ae-color-border-subtle);
    }
    :host([selected]) {
      background: var(--ae-color-accent-subtle);
    }
    :host(:hover) {
      background: var(--ae-color-bg-subtle);
    }
    :host([selected]:hover) {
      background: var(--ae-color-accent-subtle);
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTr.prototype, "selected", 2);
AeTr = __decorateClass([
  t3("ae-tr")
], AeTr);

// src/components/table/ae-td.ts
var AeTd = class extends i4 {
  constructor() {
    super(...arguments);
    this.align = "start";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "cell");
  }
  render() {
    return b2`<div class="cell"><slot></slot></div>`;
  }
};
AeTd.styles = i`
    :host {
      --ae-td-padding: var(--ae-space-2) var(--ae-space-3);
      display: table-cell;
      vertical-align: middle;
      color: var(--ae-color-fg);
      font-size: var(--ae-font-size-sm);
      text-align: left;
    }
    :host([align='center']) { text-align: center; }
    :host([align='end']) { text-align: right; }

    /*
     * Cell padding lives on the .cell wrapper, NOT on :host. A consumer's
     * global "* { padding: 0 }" reset is a document-tree declaration and
     * overrides a normal :host one in the cascade, so host padding would
     * silently collapse to 0 — cramming cell content against the edge. A
     * document-scope star selector cannot reach inside this shadow tree, so
     * .cell is immune.
     */
    .cell {
      padding: var(--ae-td-padding);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTd.prototype, "align", 2);
AeTd = __decorateClass([
  t3("ae-td")
], AeTd);

// src/components/table/ae-table.ts
var AeTable = class extends i4 {
  constructor() {
    super(...arguments);
    this.sortable = false;
    this.sortBy = null;
    this.sortDirection = "asc";
    this.selectionMode = "none";
    this.density = "default";
    this.stickyHeader = false;
    this.caption = null;
    this.rows = null;
    this.columns = null;
    this._selected = /* @__PURE__ */ new Set();
    /** True when this element set the host's `role="table"` itself (so it may
     *  safely remove it when switching to data mode). */
    this._ownsTableRole = false;
    /** True when this element set the host's caption-derived `aria-label`. */
    this._ownsAriaLabel = false;
    this._onClick = (e8) => {
      const path = e8.composedPath();
      const th = path.find(
        (n6) => n6 instanceof Element && n6.tagName.toLowerCase() === "ae-th"
      );
      if (th && th.sortable && th.column) {
        this._handleSort(th.column);
        return;
      }
    };
    /** Keyboard activation for slot-mode sortable <ae-th> headers (2.1.1). */
    this._onKeydown = (e8) => {
      if (e8.key !== "Enter" && e8.key !== " " && e8.key !== "Spacebar") return;
      const th = e8.composedPath().find(
        (n6) => n6 instanceof Element && n6.tagName.toLowerCase() === "ae-th"
      );
      if (th && th.sortable && th.column) {
        e8.preventDefault();
        this._handleSort(th.column);
      }
    };
  }
  get selected() {
    return Array.from(this._selected);
  }
  set selected(value) {
    const next = /* @__PURE__ */ new Set();
    if (value) for (const v2 of value) next.add(String(v2));
    if (!setsEqual3(this._selected, next)) {
      this._selected = next;
      this.requestUpdate("selected");
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this._onClick);
    this.addEventListener("keydown", this._onKeydown);
    this._syncHostTableSemantics();
  }
  /**
   * Slot mode renders the table grid from the host + slotted display:table
   * sub-elements, so the HOST carries `role="table"` and (when a caption is
   * set) names itself via `aria-label` — a real `<caption>` can't attach to
   * the contents-display slot region.
   *
   * Data mode renders a real `<table>` with its own implicit table role and
   * `<caption>`, so a `role="table"` on the host would nest a SECOND,
   * redundant table in the accessibility tree. We strip the role/label we
   * set ourselves in that case (never a consumer-authored one).
   */
  _syncHostTableSemantics() {
    if (this._isDataMode()) {
      if (this._ownsTableRole && this.getAttribute("role") === "table") {
        this.removeAttribute("role");
        this._ownsTableRole = false;
      }
      if (this._ownsAriaLabel) {
        this.removeAttribute("aria-label");
        this._ownsAriaLabel = false;
      }
      return;
    }
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "table");
      this._ownsTableRole = true;
    }
    if (this.caption && !this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", this.caption);
      this._ownsAriaLabel = true;
    } else if (this._ownsAriaLabel && !this.caption) {
      this.removeAttribute("aria-label");
      this._ownsAriaLabel = false;
    } else if (this._ownsAriaLabel && this.caption) {
      this.setAttribute("aria-label", this.caption);
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this._onClick);
    this.removeEventListener("keydown", this._onKeydown);
  }
  updated(changed) {
    if (changed.has("sortBy") || changed.has("sortDirection")) {
      this._syncSlotSortAttributes();
    }
    if (changed.has("rows") || changed.has("columns") || changed.has("caption")) {
      this._syncHostTableSemantics();
    }
  }
  _syncSlotSortAttributes() {
    const ths = this.querySelectorAll("ae-th");
    ths.forEach((th) => {
      const aeTh = th;
      if (!aeTh.column) {
        aeTh.sort = "none";
        return;
      }
      if (aeTh.column === this.sortBy) {
        aeTh.sort = this.sortDirection;
      } else {
        aeTh.sort = "none";
      }
    });
  }
  /** Sortable headers must be operable by keyboard (WCAG 2.1.1): Enter or
   *  Space toggles the sort, mirroring the click affordance. */
  _onHeaderKeydown(e8, column) {
    if (e8.key === "Enter" || e8.key === " " || e8.key === "Spacebar") {
      e8.preventDefault();
      this._handleSort(column);
    }
  }
  _handleSort(column) {
    let direction = "asc";
    if (this.sortBy === column) {
      direction = this.sortDirection === "asc" ? "desc" : "asc";
    }
    this.sortBy = column;
    this.sortDirection = direction;
    this.dispatchEvent(
      new CustomEvent("ae-sort-change", {
        bubbles: true,
        composed: true,
        detail: { column, direction }
      })
    );
  }
  _toggleRow(id) {
    if (this.selectionMode === "none") return;
    const next = new Set(this._selected);
    if (this.selectionMode === "single") {
      if (next.has(id)) next.delete(id);
      else {
        next.clear();
        next.add(id);
      }
    } else {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    if (setsEqual3(this._selected, next)) return;
    this._selected = next;
    this.dispatchEvent(
      new CustomEvent("ae-selection-change", {
        bubbles: true,
        composed: true,
        detail: { selected: Array.from(this._selected) }
      })
    );
  }
  _isDataMode() {
    return Array.isArray(this.rows) && Array.isArray(this.columns);
  }
  _renderDataMode() {
    const rows = this.rows ?? [];
    const columns = this.columns ?? [];
    const headerCells = columns.map((col) => {
      const isSortable = !!(col.sortable && this.sortable);
      const isSorted = this.sortBy === col.id;
      const ariaSort = isSorted ? this.sortDirection === "asc" ? "ascending" : "descending" : null;
      return b2`<th
        scope="col"
        role="columnheader"
        data-column=${col.id}
        data-align=${col.align ?? A}
        ?data-sortable=${isSortable}
        aria-sort=${ariaSort ?? A}
        tabindex=${isSortable ? "0" : A}
        @click=${isSortable ? () => this._handleSort(col.id) : A}
        @keydown=${isSortable ? (e8) => this._onHeaderKeydown(e8, col.id) : A}
      >
        ${col.label}${isSortable ? b2`<span class="sort-icon"></span>` : A}
      </th>`;
    });
    return b2`
      <table class="data" part="table">
        ${this.caption ? b2`<caption>${this.caption}</caption>` : A}
        <thead role="rowgroup">
          <tr role="row">${headerCells}</tr>
        </thead>
        <tbody role="rowgroup">
          ${rows.map((row, idx) => this._renderDataRow(row, columns, idx))}
        </tbody>
      </table>
    `;
  }
  _renderDataRow(row, columns, idx) {
    const id = String(row["id"] ?? idx);
    const selected = this._selected.has(id);
    const onClick = this.selectionMode === "none" ? A : () => this._toggleRow(id);
    return b2`<tr
      role="row"
      data-id=${id}
      data-selected=${selected ? "true" : "false"}
      aria-selected=${this.selectionMode === "none" ? A : selected ? "true" : "false"}
      @click=${onClick}
    >
      ${columns.map((col) => {
      const raw = row[col.id];
      const content = col.render ? col.render(raw, row) : raw;
      return b2`<td role="cell" data-align=${col.align ?? A}>${content}</td>`;
    })}
    </tr>`;
  }
  render() {
    if (this._isDataMode()) {
      return this._renderDataMode();
    }
    return b2`
      <div class="slot-region" part="table">
        ${this.caption ? b2`<div
              style="padding: var(--ae-space-2) var(--ae-space-3); color: var(--ae-color-fg-muted); font-size: var(--ae-font-size-sm);"
            >
              ${this.caption}
            </div>` : A}
        <slot name="header"></slot>
        <slot></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }
};
AeTable.styles = i`
    /*
     * Theme-overridable tokens (--ae-table-bg, -border, -header-bg,
     * -header-fg, -header-letter-spacing) are NOT declared at :host.
     * Locked down by src/theme-integration.test.ts.
     */
    :host {
      --ae-table-row-height: 2.5rem;
      --ae-table-cell-padding: var(--ae-space-2) var(--ae-space-3);
      display: block;
      background: var(--ae-table-bg, var(--ae-color-bg));
      /* Frosted-glass hook — the data grid a reviewer reads frosts over the
       * atmosphere. Inert unless a theme sets --ae-surface-backdrop-filter and
       * a translucent --ae-table-bg (Crucible). */
      backdrop-filter: var(--ae-table-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-table-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid
        var(--ae-table-border, var(--ae-color-border));
      border-radius: var(--ae-radius-md);
      overflow: auto;
      font-family: var(--ae-font-family-sans);
      color: var(--ae-color-fg);
    }
    :host(:focus-visible) {
      ${focusRing}
    }

    :host([density='compact']) {
      --ae-table-row-height: 2rem;
      --ae-table-cell-padding: var(--ae-space-1) var(--ae-space-3);
    }
    :host([density='relaxed']) {
      --ae-table-row-height: 3rem;
      --ae-table-cell-padding: var(--ae-space-3) var(--ae-space-4);
    }

    table.data {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--ae-font-size-sm);
    }
    table.data caption {
      caption-side: top;
      text-align: left;
      padding: var(--ae-space-2) var(--ae-space-3);
      color: var(--ae-color-fg-muted);
      font-size: var(--ae-font-size-sm);
    }
    table.data thead {
      background: var(--ae-table-header-bg, var(--ae-color-bg-subtle));
      color: var(--ae-table-header-fg, var(--ae-color-fg-muted));
      font-weight: var(--ae-font-weight-semibold);
      font-size: var(--ae-font-size-xs);
      text-transform: uppercase;
      letter-spacing:
        var(--ae-table-header-letter-spacing,
          var(--ae-letter-spacing-wide));
    }
    :host([sticky-header]) table.data thead th {
      position: sticky;
      top: 0;
      background: var(--ae-table-header-bg, var(--ae-color-bg-subtle));
      z-index: 1;
    }
    table.data th,
    table.data td {
      padding: var(--ae-table-cell-padding);
      text-align: left;
      border-bottom: var(--ae-border-width-1) solid var(--ae-color-border-subtle);
      vertical-align: middle;
    }
    table.data th[data-align='center'],
    table.data td[data-align='center'] { text-align: center; }
    table.data th[data-align='end'],
    table.data td[data-align='end'] { text-align: right; }
    table.data th[data-sortable] {
      cursor: pointer;
      user-select: none;
    }
    table.data th[aria-sort='ascending'],
    table.data th[aria-sort='descending'] {
      color: var(--ae-color-accent-emphasis);
    }
    table.data tr[data-selected='true'] {
      background: var(--ae-color-accent-subtle);
    }
    table.data tbody tr:hover {
      background: var(--ae-color-bg-subtle);
    }

    .wrapper {
      display: table;
      width: 100%;
    }

    .slot-region {
      display: contents;
    }

    .sort-icon {
      display: inline-block;
      margin-left: var(--ae-space-1);
      opacity: 0.45;
      font-size: 0.7em;
    }
    th[aria-sort='ascending'] .sort-icon::after { content: '▲'; opacity: 1; }
    th[aria-sort='descending'] .sort-icon::after { content: '▼'; opacity: 1; }
    th[data-sortable] .sort-icon::after { content: '⇅'; }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeTable.prototype, "sortable", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "sort-by" })
], AeTable.prototype, "sortBy", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "sort-direction" })
], AeTable.prototype, "sortDirection", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "selection-mode" })
], AeTable.prototype, "selectionMode", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTable.prototype, "density", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "sticky-header" })
], AeTable.prototype, "stickyHeader", 2);
__decorateClass([
  n4({ type: String })
], AeTable.prototype, "caption", 2);
__decorateClass([
  n4({ attribute: false })
], AeTable.prototype, "rows", 2);
__decorateClass([
  n4({ attribute: false })
], AeTable.prototype, "columns", 2);
__decorateClass([
  n4({ attribute: false })
], AeTable.prototype, "selected", 1);
__decorateClass([
  r5()
], AeTable.prototype, "_selected", 2);
AeTable = __decorateClass([
  t3("ae-table")
], AeTable);
function setsEqual3(a4, b3) {
  if (a4.size !== b3.size) return false;
  for (const v2 of a4) if (!b3.has(v2)) return false;
  return true;
}

// src/components/avatar/ae-avatar.ts
var AeAvatar = class extends i4 {
  constructor() {
    super(...arguments);
    this.src = null;
    this.name = "";
    this.initials = null;
    this.size = "md";
    this.shape = "circle";
    this.tone = "neutral";
    this.status = null;
    this._imageFailed = false;
    this._onImgError = () => {
      this._imageFailed = true;
    };
  }
  _deriveInitials() {
    if (this.initials && this.initials.trim().length > 0) {
      return this.initials.trim().slice(0, 2).toUpperCase();
    }
    const name = (this.name ?? "").trim();
    if (!name) return "";
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    if (words.length === 1) {
      return (words[0][0] ?? "").toUpperCase();
    }
    return ((words[0][0] ?? "") + (words[words.length - 1][0] ?? "")).toUpperCase();
  }
  willUpdate(changed) {
    if (changed.has("src")) {
      this._imageFailed = false;
    }
  }
  render() {
    const label = this.name || this.initials || "Avatar";
    const showImage = !!this.src && !this._imageFailed;
    const initials = this._deriveInitials();
    return b2`
      <span
        part="avatar"
        class="avatar"
        role="img"
        aria-label=${label}
      >
        ${showImage ? b2`<img
              part="image"
              src=${this.src}
              alt=""
              @error=${this._onImgError}
            />` : b2`<slot>${initials}</slot>`}
      </span>
      ${this.status ? b2`<span
            part="status"
            class="status"
            role="img"
            aria-label=${this.status}
          ></span>` : A}
    `;
  }
};
AeAvatar.styles = i`
    :host {
      --ae-avatar-size: 2.5rem;
      --ae-avatar-bg: var(--ae-color-bg-muted);
      --ae-avatar-fg: var(--ae-color-fg);
      --ae-avatar-radius: var(--ae-radius-full);
      --_status-bg: var(--ae-color-gray-400);

      display: inline-flex;
      vertical-align: middle;
      position: relative;
      width: var(--ae-avatar-size);
      height: var(--ae-avatar-size);
    }

    :host([size='xs']) { --ae-avatar-size: 1.25rem; }
    :host([size='sm']) { --ae-avatar-size: 1.75rem; }
    :host([size='md']) { --ae-avatar-size: 2.5rem; }
    :host([size='lg']) { --ae-avatar-size: 3.25rem; }
    :host([size='xl']) { --ae-avatar-size: 4.5rem; }

    :host([shape='square']) {
      --ae-avatar-radius: var(--ae-avatar-square-radius, var(--ae-radius-md));
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: var(--ae-avatar-radius);
      background: var(--ae-avatar-bg);
      color: var(--ae-avatar-fg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: var(--ae-avatar-font-family, var(--ae-font-family-sans));
      font-weight: var(--ae-avatar-font-weight, var(--ae-font-weight-semibold));
      font-size: calc(var(--ae-avatar-size) * 0.4);
      line-height: 1;
      letter-spacing: var(--ae-avatar-tracking, var(--ae-letter-spacing-tight));
      user-select: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Tones drive fallback bg/fg. Each routes through a per-tone indirection
     * token (fallback preserves the default) so a brand recolors a tone by
     * SETTING it at :root — Metro flips the soft tints into solid signal
     * grounds with paper/ink initials, matching the source ticket avatar. */
    :host([tone='neutral']) {
      --ae-avatar-bg: var(--ae-avatar-neutral-bg, var(--ae-color-bg-muted));
      --ae-avatar-fg: var(--ae-avatar-neutral-fg, var(--ae-color-fg));
    }
    :host([tone='accent']) {
      --ae-avatar-bg: var(--ae-avatar-accent-bg, var(--ae-color-accent-subtle));
      --ae-avatar-fg: var(--ae-avatar-accent-fg, var(--ae-color-accent-emphasis));
    }
    :host([tone='success']) {
      --ae-avatar-bg: var(--ae-avatar-success-bg, var(--ae-color-success-subtle));
      --ae-avatar-fg: var(--ae-avatar-success-fg, var(--ae-color-success-emphasis));
    }
    :host([tone='warning']) {
      --ae-avatar-bg: var(--ae-avatar-warning-bg, var(--ae-color-warning-subtle));
      --ae-avatar-fg: var(--ae-avatar-warning-fg, var(--ae-color-warning-emphasis));
    }
    :host([tone='danger']) {
      --ae-avatar-bg: var(--ae-avatar-danger-bg, var(--ae-color-danger-subtle));
      --ae-avatar-fg: var(--ae-avatar-danger-fg, var(--ae-color-danger-emphasis));
    }
    :host([tone='info']) {
      --ae-avatar-bg: var(--ae-avatar-info-bg, var(--ae-color-info-subtle));
      --ae-avatar-fg: var(--ae-avatar-info-fg, var(--ae-color-info-emphasis));
    }

    /* Status dot */
    .status {
      position: absolute;
      right: 0;
      bottom: 0;
      width: calc(var(--ae-avatar-size) * 0.28);
      height: calc(var(--ae-avatar-size) * 0.28);
      min-width: 8px;
      min-height: 8px;
      border-radius: var(--ae-radius-full);
      background: var(--_status-bg);
      box-shadow: 0 0 0 2px var(--ae-color-bg);
    }
    :host([status='online'])  { --_status-bg: var(--ae-color-success); }
    :host([status='offline']) { --_status-bg: var(--ae-color-gray-400); }
    :host([status='busy'])    { --_status-bg: var(--ae-color-danger); }
    :host([status='away'])    { --_status-bg: var(--ae-color-warning); }
  `;
__decorateClass([
  n4({ type: String })
], AeAvatar.prototype, "src", 2);
__decorateClass([
  n4({ type: String })
], AeAvatar.prototype, "name", 2);
__decorateClass([
  n4({ type: String })
], AeAvatar.prototype, "initials", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAvatar.prototype, "size", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAvatar.prototype, "shape", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAvatar.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAvatar.prototype, "status", 2);
__decorateClass([
  r5()
], AeAvatar.prototype, "_imageFailed", 2);
AeAvatar = __decorateClass([
  t3("ae-avatar")
], AeAvatar);

// src/components/progress/ae-progress.ts
var AeProgress = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = null;
    this.max = 100;
    this.tone = "accent";
    this.size = "md";
    this.striped = false;
    this.label = "Loading";
    this.showLabel = false;
  }
  get _isIndeterminate() {
    return this.value === null || this.value === void 0 || Number.isNaN(this.value);
  }
  get _clampedValue() {
    const v2 = Math.max(0, Math.min(this.max, Number(this.value)));
    return Number.isFinite(v2) ? v2 : 0;
  }
  render() {
    const indeterminate = this._isIndeterminate;
    const value = indeterminate ? void 0 : this._clampedValue;
    const pct = indeterminate ? 0 : this._clampedValue / this.max * 100;
    return b2`
      ${this.showLabel ? b2`<span class="label">${this.label}</span>` : b2`<span class="label-hidden">${this.label}</span>`}
      <div
        class="track"
        part="track"
        role="progressbar"
        aria-label=${this.label}
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${value ?? A}
        aria-busy=${indeterminate ? "true" : "false"}
      >
        ${indeterminate ? b2`<div class="indeterminate" part="fill"></div>` : b2`<div
              class="fill"
              part="fill"
              style="width:${pct}%"
            ></div>`}
      </div>
    `;
  }
};
AeProgress.styles = i`
    /*
     * Theme-overridable tokens (--ae-progress-track, -fill, -radius,
     * -border) are NOT declared at :host — :host declarations would
     * shadow root-level theme overrides. Resolved at the consumption
     * point via var(--token, fallback). The per-tone selectors below
     * set a PRIVATE --_progress-tone-color the consumption rule chains
     * to, so theme-level fill overrides (e.g. Metro's stripe gradient)
     * win regardless of which tone attribute is set.
     */
    :host {
      --ae-progress-height: 0.5rem;
      display: block;
      width: 100%;
    }
    :host([size='sm']) { --ae-progress-height: 0.25rem; }
    :host([size='md']) { --ae-progress-height: 0.5rem; }
    :host([size='lg']) { --ae-progress-height: 0.875rem; }

    :host([tone='neutral']) { --_progress-tone-color: var(--ae-color-gray-600); }
    :host([tone='accent'])  { --_progress-tone-color: var(--ae-color-accent); }
    :host([tone='success']) { --_progress-tone-color: var(--ae-color-success); }
    :host([tone='warning']) { --_progress-tone-color: var(--ae-color-warning); }
    :host([tone='danger'])  { --_progress-tone-color: var(--ae-color-danger); }

    .label {
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg-muted);
      margin-bottom: var(--ae-space-1);
      display: block;
    }
    .label-hidden {
      ${visuallyHidden}
    }

    .track {
      position: relative;
      width: 100%;
      height: var(--ae-progress-height);
      background: var(--ae-progress-track, var(--ae-color-bg-muted));
      border: var(--ae-progress-border, none);
      border-radius: var(--ae-progress-radius, var(--ae-radius-full));
      overflow: hidden;
      box-sizing: border-box;
    }

    .fill {
      position: absolute;
      inset: 0 auto 0 0;
      background: var(--ae-progress-fill,
        var(--_progress-tone-color, var(--ae-color-accent)));
      border-radius: inherit;
      /* Bioluminescent accent — a brand (Crucible) can make the bar glow. */
      box-shadow: var(--ae-progress-glow, none);
      transition: width var(--ae-duration-normal) var(--ae-easing-ease-out);
    }

    :host([striped]) .fill {
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.18) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.18) 50%,
        rgba(255, 255, 255, 0.18) 75%,
        transparent 75%
      );
      background-size: 1rem 1rem;
      animation: ae-progress-stripe 1.2s linear infinite;
    }

    .indeterminate {
      position: absolute;
      inset: 0 auto 0 0;
      width: 35%;
      background: var(--ae-progress-fill,
        var(--_progress-tone-color, var(--ae-color-accent)));
      border-radius: inherit;
      box-shadow: var(--ae-progress-glow, none);
      animation: ae-progress-indeterminate 1.6s var(--ae-easing-ease-in-out) infinite;
    }

    @keyframes ae-progress-stripe {
      from { background-position: 0 0; }
      to   { background-position: 1rem 0; }
    }
    @keyframes ae-progress-indeterminate {
      0%   { left: -35%; }
      100% { left: 100%; }
    }

    /*
     * Reduced-motion: stop the sliding indeterminate bar and the animated
     * stripe. The indeterminate fill rests at its static 35% start position
     * (still a visible "busy" affordance); aria-busy conveys it to AT.
     * Hardcoded-duration keyframes bypass the global token reset, so guard here.
     */
    @media (prefers-reduced-motion: reduce) {
      :host([striped]) .fill,
      .indeterminate {
        animation: none;
      }
    }
  `;
__decorateClass([
  n4({ type: Number })
], AeProgress.prototype, "value", 2);
__decorateClass([
  n4({ type: Number })
], AeProgress.prototype, "max", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeProgress.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeProgress.prototype, "size", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeProgress.prototype, "striped", 2);
__decorateClass([
  n4({ type: String })
], AeProgress.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "show-label" })
], AeProgress.prototype, "showLabel", 2);
AeProgress = __decorateClass([
  t3("ae-progress")
], AeProgress);

// src/components/progress-circle/ae-progress-circle.ts
var AeProgressCircle = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = null;
    this.max = 100;
    this.tone = "accent";
    this.size = "md";
    this.thickness = null;
    this.label = "Loading";
  }
  get _isIndeterminate() {
    return this.value === null || this.value === void 0 || Number.isNaN(this.value);
  }
  get _clampedValue() {
    const v2 = Math.max(0, Math.min(this.max, Number(this.value)));
    return Number.isFinite(v2) ? v2 : 0;
  }
  get _thickness() {
    if (this.thickness != null && this.thickness > 0) return this.thickness;
    switch (this.size) {
      case "xs":
        return 2;
      case "sm":
        return 2.5;
      case "lg":
        return 4;
      case "xl":
        return 5;
      default:
        return 3;
    }
  }
  updated() {
    if (this._isIndeterminate) {
      this.setAttribute("data-indeterminate", "");
    } else {
      this.removeAttribute("data-indeterminate");
    }
  }
  render() {
    const indeterminate = this._isIndeterminate;
    const value = indeterminate ? void 0 : this._clampedValue;
    const r6 = 16 - this._thickness;
    const circumference = 2 * Math.PI * r6;
    const pct = indeterminate ? 0 : this._clampedValue / this.max;
    const offset = circumference - pct * circumference;
    return b2`
      <svg
        viewBox="0 0 32 32"
        role="progressbar"
        aria-label=${this.label}
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${value ?? A}
        aria-busy=${indeterminate ? "true" : "false"}
      >
        <circle
          part="track"
          class="track"
          cx="16"
          cy="16"
          r=${r6}
          stroke-width=${this._thickness}
        ></circle>
        <circle
          part="indicator"
          class="indicator"
          cx="16"
          cy="16"
          r=${r6}
          stroke-width=${this._thickness}
          stroke-dasharray=${indeterminate ? "80 200" : `${circumference} ${circumference}`}
          stroke-dashoffset=${indeterminate ? 0 : offset}
        ></circle>
      </svg>
    `;
  }
};
AeProgressCircle.styles = i`
    :host {
      --ae-progress-circle-size: 2.5rem;
      --ae-progress-circle-track: color-mix(in oklch, currentColor 15%, transparent);
      --ae-progress-circle-fill: var(--ae-color-accent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ae-progress-circle-size);
      height: var(--ae-progress-circle-size);
      color: var(--ae-color-fg-muted);
    }
    :host([size='xs']) { --ae-progress-circle-size: 1rem; }
    :host([size='sm']) { --ae-progress-circle-size: 1.5rem; }
    :host([size='md']) { --ae-progress-circle-size: 2.5rem; }
    :host([size='lg']) { --ae-progress-circle-size: 3.5rem; }
    :host([size='xl']) { --ae-progress-circle-size: 5rem; }

    :host([tone='neutral']) { --ae-progress-circle-fill: var(--ae-color-gray-600); }
    :host([tone='accent'])  { --ae-progress-circle-fill: var(--ae-color-accent); }
    :host([tone='success']) { --ae-progress-circle-fill: var(--ae-color-success); }
    :host([tone='warning']) { --ae-progress-circle-fill: var(--ae-color-warning); }
    :host([tone='danger'])  { --ae-progress-circle-fill: var(--ae-color-danger); }

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      display: block;
    }
    :host([data-indeterminate]) svg {
      animation: ae-pc-rotate 1.4s linear infinite;
    }

    circle {
      fill: none;
      stroke-linecap: round;
      transform-origin: center;
    }
    .track {
      stroke: var(--ae-progress-circle-track);
    }
    .indicator {
      stroke: var(--ae-progress-circle-fill);
      transition: stroke-dashoffset var(--ae-duration-normal) var(--ae-easing-ease-out);
    }
    :host([data-indeterminate]) .indicator {
      animation: ae-pc-dash 1.4s ease-in-out infinite;
    }

    @keyframes ae-pc-rotate {
      to { transform: rotate(360deg); }
    }
    @keyframes ae-pc-dash {
      0%   { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50%  { stroke-dasharray: 90, 200; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 200; stroke-dashoffset: -124; }
    }

    /*
     * Reduced-motion: replace the indeterminate spin with a static partial
     * arc (still reads as "in progress"); aria-busy conveys the state to AT.
     * Hardcoded-duration keyframes bypass the global token reset, so guard here.
     */
    @media (prefers-reduced-motion: reduce) {
      :host([data-indeterminate]) svg { animation: none; }
      :host([data-indeterminate]) .indicator {
        animation: none;
        stroke-dasharray: 25 200;
      }
    }
  `;
__decorateClass([
  n4({ type: Number })
], AeProgressCircle.prototype, "value", 2);
__decorateClass([
  n4({ type: Number })
], AeProgressCircle.prototype, "max", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeProgressCircle.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeProgressCircle.prototype, "size", 2);
__decorateClass([
  n4({ type: Number })
], AeProgressCircle.prototype, "thickness", 2);
__decorateClass([
  n4({ type: String })
], AeProgressCircle.prototype, "label", 2);
AeProgressCircle = __decorateClass([
  t3("ae-progress-circle")
], AeProgressCircle);

// src/components/skeleton/ae-skeleton.ts
var AeSkeleton = class extends i4 {
  constructor() {
    super(...arguments);
    this.variant = "rect";
    this.width = null;
    this.height = null;
    this.lines = 1;
    this.animation = "pulse";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("aria-hidden")) {
      this.setAttribute("aria-hidden", "true");
    }
  }
  render() {
    const styleFor = (i7, total) => {
      const parts = [];
      if (this.width && (this.variant !== "text" || i7 === total - 1 || total === 1)) {
        parts.push(`width:${this.width}`);
      }
      if (this.height) parts.push(`height:${this.height}`);
      return parts.join(";");
    };
    if (this.variant === "text" && this.lines > 1) {
      const lines = Math.max(1, Math.floor(this.lines));
      return b2`${Array.from({ length: lines }).map(
        (_2, i7) => b2`<span part="skeleton" class="shape" style=${styleFor(i7, lines)}></span>`
      )}`;
    }
    return b2`<span
      part="skeleton"
      class="shape"
      style=${styleFor(0, 1)}
    ></span>`;
  }
};
AeSkeleton.styles = i`
    :host {
      display: block;
    }

    /* Defaults live in the var() fallbacks (not declared at :host) so a brand
     * theme can override --ae-skeleton-bg / -border / -radius at :root without
     * being shadowed by a directly-matched :host declaration. Metro flips the
     * soft pulse block into a 2px-ink-framed ticket-tape stub. */
    .shape {
      background: var(--ae-skeleton-bg, var(--ae-color-bg-muted));
      border: var(--ae-skeleton-border, none);
      border-radius: var(--ae-skeleton-radius, var(--ae-radius-sm));
      display: block;
    }

    :host([variant='rect']) .shape {
      width: 100%;
      min-height: 1rem;
    }

    :host([variant='text']) .shape {
      height: 0.75em;
      border-radius: var(--ae-skeleton-radius, var(--ae-radius-xs));
    }
    :host([variant='text']) .shape + .shape {
      margin-top: var(--ae-space-2);
    }
    /* Last text line is shorter for realism */
    :host([variant='text']) .shape:last-child:not(:only-child) {
      width: 60%;
    }

    :host([variant='circle']) .shape {
      border-radius: var(--ae-radius-full);
      aspect-ratio: 1;
      width: 2.5rem;
    }

    :host([animation='pulse']) .shape {
      animation: ae-skeleton-pulse 1.6s var(--ae-easing-ease-in-out) infinite;
    }

    :host([animation='wave']) .shape {
      position: relative;
      overflow: hidden;
    }
    :host([animation='wave']) .shape::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        var(--ae-skeleton-highlight, var(--ae-color-bg-subtle)),
        transparent
      );
      transform: translateX(-100%);
      animation: ae-skeleton-wave 1.6s var(--ae-easing-ease-in-out) infinite;
    }

    @keyframes ae-skeleton-pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.55; }
    }
    @keyframes ae-skeleton-wave {
      to { transform: translateX(100%); }
    }

    /*
     * Reduced-motion: the shimmer/pulse is purely decorative — the static
     * placeholder shape still communicates loading. Hardcoded-duration
     * keyframes bypass the global token reset, so guard here.
     */
    @media (prefers-reduced-motion: reduce) {
      :host([animation='pulse']) .shape,
      :host([animation='wave']) .shape::after {
        animation: none;
      }
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSkeleton.prototype, "variant", 2);
__decorateClass([
  n4({ type: String })
], AeSkeleton.prototype, "width", 2);
__decorateClass([
  n4({ type: String })
], AeSkeleton.prototype, "height", 2);
__decorateClass([
  n4({ type: Number })
], AeSkeleton.prototype, "lines", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSkeleton.prototype, "animation", 2);
AeSkeleton = __decorateClass([
  t3("ae-skeleton")
], AeSkeleton);

// src/components/empty-state/ae-empty-state.ts
var AeEmptyState = class extends i4 {
  constructor() {
    super(...arguments);
    this.compact = false;
    this.live = false;
    this._hasIcon = false;
    this._hasTitle = false;
    this._hasActions = false;
    this._onSlotChange = (e8) => {
      const slot = e8.target;
      const hasContent = slot.assignedNodes({ flatten: true }).some((n6) => {
        if (n6.nodeType === Node.TEXT_NODE) return (n6.textContent ?? "").trim().length > 0;
        return true;
      });
      switch (slot.name) {
        case "icon":
          this._hasIcon = hasContent;
          break;
        case "title":
          this._hasTitle = hasContent;
          break;
        case "actions":
          this._hasActions = hasContent;
          break;
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._syncLiveRegion();
    const lightHas = (slotName) => {
      const node = this.querySelector(`:scope > [slot="${slotName}"]`);
      if (!node) return false;
      const txt = (node.textContent ?? "").trim();
      return txt.length > 0 || node.childElementCount > 0;
    };
    this._hasIcon = lightHas("icon");
    this._hasTitle = lightHas("title");
    this._hasActions = lightHas("actions");
  }
  updated(changed) {
    if (changed.has("live")) this._syncLiveRegion();
  }
  /**
   * An empty state is content, not a status message — so by default the host
   * carries no live-region role and is simply read in document order. When
   * `live` is set it becomes a polite live region so a dynamically-revealed
   * empty state ("No results for…") is announced. A consumer-supplied `role`
   * / `aria-live` is respected: we only manage the `status` / `polite` pair
   * we ourselves apply.
   */
  _syncLiveRegion() {
    if (this.live) {
      if (!this.hasAttribute("role")) this.setAttribute("role", "status");
      if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "polite");
    } else {
      if (this.getAttribute("role") === "status") this.removeAttribute("role");
      if (this.getAttribute("aria-live") === "polite") this.removeAttribute("aria-live");
    }
  }
  render() {
    return b2`
      <div part="container" class="container">
        <span part="icon" class="icon" ?hidden=${!this._hasIcon}>
          <slot name="icon" @slotchange=${this._onSlotChange}></slot>
        </span>
        <span part="title" class="title" ?hidden=${!this._hasTitle}>
          <slot name="title" @slotchange=${this._onSlotChange}></slot>
        </span>
        <div part="body" class="body">
          <slot></slot>
        </div>
        <div part="actions" class="actions" ?hidden=${!this._hasActions}>
          <slot name="actions" @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }
};
AeEmptyState.styles = i`
    :host {
      --ae-empty-state-padding: var(--ae-space-10) var(--ae-space-6);
      --ae-empty-state-gap: var(--ae-space-3);
      --ae-empty-state-color: var(--ae-color-fg-muted);
      display: block;
    }
    :host([compact]) {
      --ae-empty-state-padding: var(--ae-space-6) var(--ae-space-4);
      --ae-empty-state-gap: var(--ae-space-2);
    }

    /* The frame / icon-box / serif-body hooks default to "none" so the base
     * look is unchanged; Metro turns the container into the source EmptyState —
     * a 3px dashed ink frame on paper-2, a 56px ink-framed paper icon box, an
     * 800 title, and a serif-italic ink-3 body. All consumed via var() fallback
     * (never declared at :host) so the :root override lands. */
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: var(--ae-empty-state-gap);
      padding: var(--ae-empty-state-padding);
      color: var(--ae-empty-state-color);
      background: var(--ae-empty-state-bg, transparent);
      border: var(--ae-empty-state-border, none);
      border-radius: var(--ae-empty-state-radius, 0);
      font-family: var(--ae-empty-state-font-family, inherit);
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ae-empty-state-icon-size, auto);
      height: var(--ae-empty-state-icon-size, auto);
      background: var(--ae-empty-state-icon-bg, transparent);
      border: var(--ae-empty-state-icon-border, none);
      color: var(--ae-empty-state-icon-color, var(--ae-color-fg-subtle));
      font-size: var(--ae-empty-state-icon-font-size, var(--ae-font-size-3xl));
      font-weight: var(--ae-empty-state-icon-weight, inherit);
      line-height: 1;
    }
    :host([compact]) .icon {
      font-size: var(--ae-font-size-2xl);
    }

    .title {
      font-size: var(--ae-font-size-lg);
      font-weight: var(--ae-empty-state-title-weight, var(--ae-font-weight-semibold));
      letter-spacing: var(--ae-empty-state-title-tracking, normal);
      color: var(--ae-color-fg);
      line-height: var(--ae-line-height-snug);
    }
    :host([compact]) .title {
      font-size: var(--ae-font-size-md);
    }

    .body {
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-normal);
      max-width: 40ch;
      color: var(--ae-empty-state-body-color, inherit);
      font-family: var(--ae-empty-state-body-font-family, inherit);
      font-style: var(--ae-empty-state-body-style, normal);
    }

    .actions {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--ae-space-2);
      margin-top: var(--ae-space-2);
    }

    [hidden] { display: none; }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeEmptyState.prototype, "compact", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeEmptyState.prototype, "live", 2);
__decorateClass([
  r5()
], AeEmptyState.prototype, "_hasIcon", 2);
__decorateClass([
  r5()
], AeEmptyState.prototype, "_hasTitle", 2);
__decorateClass([
  r5()
], AeEmptyState.prototype, "_hasActions", 2);
AeEmptyState = __decorateClass([
  t3("ae-empty-state")
], AeEmptyState);

// src/components/accordion/ae-accordion.ts
var AeAccordion = class extends i4 {
  constructor() {
    super(...arguments);
    this.multiple = false;
    this._onToggle = (e8) => {
      const target = e8.target;
      if (!this.multiple && e8.detail.open) {
        for (const item of this.items) {
          if (item !== target && item.open) item.setOpen(false);
        }
      }
      this.dispatchEvent(
        new CustomEvent("ae-change", {
          bubbles: true,
          composed: true,
          detail: { open: this.items.filter((i7) => i7.open).map((i7) => i7.label) }
        })
      );
    };
    this._onKeyDown = (e8) => {
      const key = e8.key;
      if (key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") {
        return;
      }
      const items = this.items;
      const path = e8.composedPath();
      const current = items.find((it) => path.includes(it));
      if (!current) return;
      const enabled = items.filter((it) => !it.disabled);
      if (enabled.length === 0) return;
      const idx = enabled.indexOf(current);
      if (idx === -1) return;
      e8.preventDefault();
      let next;
      switch (key) {
        case "ArrowDown":
          next = enabled[(idx + 1) % enabled.length];
          break;
        case "ArrowUp":
          next = enabled[(idx - 1 + enabled.length) % enabled.length];
          break;
        case "Home":
          next = enabled[0];
          break;
        case "End":
          next = enabled[enabled.length - 1];
          break;
      }
      next?.focus();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("ae-accordion-toggle", this._onToggle);
    this.addEventListener("keydown", this._onKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("ae-accordion-toggle", this._onToggle);
    this.removeEventListener("keydown", this._onKeyDown);
  }
  /** The `ae-accordion-item` children in document order. */
  get items() {
    return Array.from(
      this.querySelectorAll("ae-accordion-item")
    );
  }
  render() {
    return b2`<div part="container" class="container"><slot></slot></div>`;
  }
};
AeAccordion.styles = i`
    :host {
      display: block;
    }
    .container {
      background: var(--ae-accordion-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-accordion-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-accordion-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-accordion-border, var(--ae-border-width-1) solid var(--ae-color-border));
      border-radius: var(--ae-accordion-radius, var(--ae-radius-md));
      overflow: hidden;
    }
  `;
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeAccordion.prototype, "multiple", 2);
AeAccordion = __decorateClass([
  t3("ae-accordion")
], AeAccordion);

// src/components/accordion/ae-accordion-item.ts
var _accordionItemId = 0;
var AeAccordionItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
    this.meta = "";
    this.open = false;
    this.disabled = false;
    this.headingLevel = 3;
    this._uid = `ae-accordion-${++_accordionItemId}`;
    this._onClick = () => {
      if (this.disabled) return;
      this.open = !this.open;
      this.dispatchEvent(
        new CustomEvent("ae-accordion-toggle", {
          bubbles: true,
          composed: true,
          detail: { open: this.open }
        })
      );
    };
  }
  get _buttonId() {
    return `${this._uid}-btn`;
  }
  get _panelId() {
    return `${this._uid}-panel`;
  }
  /** Toggle from the parent without re-dispatching the user event. */
  setOpen(open) {
    this.open = open;
  }
  /** Focus the disclosure button (used by the parent for arrow-key nav). */
  focus(options) {
    this.shadowRoot?.querySelector(".trigger")?.focus(options);
  }
  render() {
    return b2`
      <div part="header" class="heading" role="heading" aria-level=${this.headingLevel}>
        <button
          part="trigger"
          class="trigger"
          id=${this._buttonId}
          type="button"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this._panelId}
          aria-disabled=${this.disabled ? "true" : A}
          @click=${this._onClick}
        >
          <span class="lead">
            <slot name="icon">
              <svg part="icon" class="icon" viewBox="0 0 12 12" aria-hidden="true">
                <line x1="1" y1="6" x2="11" y2="6" />
                <line class="v" x1="6" y1="1" x2="6" y2="11" />
              </svg>
            </slot>
            <slot name="header">${this.label}</slot>
          </span>
          ${this.meta ? b2`<span class="meta">${this.meta}</span>` : A}
        </button>
      </div>
      <div
        part="panel"
        class="panel"
        id=${this._panelId}
        role="region"
        aria-labelledby=${this._buttonId}
        ?hidden=${!this.open}
      >
        <div part="body" class="body"><slot></slot></div>
      </div>
    `;
  }
};
AeAccordionItem.styles = i`
    :host {
      display: block;
      border-bottom: var(--ae-accordion-divider, var(--ae-border-width-1) solid var(--ae-color-border-subtle));
    }
    :host(:last-of-type) {
      border-bottom: var(--ae-accordion-divider-last, none);
    }

    .heading {
      margin: 0;
      font: inherit;
    }

    .trigger {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ae-space-3);
      padding: var(--ae-accordion-header-padding, var(--ae-space-3) var(--ae-space-4));
      background: var(--ae-accordion-header-bg, transparent);
      color: var(--ae-accordion-header-fg, var(--ae-color-fg));
      font-family: var(--ae-accordion-header-font-family, inherit);
      font-size: var(--ae-accordion-header-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-accordion-header-font-weight, var(--ae-font-weight-medium));
      letter-spacing: var(--ae-accordion-header-tracking, normal);
      text-transform: var(--ae-accordion-header-transform, none);
      line-height: var(--ae-line-height-snug);
      text-align: start;
      cursor: pointer;
      transition: background var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    :host([open]) .trigger {
      background: var(--ae-accordion-header-bg-open, var(--ae-color-bg-subtle));
    }
    .trigger:hover:not([aria-disabled='true']) {
      background: var(--ae-accordion-header-bg-hover, var(--ae-color-bg-subtle));
    }
    :host([open]) .trigger:hover:not([aria-disabled='true']) {
      background: var(--ae-accordion-header-bg-open, var(--ae-color-bg-subtle));
    }
    .trigger[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }
    .trigger:focus-visible {
      ${focusRing}
    }

    .lead {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-3);
      min-width: 0;
    }

    .icon {
      flex: 0 0 auto;
      width: 0.75rem;
      height: 0.75rem;
      color: var(--ae-accordion-icon-color, var(--ae-color-fg-muted));
    }
    .icon line {
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: square;
      transition: opacity var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    /* The vertical bar disappears when open: a plus that becomes a minus. */
    :host([open]) .icon .v {
      opacity: 0;
    }

    .meta {
      flex: 0 0 auto;
      font-size: var(--ae-font-size-xs);
      color: var(--ae-accordion-meta-color, var(--ae-color-fg-subtle));
    }

    .panel {
      overflow: hidden;
    }
    .panel[hidden] {
      display: none;
    }
    .body {
      padding: var(--ae-accordion-body-padding, var(--ae-space-3) var(--ae-space-4));
      font-family: var(--ae-accordion-body-font-family, inherit);
      font-style: var(--ae-accordion-body-font-style, normal);
      font-size: var(--ae-accordion-body-font-size, var(--ae-font-size-sm));
      line-height: var(--ae-line-height-normal);
      color: var(--ae-accordion-body-color, var(--ae-color-fg-muted));
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeAccordionItem.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAccordionItem.prototype, "meta", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeAccordionItem.prototype, "open", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeAccordionItem.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Number, attribute: "heading-level" })
], AeAccordionItem.prototype, "headingLevel", 2);
AeAccordionItem = __decorateClass([
  t3("ae-accordion-item")
], AeAccordionItem);

// src/components/timeline/ae-timeline.ts
var AeTimeline = class extends i4 {
  constructor() {
    super(...arguments);
    this.label = "";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "list");
  }
  updated(changed) {
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else this.removeAttribute("aria-label");
    }
  }
  render() {
    return b2`<div part="track" class="track"><slot></slot></div>`;
  }
};
AeTimeline.styles = i`
    :host {
      display: block;
    }
    .track {
      position: relative;
      padding-left: var(--ae-timeline-gutter, 1.75rem);
      font-family: var(--ae-timeline-font-family, inherit);
    }
    /* The continuous rail. Markers (in each item's shadow) overlay it; both
     * resolve --ae-timeline-rail-left / -rail-width / -gutter from the same
     * setter so they line up. */
    .track::before {
      content: '';
      position: absolute;
      left: var(--ae-timeline-rail-left, 0.5rem);
      top: var(--ae-timeline-rail-top, 0.4rem);
      bottom: var(--ae-timeline-rail-bottom, 0.4rem);
      width: var(--ae-timeline-rail-width, 2px);
      background: var(--ae-timeline-rail-color, var(--ae-color-border-strong));
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimeline.prototype, "label", 2);
AeTimeline = __decorateClass([
  t3("ae-timeline")
], AeTimeline);

// src/components/timeline/ae-timeline-item.ts
var AeTimelineItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.when = "";
    this.label = "";
    this.tone = "neutral";
    this.shape = "dot";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }
  render() {
    return b2`
      <span part="marker" class="marker" aria-hidden="true"></span>
      ${this.when ? b2`<div part="when" class="when">${this.when}</div>` : A}
      <div part="title" class="title"><slot name="title">${this.label}</slot></div>
      <div part="body" class="body"><slot></slot></div>
    `;
  }
};
AeTimelineItem.styles = i`
    :host {
      display: block;
      position: relative;
      padding-bottom: var(--ae-timeline-item-gap, var(--ae-space-4));
    }

    /* The marker is centered on the timeline rail. It references the SAME
     * gutter / rail-left / rail-width / marker-size tokens the container uses;
     * because the item is a light-DOM descendant of <ae-timeline> and the
     * container's rail is in <ae-timeline>'s shadow, both resolve the tokens
     * from the same setter (:root under Metro, or the element), staying in
     * sync without hard-coding offsets. */
    .marker {
      position: absolute;
      top: var(--ae-timeline-marker-top, 0.3rem);
      left: calc(
        var(--ae-timeline-rail-left, 0.5rem) + (var(--ae-timeline-rail-width, 2px) / 2) -
          var(--ae-timeline-gutter, 1.75rem) - (var(--ae-timeline-marker-size, 0.875rem) / 2)
      );
      width: var(--ae-timeline-marker-size, 0.875rem);
      height: var(--ae-timeline-marker-size, 0.875rem);
      box-sizing: border-box;
      background: var(--ae-timeline-marker-bg, var(--ae-color-border-strong));
      border: var(--ae-timeline-marker-border, var(--ae-border-width-2, 2px) solid var(--ae-color-bg));
      border-radius: var(--ae-timeline-marker-radius, 50%);
    }
    :host([shape='diamond']) .marker {
      border-radius: 0;
      transform: rotate(45deg);
    }

    /* Per-tone marker fill, routed through indirection so a brand can recolor
     * each tone at :root without out-specifying these :host([tone]) rules. */
    :host([tone='neutral']) {
      --ae-timeline-marker-bg: var(--ae-timeline-neutral-bg, var(--ae-color-border-strong));
    }
    :host([tone='accent']) {
      --ae-timeline-marker-bg: var(--ae-timeline-accent-bg, var(--ae-color-accent));
    }
    :host([tone='success']) {
      --ae-timeline-marker-bg: var(--ae-timeline-success-bg, var(--ae-color-success));
    }
    :host([tone='warning']) {
      --ae-timeline-marker-bg: var(--ae-timeline-warning-bg, var(--ae-color-warning));
    }
    :host([tone='danger']) {
      --ae-timeline-marker-bg: var(--ae-timeline-danger-bg, var(--ae-color-danger));
    }

    .when {
      font-family: var(--ae-timeline-when-font-family, inherit);
      font-size: var(--ae-timeline-when-font-size, var(--ae-font-size-xs));
      font-weight: var(--ae-timeline-when-font-weight, var(--ae-font-weight-semibold));
      letter-spacing: var(--ae-timeline-when-tracking, var(--ae-letter-spacing-wide));
      text-transform: var(--ae-timeline-when-transform, uppercase);
      color: var(--ae-timeline-when-color, var(--ae-color-fg-subtle));
      line-height: 1.2;
    }
    .when:empty {
      display: none;
    }

    .title {
      font-size: var(--ae-timeline-title-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-timeline-title-font-weight, var(--ae-font-weight-semibold));
      color: var(--ae-timeline-title-color, var(--ae-color-fg));
      line-height: var(--ae-line-height-snug);
      margin-top: 2px;
    }

    .body {
      font-family: var(--ae-timeline-body-font-family, inherit);
      font-style: var(--ae-timeline-body-font-style, normal);
      font-size: var(--ae-timeline-body-font-size, var(--ae-font-size-sm));
      color: var(--ae-timeline-body-color, var(--ae-color-fg-muted));
      line-height: var(--ae-line-height-normal);
      margin-top: var(--ae-space-1);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimelineItem.prototype, "when", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimelineItem.prototype, "label", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimelineItem.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeTimelineItem.prototype, "shape", 2);
AeTimelineItem = __decorateClass([
  t3("ae-timeline-item")
], AeTimelineItem);

// src/components/segmented/ae-segmented.ts
var AeSegmented = class extends i4 {
  constructor() {
    super();
    this.value = "";
    this.name = "";
    this.label = "";
    this.disabled = false;
    this._onSlotChange = () => {
      this._syncItems();
    };
    this._onSelect = (e8) => {
      if (this.disabled) return;
      this._commit(e8.detail.value, true);
    };
    this._onKeyDown = (e8) => {
      const key = e8.key;
      if (key !== "ArrowRight" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowUp" && key !== "Home" && key !== "End") {
        return;
      }
      if (this.disabled) return;
      const enabled = this.items.filter((it) => !it.disabled);
      if (enabled.length === 0) return;
      const currentIdx = Math.max(
        0,
        enabled.findIndex((it) => it.value === this.value)
      );
      e8.preventDefault();
      let next;
      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          next = enabled[(currentIdx + 1) % enabled.length];
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = enabled[(currentIdx - 1 + enabled.length) % enabled.length];
          break;
        case "Home":
          next = enabled[0];
          break;
        case "End":
          next = enabled[enabled.length - 1];
          break;
      }
      if (next) this._commit(next.value, true);
    };
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "radiogroup");
    this.addEventListener("ae-segmented-select", this._onSelect);
    this.addEventListener("keydown", this._onKeyDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("ae-segmented-select", this._onSelect);
    this.removeEventListener("keydown", this._onKeyDown);
  }
  updated(changed) {
    if (changed.has("label")) {
      if (this.label) this.setAttribute("aria-label", this.label);
      else this.removeAttribute("aria-label");
    }
    if (changed.has("value") || changed.has("disabled")) {
      this._syncItems();
      this._syncFormValue();
    }
  }
  /** The `ae-segmented-item` children in document order. */
  get items() {
    return Array.from(
      this.querySelectorAll("ae-segmented-item")
    );
  }
  /** Push the current selection + roving tabindex down to the items. */
  _syncItems() {
    const items = this.items;
    if (items.length === 0) return;
    const hasSelection = items.some((it) => it.value === this.value && !it.disabled);
    const firstEnabled = items.find((it) => !it.disabled);
    for (const item of items) {
      const selected = hasSelection && item.value === this.value && !item.disabled;
      item.selected = selected;
      const tabStop = hasSelection ? selected : item === firstEnabled;
      item.tabIndex = item.disabled ? -1 : tabStop ? 0 : -1;
    }
  }
  _syncFormValue() {
    if (typeof this._internals?.setFormValue !== "function") return;
    this._internals.setFormValue(this.value || null);
  }
  _commit(value, focusActive) {
    if (value === this.value) return;
    this.value = value;
    this._syncItems();
    this._syncFormValue();
    if (focusActive) {
      this.items.find((it) => it.value === value)?.focus();
    }
    this.dispatchEvent(
      new CustomEvent("ae-change", {
        bubbles: true,
        composed: true,
        detail: { value }
      })
    );
  }
  /** Form-associated reset support. */
  formResetCallback() {
    this.value = "";
    this._syncItems();
    this._syncFormValue();
  }
  render() {
    return b2`<div part="track" class="track">
      <slot @slotchange=${this._onSlotChange}></slot>
    </div>`;
  }
};
AeSegmented.formAssociated = true;
AeSegmented.styles = i`
    :host {
      display: inline-flex;
      font-family: var(--ae-segmented-font-family, var(--ae-font-family-sans));
    }
    .track {
      display: inline-flex;
      align-items: stretch;
      background: var(--ae-segmented-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-segmented-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-segmented-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-segmented-border, var(--ae-border-width-1) solid var(--ae-color-border));
      border-radius: var(--ae-segmented-radius, var(--ae-radius-md));
      padding: var(--ae-segmented-padding, 0);
      overflow: hidden;
    }
    :host([disabled]) .track {
      opacity: var(--ae-opacity-disabled, 0.55);
      pointer-events: none;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSegmented.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSegmented.prototype, "name", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSegmented.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSegmented.prototype, "disabled", 2);
AeSegmented = __decorateClass([
  t3("ae-segmented")
], AeSegmented);

// src/components/segmented/ae-segmented-item.ts
var AeSegmentedItem = class extends i4 {
  constructor() {
    super(...arguments);
    this.value = "";
    this.label = "";
    this.selected = false;
    this.disabled = false;
    this._onActivate = () => {
      this._requestSelect();
    };
    this._onKeyDown = (e8) => {
      if (e8.key === " " || e8.key === "Enter") {
        e8.preventDefault();
        this._requestSelect();
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "radio");
    this.addEventListener("click", this._onActivate);
    this.addEventListener("keydown", this._onKeyDown);
    this._syncAria();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this._onActivate);
    this.removeEventListener("keydown", this._onKeyDown);
  }
  updated() {
    this._syncAria();
  }
  _syncAria() {
    this.setAttribute("aria-checked", this.selected ? "true" : "false");
    if (this.disabled) this.setAttribute("aria-disabled", "true");
    else this.removeAttribute("aria-disabled");
  }
  _requestSelect() {
    if (this.disabled || this.selected) return;
    this.dispatchEvent(
      new CustomEvent("ae-segmented-select", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, item: this }
      })
    );
  }
  render() {
    return b2`<span part="cell" class="cell"><slot>${this.label}</slot></span>`;
  }
};
AeSegmentedItem.styles = i`
    :host {
      display: inline-flex;
      flex: var(--ae-segmented-item-flex, 0 0 auto);
      border-inline-end: var(--ae-segmented-item-divider, none);
      outline: none;
    }
    :host(:last-of-type) {
      border-inline-end: none;
    }
    :host([disabled]) {
      cursor: not-allowed;
    }

    .cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: var(--ae-segmented-item-padding, var(--ae-space-2) var(--ae-space-4));
      font-family: var(--ae-segmented-item-font-family, inherit);
      font-size: var(--ae-segmented-item-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-segmented-item-font-weight, var(--ae-font-weight-medium));
      letter-spacing: var(--ae-segmented-item-tracking, normal);
      text-transform: var(--ae-segmented-item-transform, none);
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      cursor: pointer;
      color: var(--ae-segmented-item-fg, var(--ae-color-fg));
      background: var(--ae-segmented-item-bg, transparent);
      border-radius: var(--ae-segmented-item-radius, var(--ae-radius-sm));
      transition:
        background var(--ae-duration-fast) var(--ae-easing-ease-out),
        color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .cell:hover {
      background: var(--ae-segmented-item-bg-hover, var(--ae-color-bg-subtle));
    }
    :host([selected]) .cell,
    :host([selected]) .cell:hover {
      background: var(--ae-segmented-item-bg-selected, var(--ae-color-accent));
      color: var(--ae-segmented-item-fg-selected, var(--ae-color-fg-on-accent));
    }
    :host([disabled]) .cell {
      cursor: not-allowed;
      opacity: var(--ae-opacity-disabled, 0.55);
    }
    :host(:focus-visible) .cell {
      ${focusRing}
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSegmentedItem.prototype, "value", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeSegmentedItem.prototype, "label", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSegmentedItem.prototype, "selected", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSegmentedItem.prototype, "disabled", 2);
AeSegmentedItem = __decorateClass([
  t3("ae-segmented-item")
], AeSegmentedItem);

// src/components/alert/ae-alert.ts
var AeAlert = class extends i4 {
  constructor() {
    super(...arguments);
    this.tone = "info";
    this.variant = "soft";
    this.dismissible = false;
    this.title = "";
    this._hasTitleSlot = false;
    this._hasActionsSlot = false;
    this._hasIconSlot = false;
    this._onTitleSlot = (e8) => {
      this._hasTitleSlot = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onActionsSlot = (e8) => {
      this._hasActionsSlot = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onIconSlot = (e8) => {
      this._hasIconSlot = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onDismiss = () => {
      this.dispatchEvent(
        new CustomEvent("ae-dismiss", { bubbles: true, composed: true })
      );
      this.remove();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      const role = this.tone === "danger" || this.tone === "warning" ? "alert" : "status";
      this.setAttribute("role", role);
    }
    this._hasTitleSlot = this.querySelector(':scope > [slot="title"]') !== null;
    this._hasActionsSlot = this.querySelector(':scope > [slot="actions"]') !== null;
    this._hasIconSlot = this.querySelector(':scope > [slot="icon"]') !== null;
  }
  updated(changed) {
    if (changed.has("tone") && !this.hasAttribute("data-role-locked")) {
      const role = this.tone === "danger" || this.tone === "warning" ? "alert" : "status";
      this.setAttribute("role", role);
    }
  }
  render() {
    const showTitleAttr = !this._hasTitleSlot && this.title;
    return b2`
      <div part="alert" class="alert">
        <span part="icon" class="icon-slot">
          <slot name="icon" @slotchange=${this._onIconSlot}>
            ${this._hasIconSlot ? A : this._defaultIcon()}
          </slot>
        </span>
        <div class="body-col">
          <div part="title" class="title" ?hidden=${!showTitleAttr && !this._hasTitleSlot}>
            <slot name="title" @slotchange=${this._onTitleSlot}>
              ${showTitleAttr ? this.title : A}
            </slot>
          </div>
          <div part="body" class="body">
            <slot></slot>
          </div>
          <div part="actions" class="actions" ?hidden=${!this._hasActionsSlot}>
            <slot name="actions" @slotchange=${this._onActionsSlot}></slot>
          </div>
        </div>
        ${this.dismissible ? b2`<button
              part="dismiss"
              class="dismiss"
              aria-label="Dismiss"
              @click=${this._onDismiss}
            >
              <svg viewBox="0 0 14 14" aria-hidden="true" width="12" height="12">
                <path
                  d="M3 3 L11 11 M11 3 L3 11"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>` : A}
      </div>
    `;
  }
  _defaultIcon() {
    switch (this.tone) {
      case "success":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4 10.5 L8 14.5 L16 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>`;
      case "warning":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 2 L18 17 L2 17 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linejoin="round"
          />
          <path d="M10 8 V12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
          <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
        </svg>`;
      case "danger":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.75" />
          <path d="M10 6 V11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
          <circle cx="10" cy="14" r="0.9" fill="currentColor" />
        </svg>`;
      case "neutral":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.75" />
        </svg>`;
      case "info":
      default:
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.75" />
          <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
          <path d="M10 9.5 V14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>`;
    }
  }
};
AeAlert.styles = i`
    :host {
      --ae-alert-bg: var(--ae-color-info-subtle);
      --ae-alert-fg: var(--ae-color-fg);
      --ae-alert-border: transparent;
      --ae-alert-accent: var(--ae-color-info);
      --ae-alert-radius: var(--ae-radius-md);
      --ae-alert-padding: var(--ae-space-3) var(--ae-space-4);

      display: block;
    }

    .alert {
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto;
      row-gap: var(--ae-alert-row-gap, var(--ae-space-1));
      column-gap: var(--ae-alert-col-gap, var(--ae-space-3));
      background: var(--ae-alert-bg);
      backdrop-filter: var(--ae-alert-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-alert-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-alert-fg);
      border: var(--ae-alert-border-width, var(--ae-border-width-1)) solid var(--ae-alert-border);
      border-radius: var(--ae-alert-radius);
      padding: var(--ae-alert-padding);
      font-family: var(--ae-alert-font-family, inherit);
      font-size: var(--ae-alert-font-size, var(--ae-font-size-sm));
      line-height: var(--ae-line-height-snug);
    }

    .icon-slot {
      grid-row: 1 / span 2;
      display: inline-flex;
      align-items: var(--ae-alert-icon-align, flex-start);
      justify-content: center;
      align-self: stretch;
      width: var(--ae-alert-icon-width, auto);
      min-width: var(--ae-alert-icon-width, auto);
      background: var(--ae-alert-icon-bg, transparent);
      color: var(--ae-alert-icon-color, var(--ae-alert-accent));
      border-inline-end: var(--ae-alert-icon-divider, none);
      padding-top: var(--ae-alert-icon-pad-top, 2px);
    }

    .icon-slot svg {
      width: var(--ae-alert-icon-size, 1.125rem);
      height: var(--ae-alert-icon-size, 1.125rem);
      display: block;
    }

    .body-col {
      grid-column: 2;
      display: flex;
      flex-direction: column;
      justify-content: var(--ae-alert-body-justify, flex-start);
      gap: var(--ae-space-1);
      min-width: 0;
      padding: var(--ae-alert-body-padding, 0);
    }

    .title {
      font-weight: var(--ae-alert-title-weight, var(--ae-font-weight-semibold));
      font-size: var(--ae-alert-title-size, var(--ae-font-size-sm));
      line-height: var(--ae-line-height-tight);
      letter-spacing: var(--ae-alert-title-tracking, normal);
      text-transform: var(--ae-alert-title-transform, none);
      color: var(--ae-alert-title-color, var(--ae-alert-fg));
    }

    .body {
      font-weight: var(--ae-alert-body-weight, inherit);
    }

    .actions {
      margin-top: var(--ae-space-2);
      display: flex;
      gap: var(--ae-space-2);
    }

    .dismiss {
      all: unset;
      grid-column: 3;
      grid-row: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      margin: var(--ae-alert-dismiss-margin, 0);
      border-radius: var(--ae-radius-sm);
      color: var(--ae-alert-fg);
      opacity: 0.7;
      transition: background var(--ae-duration-fast), opacity var(--ae-duration-fast);
    }
    .dismiss:hover {
      opacity: 1;
      background: var(--ae-color-hover-overlay);
    }
    .dismiss:focus-visible {
      ${focusRing}
    }

    /* Signal-box fill (Metro ticket Banner). The icon wrapper's background
     * defaults to transparent — just a tinted glyph — but routes through the
     * SAME per-tone accent indirection token the matrix uses, with a
     * transparent fallback. A brand that sets --ae-alert-<tone>-accent at :root
     * (Metro → ink / go / gold / stop) thereby fills the 56px box with the tone
     * color; absent that token the box stays transparent. This must live inside
     * the shadow tree (where the tone attr is visible) — a :root rule can't read
     * the shadow-internal --ae-alert-accent, it would compute to empty. */
    :host([tone='info'])    { --ae-alert-icon-bg: var(--ae-alert-info-accent, transparent); }
    :host([tone='success']) { --ae-alert-icon-bg: var(--ae-alert-success-accent, transparent); }
    :host([tone='warning']) { --ae-alert-icon-bg: var(--ae-alert-warning-accent, transparent); }
    :host([tone='danger'])  { --ae-alert-icon-bg: var(--ae-alert-danger-accent, transparent); }
    :host([tone='neutral']) { --ae-alert-icon-bg: var(--ae-alert-neutral-accent, transparent); }

    /* Tone × variant matrix.
     * Each visual property routes through a per-tone indirection token
     * (--ae-alert-<tone>-<bg|fg|border|accent>) whose fallback preserves the
     * original theme-default value. A brand theme that sets the indirection
     * token at :root overrides the matrix without having to out-specify these
     * :host([tone][variant]) declarations — the cascade-shadowing trap that
     * a plain :root override would hit. (See Metro's ticket-Banner block.) */
    :host([tone='info'][variant='soft']) {
      --ae-alert-bg: var(--ae-alert-info-bg, var(--ae-color-info-subtle));
      --ae-alert-fg: var(--ae-alert-info-fg, var(--ae-color-info-emphasis));
      --ae-alert-accent: var(--ae-alert-info-accent, var(--ae-color-info));
      --ae-alert-border: var(--ae-alert-info-border, transparent);
    }
    :host([tone='success'][variant='soft']) {
      --ae-alert-bg: var(--ae-alert-success-bg, var(--ae-color-success-subtle));
      --ae-alert-fg: var(--ae-alert-success-fg, var(--ae-color-success-emphasis));
      --ae-alert-accent: var(--ae-alert-success-accent, var(--ae-color-success));
      --ae-alert-border: var(--ae-alert-success-border, transparent);
    }
    :host([tone='warning'][variant='soft']) {
      --ae-alert-bg: var(--ae-alert-warning-bg, var(--ae-color-warning-subtle));
      --ae-alert-fg: var(--ae-alert-warning-fg, var(--ae-color-warning-emphasis));
      --ae-alert-accent: var(--ae-alert-warning-accent, var(--ae-color-warning));
      --ae-alert-border: var(--ae-alert-warning-border, transparent);
    }
    :host([tone='danger'][variant='soft']) {
      --ae-alert-bg: var(--ae-alert-danger-bg, var(--ae-color-danger-subtle));
      --ae-alert-fg: var(--ae-alert-danger-fg, var(--ae-color-danger-emphasis));
      --ae-alert-accent: var(--ae-alert-danger-accent, var(--ae-color-danger));
      --ae-alert-border: var(--ae-alert-danger-border, transparent);
    }
    :host([tone='neutral'][variant='soft']) {
      --ae-alert-bg: var(--ae-alert-neutral-bg, var(--ae-color-bg-muted));
      --ae-alert-fg: var(--ae-alert-neutral-fg, var(--ae-color-fg));
      --ae-alert-accent: var(--ae-alert-neutral-accent, var(--ae-color-fg-muted));
      --ae-alert-border: var(--ae-alert-neutral-border, transparent);
    }

    :host([variant='solid']) {
      --ae-alert-fg: var(--ae-color-fg-on-accent);
    }
    :host([tone='info'][variant='solid'])    { --ae-alert-bg: var(--ae-alert-info-bg, var(--ae-color-info));       --ae-alert-fg: var(--ae-alert-info-fg, var(--ae-color-fg-on-info));       --ae-alert-accent: var(--ae-alert-info-accent, var(--ae-color-fg-on-info));       --ae-alert-border: var(--ae-alert-info-border, transparent); }
    :host([tone='success'][variant='solid']) { --ae-alert-bg: var(--ae-alert-success-bg, var(--ae-color-success)); --ae-alert-fg: var(--ae-alert-success-fg, var(--ae-color-fg-on-success)); --ae-alert-accent: var(--ae-alert-success-accent, var(--ae-color-fg-on-success)); --ae-alert-border: var(--ae-alert-success-border, transparent); }
    :host([tone='warning'][variant='solid']) { --ae-alert-bg: var(--ae-alert-warning-bg, var(--ae-color-warning)); --ae-alert-fg: var(--ae-alert-warning-fg, var(--ae-color-fg-on-warning)); --ae-alert-accent: var(--ae-alert-warning-accent, var(--ae-color-fg-on-warning)); --ae-alert-border: var(--ae-alert-warning-border, transparent); }
    :host([tone='danger'][variant='solid'])  { --ae-alert-bg: var(--ae-alert-danger-bg, var(--ae-color-danger));   --ae-alert-fg: var(--ae-alert-danger-fg, var(--ae-color-fg-on-danger));   --ae-alert-accent: var(--ae-alert-danger-accent, var(--ae-color-fg-on-danger));   --ae-alert-border: var(--ae-alert-danger-border, transparent); }
    :host([tone='neutral'][variant='solid']) { --ae-alert-bg: var(--ae-alert-neutral-bg, var(--ae-color-gray-800)); --ae-alert-fg: var(--ae-alert-neutral-fg, var(--ae-color-gray-0)); --ae-alert-accent: var(--ae-alert-neutral-accent, var(--ae-color-gray-0)); --ae-alert-border: var(--ae-alert-neutral-border, transparent); }

    :host([variant='outline']) {
      --ae-alert-bg: transparent;
    }
    :host([tone='info'][variant='outline'])    { --ae-alert-bg: var(--ae-alert-info-bg, transparent);    --ae-alert-border: var(--ae-alert-info-border, var(--ae-color-info));       --ae-alert-fg: var(--ae-alert-info-fg, var(--ae-color-info-emphasis));       --ae-alert-accent: var(--ae-alert-info-accent, var(--ae-color-info)); }
    :host([tone='success'][variant='outline']) { --ae-alert-bg: var(--ae-alert-success-bg, transparent); --ae-alert-border: var(--ae-alert-success-border, var(--ae-color-success)); --ae-alert-fg: var(--ae-alert-success-fg, var(--ae-color-success-emphasis)); --ae-alert-accent: var(--ae-alert-success-accent, var(--ae-color-success)); }
    :host([tone='warning'][variant='outline']) { --ae-alert-bg: var(--ae-alert-warning-bg, transparent); --ae-alert-border: var(--ae-alert-warning-border, var(--ae-color-warning)); --ae-alert-fg: var(--ae-alert-warning-fg, var(--ae-color-warning-emphasis)); --ae-alert-accent: var(--ae-alert-warning-accent, var(--ae-color-warning)); }
    :host([tone='danger'][variant='outline'])  { --ae-alert-bg: var(--ae-alert-danger-bg, transparent);  --ae-alert-border: var(--ae-alert-danger-border, var(--ae-color-danger));   --ae-alert-fg: var(--ae-alert-danger-fg, var(--ae-color-danger-emphasis));   --ae-alert-accent: var(--ae-alert-danger-accent, var(--ae-color-danger)); }
    :host([tone='neutral'][variant='outline']) { --ae-alert-bg: var(--ae-alert-neutral-bg, transparent); --ae-alert-border: var(--ae-alert-neutral-border, var(--ae-color-border-strong)); --ae-alert-fg: var(--ae-alert-neutral-fg, var(--ae-color-fg)); --ae-alert-accent: var(--ae-alert-neutral-accent, var(--ae-color-fg-muted)); }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeAlert.prototype, "tone", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeAlert.prototype, "variant", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeAlert.prototype, "dismissible", 2);
__decorateClass([
  n4({ type: String })
], AeAlert.prototype, "title", 2);
AeAlert = __decorateClass([
  t3("ae-alert")
], AeAlert);

// src/components/banner/ae-banner.ts
var AeBanner = class extends i4 {
  constructor() {
    super(...arguments);
    this.tone = "info";
    this.dismissible = false;
    this.sticky = false;
    this._hasIcon = false;
    this._hasActions = false;
    this._onIconSlot = (e8) => {
      this._hasIcon = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onActionsSlot = (e8) => {
      this._hasActions = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onDismiss = () => {
      this.dispatchEvent(
        new CustomEvent("ae-dismiss", { bubbles: true, composed: true })
      );
      this.remove();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "region");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", this._defaultLabelForTone());
    }
    this._hasIcon = this.querySelector(':scope > [slot="icon"]') !== null;
    this._hasActions = this.querySelector(':scope > [slot="actions"]') !== null;
  }
  updated(changed) {
    if (changed.has("tone")) {
      const current = this.getAttribute("aria-label");
      const defaults = /* @__PURE__ */ new Set([
        "Information",
        "Success",
        "Warning",
        "Danger",
        "Announcement",
        "Notice"
      ]);
      if (current && defaults.has(current)) {
        this.setAttribute("aria-label", this._defaultLabelForTone());
      }
    }
  }
  _defaultLabelForTone() {
    switch (this.tone) {
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "danger":
        return "Danger";
      case "accent":
        return "Announcement";
      case "neutral":
        return "Notice";
      case "info":
      default:
        return "Information";
    }
  }
  render() {
    return b2`
      <div part="banner" class="banner">
        <span part="icon" class="icon" ?hidden=${!this._hasIcon}>
          <slot name="icon" @slotchange=${this._onIconSlot}></slot>
        </span>
        <span part="body" class="body">
          <slot></slot>
        </span>
        <span part="actions" class="actions" ?hidden=${!this._hasActions}>
          <slot name="actions" @slotchange=${this._onActionsSlot}></slot>
        </span>
        ${this.dismissible ? b2`<button
              part="dismiss"
              class="dismiss"
              aria-label="Dismiss"
              @click=${this._onDismiss}
            >
              <svg viewBox="0 0 14 14" aria-hidden="true" width="12" height="12">
                <path
                  d="M3 3 L11 11 M11 3 L3 11"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>` : A}
      </div>
    `;
  }
};
AeBanner.styles = i`
    :host {
      --ae-banner-bg: var(--ae-color-info);
      --ae-banner-fg: var(--ae-color-fg-on-accent);
      --ae-banner-border: transparent;
      --ae-banner-padding: var(--ae-space-2) var(--ae-space-4);
      display: block;
      width: 100%;
    }

    :host([sticky]) {
      position: sticky;
      top: 0;
      z-index: var(--ae-z-sticky);
    }

    .banner {
      display: flex;
      align-items: center;
      gap: var(--ae-space-3);
      background: var(--ae-banner-bg);
      backdrop-filter: var(--ae-banner-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-banner-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-banner-fg);
      border-bottom: var(--ae-banner-border-width, var(--ae-border-width-1)) solid
        var(--ae-banner-border);
      padding: var(--ae-banner-padding);
      font-family: var(--ae-banner-font-family, inherit);
      font-size: var(--ae-banner-font-size, var(--ae-font-size-sm));
      font-weight: var(--ae-banner-font-weight, inherit);
      letter-spacing: var(--ae-banner-tracking, normal);
      text-transform: var(--ae-banner-transform, none);
      line-height: var(--ae-line-height-snug);
      min-height: 2.5rem;
    }

    .icon {
      display: inline-flex;
      align-items: center;
    }
    .icon[hidden] { display: none; }

    .body {
      flex: 1 1 auto;
      min-width: 0;
    }

    .actions {
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-2);
    }
    .actions[hidden] { display: none; }

    .dismiss {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--ae-radius-sm);
      color: inherit;
      opacity: 0.8;
      transition: background var(--ae-duration-fast), opacity var(--ae-duration-fast);
    }
    .dismiss:hover {
      opacity: 1;
      background: var(--ae-color-hover-overlay);
    }
    .dismiss:focus-visible {
      ${focusRing}
    }

    /* Tones. Each ground routes through a per-tone indirection token whose
     * fallback preserves the default; a brand recolors a tone by SETTING the
     * token at :root (Metro flips these to a transit service-advisory: signal
     * grounds + paper/ink text + a hard ink bottom rule) without having to
     * out-specify these :host([tone]) rules. */
    :host([tone='info'])    { --ae-banner-bg: var(--ae-banner-info-bg, var(--ae-color-info));    --ae-banner-fg: var(--ae-banner-info-fg, var(--ae-color-fg-on-info));    --ae-banner-border: var(--ae-banner-info-border, transparent); }
    :host([tone='success']) { --ae-banner-bg: var(--ae-banner-success-bg, var(--ae-color-success)); --ae-banner-fg: var(--ae-banner-success-fg, var(--ae-color-fg-on-success)); --ae-banner-border: var(--ae-banner-success-border, transparent); }
    :host([tone='warning']) { --ae-banner-bg: var(--ae-banner-warning-bg, var(--ae-color-warning)); --ae-banner-fg: var(--ae-banner-warning-fg, var(--ae-color-fg-on-warning)); --ae-banner-border: var(--ae-banner-warning-border, transparent); }
    :host([tone='danger'])  { --ae-banner-bg: var(--ae-banner-danger-bg, var(--ae-color-danger));  --ae-banner-fg: var(--ae-banner-danger-fg, var(--ae-color-fg-on-danger));  --ae-banner-border: var(--ae-banner-danger-border, transparent); }
    :host([tone='accent'])  { --ae-banner-bg: var(--ae-banner-accent-bg, var(--ae-color-accent));  --ae-banner-fg: var(--ae-banner-accent-fg, var(--ae-color-fg-on-accent));  --ae-banner-border: var(--ae-banner-accent-border, transparent); }
    :host([tone='neutral']) {
      --ae-banner-bg: var(--ae-banner-neutral-bg, var(--ae-color-bg-subtle));
      --ae-banner-fg: var(--ae-banner-neutral-fg, var(--ae-color-fg));
      --ae-banner-border: var(--ae-banner-neutral-border, var(--ae-color-border));
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeBanner.prototype, "tone", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeBanner.prototype, "dismissible", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeBanner.prototype, "sticky", 2);
AeBanner = __decorateClass([
  t3("ae-banner")
], AeBanner);

// src/components/callout/ae-callout.ts
var AeCallout = class extends i4 {
  constructor() {
    super(...arguments);
    this.tone = "info";
    this.title = "";
    this._hasTitleSlot = false;
    this._hasIconSlot = false;
    this._onTitleSlot = (e8) => {
      this._hasTitleSlot = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
    this._onIconSlot = (e8) => {
      this._hasIconSlot = e8.target.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "note");
    }
  }
  render() {
    const showTitle = this._hasTitleSlot || !!this.title;
    return b2`
      <div part="callout" class="callout">
        <span part="icon" class="icon">
          <slot name="icon" @slotchange=${this._onIconSlot}>
            ${this._hasIconSlot ? A : this._defaultIcon()}
          </slot>
        </span>
        <div part="title" class="title" ?hidden=${!showTitle}>
          <slot name="title" @slotchange=${this._onTitleSlot}>
            ${this._hasTitleSlot ? A : this.title}
          </slot>
        </div>
        <div part="body" class="body" style=${showTitle ? "" : "grid-row: 1;"}>
          <slot></slot>
        </div>
      </div>
    `;
  }
  _defaultIcon() {
    switch (this.tone) {
      case "success":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 10.5 L8 14.5 L16 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`;
      case "warning":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2 L18 17 L2 17 Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
          <path d="M10 8 V12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
          <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
        </svg>`;
      case "danger":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.75" />
          <path d="M7 7 L13 13 M13 7 L7 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>`;
      case "neutral":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.75" />
          <path d="M6 8 H14 M6 11 H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>`;
      case "accent":
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 2 L12.5 7.5 L18 8.2 L14 12 L15 17.5 L10 14.8 L5 17.5 L6 12 L2 8.2 L7.5 7.5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>`;
      case "info":
      default:
        return b2`<svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.75" />
          <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
          <path d="M10 9.5 V14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        </svg>`;
    }
  }
};
AeCallout.styles = i`
    :host {
      --ae-callout-bg: var(--ae-color-info-subtle);
      --ae-callout-fg: var(--ae-color-fg);
      --ae-callout-accent: var(--ae-color-info-emphasis);
      --ae-callout-radius: var(--ae-radius-md);
      --ae-callout-padding: var(--ae-space-3) var(--ae-space-4);

      display: block;
    }

    .callout {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--ae-space-1) var(--ae-space-3);
      background: var(--ae-callout-bg);
      backdrop-filter: var(--ae-callout-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-callout-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-callout-fg);
      border-left: 3px solid var(--ae-callout-accent);
      border-radius: var(--ae-callout-radius);
      padding: var(--ae-callout-padding);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-normal);
    }

    .icon {
      grid-row: 1 / span 2;
      display: inline-flex;
      align-items: flex-start;
      color: var(--ae-callout-accent);
      padding-top: 2px;
    }
    .icon svg {
      width: 1.125rem;
      height: 1.125rem;
      display: block;
    }

    .title {
      font-weight: var(--ae-font-weight-semibold);
      color: var(--ae-callout-accent);
      line-height: var(--ae-line-height-tight);
    }
    .title[hidden] { display: none; }

    .body ::slotted(:first-child) { margin-top: 0; }
    .body ::slotted(:last-child) { margin-bottom: 0; }

    /* Tones */
    :host([tone='info']) {
      --ae-callout-bg: var(--ae-color-info-subtle);
      --ae-callout-accent: var(--ae-color-info-emphasis);
    }
    :host([tone='success']) {
      --ae-callout-bg: var(--ae-color-success-subtle);
      --ae-callout-accent: var(--ae-color-success-emphasis);
    }
    :host([tone='warning']) {
      --ae-callout-bg: var(--ae-color-warning-subtle);
      --ae-callout-accent: var(--ae-color-warning-emphasis);
    }
    :host([tone='danger']) {
      --ae-callout-bg: var(--ae-color-danger-subtle);
      --ae-callout-accent: var(--ae-color-danger-emphasis);
    }
    :host([tone='neutral']) {
      --ae-callout-bg: var(--ae-color-bg-subtle);
      --ae-callout-accent: var(--ae-color-fg-muted);
    }
    :host([tone='accent']) {
      --ae-callout-bg: var(--ae-color-accent-subtle);
      --ae-callout-accent: var(--ae-color-accent-emphasis);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeCallout.prototype, "tone", 2);
__decorateClass([
  n4({ type: String })
], AeCallout.prototype, "title", 2);
AeCallout = __decorateClass([
  t3("ae-callout")
], AeCallout);

// src/components/_shared/highlighter.ts
var currentHighlighter = null;
function setHighlighter(fn) {
  currentHighlighter = fn;
}
function getHighlighter() {
  return currentHighlighter;
}
function highlight(code, language) {
  if (!currentHighlighter || !language) return escapeHtml(code);
  try {
    const out = currentHighlighter(code, language);
    return typeof out === "string" ? out : escapeHtml(code);
  } catch {
    return escapeHtml(code);
  }
}
function escapeHtml(s4) {
  return s4.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/components/code-block/ae-code-block.ts
var AeCodeBlock = class extends i4 {
  constructor() {
    super(...arguments);
    this.language = "";
    this.code = "";
    this.copyable = false;
    this.lineNumbers = false;
    this.wrap = false;
    this.filename = "";
    this._copied = false;
    this._onCopy = async () => {
      const text = stripLeadingTrailingNewline(this._resolveCode());
      const ok = await this._writeClipboard(text);
      if (ok) {
        this._copied = true;
        this.dispatchEvent(
          new CustomEvent("ae-copy", {
            bubbles: true,
            composed: true,
            detail: { text }
          })
        );
        setTimeout(() => {
          this._copied = false;
        }, 1500);
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.code) {
      queueMicrotask(() => this.requestUpdate());
    }
  }
  _resolveCode() {
    if (this.code) return this.code;
    const slotEl = this._defaultSlot;
    if (slotEl) {
      const nodes = slotEl.assignedNodes({ flatten: true });
      if (nodes.length > 0) {
        return nodes.map((n6) => n6.nodeType === Node.TEXT_NODE ? n6.textContent ?? "" : n6.textContent ?? "").join("");
      }
    }
    return this.textContent ?? "";
  }
  render() {
    const raw = stripLeadingTrailingNewline(this._resolveCode());
    const lines = raw.length === 0 ? [""] : raw.split(/\r?\n/);
    const hasHighlighter = !!getHighlighter() && !!this.language;
    const renderedLines = lines.map(
      (line) => hasHighlighter ? highlight(line, this.language) : escapeHtml(line)
    );
    const header = this.filename || this.copyable ? b2`
          <div part="header" class="header">
            <span part="filename" class="filename">${this.filename || A}</span>
            ${this.copyable ? b2`<button
                  part="copy"
                  class="copy"
                  type="button"
                  aria-label="Copy code"
                  @click=${this._onCopy}
                >
                  ${this._copied ? b2`<svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg> Copied` : b2`<svg viewBox="0 0 16 16" aria-hidden="true">
                        <rect x="5" y="3" width="8" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5" />
                        <path d="M3 11 V4 a1 1 0 0 1 1 -1 H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg> Copy`}
                </button>` : A}
          </div>
        ` : A;
    const body = this.lineNumbers ? b2`
          <div class="with-gutter">
            <div part="gutter" class="gutter" aria-hidden="true">
              ${lines.map((_2, i7) => b2`<span class="ln">${i7 + 1}</span>`)}
            </div>
            <pre part="pre"><code part="code" class=${this.language ? `language-${this.language}` : ""}>${o7(renderedLines.join("\n"))}</code></pre>
          </div>
        ` : b2`
          <pre part="pre"><code part="code" class=${this.language ? `language-${this.language}` : ""}>${o7(renderedLines.join("\n"))}</code></pre>
        `;
    return b2`
      <div part="container" class="container">
        ${header} ${body}
      </div>
      <!-- Polite live region: announces the copy result to screen readers,
           since the button's label swap alone isn't reliably announced (4.1.3). -->
      <span class="sr-status" role="status" aria-live="polite"
        >${this._copied ? "Copied to clipboard" : ""}</span
      >
      <span class="source-slot" hidden>
        <slot class="code-source" @slotchange=${() => this.requestUpdate()}></slot>
      </span>
    `;
  }
  async _writeClipboard(text) {
    const nav = navigator;
    if (nav.clipboard?.writeText) {
      try {
        await nav.clipboard.writeText(text);
        return true;
      } catch {
      }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
AeCodeBlock.styles = i`
    /*
     * Theme-overridable tokens NOT declared at :host — resolved at
     * consumption point. Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      --ae-code-block-font-size: var(--ae-font-size-sm);
      --ae-code-block-line-height: var(--ae-line-height-snug);

      display: block;
    }

    .container {
      background: var(--ae-code-block-bg, var(--ae-color-gray-900));
      /* Frosted-glass hook — inert unless a theme sets
       * --ae-surface-backdrop-filter and a translucent --ae-code-block-bg
       * (Crucible). The blur softens the atmosphere behind the code surface. */
      backdrop-filter: var(--ae-code-block-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-code-block-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-code-block-fg, var(--ae-color-gray-100));
      border:
        var(--ae-code-block-border,
          var(--ae-border-width-1) solid var(--ae-color-border));
      border-radius: var(--ae-code-block-radius, var(--ae-radius-lg));
      overflow: hidden;
      font-family: var(--ae-font-family-mono);
      font-size: var(--ae-code-block-font-size);
      line-height: var(--ae-code-block-line-height);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ae-space-3);
      padding: var(--ae-space-2) var(--ae-space-3);
      background: var(--ae-code-block-header-bg, var(--ae-color-gray-800));
      /* gray-100 (not gray-300): the small letter-spaced filename + copy label
         need 4.5:1 on the dark header — gray-300 lands ~4.1 in some packs. */
      color: var(--ae-code-block-header-fg, var(--ae-color-gray-100));
      border-bottom:
        var(--ae-code-block-header-border,
          var(--ae-border-width-1) solid var(--ae-color-gray-700));
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-xs);
      letter-spacing:
        var(--ae-code-block-header-tracking, normal);
      text-transform: var(--ae-code-block-header-transform, none);
    }

    .filename {
      font-weight: var(--ae-font-weight-medium);
      letter-spacing: var(--ae-letter-spacing-wide);
    }

    .copy {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--ae-space-1);
      padding: var(--ae-space-1) var(--ae-space-2);
      border-radius: var(--ae-radius-sm);
      color: inherit;
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-xs);
      transition: background var(--ae-duration-fast);
    }
    .copy:hover { background: var(--ae-color-gray-700); }
    .copy:focus-visible { ${focusRing} }
    .copy svg { width: 12px; height: 12px; }

    pre {
      margin: 0;
      padding: var(--ae-space-3) var(--ae-space-4);
      overflow-x: auto;
      tab-size: 2;
      white-space: pre;
    }
    :host([wrap]) pre {
      white-space: pre-wrap;
      overflow-x: hidden;
      word-break: break-word;
    }

    code {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      display: block;
    }

    .with-gutter {
      display: grid;
      grid-template-columns: auto 1fr;
    }
    .gutter {
      user-select: none;
      text-align: right;
      padding: var(--ae-space-3) var(--ae-space-3) var(--ae-space-3) var(--ae-space-4);
      color: var(--ae-code-block-gutter-fg);
      border-right: var(--ae-border-width-1) solid var(--ae-color-gray-700);
      background: oklch(0% 0 0 / 0.15);
      font-variant-numeric: tabular-nums;
    }
    .gutter .ln {
      display: block;
    }
    .with-gutter pre {
      padding-left: var(--ae-space-3);
    }

    /* Hide the original slot — its content is mirrored into the rendered pre/code. */
    .source-slot { display: none; }

    .sr-status {
      ${visuallyHidden}
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeCodeBlock.prototype, "language", 2);
__decorateClass([
  n4({ type: String })
], AeCodeBlock.prototype, "code", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCodeBlock.prototype, "copyable", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "line-numbers" })
], AeCodeBlock.prototype, "lineNumbers", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeCodeBlock.prototype, "wrap", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeCodeBlock.prototype, "filename", 2);
__decorateClass([
  r5()
], AeCodeBlock.prototype, "_copied", 2);
__decorateClass([
  e5("slot.code-source")
], AeCodeBlock.prototype, "_defaultSlot", 2);
AeCodeBlock = __decorateClass([
  t3("ae-code-block")
], AeCodeBlock);
function stripLeadingTrailingNewline(s4) {
  return s4.replace(/^\r?\n/, "").replace(/\r?\n[ \t]*$/, "");
}

// src/components/diff-viewer/diff.ts
function diffLines(oldText, newText) {
  const a4 = splitLines(oldText);
  const b3 = splitLines(newText);
  const m2 = a4.length;
  const n6 = b3.length;
  const dp = Array.from(
    { length: m2 + 1 },
    () => new Array(n6 + 1).fill(0)
  );
  for (let i8 = 1; i8 <= m2; i8++) {
    for (let j2 = 1; j2 <= n6; j2++) {
      const ai = a4[i8 - 1];
      const bj = b3[j2 - 1];
      if (ai === bj) {
        dp[i8][j2] = dp[i8 - 1][j2 - 1] + 1;
      } else {
        const up = dp[i8 - 1][j2];
        const left = dp[i8][j2 - 1];
        dp[i8][j2] = up >= left ? up : left;
      }
    }
  }
  const ops = [];
  let i7 = m2;
  let j = n6;
  while (i7 > 0 || j > 0) {
    if (i7 > 0 && j > 0 && a4[i7 - 1] === b3[j - 1]) {
      ops.push({ kind: "equal", text: a4[i7 - 1], oldLine: i7, newLine: j });
      i7--;
      j--;
    } else if (j > 0 && (i7 === 0 || dp[i7][j - 1] >= dp[i7 - 1][j])) {
      ops.push({ kind: "add", text: b3[j - 1], newLine: j });
      j--;
    } else {
      ops.push({ kind: "remove", text: a4[i7 - 1], oldLine: i7 });
      i7--;
    }
  }
  ops.reverse();
  return ops;
}
function diffWords(oldText, newText) {
  const a4 = tokenize(oldText);
  const b3 = tokenize(newText);
  const m2 = a4.length;
  const n6 = b3.length;
  const dp = Array.from(
    { length: m2 + 1 },
    () => new Array(n6 + 1).fill(0)
  );
  for (let i8 = 1; i8 <= m2; i8++) {
    for (let j2 = 1; j2 <= n6; j2++) {
      if (a4[i8 - 1] === b3[j2 - 1]) {
        dp[i8][j2] = dp[i8 - 1][j2 - 1] + 1;
      } else {
        const up = dp[i8 - 1][j2];
        const left = dp[i8][j2 - 1];
        dp[i8][j2] = up >= left ? up : left;
      }
    }
  }
  const ops = [];
  let i7 = m2;
  let j = n6;
  while (i7 > 0 || j > 0) {
    if (i7 > 0 && j > 0 && a4[i7 - 1] === b3[j - 1]) {
      ops.push({ kind: "equal", text: a4[i7 - 1] });
      i7--;
      j--;
    } else if (j > 0 && (i7 === 0 || dp[i7][j - 1] >= dp[i7 - 1][j])) {
      ops.push({ kind: "add", text: b3[j - 1] });
      j--;
    } else {
      ops.push({ kind: "remove", text: a4[i7 - 1] });
      i7--;
    }
  }
  ops.reverse();
  return ops;
}
function splitLines(s4) {
  if (s4 === "") return [];
  const stripped = s4.endsWith("\n") ? s4.slice(0, -1) : s4;
  return stripped.split(/\r?\n/);
}
function tokenize(s4) {
  const out = [];
  const re = /(\s+|\w+|[^\s\w]+)/g;
  let m2;
  while ((m2 = re.exec(s4)) !== null) out.push(m2[0]);
  return out;
}

// src/components/diff-viewer/ae-diff-viewer.ts
var AeDiffViewer = class extends i4 {
  constructor() {
    super(...arguments);
    this.mode = "unified";
    this.language = "";
    this.oldText = "";
    this.newText = "";
    this.contextLines = 3;
    this.wordDiff = false;
    this.oldLabel = "";
    this.newLabel = "";
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "region");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", "Diff");
    }
  }
  render() {
    const ops = diffLines(this.oldText, this.newText);
    const collapsed = collapseContext(ops, Math.max(0, this.contextLines));
    if (this.mode === "split") {
      return this._renderSplit(collapsed);
    }
    return this._renderUnified(collapsed);
  }
  _renderUnified(segments) {
    const rows = [];
    for (const seg of segments) {
      if (seg.kind === "gap") {
        rows.push(b2`<div part="gap" class="gap">…</div>`);
        continue;
      }
      const wordOverlay = this.wordDiff ? buildWordOverlay(seg.ops) : null;
      seg.ops.forEach((op, i7) => {
        const sign = op.kind === "add" ? "+" : op.kind === "remove" ? "-" : " ";
        const rowClass = op.kind === "add" ? "row-add" : op.kind === "remove" ? "row-remove" : "";
        const inner = wordOverlay?.[i7] ?? this._renderLineContent(op.text);
        rows.push(b2`
          <div part="line-num" class="num">${op.oldLine ?? ""}</div>
          <div part="line-num" class="num">${op.newLine ?? ""}</div>
          <div part="content" class="content ${rowClass}" data-sign=${sign}>${inner}</div>
        `);
      });
    }
    return b2`<div part="container" class="container">
      <div class="unified">${rows}</div>
    </div>`;
  }
  _renderSplit(segments) {
    const rows = [];
    const header = this.oldLabel || this.newLabel ? b2`<div class="header"><span>${this.oldLabel}</span><span>${this.newLabel}</span></div>` : b2``;
    for (const seg of segments) {
      if (seg.kind === "gap") {
        rows.push(b2`<div part="gap" class="gap">…</div>`);
        continue;
      }
      const pairs = pairForSplit(seg.ops);
      const wordOverlays = this.wordDiff ? buildPairedWordOverlay(pairs) : null;
      pairs.forEach((pair, idx) => {
        const overlay = wordOverlays?.[idx];
        const leftInner = pair.left ? overlay?.left ?? this._renderLineContent(pair.left.text) : b2``;
        const rightInner = pair.right ? overlay?.right ?? this._renderLineContent(pair.right.text) : b2``;
        const leftClass = !pair.left ? "row-empty" : pair.left.kind === "remove" ? "row-remove" : "";
        const rightClass = !pair.right ? "row-empty" : pair.right.kind === "add" ? "row-add" : "";
        const leftSign = pair.left?.kind === "remove" ? "-" : " ";
        const rightSign = pair.right?.kind === "add" ? "+" : " ";
        rows.push(b2`
          <div part="line-num" class="num ${leftClass}">${pair.left?.oldLine ?? ""}</div>
          <div part="content" class="content ${leftClass}" data-sign=${leftSign}>${leftInner}</div>
          <div part="line-num" class="num ${rightClass}">${pair.right?.newLine ?? ""}</div>
          <div part="content" class="content ${rightClass}" data-sign=${rightSign}>${rightInner}</div>
        `);
      });
    }
    return b2`<div part="container" class="container">
      ${header}
      <div class="split">${rows}</div>
    </div>`;
  }
  _renderLineContent(line) {
    if (getHighlighter() && this.language) {
      return o7(highlight(line, this.language));
    }
    return line;
  }
};
AeDiffViewer.styles = i`
    :host {
      /* --ae-diff-bg is intentionally NOT declared at :host: a :host
       * declaration shadows root-level theme overrides via the cascade
       * (directly-applied rules beat inheritance), which would stop a theme
       * from making the diff surface translucent. Crucible sets a translucent
       * --ae-diff-bg at :root so the diff frosts; it flows in via inheritance.
       * Consumed below as var(--ae-diff-bg, var(--ae-color-bg)). */
      --ae-diff-fg: var(--ae-color-fg);
      /* Theme-aware LOW-ALPHA tints over the diff background: the band stays
         close to the surface color in every theme, so the inherited
         --ae-diff-fg (theme fg) keeps its normal text contrast (WCAG 1.4.3).
         A stronger-but-still-modest tint marks word-level changes. Deriving
         from success/danger keeps the green/red semantics across all packs. */
      --ae-diff-add-bg: color-mix(in oklch, var(--ae-color-success) 14%, var(--ae-diff-bg, var(--ae-color-bg)));
      --ae-diff-add-word-bg: color-mix(in oklch, var(--ae-color-success) 26%, var(--ae-diff-bg, var(--ae-color-bg)));
      --ae-diff-remove-bg: color-mix(in oklch, var(--ae-color-danger) 14%, var(--ae-diff-bg, var(--ae-color-bg)));
      --ae-diff-remove-word-bg: color-mix(in oklch, var(--ae-color-danger) 26%, var(--ae-diff-bg, var(--ae-color-bg)));
      --ae-diff-gutter-fg: var(--ae-color-fg-subtle);
      --ae-diff-radius: var(--ae-radius-lg);

      display: block;
    }

    .container {
      background: var(--ae-diff-bg, var(--ae-color-bg));
      backdrop-filter: var(--ae-diff-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-diff-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      color: var(--ae-diff-fg);
      border: var(--ae-border-width-1) solid var(--ae-color-border);
      border-radius: var(--ae-diff-radius);
      overflow: hidden;
      font-family: var(--ae-font-family-mono);
      font-size: var(--ae-font-size-sm);
      line-height: var(--ae-line-height-snug);
    }

    .header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--ae-color-bg-subtle);
      border-bottom: var(--ae-border-width-1) solid var(--ae-color-border);
      font-family: var(--ae-font-family-sans);
      font-size: var(--ae-font-size-xs);
      font-weight: var(--ae-font-weight-semibold);
      color: var(--ae-color-fg-muted);
    }
    .header span {
      padding: var(--ae-space-2) var(--ae-space-3);
    }
    .header span + span {
      border-left: var(--ae-border-width-1) solid var(--ae-color-border);
    }

    /* Unified mode: 3-column grid (old-line, new-line, content). */
    .unified {
      display: grid;
      grid-template-columns: auto auto 1fr;
    }
    .split {
      display: grid;
      grid-template-columns: auto 1fr auto 1fr;
    }

    .num {
      user-select: none;
      text-align: right;
      padding: 0 var(--ae-space-2);
      color: var(--ae-diff-gutter-fg);
      background: var(--ae-color-bg-subtle);
      border-right: var(--ae-border-width-1) solid var(--ae-color-border);
      font-variant-numeric: tabular-nums;
      min-width: 2.25rem;
    }
    .split .num + .content + .num {
      border-left: var(--ae-border-width-1) solid var(--ae-color-border);
    }

    .content {
      padding: 0 var(--ae-space-3);
      white-space: pre;
      overflow-x: hidden;
    }
    .content::before {
      content: attr(data-sign);
      display: inline-block;
      width: 1ch;
      color: var(--ae-color-fg-subtle);
      user-select: none;
    }

    .row-add .content { background: var(--ae-diff-add-bg); }
    .row-add .num    { background: var(--ae-diff-add-bg); color: var(--ae-color-success-emphasis); }
    .row-remove .content { background: var(--ae-diff-remove-bg); }
    .row-remove .num    { background: var(--ae-diff-remove-bg); color: var(--ae-color-danger-emphasis); }
    .row-empty .content { background: var(--ae-color-bg-subtle); }
    .row-empty .num    { background: var(--ae-color-bg-subtle); }

    .word-add { background: var(--ae-diff-add-word-bg); border-radius: 2px; }
    .word-remove { background: var(--ae-diff-remove-word-bg); border-radius: 2px; }

    .gap {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--ae-space-1) 0;
      color: var(--ae-color-fg-subtle);
      background: var(--ae-color-bg-subtle);
      font-size: var(--ae-font-size-xs);
      border-block: var(--ae-border-width-1) solid var(--ae-color-border-subtle);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeDiffViewer.prototype, "mode", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeDiffViewer.prototype, "language", 2);
__decorateClass([
  n4({ type: String, attribute: "old-text" })
], AeDiffViewer.prototype, "oldText", 2);
__decorateClass([
  n4({ type: String, attribute: "new-text" })
], AeDiffViewer.prototype, "newText", 2);
__decorateClass([
  n4({ type: Number, attribute: "context-lines", reflect: true })
], AeDiffViewer.prototype, "contextLines", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true, attribute: "word-diff" })
], AeDiffViewer.prototype, "wordDiff", 2);
__decorateClass([
  n4({ type: String, attribute: "old-label" })
], AeDiffViewer.prototype, "oldLabel", 2);
__decorateClass([
  n4({ type: String, attribute: "new-label" })
], AeDiffViewer.prototype, "newLabel", 2);
AeDiffViewer = __decorateClass([
  t3("ae-diff-viewer")
], AeDiffViewer);
function collapseContext(ops, context) {
  if (ops.length === 0) return [];
  const keep = new Array(ops.length).fill(false);
  for (let i7 = 0; i7 < ops.length; i7++) {
    if (ops[i7].kind !== "equal") {
      for (let k2 = Math.max(0, i7 - context); k2 <= Math.min(ops.length - 1, i7 + context); k2++) {
        keep[k2] = true;
      }
    }
  }
  if (!keep.some(Boolean)) {
    return [{ kind: "ops", ops }];
  }
  const segments = [];
  let current = [];
  let inGap = false;
  let leadingGapEmitted = false;
  let anyKept = false;
  for (let i7 = 0; i7 < ops.length; i7++) {
    const op = ops[i7];
    const shouldKeep = op.kind !== "equal" || keep[i7];
    if (shouldKeep) {
      anyKept = true;
      if (inGap) {
        segments.push({ kind: "gap", ops: [] });
        inGap = false;
      } else if (!leadingGapEmitted && !anyKept) {
      }
      current.push(op);
    } else {
      if (current.length > 0) {
        segments.push({ kind: "ops", ops: current });
        current = [];
      }
      if (!anyKept && !leadingGapEmitted) {
        segments.push({ kind: "gap", ops: [] });
        leadingGapEmitted = true;
        inGap = false;
      } else {
        inGap = true;
      }
    }
  }
  if (current.length > 0) segments.push({ kind: "ops", ops: current });
  if (inGap) {
    segments.push({ kind: "gap", ops: [] });
  }
  return segments;
}
function pairForSplit(ops) {
  const out = [];
  let i7 = 0;
  while (i7 < ops.length) {
    const op = ops[i7];
    if (op.kind === "equal") {
      out.push({ left: op, right: op });
      i7++;
      continue;
    }
    const removes = [];
    const adds = [];
    while (i7 < ops.length && (ops[i7].kind === "remove" || ops[i7].kind === "add")) {
      if (ops[i7].kind === "remove") removes.push(ops[i7]);
      else adds.push(ops[i7]);
      i7++;
    }
    const n6 = Math.max(removes.length, adds.length);
    for (let j = 0; j < n6; j++) {
      out.push({ left: removes[j], right: adds[j] });
    }
  }
  return out;
}
function buildWordOverlay(ops) {
  const out = new Array(ops.length).fill(null);
  for (let i7 = 0; i7 < ops.length; i7++) {
    if (ops[i7].kind === "remove" && ops[i7 + 1]?.kind === "add") {
      const wd = diffWords(ops[i7].text, ops[i7 + 1].text);
      out[i7] = renderWords(wd, "remove");
      out[i7 + 1] = renderWords(wd, "add");
      i7++;
    }
  }
  return out;
}
function buildPairedWordOverlay(pairs) {
  return pairs.map((p3) => {
    if (p3.left?.kind === "remove" && p3.right?.kind === "add") {
      const wd = diffWords(p3.left.text, p3.right.text);
      return {
        left: renderWords(wd, "remove"),
        right: renderWords(wd, "add")
      };
    }
    return null;
  });
}
function renderWords(ops, side) {
  const filtered = ops.filter((op) => op.kind === "equal" || op.kind === side);
  const pieces = filtered.map((op) => {
    const safe = escapeHtml(op.text);
    if (op.kind === "equal") return safe;
    return `<span class="word-${side}">${safe}</span>`;
  });
  return b2`${o7(pieces.join(""))}`;
}

// src/components/kbd/ae-kbd.ts
var AeKbd = class extends i4 {
  render() {
    return b2`<kbd part="kbd"><slot></slot></kbd>`;
  }
};
AeKbd.styles = i`
    /* Defaults live in the var() fallbacks (not declared at :host) so a brand
     * theme can override the cap surface/border/shadow at :root without being
     * shadowed by a directly-matched :host declaration. Metro flips the
     * pseudo-keycap into a flat 2px-ink-framed paper-2 chip (no shadow). */
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    kbd {
      display: inline-block;
      font-family: var(--ae-font-family-mono);
      font-size: var(--ae-kbd-font-size, 0.8125em);
      line-height: 1;
      font-weight: var(--ae-kbd-font-weight, var(--ae-font-weight-medium));
      letter-spacing: var(--ae-kbd-tracking, normal);
      color: var(--ae-kbd-fg, var(--ae-color-fg));
      background: var(--ae-kbd-bg, var(--ae-color-bg-elevated));
      backdrop-filter: var(--ae-kbd-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      -webkit-backdrop-filter: var(--ae-kbd-backdrop-filter, var(--ae-surface-backdrop-filter, none));
      border: var(--ae-border-width-1) solid var(--ae-kbd-border, var(--ae-color-border-strong));
      border-radius: var(--ae-kbd-radius, var(--ae-radius-sm));
      padding: var(--ae-kbd-padding, 0.15em 0.45em 0.2em);
      box-shadow: var(--ae-kbd-shadow,
        inset 0 -1px 0 0 var(--ae-color-border-strong),
        0 1px 0 0 var(--ae-color-border-strong));
      min-width: 1.5em;
      text-align: center;
      white-space: nowrap;
    }
  `;
AeKbd = __decorateClass([
  t3("ae-kbd")
], AeKbd);

// src/components/prose/ae-prose.ts
var AeProse = class extends i4 {
  constructor() {
    super(...arguments);
    this.size = "md";
  }
  render() {
    return b2`<div part="prose" class="prose"><slot></slot></div>`;
  }
};
AeProse.styles = i`
    :host {
      --ae-prose-fg: var(--ae-color-fg);
      --ae-prose-muted: var(--ae-color-fg-muted);
      --ae-prose-link: var(--ae-color-accent-emphasis);
      --ae-prose-rule: var(--ae-color-border);
      --ae-prose-code-bg: var(--ae-color-bg-muted);
      --ae-prose-pre-bg: var(--ae-color-gray-900);
      --ae-prose-base-size: var(--ae-font-size-md);
      --ae-prose-line-height: var(--ae-line-height-relaxed);
      --ae-prose-spacing: var(--ae-space-4);

      display: block;
      color: var(--ae-prose-fg);
      font-size: var(--ae-prose-base-size);
      line-height: var(--ae-prose-line-height);
    }

    :host([size='sm']) { --ae-prose-base-size: var(--ae-font-size-sm); --ae-prose-spacing: var(--ae-space-3); }
    :host([size='md']) { --ae-prose-base-size: var(--ae-font-size-md); --ae-prose-spacing: var(--ae-space-4); }
    :host([size='lg']) { --ae-prose-base-size: var(--ae-font-size-lg); --ae-prose-spacing: var(--ae-space-5); }

    .prose {
      display: block;
      max-width: 65ch;
    }

    /* Top-level slotted element styling. Note that ::slotted() only
       matches direct children of the slot — nested elements are NOT
       styled here on purpose. */
    ::slotted(:first-child) { margin-top: 0; }
    ::slotted(:last-child) { margin-bottom: 0; }

    ::slotted(p) {
      margin: 0 0 var(--ae-prose-spacing) 0;
    }
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
      font-weight: var(--ae-font-weight-semibold);
      line-height: var(--ae-line-height-tight);
      letter-spacing: var(--ae-letter-spacing-tight);
      color: var(--ae-prose-fg);
      margin: calc(var(--ae-prose-spacing) * 1.5) 0 var(--ae-space-2) 0;
    }
    ::slotted(h1) { font-size: 2em; }
    ::slotted(h2) { font-size: 1.5em; padding-bottom: var(--ae-space-2); border-bottom: var(--ae-border-width-1) solid var(--ae-prose-rule); }
    ::slotted(h3) { font-size: 1.25em; }
    ::slotted(h4) { font-size: 1.1em; }
    ::slotted(h5) { font-size: 1em; }
    ::slotted(h6) { font-size: 0.875em; color: var(--ae-prose-muted); text-transform: uppercase; letter-spacing: var(--ae-letter-spacing-wide); }

    ::slotted(ul),
    ::slotted(ol) {
      margin: 0 0 var(--ae-prose-spacing) 0;
      padding-left: 1.5em;
    }
    ::slotted(li) {
      margin: var(--ae-space-1) 0;
    }

    ::slotted(blockquote) {
      margin: 0 0 var(--ae-prose-spacing) 0;
      padding: var(--ae-space-1) var(--ae-space-4);
      border-left: 3px solid var(--ae-prose-rule);
      color: var(--ae-prose-muted);
      font-style: italic;
    }

    ::slotted(hr) {
      border: 0;
      border-top: var(--ae-border-width-1) solid var(--ae-prose-rule);
      margin: calc(var(--ae-prose-spacing) * 1.5) 0;
    }

    ::slotted(code) {
      font-family: var(--ae-font-family-mono);
      font-size: 0.9em;
      background: var(--ae-prose-code-bg);
      padding: 1px 5px;
      border-radius: var(--ae-radius-xs);
    }

    ::slotted(pre) {
      margin: 0 0 var(--ae-prose-spacing) 0;
      padding: var(--ae-space-3) var(--ae-space-4);
      background: var(--ae-prose-pre-bg);
      color: var(--ae-color-gray-100);
      border-radius: var(--ae-radius-md);
      overflow-x: auto;
      font-family: var(--ae-font-family-mono);
      font-size: 0.875em;
      line-height: var(--ae-line-height-snug);
    }

    ::slotted(a) {
      color: var(--ae-prose-link);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    ::slotted(a:hover) {
      text-decoration-thickness: 2px;
    }

    ::slotted(img),
    ::slotted(figure),
    ::slotted(picture) {
      max-width: 100%;
      margin: 0 0 var(--ae-prose-spacing) 0;
    }

    ::slotted(figcaption) {
      font-size: 0.875em;
      color: var(--ae-prose-muted);
      margin-top: var(--ae-space-1);
    }

    ::slotted(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 var(--ae-prose-spacing) 0;
      font-size: 0.95em;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeProse.prototype, "size", 2);
AeProse = __decorateClass([
  t3("ae-prose")
], AeProse);

// node_modules/lit-html/static.js
var a3 = Symbol.for("");
var o8 = (t5) => {
  if (t5?.r === a3) return t5?._$litStatic$;
};
var i6 = (t5, ...r6) => ({ _$litStatic$: r6.reduce((r7, e8, a4) => r7 + ((t6) => {
  if (void 0 !== t6._$litStatic$) return t6._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${t6}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(e8) + t5[a4 + 1], t5[0]), r: a3 });
var l3 = /* @__PURE__ */ new Map();
var n5 = (t5) => (r6, ...e8) => {
  const a4 = e8.length;
  let s4, i7;
  const n6 = [], u4 = [];
  let c5, $3 = 0, f3 = false;
  for (; $3 < a4; ) {
    for (c5 = r6[$3]; $3 < a4 && void 0 !== (i7 = e8[$3], s4 = o8(i7)); ) c5 += s4 + r6[++$3], f3 = true;
    $3 !== a4 && u4.push(i7), n6.push(c5), $3++;
  }
  if ($3 === a4 && n6.push(r6[a4]), f3) {
    const t6 = n6.join("$$lit$$");
    void 0 === (r6 = l3.get(t6)) && (n6.raw = n6, l3.set(t6, r6 = n6)), e8 = u4;
  }
  return t5(r6, ...e8);
};
var u3 = n5(b2);
var c4 = n5(w);
var $2 = n5(T);

// src/components/page-header/ae-page-header.ts
var HEADING_TAGS = {
  1: i6`h1`,
  2: i6`h2`,
  3: i6`h3`,
  4: i6`h4`,
  5: i6`h5`,
  6: i6`h6`
};
var AePageHeader = class extends i4 {
  constructor() {
    super(...arguments);
    this.eyebrow = "";
    this.heading = "";
    this.subtitle = "";
    this.badge = "";
    this.level = 2;
    // Dynamic slot changes (content added/removed after mount) re-trigger render,
    // which re-reads occupancy from the light DOM.
    this._onSlotChange = () => this.requestUpdate();
  }
  render() {
    const Tag = HEADING_TAGS[this.level] ?? HEADING_TAGS[2];
    const hasNamed = (name) => Array.from(this.children).some((c5) => c5.getAttribute("slot") === name);
    const hasIcon = hasNamed("icon");
    const hasBack = hasNamed("back");
    const hasActions = Array.from(this.childNodes).some(
      (n6) => n6.nodeType === Node.ELEMENT_NODE ? !n6.getAttribute("slot") : !!n6.textContent?.trim()
    );
    const showEyebrow = !!this.eyebrow || hasIcon;
    const showStatus = !!this.badge || hasBack;
    return u3`
      <header part="header" class="header">
        <div class="left">
          <div part="eyebrow" class="eyebrow" ?hidden=${!showEyebrow}>
            <span class="eyebrow-icon" ?hidden=${!hasIcon}>
              <slot name="icon" @slotchange=${this._onSlotChange}></slot>
            </span>
            ${this.eyebrow ? b2`<span>${this.eyebrow}</span>` : A}
          </div>
          <${Tag} part="heading" class="heading">${this.heading}</${Tag}>
          ${this.subtitle ? b2`<p part="subtitle" class="subtitle">${this.subtitle}</p>` : A}
        </div>
        <div class="right">
          <div class="status" ?hidden=${!showStatus}>
            ${this.badge ? b2`<span part="badge" class="badge">${this.badge}</span>` : A}
            <span class="back" ?hidden=${!hasBack}>
              <slot name="back" @slotchange=${this._onSlotChange}></slot>
            </span>
          </div>
          <div part="actions" class="actions" ?hidden=${!hasActions}>
            <slot @slotchange=${this._onSlotChange}></slot>
          </div>
        </div>
      </header>
    `;
  }
};
AePageHeader.styles = i`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--ae-space-4);
      border-bottom: var(--ae-page-header-rule-width, var(--ae-border-width-1)) solid
        var(--ae-page-header-rule-color, var(--ae-color-border-subtle));
      padding-bottom: var(--ae-page-header-padding-bottom, var(--ae-space-5));
    }

    .left {
      display: flex;
      flex-direction: column;
      gap: var(--ae-space-1);
      min-width: 0;
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: var(--ae-space-2);
      font-family: var(--ae-page-header-eyebrow-font-family, inherit);
      font-size: var(--ae-font-size-xs);
      font-weight: var(--ae-font-weight-bold);
      text-transform: var(--ae-page-header-eyebrow-transform, uppercase);
      letter-spacing: var(--ae-page-header-eyebrow-tracking, 0.1em);
      color: var(--ae-page-header-eyebrow-color, var(--ae-color-fg-muted));
    }
    .eyebrow[hidden] {
      display: none;
    }
    .eyebrow-icon {
      display: inline-flex;
      flex: 0 0 auto;
    }
    .eyebrow-icon[hidden] {
      display: none;
    }
    .eyebrow-icon ::slotted(*) {
      display: block;
      width: 0.75rem;
      height: 0.75rem;
    }

    .heading {
      margin: 0;
      font-family: var(--ae-page-header-heading-font-family, var(--ae-font-family-display));
      font-size: var(--ae-page-header-heading-font-size, var(--ae-font-size-2xl));
      font-weight: var(--ae-font-weight-bold);
      letter-spacing: var(--ae-page-header-heading-tracking, -0.025em);
      line-height: var(--ae-line-height-tight);
      color: var(--ae-color-fg);
    }

    .subtitle {
      margin: 0;
      font-size: var(--ae-font-size-sm);
      color: var(--ae-color-fg-muted);
    }

    .right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--ae-space-3);
      flex: 0 0 auto;
    }

    .status {
      display: flex;
      align-items: center;
      gap: var(--ae-space-3);
    }
    .status[hidden] {
      display: none;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--ae-space-3);
    }
    .actions[hidden] {
      display: none;
    }

    .badge {
      font-family: var(--ae-page-header-badge-font-family, var(--ae-font-family-mono));
      font-size: var(--ae-font-size-xs);
      font-weight: var(--ae-font-weight-bold);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      white-space: nowrap;
      color: var(--ae-page-header-badge-fg, var(--ae-color-fg-muted));
      background: var(--ae-page-header-badge-bg, var(--ae-color-bg-subtle));
      border: var(--ae-border-width-1) solid
        var(--ae-page-header-badge-border, var(--ae-color-border-subtle));
      border-radius: var(--ae-page-header-badge-radius, var(--ae-radius-sm));
      padding: var(--ae-space-1) var(--ae-space-2);
    }

    /* Stack on narrow viewports — the status/actions column drops below the
       title block and the rule is dropped (it reads as clutter when stacked). */
    @media (max-width: 767px) {
      .header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--ae-space-2);
        padding-bottom: 0;
        border-bottom: none;
      }
      .right {
        align-items: flex-start;
      }
    }
  `;
__decorateClass([
  n4()
], AePageHeader.prototype, "eyebrow", 2);
__decorateClass([
  n4()
], AePageHeader.prototype, "heading", 2);
__decorateClass([
  n4()
], AePageHeader.prototype, "subtitle", 2);
__decorateClass([
  n4()
], AePageHeader.prototype, "badge", 2);
__decorateClass([
  n4({ type: Number })
], AePageHeader.prototype, "level", 2);
AePageHeader = __decorateClass([
  t3("ae-page-header")
], AePageHeader);

// src/components/grid/ae-grid.ts
var AeGrid = class extends i4 {
  constructor() {
    super(...arguments);
    this.columns = 1;
    this.rows = null;
    this.gap = "md";
    this.align = "";
    this.justify = "";
    this.inline = false;
  }
  willUpdate() {
    this.style.setProperty(
      "--ae-grid-columns",
      AeGrid.tracks(this.columns)
    );
    if (this.rows == null || this.rows === "") {
      this.style.removeProperty("--ae-grid-rows");
      this.style.removeProperty("grid-template-rows");
    } else {
      const value = AeGrid.tracks(this.rows);
      this.style.setProperty("--ae-grid-rows", value);
      this.style.setProperty("grid-template-rows", value);
    }
    if (typeof this.gap === "string" && !AeGrid._gapTokens.has(this.gap)) {
      this.style.setProperty("--ae-grid-gap", this.gap);
    } else {
      this.style.removeProperty("--ae-grid-gap");
    }
  }
  /**
   * Coerce a `columns`/`rows` value to a CSS track list. Numbers become
   * `repeat(N, 1fr)`; numeric strings are coerced the same way; everything
   * else passes through unchanged.
   */
  static tracks(value) {
    if (value == null || value === "") return "none";
    if (typeof value === "number") {
      const n6 = Math.max(1, Math.trunc(value));
      return `repeat(${n6}, minmax(0, 1fr))`;
    }
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n6 = Math.max(1, Number(trimmed));
      return `repeat(${n6}, minmax(0, 1fr))`;
    }
    return trimmed;
  }
  render() {
    return b2`<slot></slot>`;
  }
};
AeGrid.styles = i`
    :host {
      display: grid;
      box-sizing: border-box;
      min-width: 0;
      grid-template-columns: var(--ae-grid-columns, 1fr);
      gap: var(--ae-grid-gap, var(--ae-space-4));
    }
    :host([inline]) {
      display: inline-grid;
    }

    /* Token gap presets. Raw CSS lengths are applied via inline style. */
    :host([gap='none']) { --ae-grid-gap: 0; }
    :host([gap='xs'])   { --ae-grid-gap: var(--ae-space-1); }
    :host([gap='sm'])   { --ae-grid-gap: var(--ae-space-2); }
    :host([gap='md'])   { --ae-grid-gap: var(--ae-space-4); }
    :host([gap='lg'])   { --ae-grid-gap: var(--ae-space-6); }
    :host([gap='xl'])   { --ae-grid-gap: var(--ae-space-8); }
    :host([gap='2xl'])  { --ae-grid-gap: var(--ae-space-12); }

    /* align-items */
    :host([align='start'])   { align-items: start; }
    :host([align='center'])  { align-items: center; }
    :host([align='end'])     { align-items: end; }
    :host([align='stretch']) { align-items: stretch; }

    /* justify-content */
    :host([justify='start'])         { justify-content: start; }
    :host([justify='center'])        { justify-content: center; }
    :host([justify='end'])           { justify-content: end; }
    :host([justify='stretch'])       { justify-content: stretch; }
    :host([justify='space-between']) { justify-content: space-between; }
    :host([justify='space-around'])  { justify-content: space-around; }
    :host([justify='space-evenly'])  { justify-content: space-evenly; }
  `;
AeGrid._gapTokens = /* @__PURE__ */ new Set([
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl"
]);
__decorateClass([
  n4({ reflect: true })
], AeGrid.prototype, "columns", 2);
__decorateClass([
  n4({ reflect: true })
], AeGrid.prototype, "rows", 2);
__decorateClass([
  n4({ reflect: true })
], AeGrid.prototype, "gap", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeGrid.prototype, "align", 2);
__decorateClass([
  n4({ type: String, reflect: true })
], AeGrid.prototype, "justify", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeGrid.prototype, "inline", 2);
AeGrid = __decorateClass([
  t3("ae-grid")
], AeGrid);

// src/components/resizer/ae-resizer.ts
var AeResizer = class extends i4 {
  constructor() {
    super(...arguments);
    this.orientation = "horizontal";
    this.target = null;
    this.min = 0;
    this.max = Number.POSITIVE_INFINITY;
    this.disabled = false;
    this.controlled = false;
    this._dragging = false;
    this._pointerId = null;
    this._startX = 0;
    this._startY = 0;
    this._startWidth = 0;
    this._startHeight = 0;
    this._rafId = 0;
    this._pendingWidth = 0;
    this._pendingHeight = 0;
    // Controlled mode: last pointer position along the resize axis already
    // reported, so each frame emits only the incremental delta since.
    this._lastAxis = 0;
    this._pendingAxis = 0;
    this._onPointerDown = (e8) => {
      if (this.disabled) return;
      if (e8.button !== 0 && e8.pointerType === "mouse") return;
      if (this.controlled) {
        this._dragging = true;
        this._pointerId = e8.pointerId;
        this._lastAxis = this.orientation === "vertical" ? e8.clientY : e8.clientX;
        this.setAttribute("data-dragging", "");
        e8.currentTarget.setPointerCapture?.(e8.pointerId);
        e8.preventDefault();
        return;
      }
      const target = this._resolveTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();
      this._startX = e8.clientX;
      this._startY = e8.clientY;
      this._startWidth = rect.width;
      this._startHeight = rect.height;
      this._pointerId = e8.pointerId;
      this._dragging = true;
      this.setAttribute("data-dragging", "");
      e8.currentTarget.setPointerCapture?.(e8.pointerId);
      e8.preventDefault();
    };
    this._onPointerMove = (e8) => {
      if (!this._dragging || e8.pointerId !== this._pointerId) return;
      if (this.controlled) {
        this._pendingAxis = this.orientation === "vertical" ? e8.clientY : e8.clientX;
        if (!this._rafId) {
          this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            if (!this._dragging) return;
            const primary = this._pendingAxis - this._lastAxis;
            this._lastAxis = this._pendingAxis;
            if (primary !== 0) {
              this.dispatchEvent(
                new CustomEvent("ae-resize-delta", {
                  bubbles: true,
                  composed: true,
                  detail: { primary }
                })
              );
            }
          });
        }
        return;
      }
      const target = this._resolveTarget();
      if (!target) return;
      const dx = e8.clientX - this._startX;
      const dy = e8.clientY - this._startY;
      const wantWidth = this.orientation === "horizontal" || this.orientation === "both";
      const wantHeight = this.orientation === "vertical" || this.orientation === "both";
      if (wantWidth) {
        this._pendingWidth = this._clamp(this._startWidth + dx);
      }
      if (wantHeight) {
        this._pendingHeight = this._clamp(this._startHeight + dy);
      }
      if (!this._rafId) {
        this._rafId = requestAnimationFrame(() => {
          this._rafId = 0;
          if (!this._dragging) return;
          if (wantWidth) target.style.width = `${this._pendingWidth}px`;
          if (wantHeight) target.style.height = `${this._pendingHeight}px`;
          this._emitResize(target, {
            width: wantWidth ? this._pendingWidth : this._startWidth,
            height: wantHeight ? this._pendingHeight : this._startHeight
          });
        });
      }
    };
    this._onPointerUp = (e8) => {
      if (e8.pointerId !== this._pointerId) return;
      this._dragging = false;
      this._pointerId = null;
      this.removeAttribute("data-dragging");
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
      }
      e8.currentTarget.releasePointerCapture?.(e8.pointerId);
      if (this.controlled) return;
      const target = this._resolveTarget();
      if (target) this._emitResize(target);
    };
    this._onKeyDown = (e8) => {
      if (this.disabled) return;
      if (this.controlled) {
        const vertical = this.orientation === "vertical";
        let direction = 0;
        let edge = null;
        if (e8.key === (vertical ? "ArrowUp" : "ArrowLeft")) direction = -1;
        else if (e8.key === (vertical ? "ArrowDown" : "ArrowRight")) direction = 1;
        else if (e8.key === "Home") edge = "home";
        else if (e8.key === "End") edge = "end";
        else return;
        e8.preventDefault();
        this.dispatchEvent(
          new CustomEvent(
            "ae-resize-step",
            {
              bubbles: true,
              composed: true,
              detail: { direction, big: e8.shiftKey, edge }
            }
          )
        );
        return;
      }
      const target = this._resolveTarget();
      if (!target) return;
      const step = e8.shiftKey ? 16 : 4;
      const rect = target.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;
      let handled = false;
      const wantWidth = this.orientation === "horizontal" || this.orientation === "both";
      const wantHeight = this.orientation === "vertical" || this.orientation === "both";
      if (e8.key === "ArrowLeft" && wantWidth) {
        width = this._clamp(width - step);
        target.style.width = `${width}px`;
        handled = true;
      } else if (e8.key === "ArrowRight" && wantWidth) {
        width = this._clamp(width + step);
        target.style.width = `${width}px`;
        handled = true;
      } else if (e8.key === "ArrowUp" && wantHeight) {
        height = this._clamp(height - step);
        target.style.height = `${height}px`;
        handled = true;
      } else if (e8.key === "ArrowDown" && wantHeight) {
        height = this._clamp(height + step);
        target.style.height = `${height}px`;
        handled = true;
      }
      if (handled) {
        e8.preventDefault();
        this._emitResize(target, { width, height });
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", this._onKeyDown);
    if (this.hasAttribute("controlled")) return;
    if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
    if (!this.hasAttribute("tabindex") && !this.disabled) {
      this.setAttribute("tabindex", "0");
    }
    this._syncAria();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this._onKeyDown);
  }
  updated(changed) {
    if (this.controlled) return;
    if (changed.has("orientation") || changed.has("disabled")) {
      this._syncAria();
    }
    if (changed.has("disabled")) {
      if (this.disabled) {
        this.removeAttribute("tabindex");
      } else if (!this.hasAttribute("tabindex")) {
        this.setAttribute("tabindex", "0");
      }
    }
  }
  _syncAria() {
    const orient = this.orientation === "vertical" ? "horizontal" : "vertical";
    this.setAttribute("aria-orientation", orient);
    this._syncValueNow();
  }
  /** Mirror the resize target's current primary dimension into the splitter's
   *  value state so AT can announce and track it. */
  _syncValueNow(dims) {
    if (Number.isFinite(this.min)) {
      this.setAttribute("aria-valuemin", String(Math.round(this.min)));
    }
    if (Number.isFinite(this.max)) {
      this.setAttribute("aria-valuemax", String(Math.round(this.max)));
    }
    let size = null;
    if (dims) {
      size = this.orientation === "vertical" ? dims.height : dims.width;
    } else {
      const target = this._resolveTarget();
      if (target) {
        const r6 = target.getBoundingClientRect();
        size = this.orientation === "vertical" ? r6.height : r6.width;
      }
    }
    if (size !== null && Number.isFinite(size)) {
      this.setAttribute("aria-valuenow", String(Math.round(size)));
    } else if (!this.hasAttribute("aria-valuenow")) {
      this.setAttribute("aria-valuenow", "0");
    }
  }
  render() {
    return b2`<span
      class="handle"
      part="handle"
      @pointerdown=${this._onPointerDown}
      @pointermove=${this._onPointerMove}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerUp}
    ><span class="grip" part="grip" aria-hidden="true"
      ><span class="dot"></span
      ><span class="dot"></span
      ><span class="dot"></span
      ><span class="dot"></span
    ></span></span>`;
  }
  _resolveTarget() {
    if (this.target instanceof HTMLElement) return this.target;
    if (typeof this.target === "string" && this.target.length > 0) {
      const root = this.getRootNode();
      const found = root.querySelector?.(this.target);
      if (found instanceof HTMLElement) return found;
    }
    const parent = this.parentElement;
    return parent instanceof HTMLElement ? parent : null;
  }
  _clamp(value) {
    const min = Number.isFinite(this.min) ? this.min : 0;
    const max = Number.isFinite(this.max) ? this.max : Number.POSITIVE_INFINITY;
    return Math.max(min, Math.min(max, value));
  }
  _emitResize(target, explicit) {
    const dims = explicit ?? (() => {
      const rect = target.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })();
    this._syncValueNow(dims);
    this.dispatchEvent(
      new CustomEvent("ae-resize", {
        bubbles: true,
        composed: true,
        detail: dims
      })
    );
  }
};
AeResizer.styles = i`
    /*
     * Theme-overridable tokens (--ae-resizer-color, -color-hover,
     * -thickness, -radius, -border-perp, -dot-color) are NOT declared
     * at :host — :host declarations would shadow inherited root-level
     * theme overrides. Resolved at consumption point via
     * var(--token, default). Locked down by
     * src/theme-integration.test.ts.
     */
    :host {
      display: inline-flex;
      align-items: stretch;
      justify-content: stretch;
      user-select: none;
      touch-action: none;
    }
    :host([orientation='horizontal']) {
      cursor: ew-resize;
      width: var(--ae-resizer-thickness, 6px);
      align-self: stretch;
    }
    :host([orientation='vertical']) {
      cursor: ns-resize;
      height: var(--ae-resizer-thickness, 6px);
      align-self: stretch;
      width: 100%;
    }
    :host([orientation='both']) {
      cursor: nwse-resize;
      width: var(--ae-resizer-thickness, 6px);
      height: var(--ae-resizer-thickness, 6px);
    }
    :host([disabled]) {
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.5;
    }

    .handle {
      position: relative;
      flex: 1 1 auto;
      background: var(--ae-resizer-color, var(--ae-color-border-strong));
      border-radius: var(--ae-resizer-radius, var(--ae-radius-full));
      transition: background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
      box-sizing: border-box;
    }
    /* Borders perpendicular to the drag axis — horizontal splitter
     * (col-resize) gets left+right; vertical splitter (row-resize)
     * gets top+bottom. Default 0 solid transparent = invisible. */
    :host([orientation='horizontal']) .handle {
      border-left:  var(--ae-resizer-border-perp, 0 solid transparent);
      border-right: var(--ae-resizer-border-perp, 0 solid transparent);
    }
    :host([orientation='vertical']) .handle {
      border-top:    var(--ae-resizer-border-perp, 0 solid transparent);
      border-bottom: var(--ae-resizer-border-perp, 0 solid transparent);
    }

    :host(:hover) .handle,
    :host([data-dragging]) .handle {
      background: var(--ae-resizer-color-hover, var(--ae-color-accent));
    }
    :host(:focus-visible) {
      ${focusRing}
      border-radius: var(--ae-radius-sm);
    }

    /* Grip dots — 4 small dots stacked in the center of the handle.
     * Hidden by default (--ae-resizer-dot-color: transparent); themes
     * like Metro override to var(--ae-color-ink) to surface them as
     * the print-shop splitter grip. For a horizontal (col-resize)
     * splitter the dots stack vertically; for a vertical (row-resize)
     * splitter they stack horizontally. */
    .grip {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      pointer-events: none;
    }
    :host([orientation='horizontal']) .grip {
      flex-direction: column;
    }
    :host([orientation='vertical']) .grip {
      flex-direction: row;
    }
    :host([orientation='both']) .grip {
      /* Both: render as a 2x2 micro-grid */
      flex-wrap: wrap;
      width: 7px;
      margin: auto;
    }
    .dot {
      width: 2px;
      height: 2px;
      background: var(--ae-resizer-dot-color, transparent);
      border-radius: 50%;
      flex: 0 0 auto;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeResizer.prototype, "orientation", 2);
__decorateClass([
  n4({ attribute: "target" })
], AeResizer.prototype, "target", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeResizer.prototype, "min", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeResizer.prototype, "max", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeResizer.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeResizer.prototype, "controlled", 2);
AeResizer = __decorateClass([
  t3("ae-resizer")
], AeResizer);

// src/components/split-pane/ae-split-pane.ts
var AeSplitPane = class extends i4 {
  constructor() {
    super(...arguments);
    this.orientation = "horizontal";
    this.size = 50;
    this.min = 10;
    this.max = 90;
    this.disabled = false;
    this.keyboardStep = 5;
    /** Pointer drag delta (px along the axis) from the controlled resizer → %. */
    this._onResizerDelta = (e8) => {
      e8.stopPropagation();
      if (this.disabled) return;
      const detail = e8.detail;
      const box = this._hostBox?.getBoundingClientRect();
      if (!box) return;
      const axis = this.orientation === "horizontal" ? box.width : box.height;
      if (axis <= 0) return;
      const deltaPct = detail.primary / axis * 100;
      const next = this._clamp(this.size + deltaPct);
      if (next !== this.size) {
        this.size = next;
        this._emitResize();
      }
    };
    /** Keyboard intent from the controlled resizer → apply in % steps. */
    this._onResizerStep = (e8) => {
      e8.stopPropagation();
      if (this.disabled) return;
      const { direction, big, edge } = e8.detail;
      let next = this.size;
      if (edge === "home") next = this.min;
      else if (edge === "end") next = this.max;
      else next = this.size + direction * (big ? this.keyboardStep * 2 : this.keyboardStep);
      next = this._clamp(next);
      if (next !== this.size) {
        this.size = next;
        this._emitResize();
      }
    };
  }
  render() {
    const clamped = this._clamp(this.size);
    const dim = this.orientation === "horizontal" ? "width" : "height";
    const startStyle = `${dim}: ${clamped}%;`;
    return b2`
      <div class="host">
        <div class="pane start" part="pane-start" style=${startStyle}>
          <slot name="start"></slot>
        </div>
        <ae-resizer
          class="divider"
          part="divider"
          controlled
          orientation=${this.orientation}
          role="separator"
          aria-orientation=${this.orientation === "horizontal" ? "vertical" : "horizontal"}
          aria-valuenow=${Math.round(clamped)}
          aria-valuemin=${Math.round(this.min)}
          aria-valuemax=${Math.round(this.max)}
          aria-disabled=${this.disabled ? "true" : "false"}
          ?disabled=${this.disabled}
          tabindex=${this.disabled ? -1 : 0}
          @ae-resize-delta=${this._onResizerDelta}
          @ae-resize-step=${this._onResizerStep}
        ></ae-resizer>
        <div class="pane end" part="pane-end">
          <slot name="end"></slot>
        </div>
      </div>
    `;
  }
  /** Clamp a percentage to the current min/max window. */
  _clamp(value) {
    const lo = Math.max(0, Math.min(this.min, 100));
    const hi = Math.min(100, Math.max(this.max, 0));
    if (hi < lo) return lo;
    const upper = Math.min(hi, 100 - lo);
    return Math.max(lo, Math.min(upper, value));
  }
  _emitResize() {
    this.dispatchEvent(
      new CustomEvent("ae-resize", {
        bubbles: true,
        composed: true,
        detail: { size: this._clamp(this.size) }
      })
    );
  }
};
AeSplitPane.styles = i`
    :host {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }
    .host {
      display: flex;
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    :host([orientation='horizontal']) .host { flex-direction: row; }
    :host([orientation='vertical'])   .host { flex-direction: column; }

    .pane {
      overflow: auto;
      min-width: 0;
      min-height: 0;
    }
    .pane.start { flex: 0 0 auto; }
    .pane.end   { flex: 1 1 auto; }

    /* The divider is an ae-resizer; it must not grow or shrink. The resizer
       carries its own thickness / cursor / hover / focus / disabled visuals
       (and Metro's grip) via the --ae-resizer-* tokens. */
    .divider {
      flex: 0 0 auto;
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeSplitPane.prototype, "orientation", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSplitPane.prototype, "size", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSplitPane.prototype, "min", 2);
__decorateClass([
  n4({ type: Number, reflect: true })
], AeSplitPane.prototype, "max", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeSplitPane.prototype, "disabled", 2);
__decorateClass([
  n4({ type: Number, reflect: true, attribute: "keyboard-step" })
], AeSplitPane.prototype, "keyboardStep", 2);
__decorateClass([
  e5(".host")
], AeSplitPane.prototype, "_hostBox", 2);
AeSplitPane = __decorateClass([
  t3("ae-split-pane")
], AeSplitPane);

// src/components/scroll-area/ae-scroll-area.ts
var AeScrollArea = class extends i4 {
  constructor() {
    super(...arguments);
    this.orientation = "vertical";
    this.maxHeight = null;
    this.maxWidth = null;
    this.shadow = false;
    this._atStart = true;
    this._atEnd = true;
    this._onScroll = () => {
      if (this.shadow) this._recompute();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }
  updated(changed) {
    if (changed.has("maxHeight")) {
      if (this.maxHeight) this.style.maxHeight = this.maxHeight;
      else this.style.removeProperty("max-height");
    }
    if (changed.has("maxWidth")) {
      if (this.maxWidth) this.style.maxWidth = this.maxWidth;
      else this.style.removeProperty("max-width");
    }
    if (changed.has("shadow") && this.shadow) {
      queueMicrotask(() => this._recompute());
    }
  }
  firstUpdated() {
    this._recompute();
  }
  render() {
    return b2`
      ${this.shadow ? b2`<div class="shadow start" ?data-visible=${!this._atStart}></div>` : A}
      <div
        class="viewport"
        part="viewport"
        tabindex="0"
        @scroll=${this._onScroll}
      >
        <slot></slot>
      </div>
      ${this.shadow ? b2`<div class="shadow end" ?data-visible=${!this._atEnd}></div>` : A}
    `;
  }
  /**
   * Recalculate the at-start / at-end flags based on current scroll
   * position. Allows for sub-pixel rounding by treating values < 1 as
   * "at edge".
   */
  _recompute() {
    const v2 = this._viewport;
    if (!v2) return;
    if (this.orientation === "horizontal") {
      this._atStart = v2.scrollLeft <= 0.5;
      this._atEnd = v2.scrollLeft + v2.clientWidth >= v2.scrollWidth - 0.5;
    } else {
      this._atStart = v2.scrollTop <= 0.5;
      this._atEnd = v2.scrollTop + v2.clientHeight >= v2.scrollHeight - 0.5;
    }
  }
  scrollTo(...args) {
    if (!this._viewport) return;
    this._viewport.scrollTo.apply(
      this._viewport,
      args
    );
  }
};
AeScrollArea.styles = i`
    :host {
      --ae-scroll-area-thumb: var(--ae-color-gray-300);
      --ae-scroll-area-thumb-hover: var(--ae-color-gray-400);
      --ae-scroll-area-track: transparent;
      --ae-scroll-area-size: 10px;
      --ae-scroll-area-shadow: oklch(0% 0 0 / 0.10);

      display: block;
      position: relative;
      box-sizing: border-box;
      min-width: 0;
      min-height: 0;
      max-width: 100%;
    }
    :host(:focus-visible) {
      ${focusRing}
      border-radius: var(--ae-radius-sm);
    }

    .viewport {
      width: 100%;
      height: 100%;
      max-width: inherit;
      max-height: inherit;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: var(--ae-scroll-area-thumb) var(--ae-scroll-area-track);
    }

    /* WebKit / Chromium scrollbar surface */
    .viewport::-webkit-scrollbar {
      width: var(--ae-scroll-area-size);
      height: var(--ae-scroll-area-size);
    }
    .viewport::-webkit-scrollbar-track {
      background: var(--ae-scroll-area-track);
      border-radius: var(--ae-radius-full);
    }
    .viewport::-webkit-scrollbar-thumb {
      background: var(--ae-scroll-area-thumb);
      border-radius: var(--ae-radius-full);
      border: 2px solid transparent;
      background-clip: padding-box;
      transition: background-color var(--ae-duration-fast) var(--ae-easing-ease-out);
    }
    .viewport::-webkit-scrollbar-thumb:hover {
      background: var(--ae-scroll-area-thumb-hover);
      background-clip: padding-box;
    }
    .viewport::-webkit-scrollbar-corner {
      background: transparent;
    }

    /* Orientation overflow control */
    :host([orientation='vertical']) .viewport {
      overflow-x: hidden;
      overflow-y: auto;
    }
    :host([orientation='horizontal']) .viewport {
      overflow-x: auto;
      overflow-y: hidden;
    }
    :host([orientation='both']) .viewport {
      overflow: auto;
    }

    /* Scroll shadows: pseudo-elements anchored on :host so we can fade
       them via opacity transitions without paint thrash. They sit above
       the content but are pointer-events: none. */
    .shadow {
      position: absolute;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--ae-duration-fast) var(--ae-easing-ease-out);
      z-index: 1;
    }
    :host([shadow]) .shadow[data-visible] {
      opacity: 1;
    }
    /* Vertical edges */
    :host([orientation='vertical']) .shadow.start,
    :host([orientation='both'])     .shadow.start {
      top: 0;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(to bottom, var(--ae-scroll-area-shadow), transparent);
    }
    :host([orientation='vertical']) .shadow.end,
    :host([orientation='both'])     .shadow.end {
      bottom: 0;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(to top, var(--ae-scroll-area-shadow), transparent);
    }
    /* Horizontal edges */
    :host([orientation='horizontal']) .shadow.start {
      top: 0;
      bottom: 0;
      left: 0;
      width: 12px;
      background: linear-gradient(to right, var(--ae-scroll-area-shadow), transparent);
    }
    :host([orientation='horizontal']) .shadow.end {
      top: 0;
      bottom: 0;
      right: 0;
      width: 12px;
      background: linear-gradient(to left, var(--ae-scroll-area-shadow), transparent);
    }
  `;
__decorateClass([
  n4({ type: String, reflect: true })
], AeScrollArea.prototype, "orientation", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "max-height" })
], AeScrollArea.prototype, "maxHeight", 2);
__decorateClass([
  n4({ type: String, reflect: true, attribute: "max-width" })
], AeScrollArea.prototype, "maxWidth", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], AeScrollArea.prototype, "shadow", 2);
__decorateClass([
  r5()
], AeScrollArea.prototype, "_atStart", 2);
__decorateClass([
  r5()
], AeScrollArea.prototype, "_atEnd", 2);
__decorateClass([
  e5(".viewport")
], AeScrollArea.prototype, "_viewport", 2);
AeScrollArea = __decorateClass([
  t3("ae-scroll-area")
], AeScrollArea);
export {
  AeAccordion,
  AeAccordionItem,
  AeAlert,
  AeAvatar,
  AeBadge,
  AeBanner,
  AeBreadcrumb,
  AeBreadcrumbItem,
  AeButton,
  AeCallout,
  AeCard,
  AeCheckbox,
  AeCodeBlock,
  AeCombobox,
  AeCommandPalette,
  AeContextMenu,
  AeDatePicker,
  AeDialog,
  AeDiffViewer,
  AeDivider,
  AeDrawer,
  AeEmptyState,
  AeFileInput,
  AeFormField,
  AeGhostField,
  AeGrid,
  AeIcon,
  AeInput,
  AeKbd,
  AeLink,
  AeList,
  AeListItem,
  AeMenu,
  AeMenuItem,
  AeModal,
  AeOption,
  AePageHeader,
  AePagination,
  AePopover,
  AePortal,
  AeProgress,
  AeProgressCircle,
  AeProse,
  AeRadio,
  AeRadioGroup,
  AeResizer,
  AeScrollArea,
  AeSegmented,
  AeSegmentedItem,
  AeSelect,
  AeSkeleton,
  AeSlider,
  AeSpinner,
  AeSplitPane,
  AeStack,
  AeStep,
  AeStepper,
  AeSwitch,
  AeTab,
  AeTable,
  AeTabs,
  AeTag,
  AeTbody,
  AeTd,
  AeTextarea,
  AeTh,
  AeThead,
  AeTimePicker,
  AeTimeline,
  AeTimelineItem,
  AeToast,
  AeTooltip,
  AeTr,
  AeTree,
  AeTreeNode,
  AeVirtualScroller,
  AeVisuallyHidden,
  AeWizard,
  AeWizardStep,
  DEFAULT_THEME_SELECTION,
  THEME_FAMILIES,
  THEME_REGISTRY,
  applyTheme,
  brandSupportsVariant,
  brandsByFamily,
  getHighlighter,
  getThemeBrand,
  getThemeVariant,
  highlight,
  listRegisteredIcons,
  registerIcons,
  resolveEffectiveVariant,
  resolveSystemScheme,
  setHighlighter,
  toast,
  unregisterIcon
};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/static.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
