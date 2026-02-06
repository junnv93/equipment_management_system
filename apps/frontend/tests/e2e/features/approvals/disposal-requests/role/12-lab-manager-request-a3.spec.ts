/**
 * Group A: Permissions - Test 1.8
 * Test: lab_manager sees request button on available equipment
 * Equipment: EQUIP_DISPOSAL_PERM_A3 (available)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A3 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Permissions - Group A', () => {
  test('lab_manager sees request button on available equipment', async ({ siteAdminPage }) => {
    // 1. Navigate to equipment detail page
    await siteAdminPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A3}`);
    await siteAdminPage.waitForLoadState('domcontentloaded');

    // 2. Verify "폐기 요청" button is visible (lab_manager can also request)
    const requestButton = siteAdminPage.getByRole('button', { name: /폐기 요청/i });
    await expect(requestButton).toBeVisible();

    // 3. Verify equipment status badge: "사용 가능"
    const availableBadge = siteAdminPage.getByText(/사용 가능/i);
    await expect(availableBadge).toBeVisible();
  });
});
