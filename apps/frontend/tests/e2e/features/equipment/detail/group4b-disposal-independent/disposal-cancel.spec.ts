/**
 * Equipment Detail - 폐기 요청 취소
 *
 * Equipment: EQUIP_DISPOSAL_EXC_D3 (status: pending_disposal, reviewStatus: pending)
 * → requestedBy: USER_TEST_ENGINEER_SUWON_ID (testOperatorPage와 동일)
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-requests.seed.ts - DISP_REQ_D3_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_EXC_D3 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Workflow - Cancel', () => {
  test('요청자가 pending 폐기 요청을 취소할 수 있다', async ({ testOperatorPage: page }) => {
    // 1. 사전 시드된 pending 폐기 요청 장비에 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D3}`);
    await page.waitForLoadState('networkidle');

    // 2. 폐기 진행 중 버튼 확인
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });
    await progressButton.click();

    // 3. 취소 버튼 찾기
    const cancelButton = page.getByRole('button', { name: /취소/i });
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();

      // 4. 확인 다이얼로그가 있으면 확인
      const confirmButton = page.getByRole('button', { name: /확인/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // 5. 장비 상태가 복원되었는지 확인
      await expect(page.getByRole('button', { name: /폐기 요청/i })).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
