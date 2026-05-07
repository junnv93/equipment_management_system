/**
 * ADR-0006 Same-Origin Reverse-Proxy 모델 SSOT invariant 단위 테스트
 *
 * 회귀 차단 목적: api-routing.ts 변경 시 두 집합의 disjoint 성질이
 * 깨지면 즉시 감지한다. verify-routing-origin pre-push gate가 본 spec을
 * 경로 변경 시 자동 실행한다.
 *
 * Invariant: BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅
 *
 * 5-place SSOT 정합 (sprint csrf-invariants-ssot-closure 2026-05-07 추가):
 *   ① packages/shared-constants/src/api-routing.ts NEXTAUTH_HANDLER_PATHS (TS SSOT)
 *   ② scripts/diagnostics/csrf-invariants.json nextAuthHandlerPaths.all
 *   ③ infra/nginx/lan.conf regex group
 *   ④ infra/nginx/nginx.conf.template regex group
 *   ⑤ apps/frontend/next.config.js NEXTAUTH_HANDLER_REGEX_GROUP
 *
 * 7 invariants 결빙:
 *   - cookieInvariants (Auth.js v5 only, v4 dead invariant 제거)
 *   - nextAuthClientBasePath (lib/auth.ts basePath override 부재)
 *   - serviceWorkerInvariants.swEntryPoint (fs 존재)
 *   - nginxRoutingInvariants.regexLocation (실제 nginx 정합)
 *   - requiredEnvVars.smoke (onprem-verify.mjs process.env 사용)
 *   - schema integrity ($schema/version/adrRef/ssotCodeRef)
 *   - samesite/httpOnly Auth.js v5 정합
 */
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BACKEND_AUTH_PATHS,
  NEXTAUTH_HANDLER_PATHS,
  NEXTAUTH_HANDLER_PATH_REGEX,
  BACKEND_AUTH_PATH_REGEX,
  isNextAuthHandlerPath,
  isBackendAuthPath,
} from '../src/api-routing';

// ── 5-place SSOT 헬퍼 ──────────────────────────────────────────────────────
//
// repo root: packages/shared-constants/__tests__/ 기준 ../../../

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

/**
 * nginx config 파일에서 NextAuth handler regex group 추출.
 * 타깃 라인 형식 예:
 *   location ~ ^/api/auth/(csrf|session|providers|signin|signout|callback|error|verify-request)(/|$) {
 *
 * @returns 추출된 paths Set (예: ['/api/auth/csrf', '/api/auth/session', ...])
 *          regex 미발견 시 빈 Set 반환 (spec FAIL 으로 이어짐)
 */
function extractNginxNextAuthPaths(nginxConfPath: string): Set<string> {
  const body = readFileSync(nginxConfPath, 'utf8');
  // location 블록의 NextAuth regex group — frontend 으로 proxy 되는 항목만
  const match = body.match(
    /location\s+~\s+\^\/api\/auth\/\(([a-z|\-]+)\)\(\/\|\$\)\s*\{[^}]*proxy_pass\s+http:\/\/frontend/m
  );
  if (!match) return new Set();
  const tokens = match[1].split('|').map((t) => t.trim());
  return new Set(tokens.map((t) => `/api/auth/${t}`));
}

/**
 * next.config.js 본문에서 NEXTAUTH_HANDLER_REGEX_GROUP const 값을 추출.
 * 타깃 라인 형식 예:
 *   const NEXTAUTH_HANDLER_REGEX_GROUP =
 *     '(?:csrf|session|providers|signin|signout|callback|error|verify-request)';
 */
