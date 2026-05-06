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
    lintCiScriptName: 'lint:ci',
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
  frontend: {
    eslintConfig: 'apps/frontend/eslint.config.mjs',
    lintstagedConfig: '.lintstagedrc.json',
    lintCiPackage: 'apps/frontend/package.json',
    /**
     * lintstaged glob entry 의 prefix — frontend domain 식별자.
     */
    lintstagedGlobPrefix: 'apps/frontend/',
    /**
     * frontend lint script 는 cwd=apps/frontend 에서 `eslint .` (전 영역).
     * 즉 lint == lint:ci coverage 동등 — backend 와 달리 glob coverage gap 결함은
     * 구조상 발생 불가 (lintstaged glob 도 frontend 전 영역 prefix).
     * 본 검증은 critical rule 등록 회귀에 집중.
     */
    lintCiGlob: '.',
    lintCiCwd: 'apps/frontend',
    /**
     * frontend 는 별도 lint:ci 가 없고 `lint` script 가 게이트 역할 — pre-push 에서
     * `pnpm --filter frontend run lint` 로 호출됨.
     */
    lintCiScriptName: 'lint',
    /**
     * frontend lintstaged glob 은 단일 prefix (apps/frontend 전 영역) —
     * backend 와 달리 segment 기반 검증 불요 (전 영역 커버).
     * 본 필드는 정합성 표현 목적 (빈 배열).
     */
    requiredLintstagedGlobSegments: [],
    criticalRulesMustExist: ['no-restricted-imports', 'no-restricted-syntax'],
    /**
     * frontend SSOT 강제 룰 식별자 — eslint.config.mjs 본문에 const 로 정의되어
     * `no-restricted-syntax` rules 배열에 spread 되어야 함.
     */
    criticalRestrictedNames: ['STATUS_LITERAL_RULE', 'HEX_COLOR_RULE', 'DDAY_TONE_RULE'],
    /**
     * frontend `no-restricted-imports` patterns 의 group 값 — auth/rbac/* 직접 import 차단.
     * 회귀 검출용 (UserRole / Permission SSOT 우회 차단).
     */
    criticalRestrictedPaths: ['auth/rbac/roles.enum', 'auth/rbac/permissions.enum'],
  },
  packages: {
    /**
     * packages 도메인은 root `.eslintrc.js` 의 overrides 배열에서 packages glob
     * override 항목을 SSOT 로 사용 (apps/* 처럼 도메인별 eslint config 파일 분리 X).
     * lintstaged 도 root config 를 그대로 참조 → eslintConfig = root 파일.
     */
    eslintConfig: '.eslintrc.js',
    lintstagedConfig: '.lintstagedrc.json',
    lintstagedGlobPrefix: 'packages/',
    /**
     * packages 는 lint:ci script 부재 도메인. lint 게이트는 lintstaged + tsc 만으로
     * 운영 — `packages/<pkg>/package.json` 에 lint script 추가는 build chain 복잡도
     * 증가 대비 실익 0 (commit-pipeline-safety SHOULD 후속 sprint S-2 결정).
     *
     * `lintCiScriptName: null` 시 verifyDomainParity step 3 (script glob 일치) 는 skip,
     * step 4-5 (critical rule + restricted 패턴) 만 검증.
     */
    lintCiPackage: null,
    lintCiGlob: null,
    lintCiCwd: null,
    lintCiScriptName: null,
    /**
     * packages lintstaged glob 은 `packages/**\/*.ts` 단일 prefix — 전 영역 커버.
     * frontend 와 동일 패턴 (segment 검증 불요).
     */
    requiredLintstagedGlobSegments: [],
    /**
     * root `.eslintrc.js` 의 packages override 가 갖춰야 할 핵심 룰.
     * - @typescript-eslint/no-explicit-any: any 회귀 차단 (warn → 향후 error 격상)
     * - @typescript-eslint/no-unused-vars: dead code 회귀 차단
     * - @typescript-eslint/ban-ts-comment: @ts-ignore 무차별 사용 차단
     */
    criticalRulesMustExist: [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/no-unused-vars',
      '@typescript-eslint/ban-ts-comment',
    ],
    /**
     * packages 자체가 SSOT 정의처 — backend/frontend 처럼 SSOT 우회 차단 룰
     * (no-restricted-imports/syntax) 부재. 빈 배열 = 검증 항목 0.
     */
    criticalRestrictedNames: [],
    criticalRestrictedPaths: [],
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

/**
 * 도메인-agnostic parity 검증. backend/frontend 공통 5단계 검증을 spec 기반으로 실행.
 * domainLabel 은 결과 메시지 prefix (`backend` / `frontend`).
 */
async function verifyDomainParity(domainLabel, spec) {
  const results = { passed: [], failures: [] };

  // 1. lintstaged config 가 도메인 SSOT eslint config 를 사용하는지
  const lintstagedRaw = await readFile(join(ROOT, spec.lintstagedConfig), 'utf8');
  const lintstaged = JSON.parse(lintstagedRaw);

  const domainEntries = Object.entries(lintstaged).filter(([glob]) =>
    glob.startsWith(spec.lintstagedGlobPrefix)
  );

  if (domainEntries.length === 0) {
    fail(`[${domainLabel}] lintstaged 에 ${spec.lintstagedGlobPrefix} glob 항목이 없음`, results);
    return results;
  }
  if (domainEntries.length > 1) {
    fail(
      `[${domainLabel}] lintstaged 에 ${spec.lintstagedGlobPrefix} glob 항목이 ${domainEntries.length}개 — 단일 SSOT 위반`,
      results
    );
    return results;
  }

  const [domainGlob, domainCommands] = domainEntries[0];

  const eslintCommand = (Array.isArray(domainCommands) ? domainCommands : [domainCommands])
    .find((cmd) => cmd.includes('eslint'));

  if (!eslintCommand) {
    fail(`[${domainLabel}] lintstaged 항목에 eslint 명령이 없음`, results);
    return results;
  }

  if (!eslintCommand.includes(`--config ${spec.eslintConfig}`)) {
    fail(
      `[${domainLabel}] lintstaged eslint 가 SSOT config(${spec.eslintConfig})를 사용하지 않음. 현재: ${eslintCommand}`,
      results
    );
  } else {
    pass(`[${domainLabel}] lintstaged eslint config = ${spec.eslintConfig}`, results);
  }

  // 2. lintstaged glob coverage 검증 — segment 기반 (backend) 또는 prefix-only (frontend)
  if (spec.requiredLintstagedGlobSegments.length > 0) {
    const segments = extractGlobSegments(domainGlob, spec.lintstagedGlobPrefix);
    const missing = spec.requiredLintstagedGlobSegments.filter((seg) => !segments.includes(seg));

    if (missing.length > 0) {
      fail(
        `[${domainLabel}] lintstaged glob 이 다음 영역을 커버하지 않음: ${missing.join(', ')} (현재 glob: ${domainGlob}, lint script glob: ${spec.lintCiGlob} cwd=${spec.lintCiCwd})`,
        results
      );
    } else {
      pass(
        `[${domainLabel}] lintstaged glob coverage ⊇ required segments [${spec.requiredLintstagedGlobSegments.join(', ')}]`,
        results
      );
    }
  } else {
    pass(
      `[${domainLabel}] lintstaged glob = ${domainGlob} (전 영역 prefix — segment 검증 불요)`,
      results
    );
  }

  // 3. lint script 가 동일 SSOT 적용 영역 — script 존재 + glob 일치
  //    packages 처럼 lint script 부재 도메인은 lintCiScriptName=null 로 표시 → step skip.
  if (spec.lintCiScriptName === null) {
    pass(
      `[${domainLabel}] lint script 부재 도메인 — lintstaged + tsc 만으로 게이트 (script glob 검증 skip)`,
      results
    );
  } else {
    const lintCiPkg = JSON.parse(await readFile(join(ROOT, spec.lintCiPackage), 'utf8'));
    const lintCiScript = lintCiPkg.scripts?.[spec.lintCiScriptName];

    if (!lintCiScript) {
      fail(
        `[${domainLabel}] ${spec.lintCiPackage} 에 ${spec.lintCiScriptName} script 없음`,
        results
      );
    } else if (!lintCiScript.includes(spec.lintCiGlob)) {
      fail(
        `[${domainLabel}] ${spec.lintCiScriptName} script glob 이 spec(${spec.lintCiGlob})과 불일치. 현재: ${lintCiScript}`,
        results
      );
    } else {
      pass(
        `[${domainLabel}] ${spec.lintCiScriptName} script glob = ${spec.lintCiGlob} (cwd=${spec.lintCiCwd})`,
        results
      );
    }
  }

  // 4. critical rule 등록 검증
  const eslintConfigPath = join(ROOT, spec.eslintConfig);
  const eslintConfigBody = await readFile(eslintConfigPath, 'utf8');

  for (const rule of spec.criticalRulesMustExist) {
    if (!eslintConfigBody.includes(`'${rule}'`) && !eslintConfigBody.includes(`"${rule}"`)) {
      fail(`[${domainLabel}] ${spec.eslintConfig} 에 critical rule '${rule}' 정의 없음`, results);
    } else {
      pass(`[${domainLabel}] ${spec.eslintConfig} 에 ${rule} 정의 존재`, results);
    }
  }

  // 5. 차단 대상 식별자/path 등록 검증
  for (const name of spec.criticalRestrictedNames) {
    if (!eslintConfigBody.includes(name)) {
      fail(
        `[${domainLabel}] ${spec.eslintConfig} 에 차단 대상 식별자 '${name}' 등록 없음 — SSOT 우회 차단 룰 누락 가능`,
        results
      );
    } else {
      pass(`[${domainLabel}] ${spec.eslintConfig} 에 차단 대상 ${name} 등록 존재`, results);
    }
  }
  for (const path of spec.criticalRestrictedPaths) {
    // path 는 quoted literal('crypto') 또는 glob-wrapped ('**/auth/rbac/roles.enum')
    // 둘 다 허용 — substring 검색
    if (!eslintConfigBody.includes(path)) {
      fail(`[${domainLabel}] ${spec.eslintConfig} 에 차단 대상 path '${path}' 등록 없음`, results);
    } else {
      pass(`[${domainLabel}] ${spec.eslintConfig} 에 차단 대상 path '${path}' 등록 존재`, results);
    }
  }

  return results;
}

const verifyBackendParity = () => verifyDomainParity('backend', PARITY_SPEC.backend);
const verifyFrontendParity = () => verifyDomainParity('frontend', PARITY_SPEC.frontend);
const verifyPackagesParity = () => verifyDomainParity('packages', PARITY_SPEC.packages);

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  // 도메인 선택 (테스트 fixture 격리용 — 정상 실행 시 모두 검증)
  // 예: EMS_PARITY_DOMAINS=backend → backend만 검증 (frontend mock 불요)
  const domainsEnv = process.env.EMS_PARITY_DOMAINS;
  const domains = domainsEnv
    ? domainsEnv.split(',').map((d) => d.trim())
    : ['backend', 'frontend', 'packages'];

  const tasks = [];
  if (domains.includes('backend')) tasks.push(verifyBackendParity());
  if (domains.includes('frontend')) tasks.push(verifyFrontendParity());
  if (domains.includes('packages')) tasks.push(verifyPackagesParity());

  const results = await Promise.all(tasks);
  const allPassed = results.flatMap((r) => r.passed);
  const allFailures = results.flatMap((r) => r.failures);
  const elapsedMs = Date.now() - start;
  const total = allPassed.length + allFailures.length;

  if (allFailures.length > 0) {
    console.error('❌ verify-lint-ruleset-parity FAIL');
    for (const f of allFailures) {
      console.error(`  - ${f}`);
    }
    console.error(`(${total} checks, ${allFailures.length} failed, ${elapsedMs}ms)`);
    process.exit(1);
  }

  console.log('✔ ruleset parity OK');
  for (const p of allPassed) {
    console.log(`  - ${p}`);
  }
  console.log(`(${total} checks PASS, ${elapsedMs}ms)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ verify-lint-ruleset-parity ERROR:', err.stack ?? err.message);
  process.exit(2);
});
