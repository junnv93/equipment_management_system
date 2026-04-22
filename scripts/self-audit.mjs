#!/usr/bin/env node
/**
 * self-audit.mjs — 7대 아키텍처 원칙 위반 탐지 스크립트
 *
 * 사용법:
 *   node scripts/self-audit.mjs --staged   # git staged 파일만 검사 (pre-commit)
 *   node scripts/self-audit.mjs --all      # 전체 codebase 검사 (CI)
 *
 * 상세 문서: docs/references/self-audit.md
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = process.cwd();
const SELF = relative(ROOT, new URL(import.meta.url).pathname).replace(/\\/g, '/');

const isStaged = process.argv.includes('--staged');
const isAll = process.argv.includes('--all');

if (!isStaged && !isAll) {
  console.log('Usage: node scripts/self-audit.mjs [--staged | --all]');
  console.log('  --staged  git staged 파일만 검사 (pre-commit hook 용)');
  console.log('  --all     전체 codebase 검사 (CI 용)');
  process.exit(0);
}

// ─── 파일 목록 수집 ────────────────────────────────────────────────────────

function getStagedFiles() {
  try {
    const out = execSync('git diff --staged --name-only --diff-filter=ACM', { encoding: 'utf8', cwd: ROOT });
    return out
      .trim()
      .split('\n')
      .filter((f) => /\.(ts|tsx)$/.test(f) && f !== SELF && !f.includes('node_modules'));
  } catch {
    return [];
  }
}

function getAllFiles() {
  try {
    const out = execSync('git ls-files -- "*.ts" "*.tsx"', { encoding: 'utf8', cwd: ROOT });
    return out
      .trim()
      .split('\n')
      .filter((f) => f && f !== SELF && !f.includes('node_modules') && !f.includes('/dist/'));
  } catch {
    return [];
  }
}

const files = isStaged ? getStagedFiles() : getAllFiles();

if (files.length === 0) {
  const mode = isStaged ? 'staged' : 'all';
  console.log(`✅ self-audit (${mode}): 검사할 TypeScript 파일 없음`);
  process.exit(0);
}

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────

function isTestFile(f) {
  return /\.(spec|e2e-spec|test)\.(ts|tsx)$/.test(f) || f.includes('/__tests__/');
}

function isConfigFile(f) {
  return (
    /\.(config|setup)\.(ts|js|mjs|cjs)$/.test(f) ||
    f.includes('/scripts/') ||
    f.endsWith('.d.ts')
  );
}

/** SSOT 정의 파일 — 이 파일들이 상수 *정의* 파일이므로 consumer 패턴 체크 제외 */
function isSsotDefinitionFile(f) {
  return (
    f.startsWith('packages/shared-constants/') ||
    f.startsWith('packages/schemas/') ||
    f.startsWith('packages/db/')
  );
}

/** JSDoc + 인라인 주석 제거 */
function stripComments(text) {
  // JSDoc / multiline 주석 제거
  let result = text.replace(/\/\*[\s\S]*?\*\//g, '');
  // 인라인 주석 제거
  result = result.replace(/\/\/.*$/gm, '');
  return result;
}

function readFile(f) {
  const abs = resolve(ROOT, f);
  if (!existsSync(abs)) return '';
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    return '';
  }
}

// ─── violations 누적 ────────────────────────────────────────────────────────

const violations = []; // { check, file, line, message }
const warnings = [];   // SHOULD — 루프 차단 없음

function fail(check, file, lineNum, message) {
  violations.push({ check, file, line: lineNum, message });
}

// ─── 체크 ① 하드코딩 URL ──────────────────────────────────────────────────
// --staged, --all 모두 적용
// QUERY_INTENTS / FRONTEND_ROUTES 경유 없이 직접 URL 리터럴 사용 탐지

