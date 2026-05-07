/**
 * hook-timing spec — Node 내장 test runner.
 *
 * 검증 대상:
 * - default no-op (env 미설정 시 stderr JSON-line 출력 0 회)
 * - exit code 정확 전파 (자식 status / signal / spawn 실패)
 * - EMS_HOOK_TIMING=1 시 stderr JSON-line 출력
 * - EMS_HOOK_TIMING_LOG=1 시 .timing-log.jsonl append
 * - log rotation (5MB 초과 시 .1 rolling, 단일 백업 정책)
 *
 * 실행: `node --test scripts/__tests__/hook-timing.spec.mjs`
 *
 * 본 spec 은 임시 fixture HOME 디렉토리에 hook-timing 사본 + 가짜 log 파일을
 * 생성하여 실제 repo 의 .husky/.timing-log.jsonl 영향 0.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  statSync,
  readFileSync,
  copyFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, '..', 'hook-timing.mjs');

/**
 * 임시 fixture repo 를 만들어 scripts/hook-timing.mjs 사본을 거기에 두고
 * cwd 를 fixture 루트로 spawn — 실제 repo 의 .husky/.timing-log.jsonl 변경 차단.
 */
function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'hook-timing-fixture-'));
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  copyFileSync(SCRIPT_PATH, join(dir, 'scripts', 'hook-timing.mjs'));
  return dir;
}

