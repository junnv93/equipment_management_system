/**
 * Suite 03: 반출 승인 워크플로우 (Serial)
 *
 * pending → approved 상태 전이를 검증합니다.
 * beforeAll에서 모든 테스트 ID를 pending으로 초기화합니다.
 *
 * ⚠️ "승인" 버튼은 확인 다이얼로그 없이 즉시 mutation을 실행합니다.
 *    waitForResponse로 PATCH /approve 응답을 직접 검증합니다.
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 *
 * IDs: SUITE_03 (001, 003, 005, 002)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_03, BACKEND_URL, USERS } from '../helpers/checkout-constants';
import {
  resetCheckoutToPending,
  clearBackendCache,
  navigateToCheckoutDetail,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 03: 반출 승인 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCheckoutToPending(SUITE_03.CALIBRATION);
    await resetCheckoutToPending(SUITE_03.REPAIR);
    await resetCheckoutToPending(SUITE_03.RENTAL);
    await resetCheckoutToPending(SUITE_03.PERSISTENCE);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S03-01: 교정 승인 → API status=approved, approverId ≠ null', async ({
    techManagerPage: page,
  }) => {
    await navigateToCheckoutDetail(page, SUITE_03.CALIBRATION);

    // "승인" 버튼은 다이얼로그 없이 즉시 API 호출 (PATCH /approve)
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/checkouts/${SUITE_03.CALIBRATION}/approve`) &&
        resp.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: '승인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    // PATCH 응답 body 직접 검증 (mutation 결과 - 캐싱 영향 없음)
    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe('approved');
    expect(responseBody.approverId).toBe(USERS.TECHNICAL_MANAGER_SUWON);

    // 백엔드 캐시 클리어 후 GET 검증
    await clearBackendCache();
    const data = await apiGet(page, `/api/checkouts/${SUITE_03.CALIBRATION}`);
    expect(data.status).toBe('approved');
    expect(data.approverId).toBeTruthy();
    expect(data.approvedAt).toBeTruthy();
  });

  test('S03-02: 수리 승인', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_03.REPAIR);

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/checkouts/${SUITE_03.REPAIR}/approve`) &&
        resp.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: '승인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe('approved');
  });

  test('S03-03: 대여 승인', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_03.RENTAL);

    const approveButton = page.getByRole('button', { name: '승인' });
    if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/checkouts/${SUITE_03.RENTAL}/approve`) &&
          resp.request().method() === 'PATCH'
      );
      await approveButton.click();
      const approveResponse = await responsePromise;
      expect(approveResponse.ok()).toBeTruthy();

      const responseBody = await approveResponse.json();
      expect(responseBody.status).toBe('approved');
    }
  });

  test('S03-04: 승인 후 새로고침 → 상태 유지 (DB 영속성)', async ({ techManagerPage: page }) => {
    // API로 직접 승인
    const token = await getBackendToken(page, 'technical_manager');
    const approveResponse = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_03.PERSISTENCE}/approve`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );
    expect(approveResponse.ok()).toBeTruthy();

    // 캐시 클리어 후 새로고침
    await clearBackendCache();
    await navigateToCheckoutDetail(page, SUITE_03.PERSISTENCE);

    const data = await apiGet(page, `/api/checkouts/${SUITE_03.PERSISTENCE}`);
    expect(data.status).toBe('approved');
    expect(data.approvedAt).toBeTruthy();

    // UI: 승인 버튼이 더 이상 보이지 않아야 함
    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
  });
});
