/**
 * ADR-0006 Same-Origin Reverse-Proxy 모델 SSOT invariant 단위 테스트
 *
 * 회귀 차단 목적: api-routing.ts 변경 시 두 집합의 disjoint 성질이
 * 깨지면 즉시 감지한다. verify-routing-origin pre-push gate가 본 spec을
 * 경로 변경 시 자동 실행한다.
 *
 * Invariant: BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅
 */
import {
  BACKEND_AUTH_PATHS,
  NEXTAUTH_HANDLER_PATHS,
  NEXTAUTH_HANDLER_PATH_REGEX,
  BACKEND_AUTH_PATH_REGEX,
  isNextAuthHandlerPath,
  isBackendAuthPath,
} from '../src/api-routing';

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
