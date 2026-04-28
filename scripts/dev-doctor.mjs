#!/usr/bin/env node
/**
 * dev-doctor — 개발 환경 상태 진단 (SSOT)
 *
 * 책임: 좀비 프로세스 / Next.js 매니페스트 desync / 포트 점유 점검만 수행.
 *      kill / cache 정리 / 재기동 액션은 dev-fresh.mjs가 담당.
 *
 * 호출 경로:
 * - `node scripts/dev-doctor.mjs`  → 사람이 읽는 리포트, exit 0(ok) / 1(warn) / 2(fatal)
 * - `node scripts/dev-doctor.mjs --json`  → 머신 가독 JSON, SessionStart hook용
 * - import 사용: dev-fresh.mjs가 함수 직접 호출 (CLI 출력 없이 데이터만 사용)
 *
 * 진단 항목:
 *   1) 좀비 dev 프로세스 — 같은 종류의 dev 명령(turbo run dev / next dev / nest start --watch)이
 *      2개 이상 동시 실행 중이면 좀비 의심.
 *   2) Next.js 매니페스트 desync — apps/frontend/.next/dev/server/app-paths-manifest.json 의
 *      라우트 수가 동일 트리에 컴파일된 per-route 매니페스트 수보다 현저히 적으면
 *      manifest desync (404 떡 라우트 발생).
 *   3) 포트 점유 — TCP listener를 동적으로 발견하고, dev 프로세스 트리에 속하는지 검사 (포트 번호 하드코딩 X).
 *
 * SSOT:
 *   - dev 프로세스 패턴: DEV_PROCESS_SIGNATURES (이 파일 상단)
 *   - 매니페스트 경로: NEXT_DEV_MANIFEST_PATH (이 파일 상단)
 *   - 포트는 ss/netstat 결과를 직접 읽음 (하드코딩 X) — 일치하는 dev 프로세스가 listening 중인지 검사만.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// SSOT: dev 프로세스 식별 패턴
// ─────────────────────────────────────────────────────────────────────────────
// `kind`는 진단 리포트 분류 키. `pattern`은 ps 출력의 cmd 컬럼에 대한 정규식.
// 같은 kind가 2개 이상이면 좀비 의심으로 보고.
export const DEV_PROCESS_SIGNATURES = [
  { kind: 'turbo-dev', pattern: /\bturbo(?:\s+run)?\s+dev\b/, friendly: 'turbo run dev' },
  { kind: 'next-dev', pattern: /\bnext\s+dev\b/, friendly: 'next dev (frontend)' },
  { kind: 'nest-watch', pattern: /\bnest\s+start\s+--watch\b/, friendly: 'nest start --watch (backend)' },
];

// Next.js dev 빌드 산출물 루트 (SSOT 앵커) — dev-fresh의 캐시 클린 대상도 이 값을 참조한다.
export const NEXT_DEV_DIR = 'apps/frontend/.next/dev';

// 매니페스트 desync 감지: per-route 컴파일된 manifest 수 vs 글로벌 매니페스트 등록 수의 비율.
export const NEXT_DEV_MANIFEST_PATH = `${NEXT_DEV_DIR}/server/app-paths-manifest.json`;
export const NEXT_DEV_PER_ROUTE_GLOB = `${NEXT_DEV_DIR}/server/app`;

// 비율 < 이 값이면 desync 경고 (예: 3개만 등록 / 50개 컴파일됨 → 0.06)
export const MANIFEST_SYNC_THRESHOLD = 0.5;

// Cold-start 가드: dev 서버 부팅 직후 사용자가 1~2개 라우트만 방문해서 compiled가 작을 때
// 비율로 desync 판정하면 false positive 발생. 최소 이 값 이상의 라우트가 컴파일된 후에만 비율 검사.
export const MANIFEST_MIN_COMPILED_FOR_DESYNC = 8;

// ─────────────────────────────────────────────────────────────────────────────
// 프로세스 발견
// ─────────────────────────────────────────────────────────────────────────────
/** ps 출력 한 줄 → {pid, ppid, pgid, sid, etime, cmd} */
function parsePsLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // 형식: "  PID  PPID  PGID  SID ELAPSED CMD..."
  const m = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
  if (!m) return null;
  return {
    pid: Number(m[1]),
    ppid: Number(m[2]),
    pgid: Number(m[3]),
    sid: Number(m[4]),
    etime: m[5],
    cmd: m[6],
  };
}

/**
 * 현재 사용자의 dev 관련 프로세스 전체 발견.
 * pgid를 함께 캡처해 같은 커맨드 invocation 그룹화에 사용.
 */
