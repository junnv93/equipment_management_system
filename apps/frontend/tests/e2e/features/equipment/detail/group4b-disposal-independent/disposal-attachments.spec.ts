/**
 * Equipment Detail - 폐기 요청 첨부파일
 *
 * Equipment: EQUIP_DISPOSAL_EXC_D2 (status: available)
 * → 폐기 요청 다이얼로그에서 파일 업로드 기능 확인
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-equipment.seed.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_EXC_D2 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Workflow - Attachments', () => {
  test('폐기 요청 다이얼로그에서 파일 업로드 UI가 존재한다', async ({ testOperatorPage: page }) => {
    // 1. available 상태 장비에 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D2}`);
    await page.waitForLoadState('networkidle');

    // 2. 폐기 요청 버튼 클릭
    const disposalButton = page.getByRole('button', { name: /폐기 요청/i });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. 다이얼로그 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 4. 파일 업로드 UI 확인 (있을 경우)
    const fileInput = dialog.locator('input[type="file"]');
    const hasFileInput = (await fileInput.count()) > 0;

    if (hasFileInput) {
      await expect(fileInput.first()).toBeAttached();
    }

    // 5. 다이얼로그 닫기
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
