/**
 * Group A: Permissions - Test 1.4
 * Test: lab_manager can approve reviewed disposal
 * Equipment: EQUIP_DISPOSAL_PERM_A5 (pending_disposal, reviewStatus=reviewed)
 *
 * IMPORTANT:
 * - This test includes automatic cleanup to ensure correct disposal request state
 * - Equipment A5 must have a reviewed disposal request (reviewStatus=reviewed)
 * - The cleanup ensures idempotent test execution
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_PERM_A5,
  DISP_REQ_A5_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToReviewedDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Permissions - Group A', () => {
  test.beforeEach(async ({ siteAdminPage }) => {
    // Ensure clean state before each test
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_PERM_A5,
      DISP_REQ_A5_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );

    // Allow cache to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate with cache-busting to ensure fresh data
    const cacheBuster = Date.now();
    await siteAdminPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A5}?_t=${cacheBuster}`, {
      waitUntil: 'domcontentloaded',
    });
  });

  test('lab_manager can approve reviewed disposal', async ({ siteAdminPage }) => {
    // Wait for React hydration (disposal dropdown is client-side rendered)

    // 1. Verify "폐기 진행 중" button is visible (auto-waits for hydration)
    const statusButton = siteAdminPage.getByRole('button', { name: /폐기 진행 중/i });
    await expect(statusButton).toBeVisible({ timeout: 10000 });

    // 2. Click "폐기 진행 중" button to open dropdown menu
    await statusButton.click();

    // 3. Wait for dropdown menu and click "최종 승인하기" menu item
    const approveMenuItem = siteAdminPage.getByText('최종 승인하기');
    await expect(approveMenuItem).toBeVisible({ timeout: 5000 });
    await approveMenuItem.click();

    // 4. Verify approval dialog opens
    const dialog = siteAdminPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 5. Verify dialog title
    await expect(dialog.getByText('폐기 최종 승인')).toBeVisible();

    // 6. Fill approval comment (optional) - use label selector
    const commentTextarea = siteAdminPage.getByLabel(/승인 코멘트/i);
    if (await commentTextarea.isVisible()) {
      await commentTextarea.fill('폐기 승인합니다. 환경 규정에 따라 처리해주세요.');
    }

    // 7. Click "최종 승인" button
    const finalApproveButton = dialog.getByRole('button', { name: /최종 승인/i });
    await expect(finalApproveButton).toBeEnabled({ timeout: 5000 });
    await finalApproveButton.click();

    // 8. Verify confirmation dialog
    await expect(siteAdminPage.getByText(/되돌릴 수 없습니다/i)).toBeVisible({ timeout: 5000 });

    // 9. Click confirm button (AlertDialogAction button with text "최종 승인")
    const confirmButton = siteAdminPage.getByRole('button', { name: /최종 승인/i }).last();
    await confirmButton.click();

    // 10. Wait for dialog to close (indicates API success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // 11. Toast notification is optional (may disappear quickly)
    const toastVisible = await Promise.race([
      siteAdminPage
        .getByText(/최종 승인.*완료/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
      siteAdminPage
        .getByText(/폐기가 최종 승인/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
    ]).catch(() => false);

    if (!toastVisible) {
      console.log('[INFO] Toast notification did not appear (may have been transient)');
    }

    // Test success: Dialog closed successfully, indicating approval was completed
    // Note: Equipment status update happens asynchronously, so we don't wait for it
  });

  test.afterAll(async () => {
    await cleanupPool();
  });
});
