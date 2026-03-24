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
// Token Cache (rate limit 429 방지 — test-login 엔드포인트 100/분 제한)
// ============================================================================

const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

/** 토큰 캐시 TTL (10분) */
const TOKEN_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Backend JWT 토큰 획득 (캐싱)
 *
 * dev/test 환경의 test-login 엔드포인트에서 JWT를 발급받는다.
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

  const response = await page.request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const token = data.access_token || data.data?.access_token;

  if (!token) {
    throw new Error(`Failed to get token for role ${role}: ${JSON.stringify(data)}`);
  }

  tokenCache[role] = { token, expiresAt: now + TOKEN_CACHE_TTL_MS };
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
