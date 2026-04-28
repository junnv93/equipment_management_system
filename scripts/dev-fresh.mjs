#!/usr/bin/env node
/**
 * dev-fresh — 좀비 dev 프로세스 정리 + Next.js dev 캐시 클린 + dev 재기동.
 *
 * dev-doctor가 진단한 zombie/desync 상태를 idempotent하게 복구.
 * 사용자 안전성을 위해 confirm 프롬프트가 기본. --force 또는 stdin 비-TTY 시 자동 진행.
 *
 * 사용:
 *   node scripts/dev-fresh.mjs              # 진단 → 확인 → 정리 → pnpm dev 재기동
 *   node scripts/dev-fresh.mjs --dry-run    # 무엇을 할지 출력만, 액션 없음
 *   node scripts/dev-fresh.mjs --force      # 확인 없이 진행
 *   node scripts/dev-fresh.mjs --no-restart # 정리만, pnpm dev 재기동 생략
 *
 * 종료 코드: 0=완료, 1=중단(사용자 거부), 2=오류
 *
 * 비범위:
 *   - docker compose(DB/Redis) 컨테이너는 건드리지 않음 — dev 좀비가 아니므로.
 *   - 사용자가 다른 터미널에서 pnpm dev를 띄우는 워크플로 보호 — 정리 후 백그라운드 spawn은 옵션.
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { runDiagnosis, REPO_ROOT, NEXT_DEV_DIR } from './dev-doctor.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// CLI 인자
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force') || args.includes('-y'),
  noRestart: args.includes('--no-restart'),
};

// ─────────────────────────────────────────────────────────────────────────────
// 색상 출력
// ─────────────────────────────────────────────────────────────────────────────
const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};
const useColor = () => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const c = (color, s) => (useColor() ? `${ANSI[color]}${s}${ANSI.reset}` : s);
const log = (...m) => console.log(...m);

// ─────────────────────────────────────────────────────────────────────────────
// 액션
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 좀비 PGID 단위로 graceful 종료(SIGTERM) → 5초 후 잔존자 SIGKILL.
 * `kill -- -<PGID>`는 process group 전체에 시그널 전송 — 트리 잔존 방지.
 */
async function killZombies(zombies, { dryRun }) {
  if (zombies.length === 0) return { killed: 0, force_killed: 0 };

  const pgidSet = new Set(zombies.map((z) => z.pgid));
  if (dryRun) {
    log(c('cyan', '[dry-run]'), `kill PGIDs:`, [...pgidSet].join(', '));
    return { killed: 0, force_killed: 0 };
  }

  // SIGTERM
  let termSent = 0;
  for (const pgid of pgidSet) {
    try {
      process.kill(-pgid, 'SIGTERM');
      termSent++;
    } catch (e) {
      if (e.code !== 'ESRCH') {
        log(c('yellow', `  warn: SIGTERM PGID ${pgid} failed: ${e.message}`));
      }
    }
  }
  log(c('dim', `  SIGTERM sent to ${termSent} PGID(s); waiting 5s for graceful exit…`));
  await new Promise((r) => setTimeout(r, 5000));

  // 잔존자 SIGKILL
  const stillAlive = (() => {
    try {
      const out = execSync('ps -u "$USER" -o pgid --no-headers', {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8',
      });
      const alivePgids = new Set(out.split('\n').map((l) => Number(l.trim())).filter(Boolean));
      return [...pgidSet].filter((pgid) => alivePgids.has(pgid));
    } catch {
      return [];
    }
  })();

  let killSent = 0;
  for (const pgid of stillAlive) {
    try {
      process.kill(-pgid, 'SIGKILL');
      killSent++;
    } catch (e) {
      if (e.code !== 'ESRCH') log(c('yellow', `  warn: SIGKILL PGID ${pgid} failed: ${e.message}`));
    }
  }

  return { killed: termSent, force_killed: killSent };
}

/**
 * Next.js dev 빌드 캐시 정리. NEXT_DEV_DIR(SSOT)만 제거, `.next/cache`(전역)는 보존하면 빠른 후속 재빌드.
 *
 * 매니페스트 desync는 NEXT_DEV_DIR 내부 문제이므로 그것만 삭제하면 충분.
 *
 * 에러 처리: rmSync는 Docker 등으로 root 소유 파일이 섞여있으면 EACCES 발생 가능.
 *   사용자에게 명확한 에러를 surface하고 cleanup 실패로 보고 (silent ignore 금지).
 */
function cleanNextDevCache({ dryRun }) {
  const target = path.join(REPO_ROOT, NEXT_DEV_DIR);
  if (!existsSync(target)) {
    return { cleaned: false, path: target, reason: 'absent' };
  }
  if (dryRun) {
    log(c('cyan', '[dry-run]'), `rm -rf ${path.relative(REPO_ROOT, target)}`);
    return { cleaned: false, path: target, reason: 'dry-run' };
  }
  try {
    rmSync(target, { recursive: true, force: true });
    return { cleaned: true, path: target };
  } catch (e) {
    return { cleaned: false, path: target, reason: `error: ${e.code ?? e.message}` };
  }
}

/**
 * pnpm dev를 spawn (TTY=foreground attach, non-TTY=detached).
 *
 * pnpm은 자체적으로 predev hook(`infra/scripts/predev-guard.sh` + docker compose + db:migrate)을
 * `pnpm dev` 실행 전에 자동 트리거한다 (package.json scripts.predev). 별도 호출 불필요.
 *
 * 에러 시그널:
 *   - 'error' 이벤트 (ENOENT 등): pnpm 미설치 또는 PATH 누락. 즉시 surface.
 *   - 'exit' 이벤트 with code≠0: predev 실패 또는 turbo 부팅 실패. detached 케이스에서만 의미.
 */
