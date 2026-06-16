// Build step for the Histograph splash. There is NO framework here: the live UI
// is the histograph page served by the Python `agentlog serve` sidecar, which the
// Rust shell navigates to once it's ready. This only stages the tiny bundled
// splash (shown while the sidecar boots) into ui/dist/, which tauri.conf.json
// embeds via `frontendDist`.
//
// Run on every `cargo tauri build`/`dev` via beforeBuildCommand/beforeDevCommand,
// so the embedded splash can never go stale (the Wildmason §4 "empty
// beforeBuildCommand ships a stale UI" trap), and so the version-drift guard
// below runs as part of every build.
import { cpSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, 'src');
const dist = resolve(here, 'dist');

// --- version-drift guard (Best Practices §18.14): Cargo.toml, tauri.conf.json,
// and package.json versions MUST match, or the updater key / release breaks. Fail
// the build loudly here rather than shipping a silent drift. ---
const pkgVersion = JSON.parse(readFileSync(resolve(here, 'package.json'), 'utf8')).version;
const confVersion = JSON.parse(
  readFileSync(resolve(here, '..', 'src-tauri', 'tauri.conf.json'), 'utf8'),
).version;
const cargoToml = readFileSync(resolve(here, '..', 'src-tauri', 'Cargo.toml'), 'utf8');
const cargoVersion = (cargoToml.match(/^\s*version\s*=\s*"([^"]+)"/m) || [])[1];

if (pkgVersion !== confVersion || pkgVersion !== cargoVersion) {
  console.error(
    `[histograph-ui] version drift: package.json=${pkgVersion} ` +
      `tauri.conf.json=${confVersion} Cargo.toml=${cargoVersion} — they must match.`,
  );
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(src, dist, { recursive: true });

console.log(`[histograph-ui] staged splash -> ${dist} (v${pkgVersion})`);
