#!/usr/bin/env node
/**
 * measure-bundle.mjs — checkouts 라우트 번들 크기 독립 측정 + 증가분 경고
 *
 * check-bundle-size.mjs(stdin 기반, 전체 라우트 예산)의 보완 스크립트.
 * checkouts 라우트에 집중하여 8 kB 증가분 기준으로 경고를 출력한다.
 * bundle-baseline.json 형식을 check-bundle-size.mjs와 공유한다.
 *
 * 사용법:
 *   node scripts/measure-bundle.mjs           # 빌드 실행 → 측정 → baseline 저장
 *   node scripts/measure-bundle.mjs --no-build  # 기존 빌드 결과 재파싱 (빌드 스킵)
 *   node scripts/measure-bundle.mjs --compare   # baseline 대비 증가분 비교
 *   node scripts/measure-bundle.mjs --help      # 도움말
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const NEXT_DIR = resolve(ROOT, 'apps/frontend/.next');
const BASELINE_PATH = resolve(ROOT, 'scripts/bundle-baseline.json');

// checkouts 라우트 First Load JS 증가분 임계값
const INCREASE_THRESHOLD_KB = 8;

const isHelp = process.argv.includes('--help') || process.argv.includes('-h');
const isNoBuild = process.argv.includes('--no-build');
const isCompare = process.argv.includes('--compare');

// ─── 도움말 ────────────────────────────────────────────────────────────────

if (isHelp) {
  console.log(`
measure-bundle.mjs — checkouts 라우트 번들 크기 측정 + baseline 비교

사용법:
  node scripts/measure-bundle.mjs             빌드 실행 → checkouts 측정 → baseline 저장
  node scripts/measure-bundle.mjs --no-build  기존 .next/ 서버 파일 직접 측정 (빌드 스킵)
  node scripts/measure-bundle.mjs --compare   baseline 대비 증가분 비교 (빌드 포함)
  node scripts/measure-bundle.mjs --help      이 도움말

측정값:
  빌드 모드  — Next.js 빌드 stdout의 "First Load JS" (kB)
  --no-build — .next/server/app/checkouts/**/*.js gzip 크기 (kB)

경고 임계값: ${INCREASE_THRESHOLD_KB} kB 증가 시 ⚠️ 출력 후 exit 1
baseline 파일: scripts/bundle-baseline.json (check-bundle-size.mjs와 공유)

관련:
  pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --baseline
  → 전체 라우트 예산(250 kB) 검사 + baseline 저장
