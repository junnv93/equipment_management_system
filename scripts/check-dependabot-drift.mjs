#!/usr/bin/env node
/**
 * Pre-install supply-chain drift guard.
 *
 * Enforces two invariants on root `package.json` `pnpm.overrides`:
 *
 *   (1) Offline check (always runs) — every override value must be a caret
 *       range (`^x.y.z`) or an exact version (`x.y.z`). `>=` / `>` / `*` /
 *       `latest` are rejected because they allow uncontrolled major-version
 *       integration during transitive hoisting (we measured this happen with
 *       `jws: '>=3.2.3'` silently hoisting to 4.x).
 *
 *   (2) Online check (best-effort, requires `gh` CLI) — fetches open
 *       Dependabot alerts and warns if any REAL alert's package is missing
 *       from `pnpm.overrides`. This is informational only — the install is
 *       NOT blocked because false positives are possible (e.g. transitive
 *       package being addressed by another override).
 *
 * Exit codes:
 *   0 — pass (or only warnings)
 *   1 — at least one override violates check (1)
 *
 * Memory rule: [pnpm overrides는 caret으로 라인 잠금]
 *              [Dependabot 알림은 lockfile 실체부터]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const PKG = resolve(ROOT, 'package.json');

const VALID_RANGE = /^(?:\^[0-9]+\.[0-9]+\.[0-9]+|[0-9]+\.[0-9]+\.[0-9]+)(?:-[0-9A-Za-z.+-]+)?$/;
const FORBIDDEN_PREFIX = /^(?:>=?|<=?|~|\*|x|latest)/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ── Check 1 ───────────────────────────────────────────────────────────────
let pkg;
try {
  pkg = readJson(PKG);
} catch (err) {
  console.error(`✖ check-dependabot-drift: cannot read ${PKG}: ${err.message}`);
  process.exit(1);
}

const overrides = pkg?.pnpm?.overrides ?? {};
const offenders = [];

for (const [name, value] of Object.entries(overrides)) {
  if (typeof value !== 'string') {
    offenders.push({ name, value, reason: 'override value must be a string range' });
    continue;
  }
  if (FORBIDDEN_PREFIX.test(value)) {
    offenders.push({
      name,
      value,
      reason: 'forbidden range operator — use caret (^x.y.z) for line-locking',
    });
    continue;
  }
  if (!VALID_RANGE.test(value)) {
    offenders.push({
      name,
      value,
      reason: 'unrecognised range — expected `^x.y.z` or `x.y.z`',
    });
  }
}

if (offenders.length > 0) {
  console.error(
    '\n✖ pnpm.overrides drift detected — caret line-locking required.\n'
  );
  for (const o of offenders) {
    console.error(`  - ${o.name}: ${JSON.stringify(o.value)} → ${o.reason}`);
  }
  console.error(
    '\nReason: open-ended ranges (>=, >) allow transitive hoist into the next major,\n' +
      'silently breaking compatibility. Pin to caret using the lockfile-installed major.minor.patch.\n' +
      'See verify-ssot Step 44.\n'
  );
  process.exit(1);
}

// ── Check 2 ───────────────────────────────────────────────────────────────
// Best-effort warning if `gh` is available. Never blocks install.
function tryGh(args) {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
  } catch {
    return null;
  }
}

const ghOut = tryGh([
  'api',
  'repos/{owner}/{repo}/dependabot/alerts?state=open&per_page=50',
  '--jq',
  '[.[] | {package: .dependency.package.name, severity: .security_advisory.severity}]',
]);

if (ghOut) {
  let alerts;
  try {
    alerts = JSON.parse(ghOut);
  } catch {
    alerts = [];
  }
  const overridePkgs = new Set(
    Object.keys(overrides).map((k) => k.replace(/@[0-9]+$/, ''))
  );
  const missing = alerts
    .filter((a) => ['high', 'critical', 'medium'].includes(a.severity))
    .filter((a) => !overridePkgs.has(a.package))
    .map((a) => `${a.package} [${a.severity}]`);

  if (missing.length > 0) {
    const unique = [...new Set(missing)];
    console.warn(
      '\n⚠ Dependabot alerts without pnpm.overrides coverage:\n' +
        unique.map((m) => `    - ${m}`).join('\n') +
        '\n  (informational; install not blocked. Run `pnpm audit:dependabot` for details.)\n'
    );
  }
}

process.exit(0);
