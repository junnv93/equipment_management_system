#!/usr/bin/env node
/**
 * verify-lint-ruleset-parity
 *
 * pre-commit (lintstaged) 게이트와 pre-push (backend `lint:ci`) 게이트가
 * 동일 ESLint 룰셋을 동일 파일 영역에 대해 강제하는지 정적 비교.
 *
 * 본 sprint 발생 incident (2026-05-06 9fbacfbc):
 * - lintstaged glob 이 backend test/ 영역을 누락 → randomUUID 위반이 main 진입
 * - lint:ci 가 pre-push 에서야 차단
 *
 * 본 스크립트는 두 게이트의 GLOB COVERAGE PARITY 와 CRITICAL RULE 등록을
 * SSOT 기준으로 검증. 실패 시 exit 1 + 결함 목록.
 *
 * 본 sprint 외 변경(예: 새 critical rule 등록)은 PARITY_SPEC SSOT 만 갱신하면
 * 자동 회귀 차단. 호출처 수정 불요.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── SSOT 정의 ─────────────────────────────────────────────────────────────
//
// 신규 critical rule 추가 시 본 객체만 갱신. 호출처는 자동 회귀 검증.

const PARITY_SPEC = Object.freeze({
  backend: {
    eslintConfig: 'apps/backend/.eslintrc.js',
    lintstagedConfig: '.lintstagedrc.json',
    lintCiPackage: 'apps/backend/package.json',
    /**
     * lintstaged glob entry 의 prefix — backend domain 식별자.
     * 본 prefix 가 일치하는 glob entry 가 backend SSOT 항목.
     */
    lintstagedGlobPrefix: 'apps/backend/',
    /**
     * lint:ci script 가 cwd=apps/backend 에서 실행되므로 glob 도 apps/backend
     * 기준 상대경로. lintstaged glob 은 repo root 기준이라 정규화 필요.
     */
    lintCiGlob: '{src,apps,libs,test}/**/*.ts',
    lintCiCwd: 'apps/backend',
    /**
     * lintstaged glob 이 lint:ci coverage 의 부분집합이면 fail.
     * 정확히는 lintstaged 가 lint:ci 가 검증하는 영역의 union 을 ⊇ 해야 함.
     * apps/backend 안에 실재하는 디렉토리는 src/ + test/ 만 (apps/libs 부재).
     */
    requiredLintstagedGlobSegments: ['src', 'test'],
    criticalRulesMustExist: ['no-restricted-imports', 'no-restricted-syntax'],
    /**
     * critical rule body 에 등장해야 할 식별자(직접 import 차단 대상).
     * SSOT 우회 검출용.
     */
    criticalRestrictedNames: ['randomUUID'],
    /**
     * critical restricted import path (no-restricted-imports paths 항목).
     */
    criticalRestrictedPaths: ['node:crypto', 'crypto'],
  },
});

// ─── 유틸 ──────────────────────────────────────────────────────────────────

/**
 * lintstaged glob 에서 `apps/backend/{src,test}/**\/*.ts` 와 같은 brace
 * expression 의 segment 추출. brace expansion 이 아니면 path segment 만 반환.
 */
function extractGlobSegments(glob, prefix) {
  if (!glob.startsWith(prefix)) return [];
  const tail = glob.slice(prefix.length);
  // {src,test}/**/*.ts → segments = [src, test]
  const braceMatch = tail.match(/^\{([^}]+)\}/);
  if (braceMatch) {
    return braceMatch[1].split(',').map((s) => s.trim());
  }
  // src/**/*.ts → segments = [src]
  const flatMatch = tail.match(/^([^/{*]+)/);
  return flatMatch ? [flatMatch[1]] : [];
}

function fail(msg, results) {
  results.failures.push(msg);
}

function pass(msg, results) {
  results.passed.push(msg);
}

// ─── 검증 ──────────────────────────────────────────────────────────────────

