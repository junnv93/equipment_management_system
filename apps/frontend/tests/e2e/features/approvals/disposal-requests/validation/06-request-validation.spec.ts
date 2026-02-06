/**
 * Group D: Exceptions - Test 4.2
 * Test: request validation - reasonDetail too short
 * Equipment: EQUIP_DISPOSAL_EXC_D2 (available)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_EXC_D2 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Exceptions - Group D', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('request validation - reasonDetail too short disables submit', async ({
    testOperatorPage,
  }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D2}`);

    // 2. Click "폐기 요청" button
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/i });
    await requestButton.click();

    // 3. Select reason: "고장 (수리 불가)"
    const radio = testOperatorPage.getByRole('radio', { name: '고장 (수리 불가)' });
    await radio.click();

    // 4. Fill reasonDetail with 9 chars (<10)
    const reasonDetailTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await reasonDetailTextarea.fill('짧음짧음짧');

    // 5. Verify submit button is disabled
    const submitButton = testOperatorPage.getByRole('button', { name: '폐기 요청' }).last();
    await expect(submitButton).toBeDisabled();

    // 6. Verify character count: "현재: 5자 / 최소 10자"
    const charCountHint = testOperatorPage.locator('p#reasonDetail-hint');
    await expect(charCountHint).toContainText('현재: 5자');

    // 7. Fill reasonDetail with 10+ chars
    await reasonDetailTextarea.fill('검증용 상세 사유입니다.');

    // 8. Verify submit button is enabled
    await expect(submitButton).toBeEnabled();
  });
});
