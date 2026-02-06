/**
 * Group D: Exceptions - Test 4.5
 * Test: cannot cancel after review
 * Equipment: EQUIP_DISPOSAL_EXC_D5 (pending_disposal, reviewStatus=reviewed)
 *
 * Verify that a requester CANNOT cancel their own disposal request after it has been reviewed:
 * 1. Equipment has pending_disposal status with reviewed disposal request
 * 2. test_engineer (original requester) opens "폐기 진행 중" dropdown menu
 * 3. "요청 취소" menuitem is NOT visible (cannot cancel after review)
 * 4. Only "상세 보기" menuitem is visible (view-only mode)
 * 5. This validates the business rule: canCancelDisposal = requestedBy === user?.id && reviewStatus === 'pending'
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_EXC_D5,
  DISP_REQ_D5_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToReviewedDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Exceptions - Group D', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending_disposal state with REVIEWED status
    // Requested by test_engineer (same user running the test)
    // Reviewed by technical_manager
    // This ensures the request is past the 'pending' stage and cannot be cancelled
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_EXC_D5,
      DISP_REQ_D5_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );
  });

  test.afterAll(async () => {
    // Cleanup DB connection pool
    await cleanupPool();
  });

  test('cannot cancel after review', async ({ testOperatorPage }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_EXC_D5}`);
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

    // 5. Verify "요청 취소" menuitem is NOT visible (cannot cancel after review)
    // The permission rule is: canCancelDisposal = requestedBy === user?.id && reviewStatus === 'pending'
    // Since reviewStatus is 'reviewed' (not 'pending'), the cancel option should be hidden
    const cancelMenuItem = testOperatorPage.getByRole('menuitem', { name: /요청 취소/i });
    await expect(cancelMenuItem).not.toBeVisible();

    // 6. Verify "상세 보기" menuitem IS visible (all users can view details)
    const viewMenuItem = testOperatorPage.getByRole('menuitem', { name: /상세 보기/i });
    await expect(viewMenuItem).toBeVisible({ timeout: 5000 });

    // Test passes: Requester correctly prevented from cancelling after review
    // This validates the business rule that only PENDING requests can be cancelled
  });
});
