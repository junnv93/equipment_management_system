/**
 * verify-lint-ruleset-parity spec — Node 내장 test runner.
 *
 * 실행: `node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs`
 *
 * 본 spec 은 fixture 디렉토리 (.lintstagedrc.json + apps/backend/{.eslintrc.js,
 * package.json}) 를 임시로 만들어 실제 스크립트를 spawn — 본 repo 의 실제 config
 * 영향 0.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, '..', 'verify-lint-ruleset-parity.mjs');
const REPO_ROOT = resolve(__dirname, '..', '..');

/**
 * 임시 fixture repo 를 생성. 스크립트는 cwd 와 무관하게 자기 위치 기준 ROOT 를
 * 계산하므로 (__dirname/..), spec 에서는 스크립트를 fixture 영역으로 복사 + 거기서
 * 실행하는 패턴을 사용한다.
 */
function makeFixture({ lintstaged, eslintConfig, packageJson }) {
  const dir = mkdtempSync(join(tmpdir(), 'parity-fixture-'));
  // 스크립트가 ROOT/scripts/.. 구조를 가정하므로 fixture 도 동일 구조로
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  mkdirSync(join(dir, 'apps', 'backend'), { recursive: true });
  copyFileSync(SCRIPT_PATH, join(dir, 'scripts', 'verify-lint-ruleset-parity.mjs'));
  writeFileSync(join(dir, '.lintstagedrc.json'), JSON.stringify(lintstaged, null, 2));
  writeFileSync(join(dir, 'apps', 'backend', '.eslintrc.js'), eslintConfig);
  writeFileSync(
    join(dir, 'apps', 'backend', 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  return dir;
}

function runScript(dir) {
  const r = spawnSync('node', ['scripts/verify-lint-ruleset-parity.mjs'], {
    cwd: dir,
    encoding: 'utf8',
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const VALID_ESLINT_BODY = `
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{ name: 'node:crypto', importNames: ['randomUUID'] },
              { name: 'crypto', importNames: ['randomUUID'] }]
    }],
    'no-restricted-syntax': ['error', { selector: "MemberExpression[object.name='crypto'][property.name='randomUUID']" }],
  },
};
`;

const VALID_PACKAGE_JSON = {
  name: 'backend',
  scripts: { 'lint:ci': 'eslint "{src,apps,libs,test}/**/*.ts"' },
};

describe('verify-lint-ruleset-parity', () => {
  test('정상 fixture (glob 정합 + 룰 등록 완비) → PASS', () => {
    const dir = makeFixture({
      lintstaged: {
        'apps/backend/{src,test}/**/*.ts': [
          'eslint --quiet --fix --config apps/backend/.eslintrc.js',
        ],
      },
      eslintConfig: VALID_ESLINT_BODY,
      packageJson: VALID_PACKAGE_JSON,
    });
    try {
      const r = runScript(dir);
      assert.equal(r.code, 0, `PASS 기대. stderr=${r.stderr}`);
      assert.match(r.stdout, /ruleset parity OK/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('lintstaged glob 이 test 누락 → FAIL', () => {
    const dir = makeFixture({
      lintstaged: {
        'apps/backend/src/**/*.ts': [
          'eslint --quiet --fix --config apps/backend/.eslintrc.js',
        ],
      },
      eslintConfig: VALID_ESLINT_BODY,
      packageJson: VALID_PACKAGE_JSON,
    });
    try {
      const r = runScript(dir);
      assert.equal(r.code, 1, 'glob 누락은 FAIL 기대');
      assert.match(r.stderr, /test/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('eslint config 가 wrong path → FAIL', () => {
    const dir = makeFixture({
      lintstaged: {
        'apps/backend/{src,test}/**/*.ts': [
          'eslint --quiet --fix --config WRONG/path.js',
        ],
      },
      eslintConfig: VALID_ESLINT_BODY,
      packageJson: VALID_PACKAGE_JSON,
    });
    try {
      const r = runScript(dir);
      assert.equal(r.code, 1, 'wrong config path 는 FAIL');
      assert.match(r.stderr, /SSOT config/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('eslint config 에 randomUUID 차단 등록 누락 → FAIL', () => {
    const dir = makeFixture({
      lintstaged: {
        'apps/backend/{src,test}/**/*.ts': [
          'eslint --quiet --fix --config apps/backend/.eslintrc.js',
        ],
      },
      eslintConfig: `module.exports = { rules: {} };`,
      packageJson: VALID_PACKAGE_JSON,
    });
    try {
      const r = runScript(dir);
      assert.equal(r.code, 1, 'critical rule 누락은 FAIL');
      assert.match(r.stderr, /no-restricted-imports/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('lint:ci script 가 wrong glob → FAIL', () => {
    const dir = makeFixture({
      lintstaged: {
        'apps/backend/{src,test}/**/*.ts': [
          'eslint --quiet --fix --config apps/backend/.eslintrc.js',
        ],
      },
      eslintConfig: VALID_ESLINT_BODY,
      packageJson: { name: 'backend', scripts: { 'lint:ci': 'eslint "src/**/*.ts"' } },
    });
    try {
      const r = runScript(dir);
      assert.equal(r.code, 1, 'lint:ci glob 불일치는 FAIL');
      assert.match(r.stderr, /lint:ci script glob/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