function startPnpmDev({ dryRun }) {
  if (dryRun) {
    log(c('cyan', '[dry-run]'), 'pnpm dev (foreground)');
    return null;
  }
  log(c('cyan', '\n→ pnpm dev'));
  const isTTY = Boolean(process.stdin.isTTY);
  const proc = spawn('pnpm', ['dev'], {
    cwd: REPO_ROOT,
    stdio: isTTY ? 'inherit' : 'ignore',
    detached: !isTTY,
    env: process.env,
  });

  // 'error'는 spawn 자체 실패 (e.g. ENOENT pnpm not found) — 반드시 surface.
  proc.on('error', (err) => {
    log(c('red', `\n  spawn error: ${err.code ?? ''} ${err.message}`));
    log(c('dim', `  pnpm이 PATH에 있는지 확인하세요. 수동: cd ${REPO_ROOT} && pnpm dev`));
  });

  if (!isTTY) {
    proc.unref();
    log(c('green', `  spawned pnpm dev pid=${proc.pid} (detached)`));
  }
  return proc;
}

async function confirm(question) {
  if (FLAGS.force) return true;
  if (!process.stdin.isTTY) return true; // 파이프/CI에서는 force 가정
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question(question)).trim().toLowerCase();
    return ans === 'y' || ans === 'yes';
  } finally {
    rl.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  log(c('bold', '\ndev-fresh') + ' — 좀비 정리 + 매니페스트 클린 + dev 재기동\n');

  const report = runDiagnosis(REPO_ROOT);

  log(c('dim', '진단:'));
  log(`  active=${report.active.length}, zombies=${report.zombies.length}, manifest=${report.manifest.state}`);
  for (const issue of report.issues) {
    log(`  ${issue.severity === 'fail' ? c('red', '!') : c('yellow', '·')} ${issue.message}`);
  }

  if (report.level === 'ok' && !FLAGS.dryRun) {
    log(c('green', '\n환경 정상. 정리할 항목 없음.'));
    if (!FLAGS.noRestart && process.argv.includes('--restart')) {
      log(c('dim', '\n--restart 명시 시에만 dev 재기동.'));
      startPnpmDev({ dryRun: false });
    }
    return 0;
  }

  // 정리 대상 요약
  log(c('bold', '\n정리 대상:'));
  if (report.zombies.length > 0) {
    const pgids = new Set(report.zombies.map((z) => z.pgid));
    log(`  좀비 PGID ${pgids.size}개 (프로세스 ${report.zombies.length}건)`);
    for (const z of report.zombies) {
      log(c('dim', `    pgid=${z.pgid} pid=${z.pid} ${z.friendly} (etime=${z.etime})`));
    }
  }
  if (report.manifest.state === 'desync' || report.manifest.state === 'unreadable') {
    log(`  Next.js dev 캐시: ${NEXT_DEV_DIR} (매니페스트 desync)`);
  }

  if (FLAGS.dryRun) {
    log(c('cyan', '\n[dry-run] 액션 미실행. 실제 진행: node scripts/dev-fresh.mjs'));
    return 0;
  }

  // 활성 dev도 같이 종료할지 확인 — manifest desync면 활성 instance도 손상되었을 가능성
  let killActive = false;
  if (report.manifest.state === 'desync' && report.active.length > 0) {
    log(
      c('yellow', '\n주의: manifest desync는 현재 활성 dev instance 자체에서 발생 중.')
    );
    log(c('yellow', '       완전 복구 위해 활성 instance도 종료해야 합니다.'));
    const ok = await confirm(
      `  활성 dev instance(${new Set(report.active.map((p) => p.pgid)).size}개 PGID)도 종료할까요? [y/N] `
    );
    killActive = ok;
  }

  // 좀비 + (옵션) 활성 종료
  const toKill = killActive ? [...report.zombies, ...report.active] : report.zombies;
  if (toKill.length > 0) {
    const ok = FLAGS.force || (await confirm(`\n위 항목들을 종료할까요? [y/N] `));
    if (!ok) {
      log(c('yellow', '\n중단 (사용자 거부).'));
      return 1;
    }
    log(c('bold', '\n→ kill'));
    const result = await killZombies(toKill, { dryRun: false });
    log(c('green', `  완료: SIGTERM=${result.killed}, SIGKILL=${result.force_killed}`));
  }

  // 캐시 클린 — manifest 문제 있을 때만
  if (report.manifest.state === 'desync' || report.manifest.state === 'unreadable') {
    log(c('bold', '\n→ clean .next/dev'));
    const clean = cleanNextDevCache({ dryRun: false });
    if (clean.cleaned) {
      log(c('green', `  removed ${path.relative(REPO_ROOT, clean.path)}`));
    } else {
      log(c('dim', `  (no-op: ${clean.reason})`));
    }
  }

  // 재기동
  if (!FLAGS.noRestart) {
    if (killActive || report.active.length === 0) {
      startPnpmDev({ dryRun: false });
    } else {
      log(c('dim', '\n활성 instance 보존됨. 수동 재기동 필요 시: pnpm dev'));
    }
  } else {
    log(c('dim', '\n--no-restart: 재기동 생략. 수동: pnpm dev'));
  }

  return 0;
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main()
    .then((code) => {
      // foreground pnpm dev가 attach된 경우 main이 return해도 프로세스는 살아있음
      if (code !== 0) process.exit(code);
    })
    .catch((err) => {
      console.error(c('red', `\nerror: ${err.message}`));
      process.exit(2);
    });
}