export function findDevProcesses() {
  let out = '';
  try {
    out = execSync('ps -u "$USER" -o pid,ppid,pgid,sid,etime,cmd --no-headers', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  } catch {
    return [];
  }

  const all = out.split('\n').map(parsePsLine).filter(Boolean);
  const matches = [];
  for (const p of all) {
    for (const sig of DEV_PROCESS_SIGNATURES) {
      if (sig.pattern.test(p.cmd)) {
        matches.push({ ...p, kind: sig.kind, friendly: sig.friendly });
        break;
      }
    }
  }
  return matches;
}

/**
 * 좀비 의심 그룹화 (PGID 기반).
 *
 * 같은 커맨드 invocation은 같은 PGID(process group)를 공유한다 (POSIX).
 * 따라서 "PGID 기준으로 dedup → kind당 PGID 다수면 좀비"가 OS-level 정확한 판정.
 *
 * 알고리즘:
 *   1) 매칭 프로세스를 (kind, pgid)로 그룹화 — 같은 kind 내 PGID가 instance를 의미.
 *   2) 각 kind에서 instance가 1개면 모두 active. 2개 이상이면 가장 최근 PGID(=가장 큰 PID 멤버)가 active,
 *      나머지 instance들의 모든 멤버는 zombie.
 *
 * 추가 fallback:
 *   - npm exec 등의 chain에서 pgid가 split되는 경우(rare) 보완 위해, 같은 kind 내에서 pgid가 같으면 묶고
 *     그래도 instance가 1개면 wrapper 차이를 무시 (pgid가 인스턴스의 권위).
 */
export function groupZombies(processes) {
  // (kind, pgid) → members
  const groups = new Map();
  for (const p of processes) {
    const key = `${p.kind}::${p.pgid}`;
    if (!groups.has(key)) groups.set(key, { kind: p.kind, pgid: p.pgid, members: [] });
    groups.get(key).members.push(p);
  }

  // kind별 instance(=pgid) 목록
  const instancesByKind = new Map();
  for (const inst of groups.values()) {
    if (!instancesByKind.has(inst.kind)) instancesByKind.set(inst.kind, []);
    instancesByKind.get(inst.kind).push(inst);
  }

  const active = [];
  const zombies = [];
  for (const [, instances] of instancesByKind) {
    if (instances.length === 1) {
      active.push(...instances[0].members);
      continue;
    }
    // 멤버 중 최대 PID로 instance 순서 결정 (가장 최근 fork된 instance가 active)
    const ranked = [...instances].sort((a, b) => {
      const aMax = Math.max(...a.members.map((m) => m.pid));
      const bMax = Math.max(...b.members.map((m) => m.pid));
      return bMax - aMax;
    });
    active.push(...ranked[0].members);
    for (const z of ranked.slice(1)) zombies.push(...z.members);
  }
  return { active, zombies };
}

// ─────────────────────────────────────────────────────────────────────────────
// 매니페스트 desync 검사
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 글로벌 app-paths-manifest.json 의 라우트 수와 per-route 매니페스트 수를 비교.
 * 비율이 임계값 미만이면 desync로 판정.
 */
export function checkManifestSync(repoRoot = REPO_ROOT) {
  const manifestPath = path.join(repoRoot, NEXT_DEV_MANIFEST_PATH);
  if (!existsSync(manifestPath)) {
    return { state: 'absent', registered: 0, compiled: 0, ratio: null };
  }
  let registered = 0;
  try {
    const data = JSON.parse(readFileSync(manifestPath, 'utf8'));
    registered = Object.keys(data).length;
  } catch {
    return { state: 'unreadable', registered: 0, compiled: 0, ratio: null };
  }

  const root = path.join(repoRoot, NEXT_DEV_PER_ROUTE_GLOB);
  if (!existsSync(root)) {
    return { state: 'no-compiled', registered, compiled: 0, ratio: null };
  }

  // per-route manifest = .next/dev/server/app/**/page/app-paths-manifest.json
  //                    + .next/dev/server/app/**/route/app-paths-manifest.json
  let compiled = 0;
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name === 'app-paths-manifest.json') {
        compiled++;
      }
    }
  }
  walk(root);
  // walk()는 글로벌 매니페스트 자신도 포함할 수 있으므로 1개 차감
  compiled = Math.max(0, compiled - 1);

  if (compiled === 0) {
    return { state: 'no-compiled', registered, compiled, ratio: null };
  }
  const ratio = registered / compiled;
  // Cold-start 가드: 컴파일 라우트가 적으면 비율이 낮아도 desync 아님 (사용자가 아직 안 방문)
  if (compiled < MANIFEST_MIN_COMPILED_FOR_DESYNC) {
    return { state: 'cold-start', registered, compiled, ratio };
  }
  const state = ratio < MANIFEST_SYNC_THRESHOLD ? 'desync' : 'ok';
  return { state, registered, compiled, ratio };
}

// ─────────────────────────────────────────────────────────────────────────────
// 포트 점유 검사 (하드코딩 X — 실제 listening 포트 + dev 프로세스 매칭)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * dev 프로세스가 listening 중인 TCP 포트 발견.
 * ss -tlnp 출력에서 PID 추출, dev 프로세스 set과 교집합.
 */
