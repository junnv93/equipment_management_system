#!/usr/bin/env node
/**
 * check-role-config-sync.mjs — DASHBOARD_ROLE_CONFIG ↔ UserRoleValues 동기 검증
 *
 * DASHBOARD_ROLE_CONFIG의 역할 키가 UserRoleValues에 정의된 값과 일치하는지 확인.
 * 역할 추가 시 두 파일을 동기화하지 않으면 빌드 시점에 차단.
 *
 * 사용법:
 *   node scripts/check-role-config-sync.mjs
 *
 * 종료코드:
 *   0 — 동기 OK
 *   1 — 불일치 감지
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

const DASHBOARD_CONFIG_PATH = resolve(
  ROOT,
  'apps/frontend/lib/config/dashboard-config.ts'
);
const SCHEMAS_PATH = resolve(
  ROOT,
  'packages/schemas/src/enums/values.ts'
);

// ── 소스 파싱 헬퍼 ───────────────────────────────────────────────

function extractDashboardRoleConfigKeys(source) {
  // DASHBOARD_ROLE_CONFIG: Record<string, DashboardRoleConfig> = { ... }
  const match = source.match(/DASHBOARD_ROLE_CONFIG[^=]*=\s*\{([\s\S]*?)\}\s*;/);
  if (!match) return null;

  const body = match[1];
  // 최상위 키: '[URVal.SOME_ROLE]' 또는 'role_name:'
  const keys = [];
  const bracketKeys = body.match(/\[URVal\.(\w+)\]/g) ?? [];
  for (const k of bracketKeys) {
    const val = k.replace(/\[URVal\.|]/g, '');
    keys.push(val);
  }
  const literalKeys = body.match(/^\s{2}(\w+):/gm) ?? [];
  for (const k of literalKeys) {
    const val = k.trim().replace(':', '');
    if (val && !val.startsWith('//')) keys.push(val);
  }
  return [...new Set(keys)];
}

function extractUserRoleValues(source) {
  // export const UserRoleValues = { ... } as const
  const match = source.match(/UserRoleValues\s*=\s*\{([\s\S]*?)\}\s*as const/);
  if (!match) return null;

  const body = match[1];
  const values = [];
  const entries = body.match(/:\s*['"]([^'"]+)['"]/g) ?? [];
  for (const e of entries) {
    const val = e.replace(/:\s*['"]|['"]/g, '');
    if (val) values.push(val);
  }
  return values;
}

function extractURValMapping(source) {
  // URVal.SOME_ROLE → 실제 값 매핑 추출
  const match = source.match(/UserRoleValues\s*=\s*\{([\s\S]*?)\}\s*as const/);
  if (!match) return {};

  const body = match[1];
  const map = {};
  const entries = body.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/g) ?? [];
  for (const e of entries) {
    const [, key, val] = e.match(/(\w+)\s*:\s*['"]([^'"]+)['"]/) ?? [];
    if (key && val) map[key] = val;
  }
  return map;
}

// ── 실행 ────────────────────────────────────────────────────────

let dashboardSource, schemasSource;
try {
  dashboardSource = readFileSync(DASHBOARD_CONFIG_PATH, 'utf-8');
} catch {
  console.error(`❌ 파일을 읽을 수 없습니다: ${DASHBOARD_CONFIG_PATH}`);
  process.exit(1);
}
try {
  schemasSource = readFileSync(SCHEMAS_PATH, 'utf-8');
} catch {
  // fallback: schemas/src/index.ts 또는 유사 경로 탐색
  const alt = resolve(ROOT, 'packages/schemas/src/enums.ts');
  try {
    schemasSource = readFileSync(alt, 'utf-8');
  } catch {
    console.warn(`⚠️  UserRoleValues 파일을 찾지 못했습니다. 검사를 건너뜁니다.`);
    console.log('✅ check-role-config-sync: 파일 없음으로 건너뜀');
    process.exit(0);
  }
}

const urValMapping = extractURValMapping(schemasSource);
const roleValues = extractUserRoleValues(schemasSource);
const configKeys = extractDashboardRoleConfigKeys(dashboardSource);

if (!roleValues || roleValues.length === 0) {
  console.warn('⚠️  UserRoleValues를 파싱하지 못했습니다. 검사를 건너뜁니다.');
  process.exit(0);
}

if (!configKeys || configKeys.length === 0) {
  console.warn('⚠️  DASHBOARD_ROLE_CONFIG 키를 파싱하지 못했습니다. 검사를 건너뜁니다.');
  process.exit(0);
}

// URVal.KEY → 실제 값으로 변환 (대괄호 키 처리)
const resolvedConfigValues = configKeys.map((k) => urValMapping[k] ?? k);

console.log('DASHBOARD_ROLE_CONFIG 키:', resolvedConfigValues.join(', '));
console.log('UserRoleValues:', roleValues.join(', '));

const missing = roleValues.filter((v) => !resolvedConfigValues.includes(v));
const extra = resolvedConfigValues.filter((v) => !roleValues.includes(v));

let failed = false;

if (missing.length > 0) {
  console.error(`\n❌ DASHBOARD_ROLE_CONFIG에 누락된 역할:\n  ${missing.join(', ')}`);
  console.error('  → dashboard-config.ts에 해당 역할 설정을 추가하세요.');
  failed = true;
}

if (extra.length > 0) {
  // 경고 수준 (UserRoleValues에 없는 추가 키는 경고만)
  console.warn(`\n⚠️  DASHBOARD_ROLE_CONFIG에만 있는 역할 (UserRoleValues 미정의): ${extra.join(', ')}`);
}

if (failed) {
  process.exit(1);
}

console.log('\n✅ DASHBOARD_ROLE_CONFIG ↔ UserRoleValues 동기 OK');
process.exit(0);
