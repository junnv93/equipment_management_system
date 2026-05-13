#!/usr/bin/env node
/**
 * check-preflight-perf-budget.mjs — ur:preflight p95 성능 예산 검증
 *
 * gitleaks build-dir allowlist 회귀, DANGEROUS_PATTERNS 증가 등으로
 * preflight가 느려지는 것을 조기 감지한다.
 *
 * 환경 변수:
 *   PREFLIGHT_BUDGET_SECONDS   예산(초, 정수 또는 소수). 기본값: 30
 *   PREFLIGHT_CMD_OVERRIDE     (테스트 전용) 공백 구분 명령어 — 기본 shield+preflight 대체
 *                              예: PREFLIGHT_CMD_OVERRIDE=/bin/true
 *
 * 종료 코드:
 *   0 — 예산 이내
 *   1 — 예산 초과 (regression 의심) 또는 내부 명령 실패
 *
 * 사용법:
 *   node scripts/check-preflight-perf-budget.mjs
 *   pnpm ur:preflight:perf-check
 *   PREFLIGHT_BUDGET_SECONDS=60 pnpm ur:preflight:perf-check
 */

import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHIELD_SCRIPT = join(ROOT, 'scripts', 'ultrareview-shield.sh');
const PREFLIGHT_SCRIPT = join(ROOT, 'scripts', 'ultrareview-preflight.mjs');

const BUDGET_SECONDS = Number(process.env.PREFLIGHT_BUDGET_SECONDS ?? 30);

// PREFLIGHT_CMD_OVERRIDE: 테스트 전용 명령 오버라이드 (공백 구분)
const overrideCmd = process.env.PREFLIGHT_CMD_OVERRIDE;
const [cmd, ...cmdArgs] = overrideCmd
  ? overrideCmd.split(' ').filter(Boolean)
  : ['bash', SHIELD_SCRIPT, 'node', PREFLIGHT_SCRIPT];

process.stderr.write(
  `[preflight-perf-budget] 예산: ${BUDGET_SECONDS}초 | 명령: ${[cmd, ...cmdArgs].join(' ')}\n`
);

const start = performance.now();

const r = spawnSync(cmd, cmdArgs, {
  cwd: ROOT,
  stdio: 'inherit',
});

const elapsedMs = performance.now() - start;
const elapsed = elapsedMs / 1000;

process.stderr.write(
  `[preflight-perf-budget] 소요: ${elapsed.toFixed(2)}초 (exit: ${r.status ?? `signal:${r.signal}`})\n`
);

if (elapsed > BUDGET_SECONDS) {
  process.stderr.write(
    `[preflight-perf-budget] ❌ 예산 초과: ${elapsed.toFixed(2)}s > ${BUDGET_SECONDS}s\n` +
      `   회귀 원인 확인: gitleaks allowlist, DANGEROUS_PATTERNS 증가, 대용량 파일\n`
  );
  process.exit(1);
}

if (r.status !== 0) {
  process.stderr.write(
    `[preflight-perf-budget] ⚠  preflight 실패 (exit ${r.status ?? `signal:${r.signal}`}) — 예산 이내\n`
  );
  process.exit(r.status ?? 1);
}

process.stderr.write(`[preflight-perf-budget] ✅ 예산 이내\n`);
