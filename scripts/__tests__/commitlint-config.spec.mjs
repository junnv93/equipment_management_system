/**
 * commitlint config spec — Node 내장 test runner.
 *
 * 검증 대상:
 * - SCOPE_LIST SSOT (export, length, 핵심 모듈 포함, 정렬, immutable)
 * - scope-enum / body-max-line-length / header-case / body-leading-blank /
 *   footer-leading-blank 룰 등록
 * - 실제 commit message 동작 (valid PASS / invalid FAIL × 3 경로)
 *
 * 실행: `node --test scripts/__tests__/commitlint-config.spec.mjs`
 *
 * 본 spec 은 root `commitlint.config.js` 를 require 하므로 별도 fixture 불필요.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const require = createRequire(import.meta.url);

const config = require(resolve(REPO_ROOT, 'commitlint.config.js'));

/**
 * commitlint CLI 호출 — message 를 stdin 으로 전달.
 * @returns {{code: number, stdout: string, stderr: string}}
 */
function runCommitlint(message) {
  // `npx --no --` 다음 명령 — husky/commit-msg 와 동일 호출 패턴.
  const r = spawnSync(
    'npx',
    ['--no', '--', 'commitlint', '--config', 'commitlint.config.js'],
    {
      cwd: REPO_ROOT,
      input: message,
      encoding: 'utf8',
    }
  );
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('commitlint.config.js — SCOPE_LIST SSOT', () => {
  test('SCOPE_LIST export 존재 + 배열 + Object.freeze', () => {
    assert.ok(Array.isArray(config.SCOPE_LIST), 'SCOPE_LIST 배열');
    assert.ok(Object.isFrozen(config.SCOPE_LIST), 'Object.freeze 적용 (mutation 차단)');
  });

  test('SCOPE_LIST 길이 ≥ 30 (24 backend + 16+ meta)', () => {
    assert.ok(
      config.SCOPE_LIST.length >= 30,
      `현재 길이: ${config.SCOPE_LIST.length} (≥30 기대)`
    );
  });

  test('SCOPE_LIST 핵심 backend 모듈 포함', () => {
    const required = [
      'approvals',
      'auth',
      'calibration',
      'calibration-plans',
      'checkouts',
      'equipment',
      'equipment-imports',
      'non-conformances',
      'notifications',
      'reports',
      'users',
    ];
    for (const scope of required) {
      assert.ok(config.SCOPE_LIST.includes(scope), `'${scope}' 누락`);
    }
  });

  test('SCOPE_LIST 메타 scope 포함 (ci / commit-pipeline / hooks / docs / harness / skill)', () => {
    const required = ['ci', 'commit-pipeline', 'hooks', 'docs', 'harness', 'skill'];
    for (const scope of required) {
      assert.ok(config.SCOPE_LIST.includes(scope), `'${scope}' 누락`);
    }
  });

  test('SCOPE_LIST 정렬 + 중복 없음', () => {
    const sorted = [...config.SCOPE_LIST].sort();
    assert.deepEqual(config.SCOPE_LIST, sorted, 'SCOPE_LIST 정렬');
    const uniqueSet = new Set(config.SCOPE_LIST);
    assert.equal(uniqueSet.size, config.SCOPE_LIST.length, '중복 entry 없음');
  });

  test('SCOPE_LIST JSON 직렬화 가능 (자동화 활용 — S-1 SHOULD)', () => {
    const json = JSON.stringify(config.SCOPE_LIST);
    const parsed = JSON.parse(json);
    assert.equal(parsed.length, config.SCOPE_LIST.length);
  });

  test('BACKEND_MODULE_SCOPES + META_SCOPES export', () => {
    assert.ok(Array.isArray(config.BACKEND_MODULE_SCOPES));
    assert.ok(Array.isArray(config.META_SCOPES));
    assert.ok(Object.isFrozen(config.BACKEND_MODULE_SCOPES));
    assert.ok(Object.isFrozen(config.META_SCOPES));
    assert.equal(config.BACKEND_MODULE_SCOPES.length, 24, '24 backend modules SSOT');
  });
});

describe('commitlint.config.js — 룰 등록', () => {
  test('필수 위생 룰 등록 (scope-enum / body-max-line-length / subject-case / body-leading-blank / footer-leading-blank)', () => {
    const rules = config.rules;
    assert.ok(rules['scope-enum'], 'scope-enum 룰 등록');
    assert.equal(rules['scope-enum'][0], 2, 'scope-enum error level');
    assert.equal(rules['scope-enum'][1], 'always');
    assert.deepEqual(rules['scope-enum'][2], config.SCOPE_LIST, 'scope-enum value === SCOPE_LIST');

    assert.ok(rules['body-max-line-length'], 'body-max-line-length 등록');
    assert.equal(rules['body-max-line-length'][2], 100);

    // subject-case: 대문자 시작 케이스 reject (PascalCase identifier 중간 허용).
    // header-case='lower-case' 는 PascalCase identifier 합법 commit 도 reject 하므로 미도입.
    assert.ok(rules['subject-case'], 'subject-case 룰 등록');
    assert.equal(rules['subject-case'][1], 'never');
    assert.ok(
      Array.isArray(rules['subject-case'][2]) &&
        rules['subject-case'][2].includes('start-case') &&
        rules['subject-case'][2].includes('pascal-case'),
      'subject-case never 리스트에 sentence/start/pascal/upper 포함'
    );

    assert.ok(rules['body-leading-blank'], 'body-leading-blank 등록');
    assert.equal(rules['body-leading-blank'][0], 1, 'warn (legacy 호환)');

    assert.ok(rules['footer-leading-blank'], 'footer-leading-blank 등록');
    assert.equal(rules['footer-leading-blank'][0], 1, 'warn');
  });

  test('기존 룰 유지 (regression — type-enum / type-case / header-max-length)', () => {
    const rules = config.rules;
    assert.equal(rules['type-enum'][0], 2);
    assert.ok(rules['type-enum'][2].includes('feat'));
    assert.ok(rules['type-enum'][2].includes('fix'));
    assert.equal(rules['type-case'][2], 'lower-case');
    assert.equal(rules['header-max-length'][2], 100);
  });
});

describe('commitlint.config.js — 실제 동작 검증 (CLI spawn)', () => {
  test('valid: feat(checkouts): valid sample message → exit 0', () => {
    const r = runCommitlint('feat(checkouts): valid sample message');
    assert.equal(r.code, 0, `expected pass. stdout=${r.stdout} stderr=${r.stderr}`);
  });

  test('valid: fix(calibration): bug fix message → exit 0', () => {
    const r = runCommitlint('fix(calibration): bug fix message');
    assert.equal(r.code, 0, `expected pass. stderr=${r.stderr}`);
  });

  test('invalid scope: feat(unknown_scope_xyz): bad → exit 1', () => {
    const r = runCommitlint('feat(unknown_scope_xyz): bad');
    assert.notEqual(r.code, 0, `expected fail. stdout=${r.stdout}`);
    assert.match(r.stdout + r.stderr, /scope/i);
  });

  test('invalid subject-case (Start Case): feat(checkouts): Bad Case → exit 1', () => {
    // subject 가 Start-Case (각 단어 첫글자 대문자)면 reject — conventional 표준.
    const r = runCommitlint('feat(checkouts): Bad Case');
    assert.notEqual(r.code, 0, 'subject-case start-case 위반은 fail');
  });

  test('invalid type-case (Feat): Feat(checkouts): bla → exit 1', () => {
    // type-case 'lower-case' 룰 — 대문자 type 차단.
    const r = runCommitlint('Feat(checkouts): valid subject');
    assert.notEqual(r.code, 0, 'type-case 위반은 fail');
  });

  test('valid: PascalCase identifier 중간 등장은 PASS', () => {
    // 실제 운영 commit 빈도 높은 패턴 — UserRole 등 PascalCase 식별자.
    // subject-case never 리스트는 시작 케이스만 검증 — 중간 PascalCase 단어 허용.
    const r = runCommitlint('fix(auth): remove unused UserRole import');
    assert.equal(r.code, 0, `PascalCase identifier 합법. stderr=${r.stderr}`);
  });

  test('invalid type: foo(checkouts): unknown type → exit 1', () => {
    const r = runCommitlint('foo(checkouts): unknown type');
    assert.notEqual(r.code, 0, 'type-enum 외 type 은 fail');
  });
});
