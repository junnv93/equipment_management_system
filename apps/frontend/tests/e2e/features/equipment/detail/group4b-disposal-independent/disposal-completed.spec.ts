/**
 * Equipment Detail - 폐기 완료 상태 표시
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A6 (status: disposed, reviewStatus: approved)
 * → 사전 시드된 폐기 완료 장비
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-equipment.seed.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A6 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Workflow - Completed State', () => {
  test('폐기 완료된 장비가 올바르게 표시된다', async ({ testOperatorPage: page }) => {
    // 1. 폐기 완료(disposed) 장비에 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A6}`);
    await page.waitForLoadState('networkidle');

    // 2. 폐기 완료 상태 표시 확인
    await expect(page.getByText(/폐기 완료|폐기됨|disposed/i).first()).toBeVisible({
      timeout: 10000,
    });

    // 3. 폐기 요청 버튼이 없거나 비활성화되어야 함
    const disposalButton = page.getByRole('button', { name: /폐기 요청/i });
    const buttonCount = await disposalButton.count();
    if (buttonCount > 0) {
      await expect(disposalButton).toBeDisabled();
    }
  });
});
