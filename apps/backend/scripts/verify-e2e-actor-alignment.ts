#!/usr/bin/env tsx
/**
 * verify-e2e-actor-alignment — Phase 3/5 of senior-permission-ssot-20260501 sprint.
 *
 * verify-e2e Step 23/24/25를 grep guidance에서 **실행 가능 정적 분석**으로 승격.
 * pre-push hook + CI에서 실행. exit code:
 *   - 0: 0 MUST violations (WARN은 stdout 출력 후 통과)
 *   - 1: 1+ MUST violation (push 차단)
 *
 * 룰:
 *   R1 (Step 25, MUST):  scope-validation spec (filename matches "permission",
 *                        "-scope", or "role-constraint") 에서
 *                        `loginAs(app, 'systemAdmin')` actor 사용 금지
 *                        — scope 분기가 dead-code화되는 안티패턴
 *   R2 (Step 24, WARN):  `createTestEquipment(_token)` deprecation 진행 상황
 *                        (Phase 5 codemod로 자동 통과)
 *   R3 (Step 23, MUST):  TestRole 4-place SSOT 정합 — TestRole 유니언 멤버 수 =
 *                        CANONICAL_ROLE / TEST_USERS / TEST_USER_IDS / TEST_USER_DETAILS
 *                        5곳의 entry 수 동치
 *   R4 (WARN):           controller `@RequirePermissions(P_X)` ↔ matrix 정합
 *                        (dead permission 검출 — ROLE_PERMISSIONS에 매핑 없는 권한)
 *
 * 사용:
 *   pnpm --filter backend run verify:e2e-actors
 */

import { Project, SyntaxKind, type SourceFile } from 'ts-morph';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  Permission,
  getRolesWithPermission,
} from '../../../packages/shared-constants/src';

const BACKEND_ROOT = path.resolve(__dirname, '..');
const TEST_DIR = path.join(BACKEND_ROOT, 'test');
const SRC_MODULES = path.join(BACKEND_ROOT, 'src', 'modules');
const TEST_AUTH = path.join(TEST_DIR, 'helpers', 'test-auth.ts');
const TEST_FIXTURES = path.join(TEST_DIR, 'helpers', 'test-fixtures.ts');

interface Violation {
  rule: string;
  severity: 'MUST' | 'WARN';
  file: string;
  line?: number;
  message: string;
  fix?: string;
}

const violations: Violation[] = [];

const project = new Project({
  tsConfigFilePath: path.join(BACKEND_ROOT, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: false, noEmit: true },
});

// ──────────────────────────────────────────────────────────────────────
// R1: scope-validation spec에서 'systemAdmin' actor 금지 (Step 25, MUST)
// ──────────────────────────────────────────────────────────────────────
function isScopeValidationSpec(filename: string): boolean {
  return /(permission|-scope|role-constraint)/i.test(filename);
}

const specFiles = fs
  .readdirSync(TEST_DIR)
  .filter((f) => f.endsWith('.e2e-spec.ts'))
  .map((f) => path.join(TEST_DIR, f));

for (const filepath of specFiles) {
  const filename = path.basename(filepath);
  if (!isScopeValidationSpec(filename)) continue;
  const sf = project.addSourceFileAtPath(filepath);
  scanLoginAsSystemAdmin(sf, filepath);
}