function extractNextConfigNextAuthPaths(nextConfigPath: string): Set<string> {
  const body = readFileSync(nextConfigPath, 'utf8');
  const match = body.match(/NEXTAUTH_HANDLER_REGEX_GROUP\s*=\s*['"]\(\?:([a-z|\-]+)\)['"]/);
  if (!match) return new Set();
  const tokens = match[1].split('|').map((t) => t.trim());
  return new Set(tokens.map((t) => `/api/auth/${t}`));
}

/**
 * csrf-invariants.json 을 fs로 읽어서 객체 반환 (jest jest-resolver 우회 — 임의 fs read).
 */
function readCsrfInvariants(): Record<string, unknown> {
  const path = resolve(REPO_ROOT, 'scripts/diagnostics/csrf-invariants.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

const NEXTAUTH_PATHS_SSOT = new Set<string>(NEXTAUTH_HANDLER_PATHS as readonly string[]);

// ── Invariant: 두 집합이 disjoint ────────────────────────────────────────────

describe('ADR-0006 Invariant: BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅', () => {
  it('두 집합의 교집합이 없어야 한다', () => {
    const intersection = BACKEND_AUTH_PATHS.filter((p) =>
      (NEXTAUTH_HANDLER_PATHS as readonly string[]).includes(p)
    );
    expect(intersection).toHaveLength(0);
  });

  it('BACKEND_AUTH_PATHS가 9개 경로를 포함한다', () => {
    expect(BACKEND_AUTH_PATHS).toHaveLength(9);
  });

  it('NEXTAUTH_HANDLER_PATHS가 8개 경로를 포함한다', () => {
    expect(NEXTAUTH_HANDLER_PATHS).toHaveLength(8);
  });
});

// ── NEXTAUTH_HANDLER_PATHS 전체 경로 분류 검증 ───────────────────────────────

describe('NEXTAUTH_HANDLER_PATHS — 8개 경로 모두 isNextAuthHandlerPath=true', () => {
  test.each(NEXTAUTH_HANDLER_PATHS)('%s → NextAuth 핸들러', (path) => {
    expect(isNextAuthHandlerPath(path)).toBe(true);
    expect(isBackendAuthPath(path)).toBe(false);
  });
});

// ── BACKEND_AUTH_PATHS 전체 경로 분류 검증 ──────────────────────────────────

describe('BACKEND_AUTH_PATHS — 9개 경로 모두 isBackendAuthPath=true', () => {
  test.each(BACKEND_AUTH_PATHS)('%s → backend 컨트롤러', (path) => {
    expect(isBackendAuthPath(path)).toBe(true);
    expect(isNextAuthHandlerPath(path)).toBe(false);
  });
});

// ── 정규식 trailing path 허용 케이스 ────────────────────────────────────────

describe('NEXTAUTH_HANDLER_PATH_REGEX — trailing path 허용 (동적 segment)', () => {
  it('callback/azure-ad 매칭 (OAuth 리다이렉트)', () => {
    expect(NEXTAUTH_HANDLER_PATH_REGEX.test('/api/auth/callback/azure-ad')).toBe(true);
  });

  it('callback/credentials trailing slash 허용', () => {
    expect(NEXTAUTH_HANDLER_PATH_REGEX.test('/api/auth/callback/credentials')).toBe(true);
  });

  it('signin trailing slash 허용', () => {
    expect(NEXTAUTH_HANDLER_PATH_REGEX.test('/api/auth/signin/')).toBe(true);
  });

  it('csrf 경로 정확히 매칭', () => {
    expect(NEXTAUTH_HANDLER_PATH_REGEX.test('/api/auth/csrf')).toBe(true);
  });
});

describe('BACKEND_AUTH_PATH_REGEX — dash-separated segment 정확히 매칭', () => {
  it('test-login 매칭', () => {
    expect(BACKEND_AUTH_PATH_REGEX.test('/api/auth/test-login')).toBe(true);
  });

  it('test-cache-clear 매칭', () => {
    expect(BACKEND_AUTH_PATH_REGEX.test('/api/auth/test-cache-clear')).toBe(true);
  });

  it('forge-handover-token 매칭', () => {
    expect(BACKEND_AUTH_PATH_REGEX.test('/api/auth/forge-handover-token')).toBe(true);
  });

  it('azure-login 매칭', () => {
    expect(BACKEND_AUTH_PATH_REGEX.test('/api/auth/azure-login')).toBe(true);
  });
});

// ── 네거티브 케이스 — 미분류 경로는 양쪽 모두 false ────────────────────────

describe('미분류 경로 — "undefined route" 감지', () => {
  const undefinedRoutes = [
    '/api/auth/unknown',
    '/api/auth/',
    '/api/auth',
    '/api/other',
    '/auth/csrf',
  ];

  test.each(undefinedRoutes)('%s → 양쪽 모두 false (미분류 경로)', (path) => {
    const isNextAuth = isNextAuthHandlerPath(path);
    const isBackend = isBackendAuthPath(path);
    // 미분류 경로는 두 집합 어느 쪽에도 속하지 않아야 함
    expect(isNextAuth && isBackend).toBe(false);
  });

  it('/api/auth/unknown은 두 집합 모두 false', () => {
    expect(isNextAuthHandlerPath('/api/auth/unknown')).toBe(false);
    expect(isBackendAuthPath('/api/auth/unknown')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5-place SSOT 정합 — NEXTAUTH_HANDLER_PATHS
// ─────────────────────────────────────────────────────────────────────────────

describe('5-place SSOT — NEXTAUTH_HANDLER_PATHS 정합', () => {
  // M-1
  it('① api-routing.ts ↔ ② csrf-invariants.json nextAuthHandlerPaths.all set equality', () => {
    const invariants = readCsrfInvariants();
    const jsonAll = (invariants.nextAuthHandlerPaths as { all: string[] }).all;
    const jsonSet = new Set(jsonAll);

    expect(jsonSet.size).toBe(NEXTAUTH_PATHS_SSOT.size);
    for (const p of NEXTAUTH_PATHS_SSOT) {
      expect(jsonSet.has(p)).toBe(true);
    }
    for (const p of jsonSet) {
      expect(NEXTAUTH_PATHS_SSOT.has(p)).toBe(true);
    }
  });

  // M-2
  it('① api-routing.ts ↔ ③ infra/nginx/lan.conf NextAuth regex group', () => {
    const lanConfPath = resolve(REPO_ROOT, 'infra/nginx/lan.conf');
    const nginxSet = extractNginxNextAuthPaths(lanConfPath);

    expect(nginxSet.size).toBeGreaterThan(0);
    expect(nginxSet.size).toBe(NEXTAUTH_PATHS_SSOT.size);
    for (const p of NEXTAUTH_PATHS_SSOT) {
      expect(nginxSet.has(p)).toBe(true);
    }
  });

  // M-3
  it('① api-routing.ts ↔ ④ infra/nginx/nginx.conf.template NextAuth regex group', () => {
    const templatePath = resolve(REPO_ROOT, 'infra/nginx/nginx.conf.template');
    const nginxSet = extractNginxNextAuthPaths(templatePath);

    expect(nginxSet.size).toBeGreaterThan(0);
    expect(nginxSet.size).toBe(NEXTAUTH_PATHS_SSOT.size);
    for (const p of NEXTAUTH_PATHS_SSOT) {
      expect(nginxSet.has(p)).toBe(true);
    }
  });

  // M-4
  it('① api-routing.ts ↔ ⑤ apps/frontend/next.config.js NEXTAUTH_HANDLER_REGEX_GROUP', () => {
    const nextConfigPath = resolve(REPO_ROOT, 'apps/frontend/next.config.js');
    const nextConfigSet = extractNextConfigNextAuthPaths(nextConfigPath);

    expect(nextConfigSet.size).toBeGreaterThan(0);
    expect(nextConfigSet.size).toBe(NEXTAUTH_PATHS_SSOT.size);
    for (const p of NEXTAUTH_PATHS_SSOT) {
      expect(nextConfigSet.has(p)).toBe(true);
    }
  });

  // M-5
  it('csrf-invariants.json nginxRoutingInvariants.regexLocation ↔ 실제 nginx regex 정합', () => {
    const invariants = readCsrfInvariants();
    const jsonRegex = (invariants.nginxRoutingInvariants as { regexLocation: string })
      .regexLocation;

    // JSON 표명 regex 가 실제 NEXTAUTH_HANDLER_PATHS 와 정합 — 동일 정렬 비교
    const expectedTokens = NEXTAUTH_HANDLER_PATHS.map((p) => p.replace('/api/auth/', '')).sort();
    const jsonMatch = jsonRegex.match(/\(([a-z|\-]+)\)/);
    expect(jsonMatch).not.toBeNull();
    const jsonTokens = jsonMatch![1].split('|').sort();

    expect(jsonTokens).toEqual(expectedTokens);

    // configPath 가 실제 lan.conf 가리키는지
    const jsonConfigPath = (invariants.nginxRoutingInvariants as { configPath: string }).configPath;
    expect(jsonConfigPath).toBe('infra/nginx/lan.conf');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7 invariants 결빙
// ─────────────────────────────────────────────────────────────────────────────

describe('csrf-invariants.json — 7 invariants 결빙', () => {
  // M-6
  it('cookieInvariants.expectedCookies — Auth.js v5 only (v4 next-auth.* 제거)', () => {
    const invariants = readCsrfInvariants();
    const cookies = (invariants.cookieInvariants as { expectedCookies: string[] }).expectedCookies;

    expect(cookies).toHaveLength(3);
    for (const c of cookies) {
      // v5 prefix만 허용 — v4 'next-auth.' 잔존 시 spec FAIL
      expect(c).toMatch(/^(__Host-|__Secure-)?authjs\./);
      expect(c).not.toMatch(/^(__Host-|__Secure-)?next-auth\./);
    }
    // 정확히 3 variants (csrf-token / __Host-authjs.csrf-token / __Secure-authjs.csrf-token)
    expect(new Set(cookies)).toEqual(
      new Set(['authjs.csrf-token', '__Host-authjs.csrf-token', '__Secure-authjs.csrf-token'])
    );
  });

  // M-7
  it('nextAuthClientBasePath — apps/frontend/lib/auth.ts basePath override 부재', () => {
    const invariants = readCsrfInvariants();
    const basePath = invariants.nextAuthClientBasePath as {
      expectedDefault: string;
      frontendAuthEntry: string;
      violationKeyword: string;
    };

    expect(basePath.expectedDefault).toBe('/api/auth');
    expect(basePath.frontendAuthEntry).toBe('apps/frontend/lib/auth.ts');

    // lib/auth.ts 본문에 basePath 설정 라인이 없어야 함 (Auth.js v5 default 의존)
    const authBody = readFileSync(resolve(REPO_ROOT, basePath.frontendAuthEntry), 'utf8');

    // 주석/문자열이 아닌 실제 NextAuth config 옵션 키로서의 basePath 검색
    // 정규식: 줄 시작 또는 공백 다음에 basePath: 가 등장하면 violation
    // (단, JSDoc 주석에 'basePath'가 단어로 등장하는 것은 허용 — `\s*basePath\s*:` 만 매치)
    const lines = authBody.split('\n');
    const violations = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return false; // 주석 라인 제외
      return /(^|\s)basePath\s*:/.test(line);
    });
    expect(violations).toHaveLength(0);
  });

  // M-8
  it('serviceWorkerInvariants.swEntryPoint — fs 존재 + 경로 정합', () => {
    const invariants = readCsrfInvariants();
    const sw = invariants.serviceWorkerInvariants as { swEntryPoint: string };

    expect(sw.swEntryPoint).toBe('apps/frontend/app/sw.ts');

    // fs 존재 검증 — drift 시 (예: 파일 이동) 즉시 fail
    const swFullPath = resolve(REPO_ROOT, sw.swEntryPoint);
    expect(() => statSync(swFullPath)).not.toThrow();
  });

  // M-9
  it('cookieInvariants — samesite/httpOnly Auth.js v5 정합', () => {
    const invariants = readCsrfInvariants();
    const ci = invariants.cookieInvariants as {
      samesite: string[];
      httpOnlyRequired: boolean;
    };

    // Auth.js v5 기본 SameSite=Lax — Lax 가 허용 set 에 포함되어야 함
    expect(ci.samesite).toContain('Lax');
    // CSRF token 은 HttpOnly 필수 (XSS 방어)
    expect(ci.httpOnlyRequired).toBe(true);
  });

  // M-10
  it('requiredEnvVars.smoke — scripts/onprem-verify.mjs SSOT consumer 정합', () => {
    const invariants = readCsrfInvariants();
    const smokeVars = (invariants.requiredEnvVars as { smoke: string[] }).smoke;
    expect(smokeVars.length).toBeGreaterThan(0);

    const verifyMjsBody = readFileSync(resolve(REPO_ROOT, 'scripts/onprem-verify.mjs'), 'utf8');

    // onprem-verify.mjs 가 invariants.requiredEnvVars.smoke 를 SSOT consumer로
    // 동적 참조 (`process.env[requiredEnvKey]`) 또는 직접 참조 (`process.env.X`)
    // 둘 다 허용. 추가로 string literal 등장도 회귀 가드.
    expect(verifyMjsBody).toMatch(/requiredEnvVars\.smoke/);

    // 각 smoke env var 가 string literal 로 onprem-verify.mjs 에 등장 (주석/메시지 포함)
    // OR process.env.<NAME> dot notation 등장
    for (const envVar of smokeVars) {
      const reDot = new RegExp(`process\\.env\\.${envVar}\\b`);
      const reLiteral = new RegExp(`\\b${envVar}\\b`);
      const matches = reDot.test(verifyMjsBody) || reLiteral.test(verifyMjsBody);
      expect(matches).toBe(true);
    }
  });

  // M-11
  it('schema integrity — $schema / version / adrRef / ssotCodeRef 보존', () => {
    const invariants = readCsrfInvariants();

    expect(typeof invariants.$schema).toBe('string');
    expect(typeof invariants.version).toBe('string');
    expect(invariants.version).toMatch(/^\d+\.\d+\.\d+$/); // SemVer
    expect(typeof invariants.adrRef).toBe('string');
    expect(invariants.adrRef).toContain('docs/adr/0006');
    expect(typeof invariants.ssotCodeRef).toBe('string');
    expect(invariants.ssotCodeRef).toBe('packages/shared-constants/src/api-routing.ts');
  });
});
