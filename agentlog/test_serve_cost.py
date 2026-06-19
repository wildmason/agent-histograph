#!/usr/bin/env python3
"""
TDD tests for serve_cost.py — the offline per-provider token + cost reader (#2).

Tests the LOAD-BEARING logic against synthetic transcripts + the real vendored price
table: the 4-term pricing split (cache vs input rate), the (id, requestId) dedup, the
codex last-non-null cumulative semantics, model-id normalization for a bleeding-edge id
(claude-opus-4-8 has no exact key but prices the opus-4 tier), and the unpriced fallback.

Run: python -m unittest test_serve_cost -v
"""
import os, sys, json, tempfile, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import serve_cost as C


def _wr(path, rows):
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")


class TestPricing(unittest.TestCase):
    def test_price_usd_cache_vs_input_rate_split(self):
        # Distinct per-component rates; swapping cache-read and input rates changes the
        # result, so this pins the 4-term formula (not a constant echo).
        tokens = {"input": 100, "output": 200, "cacheRead": 1000, "cacheCreation": 50}
        row = {"input_cost_per_token": 1e-6, "output_cost_per_token": 2e-6,
               "cache_read_input_token_cost": 1e-7, "cache_creation_input_token_cost": 3e-6}
        expected = 100 * 1e-6 + 200 * 2e-6 + 1000 * 1e-7 + 50 * 3e-6
        self.assertAlmostEqual(C.price_usd(tokens, row), expected, places=10)
        # sanity: it is NOT what you'd get swapping cache-read with input rate
        wrong = 100 * 1e-7 + 200 * 2e-6 + 1000 * 1e-6 + 50 * 3e-6
        self.assertNotAlmostEqual(C.price_usd(tokens, row), wrong, places=10)

    def test_missing_cache_rate_falls_back_to_input_rate(self):
        tokens = {"input": 0, "output": 0, "cacheRead": 1000, "cacheCreation": 0}
        row = {"input_cost_per_token": 2e-6, "output_cost_per_token": 4e-6}  # no cache rates
        self.assertAlmostEqual(C.price_usd(tokens, row), 1000 * 2e-6, places=10)


class TestNormalization(unittest.TestCase):
    def setUp(self):
        self.table = C._load_prices()

    def test_real_table_loaded(self):
        self.assertGreater(len(self.table), 50)  # vendored table is present + non-trivial

    def test_bleeding_edge_opus_resolves_to_family_and_prices(self):
        # claude-opus-4-8 is not an exact key, but must price the opus-4 tier.
        key = C._normalize_model("claude-opus-4-8", self.table)
        self.assertIsNotNone(key)
        self.assertTrue(key.startswith("claude-opus-4"))
        usd, priced, reason = C.cost_of(
            {"input": 1000, "output": 1000, "cacheRead": 0, "cacheCreation": 0},
            "claude-opus-4-8")
        self.assertTrue(priced)
        self.assertIsNone(reason)
        self.assertGreater(usd, 0)

    def test_date_suffix_stripped(self):
        # An exact dated key wins when present; when a dated id is NOT in the table, the
        # date suffix is stripped to the undated family key.
        self.assertEqual(C._normalize_model("claude-sonnet-4-5-20990101", self.table),
                         "claude-sonnet-4-5")

    def test_claude_3_5_sonnet_prices_via_namespaced_key(self):
        # claude-3-5-sonnet has NO bare table key (only vendor-namespaced ones); the
        # vendor-prefix-strip must still reach the sonnet-3.5 price tier.
        key = C._normalize_model("claude-3-5-sonnet-20241022", self.table)
        self.assertIsNotNone(key)
        self.assertIn("claude-3-5-sonnet", key)
        usd, priced, reason = C.cost_of(
            {"input": 1000, "output": 1000, "cacheRead": 0, "cacheCreation": 0},
            "claude-3-5-sonnet-20241022")
        self.assertTrue(priced)
        self.assertGreater(usd, 0)

    def test_double_digit_version_tiebreak_is_numeric(self):
        # a hypothetical claude-opus-4-10 must resolve to a current opus-4 tier by NUMERIC
        # ordering, not be mis-tiebroken lexicographically below a single-digit sibling.
        key = C._normalize_model("claude-opus-4-10", self.table)
        self.assertIsNotNone(key)
        self.assertTrue(key.startswith("claude-opus-4"))

    def test_unknown_model_unpriced_no_crash(self):
        usd, priced, reason = C.cost_of(
            {"input": 10, "output": 10, "cacheRead": 0, "cacheCreation": 0},
            "totally-made-up-model-xyz")
        self.assertIsNone(usd)
        self.assertFalse(priced)
        self.assertTrue(reason)