function scanLoginAsSystemAdmin(sf: SourceFile, filepath: string): void {
  // Step 24와의 정합: scope spec도 setup 인프라(equipment 생성/삭제)는 systemAdmin이 필요할 수 있다.
  // 호출 직전 1~3 라인에 'setup' / 'fixture' 의도 주석이 있으면 화이트리스트 (의도 명시 필수).
  // 검증용(scope assert) actor 라면 주석 없이 사용 → R1 위반.
  const fileLines = sf.getFullText().split('\n');
  const isInSetupContext = (lineNum: number): boolean => {
    for (let i = lineNum - 2; i >= Math.max(0, lineNum - 5); i--) {
      const line = fileLines[i];
      if (line === undefined) break;
      const trimmed = line.trim();
      if (trimmed === '') continue;
      const isCommentLine =
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*');
      if (!isCommentLine) break;
      if (/\b(setup|fixture)\b/i.test(trimmed)) return true;
    }
    return false;
  };

  const callExpressions = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of callExpressions) {
    const expr = call.getExpression();
    if (expr.getText() !== 'loginAs') continue;
    const args = call.getArguments();
    if (args.length < 2) continue;
    const secondArg = args[1];
    if (secondArg.getKind() !== SyntaxKind.StringLiteral) continue;
    const text = secondArg.getText().replace(/['"`]/g, '');
    if (text !== 'systemAdmin') continue;
    const { line } = sf.getLineAndColumnAtPos(call.getStart());
    if (isInSetupContext(line)) continue;
    violations.push({
      rule: 'R1 (Step 25)',
      severity: 'MUST',
      file: path.relative(BACKEND_ROOT, filepath),
      line,
      message: `scope-validation spec uses 'systemAdmin' actor — scope check becomes dead-code`,
      fix: `Replace with domain role ('admin' / 'manager' / 'user'), or add a leading "// setup" comment if this is fixture infrastructure setup (per Step 24 pattern)`,
    });
  }
}

// ──────────────────────────────────────────────────────────────────────
// R3: TestRole 4-place SSOT 정합 (Step 23, MUST)
// ──────────────────────────────────────────────────────────────────────
{
  const authSf = project.addSourceFileAtPath(TEST_AUTH);

  const testRoleAlias = authSf.getTypeAlias('TestRole');
  let testRoleCount = 0;
  if (testRoleAlias) {
    const typeNode = testRoleAlias.getTypeNode();
    if (typeNode?.getKind() === SyntaxKind.UnionType) {
      testRoleCount = typeNode
        .asKindOrThrow(SyntaxKind.UnionType)
        .getTypeNodes().length;
    }
  }

  const objKeyCount = (varName: string): number => {
    const v = authSf.getVariableDeclaration(varName);
    if (!v) return -1;
    const init = v.getInitializer();
    if (!init || init.getKind() !== SyntaxKind.ObjectLiteralExpression) return -1;
    return init
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperties().length;
  };

  const arrayLength = (varName: string): number => {
    const v = authSf.getVariableDeclaration(varName);
    if (!v) return -1;
    let init = v.getInitializer();
    if (init && init.getKind() === SyntaxKind.AsExpression) {
      init = init.asKindOrThrow(SyntaxKind.AsExpression).getExpression();
    }
    if (!init || init.getKind() !== SyntaxKind.ArrayLiteralExpression) return -1;
    return init
      .asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      .getElements().length;
  };

  const placeCounts: Record<string, number> = {
    TestRole: testRoleCount,
    CANONICAL_ROLE: objKeyCount('CANONICAL_ROLE'),
    TEST_USERS: objKeyCount('TEST_USERS'),
    TEST_USER_IDS: objKeyCount('TEST_USER_IDS'),
    TEST_USER_DETAILS: arrayLength('TEST_USER_DETAILS'),
  };

  const allEqual =
    testRoleCount > 0 &&
    Object.values(placeCounts).every((c) => c === testRoleCount);

  if (!allEqual) {
    const detail = Object.entries(placeCounts)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    violations.push({
      rule: 'R3 (Step 23)',
      severity: 'MUST',
      file: path.relative(BACKEND_ROOT, TEST_AUTH),
      message: `TestRole 4-place SSOT mismatch: ${detail}`,
      fix: `All 5 places must have equal entry count (verify-e2e Step 23 4-place SSOT)`,
    });
  }
}

// ──────────────────────────────────────────────────────────────────────
// R2: createTestEquipment(_token) deprecation 진행 (Step 24, WARN)
// ──────────────────────────────────────────────────────────────────────
{
  const fixturesContent = fs.readFileSync(TEST_FIXTURES, 'utf8');
  const tokenMatches = fixturesContent.match(/\b_token\b/g);
  const count = tokenMatches?.length ?? 0;
  if (count > 0) {
    violations.push({
      rule: 'R2 (Step 24)',
      severity: 'WARN',
      file: path.relative(BACKEND_ROOT, TEST_FIXTURES),
      message: `createTestEquipment _token parameter deprecated — ${count} occurrences in helpers/test-fixtures.ts`,
      fix: `Phase 5 codemod removes _token + 30+ call sites (senior-permission-ssot sprint)`,
    });
  }
}

// ──────────────────────────────────────────────────────────────────────
// R4: controller @RequirePermissions ↔ matrix 정합 (WARN, conservative)
// ──────────────────────────────────────────────────────────────────────
{
  const controllerFiles: string[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
        controllerFiles.push(full);
      }
    }
  }
  walk(SRC_MODULES);

  const referencedPerms = new Map<string, { file: string; line: number }>();

  for (const cfile of controllerFiles) {
    const csf = project.addSourceFileAtPath(cfile);
    const decorators = csf.getDescendantsOfKind(SyntaxKind.Decorator);
    for (const dec of decorators) {
      const expr = dec.getExpression();
      if (expr.getKind() !== SyntaxKind.CallExpression) continue;
      const callExpr = expr.asKindOrThrow(SyntaxKind.CallExpression);
      const callee = callExpr.getExpression().getText();
      if (callee !== 'RequirePermissions') continue;
      for (const arg of callExpr.getArguments()) {
        const argText = arg.getText();
        if (!argText.startsWith('Permission.')) continue;
        const permKey = argText.slice('Permission.'.length);
        const permValue = (Permission as Record<string, string>)[permKey];
        if (permValue === undefined) continue;
        if (!referencedPerms.has(permValue)) {
          const { line } = csf.getLineAndColumnAtPos(arg.getStart());
          referencedPerms.set(permValue, {
            file: path.relative(BACKEND_ROOT, cfile),
            line,
          });
        }
      }
    }
  }

  for (const [permValue, loc] of referencedPerms) {
    const roles = getRolesWithPermission(permValue as Permission);
    if (roles.length === 0) {
      violations.push({
        rule: 'R4 (matrix consistency)',
        severity: 'WARN',
        file: loc.file,
        line: loc.line,
        message: `controller @RequirePermissions(${permValue}) is dead — no role has this permission in ROLE_PERMISSIONS`,
        fix: `Add to ROLE_PERMISSIONS or remove decorator usage (this endpoint always 403)`,
      });
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────────────────────────────
const mustCount = violations.filter((v) => v.severity === 'MUST').length;
const warnCount = violations.filter((v) => v.severity === 'WARN').length;

if (violations.length === 0) {
  console.log('✅ verify:e2e-actors — 0 violations');
  process.exit(0);
}

const groups: Record<string, Violation[]> = {};
for (const v of violations) {
  groups[v.rule] = groups[v.rule] ?? [];
  groups[v.rule].push(v);
}

for (const [rule, items] of Object.entries(groups)) {
  console.log(`\n## ${rule} — ${items.length} ${items[0].severity}`);
  for (const item of items) {
    const loc = item.line !== undefined ? `${item.file}:${item.line}` : item.file;
    console.log(`  • ${loc}`);
    console.log(`    ${item.message}`);
    if (item.fix) console.log(`    fix: ${item.fix}`);
  }
}

console.log(`\nTotal: ${mustCount} MUST + ${warnCount} WARN`);

if (mustCount > 0) {
  console.log('\n❌ MUST violations block push. Fix and retry.');
  process.exit(1);
}

console.log('\n⚠️  WARN-only violations — proceeding (exit 0)');
process.exit(0);
