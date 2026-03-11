/**
 * Group 4: 폐기 워크플로우 - 정상 흐름
 * Test 4.1: 폐기 요청 (시험실무자)
 *
 * Equipment: EQUIP_DISPOSAL_WORKFLOW (status: available → pending_disposal)
 *
 * @sequential - 이 테스트는 순차적으로 실행되어야 합니다
 * @see apps/backend/src/database/seed-data/disposal/disposal-equipment.seed.ts
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_WORKFLOW } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  test.describe.configure({ mode: 'serial' });

  test('4.1. 폐기 요청 (시험실무자)', async ({ testOperatorPage: page }) => {
    // 1. UUID 기반으로 장비 상세 페이지 직접 접근
    await page.goto(`/equipment/${EQUIP_DISPOSAL_WORKFLOW}`);
    await page.waitForLoadState('networkidle');

    // 2. '폐기 요청' 버튼 확인 및 클릭
    const disposalButton = page.getByRole('button', { name: /폐기 요청/i });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. 폐기 요청 다이얼로그 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /장비 폐기 요청/i })).toBeVisible();

    // 4. 폐기 사유 선택: '노후화' (obsolete)
    const obsoleteRadio = dialog.getByRole('radio', { name: /노후화/i });
    await obsoleteRadio.click();

    // 5. 상세 사유 입력 (최소 10자)
    const detailTextarea = dialog.getByLabel(/상세 사유/i);
    await detailTextarea.fill('장비 노후화로 인한 성능 저하가 심각합니다.');

    // 6. 제출 버튼 활성화 확인
    const submitButton = dialog.getByRole('button', { name: /폐기 요청/i });
    await expect(submitButton).toBeEnabled();

    // 7. 짧은 입력 시 제출 불가 확인
    await detailTextarea.fill('짧은글');
    await expect(submitButton).toBeDisabled();

    // 8. 유효한 텍스트로 다시 입력
    await detailTextarea.fill('장비 노후화로 인한 성능 저하가 심각합니다.');
    await expect(submitButton).toBeEnabled();

    // 9. 폐기 요청 제출
    await submitButton.click();

    // 10. 성공 토스트 확인
    await expect(page.getByText(/폐기 요청/i)).toBeVisible({ timeout: 10000 });

    // 11. 폐기 진행 중 상태 표시 확인
    await expect(page.getByRole('button', { name: /폐기 진행 중/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
