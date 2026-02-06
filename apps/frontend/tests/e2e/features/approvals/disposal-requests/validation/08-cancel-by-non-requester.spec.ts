/**
 * Group D: Exceptions - Test 4.4
 * Test: non-requester cannot cancel
 * Equipment: EQUIP_DISPOSAL_EXC_D4 (pending_disposal, requestedBy=technical_manager)
 *
 * Verify that a non-requester (different user) cannot cancel disposal request:
 * 1. Equipment has pending_disposal status with request by technical_manager
 * 2. test_engineer (different user) views the equipment detail page
 * 3. test_engineer opens "폐기 진행 중" dropdown menu
 * 4. "요청 취소" menuitem is NOT visible (only requester can cancel)
 * 5. This verifies proper access control for cancellation
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_EXC_D4,
  DISP_REQ_D4_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Exceptions - Group D', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending_disposal state with pending review status
    // Requested by technical_manager (DIFFERENT user than test_engineer running the test)
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_EXC_D4,
      DISP_REQ_D4_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );
  });

  test.afterAll(async () => {
    // Cleanup DB connection pool
    await cleanupPool();
  });

  test('non-requester cannot cancel', async ({ testOperatorPage }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D4}`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Verify status badge shows "폐기 진행 중"
    const statusBadge = testOperatorPage.getByRole('status').filter({ hasText: /폐기 진행 중/i });
    await expect(statusBadge).toBeVisible({ timeout: 10000 });

    // 3. Click "폐기 진행 중" dropdown button to open menu
    const disposalInProgressButton = testOperatorPage.getByRole('button', {
      name: /폐기 진행 중/i,
    });
    await expect(disposalInProgressButton).toBeVisible({ timeout: 10000 });
    await disposalInProgressButton.click();
    await testOperatorPage.waitForTimeout(500);

    // 4. Verify dropdown menu is visible
    const dropdownMenu = testOperatorPage.getByRole('menu');
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // 5. Verify "요청 취소" menuitem is NOT visible (non-requester cannot cancel)
    // The menu should only show view options, not cancel
    const cancelMenuItem = testOperatorPage.getByRole('menuitem', { name: /요청 취소/i });
    await expect(cancelMenuItem).not.toBeVisible();

    // 6. Verify "상세 보기" menuitem IS visible (all users can view details)
    const viewMenuItem = testOperatorPage.getByRole('menuitem', { name: /상세 보기/i });
    await expect(viewMenuItem).toBeVisible({ timeout: 5000 });

    // Test passes: Non-requester correctly prevented from seeing cancel option
    // This validates proper access control - only the original requester can cancel their own request
  });
});
