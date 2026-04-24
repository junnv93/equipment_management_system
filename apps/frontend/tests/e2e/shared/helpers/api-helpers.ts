/**
 * Shared E2E API helpers
 *
 * 모든 E2E 테스트 스위트에서 재사용하는 백엔드 API 유틸리티.
 * getBackendToken, clearBackendCache 등 도메인 무관 헬퍼를 집중 관리한다.
 *
 * @see apps/frontend/tests/e2e/shared/constants/shared-test-data.ts - BASE_URLS
 */

import { Page, expect } from '@playwright/test';
import { Pool } from 'pg';
import { BASE_URLS } from '../constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

// ============================================================================
// Resilient fetch (global-setup, CI 환경의 transient 실패 대응)
// ============================================================================

/**
 * 재시도 가능한 fetch wrapper — keep-alive stale socket, transient 5xx, 타임아웃 복구.
 *
 * 주요 실패 시나리오:
 * - seed 직후 backend connection pool이 settle되지 않아 undici keep-alive socket이
 *   `SocketError: other side closed`로 실패
 * - 백엔드 rolling restart 중의 순간적 502/503
 * - DNS/네트워크 flake
 *
 * @param url fetch URL
 * @param init fetch options
 * @param opts.retries 최대 시도 횟수 (기본 3)
 * @param opts.backoffMs 초기 백오프 ms (기본 500, 지수 증가)
 * @param opts.timeoutMs 요청당 타임아웃 (기본 30000)
 * @param opts.retryOnStatus 재시도할 HTTP status (기본 [502, 503, 504])
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: {
    retries?: number;
    backoffMs?: number;
    timeoutMs?: number;
    retryOnStatus?: number[];
  } = {}
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const backoffMs = opts.backoffMs ?? 500;
  const timeoutMs = opts.timeoutMs ?? 30000;
  const retryOnStatus = opts.retryOnStatus ?? [502, 503, 504];

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      });
      if (response.ok || !retryOnStatus.includes(response.status)) {
        return response;
      }
      lastErr = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
    }
  }
  throw new Error(`fetchWithRetry exhausted ${retries} attempts for ${url}: ${String(lastErr)}`);
}

// ============================================================================
// Test Auth (SSOT: test-login 엔드포인트 경로 + 토큰 추출)
// ============================================================================

/** test-login 엔드포인트 경로 (dev/test 환경 전용) */
const TEST_LOGIN_PATH = '/api/auth/test-login';

/** 응답에서 access_token을 추출 (ResponseTransformInterceptor 래핑 대응) */
function extractToken(data: Record<string, unknown>): string | undefined {
  const nested = data.data as Record<string, unknown> | undefined;
  return (nested?.access_token ?? data.access_token) as string | undefined;
}

// ============================================================================
// Token Cache (rate limit 429 방지 — test-login 엔드포인트 100/분 제한)
// ============================================================================

const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

/** 토큰 캐시 TTL (10분) */
const TOKEN_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Backend JWT 토큰 획득 — Node fetch 기반 (Page 불필요)
 *
 * global-setup, beforeAll 등 Playwright Page가 없는 컨텍스트에서 사용.
 * rate limit 방지를 위해 역할별 10분 캐싱.
 */
export async function fetchBackendToken(role: string): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[role];
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }

  // 시드 직후 undici keep-alive 소켓이 닫혀 첫 fetch가 SocketError("other side closed")로
  // 실패하는 케이스 회피 — 짧은 backoff로 최대 3회 재시도.
  let response: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(`${BACKEND_URL}${TEST_LOGIN_PATH}?role=${role}`, {
        signal: AbortSignal.timeout(5000),
      });
      break;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  if (!response) {
    throw new Error(`test-login fetch failed for role ${role}: ${String(lastErr)}`);
  }
  if (!response.ok) {
    throw new Error(`test-login failed for role ${role}: ${response.status}`);
  }
  const data = await response.json();
  const token = extractToken(data);

  if (!token) {
    throw new Error(`Failed to get token for role ${role}: ${JSON.stringify(data)}`);
  }

  tokenCache[role] = { token, expiresAt: now + TOKEN_CACHE_TTL_MS };
  return token;
}

