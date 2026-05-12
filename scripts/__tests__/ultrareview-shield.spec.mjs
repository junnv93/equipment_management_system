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
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  rmSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SHIELD_SCRIPT = join(REPO_ROOT, 'scripts', 'ultrareview-shield.sh');
const PREFLIGHT_SCRIPT = join(REPO_ROOT, 'scripts', 'ultrareview-preflight.mjs');

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
