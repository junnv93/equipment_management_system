/**
 * ultrareview-shield spec — Node 내장 test runner.
 *
 * 검증 대상 (실 working tree env 파일 절대 접근 0 — mktemp fixture 전용):
 * - happy path: fake fixture 격리 + /bin/true 실행 + 자동 복원 (hash invariant)
 * - 자식 명령 실패 시에도 복원 (exit code 정확 전파)
 * - 격리 대상 0 (빈 fixture) → 정상 실행 + /tmp/ur-shield-* 신규 디렉토리 0
 * - SSOT 단방향: spec 자체는 패턴을 재정의하지 않고 preflight --list-patterns 출력 소비
 * - `--self-test` smoke: shield 자체 self-test 모드 EXIT 0 + working tree 무변경
 *
 * 실행: `node --test scripts/__tests__/ultrareview-shield.spec.mjs`
 *
 * 참고:
 *   shield의 SHIELD_PREFLIGHT / SHIELD_LOCK env override를 사용하여 실 lock 과
 *   경쟁하지 않는다. 격리 대상 enumerate 는 실 preflight (SSOT) 를 그대로 호출.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  rmSync,
  readdirSync,
  statSync,
  utimesSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SHIELD_SCRIPT = join(REPO_ROOT, 'scripts', 'ultrareview-shield.sh');
const PREFLIGHT_SCRIPT = join(REPO_ROOT, 'scripts', 'ultrareview-preflight.mjs');
const BUDGET_SCRIPT = join(REPO_ROOT, 'scripts', 'check-preflight-perf-budget.mjs');

/**
 * preflight --list-patterns 출력을 SSOT 단방향 소비.
 * spec 내부에서 env 파일 패턴 하드코딩 금지 — 인라인 재정의 회귀 차단.
 */
function fetchDangerousPatterns() {
  const r = spawnSync('node', [PREFLIGHT_SCRIPT, '--list-patterns'], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `preflight --list-patterns EXIT 0 기대 (got: ${r.status})`);
  return JSON.parse(r.stdout);
}

/**
 * fake fixture에 SSOT 패턴 미러 fake 파일 생성.
 * glob 패턴은 `selftest-glob<suffix>` 단일 fake 1개 (find suffix match 충분).
 *
 * Returns: { rel, hash } 배열 — 사후 복원 hash invariant 검증 용.
 */