const HARDCODED_URL_PATTERNS = [
  {
    re: /['"`][^'"`]*\?action=[^'"`]+['"`]/,
    desc: '?action= 하드코딩 URL — QUERY_INTENTS SSOT 경유 필요 (shared-constants)',
  },
  {
    re: /['"`]\/e\/[A-Z][A-Z0-9-]*['"`]/,
    desc: '/e/[A-Z] QR 단축 URL 하드코딩 — FRONTEND_ROUTES SSOT 경유 필요',
  },
  {
    re: /['"`][^'"`]*\/handover\?[^'"`]*['"`]/,
    desc: '/handover? 하드코딩 URL — FRONTEND_ROUTES 빌더 경유 필요',
  },
  {
    re: /['"`][^'"`]*\/checkouts\/[^'"`]*\?scope=[^'"`]*['"`]/,
    desc: '/checkouts/...?scope= 하드코딩 URL — FRONTEND_ROUTES 빌더 경유 필요',
  },
];

function checkHardcodedUrls(file, lines) {
  if (isTestFile(file)) return;
  if (isSsotDefinitionFile(file)) return; // SSOT 정의 파일은 제외 (패턴을 정의하는 곳)
  const stripped = stripComments(lines.join('\n')).split('\n');
  stripped.forEach((line, i) => {
    for (const { re, desc } of HARDCODED_URL_PATTERNS) {
      if (re.test(line)) {
        fail('① 하드코딩 URL', file, i + 1, desc);
      }
    }
  });
}

// ─── 체크 ② eslint-disable 신규 추가 ────────────────────────────────────
// --staged 에서만 적용 (기존 코드베이스에 tracked 위반 존재)

// Drizzle ORM 복합 쿼리 결과 타입 추론으로 명시적 반환 타입 주석 불가 — pre-commit 전 tracked
const ESLINT_DISABLE_FILE_EXCLUSIONS = [
  'test-software.service.ts',
  // blob:/presigned URL은 next/image 최적화 불가 — @next/next/no-img-element 허용
  'NCDocumentsSection.tsx',
];

function checkEslintDisable(file, lines) {
  if (!isStaged) return;
  if (isTestFile(file) || isConfigFile(file) || isSsotDefinitionFile(file)) return;
  if (ESLINT_DISABLE_FILE_EXCLUSIONS.some((ex) => file.includes(ex))) return;
  lines.forEach((line, i) => {
    if (/\/\/\s*eslint-disable/.test(line) || /\/\*\s*eslint-disable/.test(line)) {
      // self-audit-exception 마커가 있으면 승인된 예외로 처리
      if (/self-audit-exception/.test(line)) return;
      fail(
        '② eslint-disable',
        file,
        i + 1,
        'eslint-disable 주석 추가 감지 — 타입 오류를 직접 수정하거나 예외 승인 필요 (docs/references/self-audit.md)',
      );
    }
  });
}

// ─── 체크 ③ any 타입 신규 추가 ────────────────────────────────────────────
// --staged 에서만 적용 (기존 위반은 tracker에서 관리)

const ANY_TYPE_FILE_EXCLUSIONS = [
  'use-optimistic-mutation',
  '.dto.ts',
  'create-zod-dto',
  'common.types.ts',
];

function checkAnyType(file, lines) {
  if (!isStaged) return;
  if (isTestFile(file) || isConfigFile(file) || isSsotDefinitionFile(file)) return;
  if (ANY_TYPE_FILE_EXCLUSIONS.some((ex) => file.includes(ex))) return;

  lines.forEach((raw, i) => {
    const line = stripComments(raw);
    // `: any` 나 `as any` — 단, 제네릭 파라미터 내(<any>)는 제외
    if (/:\s*any\b/.test(line) || /\bas\s+any\b/.test(line)) {
      fail('③ any 타입', file, i + 1, '`any` 타입 사용 — unknown 또는 구체적 타입으로 교체 필요');
    }
  });
}

// ─── 체크 ④ SSOT 우회 — 로컬 재정의 ──────────────────────────────────────
// --staged, --all 모두 적용

// --staged, --all 양쪽 모두 적용
const SSOT_BYPASS_PATTERNS_ALL = [
  {
    re: /\bQR_CONFIG\s*[=:]\s*\{/,
    desc: 'QR_CONFIG 로컬 재정의 — packages/shared-constants의 QR_CONFIG SSOT 경유 필요',
  },
  {
    re: /\bLABEL_CONFIG\s*[=:]\s*\{/,
    desc: 'LABEL_CONFIG 로컬 재정의 — SSOT 경유 필요',
  },
  {
    re: /\bFRONTEND_ROUTES\s*=\s*\{/,
    desc: 'FRONTEND_ROUTES 로컬 재정의 — packages/shared-constants의 FRONTEND_ROUTES SSOT 경유 필요',
  },
];

// --staged 에서만 적용 (기존 위반은 tracker에서 관리: EquipmentQRCode.tsx:56, AuthProviders.tsx:24)
const SSOT_BYPASS_PATTERNS_STAGED = [
  {
    re: /queryKey\s*:\s*\[['"`]/,
    desc: "queryKey 배열에 문자열 리터럴 직접 사용 — queryKeys.*(id) 빌더 경유 필요 (lib/api/query-config.ts)",
  },
];

function checkSsotBypass(file, lines) {
  if (isTestFile(file)) return;
  if (isSsotDefinitionFile(file)) return; // SSOT 정의 파일 자체는 제외
  const stripped = stripComments(lines.join('\n')).split('\n');

  stripped.forEach((line, i) => {
    for (const { re, desc } of SSOT_BYPASS_PATTERNS_ALL) {
      if (re.test(line)) {
        fail('④ SSOT 우회', file, i + 1, desc);
      }
    }
    if (isStaged) {
      for (const { re, desc } of SSOT_BYPASS_PATTERNS_STAGED) {
        if (re.test(line)) {
          fail('④ SSOT 우회', file, i + 1, desc);
        }
      }
    }
  });
}

// ─── 체크 ⑤ role 리터럴 직접 비교 ────────────────────────────────────────
// --staged, --all 모두 적용

const ROLE_LITERAL_RE =
  /\brole\s*[!=]==\s*['"`](admin|manager|user|lab_manager|tech_manager|test_engineer|system_admin)['"`]/;

function checkRoleLiterals(file, lines) {
  if (isTestFile(file)) return;
  if (isSsotDefinitionFile(file)) return; // roles.ts 등 SSOT 정의 파일 자체 제외
  lines.forEach((raw, i) => {
    const line = stripComments(raw);
    if (ROLE_LITERAL_RE.test(line)) {
      fail(
        '⑤ role 리터럴',
        file,
        i + 1,
        'role 문자열 직접 비교 — UserRole enum + Permission SSOT 경유 필요 (shared-constants)',
      );
    }
  });
}

// ─── 체크 ⑥ onSuccess 내 setQueryData ─────────────────────────────────────
// --staged, --all 모두 적용
// 휴리스틱: onSuccess 블록 내 setQueryData 호출 탐지

function checkSetQueryDataInOnSuccess(file, content, lines) {
  if (isTestFile(file)) return;
  // onSuccess 콜백 내에서 setQueryData 사용 여부 탐지
  // window 방식: onSuccess가 등장한 라인 이후 10줄 내에 setQueryData가 있으면 위반
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripComments(lines[i]);
    if (/\bonSuccess\s*[:(]/.test(stripped) && !/\/\//.test(lines[i])) {
      // 주변 10줄 내에 setQueryData가 있는지 확인
      const window = lines.slice(i, Math.min(i + 12, lines.length)).join('\n');
      if (/\bsetQueryData\b/.test(window)) {
        // setQueryData가 주석 안에 있지 않은지 확인
        const windowNoComments = window.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        if (/\bsetQueryData\b/.test(windowNoComments)) {
          fail(
            '⑥ setQueryData in onSuccess',
            file,
            i + 1,
            'onSuccess 내 setQueryData — TData/TCachedData 타입 불일치 위험 (memory: useOptimisticMutation 버그). invalidateQueries 사용 권장',
          );
        }
      }
    }
  }
}

// ─── 체크 ⑦ icon 버튼 aria-label 누락 ────────────────────────────────────
// --staged 에서만 적용 (기존 코드베이스에 다수 기존 위반 존재)

function checkIconButtonA11y(file, lines) {
  if (!isStaged) return;
  if (!file.endsWith('.tsx')) return;
  if (isTestFile(file)) return;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // <Button ... size="icon"> 또는 <Button ... size='icon'> 이 aria-label 없이 단독 존재하는 경우
    if (/size=['"`]icon['"`]/.test(line) && !/<.*aria-label/.test(line)) {
      // 다음 줄에 aria-label이 있는지도 확인 (multi-line JSX)
      const nextLine = lines[i + 1] ?? '';
      if (!/aria-label/.test(nextLine)) {
        fail(
          '⑦ a11y icon button',
          file,
          i + 1,
          'size="icon" 버튼에 aria-label 없음 — 스크린리더 접근성을 위해 aria-label="동작 설명" 추가 필요',
        );
      }
    }
  }
}

// ─── 체크 ⑧ CheckoutStatus FSM 리터럴 직접 비교 ──────────────────────────
// --staged, --all 모두 적용
// FSM 상태 문자열을 직접 === 비교하는 경우 감지.
// SSOT: CheckoutStatusValues (CSVal.X) 또는 getNextStep descriptor 사용 필요.

const CHECKOUT_STATUS_LITERAL_RE = new RegExp(
  String.raw`\b(status|currentStatus|checkoutStatus)\s*[!=]==\s*['"\`](pending|approved|rejected|checked_out|returned|return_approved|lender_checked|borrower_received|borrower_returned|lender_received|in_use|overdue|canceled)['"\`]`
);

/** FSM 리터럴 감지 예외 파일 */
function isFsmSsotFile(f) {
  return (
    f.includes('checkout-fsm') ||
    f.includes('enums/checkout') ||
    f.startsWith('apps/frontend/lib/design-tokens/') ||
    isSsotDefinitionFile(f)
  );
}

function checkFsmLiterals(file, lines) {
  if (isTestFile(file)) return;
  if (isFsmSsotFile(file)) return;

  lines.forEach((raw, i) => {
    // self-audit-exception 마커가 있으면 승인된 예외로 처리 (Promise.allSettled 결과 등)
    if (/self-audit-exception/.test(raw)) return;
    const line = stripComments(raw);
    if (CHECKOUT_STATUS_LITERAL_RE.test(line)) {
      fail(
        '⑧ FSM 리터럴',
        file,
        i + 1,
        'CheckoutStatus 문자열 직접 비교 — CheckoutStatusValues (CSVal.X) 상수 또는 FSM descriptor 사용 필요',
      );
    }
  });
}

// ─── 체크 ⑨ hex 색상 직접 하드코딩 감지 ────────────────────────────────────
// AP-01·AP-04 금지: Tailwind/semantic token 대신 hex 직접 사용 탐지
// 범위: apps/frontend/components/checkouts/**/*.{ts,tsx}

const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g;

function checkHexColors(file, content) {
  if (!file.startsWith('apps/frontend/components/checkouts/')) return;
  if (isTestFile(file)) return;

  // stripComments()로 // 인라인 + /* */ 블록 주석 모두 제거 후 :root{} CSS 변수 정의 블록 제외
  const stripped = stripComments(content).replace(/:root\s*\{[^}]*\}/g, '');

  // 라인별 탐지 — 정확한 라인 번호 제공
  stripped.split('\n').forEach((line, i) => {
    const matches = line.match(HEX_COLOR_RE);
    if (matches?.length) {
      fail(
        '⑨ hex 색상',
        file,
        i + 1,
        `hex 하드코딩: ${matches.join(', ')} — BRAND_CLASS_MATRIX 또는 Tailwind semantic token 경유 필요`,
      );
    }
  });
}

// ─── 메인 실행 ─────────────────────────────────────────────────────────────

for (const file of files) {
  const content = readFile(file);
  if (!content) continue;

  const lines = content.split('\n');

  checkHardcodedUrls(file, lines);
  checkEslintDisable(file, lines);
  checkAnyType(file, lines);
  checkSsotBypass(file, lines);
  checkRoleLiterals(file, lines);
  checkSetQueryDataInOnSuccess(file, content, lines);
  checkIconButtonA11y(file, lines);
  checkFsmLiterals(file, lines);
  checkHexColors(file, content);
}

// ─── 결과 출력 ─────────────────────────────────────────────────────────────

const mode = isStaged ? 'staged' : 'all';

if (violations.length === 0) {
  console.log(`✅ self-audit (${mode}): 위반 없음 — ${files.length}개 파일 검사 완료`);
  process.exit(0);
}

console.error(`\n❌ self-audit (${mode}): ${violations.length}개 위반 발견\n`);
console.error('-'.repeat(68));

const byCheck = {};
for (const v of violations) {
  if (!byCheck[v.check]) byCheck[v.check] = [];
  byCheck[v.check].push(v);
}

for (const [check, items] of Object.entries(byCheck)) {
  console.error(`\n${check} (${items.length}건):`);
  for (const item of items) {
    console.error(`  📍 ${item.file}:${item.line}`);
    console.error(`     → ${item.message}`);
  }
}

console.error('-'.repeat(68));
console.error('\n💡 수정 방법:');
console.error('  1. 위반 항목을 직접 수정 후 재시도');
console.error('  2. 불가피한 예외: docs/references/self-audit.md "예외 승인 절차" 참조');
console.error('  3. false positive: 이슈 보고 후 whitelist 추가 요청\n');

process.exit(1);
