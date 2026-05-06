#!/usr/bin/env node
/**
 * precommit-staged-guard
 *
 * Multi-session 환경에서 `git add` 호출자 의도와 인덱스 실제 상태가 다를 수
 * 있는 race 를 가시화 + 의심 시 차단.
 *
 * 본 sprint 발생 incident (2026-05-06):
 * - 사용자 `git add 1file` 호출했으나 다른 세션이 미리 stage 한 10 파일이 인덱스에
 *   있어 11 파일이 함께 commit 됨. memory `feedback_lintstaged_other_session_files.md`
 *   가 정책으로 경고했지만 hook 레벨 강제 부재.
 *
 * 두 단계 보호:
 * 1. **인지 강제** — 모든 commit 에서 `git diff --cached --stat` 자동 출력. 매번
 *    사용자가 staged 파일을 인지하도록 강제 (마찰 0, 정보 100%).
 * 2. **선택적 차단** — `EMS_PRECOMMIT_STRICT=1` 활성화 시:
 *    (a) staged 파일 수가 임계 이상이면 block
 *    (b) staged 파일 mtime spread 가 임계 이상이면 (오래된 파일 + 새 파일 혼재 →
 *        다른 세션 stash 의심) block
 *
 * 우회 차단:
 * - `--no-verify` 사용은 사용자 정책 위반 (memory `feedback_main_only_no_branches.md`)
 * - 본 가드는 hook 의 첫 단계로 배치되어 있으나 hook 자체 우회는 별도 정책 영역
 */

import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

// ─── SSOT 정의 ─────────────────────────────────────────────────────────────

const GUARD_CONFIG = Object.freeze({
  /**
   * staged 파일 수 임계값. strict 모드에서 이 수치 이상이면 block.
   * 정상 commit 은 보통 1~10 파일. 11+ 흡수는 의심.
   */
  suspiciousStagedCount: 11,
  /**
   * strict 모드 환경변수.
   */
  strictModeEnv: 'EMS_PRECOMMIT_STRICT',
  /**
   * mtime spread 임계 (분). strict 모드에서 staged 파일 mtime 이 이 임계
   * 이상으로 분산되면 다른 세션 작업 의심 → block.
   */
  mtimeSpreadMinutes: 30,
  /**
   * mtime 검사 비활성화 환경변수. CI / harness 자동화에서 true positive 회피용.
   */
  disableMtimeCheckEnv: 'EMS_PRECOMMIT_GUARD_NO_MTIME',
});

// ─── 유틸 ──────────────────────────────────────────────────────────────────

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function getStagedStat() {
  return execSync('git diff --cached --stat', { encoding: 'utf8' });
}

function getMtimeSpreadMinutes(files) {
  if (files.length < 2) return 0;
  const mtimes = [];
  for (const f of files) {
    try {
      mtimes.push(statSync(f).mtimeMs);
    } catch {
      /* untracked or moved — skip */
    }
  }
  if (mtimes.length < 2) return 0;
  const min = Math.min(...mtimes);
  const max = Math.max(...mtimes);
  return (max - min) / (1000 * 60);
}

// ─── main ──────────────────────────────────────────────────────────────────

function main() {
  const start = Date.now();
  const files = getStagedFiles();
  const strict = process.env[GUARD_CONFIG.strictModeEnv] === '1';

  // 항상 stat 출력 (인지 강제, 마찰 0)
  if (files.length === 0) {
    // empty commit (예: --allow-empty) — 가드 통과
    process.exit(0);
  }

  const stat = getStagedStat().trimEnd();
  process.stderr.write(`▶ pre-commit guard: staged ${files.length}개 파일\n`);
  process.stderr.write(stat + '\n');

  if (!strict) {
    // 정상 모드: stat 출력만, block 없음
    const elapsedMs = Date.now() - start;
    if (process.env.EMS_PRECOMMIT_GUARD_VERBOSE === '1') {
      process.stderr.write(`(guard ${elapsedMs}ms — strict 모드 비활성화)\n`);
    }
    process.exit(0);
  }

  // strict 모드: 의심 시 block
  const failures = [];

  if (files.length >= GUARD_CONFIG.suspiciousStagedCount) {
    failures.push(
      `staged ${files.length}개 — 임계 ${GUARD_CONFIG.suspiciousStagedCount} 이상 (multi-session race 의심)`
    );
  }

  if (process.env[GUARD_CONFIG.disableMtimeCheckEnv] !== '1') {
    const spread = getMtimeSpreadMinutes(files);
    if (spread >= GUARD_CONFIG.mtimeSpreadMinutes) {
      failures.push(
        `staged 파일 mtime spread ${spread.toFixed(1)}분 — 임계 ${GUARD_CONFIG.mtimeSpreadMinutes}분 이상 (오래된 파일 + 새 파일 혼재 → 다른 세션 stash 의심)`
      );
    }
  }

  if (failures.length > 0) {
    process.stderr.write('\n❌ pre-commit guard: STRICT 차단\n');
    for (const f of failures) {
      process.stderr.write(`  - ${f}\n`);
    }
    process.stderr.write(
      `\n  의도가 맞으면 unset ${GUARD_CONFIG.strictModeEnv} 또는 staged 영역 정리 후 재시도.\n` +
        `  복구 절차: git reset HEAD~0 으로 staged 검토, 필요 시 git restore --staged <file>.\n`
    );
    process.exit(1);
  }

  const elapsedMs = Date.now() - start;
  process.stderr.write(`(guard ${elapsedMs}ms — strict PASS)\n`);
  process.exit(0);
}

try {
  main();
} catch (err) {
  process.stderr.write(`❌ precommit-staged-guard ERROR: ${err.stack ?? err.message}\n`);
  process.exit(2);
}