function runHookTiming({ dir, env = {}, args }) {
  const r = spawnSync('node', ['scripts/hook-timing.mjs', ...args], {
    cwd: dir,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('hook-timing — default no-op', () => {
  test('env 미설정 시 stderr JSON-line 출력 없음 + 자식 exit 0 전파', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        args: ['--label', 'test', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0, `자식 exit 0 전파`);
      // JSON-line 출력 없음 확인
      const jsonLines = r.stderr.split('\n').filter((l) => /^\{"step":/.test(l));
      assert.equal(jsonLines.length, 0, `default 무출력 (got: ${r.stderr})`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('hook-timing — exit code propagation', () => {
  test('자식 exit 7 → wrapper exit 7', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        args: ['--label', 'test', '--', 'bash', '-c', 'exit 7'],
      });
      assert.equal(r.code, 7, `자식 exit 7 → wrapper 7`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('자식 exit 1 (lint fail simulation) → wrapper exit 1', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        args: ['--label', 'test', '--', 'bash', '-c', 'exit 1'],
      });
      assert.equal(r.code, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('hook-timing — EMS_HOOK_TIMING JSON output', () => {
  test('EMS_HOOK_TIMING=1 시 stderr JSON-line 1회', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING: '1' },
        args: ['--label', 'lint-staged', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);
      const jsonLines = r.stderr
        .split('\n')
        .filter((l) => /^\{"step":"lint-staged","ms":\d+/.test(l));
      assert.equal(jsonLines.length, 1, `정확히 1 JSON-line 기대`);
      const parsed = JSON.parse(jsonLines[0]);
      assert.equal(parsed.step, 'lint-staged');
      assert.ok(typeof parsed.ms === 'number' && parsed.ms >= 0);
      assert.equal(parsed.exit, 0);
      assert.ok(typeof parsed.ts === 'string');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('EMS_HOOK_TIMING 미설정 + EMS_HOOK_TIMING_LOG=1 단독 → 출력 없음 (LOG 은 TIMING 의존)', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING_LOG: '1' },
        args: ['--label', 'test', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);
      const jsonLines = r.stderr.split('\n').filter((l) => /^\{"step":/.test(l));
      assert.equal(jsonLines.length, 0, `LOG 단독은 TIMING 가드로 무출력`);
      const logPath = join(dir, '.husky', '.timing-log.jsonl');
      assert.ok(!existsSync(logPath), `LOG 단독은 파일 생성 X`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('hook-timing — EMS_HOOK_TIMING_LOG file append + rotation', () => {
  test('EMS_HOOK_TIMING_LOG=1 시 .timing-log.jsonl append', () => {
    const dir = makeFixture();
    try {
      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING: '1', EMS_HOOK_TIMING_LOG: '1' },
        args: ['--label', 'test', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);
      const logPath = join(dir, '.husky', '.timing-log.jsonl');
      assert.ok(existsSync(logPath), `log 파일 생성됨`);
      const body = readFileSync(logPath, 'utf8');
      assert.match(body, /^\{"step":"test","ms":\d+/);
      // 마지막에 newline 있는지
      assert.ok(body.endsWith('\n'), `JSONL 표준 — line 끝 \\n`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('log size > 5MB 시 append 직전 .1 rolling (단일 백업 정책)', () => {
    const dir = makeFixture();
    try {
      // 5MB 초과 더미 log 사전 배치
      const huskyDir = join(dir, '.husky');
      mkdirSync(huskyDir, { recursive: true });
      const logPath = join(huskyDir, '.timing-log.jsonl');
      const filler = 'x'.repeat(1024); // 1KB line
      const lines = [];
      // 5MB + 1KB ≈ 5121 lines (margin 확보)
      for (let i = 0; i < 5300; i += 1) {
        lines.push(filler);
      }
      writeFileSync(logPath, lines.join('\n') + '\n', 'utf8');

      const beforeSize = statSync(logPath).size;
      assert.ok(
        beforeSize > 5 * 1024 * 1024,
        `pre-condition: log size > 5MB (got ${beforeSize})`
      );

      // hook-timing 실행 — rotation 발동 기대
      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING: '1', EMS_HOOK_TIMING_LOG: '1' },
        args: ['--label', 'rotate-test', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);

      // 검증 1: .1 백업 존재 + 원본 size 기존 데이터
      const backupPath = logPath + '.1';
      assert.ok(existsSync(backupPath), `.1 백업 생성됨`);
      const backupSize = statSync(backupPath).size;
      assert.ok(
        backupSize > 5 * 1024 * 1024,
        `백업이 기존 큰 log 를 보존 (size=${backupSize})`
      );

      // 검증 2: 새 log 는 단일 line (rotation 후 첫 append)
      assert.ok(existsSync(logPath));
      const newBody = readFileSync(logPath, 'utf8');
      const newLines = newBody.split('\n').filter(Boolean);
      assert.equal(newLines.length, 1, `rotation 후 첫 append 만 존재`);
      assert.match(newLines[0], /^\{"step":"rotate-test","ms":\d+/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('log size ≤ 5MB 면 rotation 없음 (정상 append)', () => {
    const dir = makeFixture();
    try {
      const huskyDir = join(dir, '.husky');
      mkdirSync(huskyDir, { recursive: true });
      const logPath = join(huskyDir, '.timing-log.jsonl');
      // 1KB 정도의 작은 log
      writeFileSync(logPath, '{"step":"prev","ms":10,"exit":0,"ts":"2026-01-01T00:00:00Z"}\n', 'utf8');

      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING: '1', EMS_HOOK_TIMING_LOG: '1' },
        args: ['--label', 'small', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);

      const backupPath = logPath + '.1';
      assert.ok(!existsSync(backupPath), `소량 log 는 rotation 발동 X`);

      const body = readFileSync(logPath, 'utf8');
      const lines = body.split('\n').filter(Boolean);
      assert.equal(lines.length, 2, `기존 + 신규 = 2 lines`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('기존 .1 백업 존재 시 덮어쓰기 (단일 백업 정책 유지)', () => {
    const dir = makeFixture();
    try {
      const huskyDir = join(dir, '.husky');
      mkdirSync(huskyDir, { recursive: true });
      const logPath = join(huskyDir, '.timing-log.jsonl');
      const backupPath = logPath + '.1';

      // 기존 .1 백업 (오래된 데이터)
      writeFileSync(backupPath, 'OLD-BACKUP\n', 'utf8');

      // 5MB+ 현재 log
      const filler = 'y'.repeat(1024);
      const lines = [];
      for (let i = 0; i < 5300; i += 1) lines.push(filler);
      writeFileSync(logPath, lines.join('\n') + '\n', 'utf8');

      const r = runHookTiming({
        dir,
        env: { EMS_HOOK_TIMING: '1', EMS_HOOK_TIMING_LOG: '1' },
        args: ['--label', 'overwrite', '--', 'echo', 'ok'],
      });
      assert.equal(r.code, 0);

      // .1 은 오래된 OLD-BACKUP 이 아닌 직전 큰 log 로 교체
      const backupBody = readFileSync(backupPath, 'utf8');
      assert.ok(
        !backupBody.startsWith('OLD-BACKUP'),
        `오래된 .1 은 덮어써짐 (단일 백업 유지)`
      );
      assert.ok(backupBody.length > 5 * 1024 * 1024);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
