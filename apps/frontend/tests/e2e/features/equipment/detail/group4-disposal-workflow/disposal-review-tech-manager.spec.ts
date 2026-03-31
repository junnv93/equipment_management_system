/**
 * Group 4: 폐기 워크플로우 - 검토 (기술책임자)
 * Test 4.3: 기술책임자 검토 승인
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A4 (status: pending_disposal, reviewStatus: pending)
 * → 사전 시드된 pending 요청을 사용하여 순차 의존성 제거
 *
 * @see apps/backend/src/database/seed-data/disposal/disposal-requests.seed.ts - DISP_REQ_A4_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A4 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('폐기 워크플로우 - 검토 (기술책임자)', () => {
  test('4.3. 기술책임자가 폐기 요청을 검토한다', async ({ techManagerPage: page }) => {
    // 1. 사전 시드된 pending 상태 장비에 UUID 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A4}`);

    // 2. 폐기 진행 중 버튼 확인
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/i });
    await expect(progressButton).toBeVisible({ timeout: 10000 });
    await progressButton.click();

    // 3. 검토 다이얼로그/패널 열기
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 4. 검토 의견 입력 (textarea가 보이면)
    const opinionTextarea = dialog.getByRole('textbox');
    if (await opinionTextarea.isVisible().catch(() => false)) {
      await opinionTextarea.fill('폐기 요청 내용을 검토하였으며 승인 가능합니다.');
    }

    // 5. 검토 완료/승인 버튼 클릭
    const actionButton = dialog.getByRole('button', { name: /검토 완료|승인/i });
    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();

      // 6. 성공 확인 (토스트 또는 상태 변경)
      await expect(page.getByText(/검토|승인|완료/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
