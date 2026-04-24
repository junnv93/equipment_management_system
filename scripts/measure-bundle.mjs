#!/usr/bin/env node
/**
 * measure-bundle.mjs — checkouts 라우트 번들 크기 정밀 측정 + baseline 비교
 *
 * webpack-bundle-analyzer의 JSON 리포트(.next/analyze/client.json)를 파싱하여
 * checkouts 청크의 실제 gzip 크기를 측정한다. stdout 정규식 파싱 대신 구조화된
 * JSON을 사용하므로 Next.js 버전 업그레이드에 영향받지 않는다.
 *
 * check-bundle-size.mjs(stdin 파이프, 전체 250 kB First Load JS 예산)의 보완 스크립트.
 * 단위 충돌 방지를 위해 별도 baseline 파일(bundle-baseline-checkouts.json)을 사용한다.
 *   - check-bundle-size.mjs → bundle-baseline.json (First Load JS kB, 전체 라우트)
 *   - measure-bundle.mjs   → bundle-baseline-checkouts.json (gzip kB, checkouts 특화)
 *
 * 사용법:
 *   node scripts/measure-bundle.mjs            # 빌드 실행 → 측정 → baseline 저장
 *   node scripts/measure-bundle.mjs --no-build # 기존 client.json 재파싱 (빌드 스킵)
 *   node scripts/measure-bundle.mjs --compare  # baseline 대비 증가분 비교 (빌드 포함)
 *   node scripts/measure-bundle.mjs --help     # 도움말
 *
 * 출력 파일:
 *   .next/analyze/client.json              — webpack-bundle-analyzer chartData (gzipSize 포함)
 *   scripts/bundle-baseline-checkouts.json — gzip baseline (check-bundle-size.mjs와 파일 분리)
 *
 * 증가분 임계값: 8 kB gzip — docs/operations/performance-budgets.md 참조
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CLIENT_JSON = resolve(ROOT, 'apps/frontend/.next/analyze/client.json');

// check-bundle-size.mjs의 bundle-baseline.json과 단위 충돌 방지 — 별도 파일 사용
// check-bundle-size.mjs: bundle-baseline.json (First Load JS kB, 전체 라우트)
// 이 스크립트: bundle-baseline-checkouts.json (gzip kB, checkouts 특화)
const BASELINE_PATH = resolve(ROOT, 'scripts/bundle-baseline-checkouts.json');

// checkouts gzip 증가분 임계값 — docs/operations/performance-budgets.md 참조
const INCREASE_THRESHOLD_KB = 8;

const isHelp = process.argv.includes('--help') || process.argv.includes('-h');
const isNoBuild = process.argv.includes('--no-build');
const isCompare = process.argv.includes('--compare');

// ─── 도움말 ────────────────────────────────────────────────────────────────

if (isHelp) {
  console.log(`
measure-bundle.mjs — checkouts 라우트 gzip 크기 측정 + baseline 비교

  측정 방식: webpack-bundle-analyzer JSON 리포트(.next/analyze/client.json)의
             gzipSize 필드 직접 파싱 — stdout 정규식 파싱 없음

  사용법:
    node scripts/measure-bundle.mjs            빌드 + 측정 + baseline 저장
    node scripts/measure-bundle.mjs --no-build 기존 client.json 재파싱 (빌드 스킵)
    node scripts/measure-bundle.mjs --compare  측정 후 baseline 대비 비교
    node scripts/measure-bundle.mjs --help     이 도움말

  빌드 환경 변수 (next.config.js ANALYZE_MODE/ANALYZE_OPEN):
    ANALYZE=true          webpack-bundle-analyzer 활성화
    ANALYZE_MODE=json     JSON 리포트 생성 (HTML 뷰어 없음)
    ANALYZE_OPEN=false    브라우저 자동 열기 비활성

  경고 임계값: ${INCREASE_THRESHOLD_KB} kB gzip 증가 — docs/operations/performance-budgets.md
  baseline 파일: scripts/bundle-baseline-checkouts.json (gzip kB 전용)
  관련 파일: scripts/check-bundle-size.mjs + scripts/bundle-baseline.json (First Load JS)
  `);
  process.exit(0);
}

// ─── 빌드 + JSON 리포트 생성 ───────────────────────────────────────────────

function buildWithAnalyze() {
  console.log('📦 ANALYZE=true ANALYZE_MODE=json 빌드 실행 중...\n');
  console.log(
    '   (webpack-bundle-analyzer JSON 리포트 → .next/analyze/client.json)\n'
  );

  try {
    execSync('pnpm --filter frontend run build', {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 360_000,
      env: {
        ...process.env,
        ANALYZE: 'true',
        ANALYZE_MODE: 'json',
        ANALYZE_OPEN: 'false',
      },
    });
  } catch {
    console.error('\n❌ 빌드 실패 — 위 빌드 로그를 확인하세요');
    process.exit(1);
  }
}

// ─── client.json 파싱 (chartData 형식) ─────────────────────────────────────
// webpack-bundle-analyzer chartData:
// [{ label, statSize, parsedSize, gzipSize, groups: [...재귀] }]
//
// 최상위 노드만 집계 (groups 재귀 제외 — 중복 집계 방지).
// 최상위 label은 Next.js App Router chunk 이름:
//   예: "app/(dashboard)/checkouts/page", "app/(dashboard)/checkouts/[id]/page"

function parseClientJson() {
  if (!existsSync(CLIENT_JSON)) {
    console.error('❌ .next/analyze/client.json 없음');
    if (isNoBuild) {
      console.error(
        '   ANALYZE=true ANALYZE_MODE=json 빌드를 먼저 실행하세요:\n' +
          '   node scripts/measure-bundle.mjs  (--no-build 없이)'
      );
    }
    process.exit(1);
  }

  let chartData;
  try {
    chartData = JSON.parse(readFileSync(CLIENT_JSON, 'utf8'));
  } catch (e) {
    console.error('❌ client.json 파싱 실패:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(chartData)) {
    console.error(
      '❌ client.json 형식 오류: 배열이 아님 (webpack-bundle-analyzer 버전 확인 필요)\n' +
        `   실제 타입: ${typeof chartData}`
    );
    process.exit(1);
  }

  const isCheckout = (label) => label.toLowerCase().includes('checkout');

  // 1차: 최상위 라우트 청크 탐색 (app/(dashboard)/checkouts/... 형식)
  const topLevelCheckouts = chartData.filter((node) => isCheckout(node.label ?? ''));

  // 최상위에서 0건이면 chunk hash 이름이 사용된 경우 — groups 내부에서 재귀 탐색
  if (topLevelCheckouts.length === 0) {
    const allNodes = chartData.flatMap((node) => node.groups ?? []);
    const innerCheckouts = allNodes.filter((node) => isCheckout(node.label ?? ''));
    if (innerCheckouts.length === 0) {
      console.warn(
        '⚠️  client.json에서 checkouts 청크를 찾지 못했습니다.\n' +
          '   탐색 패턴: label에 "checkout" 포함 (최상위 + groups 1단계)\n' +
          '   실제 label 확인: cat apps/frontend/.next/analyze/client.json | ' +
          "node -e \"process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);" +
          "process.stdin.on('end',()=>JSON.parse(d).slice(0,5).forEach(n=>console.log(n.label)))\""
      );
    }
    return innerCheckouts.map((node) => ({
      label: node.label,
      gzipKb: (node.gzipSize ?? 0) / 1024,
      parsedKb: (node.parsedSize ?? 0) / 1024,
    }));
  }

  return topLevelCheckouts.map((node) => ({
    label: node.label,
    gzipKb: (node.gzipSize ?? 0) / 1024,
    parsedKb: (node.parsedSize ?? 0) / 1024,
  }));
}

// ─── 결과 출력 ─────────────────────────────────────────────────────────────

function printResults(chunks) {
  if (chunks.length === 0) {
    return null;
  }

  const totalGzipKb = chunks.reduce((s, c) => s + c.gzipKb, 0);

  console.log('\n📦 checkouts 청크 gzip 크기 (.next/analyze/client.json 기준):\n');
  for (const { label, gzipKb, parsedKb } of chunks) {
    const short = label.replace(/^app\/\(dashboard\)\//, '');
    console.log(
      `  ${short.padEnd(52)} gzip: ${gzipKb.toFixed(2).padStart(7)} kB  parsed: ${parsedKb.toFixed(2).padStart(7)} kB`
    );
  }
  console.log(
    `\n  ${'합계 (checkouts 청크)'.padEnd(52)} gzip: ${totalGzipKb.toFixed(2).padStart(7)} kB`
  );

  return totalGzipKb;
}

// ─── baseline 저장 ──────────────────────────────────────────────────────────
// 전용 파일(bundle-baseline-checkouts.json) 사용 — check-bundle-size.mjs의
// bundle-baseline.json(First Load JS kB)과 단위 충돌 방지

function saveBaseline(chunks) {
  let baseline = { generatedAt: '', thresholdKb: INCREASE_THRESHOLD_KB, routes: {} };
  if (existsSync(BASELINE_PATH)) {
    try {
      baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    } catch { /* 초기화 */ }
  }

  for (const { label, gzipKb } of chunks) {
    const route = '/' + label.replace(/^app\/\(dashboard\)\//, '').replace(/\/page$/, '');
    baseline.routes[route] = gzipKb;
  }
  baseline.generatedAt = new Date().toISOString().slice(0, 10);

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log('\n💾 baseline 저장: scripts/bundle-baseline-checkouts.json (gzip kB)');
}

