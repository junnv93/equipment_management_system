#!/usr/bin/env node
/**
 * check-env-sync — frontend .env.local ↔ .env.example 동기화 검사
 *
 * 책임:
 *   - apps/frontend/.env.example (tracked SSOT) 의 키를 기준으로
 *     apps/frontend/.env.local (gitignored, 로컬 전용) 에 누락된 키를 발견한다.
 *   - dev-doctor.mjs 가 import해서 사용하는 순수 검사 모듈이기도 하다.
 *
 * 호출 경로:
 *   - `node scripts/check-env-sync.mjs`        → 사람이 읽는 리포트, exit 0(ok) / 1(missing)
 *   - import { checkFrontendEnvSync } from ...  → dev-doctor.mjs 등 다른 스크립트 활용
 *
 * 설계 원칙:
 *   - .env 파일 파싱: KEY=value 라인만 인식. 인라인 주석(`KEY=val  # 설명`) 처리.
 *   - 섹션 헤더(`# === 섹션 ===`) / 순수 주석 라인 / 빈 줄 무시.
 *   - .env.local 없음 → 'no-local' (setup-env.mjs 로 생성 권장 안내).
 *   - .env.example 없음 → 'no-example' (비정상 상태).
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

export const FRONTEND_ENV_EXAMPLE = 'apps/frontend/.env.example';
export const FRONTEND_ENV_LOCAL = 'apps/frontend/.env.local';

// ─────────────────────────────────────────────────────────────────────────────
// .env 파서 (모든 파일 공용)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * .env 파일에서 KEY 집합을 파싱한다.
 *
 * 처리 규칙:
 *   - `KEY=value` 또는 `KEY=` → 키로 인식
 *   - `# KEY=value` (주석 처리된 플레이스홀더) → 무시 (문서화 목적 키는 active key만 검사)
 *   - 인라인 주석 `KEY=val  # 설명` → KEY만 추출 (value에 # 포함 여부 무관)
 *   - 빈 줄, 순수 주석 줄 (`# ...`) → 무시
 *
 * @param {string} filePath 절대 경로
 * @returns {Set<string> | null} 키 집합, 파일 없으면 null
 */
export function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return null;

  const keys = new Set();
  const lines = readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // 빈 줄 / 주석 줄 무시
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    // 유효한 env key 패턴 (대소문자 + 숫자 + 언더스코어)
    if (key && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      keys.add(key);
    }
  }
  return keys;
}

// ─────────────────────────────────────────────────────────────────────────────
// 동기화 검사
// ─────────────────────────────────────────────────────────────────────────────
/**
 * apps/frontend/.env.example (SSOT) vs apps/frontend/.env.local 비교.
 *
 * @param {string} [repoRoot]
 * @returns {{ state: string, missingKeys: string[], extraKeys: string[] }}
 *   state: 'ok' | 'missing-keys' | 'no-local' | 'no-example'
 */
export function checkFrontendEnvSync(repoRoot = REPO_ROOT) {
  const examplePath = path.join(repoRoot, FRONTEND_ENV_EXAMPLE);
  const localPath = path.join(repoRoot, FRONTEND_ENV_LOCAL);

  const exampleKeys = parseEnvFile(examplePath);
  if (!exampleKeys) {
    return { state: 'no-example', missingKeys: [], extraKeys: [] };
  }

  const localKeys = parseEnvFile(localPath);
  if (!localKeys) {
    return {
      state: 'no-local',
      missingKeys: [...exampleKeys].sort(),
      extraKeys: [],
    };
  }

  const missingKeys = [...exampleKeys].filter((k) => !localKeys.has(k)).sort();
  const extraKeys = [...localKeys].filter((k) => !exampleKeys.has(k)).sort();
  const state = missingKeys.length > 0 ? 'missing-keys' : 'ok';
  return { state, missingKeys, extraKeys };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI 출력
// ─────────────────────────────────────────────────────────────────────────────
const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};
const useColor = () => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const c = (color, s) => (useColor() ? `${ANSI[color]}${s}${ANSI.reset}` : s);

function printReport(result) {
  const { state, missingKeys, extraKeys } = result;

  if (state === 'no-example') {
    console.error(
      `${c('red', '[FAIL]')} ${FRONTEND_ENV_EXAMPLE} 없음 — 비정상 상태. git status 확인 필요.`
    );
    return 2;
  }

  if (state === 'no-local') {
    console.warn(`${c('yellow', '[WARN]')} ${FRONTEND_ENV_LOCAL} 없음.`);
    console.warn(`  → pnpm setup:env 로 자동 생성하세요.`);
    console.warn(`  누락 키 (${missingKeys.length}): ${missingKeys.join(', ')}`);
    return 1;
  }

  if (state === 'missing-keys') {
    console.warn(`${c('yellow', '[WARN]')} ${FRONTEND_ENV_LOCAL} 에 누락된 키 발견.`);
    console.warn(`  → pnpm setup:env 로 자동 보완하세요.`);
    for (const key of missingKeys) {
      console.warn(`    ${c('yellow', '+')} ${key}`);
    }
    if (extraKeys.length > 0) {
      console.warn(
        c('dim', `  (로컬 전용 추가 키 ${extraKeys.length}개: ${extraKeys.join(', ')})`)
      );
    }
    return 1;
  }

  // ok
  console.log(
    `${c('green', '[OK]')} ${FRONTEND_ENV_LOCAL} ↔ ${FRONTEND_ENV_EXAMPLE} 동기화 정상.`
  );
  if (extraKeys.length > 0) {
    console.log(c('dim', `  (로컬 전용 추가 키 ${extraKeys.length}개 — 정상)`));
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main (직접 실행 시)
// ─────────────────────────────────────────────────────────────────────────────
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const result = checkFrontendEnvSync();
  const exitCode = printReport(result);
  process.exit(exitCode);
}
