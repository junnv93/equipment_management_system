#!/usr/bin/env node
/**
 * Next.js 빌드 출력에서 First Load JS 크기를 파싱해 예산 임계값을 검사한다.
 *
 * 사용법: pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs
 *
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

const FIRST_LOAD_BUDGET_KB = 250;

let output = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (output += chunk));
process.stdin.on('end', () => {
  const violations = [];
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

    if (firstLoadKb > FIRST_LOAD_BUDGET_KB) {
      violations.push(
        `  ${route}: First Load JS ${firstLoadKb} kB > ${FIRST_LOAD_BUDGET_KB} kB`
      );
    }
  }

  if (audited.length === 0) {
    console.warn('⚠️  번들 크기 데이터를 파싱하지 못했습니다. Next.js 빌드 출력을 stdin으로 전달하세요.');
    process.exit(0);
  }

  console.log(`\n번들 크기 검사 (임계값: ${FIRST_LOAD_BUDGET_KB} kB):`);
  const maxFirstLoad = Math.max(...audited.map((r) => r.firstLoadKb));
  console.log(`  최대 First Load JS: ${maxFirstLoad} kB (${audited.length}개 라우트)`);

  if (violations.length > 0) {
    console.error('\n❌ 예산 초과:');
    violations.forEach((v) => console.error(v));
    process.exit(1);
  }

  console.log('✅ 전체 라우트 예산 이내');
  process.exit(0);
});