// ─── baseline 비교 ──────────────────────────────────────────────────────────

function compareWithBaseline(chunks) {
  if (!existsSync(BASELINE_PATH)) {
    console.log('\nℹ️  baseline 없음 → 현재 측정값을 baseline으로 저장합니다');
    saveBaseline(chunks);
    return false;
  }

  let baseline;
  try {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    console.warn('⚠️  bundle-baseline-checkouts.json 파싱 실패 — 비교 스킵');
    return false;
  }

  const baseMap = baseline.routes ?? {};
  let hasWarning = false;

  console.log('\n📊 baseline 대비 checkouts 번들 gzip 증가분:\n');
  console.log(
    `  ${'청크'.padEnd(50)} ${'현재(kB)'.padStart(10)} ${'baseline'.padStart(10)} ${'증가분'.padStart(10)}`
  );
  console.log('  ' + '-'.repeat(84));

  for (const { label, gzipKb } of chunks) {
    const route = '/' + label.replace(/^app\/\(dashboard\)\//, '').replace(/\/page$/, '');
    const prev = baseMap[route];
    const isNew = prev === undefined;
    const diffKb = isNew ? 0 : gzipKb - prev;
    const warn = !isNew && diffKb > INCREASE_THRESHOLD_KB ? ' ⚠️' : '';
    if (!isNew && diffKb > INCREASE_THRESHOLD_KB) hasWarning = true;

    const prevStr = isNew ? '(신규)' : prev.toFixed(2);
    const diffStr = isNew ? '—' : (diffKb >= 0 ? '+' : '') + diffKb.toFixed(2);
    const short = label.replace(/^app\/\(dashboard\)\//, '');
    console.log(
      `  ${short.padEnd(50)} ${gzipKb.toFixed(2).padStart(10)} ${prevStr.padStart(10)} ${diffStr.padStart(10)}${warn}`
    );
  }

  console.log('');
  if (hasWarning) {
    console.warn(`⚠️  경고: ${INCREASE_THRESHOLD_KB} kB 이상 gzip 증가한 checkouts 청크가 있습니다.`);
    console.warn('   코드 스플리팅 확인 또는 불필요한 import 제거를 검토하세요.');
  } else {
    console.log(`✅ 모든 checkouts 청크 gzip 증가분 < ${INCREASE_THRESHOLD_KB} kB`);
  }

  return hasWarning;
}

// ─── 메인 ──────────────────────────────────────────────────────────────────

if (!isNoBuild) {
  buildWithAnalyze();
}

const chunks = parseClientJson();
const totalGzipKb = printResults(chunks);

let exitCode = 0;

if (chunks.length === 0) {
  console.log('\n⚠️  checkouts 청크 미발견 — baseline을 업데이트하지 않습니다.');
  console.log('   위 안내에 따라 실제 청크 label을 확인하세요.');
} else if (totalGzipKb === null) {
  // printResults가 null을 반환하는 것은 chunks.length === 0인 경우뿐 — 이미 위에서 처리됨
  console.error('❌ 측정값 계산 실패');
  process.exit(1);
} else if (isCompare) {
  const warned = compareWithBaseline(chunks);
  if (warned) exitCode = 1;
} else {
  saveBaseline(chunks);
  console.log(`\n📋 총 gzip 크기: ${totalGzipKb.toFixed(2)} kB (checkouts 청크 합계)`);
}

console.log('\n✅ measure-bundle 완료\n');
process.exit(exitCode);
