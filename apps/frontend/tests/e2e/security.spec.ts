/**
 * 보안 아키텍처 E2E 테스트
 *
 * NestJS Guard 레이어가 실제로 동작하는지 HTTP 레벨에서 검증합니다.
 * Playwright `request` fixture를 사용하여 브라우저 없이 백엔드 API를 직접 호출합니다.
 *
 * 검증 대상:
 * 1. JwtAuthGuard — 인증 게이트 (401)
 * 2. PermissionsGuard (DENY 모드) — 인가 게이트 (403)
 * 3. @InternalServiceOnly() — 서비스간 통신 게이트 (401)
 * 4. @SseAuthenticated() — SSE 인증 게이트 (401)
 * 5. @Public() — 공개 엔드포인트 정상 동작
 *
 * 실행 전제: pnpm dev (backend 포트 3001에서 실행 중)
 */

import { test, expect } from '@playwright/test';
import { BASE_URLS } from './shared/constants/shared-test-data';

const API = `${BASE_URLS.BACKEND}/api`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. 인증 게이트 — JwtAuthGuard
// ─────────────────────────────────────────────────────────────────────────────
test.describe('인증 게이트 (JwtAuthGuard)', () => {
  test('장비 목록 — 토큰 없음 → 401', async ({ request }) => {
    const res = await request.get(`${API}/equipment`);
    expect(res.status()).toBe(401);
  });

  test('교정 기록 — 잘못된 JWT 서명 → 401', async ({ request }) => {
    // 유효한 구조지만 서명이 잘못된 토큰
    const tampered = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlLXVzZXIifQ.WRONG_SIGNATURE';
    const res = await request.get(`${API}/calibration`, {
      headers: { Authorization: `Bearer ${tampered}` },
    });
    expect(res.status()).toBe(401);
  });

  test('반출 관리 — Authorization 헤더 없음 → 401', async ({ request }) => {
    const res = await request.get(`${API}/checkouts`);
    expect(res.status()).toBe(401);
  });

  test('부적합 관리 — 토큰 없음 → 401', async ({ request }) => {
    const res = await request.get(`${API}/non-conformances`);
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. 인가 게이트 — PermissionsGuard (DENY 모드)
//    test_engineer 역할은 고권한 기능에 접근 불가
// ─────────────────────────────────────────────────────────────────────────────
test.describe('인가 게이트 (PermissionsGuard DENY)', () => {
  test.describe.configure({ mode: 'serial' }); // 토큰 공유

  let testEngineerToken: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${API}/auth/test-login?role=test_engineer`);
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { access_token: string };
    testEngineerToken = body.access_token;
  });

  test('test_engineer — 교정계획 승인 시도 → 403', async ({ request }) => {
    // 권한 체크가 비즈니스 로직보다 먼저 실행 → ID 무효여도 403
    const res = await request.patch(
      `${API}/calibration-plans/00000000-0000-0000-0000-000000000001/approve`,
      {
        headers: { Authorization: `Bearer ${testEngineerToken}` },
        data: { version: 1 },
      }
    );
    expect(res.status()).toBe(403);
  });

  test('test_engineer — 사용자 역할 변경 시도 → 403', async ({ request }) => {
    const res = await request.patch(
      `${API}/users/00000000-0000-0000-0000-000000000001/change-role`,
      {
        headers: { Authorization: `Bearer ${testEngineerToken}` },
        data: { role: 'lab_manager', version: 1 },
      }
    );
    expect(res.status()).toBe(403);
  });

  test('test_engineer — 시스템 메트릭 조회 시도 → 403', async ({ request }) => {
    // VIEW_SYSTEM_SETTINGS 권한 필요 — test_engineer 없음
    const res = await request.get(`${API}/monitoring/metrics`, {
      headers: { Authorization: `Bearer ${testEngineerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('test_engineer — 장비 폐기 승인 시도 → 403', async ({ request }) => {
    const res = await request.post(
      `${API}/equipment/00000000-0000-0000-0000-000000000001/disposal/approve`,
      {
        headers: { Authorization: `Bearer ${testEngineerToken}` },
        data: { version: 1 },
      }
    );
    expect(res.status()).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. @InternalServiceOnly 게이트
//    JWT 없어도 Internal API Key 있어야 접근 가능
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@InternalServiceOnly 게이트', () => {
  test('장비 캐시 무효화 — API 키 없음 → 401', async ({ request }) => {
    const res = await request.post(`${API}/equipment/cache/invalidate`);
    expect(res.status()).toBe(401);
  });

  test('장비 캐시 무효화 — 잘못된 API 키 → 401', async ({ request }) => {
    const res = await request.post(`${API}/equipment/cache/invalidate`, {
      headers: { 'X-Internal-Api-Key': 'wrong-key-that-does-not-match' },
    });
    expect(res.status()).toBe(401);
  });

  test('사용자 동기화 — API 키 없음 → 401', async ({ request }) => {
    const res = await request.post(`${API}/users/sync`, {
      data: { email: 'test@example.com', name: 'Test', role: 'test_engineer' },
    });
    expect(res.status()).toBe(401);
  });

  test('사용자 동기화 — 유효한 JWT만 있어도 API 키 없으면 → 401', async ({ request }) => {
    // @InternalServiceOnly는 @Public이므로 JWT를 무시함
    // API 키가 없으면 InternalApiKeyGuard가 401 반환
    const loginRes = await request.get(`${API}/auth/test-login?role=lab_manager`);
    const loginBody = (await loginRes.json()) as { access_token: string };

    const res = await request.post(`${API}/users/sync`, {
      headers: { Authorization: `Bearer ${loginBody.access_token}` },
      data: { email: 'test@example.com', name: 'Test', role: 'test_engineer' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. @SseAuthenticated 게이트
//    SSE 엔드포인트는 Authorization: Bearer 헤더 필요
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@SseAuthenticated 게이트', () => {
  test('SSE 스트림 — 토큰 없음 → 401', async ({ request }) => {
    const res = await request.get(`${API}/notifications/stream`);
    expect(res.status()).toBe(401);
  });

  test('SSE 통계 — 토큰 없음 → 401', async ({ request }) => {
    const res = await request.get(`${API}/notifications/stream/stats`);
    expect(res.status()).toBe(401);
  });

  test('SSE 스트림 — Refresh Token으로 접근 시도 → 401', async ({ request }) => {
    // Access Token만 허용 — Refresh Token은 SseJwtAuthGuard에서 차단
    const loginRes = await request.get(`${API}/auth/test-login?role=test_engineer`);
    const loginBody = (await loginRes.json()) as { refresh_token: string };

    const res = await request.get(`${API}/notifications/stream`, {
      headers: { Authorization: `Bearer ${loginBody.refresh_token}` },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. @Public 엔드포인트 — 인증 없이 접근 가능 확인
// ─────────────────────────────────────────────────────────────────────────────
test.describe('@Public 엔드포인트 정상 동작', () => {
  test('헬스체크 — 인증 없이 200', async ({ request }) => {
    const res = await request.get(`${API}/monitoring/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('로그인 엔드포인트 — 잘못된 자격증명은 401 (404가 아님)', async ({ request }) => {
    // 엔드포인트 자체는 공개 → 404 없음, 자격증명 오류 → 401
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'nobody@example.com', password: 'wrongpassword' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).toBe(401);
  });

  test('토큰 갱신 엔드포인트 — 잘못된 토큰은 401 (JwtAuthGuard 미적용)', async ({ request }) => {
    // @Public이므로 JwtAuthGuard 우회 → 서비스 레벨에서 토큰 검증 → 401
    const res = await request.post(`${API}/auth/refresh`, {
      data: { refresh_token: 'not.a.valid.refresh.token' },
    });
    expect(res.status()).not.toBe(404);
    // 401 (JwtAuthGuard가 아닌 authService.refreshTokens에서 거부)
    expect([400, 401, 403]).toContain(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. 토큰 블랙리스트 — 로그아웃 후 재사용 방지
//    로그아웃된 토큰은 블랙리스트에 등록되어 재사용 시 401
// ─────────────────────────────────────────────────────────────────────────────
test.describe('토큰 블랙리스트', () => {
  test('로그아웃 후 같은 토큰으로 API 호출 → 401', async ({ request }) => {
    // 1. 로그인
    const loginRes = await request.get(`${API}/auth/test-login?role=test_engineer`);
    const { access_token, refresh_token } = (await loginRes.json()) as {
      access_token: string;
      refresh_token: string;
    };

    // 2. 로그인 상태에서 API 호출 → 200
    const beforeLogout = await request.get(`${API}/equipment`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(beforeLogout.status()).toBe(200);

    // 3. 로그아웃 — 토큰 블랙리스트 등록
    const logoutRes = await request.post(`${API}/auth/logout`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { refresh_token },
    });
    expect(logoutRes.status()).toBe(201);

    // 4. 로그아웃 후 동일 토큰으로 재호출 → 401 (블랙리스트 차단)
    const afterLogout = await request.get(`${API}/equipment`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(afterLogout.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. 고권한 역할의 정상 접근 확인 — 권한 구조 전체 동작 검증
// ─────────────────────────────────────────────────────────────────────────────
test.describe('고권한 역할 정상 접근 (회귀 방지)', () => {
  // beforeAll의 request 픽스처는 fullyParallel 환경에서 worker 재사용 시 불안정
  // → 각 테스트에서 직접 토큰 획득 (테스트 2개라 비용 미미)

  test('lab_manager — 장비 목록 조회 → 200', async ({ request }) => {
    const loginRes = await request.get(`${API}/auth/test-login?role=lab_manager`);
    const { access_token } = (await loginRes.json()) as { access_token: string };
    const res = await request.get(`${API}/equipment`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('lab_manager — 시스템 메트릭 조회 → 200', async ({ request }) => {
    const loginRes = await request.get(`${API}/auth/test-login?role=lab_manager`);
    const { access_token } = (await loginRes.json()) as { access_token: string };
    const res = await request.get(`${API}/monitoring/metrics`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(res.status()).toBe(200);
  });
});
