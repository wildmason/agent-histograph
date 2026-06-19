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
import os, re, sys, json, tempfile, threading, unittest
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
        # isolate the in-app ledger-dir override to a throwaway config dir so the
        # machine's real ~/.histograph choice can't repoint the server off self.tmp.
        self._cfg = tempfile.mkdtemp()
        self._saved_cfg = os.environ.get("HISTOGRAPH_CONFIG_DIR")
        os.environ["HISTOGRAPH_CONFIG_DIR"] = self._cfg
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
        if self._saved_cfg is None:
            os.environ.pop("HISTOGRAPH_CONFIG_DIR", None)
        else:
            os.environ["HISTOGRAPH_CONFIG_DIR"] = self._saved_cfg

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
                    "freshnessTone", "story", "epic", "annotation", "focused",
                    "statusLine"):
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

    def _iso_ago(self, secs):
        import datetime
        return (datetime.datetime.now().astimezone()
                - datetime.timedelta(seconds=secs)).isoformat()

    def _write_lanes(self, cps, acts):
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            for c in cps:
                f.write(json.dumps(c) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "w", encoding="utf-8") as f:
            for a in acts:
                f.write(json.dumps(a) + "\n")

    def test_focus_is_sticky_and_does_not_follow_a_newer_lane(self):
        # Regression (Matt: "the active terminal changes without my intervention" with two
        # lanes both being worked). Without a pin the default focus was re-derived as the
        # most-recently-active lane EVERY poll, so working in the other lane stole focus.
        # Once auto-picked it must persist and stay put until the user picks another.
        import serve_state as S
        tA, tB = S.terminal_id("laneA"), S.terminal_id("laneB")
        # A worked 120s ago, B 60s ago -> B is the most-recently-active lane.
        self._write_lanes([_cp("laneA", self._iso_ago(120)), _cp("laneB", self._iso_ago(60))],
                          [_act("laneA", self._iso_ago(120)), _act("laneB", self._iso_ago(60))])
        focus1 = json.loads(self._get("/api/state")[2])["focus"]["terminalId"]
        self.assertEqual(focus1, tB, "first poll auto-picks the most-recently-active lane")
        self.assertEqual(E.load_focus(), tB, "the auto-pick is persisted (sticky)")
        # A now does fresh work and becomes the most-recently-active lane.
        self._write_lanes([_cp("laneA", self._iso_ago(120)), _cp("laneB", self._iso_ago(60))],
                          [_act("laneA", self._iso_ago(120)), _act("laneB", self._iso_ago(60)),
                           _act("laneA", self._iso_ago(1))])
        focus2 = json.loads(self._get("/api/state")[2])["focus"]["terminalId"]
        self.assertEqual(focus2, tB, "focus stays on B; it must NOT jump to the newer A")

    def test_explicit_focus_overrides_stickiness(self):
        # the user can still switch: a POST /api/focus wins over the persisted auto-pick
        # and is itself honored on the next poll.
        import serve_state as S
        tA, tB = S.terminal_id("laneA"), S.terminal_id("laneB")
        self._write_lanes([_cp("laneA", self._iso_ago(120)), _cp("laneB", self._iso_ago(60))],
                          [_act("laneA", self._iso_ago(120)), _act("laneB", self._iso_ago(60))])
        self._get("/api/state")                       # auto-picks + persists B
        self._post("/api/focus", {"terminalId": tA})  # user clicks A
        focus = json.loads(self._get("/api/state")[2])["focus"]["terminalId"]
        self.assertEqual(focus, tA, "an explicit click overrides the sticky auto-pick")
        self.assertEqual(E.load_focus(), tA)

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
# Ledger directory — /api/state ledger block, GET /api/ledger, POST /api/ledger-dir.
# This is the fix for "double-clicked the exe -> read the empty default -> nothing
# rendered": the board can name the dir it reads and switch it live.
# --------------------------------------------------------------------------- #
class TestLedgerApi(_Server):
    def test_api_state_carries_ledger_block(self):
        status, _, body = self._get("/api/state")
        self.assertEqual(status, 200)
        led = json.loads(body).get("ledger")
        self.assertIsInstance(led, dict)
        self.assertEqual(os.path.abspath(led["dir"]), os.path.abspath(self.tmp))
        self.assertTrue(led["exists"])
        self.assertGreaterEqual(led["sessions"], 1)   # the seeded live lane
        self.assertIn(led["source"], ("default", "env", "override"))

    def test_api_ledger_envelope_shape(self):
        status, _, body = self._get("/api/ledger")
        self.assertEqual(status, 200)
        data = json.loads(body)
        for key in ("current", "source", "default", "candidates"):
            self.assertIn(key, data)
        self.assertIsInstance(data["candidates"], list)

    def test_post_ledger_dir_switches_active_read_then_resets(self):
        # a second populated ledger dir, distinct from the seeded self.tmp
        other = tempfile.mkdtemp()
        os.makedirs(os.path.join(other, "state"), exist_ok=True)
        fresh = A.now_iso()
        with open(os.path.join(other, "checkpoints.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_cp("other1", fresh, project="Other")) + "\n")
        with open(os.path.join(other, "activity.jsonl"), "w", encoding="utf-8") as f:
            f.write(json.dumps(_act("other1", fresh)) + "\n")

        st, resp = self._post("/api/ledger-dir", {"dir": other})
        self.assertEqual(st, 200)
        self.assertEqual(os.path.abspath(json.loads(resp)["dir"]), os.path.abspath(other))

        # /api/state now reads the NEW dir (the whole point: no relaunch needed)
        _, _, body = self._get("/api/state")
        self.assertEqual(os.path.abspath(json.loads(body)["ledger"]["dir"]),
                         os.path.abspath(other))

        # reset clears the override -> back to the configured default (self.tmp)
        st, _ = self._post("/api/ledger-dir", {"reset": True})
        self.assertEqual(st, 200)
        _, _, body = self._get("/api/state")
        self.assertEqual(os.path.abspath(json.loads(body)["ledger"]["dir"]),
                         os.path.abspath(self.tmp))

    def test_post_ledger_dir_nonexistent_is_400_and_does_not_switch(self):
        bogus = os.path.join(self.tmp, "no-such-ledger-dir")
        st, resp = self._post("/api/ledger-dir", {"dir": bogus})
        self.assertEqual(st, 400)
        self.assertIn("error", json.loads(resp))
        # the board still reads the original dir — a typo can't strand it
        _, _, body = self._get("/api/state")
        self.assertEqual(os.path.abspath(json.loads(body)["ledger"]["dir"]),
                         os.path.abspath(self.tmp))

    def test_post_ledger_dir_cross_site_origin_forbidden(self):
        url = "http://127.0.0.1:%d/api/ledger-dir" % self.port
        data = json.dumps({"dir": self.tmp}).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              "Origin": "http://evil.example.com"})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                code = r.status
        except urllib.error.HTTPError as e:
            code = e.code
        self.assertEqual(code, 403)


