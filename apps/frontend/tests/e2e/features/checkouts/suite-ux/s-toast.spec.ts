/**
 * Suite UX: 반출 Mutation Toast 알림
 *
 * notifyCheckoutAction() 유틸이 CheckoutGroupCard inline approve에서
 * 호출되어 shadcn Toaster에 노출되는지 검증합니다.
 *
 * - approve 액션 성공 → Radix Toast viewport에 "승인 완료" 텍스트 노출
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_001_ID } from '../../../shared/constants/test-checkout-ids';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import { resetCheckoutToPending } from '../helpers/checkout-db-helpers';

const CHECKOUTS_LIST_URL = `${BASE_URLS.FRONTEND}/checkouts`;

test.describe('UX: Mutation Toast 알림', () => {
  test.beforeEach(async () => {
    await resetCheckoutToPending(CHECKOUT_001_ID);
  });

  test('인라인 승인 후 Radix Toast에 "승인 완료" 텍스트가 노출된다', async ({
    techManagerPage: page,
  }) => {
    await page.goto(CHECKOUTS_LIST_URL);

    // inline approve 버튼 클릭 (첫 번째 matching row)
    const approveBtn = page.locator('button', { hasText: '승인' }).first();
    await expect(approveBtn).toBeVisible({ timeout: 5000 });

    // API 응답 + Toast 동시 대기
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/checkouts/') &&
          res.url().includes('/approve') &&
          res.request().method() === 'PATCH'
      ),
      approveBtn.click(),
    ]);

    expect(response.status()).toBe(200);

    // Radix Toast viewport에서 텍스트 확인
    const toastViewport = page.locator('[data-radix-toast-viewport]');
    await expect(toastViewport).toBeVisible({ timeout: 5000 });
    await expect(toastViewport).toContainText('승인 완료');
  });
});
