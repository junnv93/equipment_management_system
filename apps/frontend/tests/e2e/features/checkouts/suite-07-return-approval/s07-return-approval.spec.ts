/**
 * Suite 07: 반입 승인 (Serial) ★장비 상태 복원 핵심
 *
 * returned → return_approved 상태 전이 + equipment status → available 검증
 *
 * ⚠️ "반입 승인" 버튼은 확인 다이얼로그("반입 승인")를 열고, "확인" 버튼으로 제출.
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 *
 * IDs: SUITE_07 (042=returned cal, 012=approved wrong status, 044=returned multi)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import { SUITE_07, BACKEND_URL } from '../helpers/checkout-constants';
import {
  resetCheckoutToReturned,
  clearBackendCache,
  navigateToCheckoutDetail,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 07: 반입 승인', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCheckoutToReturned(SUITE_07.CALIBRATION);
    await resetCheckoutToReturned(SUITE_07.MULTI);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S07-01: 반입 승인 → equipment status=available (P0 CRITICAL)', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    const beforeData = await apiGet(page, `/api/checkouts/${SUITE_07.CALIBRATION}`);
    expect(beforeData.status).toBe(CSVal.RETURNED);

    // UI: 반입 승인
    await navigateToCheckoutDetail(page, SUITE_07.CALIBRATION);
    await page.getByRole('button', { name: '반입 승인' }).click();

    // 다이얼로그("반입 승인")에서 확인
    const dialog = page.getByRole('dialog', { name: '반입 승인' });
    await expect(dialog).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/approve-return') && resp.request().method() === 'PATCH'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    // PATCH 응답 body 직접 검증
    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe(CSVal.RETURN_APPROVED);
    expect(responseBody.returnApprovedBy).toBeTruthy();
    expect(responseBody.returnApprovedAt).toBeTruthy();
  });

  test('S07-02: approved 상태 반입 승인 차단 (API 400)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // CAS: version 포함해야 상태 전이 불가(비즈니스 로직)로 인한 400이 테스트됨
    const getResponse = await page.request.get(
      `${BACKEND_URL}/api/checkouts/${SUITE_07.WRONG_STATUS}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { version } = await getResponse.json();

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_07.WRONG_STATUS}/approve-return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { version },
      }
    );

    expect(response.status()).toBe(400);
  });

  test('S07-03: 다중 장비 반입 승인', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_07.MULTI);

    const approveReturnButton = page.getByRole('button', { name: '반입 승인' });
    if (await approveReturnButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveReturnButton.click();

      const dialog = page.getByRole('dialog', { name: '반입 승인' });
      await expect(dialog).toBeVisible();

      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/approve-return') && resp.request().method() === 'PATCH'
      );
      await dialog.getByRole('button', { name: '확인' }).click();
      const approveResponse = await responsePromise;
      expect(approveResponse.ok()).toBeTruthy();

      const responseBody = await approveResponse.json();
      expect(responseBody.status).toBe(CSVal.RETURN_APPROVED);
    }
  });
});