# --------------------------------------------------------------------------- #
# UI settings persistence — theme/scheme/zoom survive a close/reopen even though the
# desktop app's ephemeral-port origin wipes localStorage each launch (they persist
# server-side and are injected into the page shell for a FOUC-free boot).
# --------------------------------------------------------------------------- #
class TestSettingsApi(_Server):
    def test_get_settings_empty_by_default(self):
        st, _, body = self._get("/api/settings")
        self.assertEqual(st, 200)
        self.assertEqual(json.loads(body), {})

    def test_post_settings_persists_and_reflects(self):
        st, resp = self._post("/api/settings", {"theme": "metro", "variant": "dark", "zoom": 1.25})
        self.assertEqual(st, 200)
        self.assertEqual(json.loads(resp)["settings"]["theme"], "metro")
        _, _, body = self._get("/api/settings")
        p = json.loads(body)
        self.assertEqual(p["theme"], "metro")
        self.assertEqual(p["variant"], "dark")
        self.assertEqual(p["zoom"], 1.25)

    def test_partial_post_does_not_clobber(self):
        self._post("/api/settings", {"theme": "cinnabar", "variant": "light"})
        self._post("/api/settings", {"zoom": 1.5})
        p = json.loads(self._get("/api/settings")[2])
        self.assertEqual(p["theme"], "cinnabar")   # preserved across a zoom-only write
        self.assertEqual(p["zoom"], 1.5)

    def test_index_injects_saved_prefs_into_boot_script(self):
        self._post("/api/settings", {"theme": "cinnabar", "variant": "light"})
        st, headers, body = self._get("/")
        self.assertEqual(st, 200)
        self.assertIn("text/html", headers.get("Content-Type", ""))
        # the bare `null` sentinel is rewritten with the saved prefs object
        self.assertIn("window.__HG_PREFS__ = {", body)
        self.assertIn("cinnabar", body)
        self.assertNotIn("window.__HG_PREFS__ = null", body)

    def test_index_keeps_null_sentinel_when_no_prefs(self):
        st, _, body = self._get("/")
        self.assertEqual(st, 200)
        self.assertIn("window.__HG_PREFS__ = null", body)

    def test_post_settings_cross_site_origin_forbidden(self):
        url = "http://127.0.0.1:%d/api/settings" % self.port
        data = json.dumps({"theme": "metro"}).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              "Origin": "http://evil.example.com"})
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                code = r.status
        except urllib.error.HTTPError as e:
            code = e.code
        self.assertEqual(code, 403)
        self.assertEqual(json.loads(self._get("/api/settings")[2]), {})  # nothing persisted


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
# POST /api/annotate — one-line lane notes persist + reflect in /api/state
# --------------------------------------------------------------------------- #
class TestAnnotateEndpoint(_Server):
    def _terminal_id(self):
        _, _, body = self._get("/api/state")
        return json.loads(body)["terminals"][0]["id"]

    def _terminal(self, tid):
        _, _, body = self._get("/api/state")
        return next(t for t in json.loads(body)["terminals"] if t["id"] == tid)

    def test_annotate_persists_and_reflects_in_state(self):
        tid = self._terminal_id()
        note = "working on\nupdating codex to use new histograph features"
        status, body = self._post("/api/annotate", {"terminalId": tid,
                                                    "annotation": note})
        self.assertEqual(status, 200)
        resp = json.loads(body)
        self.assertTrue(resp["ok"])
        self.assertEqual(resp["annotation"],
                         "working on updating codex to use new histograph features")
        self.assertEqual(E.load_annotations(),
                         {tid: "working on updating codex to use new histograph features"})
        self.assertEqual(self._terminal(tid)["annotation"],
                         "working on updating codex to use new histograph features")

    def test_empty_annotation_clears(self):
        tid = self._terminal_id()
        self._post("/api/annotate", {"terminalId": tid, "annotation": "temporary"})
        status, body = self._post("/api/annotate", {"terminalId": tid, "annotation": ""})
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["annotation"], "")
        self.assertEqual(E.load_annotations(), {})
        self.assertEqual(self._terminal(tid)["annotation"], "")

    def test_annotate_requires_terminal_id_and_annotation(self):
        status, body = self._post("/api/annotate", {"annotation": "note"})
        self.assertEqual(status, 400)
        self.assertIn("terminalId", json.loads(body).get("error", ""))

        status, body = self._post("/api/annotate", {"terminalId": self._terminal_id()})
        self.assertEqual(status, 400)
        self.assertIn("annotation", json.loads(body).get("error", ""))


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


