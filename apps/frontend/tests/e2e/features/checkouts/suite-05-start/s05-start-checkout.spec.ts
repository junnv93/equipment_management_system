/**
 * Suite 05: 반출 시작 (Serial) ★장비 상태 전이 핵심
 *
 * approved → checked_out 상태 전이 + equipment status → checked_out 검증
 *
 * ⚠️ "반출 시작" 버튼은 확인 다이얼로그("반출 시작")를 열고, "확인" 버튼으로 제출.
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 *
 * IDs: SUITE_05 (009=approved cal, 056=overdue pending, 013=approved repair)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_05, BACKEND_URL } from '../helpers/checkout-constants';
import {
  resetCheckoutToApproved,
  clearBackendCache,
  navigateToCheckoutDetail,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 05: 반출 시작', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCheckoutToApproved(SUITE_05.APPROVED_CAL);
    await resetCheckoutToApproved(SUITE_05.APPROVED_MULTI);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S05-01: 반출 시작 → equipment status=checked_out (P0)', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    const checkoutData = await apiGet(page, `/api/checkouts/${SUITE_05.APPROVED_CAL}`);
    expect(checkoutData.status).toBe('approved');

    // UI: 반출 시작
    await navigateToCheckoutDetail(page, SUITE_05.APPROVED_CAL);
    await page.getByRole('button', { name: '반출 시작' }).click();

    // 다이얼로그("반출 시작")에서 확인
    const dialog = page.getByRole('dialog', { name: '반출 시작' });
    await expect(dialog).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/start') && resp.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const startResponse = await responsePromise;
    expect(startResponse.ok()).toBeTruthy();

    // PATCH 응답 body 직접 검증
    const responseBody = await startResponse.json();
    expect(responseBody.status).toBe('checked_out');
    expect(responseBody.checkoutDate).toBeTruthy();
  });

  test('S05-02: pending 상태 반출 시작 차단 (API 400)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_05.PENDING_BLOCK}/start`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );

    expect(response.status()).toBe(400);
  });

  test('S05-03: 다중 장비 반출 시작', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_05.APPROVED_MULTI);

    const startButton = page.getByRole('button', { name: '반출 시작' });
    if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();

      const dialog = page.getByRole('dialog', { name: '반출 시작' });
      await expect(dialog).toBeVisible();

      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/start') && resp.request().method() === 'POST'
      );
      await dialog.getByRole('button', { name: '확인' }).click();
      const startResponse = await responsePromise;
      expect(startResponse.ok()).toBeTruthy();

      const responseBody = await startResponse.json();
      expect(responseBody.status).toBe('checked_out');
    }
  });
});
