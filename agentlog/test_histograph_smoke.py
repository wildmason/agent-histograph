#!/usr/bin/env python3
"""
Histograph page-load smoke tests — cases 18-20 of the frozen build plan.

  18. GET / serves the page shell whose <head> links, in the contract order:
        - tokens.css FIRST (before any theme stylesheet),
        - all 20 themes/*.css (every brand + scheme + spectrum palette),
        - the aegis.js module <script type="module">,
      and the body contains at least one upgraded `<ae-*>` custom element.
  19. GET /static/aegis/aegis.js contains NO bare `from "lit"` / `from 'lit'`
      (the esbuild re-bundle MUST have inlined Lit — a bare specifier would 404
      in the browser's module graph and the whole design system would fail to
      register).
  20. Theme-swap via Playwright (OPTIONAL): drive scheme=dark / brand=crucible,
      assert <html data-theme="crucible"> and that a live `--ae-*` token value
      changes after an applyTheme swap. SKIPS CLEANLY (does not fail the suite)
      when Playwright or a browser binary is unavailable.

The server is started on an EPHEMERAL port (port 0) in a background thread against
a tmp AGENTLOG_DIR with a tiny seeded ledger, hit over real HTTP, then shut down —
the same harness shape as test_serve_http.py. Case 19 reads the vendored bundle off
disk through the running server so it exercises the real `/static/**` route.

Run: python -m unittest test_histograph_smoke -v
"""
import os, sys, re, json, tempfile, threading, unittest
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R     # noqa: F401  (inserts capture-proof/ onto sys.path)
import agentlog_common as A
import serve_epics as E
import serve_http as H

_HERE = os.path.dirname(os.path.abspath(__file__))
_THEMES_DIR = os.path.join(_HERE, "histograph", "static", "aegis", "themes")
# the build plan freezes the count: every brand + scheme + spectrum palette is
# linked simultaneously. The on-disk theme set IS the contract count.
_EXPECTED_THEME_COUNT = 20


def _cp(sid, ts, *, project="Mortar", leaf=None):
    return {
        "type": "checkpoint", "schema_version": "0.1", "summary": "did work",
        "touched_paths": ["src/x.rs"], "verification": [], "decisions": [],
        "risks": [], "asks": [], "next_action": "keep going", "health_draft": None,
        "checkpoint_id": "chk_%s" % sid, "session_id": sid, "host": "claude-code",
        "cwd": "C:\\repo\\%s\\%s" % (project, leaf or sid),
        "project": project, "captured_at": ts, "_valid": True, "_problems": [],
    }


def _act(sid, ts):
    return {"type": "stop_boundary", "session_id": sid, "cwd": "C:\\repo\\Mortar",
            "armed": True, "ts": ts}