class TestProviderIcons(_Server):
    """The fleet-switcher provider marks are vendored SVGs (from Fireside) painted via CSS
    mask in markers.css. Guard that (a) each agent SVG serves 200 as image/svg+xml, and (b)
    EVERY `mask-image: url("static/...")` markers.css references resolves to a served 200 — so
    a renamed/missing icon can't silently degrade the chip to an empty colored box (the same
    asset-404 class of bug as the earlier /zoom.js miss, here for a CSS-referenced asset)."""

    def test_agent_svgs_serve_as_svg(self):
        for name in ("claude", "codex", "gemini"):
            status, headers, body = self._get("/static/agents/%s.svg" % name)
            self.assertEqual(status, 200, "%s.svg should serve 200" % name)
            self.assertIn("image/svg+xml", headers.get("Content-Type", ""))
            self.assertIn("<svg", body)
            self.assertIn("<path", body)

    def test_markers_css_mask_urls_all_resolve(self):
        status, _, css = self._get("/markers.css")
        self.assertEqual(status, 200)
        refs = re.findall(r'mask-image:\s*url\(["\']?([^"\')]+)["\']?\)', css)
        self.assertTrue(any("static/agents/" in r for r in refs),
                        "markers.css should reference the vendored agent marks via mask-image")
        for ref in refs:
            # markers.css is served at /markers.css, so a relative "static/..." → "/static/...".
            path = ref if ref.startswith("/") else "/" + ref.lstrip("./")
            st, _, _ = self._get(path)
            self.assertEqual(st, 200, "mask-image asset %s should serve 200 (got %d)" % (ref, st))


