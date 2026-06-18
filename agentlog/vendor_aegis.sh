#!/usr/bin/env bash
# Build-step #0 for `agentlog serve` (the histograph).
#
# Vendors Aegis v2 into histograph/static/aegis/ so a stdlib http.server can load it.
# WHY a re-bundle: the shipped aegis dist/aegis.js opens with `import {...} from "lit"`
# (a bare specifier) which a static file server can't resolve. We re-bundle with esbuild
# so Lit is INLINED (zero bare imports) and the file loads directly in the browser.
#
# Idempotent — re-run after any `git pull` / rebuild of aegis-v2.
set -euo pipefail

# Point AEGIS_V2_DIR at your local aegis-v2 checkout. The default assumes it sits
# beside this repo (../aegis-v2). NOTE: the vendored assets are already committed under
# histograph/static/aegis/, so adopters do NOT need this script or the Aegis source —
# it's a maintenance step for re-vendoring after an aegis-v2 change.
AEGIS="${AEGIS_V2_DIR:-../../aegis-v2}"
DST="$(cd "$(dirname "$0")" && pwd)/histograph/static/aegis"

[ -f "$AEGIS/src/index.ts" ] || { echo "ERROR: aegis-v2 not found at $AEGIS (set AEGIS_V2_DIR)"; exit 1; }
[ -x "$AEGIS/node_modules/.bin/esbuild" ] || { echo "ERROR: esbuild missing — run 'npm install' in $AEGIS"; exit 1; }

echo "[1/3] re-bundling aegis (Lit inlined)…"
( cd "$AEGIS" && node_modules/.bin/esbuild src/index.ts \
    --bundle --format=esm --platform=browser \
    --loader:.css=empty --outfile=dist/aegis.bundle.js >/dev/null )

# Guard the blocker: fail loudly if a bare import survived the bundle.
if grep -q 'from "lit"' "$AEGIS/dist/aegis.bundle.js"; then
  echo "ERROR: bundle still contains a bare \"lit\" import — would not load in a static server"; exit 1
fi

echo "[2/3] copying vendored assets → $DST"
mkdir -p "$DST/themes"
cp "$AEGIS/dist/aegis.bundle.js" "$DST/aegis.js"       # registration bundle + applyTheme/THEME_REGISTRY exports
cp "$AEGIS/dist/style.css"       "$DST/tokens.css"     # base tokens + @layer order (load FIRST)
cp "$AEGIS"/themes/*.css         "$DST/themes/"        # all scheme + brand + spectrum palettes

echo "[3/3] done — vendored $(ls "$DST/themes" | wc -l | tr -d ' ') theme files + aegis.js ($(du -h "$DST/aegis.js" | cut -f1)) + tokens.css"