class _PageServer(unittest.TestCase):
    """Spin a real server on an ephemeral port against a tmp AGENTLOG_DIR."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._saved = A.AGENTLOG_DIR
        A.AGENTLOG_DIR = self.tmp
        os.makedirs(os.path.join(self.tmp, "state"), exist_ok=True)
        fresh = A.now_iso()
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_cp("live1", fresh)) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_act("live1", fresh)) + "\n")

        self.httpd = H.make_server(host="127.0.0.1", port=0)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        try:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.thread.join(timeout=5)
        except Exception:
            pass
        A.AGENTLOG_DIR = self._saved

    def _get(self, path):
        url = "http://127.0.0.1:%d%s" % (self.port, path)
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                return r.status, dict(r.headers), r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read().decode("utf-8")

    @property
    def base_url(self):
        return "http://127.0.0.1:%d/" % self.port


# --------------------------------------------------------------------------- #
# Case 18 — page shell <head> order + 20 theme links + module script + <ae-*>
# --------------------------------------------------------------------------- #
class TestPageShell(_PageServer):
    def test_get_root_serves_page_shell(self):
        status, headers, html = self._get("/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers.get("Content-Type", ""))

        # tokens.css is present and linked BEFORE any theme stylesheet
        tokens_idx = html.find("/static/aegis/tokens.css")
        self.assertGreaterEqual(tokens_idx, 0, "tokens.css must be linked")
        theme_idxs = [m.start() for m in
                      re.finditer(r"/static/aegis/themes/[\w-]+\.css", html)]
        self.assertTrue(theme_idxs, "theme stylesheets must be linked")
        self.assertLess(tokens_idx, min(theme_idxs),
                        "tokens.css must be linked FIRST, before any theme")

        # ALL 20 theme stylesheets are linked, and they match the on-disk set
        linked = re.findall(r"/static/aegis/themes/([\w-]+\.css)", html)
        self.assertEqual(len(linked), _EXPECTED_THEME_COUNT,
                         "expected %d theme links, found %d"
                         % (_EXPECTED_THEME_COUNT, len(linked)))
        on_disk = {f for f in os.listdir(_THEMES_DIR) if f.endswith(".css")}
        self.assertEqual(len(on_disk), _EXPECTED_THEME_COUNT,
                         "expected %d theme files on disk" % _EXPECTED_THEME_COUNT)
        self.assertEqual(set(linked), on_disk,
                         "every linked theme must resolve to a vendored file and "
                         "every vendored theme must be linked")

        # the aegis.js custom-element registry loads as a MODULE
        self.assertRegex(
            html,
            r'<script[^>]+type="module"[^>]+src="/static/aegis/aegis\.js"',
            "aegis.js must load as <script type=\"module\">",
        )

        # at least one ae-* custom element is present in the rendered shell
        self.assertIn("<ae-", html, "page shell must contain an <ae-*> element")

    def test_every_linked_theme_resolves_200(self):
        # the head links them; the server must actually serve each one
        _, _, html = self._get("/")
        for name in re.findall(r"/static/aegis/themes/([\w-]+\.css)", html):
            status, headers, _ = self._get("/static/aegis/themes/%s" % name)
            self.assertEqual(status, 200, "theme %s must resolve 200" % name)
            self.assertIn("text/css", headers.get("Content-Type", ""))

    def test_tokens_css_resolves_200(self):
        status, headers, _ = self._get("/static/aegis/tokens.css")
        self.assertEqual(status, 200)
        self.assertIn("text/css", headers.get("Content-Type", ""))


# --------------------------------------------------------------------------- #
# Case 19 — the vendored bundle has NO bare `from "lit"` specifier
# --------------------------------------------------------------------------- #
class TestNoBareLitImport(_PageServer):
    def test_aegis_bundle_has_no_bare_lit_import(self):
        status, headers, js = self._get("/static/aegis/aegis.js")
        self.assertEqual(status, 200)
        self.assertIn("javascript", headers.get("Content-Type", ""))

        # a bare specifier the browser can't resolve: from "lit" / 'lit' / "lit/..."
        bare = re.findall(r"""from\s+['"]lit['"]""", js)
        bare_sub = re.findall(r"""from\s+['"]lit/[^'"]*['"]""", js)
        # also catch dynamic import("lit") / import('lit/...')
        dyn = re.findall(r"""import\(\s*['"]lit(?:/[^'"]*)?['"]\s*\)""", js)

        self.assertEqual(
            bare, [],
            "found %d bare `from \"lit\"` specifier(s) — Lit was NOT inlined; the "
            "module graph would 404 in the browser" % len(bare),
        )
        self.assertEqual(bare_sub, [],
                         "found %d bare `from \"lit/...\"` specifier(s)" % len(bare_sub))
        self.assertEqual(dyn, [],
                         "found %d bare dynamic import(\"lit\") call(s)" % len(dyn))


# --------------------------------------------------------------------------- #
# Case 20 — theme-swap via Playwright (OPTIONAL; skips cleanly if unavailable)
# --------------------------------------------------------------------------- #
class TestThemeSwap(_PageServer):
    def _playwright_or_skip(self):
        try:
            from playwright.sync_api import sync_playwright  # noqa: F401
        except Exception as exc:
            self.skipTest("Playwright not installed (%s) — theme-swap skipped" % exc)
        return __import__("playwright.sync_api", fromlist=["sync_playwright"]).sync_playwright

    def test_theme_swap_recolors_and_stamps_html(self):
        sync_playwright = self._playwright_or_skip()
        try:
            pw = sync_playwright().start()
        except Exception as exc:
            self.skipTest("Playwright runtime unavailable (%s)" % exc)
            return
        browser = None
        try:
            try:
                browser = pw.chromium.launch(headless=True)
            except Exception as exc:
                self.skipTest("No Chromium browser binary (%s) — run "
                              "`playwright install chromium`" % exc)
                return
            page = browser.new_page()
            page.goto(self.base_url, wait_until="networkidle")

            # the aegis bundle must register its elements before we can swap
            page.wait_for_function(
                "() => !!customElements.get('ae-select')", timeout=8000)

            # read a token BEFORE the swap (default boot stamp is crucible/dark)
            before = page.evaluate(
                "() => getComputedStyle(document.documentElement)"
                ".getPropertyValue('--ae-color-bg').trim()")

            # swap to a deliberately different brand via the live applyTheme API,
            # exactly as theme.js would on an ae-change event.
            page.evaluate(
                """async () => {
                    const m = await import('/static/aegis/aegis.js');
                    m.applyTheme({ theme: 'metro', variant: 'light' });
                }""")
            page.wait_for_function(
                "() => document.documentElement.getAttribute('data-theme') === 'metro'",
                timeout=5000)

            after = page.evaluate(
                "() => getComputedStyle(document.documentElement)"
                ".getPropertyValue('--ae-color-bg').trim()")

            self.assertEqual(
                page.evaluate("() => document.documentElement.getAttribute('data-theme')"),
                "metro")
            self.assertTrue(before, "--ae-color-bg should resolve before the swap")
            self.assertTrue(after, "--ae-color-bg should resolve after the swap")
            self.assertNotEqual(before, after,
                                "swapping crucible/dark -> metro/light must recolor "
                                "--ae-color-bg (the theme layer is live)")
        finally:
            if browser is not None:
                browser.close()
            pw.stop()


if __name__ == "__main__":
    unittest.main()
