#!/usr/bin/env python3
"""
TDD smoke tests for serve_http.py — the stdlib http.server layer of `agentlog serve`.
Cases 14-17 of the frozen build plan:

  14. server starts on an EPHEMERAL port + GET /api/state returns the envelope shape.
  15. GET /api/epics returns done <= total for every epic.
  16. unknown route -> 404 with a JSON {"error": ...} body.
  17. static path-traversal (../../) is blocked (resolved path must stay under STATIC_ROOT).

The server is started on port 0 (OS-assigned) in a background thread against a tmp
AGENTLOG_DIR, hit over real HTTP via urllib, then shut down. No business logic is
re-tested here (that lives in test_serve_state/test_serve_epics) — this verifies
wiring, status codes, content types, the path-traversal guard, and the POST /api/focus
round-trip.

Run: python -m unittest test_serve_http -v   (or: python -m pytest test_serve_http.py -q)
"""
import os, sys, json, tempfile, threading, unittest
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R     # inserts capture-proof/ onto sys.path (agentlog_common lives there)
import agentlog_common as A
import serve_epics as E
import serve_http as H


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


class _Server(unittest.TestCase):
    """Spin a real server on an ephemeral port against a tmp AGENTLOG_DIR."""
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._saved = A.AGENTLOG_DIR
        A.AGENTLOG_DIR = self.tmp
        os.makedirs(os.path.join(self.tmp, "state"), exist_ok=True)
        # seed a tiny live ledger so /api/state has at least one terminal. The server
        # uses the REAL wall clock (now_epoch=None), so the seed must be fresh relative
        # to now (inside LIVE_WINDOW_SECS / under the idle floor) — stamp it ~1 min ago.
        fresh = A.now_iso()
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_cp("live1", fresh)) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_act("live1", fresh)) + "\n")
        # one epic so /api/epics has a row
        store = E.load()
        epic = E.add_epic(store, "Protocol parity", "Mortar")
        E.link_story(store, epic["id"], "st-a")
        E.link_story(store, epic["id"], "st-b")
        E.save(store)

        self.httpd = H.make_server(host="127.0.0.1", port=0)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        try:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.thread.join(timeout=5)        # join the serve_forever thread (no leaked daemon)
        except Exception:
            pass
        A.AGENTLOG_DIR = self._saved

    def _get(self, path):
        url = "http://127.0.0.1:%d%s" % (self.port, path)
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                body = r.read().decode("utf-8")
                return r.status, dict(r.headers), body
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read().decode("utf-8")

    def _post(self, path, payload):
        url = "http://127.0.0.1:%d%s" % (self.port, path)
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST",
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8")


# --------------------------------------------------------------------------- #
# Case 14 — server starts + /api/state envelope shape
# --------------------------------------------------------------------------- #
class TestApiState(_Server):
    def test_api_state_envelope_shape(self):
        status, headers, body = self._get("/api/state")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers.get("Content-Type", ""))
        data = json.loads(body)
        self.assertIn("generatedAt", data)
        self.assertIn("terminals", data)
        self.assertIn("focus", data)
        self.assertIsInstance(data["terminals"], list)
        self.assertTrue(data["terminals"])                       # the seeded lane
        t = data["terminals"][0]
        for key in ("id", "provider", "project", "status", "freshnessLabel",
                    "freshnessTone", "story", "epic", "focused", "statusLine"):
            self.assertIn(key, t)
        self.assertEqual(sum(1 for x in data["terminals"] if x["focused"]), 1)


# --------------------------------------------------------------------------- #
# Case 15 — /api/epics done <= total
# --------------------------------------------------------------------------- #
class TestApiEpics(_Server):
    def test_api_epics_done_le_total(self):
        status, headers, body = self._get("/api/epics")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers.get("Content-Type", ""))
        data = json.loads(body)
        self.assertIn("epics", data)
        self.assertTrue(data["epics"])
        for e in data["epics"]:
            self.assertIn("done", e)
            self.assertIn("total", e)
            self.assertLessEqual(e["done"], e["total"])
            self.assertEqual(e["total"], len(e["stories"]))


# --------------------------------------------------------------------------- #
# Case 16 — unknown route -> 404 JSON
# --------------------------------------------------------------------------- #
class TestNotFound(_Server):
    def test_unknown_route_is_404_json(self):
        status, headers, body = self._get("/api/does-not-exist")
        self.assertEqual(status, 404)
        self.assertIn("application/json", headers.get("Content-Type", ""))
        data = json.loads(body)
        self.assertIn("error", data)


