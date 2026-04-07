#!/usr/bin/env node
/**
 * Classify open Dependabot alerts against actually-installed lockfile versions.
 *
 * Why this exists:
 *   GitHub matches Dependabot ranges against the lockfile's manifest path
 *   strings, not against the resolved semver. After PR #163 we removed three
 *   stale lockfiles whose entries had produced 53 phantom alerts. Even on the
 *   live `pnpm-lock.yaml`, GitHub occasionally reports alerts for versions
 *   that are no longer installed (e.g. lodash 4.17.x reported while only
 *   4.18.1 is in the tree). This script does the comparison the right way:
 *   parse lockfile → enumerate installed versions per package → semver-match
 *   each alert range → report REAL vs FALSE_POSITIVE counts.
 *
 * Usage:
 *   pnpm audit:dependabot                # all severities
 *   pnpm audit:dependabot --severity=high
 *   pnpm audit:dependabot --json         # machine-readable
 *
 * Auth: shells out to `gh api` so no token wiring needed locally. CI usage
 * needs `GH_TOKEN` env or pre-`gh auth login`.
 *
 * Exit codes:
 *   0 — no real vulnerabilities at the requested severity
 *   1 — at least one real vulnerability matched
 *   2 — runtime error (gh missing, lockfile missing, etc.)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import semver from 'semver';

const ROOT = process.cwd();
const LOCKFILE = resolve(ROOT, 'pnpm-lock.yaml');

const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const sevArg = args.find((a) => a.startsWith('--severity='));
const severityFilter = sevArg ? sevArg.split('=')[1] : null;

function die(msg, code = 2) {
  console.error(`✖ ${msg}`);
  process.exit(code);
}

// 1) Read installed versions from pnpm-lock.yaml -------------------------------
let lockText;
try {
  lockText = readFileSync(LOCKFILE, 'utf8');
} catch {
  die(`Cannot read ${LOCKFILE}. Run from repo root.`);
}

// Lockfile package entries look like "  lodash@4.18.1:" or "  '@scope/pkg@1.2.3':"
// Override entries (e.g. "  minimatch@3: ^3.1.4") are filtered out by semver.valid().
const ENTRY_RE = /^\s+'?(@?[a-z0-9._/-]+)@([0-9][^():\s']*)'?:/i;
const installed = new Map(); // pkg -> Set<version>
for (const line of lockText.split('\n')) {
  const m = ENTRY_RE.exec(line);
  if (!m) continue;
  const [, pkg, vRaw] = m;
  const v = vRaw.split('(')[0]; // strip pnpm peer suffix like 1.2.3(react@18.0.0)
  if (!semver.valid(v)) continue;
  if (!installed.has(pkg)) installed.set(pkg, new Set());
  installed.get(pkg).add(v);
}

// 2) Discover repo (owner/name) from git remote --------------------------------
function discoverRepo() {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const m = url.match(/[/:]([^/:]+)\/([^/]+?)(?:\.git)?$/);
    if (!m) return null;
    return `${m[1]}/${m[2]}`;
  } catch {
    return null;
  }
}
const repo = process.env.GITHUB_REPOSITORY || discoverRepo();
if (!repo) die('Cannot determine GitHub repo (set GITHUB_REPOSITORY env or check git remote).');

// 3) Fetch open alerts via gh api ---------------------------------------------
let alertsRaw;
try {
  alertsRaw = execFileSync(
    'gh',
    ['api', `repos/${repo}/dependabot/alerts`, '--paginate', '-q', '.[] | select(.state == "open")'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
} catch (e) {
  die(`gh api failed: ${e.message}. Is gh CLI installed and authenticated?`);
}

// gh paginate returns concatenated JSON objects, one per line via -q
const alerts = alertsRaw
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// 4) Classify each alert -------------------------------------------------------
function normalizeRange(range) {
  // GitHub format: ">= 4.0.0, <= 4.17.23"  →  ">=4.0.0 <=4.17.23"
  return range.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

const results = [];
for (const a of alerts) {
  const sev = a.security_advisory?.severity ?? 'unknown';
  if (severityFilter && sev !== severityFilter) continue;

  const pkg = a.dependency?.package?.name;
  const manifest = a.dependency?.manifest_path;
  const range = a.security_vulnerability?.vulnerable_version_range ?? '';
  const fix = a.security_vulnerability?.first_patched_version?.identifier ?? null;
  const ghsa = a.security_advisory?.ghsa_id;
  const summary = a.security_advisory?.summary ?? '';

  const versions = [...(installed.get(pkg) ?? [])].sort(semver.compare);
  let vulnerable = [];
  let parseError = null;
  if (manifest === 'pnpm-lock.yaml') {
    try {
      const r = normalizeRange(range);
      vulnerable = versions.filter((v) => semver.satisfies(v, r, { includePrerelease: true }));
    } catch (e) {
      parseError = e.message;
    }
  } // else: alert references a stale/foreign manifest → treat as STALE_MANIFEST

  let status;
  if (manifest !== 'pnpm-lock.yaml') status = 'STALE_MANIFEST';
  else if (parseError) status = 'PARSE_ERROR';
  else if (vulnerable.length === 0) status = 'FALSE_POSITIVE';
  else status = 'REAL';

  results.push({
    number: a.number,
    severity: sev,
    package: pkg,
    manifest,
    range,
    fix,
    ghsa,
    summary,
    installed: versions,
    vulnerable,
    status,
    parseError,
  });
}

// 5) Output --------------------------------------------------------------------
const buckets = { REAL: [], FALSE_POSITIVE: [], STALE_MANIFEST: [], PARSE_ERROR: [] };
for (const r of results) buckets[r.status].push(r);

if (wantJson) {
  console.log(JSON.stringify({ repo, totals: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])), results }, null, 2));
} else {
  console.log(`\nDependabot audit — ${repo}`);
  console.log(`Severity filter: ${severityFilter ?? 'all'}`);
  console.log(`Totals: REAL=${buckets.REAL.length}  FALSE_POSITIVE=${buckets.FALSE_POSITIVE.length}  STALE_MANIFEST=${buckets.STALE_MANIFEST.length}  PARSE_ERROR=${buckets.PARSE_ERROR.length}\n`);

  for (const [label, items] of Object.entries(buckets)) {
    if (items.length === 0) continue;
    console.log(`=== ${label} (${items.length}) ===`);
    for (const r of items) {
      console.log(`  #${r.number} [${r.severity}] ${r.package}  range="${r.range}"  fix=${r.fix ?? 'none'}`);
      if (r.status === 'REAL') console.log(`     vulnerable installed: ${r.vulnerable.join(', ')}`);
      else if (r.status === 'FALSE_POSITIVE') console.log(`     installed (none vulnerable): ${r.installed.join(', ') || '(no install)'}`);
      else if (r.status === 'STALE_MANIFEST') console.log(`     manifest: ${r.manifest}`);
      else if (r.status === 'PARSE_ERROR') console.log(`     parse error: ${r.parseError}`);
    }
    console.log();
  }
}

process.exit(buckets.REAL.length > 0 ? 1 : 0);
