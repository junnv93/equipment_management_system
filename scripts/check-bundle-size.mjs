#!/usr/bin/env node
/**
 * Next.js 빌드 산출물에서 route별 번들 크기를 측정해 예산/회귀를 검사한다.
 *
 * 두 가지 측정 방식 자동 선택:
 *   1. **빌드 산출물 직접 측정 (권장, Next.js 16 PPR 호환)**:
 *      `.next/build-manifest.json` + `.next/server/app-paths-manifest.json`을 읽어
 *      각 route별 server page.js 크기 + rootMainFiles(client shared chunks) 크기를 합산.
 *      stdin 입력 불필요.
 *
 *   2. **stdout 파싱 (Next.js 13/14 호환, fallback)**:
 *      `next build`의 First Load JS 컬럼을 정규식으로 파싱.
 *      Next.js 16부터 PPR 모드가 size 컬럼을 출력하지 않으므로 호환성 보존용 fallback.
 *
 * 사용법:
 *   pnpm --filter frontend run build && node scripts/check-bundle-size.mjs            # 방식 1
 *   pnpm --filter frontend run build && node scripts/check-bundle-size.mjs --baseline  # baseline 저장
 *   pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs        # 방식 2 (legacy)
 *
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const BASELINE_PATH = resolve(ROOT, 'scripts/bundle-baseline.json');
const NEXT_DIR = resolve(ROOT, 'apps/frontend/.next');
const FIRST_LOAD_BUDGET_KB = 250;
const TOLERANCE_PCT = 5;

const isBaseline = process.argv.includes('--baseline');

/**
 * 파일을 읽어 gzip 압축 후 크기(kB) 반환. Next.js stdout 출력과 동일 단위.
 */
function gzippedKb(filePath) {
  const raw = readFileSync(filePath);
  return gzipSync(raw).length / 1024;
}

/**
 * Next.js 16 빌드 산출물에서 route별 First Load JS 측정 (gzip 적용).
 *
 * 측정 정의:
 *   firstLoadKb(route) = serverPageGzipKb(route) + sharedRootMainGzipKb
 *
 * - serverPageGzipKb: `.next/server/app/<route>/page.js` gzip 크기
 * - sharedRootMainGzipKb: `.next/build-manifest.json` rootMainFiles의 gzip 크기 합산
 *
 * gzip 적용으로 Next.js 13/14의 stdout 출력 형식과 단위 일관성 확보.
 *
 * 한계:
 *   - dynamic chunks(코드 스플리팅) 미포함 — route 진입 시 추가 로드 부분 제외.
 *   - 본 측정은 SSR + RSC payload + shared client = 보수적 상한.
 */
function measureFromBuildArtifacts() {
  const buildManifestPath = join(NEXT_DIR, 'build-manifest.json');
  const appPathsManifestPath = join(NEXT_DIR, 'server/app-paths-manifest.json');

  if (!existsSync(buildManifestPath) || !existsSync(appPathsManifestPath)) {
    return null;
  }

  /** @type {{ rootMainFiles: string[] }} */
  const buildManifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));

  /** @type {Record<string, string>} — { '/(group)/route/page': 'app/(group)/route/page.js' } */
  const appPathsManifest = JSON.parse(readFileSync(appPathsManifestPath, 'utf-8'));

  // 1. 공통 client chunks (rootMainFiles) gzip 크기 합산
  let sharedKb = 0;
  for (const file of buildManifest.rootMainFiles ?? []) {
    const fullPath = join(NEXT_DIR, file);
    if (existsSync(fullPath)) {
      sharedKb += gzippedKb(fullPath);
    }
  }

  // 2. 각 route별 server page chunk gzip 크기 측정
  const audited = [];
  for (const [routeKey, relPath] of Object.entries(appPathsManifest)) {
    // routeKey: "/(dashboard)/admin/approvals/page" → 라우트 경로 추출
    const route = routeKey
      .replace(/\([^)]+\)\//g, '') // route group 제거
      .replace(/\/page$/, ''); // /page suffix 제거 → '/admin/approvals'
    const normalizedRoute = route === '' ? '/' : route;

    const fullPath = join(NEXT_DIR, 'server', relPath);
    if (!existsSync(fullPath)) continue;

    const serverPageKb = gzippedKb(fullPath);
    const firstLoadKb = parseFloat((serverPageKb + sharedKb).toFixed(2));
    audited.push({ route: normalizedRoute, firstLoadKb });
  }

  return audited.length > 0 ? { audited, sharedKb: parseFloat(sharedKb.toFixed(2)) } : null;
}

/**
 * Legacy fallback — Next.js 13/14의 build stdout 파싱.
 * Next.js 16 PPR 모드는 size 컬럼을 출력하지 않으므로 빈 배열 반환.
 */
async function measureFromStdout() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve([]);
      return;
    }

    let output = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (output += chunk));
    process.stdin.on('end', () => {
      const audited = [];
      for (const line of output.split('\n')) {
        const match = line.match(
          /[│├└]\s+[○●λ⊕ƒ◐]\s+(\S+)\s+([\d.]+)\s+(?:kB|B)\s+([\d.]+)\s+kB/
        );
        if (!match) continue;
        const [, route, , firstLoadStr] = match;
        audited.push({ route, firstLoadKb: parseFloat(firstLoadStr) });
      }
      resolve(audited);
    });

    // stdin이 닫혀있을 가능성 — 짧은 timeout으로 graceful fallback
    setTimeout(() => resolve(audited), 500);
  });
}

(async () => {
  // 1차: 빌드 산출물 직접 측정 (Next.js 16 호환)
  const fromArtifacts = measureFromBuildArtifacts();
  let audited = fromArtifacts?.audited ?? [];
  let measurementSource = 'build-artifacts';

  // 2차 fallback: stdout 파싱 (Next.js 13/14 호환)
  if (audited.length === 0) {
    audited = await measureFromStdout();
    measurementSource = 'stdout';
  }

  if (audited.length === 0) {
    console.warn('⚠️  번들 크기 데이터를 측정하지 못했습니다.');
    console.warn('   - apps/frontend/.next/ 가 존재하는지 확인 (먼저 build 실행)');
    console.warn('   - 또는 stdout 파이프로 build 출력 전달');
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
      measurementSource,
      sharedRootMainKb: fromArtifacts?.sharedKb,
      routes,
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    const maxFirstLoad = Math.max(...audited.map((r) => r.firstLoadKb));
    console.log(`✅ bundle baseline 저장됨: ${BASELINE_PATH}`);
    console.log(`   측정 방식: ${measurementSource}`);
    if (fromArtifacts?.sharedKb !== undefined) {
      console.log(`   공통 client chunks (rootMainFiles): ${fromArtifacts.sharedKb} kB`);
    }
    console.log(`   ${audited.length}개 라우트, 최대 ${maxFirstLoad.toFixed(2)} kB`);
    process.exit(0);
  }

  // ── 예산 초과 검사 ───────────────────────────────────────────────────────
  const budgetViolations = [];
  for (const { route, firstLoadKb } of audited) {
    if (firstLoadKb > FIRST_LOAD_BUDGET_KB) {
      budgetViolations.push(`  ${route}: ${firstLoadKb} kB > ${FIRST_LOAD_BUDGET_KB} kB`);
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
  console.log(`\n번들 크기 검사 (측정: ${measurementSource}, 임계값: ${FIRST_LOAD_BUDGET_KB} kB):`);
  console.log(`  최대 First Load JS: ${maxFirstLoad.toFixed(2)} kB (${audited.length}개 라우트)`);

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
})();