# --------------------------------------------------------------------------- #
# Case 17 — static path-traversal blocked
# --------------------------------------------------------------------------- #
class TestStaticTraversal(_Server):
    def test_traversal_is_blocked(self):
        # try to escape STATIC_ROOT and read a sibling file
        for evil in ("/static/../serve_http.py",
                     "/static/..%2f..%2fserve_http.py",
                     "/static/../../agentlog.py"):
            status, headers, body = self._get(evil)
            self.assertIn(status, (400, 403, 404),
                          "traversal %s should be rejected, got %d" % (evil, status))
            self.assertNotIn("BaseHTTPRequestHandler", body)   # never leaked source

    def test_legit_static_path_resolves_or_404s_cleanly(self):
        # a normal static request must not error out the server (404 if absent is fine)
        status, _, _ = self._get("/static/aegis/aegis.js")
        self.assertIn(status, (200, 404))


# --------------------------------------------------------------------------- #
# POST /api/focus round-trip (persists + reflects in /api/state)
# --------------------------------------------------------------------------- #
class TestFocusPost(_Server):
    def test_post_focus_persists(self):
        status, _, body = self._get("/api/state")
        tid = json.loads(body)["terminals"][0]["id"]
        st, resp = self._post("/api/focus", {"terminalId": tid})
        self.assertEqual(st, 200)
        self.assertEqual(E.load_focus(), tid)

    def test_oversized_body_is_rejected_413_and_does_not_persist(self):
        # an over-cap declared Content-Length must be rejected BEFORE the body is read,
        # so a bogus length can neither buffer gigabytes nor (mid-stall) park a worker
        # thread. We send a >64 KiB payload with an honest Content-Length; the server
        # rejects it 413 and the focus is unchanged.
        url = "http://127.0.0.1:%d/api/focus" % self.port
        big = json.dumps({"terminalId": "x" * (70 * 1024)}).encode("utf-8")
        req = urllib.request.Request(url, data=big, method="POST",
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                code = r.status
        except urllib.error.HTTPError as e:
            code = e.code
        self.assertEqual(code, 413)
        self.assertIsNone(E.load_focus())   # nothing persisted from the rejected write

    def test_cross_site_origin_is_forbidden(self):
        # a cross-site Origin (a malicious tab fetch()-ing 127.0.0.1) must be rejected
        # 403 — /api/focus is an unauthenticated state-mutating endpoint on a localhost
        # bind. Same-origin / no-Origin (curl, the harness) requests are unaffected.
        url = "http://127.0.0.1:%d/api/focus" % self.port
        data = json.dumps({"terminalId": "term-evil"}).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              "Origin": "http://evil.example.com"})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                code = r.status
        except urllib.error.HTTPError as e:
            code = e.code
        self.assertEqual(code, 403)
        self.assertIsNone(E.load_focus())   # the cross-site write did not take effect

    def test_loopback_origin_is_allowed(self):
        # a same-origin loopback Origin is the legitimate browser case -> 200 + persists.
        status, _, body = self._get("/api/state")
        tid = json.loads(body)["terminals"][0]["id"]
        url = "http://127.0.0.1:%d/api/focus" % self.port
        data = json.dumps({"terminalId": tid}).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              "Origin": "http://127.0.0.1:%d" % self.port})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                code = r.status
        except urllib.error.HTTPError as e:
            code = e.code
        self.assertEqual(code, 200)
        self.assertEqual(E.load_focus(), tid)


