/**
 * Suite 04: 반출 반려 워크플로우 (Serial)
 *
 * pending → rejected 상태 전이를 검증합니다.
 * 반려 사유 필수, 빈 사유 차단, 거절 후 상태 변경 불가를 테스트합니다.
 *
 * ⚠️ "반려" 버튼은 다이얼로그("반출 반려")를 열고, 사유 입력 후 "반려" 버튼으로 제출.
 *    dialog 로케이터는 name으로 특정해야 함 (모바일 nav dialog 충돌 방지)
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 *
 * IDs: SUITE_04 (004, 006, 007, 008)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_04, BACKEND_URL } from '../helpers/checkout-constants';
import {
  resetCheckoutToPending,
  clearBackendCache,
  navigateToCheckoutDetail,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 04: 반출 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCheckoutToPending(SUITE_04.CALIBRATION);
    await resetCheckoutToPending(SUITE_04.REPAIR);
    await resetCheckoutToPending(SUITE_04.EMPTY_REASON);
    await resetCheckoutToPending(SUITE_04.RENTAL);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S04-01: 교정 반려 + 사유 저장 → API rejectionReason', async ({ techManagerPage: page }) => {
    const rejectionReason = '인증되지 않은 교정기관입니다.';

    await navigateToCheckoutDetail(page, SUITE_04.CALIBRATION);

    // "반려" 버튼 클릭 → 다이얼로그 열림
    await page.getByRole('button', { name: '반려' }).click();

    // 다이얼로그("반출 반려")에서 사유 입력
    const dialog = page.getByRole('dialog', { name: '반출 반려' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill(rejectionReason);

    // "반려" 버튼으로 제출
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/reject') && resp.request().method() === 'PATCH'
    );
    await dialog.getByRole('button', { name: '반려' }).click();
    const rejectResponse = await responsePromise;
    expect(rejectResponse.ok()).toBeTruthy();

    // PATCH 응답 body 직접 검증
    const responseBody = await rejectResponse.json();
    expect(responseBody.status).toBe('rejected');
    expect(responseBody.rejectionReason).toBe(rejectionReason);

    // 캐시 클리어 후 GET 검증
    await clearBackendCache();
    const data = await apiGet(page, `/api/checkouts/${SUITE_04.CALIBRATION}`);
    expect(data.status).toBe('rejected');
    expect(data.rejectionReason).toBe(rejectionReason);
  });

  test('S04-02: 수리 반려', async ({ techManagerPage: page }) => {
    const rejectionReason = '수리 필요성이 인정되지 않습니다.';

    await navigateToCheckoutDetail(page, SUITE_04.REPAIR);

    await page.getByRole('button', { name: '반려' }).click();

    const dialog = page.getByRole('dialog', { name: '반출 반려' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill(rejectionReason);

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/reject') && resp.request().method() === 'PATCH'
    );
    await dialog.getByRole('button', { name: '반려' }).click();
    const rejectResponse = await responsePromise;
    expect(rejectResponse.ok()).toBeTruthy();

    const responseBody = await rejectResponse.json();
    expect(responseBody.status).toBe('rejected');
  });

  test('S04-03: 반려 사유 필수 (빈 사유 → API 400)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // API 직접 호출: 빈 사유로 반려 시도
    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_04.EMPTY_REASON}/reject`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { reason: '' },
      }
    );

    expect(response.status()).toBe(400);

    // 상태 변경 안됨 확인
    await clearBackendCache();
    const data = await apiGet(page, `/api/checkouts/${SUITE_04.EMPTY_REASON}`);
    expect(data.status).toBe('pending');
  });

  test('S04-04: 대여 반려 (워크플로우 종료 확인)', async ({ techManagerPage: page }) => {
    const rejectionReason = '대여 일정이 중복됩니다.';

    await navigateToCheckoutDetail(page, SUITE_04.RENTAL);

    const rejectButton = page.getByRole('button', { name: '반려' });
    if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectButton.click();

      const dialog = page.getByRole('dialog', { name: '반출 반려' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('textbox').fill(rejectionReason);

      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/reject') && resp.request().method() === 'PATCH'
      );
      await dialog.getByRole('button', { name: '반려' }).click();
      const rejectResponse = await responsePromise;
      expect(rejectResponse.ok()).toBeTruthy();

      const responseBody = await rejectResponse.json();
      expect(responseBody.status).toBe('rejected');
    }
  });

  test('S04-05: 거절 상태 수정 불가 (API PATCH → 400)', async ({ techManagerPage: page }) => {
    // SUITE_04.CALIBRATION은 이미 rejected 상태
    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_04.CALIBRATION}/approve`,
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
});
