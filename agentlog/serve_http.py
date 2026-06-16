#!/usr/bin/env python3
"""
serve_http — the stdlib http.server layer of `agentlog serve` (the histograph).

NO business logic lives here. Every request re-reads the ledger + epics from scratch
(stateless, exactly like the CLI: each `agentlog` run re-reads ~/.agent-histograph/*.jsonl)
and delegates ALL derivation to serve_state / serve_epics. The handler only routes,
serves the vendored static assets + the page shell, and sets status codes / content
types.

Routes:
  GET  /                 -> histograph/index.html (page shell)
  GET  /api/state        -> serve_state.build_state(...)              (application/json)
  GET  /api/epics        -> {"epics": serve_epics.list_epics(...)}    (application/json)
  GET  /app.css|/app.js|/render.js|/theme.js|/markers.css|/index.html -> histograph/<file>
  GET  /static/**        -> vendored aegis assets, PATH-TRAVERSAL GUARDED
  POST /api/focus        -> persist focus {"terminalId": ...}; 200 {"ok": true}
  POST /api/dismiss      -> close out a lane (hidden until new work); 200 {"ok": true}
  POST /api/undismiss    -> restore a dismissed lane immediately; 200 {"ok": true}
  *                      -> 404 {"error": "not found"}

Path-traversal guard: a /static/** request is resolved with os.path.realpath and
MUST stay under STATIC_ROOT (realpath startswith STATIC_ROOT + sep); anything that
escapes is rejected 403 — no file outside the static tree is ever served.

Fail-open: a derivation exception while building /api/state is caught and degraded to
a cold envelope rather than a 500, so a single bad session can never take the board down.
"""
import os
import json
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

import agentlog_read as R
import serve_state as S
import serve_epics as E

_HERE = os.path.dirname(os.path.abspath(__file__))
HISTOGRAPH_ROOT = os.path.join(_HERE, "histograph")
STATIC_ROOT = os.path.realpath(os.path.join(HISTOGRAPH_ROOT, "static"))

# the only POST payload is a tiny {"terminalId": "..."} — cap the accepted body so a
# bogus Content-Length can neither buffer gigabytes into RAM nor (with a stalled read)
# park a worker thread waiting for bytes that never arrive.
_MAX_BODY_BYTES = 64 * 1024

# served from histograph/ at the top level (the thin renderer + its styles)
_PAGE_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/app.css": "app.css",
    "/app.js": "app.js",
    "/render.js": "render.js",
    "/theme.js": "theme.js",
    "/markers.css": "markers.css",
}

_CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json; charset=utf-8",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


def _content_type(path):
    _, ext = os.path.splitext(path)
    return _CONTENT_TYPES.get(ext.lower(), "application/octet-stream")


# --------------------------------------------------------------------------- #
# state assembly (re-read every request — stateless, like the CLI)
# --------------------------------------------------------------------------- #
def _state_payload(now_epoch=None):
    """Build the /api/state dict. Fail-open: any unexpected error degrades to a cold
    envelope (terminals:[] + focus:null) rather than raising a 500."""
    try:
        led = R.Ledger.from_dir(A_dir())
        epics = E.list_epics(E.load(), led, now_epoch=now_epoch)
        focus_tid = E.load_focus()
        dismissed = E.load_dismissed()
        return S.build_state(led, epics, now_epoch=now_epoch,
                             focus_terminal_id=focus_tid, dismissed=dismissed)
    except Exception:
        # per-lane bad data is already isolated inside build_state (it drops one lane);
        # reaching here means the ENVELOPE scaffolding itself threw — a real bug, not a
        # bad-data condition. Log it before degrading so a state-assembly regression
        # leaves a diagnostic trail instead of presenting as a silently-empty board.
        R.A.log("serve /api/state degraded to cold envelope: %s"
                % traceback.format_exc().replace("\n", " | "))
        now = time.time() if now_epoch is None else now_epoch
        return {"generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
                "terminals": [], "focus": None}


