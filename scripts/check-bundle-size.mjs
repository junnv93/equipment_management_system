#!/usr/bin/env node
/**
 * Next.js 빌드 출력에서 First Load JS 크기를 파싱해 예산 임계값을 검사한다.
 *
 * 사용법:
 *   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs
 *   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --baseline
 *   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --compare
 *
 * 모드:
 *   (기본/--compare) baseline 대비 TOLERANCE_PCT% 초과 라우트 경고
 *   --baseline      현재 측정값을 scripts/bundle-baseline.json에 저장
 *
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = resolve(ROOT, 'scripts/bundle-baseline.json');
const FIRST_LOAD_BUDGET_KB = 250;
const TOLERANCE_PCT = 5;

const isBaseline = process.argv.includes('--baseline');

let output = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (output += chunk));
process.stdin.on('end', () => {
  const audited = [];

  for (const line of output.split('\n')) {
    // Next.js build 출력 형식 (App Router):
    // "│ ○ /login    5.23 kB   95.4 kB"
    // "├ ○ /equipment  2.1 kB   233 kB"
    // "└ ƒ /software/[id]  3.5 kB   189 kB"
    const match = line.match(
      /[│├└]\s+[○●λ⊕ƒ◐]\s+(\S+)\s+([\d.]+)\s+(?:kB|B)\s+([\d.]+)\s+kB/
    );
    if (!match) continue;

    const [, route, , firstLoadStr] = match;
    const firstLoadKb = parseFloat(firstLoadStr);
    audited.push({ route, firstLoadKb });
  }

  if (audited.length === 0) {
    console.warn('⚠️  번들 크기 데이터를 파싱하지 못했습니다. Next.js 빌드 출력을 stdin으로 전달하세요.');
    process.exit(0);
  }

  // ── --baseline 모드: 저장 ────────────────────────────────────────────────
  if (isBaseline) {
    const routes = {};
    for (const { route, firstLoadKb } of audited) {
      routes[route] = firstLoadKb;
    }
    const baseline = {
      generatedAt: new Date().toISOString().slice(0, 10),
      tolerancePct: TOLERANCE_PCT,
      routes,
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    const maxFirstLoad = Math.max(...audited.map((r) => r.firstLoadKb));
    console.log(`✅ bundle baseline 저장됨: ${BASELINE_PATH}`);
    console.log(`   ${audited.length}개 라우트, 최대 ${maxFirstLoad} kB`);
    process.exit(0);
  }

  // ── 예산 초과 검사 ───────────────────────────────────────────────────────
  const budgetViolations = [];
  for (const { route, firstLoadKb } of audited) {
    if (firstLoadKb > FIRST_LOAD_BUDGET_KB) {
      budgetViolations.push(`  ${route}: First Load JS ${firstLoadKb} kB > ${FIRST_LOAD_BUDGET_KB} kB`);
    }
  }

  // ── --compare 모드: baseline 대비 증가 감지 ─────────────────────────────
  const compareViolations = [];
  if (existsSync(BASELINE_PATH)) {
    let baseline;
    try {
      baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
    } catch {
      console.warn('⚠️  bundle-baseline.json 파싱 실패 — compare 스킵');
    }
    if (baseline?.routes) {
      const tol = baseline.tolerancePct ?? TOLERANCE_PCT;
      for (const { route, firstLoadKb } of audited) {
        const prev = baseline.routes[route];
        if (prev !== undefined) {
          const diffPct = ((firstLoadKb - prev) / prev) * 100;
          if (diffPct > tol) {
            compareViolations.push(
              `  ${route}: +${diffPct.toFixed(1)}% (${prev} kB → ${firstLoadKb} kB, 허용 +${tol}%)`
            );
          }
        }
      }
    }
  }

  // ── 결과 출력 ────────────────────────────────────────────────────────────
  const maxFirstLoad = Math.max(...audited.map((r) => r.firstLoadKb));
  console.log(`\n번들 크기 검사 (임계값: ${FIRST_LOAD_BUDGET_KB} kB):`);
  console.log(`  최대 First Load JS: ${maxFirstLoad} kB (${audited.length}개 라우트)`);

  if (budgetViolations.length > 0) {
    console.error('\n❌ 예산 초과:');
    budgetViolations.forEach((v) => console.error(v));
  }

  if (compareViolations.length > 0) {
    console.error('\n❌ baseline 대비 증가:');
    compareViolations.forEach((v) => console.error(v));
  }

  if (budgetViolations.length > 0 || compareViolations.length > 0) {
    process.exit(1);
  }

  console.log('✅ 전체 라우트 예산 이내');
  if (existsSync(BASELINE_PATH)) {
    console.log('✅ baseline 대비 이상 없음');
  }
  process.exit(0);
});
