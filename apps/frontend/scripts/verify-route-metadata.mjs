#!/usr/bin/env node
/**
 * verify-route-metadata.mjs — Phase 3 route SSOT invariant checker.
 *
 * Step 8a: routeMap labelKey → ko + en navigation.json 교차 검증
 *   routeMap의 모든 labelKey가 양쪽 locale navigation.json에 존재해야 함.
 *
 * Step 8b: page.tsx → routeMap 역방향 검증
 *   모든 page.tsx 파일이 routeMap 또는 EXCLUDED_ROUTE_PREFIXES에 있어야 함.
 *
 * 사용:
 *   node apps/frontend/scripts/verify-route-metadata.mjs
 *   node apps/frontend/scripts/verify-route-metadata.mjs --root /path/to/frontend
 *
 * 트리거 조건:
 *   apps/frontend/app 에 새 page.tsx 추가 / lib/navigation/route-metadata.ts 수정 /
 *   messages/{ko,en}/navigation.json 수정 시 자동 감지.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Default: script lives at apps/frontend/scripts/, root = apps/frontend/
const DEFAULT_FRONTEND_ROOT = join(__dirname, '..');

const rootArgIdx = process.argv.indexOf('--root');
const FRONTEND_ROOT =
  rootArgIdx !== -1 ? process.argv[rootArgIdx + 1] : DEFAULT_FRONTEND_ROOT;

// ── File paths ────────────────────────────────────────────────────────────────
const APP_DIR = join(FRONTEND_ROOT, 'app');
const ROUTE_METADATA_PATH = join(FRONTEND_ROOT, 'lib/navigation/route-metadata.ts');
const KO_NAV_PATH = join(FRONTEND_ROOT, 'messages/ko/navigation.json');
const EN_NAV_PATH = join(FRONTEND_ROOT, 'messages/en/navigation.json');

// ── Step 8b exclusions ────────────────────────────────────────────────────────
// Routes intentionally absent from routeMap. Each entry documents its reason.
// Add new entries here (not by removing the route from routeMap).
const EXCLUDED_ROUTE_PREFIXES = [
  // QR shortcode redirect — breadcrumb not applicable, just resolves managementNumber
  '/e/',
  // Visual regression fixture pages — not real user-facing routes
  '/__visual__/',
  '/visual-fixtures/',
  // PWA offline fallback — service worker target, no breadcrumb
  '/~offline',
  // Development-only help page — not part of production navigation
  '/help',
  // Legacy individual approval redirect pages — all redirect to /admin/approvals?tab=xxx
  // (comment in route-metadata.ts: "Legacy individual approval routes removed")
  '/admin/calibration-approvals',
  '/admin/calibration-factor-approvals',
  '/admin/calibration-plan-approvals',
  '/admin/equipment-approvals',
  '/admin/non-conformance-approvals',
  '/admin/return-approvals',
  '/admin/software-approvals',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

const IGNORED_DIRS = new Set(['node_modules', '.next', 'coverage', 'playwright-report', 'test-results']);

function scanPageFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      scanPageFiles(path, files);
    } else if (entry === 'page.tsx') {
      files.push(path);
    }
  }
  return files;
}

/**
 * Convert absolute page.tsx path → normalized route string.
 *
 * Rules:
 *   - Strip APP_DIR prefix
 *   - Strip Next.js route groups: (auth), (dashboard), etc.
 *   - Strip trailing /page.tsx (or standalone page.tsx for root)
 *   - Result: '/equipment/[id]/calibration-history', '/', '/login', …
 */
function pagePathToRoute(absPath) {
  const rel = relative(APP_DIR, absPath); // e.g. "(dashboard)/equipment/[id]/page.tsx"
  const withoutPage = rel.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  // Remove route group segments: (xxx)/
  const withoutGroups = withoutPage
    .replace(/\([^)]+\)\//g, '') // strip (group)/ in the middle
    .replace(/^\([^)]+\)$/, ''); // strip standalone (group) remainder
  return withoutGroups === '' ? '/' : `/${withoutGroups}`;
}

/**
 * Extract all labelKey short names from routeMap source.
 * Matches: labelKey: 'navigation.XXX'
 */