`);
  process.exit(0);
}

// ─── 빌드 실행 + stdout 파싱 ──────────────────────────────────────────────

function buildAndParse() {
  console.log('📦 pnpm --filter frontend run build 실행 중 (checkouts 크기 측정)...\n');
  let stdout = '';
  try {
    stdout = execSync('pnpm --filter frontend run build', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: 360_000,
    });
  } catch (err) {
    const msg = String(err.stderr ?? err.stdout ?? err.message);
    console.error('❌ 빌드 실패:\n' + msg.slice(-1000));
    process.exit(1);
  }
  return parseStdout(stdout);
}

// ─── Next.js 빌드 stdout 파싱 ─────────────────────────────────────────────
// check-bundle-size.mjs와 동일한 정규식 — 형식 변경 시 양쪽 동기화 필요

function parseStdout(stdout) {
  // 형식: "│ ○ /checkouts   1.85 kB   108 kB"  (Size, First Load JS)
  const ROUTE_RE = /[│├└]\s+[○●λ⊕ƒ◐]\s+(\S+)\s+([\d.]+)\s+(?:kB|B)\s+([\d.]+)\s+kB/;

  const routes = [];
  for (const line of stdout.split('\n')) {
    if (!line.toLowerCase().includes('checkout')) continue;
    const m = line.match(ROUTE_RE);
    if (!m) continue;
    routes.push({ route: m[1], firstLoadKb: parseFloat(m[3]) });
  }
  return routes;
}

// ─── .next/ 서버 파일 직접 측정 (--no-build) ──────────────────────────────

function walkJs(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkJs(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

function measureFromDisk() {
  const manifestPath = resolve(NEXT_DIR, 'app-path-routes-manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ .next/app-path-routes-manifest.json 없음 — 빌드를 먼저 실행하세요');
    console.error('   pnpm --filter frontend run build');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const serverAppDir = resolve(NEXT_DIR, 'server', 'app');

  // 같은 route URL로 중복 집계 방지 (page/layout 등 여러 세그먼트)
  const routeBytes = {};
  for (const [segment, route] of Object.entries(manifest)) {
    if (!route.toLowerCase().includes('checkout')) continue;
    const jsFile = resolve(serverAppDir, segment.slice(1) + '.js');
    if (!existsSync(jsFile)) continue;
    const bytes = gzipSync(readFileSync(jsFile)).length;
    routeBytes[route] = (routeBytes[route] ?? 0) + bytes;
  }

  return Object.entries(routeBytes).map(([route, bytes]) => ({
    route,
    firstLoadKb: bytes / 1024,
  }));
}

// ─── 출력 ─────────────────────────────────────────────────────────────────

function printRoutes(routes, mode) {
  if (routes.length === 0) {
    console.log('ℹ️  checkouts 라우트를 찾지 못했습니다');
    return;
  }
  console.log(`\n📦 checkouts 번들 크기 (${mode}):\n`);
  for (const { route, firstLoadKb } of routes) {
    console.log(`  ${route.padEnd(48)} ${firstLoadKb.toFixed(2).padStart(8)} kB`);
  }
}

// ─── baseline 저장 ──────────────────────────────────────────────────────────
// check-bundle-size.mjs와 동일한 { routes: { [route]: firstLoadKb } } 형식 유지

function saveBaseline(routes) {
  let baseline = { generatedAt: '', tolerancePct: 5, routes: {} };
  if (existsSync(BASELINE_PATH)) {
    try { baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); } catch { /* 초기화 */ }
  }
  // checkouts 라우트만 갱신 (다른 라우트는 보존)
  for (const { route, firstLoadKb } of routes) {
    baseline.routes[route] = firstLoadKb;
  }
  baseline.generatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`\n💾 baseline 저장 (checkouts 라우트 갱신): scripts/bundle-baseline.json`);
}

// ─── baseline 비교 ──────────────────────────────────────────────────────────

function compareWithBaseline(routes) {
  if (!existsSync(BASELINE_PATH)) {
    console.log('\nℹ️  baseline 없음 → 현재 측정값을 baseline으로 저장합니다');
    saveBaseline(routes);
    return false;
  }

  let baseline;
  try { baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); } catch {
    console.warn('⚠️  bundle-baseline.json 파싱 실패 — 비교 스킵');
    return false;
  }

  const baseMap = baseline.routes ?? {};
  let hasWarning = false;

  console.log('\n📊 baseline 대비 checkouts 번들 증가분:\n');
  console.log(
    `  ${'라우트'.padEnd(46)} ${'현재(kB)'.padStart(10)} ${'baseline'.padStart(10)} ${'증가분'.padStart(10)}`
  );
  console.log('  ' + '-'.repeat(80));

  for (const { route, firstLoadKb } of routes) {
    const prev = baseMap[route];
    const diffKb = prev !== undefined ? firstLoadKb - prev : 0;
    const isNew = prev === undefined;
    const warn = !isNew && diffKb > INCREASE_THRESHOLD_KB ? ' ⚠️' : '';
    if (!isNew && diffKb > INCREASE_THRESHOLD_KB) hasWarning = true;

    const prevStr = prev !== undefined ? prev.toFixed(2) : '(신규)';
    const diffStr = isNew ? '—' : (diffKb >= 0 ? '+' : '') + diffKb.toFixed(2);
    console.log(
      `  ${route.padEnd(46)} ${firstLoadKb.toFixed(2).padStart(10)} ${prevStr.padStart(10)} ${diffStr.padStart(10)}${warn}`
    );
  }

  console.log('');
  if (hasWarning) {
    console.warn(`⚠️  경고: ${INCREASE_THRESHOLD_KB} kB 이상 증가한 checkouts 라우트가 있습니다.`);
    console.warn('   코드 스플리팅 확인 또는 불필요한 import 제거를 검토하세요.');
  } else {
    console.log(`✅ 모든 checkouts 라우트 증가분 < ${INCREASE_THRESHOLD_KB} kB — 이상 없음`);
  }

  return hasWarning;
}

// ─── 메인 ──────────────────────────────────────────────────────────────────

const routes = isNoBuild ? measureFromDisk() : buildAndParse();
const mode = isNoBuild ? 'server bundle gzip, --no-build' : 'First Load JS, 빌드 출력';

if (isNoBuild) {
  // --no-build 모드: 서버 번들 gzip 크기 (클라이언트 First Load JS와 단위 다름)
  console.warn('⚠️  --no-build 모드: 서버 번들 gzip 크기 측정 (클라이언트 First Load JS 아님)');
  console.warn('   빌드 모드 baseline과 직접 비교 불가. 참고용으로만 사용하세요.\n');
}

printRoutes(routes, mode);

let exitCode = 0;
if (isNoBuild) {
  // --no-build 모드: 출력만, baseline 저장/비교 없음 (단위 혼용 방지)
  console.log('\nℹ️  --no-build 모드는 baseline 저장/비교를 지원하지 않습니다.');
  console.log('   정확한 baseline 갱신은 빌드 모드(--no-build 없이)를 사용하세요.');
} else if (isCompare) {
  const warned = compareWithBaseline(routes);
  if (warned) exitCode = 1;
} else {
  saveBaseline(routes);
}

console.log('\n✅ measure-bundle 완료\n');
process.exit(exitCode);
