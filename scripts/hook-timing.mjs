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
 * Log rotation (운영 회귀 차단):
 *   `.husky/.timing-log.jsonl` 가 TIMING_LOG_MAX_BYTES (5MB) 초과 시 append 직전
 *   `.1` 로 rolling (단일 백업). 산업 표준 logrotate 패턴의 minimal 구현 — 외부
 *   의존성 0, atomic rename. rotation 실패는 hook 차단 사유 아님 (warn 만).
 *
 * macOS / Linux / WSL2 호환 (Node 내장만 사용).
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/**
 * timing log rotation 임계치 (5MB).
 *
 * 근거: pre-commit 6 step + pre-push 11 step ≈ 17 lines/commit. 평균 line 120
 * bytes 가정 시 5MB ≈ 2,500 commit (~수개월 단일 dev 운영). 초과 시 단일 백업
 * rolling — 직전 분석 데이터는 보존, 더 오래된 데이터는 폐기.
 */
const TIMING_LOG_MAX_BYTES = 5 * 1024 * 1024;

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

/**
 * timing log rotation — append 직전 size 검사 + .1 rolling.
 *
 * 동작:
 *   1. logPath stat → size > TIMING_LOG_MAX_BYTES 시 rotation 시작
 *   2. backupPath (.1) 가 이미 존재하면 unlink (단일 백업 정책)
 *   3. logPath → backupPath atomic rename
 *   4. 다음 append 가 새 파일 생성 (자동)
 *
 * race 안전: pre-commit / pre-push 은 단일 git 트랜잭션 내 직렬 실행 — 동시
 * write 위험 0. rename 자체가 atomic operation 이라 추가 lock 불필요.
 *
 * 실패 처리: rotation 실패 시 warn 후 append 진행 (운영 압력 < hook 차단 비용).
 */
function rotateTimingLogIfNeeded(logPath) {
  let stats;
  try {
    stats = statSync(logPath);
  } catch {
    // 파일 없음 — rotation 불요
    return;
  }

  if (stats.size <= TIMING_LOG_MAX_BYTES) return;

  const backupPath = logPath + '.1';
  try {
    try {
      unlinkSync(backupPath);
    } catch {
      // 기존 백업 없음 — 무시
    }
    renameSync(logPath, backupPath);
  } catch (e) {
    console.error(`hook-timing: log rotation 실패 (${e.message}) — append 계속`);
  }
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
      rotateTimingLogIfNeeded(logPath);
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
  let code;
  if (result.error) {
    console.error(`hook-timing: spawn 실패 (${result.error.message})`);
    code = 127;
  } else if (result.signal) {
    console.error(`hook-timing: 자식이 signal ${result.signal} 로 종료`);
    code = 1;
  } else {
    code = result.status ?? 1;
  }

  emitTiming({ label, ms, exitCode: code });
  process.exit(code);
}

main();
