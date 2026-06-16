#!/usr/bin/env bash
# ===================================================================
#  Histograph desktop launcher (macOS / Linux)
#
#  Starts the frameless Tauri board, resolving the Python backend
#  (AGENTLOG_HOME) relative to THIS script. Ledger defaults to
#  ~/.agent-histograph (the histograph namespace); override by
#  exporting AGENTLOG_DIR first, e.g.
#      AGENTLOG_DIR="$HOME/.agentlog" ./run-histograph.sh
#  or a personal, gitignored run-histograph.local.sh.
#
#  Why run the binary directly (not `open` the .app)? A GUI app
#  launched via Finder/`open` on macOS does NOT inherit this shell's
#  environment, so AGENTLOG_DIR/AGENTLOG_HOME would be lost. Exec'ing
#  the binary inside the bundle inherits them.
# ===================================================================
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export AGENTLOG_HOME="$REPO/agentlog"
export AGENTLOG_DIR="${AGENTLOG_DIR:-$HOME/.agent-histograph}"

TARGET="$REPO/agentlog/desktop/src-tauri/target/release"
echo "[run-histograph] AGENTLOG_DIR  = $AGENTLOG_DIR"
echo "[run-histograph] AGENTLOG_HOME = $AGENTLOG_HOME"

if [[ "$(uname)" == "Darwin" ]]; then
  APP_BIN="$(ls -1d "$TARGET"/bundle/macos/*.app/Contents/MacOS/* 2>/dev/null | head -n1 || true)"
  [[ -z "${APP_BIN:-}" ]] && APP_BIN="$TARGET/histograph"
  [[ -x "$APP_BIN" ]] && exec "$APP_BIN"
else
  [[ -x "$TARGET/histograph" ]] && exec "$TARGET/histograph"
fi

echo "[run-histograph] No desktop build found under:"
echo "                 $TARGET"
echo "[run-histograph] Build it:        (cd agentlog/desktop && cargo tauri build)"
echo "[run-histograph] Or run unbuilt:  (cd agentlog/desktop && AGENTLOG_DIR=\"$AGENTLOG_DIR\" cargo tauri dev)"
exit 1