# --------------------------------------------------------------------------- #
# V1 — conditional /api/state: ETag + If-None-Match -> 304 when nothing changed,
# 200 + fresh ETag when the ledger changes. The 304 lets the client skip a full
# parse + re-render on idle polls WITHOUT ever freezing freshness (any change to
# the payload — including a freshness tick — flips the ETag).
# --------------------------------------------------------------------------- #
class TestStateConditional(_Server):
    def _get_with(self, path, headers):
        url = "http://127.0.0.1:%d%s" % (self.port, path)
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, dict(r.headers), r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read().decode("utf-8")

    def test_state_carries_an_etag(self):
        status, headers, _ = self._get("/api/state")
        self.assertEqual(status, 200)
        self.assertTrue(headers.get("ETag"), "/api/state must carry an ETag")

    def test_matching_if_none_match_yields_304_no_body(self):
        # first poll -> 200 + ETag; immediate second poll with that ETag -> 304 (the
        # ledger is unchanged and we're inside the same minute, so the payload-minus-
        # generatedAt is byte-identical).
        _, headers, _ = self._get("/api/state")
        etag = headers.get("ETag")
        status, h2, body = self._get_with("/api/state", {"If-None-Match": etag})
        self.assertEqual(status, 304)
        self.assertEqual(body, "")                       # 304 carries no body
        self.assertEqual(h2.get("ETag"), etag)           # echoes the validator

    def test_changed_ledger_busts_the_etag(self):
        _, headers, _ = self._get("/api/state")
        etag = headers.get("ETag")
        # append a NEW live session -> the derived terminals change -> ETag must differ
        # and a conditional GET must now return 200 with a body, not 304.
        fresh = A.now_iso()
        with open(os.path.join(self.tmp, "checkpoints.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps(_cp("live2", fresh, project="Second")) + "\n")
        with open(os.path.join(self.tmp, "activity.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps(_act("live2", fresh)) + "\n")
        status, h2, body = self._get_with("/api/state", {"If-None-Match": etag})
        self.assertEqual(status, 200)
        self.assertNotEqual(h2.get("ETag"), etag)
        self.assertIn("Second", body)                    # the new lane is in the payload

    def test_etag_is_stable_across_idle_polls_despite_generatedat(self):
        # two un-conditional polls return DIFFERENT generatedAt but the SAME ETag —
        # proving generatedAt is excluded from the validator (else 304 could never fire).
        _, h1, b1 = self._get("/api/state")
        _, h2, b2 = self._get("/api/state")
        self.assertEqual(h1.get("ETag"), h2.get("ETag"))
        # sanity: the bodies really do differ (generatedAt ticked) so the equal ETag is
        # meaningful, not a coincidence of identical payloads.
        ga1 = json.loads(b1)["generatedAt"]
        ga2 = json.loads(b2)["generatedAt"]
        self.assertTrue(ga1 and ga2)


class TestDigestApi(_Server):
    """GET /api/digest (#1): parses ?since, delegates to serve_digest, is a one-shot
    fetch (plain JSON, no ETag/304), and degrades to an empty shape — never a 500."""

    def test_digest_route_parses_since_and_delegates(self):
        status, headers, body = self._get("/api/digest?since=0")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers.get("Content-Type", ""))
        dig = json.loads(body)
        self.assertEqual(dig["since"], 0.0)            # echoed back
        self.assertIsInstance(dig["projects"], list)
        self.assertIn("totals", dig)
        self.assertIn("empty", dig)

    def test_digest_route_no_etag_and_no_store(self):
        status, headers, body = self._get("/api/digest?since=0")
        self.assertEqual(headers.get("Cache-Control"), "no-store")
        self.assertNotIn("ETag", headers)              # not on the conditional 304 path

    def test_digest_route_default_since_when_absent(self):
        status, headers, body = self._get("/api/digest")
        self.assertEqual(status, 200)
        dig = json.loads(body)
        self.assertGreater(dig["since"], 0)            # defaulted to a 24h window, not error

    def test_digest_route_degrades_on_error(self):
        orig = H.D.build_digest
        H.D.build_digest = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom"))
        try:
            status, headers, body = self._get("/api/digest?since=0")
        finally:
            H.D.build_digest = orig
        self.assertEqual(status, 200)                  # degraded, not 500
        self.assertTrue(json.loads(body)["empty"])


if __name__ == "__main__":
    unittest.main()
