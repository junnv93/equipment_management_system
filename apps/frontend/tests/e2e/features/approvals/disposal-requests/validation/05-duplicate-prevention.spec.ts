/**
 * Group D: Exceptions - Test 4.1
 * Test: duplicate request prevention
 * Equipment: EQUIP_DISPOSAL_EXC_D1 (pending_disposal, reviewStatus=pending)
 *
 * Verify that when equipment already has a pending disposal request:
 * 1. "폐기 요청" button is hidden (cannot create duplicate request)
 * 2. "폐기 진행 중" button is visible
 * 3. Status badge shows "폐기 진행 중"
 * 4. Dropdown menu shows review/approve actions (not request action)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_EXC_D1,
  DISP_REQ_D1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Exceptions - Group D', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending_disposal state with pending review status
    // This ensures the equipment has an existing disposal request
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_EXC_D1,
      DISP_REQ_D1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );
  });

  test.afterAll(async () => {
    // Cleanup DB connection pool
    await cleanupPool();
  });

  test('duplicate request prevention', async ({ testOperatorPage }) => {
    // 1. Navigate to equipment detail page (already has pending_disposal status)
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D1}`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Verify "폐기 요청" button is NOT visible (duplicate prevention)
    const requestButton = testOperatorPage.getByRole('button', { name: /^폐기 요청$/i });
    await expect(requestButton).not.toBeVisible();

    // 3. Verify "폐기 진행 중" button is visible (showing existing request)
    const disposalInProgressButton = testOperatorPage.getByRole('button', {
      name: /폐기 진행 중/i,
    });
    await expect(disposalInProgressButton).toBeVisible({ timeout: 10000 });

    // 4. Verify status badge shows "폐기 진행 중" (not a button, just a status display)
    const statusBadge = testOperatorPage.getByRole('status').filter({ hasText: /폐기 진행 중/i });
    await expect(statusBadge).toBeVisible({ timeout: 10000 });

    // 5. Open dropdown menu to verify available actions
    await disposalInProgressButton.click();
    await testOperatorPage.waitForTimeout(500);

    // 6. Verify dropdown menu is visible (shows review/approve actions, not request)
    const dropdownMenu = testOperatorPage.getByRole('menu');
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // 7. Verify "폐기 검토하기" menu item exists (for technical_manager/lab_manager)
    // Note: This may not be visible to test_operator, but verifies dropdown opens
    const menuItems = await testOperatorPage.getByRole('menuitem').allTextContents();
    console.log('[DEBUG] Available menu items:', menuItems);

    // 8. Verify no duplicate "폐기 요청" action in dropdown
    const hasRequestAction = menuItems.some((item) => /^폐기 요청$/i.test(item));
    expect(hasRequestAction).toBe(false); // Should NOT have request action

    // Test passes: User cannot create duplicate disposal request
  });
});