# --------------------------------------------------------------------------- #
# Security headers — the CSP/nosniff contract the desktop wrapper depends on
# --------------------------------------------------------------------------- #
class TestSecurityHeaders(_Server):
    def _csp(self, path):
        status, headers, _ = self._get(path)
        return status, headers.get("Content-Security-Policy", ""), headers

    def test_csp_present_on_json_and_file_responses(self):
        # both response paths (_send_json and _send_bytes) must carry the headers —
        # the page shell (HTML) and the /api/* JSON are served by different helpers.
        for path in ("/api/state", "/", "/app.js"):
            status, csp, headers = self._csp(path)
            self.assertIn(status, (200, 404))
            self.assertTrue(csp, "no CSP on %s" % path)
            self.assertEqual(headers.get("X-Content-Type-Options", ""), "nosniff",
                             "missing nosniff on %s" % path)

    def test_csp_whitelists_tauri_ipc_transport(self):
        # load-bearing for the Histograph desktop wrapper: Tauri 2 invoke() POSTs to
        # the IPC custom protocol via fetch(), which connect-src governs. A bare
        # connect-src 'self' silently blocks every window-control command. If anyone
        # tightens this back to 'self' only, the pin/minimize/close buttons die — so
        # this test is the regression guard for that.
        _, csp, _ = self._csp("/api/state")
        connect = next((d.strip() for d in csp.split(";")
                        if d.strip().startswith("connect-src")), "")
        self.assertIn("'self'", connect)
        self.assertIn("ipc:", connect)
        self.assertIn("http://ipc.localhost", connect)

    def test_csp_keeps_the_exfil_and_clickjacking_locks(self):
        # the IPC allowance must not loosen the locks that actually matter: no plugin
        # objects, no framing, no <base> hijack, and crucially no wildcard/external
        # host in connect-src that would reopen the exfil path.
        _, csp, _ = self._csp("/api/state")
        self.assertIn("object-src 'none'", csp)
        self.assertIn("frame-ancestors 'none'", csp)
        self.assertIn("base-uri 'self'", csp)
        connect = next((d.strip() for d in csp.split(";")
                        if d.strip().startswith("connect-src")), "")
        # only 'self' + the two inert IPC sources — no "*", no https: scheme-wide,
        # no foreign host that a coerced fetch could exfiltrate to.
        self.assertNotIn("*", connect)
        self.assertNotIn("https:", connect)


# --------------------------------------------------------------------------- #
# POST /api/dismiss + /api/undismiss — close-out round-trip over real HTTP
# --------------------------------------------------------------------------- #
class TestDismissEndpoint(_Server):
    def _terminal_ids(self):
        _, _, body = self._get("/api/state")
        return [t["id"] for t in json.loads(body)["terminals"]]

    def test_dismiss_hides_then_undismiss_restores(self):
        ids = self._terminal_ids()
        self.assertTrue(ids)            # the seeded live lane is present
        tid = ids[0]

        status, body = self._post("/api/dismiss", {"terminalId": tid})
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(body)["ok"])
        # the seeded lane has no work newer than the dismissal -> gone from the board.
        self.assertNotIn(tid, self._terminal_ids())

        status, _ = self._post("/api/undismiss", {"terminalId": tid})
        self.assertEqual(status, 200)
        self.assertIn(tid, self._terminal_ids())

    def test_dismiss_requires_terminal_id(self):
        status, body = self._post("/api/dismiss", {})
        self.assertEqual(status, 400)
        self.assertIn("terminalId", json.loads(body).get("error", ""))


# --------------------------------------------------------------------------- #
# Regression guard — every root-level frontend asset the page imports MUST be in
# the serve_http allowlist. A module added to histograph/ but NOT registered 404s,
# and an ES-module import 404 takes the WHOLE graph down: app.js never executes,
# so the settings modal goes dead and polling never starts (the board stops
# painting lanes). This is the guard for zoom.js having shipped unregistered.
# --------------------------------------------------------------------------- #
class TestFrontendModulesServed(_Server):
    HG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "histograph")

    def _referenced_root_assets(self):
        import glob, re
        refs = set()
        # root-level ES imports across every JS module (`from "/x.js"` / `import "/x.js"`).
        # /static/** paths carry interior slashes so they never match — those are the
        # traversal-guarded static handler's job, covered elsewhere.
        for js in glob.glob(os.path.join(self.HG, "*.js")):
            with open(js, encoding="utf-8") as fh:
                src = fh.read()
            refs.update(re.findall(r'(?:from|import)\s+["\'](/[\w.\-]+\.js)["\']', src))
        # <script src="/x.js"> + <link href="/x.css"> in the page shell.
        with open(os.path.join(self.HG, "index.html"), encoding="utf-8") as fh:
            html = fh.read()
        refs.update(re.findall(r'<script[^>]+src=["\'](/[\w.\-]+\.js)["\']', html))
        refs.update(re.findall(r'<link[^>]+href=["\'](/[\w.\-]+\.css)["\']', html))
        return refs

    def test_every_referenced_root_asset_is_served_200(self):
        refs = self._referenced_root_assets()
        # non-tautological: assert the parse actually found the known entry points, so a
        # broken regex can't pass by finding nothing to check.
        self.assertIn("/app.js", refs)
        self.assertIn("/zoom.js", refs)
        broken = []
        for path in sorted(refs):
            status, _, _ = self._get(path)
            if status != 200:
                broken.append("%s -> %d" % (path, status))
        self.assertFalse(broken, "frontend assets that 404 (a JS one breaks the whole module graph): %s" % broken)


if __name__ == "__main__":
    unittest.main()
