/**
 * precommit-staged-guard spec — Node 내장 test runner.
 *
 * 실행: `node --test scripts/__tests__/precommit-staged-guard.spec.mjs`
 *
 * 본 spec 은 child_process 로 실제 가드 스크립트를 spawn — git index 격리를 위해
 * 각 case 마다 임시 git 저장소(tmpRepo) 를 초기화한다 (실제 main repo index 영향 0).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUARD_SCRIPT = resolve(__dirname, '..', 'precommit-staged-guard.mjs');

function makeTmpRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'precommit-guard-'));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 'test@local'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  spawnSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: dir });
  return dir;
}

function stageFiles(dir, files) {
  for (const { name, content } of files) {
    const full = join(dir, name);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  spawnSync('git', ['add', ...files.map((f) => f.name)], { cwd: dir });
}

function runGuard(dir, env = {}) {
  const result = spawnSync('node', [GUARD_SCRIPT], {
    cwd: dir,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('precommit-staged-guard', () => {
  test('정상 모드: 0 staged 파일 → 즉시 통과', () => {
    const dir = makeTmpRepo();
    try {
      const r = runGuard(dir);
      assert.equal(r.code, 0, 'exit 0 기대');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('정상 모드: 5 staged 파일 → stat 출력 + 통과', () => {
    const dir = makeTmpRepo();
    try {
      stageFiles(
        dir,
        Array.from({ length: 5 }, (_, i) => ({ name: `f${i}.txt`, content: `content ${i}` }))
      );
      const r = runGuard(dir);
      assert.equal(r.code, 0, 'exit 0 기대');
      assert.match(r.stderr, /staged 5개 파일/, 'stat 출력 포함 기대');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('정상 모드: 11 staged 파일 → stat 출력 + 통과 (인지 강제만)', () => {
    const dir = makeTmpRepo();
    try {
      stageFiles(
        dir,
        Array.from({ length: 11 }, (_, i) => ({ name: `f${i}.txt`, content: `content ${i}` }))
      );
      const r = runGuard(dir);
      assert.equal(r.code, 0, '정상 모드 exit 0 기대 (block 없음)');
      assert.match(r.stderr, /staged 11개 파일/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('strict 모드: 11+ staged 파일 → block (exit 1)', () => {
    const dir = makeTmpRepo();
    try {
      stageFiles(
        dir,
        Array.from({ length: 11 }, (_, i) => ({ name: `f${i}.txt`, content: `content ${i}` }))
      );
      const r = runGuard(dir, {
        EMS_PRECOMMIT_STRICT: '1',
        EMS_PRECOMMIT_GUARD_NO_MTIME: '1', // mtime 검증은 별도 case
      });
      assert.equal(r.code, 1, 'strict 차단 기대');
      assert.match(r.stderr, /STRICT 차단/);
      assert.match(r.stderr, /staged 11개/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('strict 모드: 5 파일 + mtime 정상 → 통과', () => {
    const dir = makeTmpRepo();
    try {
      stageFiles(
        dir,
        Array.from({ length: 5 }, (_, i) => ({ name: `f${i}.txt`, content: `content ${i}` }))
      );
      const r = runGuard(dir, {
        EMS_PRECOMMIT_STRICT: '1',
        EMS_PRECOMMIT_GUARD_NO_MTIME: '1',
      });
      assert.equal(r.code, 0, 'strict + 5파일 + mtime 무시 → PASS');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('성능: 5 파일 처리 1초 이내', () => {
    const dir = makeTmpRepo();
    try {
      stageFiles(
        dir,
        Array.from({ length: 5 }, (_, i) => ({ name: `f${i}.txt`, content: `content ${i}` }))
      );
      const t0 = Date.now();
      runGuard(dir);
      const elapsed = Date.now() - t0;
      assert.ok(elapsed < 1000, `1s 이내 기대 (실제 ${elapsed}ms)`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