class TestClaudeParse(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_claude_sums_usage_and_marks_approximate(self):
        path = os.path.join(self.tmp, "s.jsonl")
        _wr(path, [
            {"type": "user", "message": {"role": "user"}},  # no usage -> ignored
            {"requestId": "r1", "message": {"id": "m1", "model": "claude-opus-4-8",
             "usage": {"input_tokens": 10, "output_tokens": 20,
                       "cache_read_input_tokens": 100, "cache_creation_input_tokens": 5}}},
            {"requestId": "r2", "message": {"id": "m2", "model": "claude-opus-4-8",
             "usage": {"input_tokens": 3, "output_tokens": 7,
                       "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}}},
        ])
        u = C._sum_claude_usage(path)
        self.assertEqual(u["tokens"]["input"], 13)
        self.assertEqual(u["tokens"]["output"], 27)
        self.assertEqual(u["tokens"]["cacheRead"], 100)
        self.assertEqual(u["tokens"]["cacheCreation"], 5)
        self.assertEqual(u["tokens"]["total"], 13 + 27 + 100 + 5)
        self.assertEqual(u["accuracy"], "approximate")
        self.assertEqual(u["model"], "claude-opus-4-8")

    def test_claude_dedup_by_id_and_request(self):
        # Two lines with identical (id, requestId) count once; a differing requestId counts.
        path = os.path.join(self.tmp, "s.jsonl")
        line = {"requestId": "r1", "message": {"id": "m1", "model": "claude-opus-4-8",
                "usage": {"input_tokens": 10, "output_tokens": 20,
                          "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}}}
        dup = json.loads(json.dumps(line))                       # identical -> deduped
        other = json.loads(json.dumps(line)); other["requestId"] = "r2"   # distinct -> counts
        _wr(path, [line, dup, other])
        u = C._sum_claude_usage(path)
        self.assertEqual(u["tokens"]["input"], 20)   # 10 (once) + 10 (other), NOT 30
        self.assertEqual(u["tokens"]["output"], 40)

    def test_claude_empty_returns_none(self):
        path = os.path.join(self.tmp, "s.jsonl")
        _wr(path, [{"type": "user", "message": {"role": "user"}}])
        self.assertIsNone(C._sum_claude_usage(path))


class TestCodexParse(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_codex_last_nonnull_cumulative_and_cache_split(self):
        path = os.path.join(self.tmp, "rollout.jsonl")
        _wr(path, [
            {"payload": {"type": "turn_context", "model": "gpt-5-codex"}},
            {"payload": {"type": "token_count", "info": {"total_token_usage":
                {"input_tokens": 500, "cached_input_tokens": 400, "output_tokens": 20,
                 "total_tokens": 520}}}},
            {"payload": {"type": "token_count", "info": None}},   # null-info -> skipped
            {"payload": {"type": "token_count", "info": {"total_token_usage":
                {"input_tokens": 1000, "cached_input_tokens": 800, "output_tokens": 50,
                 "total_tokens": 1050}}}},                        # LAST cumulative wins
        ])
        u = C._sum_codex_usage(path)
        # last cumulative: input(non-cached)=1000-800=200, cacheRead=800, output=50
        self.assertEqual(u["tokens"]["input"], 200)
        self.assertEqual(u["tokens"]["cacheRead"], 800)
        self.assertEqual(u["tokens"]["output"], 50)
        self.assertEqual(u["tokens"]["total"], 1050)
        self.assertEqual(u["accuracy"], "exact")
        self.assertEqual(u["model"], "gpt-5-codex")

    def test_codex_defaults_model_when_absent(self):
        path = os.path.join(self.tmp, "rollout.jsonl")
        _wr(path, [{"payload": {"type": "token_count", "info": {"total_token_usage":
            {"input_tokens": 10, "cached_input_tokens": 0, "output_tokens": 5,
             "total_tokens": 15}}}}])
        u = C._sum_codex_usage(path)
        self.assertEqual(u["model"], C._CODEX_DEFAULT_MODEL)

    def test_codex_no_token_count_returns_none(self):
        path = os.path.join(self.tmp, "rollout.jsonl")
        _wr(path, [{"payload": {"type": "turn_context", "model": "gpt-5-codex"}}])
        self.assertIsNone(C._sum_codex_usage(path))


class TestUsageCache(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        C._USAGE_CACHE.clear()

    def test_cache_reuses_until_file_grows(self):
        # A transcript (possibly multi-MB) is re-parsed only when it changes. The cache
        # is keyed on (mtime_ns, size); growing the file forces a re-parse.
        path = os.path.join(self.tmp, "rollout.jsonl")
        _wr(path, [{"payload": {"type": "token_count", "info": {"total_token_usage":
            {"input_tokens": 100, "cached_input_tokens": 0, "output_tokens": 10,
             "total_tokens": 110}}}}])
        calls = {"n": 0}
        real = C._sum_codex_usage

        def counting(p):
            calls["n"] += 1
            return real(p)

        a = C._cached_usage(path, counting)
        b = C._cached_usage(path, counting)        # unchanged -> cache hit, parser NOT called
        self.assertEqual(calls["n"], 1)
        self.assertEqual(a["tokens"]["total"], 110)
        self.assertEqual(b["tokens"]["total"], 110)

        # grow the file (new cumulative total) -> re-parse
        import time as _time
        _time.sleep(0.01)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"payload": {"type": "token_count", "info":
                {"total_token_usage": {"input_tokens": 500, "cached_input_tokens": 0,
                 "output_tokens": 50, "total_tokens": 550}}}}) + "\n")
        c = C._cached_usage(path, counting)
        self.assertEqual(calls["n"], 2)            # parsed again
        self.assertEqual(c["tokens"]["total"], 550)


class TestCostForSession(unittest.TestCase):
    def test_gemini_unavailable_not_zero(self):
        c = C.cost_for_session("gemini", "sid", "C:\\repo")
        self.assertIsNone(c["tokens"])
        self.assertIsNone(c["usd"])
        self.assertEqual(c["accuracy"], "unavailable")
        self.assertFalse(c["priced"])
        self.assertTrue(c["reason"])

    def test_unknown_provider_returns_none(self):
        self.assertIsNone(C.cost_for_session("borg", "sid", "C:\\repo"))


if __name__ == "__main__":
    unittest.main()