/**
 * Backend JWT 토큰 획득 — Playwright Page 기반 (캐싱)
 *
 * spec 파일 내 테스트에서 사용. page.request를 통해 호출.
 * rate limit 방지를 위해 역할별 10분 캐싱.
 *
 * @param page - Playwright Page (page.request 사용)
 * @param role - 'test_engineer' | 'technical_manager' | 'quality_manager' | 'lab_manager' | 'system_admin'
 */
export async function getBackendToken(page: Page, role: string): Promise<string> {
  const now = Date.now();
  const cached = tokenCache[role];
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }

  const response = await page.request.get(`${BACKEND_URL}${TEST_LOGIN_PATH}?role=${role}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const token = extractToken(data);

  if (!token) {
    throw new Error(`Failed to get token for role ${role}: ${JSON.stringify(data)}`);
  }

  tokenCache[role] = { token, expiresAt: now + TOKEN_CACHE_TTL_MS };
  return token;
}

/**
 * Backend JWT 토큰 획득 — 이메일 기반 (특정 팀 유저 지정 시 사용)
 *
 * test-login ?email= 파라미터를 활용하여 ALL_TEST_EMAILS에 속하는 임의 테스트 유저 토큰 취득.
 * role 기반 `getBackendToken`과 동일 tokenCache를 사용하되, 키 충돌 방지를 위해
 * `email:` 접두사로 네임스페이스를 분리한다.
 *
 * @param page - Playwright Page
 * @param email - ALL_TEST_EMAILS에 포함된 테스트 사용자 이메일
 *
 * @example
 * const uiwangTmToken = await getBackendTokenByEmail(page, 'manager2@example.com');
 */
export async function getBackendTokenByEmail(page: Page, email: string): Promise<string> {
  const cacheKey = `email:${email}`;
  const now = Date.now();
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }

  const response = await page.request.get(
    `${BACKEND_URL}${TEST_LOGIN_PATH}?email=${encodeURIComponent(email)}`
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const token = extractToken(data);

  if (!token) {
    throw new Error(`Failed to get token for email ${email}: ${JSON.stringify(data)}`);
  }

  tokenCache[cacheKey] = { token, expiresAt: now + TOKEN_CACHE_TTL_MS };
  return token;
}

/**
 * Backend 인메모리 캐시 클리어
 *
 * DB 직접 SQL 리셋 후 반드시 호출해야 한다.
 * ORM/서비스 레이어를 우회한 변경은 캐시에 반영되지 않기 때문.
 *
 * Node fetch 사용 (page.request 아님) → beforeAll/afterAll 훅에서도 호출 가능.
 */
export async function clearBackendCache(): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/auth/test-cache-clear`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Cache clear failed: ${response.status} — stale 캐시로 후속 테스트 실패 가능`);
  }
}

/**
 * 토큰 캐시 초기화 (테스트 간 격리가 필요한 경우)
 */
export function clearTokenCache(): void {
  for (const key of Object.keys(tokenCache)) {
    delete tokenCache[key];
  }
}

// ============================================================================
// Shared Database Pool (Connection Exhaustion 방지 — 단일 Pool 인스턴스)
// ============================================================================

let sharedPool: Pool | null = null;

/**
 * 프로세스 전역 DB Pool (싱글턴)
 *
 * 모든 E2E 헬퍼(approval-helpers, checkout-helpers 등)가 이 Pool을 공유한다.
 * 별도 Pool 생성 시 fullyParallel worker × N개 Pool로 connection exhaustion 발생.
 *
 * @see BASE_URLS.DATABASE - 환경변수 기반 연결 문자열
 */
export function getSharedPool(): Pool {
  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: BASE_URLS.DATABASE,
      max: 3,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
    });
  }
  return sharedPool;
}

/**
 * 공유 DB Pool 정리 (global teardown 또는 afterAll에서 호출)
 */
export async function cleanupSharedPool(): Promise<void> {
  if (sharedPool) {
    try {
      await sharedPool.end();
    } catch {
      /* ignore */
    } finally {
      sharedPool = null;
    }
  }
}
