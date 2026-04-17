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
import { CHECKOUT_009_ID } from '../../shared/constants/test-checkout-ids';

/**
 * Handover 토큰 발급 헬퍼 — E2E 환경에서 API 호출로 토큰 획득.
 * Next.js rewrites가 /api → backend로 프록시.
 */
async function issueHandoverToken(
  page: import('@playwright/test').Page,
  checkoutId: string
): Promise<string> {
  const response = await page.request.post(`/api/checkouts/${checkoutId}/handover-token`, {
    data: {},
  });
  expect(response.ok(), `token issue failed: ${response.status()}`).toBeTruthy();
  const body = await response.json();
  // 응답 transform(`{ data: {...} }`) 가능성 — 양 케이스 처리
  const token = body?.data?.token ?? body?.token;
  expect(typeof token).toBe('string');
  return token as string;
}

test.describe('QR Phase 3 — Handover Signing Token', () => {
  test('1회용 토큰: lender 발급 → borrower 진입 → /checkouts/:id/check 이동', async ({
    testOperatorPage, // lender (requester of CHECKOUT_009)
    techManagerPage, // borrower (approver) — 실제로는 외부인이지만 E2E는 별개 인증 세션으로 대리
  }) => {
    const token = await issueHandoverToken(testOperatorPage, CHECKOUT_009_ID);

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
    const token = await issueHandoverToken(testOperatorPage, CHECKOUT_009_ID);

    // 1차 consume
    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(token));
    await techManagerPage.waitForURL(/\/checkouts\/.+\/check/, { timeout: 10_000 });

    // 2차: 다른 세션에서 동일 토큰 재사용 시도 → consumed 에러
    await systemAdminPage.goto(FRONTEND_ROUTES.HANDOVER(token));

    // URL은 /handover에 머무름 (router.replace 안 됨) + 에러 제목 가시화
    await expect(systemAdminPage).toHaveURL(/\/handover/, { timeout: 5_000 });
    await expect(systemAdminPage.getByRole('alert')).toBeVisible();
  });

  test('무효 토큰 → Invalid 에러 UI', async ({ techManagerPage }) => {
    // 서명 검증 실패가 보장되는 의도적 쓰레기 값
    const bogusToken = 'not.a.valid.jwt.token';
    await techManagerPage.goto(FRONTEND_ROUTES.HANDOVER(bogusToken));

    await expect(techManagerPage).toHaveURL(/\/handover/);
    await expect(techManagerPage.getByRole('alert')).toBeVisible();
  });
});
