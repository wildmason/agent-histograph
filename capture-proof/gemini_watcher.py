#!/usr/bin/env python3
"""Gemini CLI / Antigravity transcript watcher.

Tails the transcript.jsonl files produced by Gemini CLI and translates them
into the passive-fact and checkpoint records histograph expects.
Runs continuously out-of-band to provide passive capture.
"""

import os
import sys
import glob
import time
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import agentlog_common as A
import posttooluse as PT

HOME = os.path.expanduser("~")
# The default app data directory for Gemini CLI on Windows
BRAIN_DIR = os.path.join(HOME, ".gemini", "antigravity-cli", "brain")
STATE_FILE = os.path.join(A.STATE_DIR, "gemini_watcher_state.json")

def load_state():
    try:
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f)
    except Exception as e:
        A.log("gemini_watcher save_state error: %r" % e)

def get_tool_category(tool_name):
    """Map Gemini tools to Histograph tool classes."""
    if tool_name in ("run_command", "unsandboxed"):
        return "Bash"
    if tool_name in ("write_to_file", "multi_replace_file_content", "replace_file_content", "define_subagent"):
        return "Write"
    if tool_name in ("view_file", "list_dir", "read_url_content", "search_web", "grep_search"):
        return "Read"
    if tool_name in ("invoke_subagent", "manage_subagents"):
        return "Agent"
    if tool_name in ("send_message", "manage_task", "schedule"):
        return "Task"
    return tool_name

def process_line(session_id, line):
    try:
        rec = json.loads(line)
    except Exception:
        return

    ts = rec.get("created_at") or A.now_iso()
    step_type = rec.get("type")
    source = rec.get("source")
    cwd = os.path.join(BRAIN_DIR, session_id)

    # A USER_INPUT event from the explicit user acts as a session_start/resume signal
    if step_type == "USER_INPUT" and source == "USER_EXPLICIT":
        start_rec = {
            "type": "session_start",
            "host": "gemini",
            "session_id": session_id,
            "cwd": cwd,
            "project": "gemini-session",
            "ts": ts
        }
        A.append_jsonl(A.ACTIVITY, start_rec)

    # Tool calls -> tool_use activity for the live stream
    if "tool_calls" in rec:
        for call in rec["tool_calls"]:
            tname = call.get("name", "")
            args = call.get("args", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}

            mapped_tool = get_tool_category(tname)
            
            tool_rec = {
                "type": "tool_use",
                "host": "gemini",
                "session_id": session_id,
                "cwd": cwd,
                "tool": mapped_tool,
                "ts": ts
            }

            # Map arguments to target/command/paths
            if mapped_tool == "Bash":
                cmd = args.get("CommandLine", "")
                tool_rec["command"] = A.redact(str(cmd)[:PT._CMD_CAP]) if cmd else "bash"
            elif mapped_tool == "Write":
                paths = []
                for k in ("TargetFile", "AbsolutePath"):
                    if k in args:
                        paths.append(args[k])
                if paths:
                    tool_rec["paths"] = paths
                else:
                    tool_rec["target"] = A.redact(str(args)[:PT._TARGET_CAP])
            else:
                # Observation tool
                target = args.get("AbsolutePath") or args.get("DirectoryPath") or args.get("query") or args.get("Recipient") or tname
                tool_rec["target"] = A.redact(str(target)[:PT._TARGET_CAP])
            
            A.append_jsonl(A.ACTIVITY, tool_rec)

    # PLANNER_RESPONSE -> Intent/Next extraction and Checkpoints
    if step_type == "PLANNER_RESPONSE":
        thinking = rec.get("thinking", "")
        content = rec.get("content", "")
        next_action = None
        
        # Scrape intent and next sigils directly from content
        if content:
            intent = A.extract_intent(content)
            if intent:
                irec = {
                    "type": "intent",
                    "host": "gemini",
                    "session_id": session_id,
                    "cwd": cwd,
                    "title": intent["title"],
                    "why": intent["why"],
                    "ts": ts
                }
                # Dedup
                key = irec["title"] + "\\x1f" + irec["why"]
                if A.last_intent_key(session_id) != key:
                    A.append_jsonl(A.ACTIVITY, irec)
                    A.set_intent_key(session_id, key)

            next_action = A.extract_next(content)
            if next_action:
                nrec = {
                    "type": "next",
                    "host": "gemini",
                    "session_id": session_id,
                    "cwd": cwd,
                    "title": next_action["title"],
                    "why": next_action["why"],
                    "ts": ts
                }
                key = nrec["title"] + "\\x1f" + nrec["why"]
                if A.last_next_key(session_id) != key:
                    A.append_jsonl(A.ACTIVITY, nrec)
                    A.set_next_key(session_id, key)

        # Emit a lightweight checkpoint if thinking or content exists
        if thinking or content:
            ckpt = {
                "type": "checkpoint",
                "schema_version": "0.1",
                "host": "gemini",
                "session_id": session_id,
                "cwd": cwd,
                "summary": A.redact((content or thinking).replace("\\n", " ")[:200]),
                "touched_paths": [],
                "verification": [],
                "decisions": [],
                "risks": [],
                "asks": [],
                "next_action": next_action["title"] if next_action else "",
                "health_draft": {"topic": "", "decision": "", "reason": "", "human_involved": False},
                "checkpoint_id": f"ckpt_{session_id}_{ts.replace(':', '').replace('-', '').replace('T', '').replace('Z', '')}",
                "captured_at": ts
            }
            if thinking:
                ckpt["decisions"].append({
                    "topic": "Planner thought",
                    "choice": "Execute planned tools",
                    "rationale": A.redact(thinking[:1000]),
                    "alternatives": [],
                    "reversibility": "medium",
                    "confidence": "high",
                    "class": "none",
                    "materiality": "record",
                    "human_involved": False
                })
            A.append_jsonl(A.CHECKPOINTS, ckpt)

def watch_transcripts():
    A._ensure_dirs()
    state = load_state()
    
    pattern = os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl")
    A.log(f"gemini_watcher starting. Tailing {pattern}")
    
    while True:
        # Use glob to find all conversation transcripts
        files = glob.glob(pattern)
        changed = False
        
        for file_path in files:
            session_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(file_path))))
            
            try:
                size = os.path.getsize(file_path)
            except OSError:
                continue
                
            last_offset = state.get(file_path, 0)
            
            if size > last_offset:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        f.seek(last_offset)
                        for line in f:
                            if line.strip():
                                process_line(session_id, line.strip())
                        
                        state[file_path] = f.tell()
                        changed = True
                except Exception as e:
                    A.log(f"gemini_watcher error reading {file_path}: {e}")
            elif size < last_offset:
                # File was truncated/recreated (rare for transcripts but safe to handle)
                state[file_path] = 0
                changed = True
                
        if changed:
            save_state(state)
            
        time.sleep(1.5)

if __name__ == "__main__":
    try:
        watch_transcripts()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        A.log(f"gemini_watcher crashed: {e}")
