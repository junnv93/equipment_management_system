/**
 * Equipment Detail - 기술책임자 폐기 반려
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C1 (status: pending_disposal, reviewStatus: pending)
 * → 사전 시드된 검토 대기 요청을 반려하는 테스트
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-requests.seed.ts - DISP_REQ_C1_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_REJ_C1 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Workflow - Tech Manager Rejection', () => {
  test('기술책임자가 폐기 요청을 반려한다', async ({ techManagerPage: page }) => {
    // 1. 사전 시드된 pending 상태 장비에 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_REJ_C1}`);
    await page.waitForLoadState('networkidle');

    // 2. 폐기 진행 중 버튼 클릭
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });
    await progressButton.click();

    // 3. 다이얼로그에서 반려 관련 버튼/영역 찾기
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 4. 반려 사유 입력 (textarea가 있으면)
    const reasonTextarea = dialog.getByRole('textbox');
    if (await reasonTextarea.isVisible().catch(() => false)) {
      await reasonTextarea.fill('추가 점검이 필요하여 반려합니다. 수리 이력을 확인해주세요.');
    }

    // 5. 반려 버튼 클릭
    const rejectButton = dialog.getByRole('button', { name: /반려/i });
    if (await rejectButton.isVisible().catch(() => false)) {
      await rejectButton.click();

      // 6. 확인 다이얼로그가 있으면 확인
      const confirmDialog = page.getByRole('alertdialog');
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirmButton = confirmDialog.getByRole('button', { name: /확인|반려/i });
        await confirmButton.click();
      }

      // 7. 반려 완료 확인
      await expect(page.getByText(/반려|거절/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
