/**
 * Approvals - Disposal Bulk Actions: Bulk Approve Multiple Items
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 5.1 - Bulk approve multiple disposal review items
 *
 * This test verifies that a technical_manager can:
 * 1. Select multiple disposal review items via checkboxes
 * 2. See the BulkActionBar update the selection count
 * 3. Click the bulk approve button
 * 4. Confirm the bulk action in the AlertDialog
 * 5. See a toast with the correct count of approved items
 * 6. Verify approved items are removed from the list
 * 7. Verify remaining items are still visible
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A4, EQUIP_DISPOSAL_REJ_C1, EQUIP_DISPOSAL_REJ_C3, EQUIP_DISPOSAL_UI_E1
 * Disposal Requests: DISP_REQ_A4_ID, DISP_REQ_C1_ID, DISP_REQ_C3_ID, DISP_REQ_E1_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A4,
  EQUIP_DISPOSAL_REJ_C1,
  EQUIP_DISPOSAL_REJ_C3,
  EQUIP_DISPOSAL_UI_E1,
  DISP_REQ_A4_ID,
  DISP_REQ_C1_ID,
  DISP_REQ_C3_ID,
  DISP_REQ_E1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Bulk Actions - Bulk Approve Multiple Items', () => {
  // Reset 4 equipment items to pending disposal state before each test
  test.beforeEach(async () => {
    // Reset A4
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A4,
      DISP_REQ_A4_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    // Reset C1
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C1,
      DISP_REQ_C1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    // Reset C3
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C3,
      DISP_REQ_C3_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    // Reset E1
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_UI_E1,
      DISP_REQ_E1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ 4 test equipment items reset to pending_disposal state');
  });

  test('5.1 - Bulk approve multiple disposal review items', async ({ techManagerPage }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 2: Wait for page to load and verify heading '승인 관리' is visible
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Step 3: Verify the '폐기 검토' tab is visible and active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Wait for the approval list to render
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // Step 5: Verify at least 4 approval item cards are displayed
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThanOrEqual(4);

    // Step 6: Verify BulkActionBar is visible showing initial count '전체 선택 (0/N)'
    const bulkActionBar = techManagerPage.getByText(/전체 선택 \(0\/\d+\)/);
    await expect(bulkActionBar).toBeVisible();
    console.log('✅ BulkActionBar shows 0 selected items initially');

    // Step 7: Locate and select first approval item
    const firstItem = approvalItems.nth(0);
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const firstCheckbox = firstItem.locator('button[role="checkbox"]');

    // Wait for checkbox to be ready and click
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 });
    await expect(firstCheckbox).toBeEnabled();
    await firstCheckbox.click();

    // Step 8: Verify BulkActionBar updates to show '전체 선택 (1/N)'
    const oneSelected = techManagerPage.getByText(/전체 선택 \(1\/\d+\)/);
    await expect(oneSelected).toBeVisible({ timeout: 5000 });
    console.log('✅ BulkActionBar updated to 1 selected item');

    // Step 9: Locate and select second approval item
    const secondItem = approvalItems.nth(1);
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const secondCheckbox = secondItem.locator('button[role="checkbox"]');

    // Wait for checkbox to be ready and click
    await expect(secondCheckbox).toBeVisible({ timeout: 5000 });
    await expect(secondCheckbox).toBeEnabled();
    await secondCheckbox.click();

    // Step 10: Verify BulkActionBar updates to show '전체 선택 (2/N)'
    const twoSelected = techManagerPage.getByText(/전체 선택 \(2\/\d+\)/);
    await expect(twoSelected).toBeVisible({ timeout: 3000 });
    console.log('✅ BulkActionBar updated to 2 selected items');

    // Step 11: Verify '일괄 검토완료' button is enabled
    const bulkApproveButton = techManagerPage.getByRole('button', { name: /일괄 검토완료/ });
    await expect(bulkApproveButton).toBeVisible();
    await expect(bulkApproveButton).toBeEnabled();
    console.log('✅ Bulk approve button is enabled');

    // Step 12: Click '일괄 검토완료' button
    await bulkApproveButton.click();

    // Step 13: Wait for AlertDialog to open and verify it's visible
    // Radix UI AlertDialog uses role="alertdialog", not "dialog"
    const alertDialog = techManagerPage.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible({ timeout: 5000 });

    const dialogTitle = techManagerPage.getByRole('heading', { name: '일괄 검토완료' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ AlertDialog opened with title "일괄 검토완료"');

    // Step 14: Verify AlertDialog description includes '선택한 2개 항목을 검토완료하시겠습니까?'
    const dialogDescription = techManagerPage.getByText(/선택한 2개 항목을 검토완료하시겠습니까\?/);
    await expect(dialogDescription).toBeVisible();
    console.log('✅ AlertDialog shows correct count (2 items)');

    // Step 15: Click '검토완료' action button in AlertDialog to confirm
    const confirmButton = techManagerPage.getByRole('button', { name: '검토완료' }).last();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Step 16: Verify toast message '2건이 승인되었습니다' appears
    // Toast appears in a container with role="status"
    const toastMessage = techManagerPage.getByText(/2건이 승인되었습니다/);
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Toast notification appeared with correct count');

    // Step 17: Wait for list to refresh via React Query invalidation

    // Step 18: Verify both selected items are removed from list
    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBe(initialCount - 2);
    console.log('✅ 2 items removed from list after bulk approval');

    // Step 19: Verify BulkActionBar selection count resets to 0
    const resetSelection = techManagerPage.getByText(/전체 선택 \(0\/\d+\)/);
    await expect(resetSelection).toBeVisible({ timeout: 3000 });
    console.log('✅ BulkActionBar selection reset to 0');

    // Step 20: Verify remaining 2 items are still visible
    expect(updatedCount).toBeGreaterThanOrEqual(2);
    await expect(approvalItems.nth(0)).toBeVisible();
    await expect(approvalItems.nth(1)).toBeVisible();
    console.log('✅ Remaining items still visible in the list');

    // Verify the list count description updates
    const countDescription = techManagerPage.getByText(/총 \d+개의 승인 대기 요청이 있습니다/);
    await expect(countDescription).toBeVisible({ timeout: 5000 });

    const descriptionText = await countDescription.textContent();
    console.log(`List count description: ${descriptionText}`);

    console.log('✅ Test completed successfully');
  });
});
