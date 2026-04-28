#!/usr/bin/env tsx
/**
 * generate-loading.ts — page.tsx 형제 loading.tsx 누락 검출기
 *
 * 사용법:
 *   pnpm tsx scripts/generate-loading.ts
 *   pnpm tsx scripts/generate-loading.ts --fix   # 기본 loading.tsx 자동 생성
 *
 * dev:doctor 통합:
 *   pnpm dev:doctor 실행 시 이 스크립트를 포함하여 누락 검출
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(process.cwd(), 'app');
const FIX_MODE = process.argv.includes('--fix');

/** 리다이렉트 전용 페이지 — loading.tsx 불필요 */
const REDIRECT_ONLY_ALLOWLIST = new Set([
  'app/(dashboard)/checkouts/manage',
  'app/(dashboard)/handover', // 클라이언트 자체 로딩 상태 보유
  'app/(dashboard)/admin/calibration-approvals',
  'app/(dashboard)/admin/calibration-factor-approvals',
  'app/(dashboard)/admin/calibration-plan-approvals',
  'app/(dashboard)/admin/data-migration', // 관리자 전용 비빈도
  'app/(dashboard)/admin/equipment-approvals',
  'app/(dashboard)/admin/non-conformance-approvals',
  'app/(dashboard)/admin/return-approvals',
  'app/(dashboard)/admin/software-approvals',
  'app/(dashboard)/checkouts/import/[id]/receive',
  'app/(dashboard)/checkouts/import/rental',
  'app/(dashboard)/checkouts/import/shared',
  'app/(dashboard)/checkouts/import/[id]',
]);

/** 기본 loading.tsx 변형 추론 */
function inferVariant(routePath: string): string {
  if (
    routePath.includes('/edit') ||
    routePath.includes('/create') ||
    routePath.includes('/register')
  ) {
    return 'form';
  }
  if (routePath.includes('/[id]') || routePath.includes('/[uuid]')) {
    return 'detail';
  }
  if (routePath.includes('/scan') || routePath.includes('/[managementNumber]')) {
    return 'scan';
  }
  if (routePath.includes('/dashboard') || routePath.includes('/monitoring')) {
    return 'dashboard';
  }
  return 'list';
}

/** 기본 loading.tsx 내용 생성 */
function generateContent(componentName: string, variant: string): string {
  return `import { RouteLoading } from '@/components/loading';

export default function ${componentName}() {
  return <RouteLoading variant="${variant}" />;
}
`;
}

/** 컴포넌트 이름 생성 (경로 → PascalCase) */
function toComponentName(routePath: string): string {
  const segments = routePath
    .replace(/app\/\(dashboard\)\//, '')
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/[\[\]]/g, '').replace(/-(\w)/g, (_, c: string) => c.toUpperCase()))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return segments.join('') + 'Loading';
}

function walk(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hasPage = entries.some((e) => e.name === 'page.tsx');
  const hasLoading = entries.some((e) => e.name === 'loading.tsx');

  if (hasPage && !hasLoading) {
    const relPath = path.relative(process.cwd(), dir);
    const normalizedPath = relPath.replace(/\\/g, '/');

    if (REDIRECT_ONLY_ALLOWLIST.has(normalizedPath)) {
      return;
    }

    // 실제 리다이렉트만 있는 페이지 자동 감지 (redirect() 하나만 있고 JSX 없음)
    const pageContent = fs.readFileSync(path.join(dir, 'page.tsx'), 'utf-8');
    const lines = pageContent
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('/') && !l.trim().startsWith('*'));
    const hasOnlyRedirect =
      lines.some((l) => l.includes('redirect(')) &&
      !lines.some((l) => l.includes('return (') || l.includes('return<'));

    if (hasOnlyRedirect) {
      return;
    }

    const variant = inferVariant(normalizedPath);
    const componentName = toComponentName(normalizedPath);

    console.log(`❌ 누락: ${normalizedPath}/loading.tsx  (추천 variant="${variant}")`);

    if (FIX_MODE) {
      const content = generateContent(componentName, variant);
      fs.writeFileSync(path.join(dir, 'loading.tsx'), content, 'utf-8');
      console.log(`  ✅ 생성됨: ${componentName} (variant="${variant}")`);
    }
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walk(path.join(dir, entry.name));
    }
  }
}

console.log('🔍 loading.tsx 누락 검출 시작...\n');
walk(APP_DIR);
console.log('\n완료. --fix 플래그로 자동 생성 가능.');