async function verifyBackendParity() {
  const spec = PARITY_SPEC.backend;
  const results = { passed: [], failures: [] };

  // 1. lintstaged config 가 backend eslint config 를 SSOT 로 사용하는지
  const lintstagedRaw = await readFile(join(ROOT, spec.lintstagedConfig), 'utf8');
  const lintstaged = JSON.parse(lintstagedRaw);

  const backendEntries = Object.entries(lintstaged).filter(([glob]) =>
    glob.startsWith(spec.lintstagedGlobPrefix)
  );

  if (backendEntries.length === 0) {
    fail(`lintstaged 에 ${spec.lintstagedGlobPrefix} glob 항목이 없음`, results);
    return results;
  }
  if (backendEntries.length > 1) {
    fail(
      `lintstaged 에 ${spec.lintstagedGlobPrefix} glob 항목이 ${backendEntries.length}개 — 단일 SSOT 위반`,
      results
    );
    return results;
  }

  const [backendGlob, backendCommands] = backendEntries[0];

  const eslintCommand = (Array.isArray(backendCommands) ? backendCommands : [backendCommands])
    .find((cmd) => cmd.includes('eslint'));

  if (!eslintCommand) {
    fail('lintstaged backend 항목에 eslint 명령이 없음', results);
    return results;
  }

  if (!eslintCommand.includes(`--config ${spec.eslintConfig}`)) {
    fail(
      `lintstaged backend eslint 가 SSOT config(${spec.eslintConfig})를 사용하지 않음. 현재: ${eslintCommand}`,
      results
    );
  } else {
    pass(`lintstaged backend eslint config = ${spec.eslintConfig}`, results);
  }

  // 2. lintstaged glob coverage ⊇ lint:ci 위반 영역
  const segments = extractGlobSegments(backendGlob, spec.lintstagedGlobPrefix);
  const missing = spec.requiredLintstagedGlobSegments.filter((seg) => !segments.includes(seg));

  if (missing.length > 0) {
    fail(
      `lintstaged backend glob 이 다음 영역을 커버하지 않음: ${missing.join(', ')} (현재 glob: ${backendGlob}, lint:ci coverage: ${spec.lintCiGlob} cwd=${spec.lintCiCwd})`,
      results
    );
  } else {
    pass(
      `lintstaged backend glob coverage ⊇ lint:ci required segments [${spec.requiredLintstagedGlobSegments.join(', ')}]`,
      results
    );
  }

  // 3. lint:ci script 가 동일 SSOT eslint config 사용
  const lintCiPkg = JSON.parse(await readFile(join(ROOT, spec.lintCiPackage), 'utf8'));
  const lintCiScript = lintCiPkg.scripts?.['lint:ci'];

  if (!lintCiScript) {
    fail(`${spec.lintCiPackage} 에 lint:ci script 없음`, results);
  } else if (!lintCiScript.includes(spec.lintCiGlob)) {
    fail(
      `lint:ci script glob 이 spec(${spec.lintCiGlob})과 불일치. 현재: ${lintCiScript}`,
      results
    );
  } else {
    pass(`lint:ci script glob = ${spec.lintCiGlob} (cwd=${spec.lintCiCwd})`, results);
  }

  // 4. 신규 critical rule 등록 검증 — eslint config 본문 SSOT 우회 검출
  const eslintConfigPath = join(ROOT, spec.eslintConfig);
  const eslintConfigBody = await readFile(eslintConfigPath, 'utf8');

  for (const rule of spec.criticalRulesMustExist) {
    // CommonJS module body 에서 룰 키가 등장해야 함
    if (!eslintConfigBody.includes(`'${rule}'`) && !eslintConfigBody.includes(`"${rule}"`)) {
      fail(`${spec.eslintConfig} 에 critical rule '${rule}' 정의 없음`, results);
    } else {
      pass(`${spec.eslintConfig} 에 ${rule} 정의 존재`, results);
    }
  }

  // 5. 차단 대상 식별자/path 등록 검증
  for (const name of spec.criticalRestrictedNames) {
    if (!eslintConfigBody.includes(name)) {
      fail(
        `${spec.eslintConfig} 에 차단 대상 식별자 '${name}' 등록 없음 — randomUUID 같은 SSOT 우회 차단 룰 누락 가능`,
        results
      );
    } else {
      pass(`${spec.eslintConfig} 에 차단 대상 ${name} 등록 존재`, results);
    }
  }
  for (const path of spec.criticalRestrictedPaths) {
    if (!eslintConfigBody.includes(`'${path}'`) && !eslintConfigBody.includes(`"${path}"`)) {
      fail(`${spec.eslintConfig} 에 차단 대상 path '${path}' 등록 없음`, results);
    } else {
      pass(`${spec.eslintConfig} 에 차단 대상 path '${path}' 등록 존재`, results);
    }
  }

  return results;
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  const backend = await verifyBackendParity();

  const elapsedMs = Date.now() - start;
  const total = backend.passed.length + backend.failures.length;

  if (backend.failures.length > 0) {
    console.error('❌ verify-lint-ruleset-parity FAIL');
    for (const f of backend.failures) {
      console.error(`  - ${f}`);
    }
    console.error(`(${total} checks, ${backend.failures.length} failed, ${elapsedMs}ms)`);
    process.exit(1);
  }

  console.log('✔ ruleset parity OK');
  for (const p of backend.passed) {
    console.log(`  - ${p}`);
  }
  console.log(`(${total} checks PASS, ${elapsedMs}ms)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ verify-lint-ruleset-parity ERROR:', err.stack ?? err.message);
  process.exit(2);
});
