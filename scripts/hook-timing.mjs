#!/usr/bin/env node
/**
 * hook-timing — opt-in husky hook 실행 시간 추적 wrapper.
 *
 * 사용법:
 *   node scripts/hook-timing.mjs --label "lint-staged" -- pnpm lint-staged
 *
 * 환경변수:
 *   EMS_HOOK_TIMING=1       — stderr 에 JSON-line 출력 활성화
 *                              `{"step":"<label>","ms":N,"exit":code,"ts":"<iso>"}`
 *   EMS_HOOK_TIMING_LOG=1   — 추가 활성화 시 `.husky/.timing-log.jsonl` 에 append
 *                              (gitignored — opt-in 누적 분석 용도)
 *
 * 기본 동작 (env 미설정):
 *   자식 프로세스를 spawnSync(stdio:'inherit') 로 실행 후 자식 exit code 그대로
 *   전파. 출력 부수 효과 없음 (overhead < 5ms 추가).
 *
 * 자식 exit code 전파:
 *   정상 종료: child.status (0~255)
 *   signal 종료: 1 (silent pass 차단 — wrapper 가 hook 게이트를 우회 못 하도록)
 *
 * macOS / Linux / WSL2 호환 (Node 내장만 사용).
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function parseArgs(argv) {
  const labelIdx = argv.indexOf('--label');
  const dashIdx = argv.indexOf('--');
  if (labelIdx === -1 || dashIdx === -1 || dashIdx < labelIdx) {
    console.error(
      '사용법: hook-timing --label "<step-name>" -- <command> [args...]\n' +
        '예: node scripts/hook-timing.mjs --label "lint-staged" -- pnpm lint-staged'
    );
    process.exit(2);
  }
  const label = argv[labelIdx + 1];
  if (!label || label.startsWith('--')) {
    console.error('hook-timing: --label 값 누락');
    process.exit(2);
  }
  const command = argv[dashIdx + 1];
  if (!command) {
    console.error('hook-timing: 실행할 명령 누락 (-- 다음 인자)');
    process.exit(2);
  }
  const args = argv.slice(dashIdx + 2);
  return { label, command, args };
}

function emitTiming({ label, ms, exitCode }) {
  const enabled = process.env.EMS_HOOK_TIMING === '1';
  if (!enabled) return;

  const record = {
    step: label,
    ms,
    exit: exitCode,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(record);
  // stderr — stdout 은 자식 명령 출력에 양보.
  console.error(line);

  if (process.env.EMS_HOOK_TIMING_LOG === '1') {
    const logPath = join(REPO_ROOT, '.husky', '.timing-log.jsonl');
    try {
      mkdirSync(dirname(logPath), { recursive: true });
      appendFileSync(logPath, line + '\n', 'utf8');
    } catch (e) {
      // log append 실패는 hook 차단 사유 아님 — warn 만.
      console.error(`hook-timing: log append 실패 (${e.message})`);
    }
  }
}

function main() {
  const { label, command, args } = parseArgs(process.argv.slice(2));

  const start = Date.now();
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  const ms = Date.now() - start;

  // 자식 exit code 전파:
  //   - 정상 종료: result.status (0~255)
  //   - signal 종료: result.signal != null → exit 1 (silent pass 차단)
  //   - spawn 실패: result.error != null → exit 127
  let exitCode;
  if (result.error) {
    console.error(`hook-timing: spawn 실패 (${result.error.message})`);
    exitCode = 127;
  } else if (result.signal) {
    console.error(`hook-timing: 자식이 signal ${result.signal} 로 종료`);
    exitCode = 1;
  } else {
    exitCode = result.status ?? 1;
  }

  emitTiming({ label, ms, exitCode });
  process.exit(exitCode);
}

main();
