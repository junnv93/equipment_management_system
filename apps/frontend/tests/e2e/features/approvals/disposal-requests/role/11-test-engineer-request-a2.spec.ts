/**
 * Group A: Permissions - Test 1.7
 * Test: test_engineer sees request button on different available equipment
 * Equipment: EQUIP_DISPOSAL_PERM_A2 (available)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A2 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Permissions - Group A', () => {
  test('test_engineer sees request button on different available equipment', async ({
    testOperatorPage,
  }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A2}`);
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // 2. Verify "폐기 요청" button is visible
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/i });
    await expect(requestButton).toBeVisible();

    // 3. Verify equipment status badge: "사용 가능"
    const availableBadge = testOperatorPage.getByText(/사용 가능/i);
    await expect(availableBadge).toBeVisible();
  });
});
