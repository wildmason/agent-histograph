#!/usr/bin/env python3
"""
agentlog — the histograph command-center entry point.

This is the standalone "agent histograph" extraction: ONLY the live-board surface
(`serve`) and the optional epic-roadmap management (`epic`). The research/gate
apparatus from the original control-plane project (status/since/brief/audit/
question/experiment-report/snapshot/health-drafts/…) is deliberately NOT here.

Every request re-reads `~/.agent-histograph/*.jsonl` from scratch (stateless, like the
original CLI); ALL derivation lives in serve_state / serve_epics. This file is
just argument parsing + I/O. The desktop wrapper (`desktop/`) spawns
`agentlog.py serve --port 0 --no-browser` and navigates a frameless webview to
the loopback URL, so the Python `serve_state` derivation stays the single source
of truth.

  serve                      run the histograph HTTP server (the live board)
  epic add|link|confirm|list manage the human-declared epic roadmap (epics.json)

Data dir: `~/.agent-histograph` by default; override with the `AGENTLOG_DIR` env var.
"""
import os
import sys
import time
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_read as R     # inserts capture-proof/ onto sys.path (agentlog_common + rubric live there)
import serve_epics as SE
import serve_http as SH


def _fmt_ts(epoch):
    """Local human time for the `epic list` header."""
    return time.strftime("%Y-%m-%d %H:%M", time.localtime(epoch))


# --------------------------------------------------------------------------- #
# serve — the histograph (live workstream board)
# --------------------------------------------------------------------------- #
def cmd_serve(args):
    """Start the histograph: a local HTTP server that renders the live workstream
    board. Reuses the read surface verbatim (every request re-reads
    ~/.agent-histograph/*.jsonl); ALL derivation lives in serve_state, so this is just I/O."""
    return SH.run_server(port=args.port, host=args.host,
                         open_browser=not args.no_browser)


# --------------------------------------------------------------------------- #
# epic — human-declared story groupings that give the histograph a roadmap band
# --------------------------------------------------------------------------- #
def cmd_epic_add(args):
    store = SE.load()
    epic = SE.add_epic(store, args.title, args.project)
    SE.save(store)
    print("epic added: %s" % epic["id"])
    print("  title:     %s" % epic["title"])
    print("  project:   %s" % (epic["project"] or "—"))
    print("  integrity: %s  (run `agentlog epic confirm %s` to human-confirm)"
          % (epic["integrity"], epic["id"]))
    return 0


def cmd_epic_link(args):
    store = SE.load()
    epic = SE.link_story(store, args.epic_id, args.story_id, index=args.index)
    if epic is None:
        print("no such epic: %s" % args.epic_id)
        return 1
    SE.save(store)
    pos = ("at index %d" % args.index) if args.index is not None else "at end"
    print("linked %s -> %s (%s)" % (args.story_id, epic["id"], pos))
    print("  stories now: %s" % ", ".join(epic["stories"]))
    return 0


def cmd_epic_confirm(args):
    store = SE.load()
    epic = SE.confirm_epic(store, args.epic_id, new_title=args.title)
    if epic is None:
        print("no such epic: %s" % args.epic_id)
        return 1
    SE.save(store)
    print("confirmed %s -> integrity=%s" % (epic["id"], epic["integrity"]))
    if args.title:
        print("  retitled: %s" % epic["title"])
    return 0


def cmd_epic_list(args):
    led = R.Ledger.from_dir()
    rows = SE.list_epics(SE.load(), led)
    if not rows:
        print("(no epics declared — `agentlog epic add \"<title>\" --project <P>`)")
        return 0
    print("epics  (%s)" % _fmt_ts(time.time()))
    print()
    for e in rows:
        proj = (e["project"] or "?")[:14].ljust(14)
        prog = ("%d/%d" % (e["done"], e["total"])).ljust(6)
        integ = e["integrity"].ljust(15)
        print("%s  %s  %s  %s  %s" % (e["id"].ljust(28), proj, prog, integ, e["title"]))
        if e["stories"]:
            print("    stories: %s" % ", ".join(e["stories"]))
    return 0


# --------------------------------------------------------------------------- #
def build_parser():
    p = argparse.ArgumentParser(
        prog="agentlog",
        description="Agent histograph — the live workstream command center over ~/.agent-histograph JSONL")
    sub = p.add_subparsers(dest="cmd")

    s = sub.add_parser("serve", help="run the histograph: live workstream board in the browser")
    s.add_argument("--port", type=int, default=8080, help="port to bind (default 8080; 0 = ephemeral)")
    s.add_argument("--host", default="127.0.0.1", help="host/interface to bind (default 127.0.0.1)")
    s.add_argument("--no-browser", action="store_true", help="don't auto-open the browser")
    s.set_defaults(func=cmd_serve)

    s = sub.add_parser("epic", help="manage epics (story groupings that give the histograph a roadmap)")
    esub = s.add_subparsers(dest="epic_cmd")

    ea = esub.add_parser("add", help="declare a new epic (integrity=reconstructed until confirmed)")
    ea.add_argument("title", help="epic title, e.g. \"Protocol parity with competitors\"")
    ea.add_argument("--project", default=None, help="project this epic belongs to")
    ea.set_defaults(func=cmd_epic_add)

    el = esub.add_parser("link", help="link a story into an epic (ordered = roadmap order)")
    el.add_argument("epic_id", help="epic id (from `epic add`/`epic list`)")
    el.add_argument("story_id", help="story id to link")
    el.add_argument("--index", type=int, default=None, help="insert at this roadmap index (default: append)")
    el.set_defaults(func=cmd_epic_link)

    ec = esub.add_parser("confirm", help="flip an epic to integrity=human-confirmed")
    ec.add_argument("epic_id", help="epic id to confirm")
    ec.add_argument("--title", default=None, help="optionally retitle on confirm")
    ec.set_defaults(func=cmd_epic_confirm)

    ell = esub.add_parser("list", help="list epics with DERIVED done/total")
    ell.set_defaults(func=cmd_epic_list)

    s.set_defaults(func=lambda a: (s.print_help() or 0))
    return p


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