def _epics_payload(now_epoch=None):
    try:
        led = R.Ledger.from_dir(A_dir())
        return {"epics": E.list_epics(E.load(), led, now_epoch=now_epoch)}
    except Exception:
        R.A.log("serve /api/epics degraded to empty: %s"
                % traceback.format_exc().replace("\n", " | "))
        return {"epics": []}


def A_dir():
    """The live AGENTLOG_DIR (env-overridable; resolved at call time for tests)."""
    return R.A.AGENTLOG_DIR


# --------------------------------------------------------------------------- #
# the handler
# --------------------------------------------------------------------------- #
class HistographHandler(BaseHTTPRequestHandler):
    server_version = "agentlog-histograph/0.1"
    # socket read timeout: BaseHTTPRequestHandler.setup() applies this to the
    # connection, so a client that declares a Content-Length but stalls mid-body
    # can't park a worker thread indefinitely (ThreadingHTTPServer spawns one thread
    # per connection — an unbounded stall would otherwise exhaust threads/sockets).
    timeout = 15

    # silence the default per-request stderr logging (the CLI prints its own banner)
    def log_message(self, fmt, *args):
        pass

    # ---- response helpers ----
    def _send_security_headers(self):
        """Emit the page's own security headers. This is the ONLY CSP that governs
        the histograph page: when the page is loaded in the Histograph desktop
        wrapper (a Tauri webview navigated to this loopback origin), Tauri's
        compile-time CSP applies only to its bundled assets, NOT to a remote-served
        page — so the server is the sole place that can harden it. The page renders
        ledger-derived text via textContent (never innerHTML), and connect-src
        closes the exfil path even if that discipline ever slipped.

        connect-src ALSO whitelists the Tauri IPC transport (`ipc:` and, on Windows,
        `http://ipc.localhost`). Tauri 2's invoke() POSTs to that custom-protocol
        origin via fetch(), which connect-src governs — with a bare `'self'` the
        desktop wrapper's window controls (pin / minimize / close) were silently
        CSP-blocked on every call (Tauri falls back to postMessage, but only after a
        per-load console warning). These two sources are inert in a plain browser
        (nothing serves them) and add no external-exfil reach, so the lock holds for
        browser mode too. Mirrors the bundled-splash CSP in tauri.conf.json.

        script/style 'unsafe-inline' is conceded for the in-page FOUC theme guard
        and JS-set inline styles; the load-bearing locks are connect/object/base/
        frame-ancestors."""
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
            "font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; "
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; "
            "form-action 'none'",
        )
        self.send_header("X-Content-Type-Options", "nosniff")

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._send_security_headers()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _send_bytes(self, data, content_type, status=200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        # local dev surface served fresh from disk each request — never let the
        # browser cache stale app JS/CSS or vendored assets across edits.
        self.send_header("Cache-Control", "no-store")
        self._send_security_headers()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _not_found(self):
        self._send_json({"error": "not found"}, status=404)

    def _serve_file(self, abspath, status=200):
        try:
            with open(abspath, "rb") as f:
                data = f.read()
        except FileNotFoundError:
            return self._not_found()
        except Exception:
            # a non-missing read error (permission, I/O, a dir handed in) -> 500, but
            # log what actually failed so it isn't an opaque diagnostic dead end.
            R.A.log("serve file read error for %r: %s"
                    % (abspath, traceback.format_exc().replace("\n", " | ")))
            return self._send_json({"error": "read error"}, status=500)
        return self._send_bytes(data, _content_type(abspath), status=status)

    # ---- GET ----
    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/state":
            return self._send_json(_state_payload())
        if path == "/api/epics":
            return self._send_json(_epics_payload())

        if path in _PAGE_FILES:
            return self._serve_file(os.path.join(HISTOGRAPH_ROOT, _PAGE_FILES[path]))

        if path.startswith("/static/"):
            return self._serve_static(path[len("/static/"):])

        return self._not_found()

    def do_HEAD(self):
        return self.do_GET()

    # ---- POST ----
    # state-mutating POST routes and the persistence action each performs. All share
    # the same CSRF/origin guard, body cap, and {"terminalId": "..."} payload shape.
    _POST_ROUTES = ("/api/focus", "/api/dismiss", "/api/undismiss")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path not in self._POST_ROUTES:
            return self._not_found()
        # reject cross-site writes: these are unauthenticated state-mutating endpoints
        # on a localhost bind, so any local web page could otherwise fetch()-flip the
        # persisted focus/dismissal state via CSRF. An Origin from anything but our own
        # loopback origins is forbidden; same-origin requests (and non-browser clients
        # like curl/the test harness, which send no Origin) are allowed.
        origin = self.headers.get("Origin")
        if origin and not origin.startswith(("http://127.0.0.1", "http://localhost",
                                             "http://[::1]")):
            return self._send_json({"error": "forbidden"}, status=403)
        # cap the declared body BEFORE reading: the only legitimate payload is a tiny
        # {"terminalId": "..."} (~40 bytes). A bogus Content-Length would otherwise let
        # a client make rfile.read() either buffer gigabytes into RAM or block the
        # worker thread waiting for bytes that never arrive (slow-loris). 64 KiB is far
        # above any honest payload and bounds both failure modes.
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            return self._send_json({"error": "bad request"}, status=400)
        if length < 0 or length > _MAX_BODY_BYTES:
            return self._send_json({"error": "payload too large"}, status=413)
        try:
            raw = self.rfile.read(length) if length else b""
            data = json.loads(raw.decode("utf-8")) if raw.strip() else {}
        except Exception:
            return self._send_json({"error": "bad request"}, status=400)
        tid = data.get("terminalId") if isinstance(data, dict) else None
        if not isinstance(tid, str) or not tid:
            return self._send_json({"error": "terminalId required"}, status=400)

        if path == "/api/focus":
            E.save_focus(tid)
        elif path == "/api/dismiss":
            # stamp the dismissal now; serve_state hides the lane until it logs work
            # newer than this (the "returns on new work" contract).
            E.dismiss_terminal(tid, time.time())
        else:  # /api/undismiss — restore a lane immediately.
            E.undismiss_terminal(tid)
        return self._send_json({"ok": True, "terminalId": tid})

    # ---- static with the path-traversal guard ----
    def _serve_static(self, rel):
        """Serve a file under STATIC_ROOT. The resolved real path MUST stay under
        STATIC_ROOT or the request is rejected 403 — this is the only thing standing
        between a `/static/../../secret` request and a file disclosure."""
        # reject obvious traversal tokens early (covers %2f-decoded ../ too, since we
        # already unquoted in do_GET)
        rel = rel.replace("\\", "/")
        if ".." in rel.split("/"):
            return self._send_json({"error": "forbidden"}, status=403)
        candidate = os.path.realpath(os.path.join(STATIC_ROOT, rel))
        root = STATIC_ROOT + os.sep
        if candidate != STATIC_ROOT and not candidate.startswith(root):
            return self._send_json({"error": "forbidden"}, status=403)
        if not os.path.isfile(candidate):
            return self._not_found()
        return self._serve_file(candidate)


# --------------------------------------------------------------------------- #
# server lifecycle
# --------------------------------------------------------------------------- #
def make_server(host="127.0.0.1", port=8080):
    """Construct (but do not start) the ThreadingHTTPServer. port=0 -> OS-assigned
    ephemeral port (the test harness reads it back from server_address)."""
    return ThreadingHTTPServer((host, port), HistographHandler)


def run_server(port=8080, host="127.0.0.1", open_browser=True):
    """Start the histograph server and serve forever (blocking). Opens the default
    browser at the bound URL unless open_browser is False. Returns the server's exit
    code (0) after a clean shutdown / KeyboardInterrupt."""
    httpd = make_server(host=host, port=port)
    bound_port = httpd.server_address[1]
    url = "http://%s:%d/" % (host, bound_port)
    print("agentlog histograph serving at %s  (Ctrl-C to stop)" % url)
    if open_browser:
        try:
            import webbrowser
            webbrowser.open(url)
        except Exception:
            pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down…")
    finally:
        try:
            httpd.shutdown()
        except Exception:
            pass
        httpd.server_close()
    return 0
