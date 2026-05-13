#!/usr/bin/env node
/**
 * setup-env — frontend .env.local 자동 생성/보완
 *
 * 책임:
 *   - apps/frontend/.env.example (SSOT) 기준으로 apps/frontend/.env.local 을 생성하거나
 *     누락된 키를 안전하게 append 한다.
 *   - .env.local 없음 → .env.example 전체 복사 (INTERNAL_BACKEND_URL 등 모든 키 포함).
 *   - .env.local 존재 시 → 누락 키만 맨 아래에 추가 (기존 값 덮어쓰기 절대 금지).
 *   - parseEnvFile 은 check-env-sync.mjs 의 SSOT 함수를 재사용 — 파싱 로직 중복 0.
 *
 * 호출 경로:
 *   - `pnpm setup:env`  →  사람이 읽는 리포트, exit 0(성공) / 2(no-example)
 *   - `node scripts/setup-env.mjs`  →  동일
 */

import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPO_ROOT,
  FRONTEND_ENV_EXAMPLE,
  FRONTEND_ENV_LOCAL,
  parseEnvFile,
} from './check-env-sync.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// .env.example 키 → 원본 라인값 맵 (append 시 placeholder 값 보존)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * .env.example 의 각 키에 대해 원본 라인 (`KEY=value`) 를 반환하는 Map.
 * 인라인 주석은 포함하지 않음 — 순수 `KEY=value` 형태만 append.
 *
 * @param {string} filePath 절대 경로
 * @returns {Map<string, string>} key → "KEY=value"
 */
function buildExampleLineMap(filePath) {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      // 원본 라인 전체 보존 (인라인 주석 포함 가능 — example은 문서 목적이므로 허용)
      map.set(key, line.trimEnd());
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSI 출력
// ─────────────────────────────────────────────────────────────────────────────
const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};
const useColor = () => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const c = (color, s) => (useColor() ? `${ANSI[color]}${s}${ANSI.reset}` : s);

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────
function run() {
  const examplePath = path.join(REPO_ROOT, FRONTEND_ENV_EXAMPLE);
  const localPath = path.join(REPO_ROOT, FRONTEND_ENV_LOCAL);

  if (!existsSync(examplePath)) {
    console.error(
      `${c('red', '[ERROR]')} ${FRONTEND_ENV_EXAMPLE} 없음 — SSOT 파일 부재. git status 확인.`
    );
    process.exit(2);
  }

  const exampleContent = readFileSync(examplePath, 'utf8');
  const exampleLineMap = buildExampleLineMap(examplePath);

  // ── Case 1: .env.local 없음 → .env.example 전체 복사 ─────────────────────
  if (!existsSync(localPath)) {
    writeFileSync(localPath, exampleContent, 'utf8');
    console.log(
      `${c('green', '[OK]')} ${FRONTEND_ENV_LOCAL} 생성 완료 (${exampleLineMap.size}개 키, ${FRONTEND_ENV_EXAMPLE} 전체 복사).`
    );
    console.log(`  → 플레이스홀더 값을 실제 시크릿으로 교체하세요.`);
    console.log(
      c('dim', `     예) NEXTAUTH_SECRET, INTERNAL_API_KEY, INTERNAL_BACKEND_URL`)
    );
    return;
  }

  // ── Case 2: .env.local 존재 → 누락 키만 안전하게 append ──────────────────
  const localKeys = parseEnvFile(localPath);
  if (!localKeys) {
    // parseEnvFile 이 null을 반환하는 경우는 파일 미존재뿐이지만, 방어적으로 처리
    console.error(`${c('red', '[ERROR]')} ${FRONTEND_ENV_LOCAL} 읽기 실패.`);
    process.exit(1);
  }

  const missingKeys = [...exampleLineMap.keys()].filter((k) => !localKeys.has(k));

  if (missingKeys.length === 0) {
    console.log(
      `${c('green', '[OK]')} ${FRONTEND_ENV_LOCAL} 이미 동기화됨 — 누락 키 없음.`
    );
    return;
  }

  // append 블록: 날짜 포함 섹션 헤더 + 누락 키
  const today = new Date().toISOString().slice(0, 10);
  const appendBlock = [
    '',
    `# ===========================================`,
    `# setup:env 자동 보완 (${today})`,
    `# 아래 값은 ${FRONTEND_ENV_EXAMPLE} 의 기본값입니다.`,
    `# 실제 시크릿 값으로 교체하세요.`,
    `# ===========================================`,
    ...missingKeys.map((k) => exampleLineMap.get(k)),
    '',
  ].join('\n');

  appendFileSync(localPath, appendBlock, 'utf8');

  console.log(
    `${c('green', '[OK]')} ${FRONTEND_ENV_LOCAL} 보완 완료 — ${missingKeys.length}개 키 추가:`
  );
  for (const key of missingKeys) {
    console.log(`  ${c('yellow', '+')} ${key}`);
  }
  console.log(c('dim', `  → 플레이스홀더 값을 실제 시크릿으로 교체하세요.`));
}

run();
