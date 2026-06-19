#!/usr/bin/env python3
"""
serve_cost — OFFLINE per-provider token + cost reader for the cost lane (#2).

Derive-at-serve: each provider already writes token usage to its OWN on-disk
transcript, so histograph reads it there (keyed by the session_id + cwd it already
holds) rather than adding a capture hook (posttooluse.py deliberately removed
per-tool-call cost work for latency). Priced from a VENDORED model->price table
(model_prices.json) — NOT ONE BYTE leaves the machine, ever. stdlib only.

  Claude  ~/.claude/projects/<enc-cwd>/<sessionId>.jsonl — sum message.usage across
          assistant lines, dedup by (message.id, requestId). input/output are
          APPROXIMATE upstream (streaming placeholders; thinking tokens excluded),
          so Claude cost is accuracy='approximate'. cache_* are reliable.
  Codex   ~/.codex/sessions/**/rollout-*.jsonl — the LAST token_count event's
          total_token_usage is the rollout's cumulative total (exact). cached_input
          is a subset of input_tokens; total_tokens == input + output.
  Gemini  no usage on disk (verified) -> cost is reported 'unavailable', never $0.

Strictly OBSERVATIONAL — this module reports spend; it is NEVER a budget/quota gate.
Fail-open everywhere: a missing transcript, an unparsable line, or an unpriced model
degrades to None / priced:false, never an exception (serve_state wraps it too)."""
import os, sys, json, glob, re, functools, threading

_HERE = os.path.dirname(os.path.abspath(__file__))
_PRICE_PATH = os.path.join(_HERE, "model_prices.json")

# Per-transcript parse cache keyed on (mtime_ns, size). The agent-histograph ledger and
# a provider's transcript change INDEPENDENTLY, so the per-Ledger cost memo upstream
# isn't enough: this re-parses a (possibly multi-MB) transcript only when it has grown,
# while every poll still reflects the latest totals the instant the file changes.
_USAGE_CACHE = {}            # path -> ((mtime_ns, size), usage|None)
_USAGE_CACHE_LOCK = threading.Lock()


def _cached_usage(path, parser):
    """Parse `path` via `parser`, reusing the cached result while the file's
    (mtime_ns, size) is unchanged. An unstattable path is parsed fresh (uncached)."""
    try:
        st = os.stat(path)
        key = (st.st_mtime_ns, st.st_size)
    except OSError:
        return parser(path)
    with _USAGE_CACHE_LOCK:
        ent = _USAGE_CACHE.get(path)
        if ent is not None and ent[0] == key:
            return ent[1]
    usage = parser(path)
    with _USAGE_CACHE_LOCK:
        _USAGE_CACHE[path] = (key, usage)
    return usage

# codex_common (find_session_path) lives in the capture layer.
_CAPTURE = os.path.normpath(os.path.join(_HERE, "..", "capture-proof"))
if _CAPTURE not in sys.path:
    sys.path.insert(0, _CAPTURE)

# Codex rollouts often omit a per-turn model; price the well-known default (in-table).
_CODEX_DEFAULT_MODEL = "gpt-5-codex"


# --------------------------------------------------------------------------- #
# pricing table (vendored, offline) + model-id normalization
# --------------------------------------------------------------------------- #
@functools.lru_cache(maxsize=1)
def _load_prices():
    """The vendored LiteLLM price table, loaded once. {} on any error (everything
    then reads as unpriced — observational, never a crash)."""
    try:
        with open(_PRICE_PATH, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict):
            d.pop("_meta", None)
            return d
    except Exception:
        pass
    return {}


