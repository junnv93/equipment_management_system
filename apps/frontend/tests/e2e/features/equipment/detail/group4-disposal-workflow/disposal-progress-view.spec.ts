/**
 * Group 4: 폐기 워크플로우 - 진행 상태 확인
 * Test 4.2: DisposalProgressCard 표시 검증
 *
 * Equipment: EQUIP_DISPOSAL_UI_E1 (status: pending_disposal, reviewStatus: pending)
 * → 사전 시드된 장비를 사용하여 4.1에 의존하지 않음
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-equipment.seed.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_UI_E1 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('폐기 워크플로우 - 진행 상태 확인', () => {
  test('4.2. DisposalProgressCard 배너가 표시되고 상세 다이얼로그가 열린다', async ({
    testOperatorPage: page,
  }) => {
    // 1. 사전 시드된 pending_disposal 장비에 UUID 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_UI_E1}`);

    // 2. 폐기 진행 중 버튼이 표시됨
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });

    // 3. 클릭하여 상세 다이얼로그 열기
    await progressButton.click();

    // 4. 다이얼로그 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 5. 폐기 요청 정보가 표시됨
    await expect(dialog.getByText(/폐기 요청/i).first()).toBeVisible();

    // 6. 다이얼로그 닫기
    const closeButton = dialog.getByRole('button', { name: /닫기/i });
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(dialog).not.toBeVisible();
  });
});