function extractLabelKeys(source) {
  const keys = new Set();
  for (const m of source.matchAll(/labelKey:\s*['"]navigation\.([^'"]+)['"]/g)) {
    keys.add(m[1]);
  }
  return keys;
}

/**
 * Extract all route path keys from routeMap object literal.
 * Matches: '\/path': {
 */
function extractRouteMapKeys(source) {
  const keys = new Set();
  for (const m of source.matchAll(/^\s+'(\/[^']*)'\s*:\s*\{/gm)) {
    keys.add(m[1]);
  }
  return keys;
}

/**
 * Collect top-level string-valued keys from a JSON object.
 * Skips nested objects (sections, layout, roles, …).
 */
function flatTopLevelStringKeys(obj) {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') keys.add(k);
  }
  return keys;
}

// ── Guard: required files ─────────────────────────────────────────────────────
for (const [label, path] of [
  ['app/', APP_DIR],
  ['route-metadata.ts', ROUTE_METADATA_PATH],
  ['ko/navigation.json', KO_NAV_PATH],
  ['en/navigation.json', EN_NAV_PATH],
]) {
  if (!existsSync(path)) {
    console.error(`[verify-route-metadata] FAIL — ${label} not found: ${path}`);
    process.exit(1);
  }
}

// ── Parse sources ─────────────────────────────────────────────────────────────
const routeMetaSrc = readText(ROUTE_METADATA_PATH);
const koNav = readJson(KO_NAV_PATH);
const enNav = readJson(EN_NAV_PATH);

const labelKeys = extractLabelKeys(routeMetaSrc);
const routeMapKeys = extractRouteMapKeys(routeMetaSrc);
const koKeys = flatTopLevelStringKeys(koNav);
const enKeys = flatTopLevelStringKeys(enNav);
const pageFiles = scanPageFiles(APP_DIR);

const findings = [];

// ── Step 8a: labelKey → navigation.json (both locales) ───────────────────────
for (const key of labelKeys) {
  if (!koKeys.has(key)) {
    findings.push(
      `[step-8a:ko] labelKey "navigation.${key}" missing from messages/ko/navigation.json`
    );
  }
  if (!enKeys.has(key)) {
    findings.push(
      `[step-8a:en] labelKey "navigation.${key}" missing from messages/en/navigation.json`
    );
  }
}

// ── Step 8b: page.tsx → routeMap ─────────────────────────────────────────────
for (const pageFile of pageFiles) {
  const route = pagePathToRoute(pageFile);

  const excluded = EXCLUDED_ROUTE_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) {
      // Trailing-slash prefix: match exact base or any sub-path
      return route === prefix.slice(0, -1) || route.startsWith(prefix);
    }
    // Exact or sub-path: match exact or starts with prefix/
    return route === prefix || route.startsWith(prefix + '/');
  });
  if (excluded) continue;

  if (!routeMapKeys.has(route)) {
    findings.push(
      `[step-8b] route "${route}" (${relative(FRONTEND_ROOT, pageFile)}) not in routeMap` +
        ` — add entry to lib/navigation/route-metadata.ts with a labelKey`
    );
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
if (findings.length > 0) {
  console.error('[verify-route-metadata] FAIL');
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}

// Informational: orphan keys in navigation.json not referenced by routeMap
const routeMapNavKeys = new Set([...labelKeys]);
const koOrphans = [...koKeys].filter((k) => !routeMapNavKeys.has(k)).sort();
const enOrphans = [...enKeys].filter((k) => !routeMapNavKeys.has(k)).sort();

const allOrphans = new Set([...koOrphans, ...enOrphans]);
if (allOrphans.size > 0) {
  console.log(
    `[verify-route-metadata] INFO: ${allOrphans.size} orphan navigation key(s) not in routeMap ` +
      `(dead i18n keys — cleanup optional): ${[...allOrphans].join(', ')}`
  );
}

console.log(
  `[verify-route-metadata] PASS` +
    ` (${routeMapKeys.size} routes, ${labelKeys.size} labelKeys, ${pageFiles.length} pages checked)`
);