def _normalize_model(model, table):
    """Map a live model id onto a price-table key. Exact -> case-insensitive ->
    date/region-suffix-stripped -> family-prefix fuzzy (e.g. 'claude-opus-4-8' has no
    table key, but shares the leading tokens of 'claude-opus-4-7', which prices the
    same tier). Returns None when nothing in the family matches (-> unpriced, the
    graceful observational fallback). Within a Claude family the per-token price is
    stable across point releases, so the nearest sibling is a correct price."""
    if not model or not table:
        return None
    m = str(model).strip()
    if m in table:
        return m
    lower_map = {k.lower(): k for k in table}
    ml = m.lower()
    if ml in lower_map:
        return lower_map[ml]
    base = re.sub(r"-v\d+:\d+$", "", ml)
    base = re.sub(r"[-_](?:\d{8}|\d{4}-\d{2}-\d{2})$", "", base)
    if base in lower_map:
        return lower_map[base]
    req = base.split("-")
    min_tokens = 3 if len(req) >= 3 else 2

    def _prefix_n(toks):
        n = 0
        for a, b in zip(req, toks):
            if a == b:
                n += 1
            else:
                break
        return n

    def _tail(kl):
        # strip a leading vendor/region namespace so namespaced keys become reachable by
        # the bare family tokens — bedrock "us.anthropic.claude-...", "vertex_ai/claude-...",
        # "snowflake/claude-..." — then drop a trailing version/date suffix.
        t = kl.rsplit("/", 1)[-1]
        t = re.sub(r"^(?:[a-z0-9_-]+\.)*", "", t)
        t = re.sub(r"-v\d+:\d+$", "", t)
        t = re.sub(r"[-_](?:\d{8}|\d{4}-\d{2}-\d{2})$", "", t)
        return t

    cands = []
    for kl, k in lower_map.items():
        n = max(_prefix_n(kl.split("-")), _prefix_n(_tail(kl).split("-")))
        if n >= min_tokens:
            cands.append((n, k, kl))
    if not cands:
        return None
    best_n = max(c[0] for c in cands)
    top = [c for c in cands if c[0] == best_n]
    short_len = min(len(c[1]) for c in top)          # prefer the undated/canonical key
    shortest = [c for c in top if len(c[1]) == short_len]

    def _ver_key(c):
        # NUMERIC version ordering on the trailing digit segments so "latest" means
        # numerically-highest (claude-opus-4-10 > claude-opus-4-9), not lexicographic.
        nums = []
        for t in reversed(c[2].split("-")):
            if t.isdigit():
                nums.append(int(t))
            else:
                break
        return (tuple(reversed(nums)), c[2])

    shortest.sort(key=_ver_key, reverse=True)         # then the latest version
    return shortest[0][1]


def price_usd(tokens, row):
    """USD for a {input, output, cacheRead, cacheCreation} token dict against a price
    row. Missing cache rates fall back to the input rate (cache billed as input when a
    discount isn't published). 0.0 when the row carries no rates."""
    inp = tokens.get("input", 0) or 0
    out = tokens.get("output", 0) or 0
    cr = tokens.get("cacheRead", 0) or 0
    cc = tokens.get("cacheCreation", 0) or 0
    in_rate = row.get("input_cost_per_token") or 0.0
    out_rate = row.get("output_cost_per_token") or 0.0
    cr_rate = row.get("cache_read_input_token_cost")
    cc_rate = row.get("cache_creation_input_token_cost")
    cr_rate = in_rate if cr_rate is None else cr_rate
    cc_rate = in_rate if cc_rate is None else cc_rate
    return inp * in_rate + out * out_rate + cr * cr_rate + cc * cc_rate


def cost_of(tokens, model):
    """(usd, priced, reason) for a token dict + model id, against the vendored table."""
    table = _load_prices()
    key = _normalize_model(model, table)
    row = table.get(key) if key else None
    if not row:
        return None, False, "model not in price table"
    return price_usd(tokens, row), True, None


# --------------------------------------------------------------------------- #
# Claude — sum message.usage across the transcript, dedup by (id, requestId)
# --------------------------------------------------------------------------- #
def _sum_claude_usage(path):
    """Parse one Claude transcript file -> {tokens, model, accuracy} or None. Dedups
    repeated logging of the same API response by (message.id, requestId) — ccusage #888
    confirms duplicate lines occur upstream, so a naive sum double-counts."""
    inp = out = cr = cc = 0
    model = None
    seen = set()
    n = 0
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                msg = o.get("message") if isinstance(o.get("message"), dict) else None
                if not msg:
                    continue
                u = msg.get("usage") if isinstance(msg.get("usage"), dict) else None
                if not u:
                    continue
                key = (msg.get("id"), o.get("requestId"))
                if key != (None, None):
                    if key in seen:
                        continue
                    seen.add(key)
                inp += int(u.get("input_tokens") or 0)
                out += int(u.get("output_tokens") or 0)
                cr += int(u.get("cache_read_input_tokens") or 0)
                cc += int(u.get("cache_creation_input_tokens") or 0)
                if msg.get("model"):
                    model = msg.get("model")
                n += 1
    except Exception:
        return None
    if n == 0:
        return None
    total = inp + out + cr + cc
    return {"tokens": {"input": inp, "output": out, "cacheRead": cr,
                       "cacheCreation": cc, "total": total},
            "model": model, "accuracy": "approximate"}


