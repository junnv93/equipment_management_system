/**
 * Equipment Detail - 폐기 워크플로우 권한 검증
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A4 (status: pending_disposal, requestedBy: test_engineer)
 * → test_engineer가 다른 사용자의 pending 요청에 대해 검토 권한이 없음을 확인
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-equipment.seed.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A4 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Workflow - Permissions', () => {
  test('test_engineer는 폐기 검토 버튼을 볼 수 없다', async ({ testOperatorPage: page }) => {
    // 1. pending_disposal 장비에 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A4}`);
    await page.waitForLoadState('networkidle');

    // 2. 폐기 진행 중 버튼은 보임 (상태 표시)
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });

    // 3. 검토 버튼은 보이지 않아야 함 (test_engineer 권한으로는 검토 불가)
    // 검토 관련 액션 버튼이 없는지 확인
    await progressButton.click();

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      // test_engineer에게는 '검토 완료' 버튼이 보이지 않아야 함
      const reviewButton = dialog.getByRole('button', { name: /검토 완료/i });
      await expect(reviewButton).not.toBeVisible();
    }
  });
});
