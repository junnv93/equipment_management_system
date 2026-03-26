/**
 * Group 4: 폐기 워크플로우 - 최종 승인 (시험소장)
 * Test 4.5: 시험소장 최종 승인
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A5 (status: pending_disposal, reviewStatus: reviewed)
 * → 사전 시드된 reviewed 요청을 사용하여 순차 의존성 제거
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-requests.seed.ts - DISP_REQ_A5_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A5 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('폐기 워크플로우 - 최종 승인 (시험소장)', () => {
  test('4.5. 시험소장이 폐기를 최종 승인한다', async ({ siteAdminPage: page }) => {
    // 1. 사전 시드된 reviewed 상태 장비에 UUID 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A5}`);

    // 2. 폐기 진행 중 버튼 확인
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });
    await progressButton.click();

    // 3. 승인 다이얼로그 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 4. 승인 코멘트 입력 (선택사항)
    const commentTextarea = dialog.getByRole('textbox');
    if (await commentTextarea.isVisible().catch(() => false)) {
      await commentTextarea.fill('폐기 승인합니다. 환경 규정에 따라 처리해주세요.');
    }

    // 5. 승인 버튼 클릭
    const approveButton = dialog.getByRole('button', { name: /승인|확인/i });
    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();

      // 6. 확인 다이얼로그가 나타나면 한번 더 확인
      const confirmDialog = page.getByRole('alertdialog');
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirmButton = confirmDialog.getByRole('button', { name: /확인|승인/i });
        await confirmButton.click();
      }

      // 7. 폐기 완료 확인
      await expect(page.getByText(/폐기 완료|폐기됨|disposed/i).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