def _claude_transcript_path(session_id, cwd):
    """Locate a Claude session transcript. Globs every project dir for
    '<session_id>.jsonl' (one level deep), so a cwd-encoding edge case can never lose a
    session. None when not found."""
    if not session_id:
        return None
    base = os.path.join(os.path.expanduser("~"), ".claude", "projects")
    try:
        hits = glob.glob(os.path.join(base, "*", str(session_id) + ".jsonl"))
        return hits[0] if hits else None
    except Exception:
        return None


def claude_tokens(session_id, cwd):
    path = _claude_transcript_path(session_id, cwd)
    return _cached_usage(path, _sum_claude_usage) if path else None


# --------------------------------------------------------------------------- #
# Codex — the LAST cumulative token_count event in the rollout
# --------------------------------------------------------------------------- #
def _sum_codex_usage(path):
    """Parse one Codex rollout -> {tokens, model, accuracy} or None. The LAST
    token_count event's total_token_usage is the rollout's cumulative total (NOT a
    per-turn delta — never sum them). input_tokens includes cached_input_tokens, so
    the non-cached input is input - cached. Skips null-info events (they occur)."""
    last_info = None
    model = None
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                pl = o.get("payload") if isinstance(o.get("payload"), dict) else None
                if pl is None and o.get("type") in ("token_count", "turn_context"):
                    pl = o
                if not pl:
                    continue
                if pl.get("type") == "token_count" and isinstance(pl.get("info"), dict):
                    ttu = pl["info"].get("total_token_usage")
                    if isinstance(ttu, dict):
                        last_info = ttu
                elif pl.get("type") == "turn_context" and pl.get("model"):
                    model = pl.get("model")
    except Exception:
        return None
    if not last_info:
        return None
    in_full = int(last_info.get("input_tokens") or 0)
    cached = int(last_info.get("cached_input_tokens") or 0)
    out = int(last_info.get("output_tokens") or 0)
    non_cached = max(0, in_full - cached)
    total = int(last_info.get("total_tokens") or (in_full + out))
    return {"tokens": {"input": non_cached, "output": out, "cacheRead": cached,
                       "cacheCreation": 0, "total": total},
            "model": model or _CODEX_DEFAULT_MODEL, "accuracy": "exact"}


def codex_tokens(session_id, cwd):
    try:
        import codex_common
        path = codex_common.find_session_path(session_id, cwd)
    except Exception:
        return None
    return _cached_usage(path, _sum_codex_usage) if path else None


# --------------------------------------------------------------------------- #
# the wire cost object
# --------------------------------------------------------------------------- #
def _gemini_unavailable():
    return {"tokens": None, "usd": None, "model": None, "provider": "gemini",
            "accuracy": "unavailable", "priced": False, "reason": "no usage in transcript"}


def cost_for_session(provider, session_id, cwd):
    """The per-lane cost object, or None on a hard read failure. Gemini returns a
    NON-null 'unavailable' object so the UI can tell "not captured" from "$0 spent"."""
    if provider == "gemini":
        return _gemini_unavailable()
    if provider == "claude":
        usage = claude_tokens(session_id, cwd)
    elif provider == "codex":
        usage = codex_tokens(session_id, cwd)
    else:
        return None
    if usage is None:
        return None
    usd, priced, reason = cost_of(usage["tokens"], usage.get("model"))
    return {"tokens": usage["tokens"], "usd": usd, "model": usage.get("model"),
            "provider": provider, "accuracy": usage.get("accuracy"),
            "priced": priced, "reason": reason}
