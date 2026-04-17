/**
 * QR Phase 3 — 인수인계 서명 토큰 replay 방어 E2E
 *
 * 시나리오:
 * 1. Lender (testOperator = checkout requester)가 API로 handover 토큰 발급
 * 2. Borrower (techManager = approver = 토큰 발급 권한도 있음)가 /handover?token= 진입 →
 *    router.replace로 /checkouts/:id/check 로 redirect
 * 3. 동일 토큰 재사용 → Consumed 에러 UI
 * 4. 잘못된 토큰 → Invalid 에러 UI
 *
 * 원칙:
 * - 2-session 격리(lender/borrower storageState 별도)
 * - FRONTEND_ROUTES 빌더 경유 (토큰 URL 하드코딩 금지)
 * - API_ENDPOINTS 대신 page.request.post()에 fully-qualified path (Next.js rewrites 경유)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { CHECKOUT_019_ID } from '../../shared/constants/test-checkout-ids';

// Handover 토큰은 `checked_out` / `lender_checked` / `borrower_returned` 상태에서만 발급 가능.
// CHECKOUT_019 = checked_out — 적합.
const HANDOVER_CHECKOUT_ID = CHECKOUT_019_ID;

/**
 * Handover 토큰 발급 헬퍼.
 *
 * E2E 환경 경로 이슈: Next.js rewrites는 `/api/` prefix를 제거한 뒤 backend로 프록시하지만
 * backend는 globalPrefix='api'이므로 매칭 실패(404). 대응: backend URL 직접 호출 +
 * test-login으로 얻은 Bearer token 명시.
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getTestAccessToken(
  page: import('@playwright/test').Page,
  role: string
): Promise<string> {
  const res = await page.request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
  expect(res.ok(), `test-login ${role} failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  // test-login 응답: { access_token, refresh_token, expires_at, user } (snake_case per AuthResponse)
  const token = body?.access_token ?? body?.accessToken ?? body?.data?.accessToken;
  expect(typeof token).toBe('string');
  return token as string;
}

async function issueHandoverToken(
  page: import('@playwright/test').Page,
  checkoutId: string,
  asRole = 'test_engineer'
): Promise<string> {
  const accessToken = await getTestAccessToken(page, asRole);
  const response = await page.request.post(
    `${BACKEND_URL}/api/checkouts/${checkoutId}/handover-token`,
    {
      data: {},
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  expect(response.ok(), `token issue failed: ${response.status()}`).toBeTruthy();
  const body = await response.json();
  const token = body?.data?.token ?? body?.token;
  expect(typeof token).toBe('string');
  return token as string;
}

test.describe('QR Phase 3 — Handover Signing Token', () => {
  test('1회용 토큰: lender 발급 → borrower 진입 → /checkouts/:id/check 이동', async ({
    testOperatorPage, // lender (requester of CHECKOUT_009)
    techManagerPage, // borrower (approver) — 실제로는 외부인이지만 E2E는 별개 인증 세션으로 대리
  }) => {
    const token = await issueHandoverToken(testOperatorPage, HANDOVER_CHECKOUT_ID);

    // borrower가 handover URL 진입 → 자동 검증 + redirect
    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(token));

    // router.replace로 /checkouts/:id/check 도달 (check 페이지 존재 가정)
    await techManagerPage.waitForURL(/\/checkouts\/.+\/check/, { timeout: 10_000 });
  });

  test('Replay 방어: 이미 소비된 토큰 → 에러 UI', async ({
    testOperatorPage,
    techManagerPage,
    systemAdminPage, // 두 번째 borrower 시도용 (별도 세션)
  }) => {
    const token = await issueHandoverToken(testOperatorPage, HANDOVER_CHECKOUT_ID);

    // 1차 consume
    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(token));
    await techManagerPage.waitForURL(/\/checkouts\/.+\/check/, { timeout: 10_000 });

    // 2차: 다른 세션에서 동일 토큰 재사용 시도 → consumed 에러
    await systemAdminPage.goto(FRONTEND_ROUTES.HANDOVER(token));

    // URL은 /handover에 머무름 (router.replace 안 됨) + 에러 제목 가시화
    await expect(systemAdminPage).toHaveURL(/\/handover/, { timeout: 5_000 });
    await expect(systemAdminPage.getByRole('alert').first()).toBeVisible();
  });

  test('무효 토큰 → Invalid 에러 UI', async ({ techManagerPage }) => {
    // 서명 검증 실패가 보장되는 의도적 쓰레기 값
    const bogusToken = 'not.a.valid.jwt.token';
    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(bogusToken));

    await expect(techManagerPage).toHaveURL(/\/handover/);
    await expect(techManagerPage.getByRole('alert').first()).toBeVisible();
  });

  test('만료 토큰 → Expired 에러 UI (jwt sign with past exp)', async ({ techManagerPage }) => {
    // backend test helper 엔드포인트 호출 → 만료된 서명 토큰 수신.
    // 보안: E2E 전용 helper endpoint는 dev/test 환경에만 노출되어야 함.
    //       backend side는 NODE_ENV !== 'production' 가드 필수 (별도 구현).
    const helperRes = await techManagerPage.request.post(
      `${BACKEND_URL}/api/auth/forge-handover-token`,
      {
        data: { checkoutId: HANDOVER_CHECKOUT_ID, expSecondsAgo: 60 },
        failOnStatusCode: false,
      }
    );

    if (!helperRes.ok()) {
      test.skip(
        true,
        `test-auth forge endpoint unavailable (${helperRes.status()}) — backend가 dev/test helper를 노출하지 않으면 이 테스트는 skip`
      );
      return;
    }

    const body = await helperRes.json();
    const expiredToken = body?.data?.token ?? body?.token;
    expect(typeof expiredToken).toBe('string');

    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(expiredToken));
    await expect(techManagerPage).toHaveURL(/\/handover/);
    // 페이지 h1[role=alert]가 Expired 메시지. Next route announcer도 role=alert이므로 first().
    const alert = techManagerPage.getByRole('alert').first();
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(/만료|expired/i);
  });
});