function populateFakeFiles(fixtureDir, patterns) {
  const records = [];
  for (const entry of patterns) {
    const rel = entry.glob
      ? `selftest-glob${entry.pattern.startsWith('.') ? entry.pattern : '.' + entry.pattern}`
      : entry.pattern;
    const abs = join(fixtureDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    const content = `SELFTEST_FIXTURE_FAKE_CONTENT=${rel}\n`;
    writeFileSync(abs, content, 'utf8');
    const hash = createHash('sha256').update(content).digest('hex');
    records.push({ rel, hash });
  }
  return records;
}

/**
 * /tmp/ur-shield-* 디렉토리 스냅샷 (잔존물 검증용).
 * - shield의 SHIELD_DIR 패턴(`ur-shield-XXXXXX/`)만 카운트
 * - spec 자체 fixture(`ur-shield-spec-*`)와 spec 생성 lock 파일은 제외
 * - 디렉토리 타입만 (lock 파일 같은 regular file 제외)
 */
function snapshotTmpShieldDirs() {
  try {
    return readdirSync('/tmp')
      .filter((n) => n.startsWith('ur-shield-'))
      .filter((n) => !n.startsWith('ur-shield-spec-'))
      .map((n) => join('/tmp', n))
      .filter((p) => {
        try {
          return statSync(p).isDirectory();
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}

/**
 * fixture에서 shield 호출. 실 lock 회피용 SHIELD_LOCK + 실 preflight 경유용
 * SHIELD_PREFLIGHT env override 사용.
 */
function runShieldInFixture({ fixtureDir, args, lockPath }) {
  return spawnSync('bash', [SHIELD_SCRIPT, ...args], {
    cwd: fixtureDir,
    env: {
      ...process.env,
      SHIELD_LOCK: lockPath,
      SHIELD_PREFLIGHT: PREFLIGHT_SCRIPT,
    },
    encoding: 'utf8',
  });
}

function makeFixture() {
  return mkdtempSync(join(tmpdir(), 'ur-shield-spec-'));
}

function makeUniqueLock() {
  // unique path — 실제 파일 생성은 shield 가 수행 (exec 9>"$LOCK_FILE")
  return join(tmpdir(), `ur-shield-spec-lock-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.lock`);
}

function cleanupLock(lockPath) {
  try {
    rmSync(lockPath, { force: true });
  } catch {
    /* ignore */
  }
}

describe('ultrareview-shield — happy path (격리 + 명령 실행 + 복원)', () => {
  test('fake fixture 모든 패턴 격리 → /bin/true 실행 → hash 동일 복원', () => {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      const patterns = fetchDangerousPatterns();
      const records = populateFakeFiles(fixtureDir, patterns);
      assert.ok(records.length >= 5, `최소 5개 패턴 fake 생성 (got ${records.length})`);

      const preTmp = snapshotTmpShieldDirs();
      const r = runShieldInFixture({ fixtureDir, args: ['/bin/true'], lockPath });
      const postTmp = snapshotTmpShieldDirs();

      assert.equal(r.status, 0, `shield EXIT 0 (/bin/true 자식). stderr: ${r.stderr}`);

      // 복원 hash invariant — 모든 fake 가 동일 hash로 복원됐는가?
      for (const { rel, hash: expected } of records) {
        const abs = join(fixtureDir, rel);
        assert.ok(existsSync(abs), `복원: ${rel} 존재 (격리 후 복원 안 됨)`);
        const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
        assert.equal(actual, expected, `복원 hash 일치: ${rel}`);
      }

      // /tmp/ur-shield-* 잔존 0 (shield trap이 SHIELD_DIR 정리)
      const newDirs = postTmp.filter((d) => !preTmp.includes(d));
      assert.deepEqual(newDirs, [], `/tmp/ur-shield-* 잔존물 0 (got: ${newDirs.join(', ')})`);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });
});

describe('ultrareview-shield — 자식 명령 실패 시 exit code 전파 + 복원', () => {
  test('자식 exit 1 → shield exit 1 + 복원 정상', () => {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      const patterns = fetchDangerousPatterns();
      const records = populateFakeFiles(fixtureDir, patterns);

      const r = runShieldInFixture({
        fixtureDir,
        args: ['bash', '-c', 'exit 1'],
        lockPath,
      });
      assert.equal(r.status, 1, `shield 자식 exit 1 그대로 전파`);

      // 복원 hash invariant — 자식이 실패해도 trap restore_files 발화
      for (const { rel, hash: expected } of records) {
        const abs = join(fixtureDir, rel);
        assert.ok(existsSync(abs), `자식 실패 후에도 복원: ${rel}`);
        const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
        assert.equal(actual, expected, `자식 실패 후 hash 일치: ${rel}`);
      }
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });

  test('자식 exit 7 (임의 코드) → shield exit 7', () => {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      // 격리 대상 0 인 fixture 에서도 exit code 전파 정상
      const r = runShieldInFixture({
        fixtureDir,
        args: ['bash', '-c', 'exit 7'],
        lockPath,
      });
      assert.equal(r.status, 7, `자식 exit 7 → shield 7`);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });
});

describe('ultrareview-shield — 격리 대상 0 (빈 fixture)', () => {
  test('패턴 매치 파일 없으면 그대로 명령 실행 + 잔존물 0', () => {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      const preTmp = snapshotTmpShieldDirs();
      const r = runShieldInFixture({
        fixtureDir,
        args: ['bash', '-c', 'echo hello'],
        lockPath,
      });
      const postTmp = snapshotTmpShieldDirs();

      assert.equal(r.status, 0);
      assert.match(r.stdout, /hello/, `자식 stdout 전파`);
      assert.match(r.stderr, /격리 대상 없음/, `격리 대상 0 메시지`);

      // shield 가 빈 SHIELD_DIR 도 정리 (rmdir empty)
      const newDirs = postTmp.filter((d) => !preTmp.includes(d));
      assert.deepEqual(newDirs, [], `잔존 SHIELD_DIR 0`);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });
});

describe('ultrareview-shield — SSOT 단방향 단언', () => {
  test('spec 자체에 env 파일 패턴 하드코딩 없음 (preflight --list-patterns 만 사용)', () => {
    // self-defense: 본 spec 파일을 읽어 SSOT 우회 인라인 패턴이 있는지 검증
    const specSource = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    // doc 주석/header는 제외하고 코드 라인만 검사
    const codeLines = specSource
      .split('\n')
      .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'));
    const codeBody = codeLines.join('\n');

    // DANGEROUS_PATTERNS 의 file kind 패턴이 spec 코드에 string literal로 박혔는가?
    // 동적으로 patterns 받아와서 confirm
    const patterns = fetchDangerousPatterns();
    for (const p of patterns) {
      if (p.glob) continue; // glob 패턴은 suffix 라 패턴 자체보다 derive 후 검증
      const literal1 = `'${p.pattern}'`;
      const literal2 = `"${p.pattern}"`;
      assert.ok(
        !codeBody.includes(literal1) && !codeBody.includes(literal2),
        `SSOT 우회 — spec 에 '${p.pattern}' 인라인 발견 (preflight --list-patterns 만 사용해야 함)`
      );
    }
  });
});

describe('ultrareview-shield — --self-test smoke', () => {
  test('bash shield --self-test EXIT 0 + working tree 무변경', () => {
    // 본 spec 은 REPO_ROOT cwd로 호출 — 실 working tree 사용 (의도)
    // 그러나 --self-test 자체는 /tmp 격리 fixture 만 사용. 검증 invariant:
    // (a) EXIT 0
    // (b) git status --porcelain 변경 0 (working tree 영향 없음)

    // git status 사전 스냅샷
    const preGit = spawnSync('git', ['status', '--porcelain'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });

    const r = spawnSync('bash', [SHIELD_SCRIPT, '--self-test'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `--self-test EXIT 0. stderr: ${r.stderr}`);
    assert.match(r.stderr, /ultrareview-shield self-test PASS/);

    // working tree 무변경 검증
    const postGit = spawnSync('git', ['status', '--porcelain'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    assert.equal(
      postGit.stdout,
      preGit.stdout,
      `--self-test 가 working tree 변경: ${postGit.stdout}`
    );

    // /tmp/ur-shield-selftest-* 잔존 0
    const residuals = readdirSync('/tmp').filter((n) =>
      n.startsWith('ur-shield-selftest-')
    );
    assert.deepEqual(residuals, [], `/tmp/ur-shield-selftest-* 잔존 0`);
  });
});

// ─── SH-1: flock 동시 실행 lock-contention ─────────────────────────────────

describe('ultrareview-shield — flock 동시 실행 (lock-contention)', () => {
  test('동일 lock 보유 중 두 번째 shield 즉시 FAIL exit 1 + stderr 충돌 메시지', async () => {
    const lockPath = makeUniqueLock();
    const fixtureDir = makeFixture();
    let holder = null;
    try {
      // Lock holder: flock 획득 + 'LOCKED' stderr 시그널 → read(1)으로 무한 대기
      holder = spawn(
        'bash',
        ['-c', `exec 9>"${lockPath}"; flock -e 9; printf 'LOCKED\\n' >&2; read -r`],
        { stdio: ['pipe', 'ignore', 'pipe'] }
      );

      // Lock 획득 확인 (timeout 5s)
      await new Promise((resolve, reject) => {
        let buf = '';
        const tid = setTimeout(
          () => reject(new Error('lock-holder: LOCKED 시그널 timeout (5s)')),
          5000
        );
        holder.stderr.on('data', (d) => {
          buf += d.toString();
          if (buf.includes('LOCKED')) {
            clearTimeout(tid);
            resolve();
          }
        });
        holder.on('error', (e) => {
          clearTimeout(tid);
          reject(e);
        });
        holder.on('close', (code) => {
          if (!buf.includes('LOCKED')) {
            clearTimeout(tid);
            reject(new Error(`lock-holder 비정상 종료 code=${code}`));
          }
        });
      });

      // 두 번째 shield: 동일 lock → 즉시 FAIL
      const r = runShieldInFixture({ fixtureDir, args: ['/bin/true'], lockPath });
      assert.equal(r.status, 1, `두 번째 shield EXIT 1 기대. stderr: ${r.stderr}`);
      assert.match(r.stderr, /다른 ultrareview-shield 인스턴스/, 'lock-contention 충돌 메시지');
    } finally {
      if (holder) {
        holder.stdin?.end();
        holder.kill();
        await new Promise((resolve) => holder.on('close', resolve));
      }
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });
});

// ─── SH-2: SIGTERM/SIGINT trap restore_files ─────────────────────────────

describe('ultrareview-shield — SIGTERM/SIGINT trap restore_files', () => {
  /**
   * SIGTERM — $PPID 패턴: shield bash가 직접 SIGTERM 수신.
   *
   * 왜 $PPID인가:
   *   - $PPID = 자식 bash의 부모 PID = shield bash PID
   *   - kill -s TERM $PPID → shield bash가 직접 SIGTERM 수신 (kill <pid> 경로)
   *   - 자식 bash가 kill 후 정상 종료(exit 0) → shield waitpid 반환
   *   - shield bash: 대기 중 수신한 SIGTERM(pending) 처리 → EXIT trap 발화 → restore_files()
   *   - 결과: shield exit 143, 복원 완료
   *
   * SIGINT에 $PPID를 쓰지 않는 이유:
   *   - 비-인터랙티브 bash에서 $PPID에 SIGINT를 직접 보내면 bash가 신호를 흡수 → exit 0
   *   - 인터랙티브 모드에서만 SIGINT가 job-control cancel 의미를 가짐
   *   - SIGINT 시나리오는 아래 runChildSelfSignalRestoreTest로 별도 검증
   *
   * 실증: spawnSync + kill -s TERM $PPID → 12개 파일 ✅ 복원 + exit 143 확인.
   */
  function runPpidSignalRestoreTest(bashSignalName) {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      const patterns = fetchDangerousPatterns();
      const records = populateFakeFiles(fixtureDir, patterns);
      const preTmp = snapshotTmpShieldDirs();

      // bash -c 'kill -s TERM $PPID': 자식이 shield bash(부모)에 직접 SIGTERM 전달
      // shield는 자식 종료 후 pending SIGTERM 처리 → EXIT trap 발화 → restore_files()
      const r = runShieldInFixture({
        fixtureDir,
        args: ['bash', '-c', `kill -s ${bashSignalName} $PPID`],
        lockPath,
      });

      // SIGTERM → shield exit 143 (또는 signal 기반 종료)
      assert.ok(r.status !== 0 || r.signal != null, `shield 비정상 종료 기대 (${bashSignalName}): status=${r.status} signal=${r.signal}`);

      // 복원 hash invariant — trap restore_files 발화 확인
      for (const { rel, hash: expected } of records) {
        const abs = join(fixtureDir, rel);
        assert.ok(existsSync(abs), `${bashSignalName} 후 복원: ${rel}`);
        const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
        assert.equal(actual, expected, `${bashSignalName} 후 hash 일치: ${rel}`);
      }

      // /tmp 잔존물 0 — trap이 SHIELD_DIR 정리했는가?
      const postTmp = snapshotTmpShieldDirs();
      const newDirs = postTmp.filter((d) => !preTmp.includes(d));
      assert.deepEqual(newDirs, [], `${bashSignalName} 후 /tmp/ur-shield-* 잔존 0`);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  }

  /**
   * SIGINT — self-signal 패턴: 실제 Ctrl+C 시나리오 재현.
   *
   * 왜 self-signal(kill -s INT $$)인가:
   *   - 실제 사용: Ctrl+C → 터미널이 SIGINT를 포그라운드 프로세스 그룹 전체에 전달
   *     → 자식(preflight.mjs)이 SIGINT로 exit 130 → shield `set -e`로 exit 130 → EXIT trap
   *   - $PPID 방식의 한계: 비-인터랙티브 bash는 $PPID에 INT를 직접 보내도 흡수 → exit 0
   *     (인터랙티브 bash의 job-control cancel 의미가 없으므로 bash가 INT를 무시)
   *   - self-signal($$): 자식이 자신에게 INT → child exit 130 → shield set -e → exit 130
   *     이 경로가 실제 Ctrl+C 시나리오와 동일한 복원 경로를 검증함
   *
   * 실증: spawnSync + kill -s INT $$ → child exit 130 → shield exit 130 → 복원 ✅.
   */
  function runChildSelfSignalRestoreTest(bashSignalName) {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    try {
      const patterns = fetchDangerousPatterns();
      const records = populateFakeFiles(fixtureDir, patterns);
      const preTmp = snapshotTmpShieldDirs();

      // bash -c 'kill -s INT $$': 자식 bash가 자신에게 SIGINT → child exit 130
      // shield `set -e`: 자식 비정상 종료(130) → shield exit 130 → EXIT trap → restore_files()
      const r = runShieldInFixture({
        fixtureDir,
        args: ['bash', '-c', `kill -s ${bashSignalName} $$`],
        lockPath,
      });

      // child exit 130 → set -e → shield exit 130 (비정상 종료)
      assert.ok(r.status !== 0, `shield 비정상 종료 기대 (${bashSignalName} self-signal): status=${r.status}`);

      // 복원 hash invariant — trap restore_files 발화 확인
      for (const { rel, hash: expected } of records) {
        const abs = join(fixtureDir, rel);
        assert.ok(existsSync(abs), `${bashSignalName} self-signal 후 복원: ${rel}`);
        const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
        assert.equal(actual, expected, `${bashSignalName} self-signal 후 hash 일치: ${rel}`);
      }

      // /tmp 잔존물 0 — trap이 SHIELD_DIR 정리했는가?
      const postTmp = snapshotTmpShieldDirs();
      const newDirs = postTmp.filter((d) => !preTmp.includes(d));
      assert.deepEqual(newDirs, [], `${bashSignalName} self-signal 후 /tmp/ur-shield-* 잔존 0`);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  }

  test('SIGTERM: kill -s TERM $PPID → shield bash 직접 수신 → trap EXIT 발화 → 격리 파일 복원 + /tmp 잔존 0', () => {
    runPpidSignalRestoreTest('TERM');
  });

  test('SIGINT: kill -s INT $$ (self-signal) → child exit 130 → shield set -e → trap EXIT 발화 → 격리 파일 복원 + /tmp 잔존 0', () => {
    runChildSelfSignalRestoreTest('INT');
  });
});

// ─── SH-3: stale GC spec ─────────────────────────────────────────────────

describe('ultrareview-shield — stale GC (SIGKILL 잔존물 자동 정리)', () => {
  test('1시간 이상 경과한 ur-shield-* 디렉토리 → 다음 실행 시 자동 삭제', () => {
    const fixtureDir = makeFixture();
    const lockPath = makeUniqueLock();
    // ur-shield-staletest-* 네이밍: selftest/spec prefix 아님 → GC 대상
    const staleDir = mkdtempSync(join(tmpdir(), 'ur-shield-staletest-'));
    try {
      // mtime을 2시간 전으로 설정 → find -mmin +60 매칭
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      utimesSync(staleDir, twoHoursAgo, twoHoursAgo);

      assert.ok(existsSync(staleDir), 'stale dir 생성 확인');

      const r = runShieldInFixture({ fixtureDir, args: ['/bin/true'], lockPath });
      assert.equal(r.status, 0, `shield EXIT 0. stderr: ${r.stderr}`);

      // GC 실행 확인
      assert.ok(!existsSync(staleDir), `stale dir GC 삭제 확인: ${staleDir}`);
      assert.match(r.stderr, /shield GC/, 'GC 로그 메시지 포함');
    } finally {
      rmSync(staleDir, { recursive: true, force: true });
      rmSync(fixtureDir, { recursive: true, force: true });
      cleanupLock(lockPath);
    }
  });
});

// ─── SH-4: ur:preflight 성능 예산 ────────────────────────────────────────

describe('ultrareview-shield — ur:preflight 성능 예산 (SH-4)', () => {
  test('budget=300 + /bin/true mock → EXIT 0 + "예산 이내" 메시지', () => {
    const r = spawnSync('node', [BUDGET_SCRIPT], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PREFLIGHT_CMD_OVERRIDE: '/bin/true',
        PREFLIGHT_BUDGET_SECONDS: '300',
      },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, `budget=300: EXIT 0. stderr: ${r.stderr}`);
    assert.match(r.stderr, /예산 이내/, '예산 이내 메시지');
  });

  test('budget=0 + /bin/true mock → EXIT 1 + "예산 초과" 메시지 (어떤 실행도 0초 초과)', () => {
    const r = spawnSync('node', [BUDGET_SCRIPT], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PREFLIGHT_CMD_OVERRIDE: '/bin/true',
        PREFLIGHT_BUDGET_SECONDS: '0',
      },
      encoding: 'utf8',
    });
    assert.equal(r.status, 1, `budget=0: EXIT 1`);
    assert.match(r.stderr, /예산 초과/, '초과 메시지');
  });
});

// ─── SH-5: stale_gc uid filter — 멀티유저 race 회귀 차단 (review §3.4) ─────

describe('ultrareview-shield — stale_gc uid filter (라운드 #5 review §3.4)', () => {
  test('stale_gc 함수 본문에 `-user "$current_user"` find filter 존재', () => {
    const shieldSource = readFileSync(SHIELD_SCRIPT, 'utf8');
    // 핵심 invariant: find 옵션에 -user 필터 + current_user 변수 사용
    assert.match(
      shieldSource,
      /-user\s+"?\$current_user"?/,
      'find -user "$current_user" 필터 존재 (멀티유저 /tmp 다른 uid 격리본 보호)'
    );
    // current_user 변수 정의
    assert.match(
      shieldSource,
      /current_user="?\$\(id -un[^)]*\)"?/,
      'current_user="$(id -un ...)" 변수 정의 존재'
    );
  });

  test('id -un 실패 시 GC 조기 종료 (return 0) — 보호 fail-close', () => {
    const shieldSource = readFileSync(SHIELD_SCRIPT, 'utf8');
    // current_user 가 빈 문자열이면 return 0 으로 GC 자체 skip
    // (다른 사용자 디렉토리 전체 GC 회피)
    assert.match(
      shieldSource,
      /\[\s+-z\s+"\$current_user"\s+\]\s+&&\s+return\s+0/,
      'current_user 빈 문자열이면 GC skip (fail-close)'
    );
  });
});