export function findDevPorts(devProcesses) {
  const devPids = new Set(devProcesses.map((p) => p.pid));
  // dev 프로세스 자식 중에 실제 server를 띄우는 PID(next-server, NestFactory 등)도 listening할 수 있어
  // ppid 그래프 전체로 확장.
  let psOut = '';
  try {
    psOut = execSync('ps -u "$USER" -o pid,ppid --no-headers', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  } catch {
    return [];
  }
  const ppidByPid = new Map();
  for (const line of psOut.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)$/);
    if (m) ppidByPid.set(Number(m[1]), Number(m[2]));
  }
  const inDevTree = (pid) => {
    let cur = pid;
    let hops = 0;
    while (cur && hops++ < 10) {
      if (devPids.has(cur)) return true;
      cur = ppidByPid.get(cur);
    }
    return false;
  };

  let ssOut = '';
  try {
    ssOut = execSync('ss -tlnp 2>/dev/null', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
  } catch {
    return [];
  }
  const ports = [];
  for (const line of ssOut.split('\n')) {
    const portMatch = line.match(/:(\d+)\s/);
    const pidMatch = line.match(/pid=(\d+)/);
    if (portMatch && pidMatch) {
      const port = Number(portMatch[1]);
      const pid = Number(pidMatch[1]);
      if (inDevTree(pid)) {
        ports.push({ port, pid });
      }
    }
  }
  return ports;
}

// ─────────────────────────────────────────────────────────────────────────────
// 종합 진단
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 모든 점검 수행 후 통합 리포트 반환.
 * level: 'ok' | 'warn' | 'fail'
 */
export function runDiagnosis(repoRoot = REPO_ROOT) {
  const procs = findDevProcesses();
  const { active, zombies } = groupZombies(procs);
  const manifest = checkManifestSync(repoRoot);
  const ports = findDevPorts(procs);

  const issues = [];
  if (zombies.length > 0) {
    issues.push({
      severity: 'warn',
      kind: 'zombie-process',
      message: `${zombies.length}개의 좀비 dev 프로세스 발견 (이전 세션 잔존). pnpm dev:fresh 권장.`,
      detail: zombies.map((z) => ({ pid: z.pid, etime: z.etime, friendly: z.friendly })),
    });
  }
  if (manifest.state === 'desync') {
    issues.push({
      severity: 'fail',
      kind: 'manifest-desync',
      message: `Next.js dev 매니페스트 desync (registered=${manifest.registered} / compiled=${manifest.compiled}, ratio=${manifest.ratio?.toFixed(2)}). 라우트 404 발생 가능. pnpm dev:fresh 필요.`,
      detail: manifest,
    });
  }

  let level = 'ok';
  if (issues.some((i) => i.severity === 'fail')) level = 'fail';
  else if (issues.length > 0) level = 'warn';

  return { level, issues, active, zombies, manifest, ports };
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

function printHumanReport(report) {
  const tag = {
    ok: c('green', '[OK]'),
    warn: c('yellow', '[WARN]'),
    fail: c('red', '[FAIL]'),
  }[report.level];

  console.log(`${tag} dev-doctor — overall: ${report.level}`);

  console.log(c('dim', '\n  active dev processes:'));
  if (report.active.length === 0) {
    console.log('    (none)');
  } else {
    for (const p of report.active) {
      console.log(`    pid=${p.pid} etime=${p.etime} ${p.friendly}`);
    }
  }

  if (report.zombies.length > 0) {
    console.log(c('yellow', `\n  zombies (${report.zombies.length}):`));
    for (const z of report.zombies) {
      console.log(`    pid=${z.pid} etime=${z.etime} ${z.friendly}`);
    }
  }

  console.log(c('dim', '\n  manifest sync:'));
  const m = report.manifest;
  if (m.state === 'absent') {
    console.log('    no .next/dev (서버 미기동)');
  } else if (m.state === 'no-compiled') {
    console.log('    no compiled routes yet');
  } else if (m.state === 'cold-start') {
    console.log(
      `    cold-start  registered=${m.registered} compiled=${m.compiled} (min ${MANIFEST_MIN_COMPILED_FOR_DESYNC}; 라우트 추가 방문 후 재진단)`
    );
  } else {
    const stateColor = m.state === 'ok' ? 'green' : 'red';
    console.log(
      `    ${c(stateColor, m.state)}  registered=${m.registered} compiled=${m.compiled} ratio=${m.ratio?.toFixed(2) ?? 'n/a'}`
    );
  }

  if (report.ports.length > 0) {
    console.log(c('dim', '\n  dev-bound ports:'));
    for (const port of report.ports) {
      console.log(`    :${port.port} → pid=${port.pid}`);
    }
  }

  if (report.issues.length > 0) {
    console.log(c('bold', '\nissues:'));
    for (const issue of report.issues) {
      const stag = issue.severity === 'fail' ? c('red', 'FAIL') : c('yellow', 'WARN');
      console.log(`  ${stag} ${issue.kind}: ${issue.message}`);
    }
    console.log(c('dim', '\n  복구: pnpm dev:fresh   |   진단만: pnpm dev:doctor'));
  } else {
    console.log(c('green', '\n  ✓ 환경 정상'));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const report = runDiagnosis();

  if (asJson) {
    process.stdout.write(JSON.stringify(report) + '\n');
  } else {
    printHumanReport(report);
  }

  // exit codes: ok=0, warn=1, fail=2
  process.exit(report.level === 'fail' ? 2 : report.level === 'warn' ? 1 : 0);
}
