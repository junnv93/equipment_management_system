/**
 * Approvals - Tab Navigation: Tab Switch Clears Selection State
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/seed.spec.ts
 *
 * Test Plan: Suite 6.2 - Tab switch clears selection state
 *
 * This test verifies that switching tabs clears the selection state:
 * - Selection state persists within a tab
 * - Switching tabs clears selection state (handleTabChange calls setSelectedItems([]))
 * - Returning to original tab shows cleared selection
 * - BulkActionBar resets to "0/N"
 * - Individual item checkbox states are reset after a tab round-trip
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A4, EQUIP_DISPOSAL_REJ_C1
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A4,
  EQUIP_DISPOSAL_REJ_C1,
  DISP_REQ_A4_ID,
  DISP_REQ_C1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Tab Navigation - Tab Switch Clears Selection', () => {
  // Reset 2 equipment items to pending disposal state before each test
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

    console.log('✅ 2 test equipment items reset to pending_disposal state');
  });

  test('6.2 - Tab switch clears selection state', async ({ techManagerPage }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 2: Wait for page to load and verify heading '승인 관리' is visible
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 2: Page loaded with heading "승인 관리"');

    // Step 3: Verify the '폐기 검토' tab is visible and active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    console.log('✅ Step 3: "폐기 검토" tab is active');

    // Step 4: Wait for the approval list to render
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 4: Approval list loaded');

    // Step 5: Verify at least 2 approval item cards are displayed
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Step 6: Verify BulkActionBar is visible showing initial count '전체 선택 (0/N)'
    const bulkActionBarInitial = techManagerPage.getByText(/전체 선택 \(0\/\d+\)/);
    await expect(bulkActionBarInitial).toBeVisible();
    console.log('✅ Step 6: BulkActionBar shows 0 selected items initially');

    // Step 7: Select first item by clicking its checkbox
    const firstItem = approvalItems.nth(0);
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const firstCheckbox = firstItem.locator('button[role="checkbox"]');

    // Wait for checkbox to be ready
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 });
    await expect(firstCheckbox).toBeEnabled();

    // Click first checkbox
    await firstCheckbox.click();
    console.log('✅ Step 7: First item checkbox clicked');

    // Step 8: Verify BulkActionBar updates to show '전체 선택 (1/N)'
    const oneSelected = techManagerPage.getByText(/전체 선택 \(1\/\d+\)/);
    await expect(oneSelected).toBeVisible({ timeout: 3000 });
    console.log('✅ Step 8: BulkActionBar updated to "1/N" - one item selected');

    // Step 9: Click a different tab (e.g., '교정 기록' calibration tab)
    const calibrationTab = techManagerPage.getByRole('tab', { name: /교정 기록/ });
    await expect(calibrationTab).toBeVisible();
    await calibrationTab.click();
    console.log('✅ Step 9: Clicked "교정 기록" tab');

    // Step 10: Wait for tab to load and URL to update

    const urlAfterSwitch = techManagerPage.url();
    expect(urlAfterSwitch).toContain('tab=calibration');
    console.log('✅ Step 10: Tab switched, URL updated to ?tab=calibration');

    // Step 11: Return to '폐기 검토' tab by clicking it
    await disposalReviewTab.click();
    console.log('✅ Step 11: Clicked "폐기 검토" tab to return');

    // Step 12: Wait for disposal_review content to load

    const urlAfterReturn = techManagerPage.url();
    expect(urlAfterReturn).toContain('tab=disposal_review');

    // Wait for list to re-render
    await expect(listHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 12: Returned to "폐기 검토" tab, list reloaded');

    // Step 13: Verify BulkActionBar shows "0/N" (selection cleared)
    const resetSelection = techManagerPage.getByText(/전체 선택 \(0\/\d+\)/);
    await expect(resetSelection).toBeVisible({ timeout: 3000 });
    console.log('✅ Step 13: BulkActionBar shows "0/N" - selection cleared');

    // Step 14: Verify no checkboxes are checked
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const allCheckboxes = techManagerPage.locator(
      '[data-testid="approval-item"] button[role="checkbox"]'
    );
    const checkboxCount = await allCheckboxes.count();

    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      // Radix UI unchecked state: data-state="unchecked"
      await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    }
    console.log(`✅ Step 14: All ${checkboxCount} checkboxes are unchecked`);

    // Step 15: Verify that selecting an item again works correctly after clearing
    await expect(firstCheckbox).toBeVisible({ timeout: 5000 });
    await expect(firstCheckbox).toBeEnabled();
    await firstCheckbox.click();

    const oneSelectedAgain = techManagerPage.getByText(/전체 선택 \(1\/\d+\)/);
    await expect(oneSelectedAgain).toBeVisible({ timeout: 3000 });
    console.log('✅ Step 15: Selection works correctly after tab round-trip');

    console.log('✅ Test completed successfully - Tab switch clears selection state');
  });
});
