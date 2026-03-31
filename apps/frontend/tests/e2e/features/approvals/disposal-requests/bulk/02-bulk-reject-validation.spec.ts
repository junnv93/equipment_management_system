/**
 * Approvals - Disposal Bulk Actions: Select All and Bulk Reject with Reason Validation
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 5.2 - Select all and bulk reject with reason validation
 *
 * This test verifies that a technical_manager can:
 * 1. Select all disposal review items via '전체 선택' checkbox
 * 2. See the BulkActionBar show "N/N" selected
 * 3. Click the bulk reject button
 * 4. See validation error for rejection reason < 10 characters
 * 5. See live character count feedback (N/10)
 * 6. Successfully bulk reject with valid reason (10+ chars)
 * 7. See toast with correct count of rejected items
 * 8. Verify all items are removed from the list
 * 9. See empty state when no items remain
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A4, EQUIP_DISPOSAL_REJ_C1
 * Disposal Requests: DISP_REQ_A4_ID, DISP_REQ_C1_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  resetEquipmentToPendingDisposal,
  clearAllPendingDisposalRequests,
} from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A4,
  EQUIP_DISPOSAL_REJ_C1,
  DISP_REQ_A4_ID,
  DISP_REQ_C1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Bulk Actions - Select All and Bulk Reject with Validation', () => {
  // Reset 2 equipment items to pending disposal state before each test
  test.beforeEach(async () => {
    // Step 0: Clear ALL pending disposal requests to ensure clean slate
    await clearAllPendingDisposalRequests();

    // Step 1: Seed exactly 2 equipment to pending_disposal: A4, C1
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A4,
      DISP_REQ_A4_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C1,
      DISP_REQ_C1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ 2 test equipment items reset to pending_disposal state (all others cleared)');
  });

  test('5.2 - Select all and bulk reject with reason validation', async ({ techManagerPage }) => {
    // Step 2: Login as techManagerPage (technical_manager)
    // Already logged in via fixture

    // Step 3: Navigate to /admin/approvals?tab=disposal_review with cache busting
    const timestamp = Date.now();
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 4: Wait for page load
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Verify the '폐기 검토' tab is visible and active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    // Wait for the approval list to render
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // Verify exactly 2 approval items are displayed (we cleared all others in beforeEach)
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBe(2); // Expect exactly 2 items since we cleared all others

    // Step 5: Click '전체 선택' checkbox to select all items
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const selectAllCheckbox = techManagerPage.locator('button[role="checkbox"][id="select-all"]');
    await expect(selectAllCheckbox).toBeVisible();

    // Scroll to checkbox to avoid sticky header issue
    await selectAllCheckbox.scrollIntoViewIfNeeded();

    await selectAllCheckbox.click();
    console.log('✅ Clicked "전체 선택" checkbox');

    // Step 6: Verify BulkActionBar shows "2/2" selected
    const allSelectedText = techManagerPage.getByText(
      new RegExp(`전체 선택 \\(${initialCount}/${initialCount}\\)`)
    );
    await expect(allSelectedText).toBeVisible({ timeout: 3000 });
    console.log(`✅ BulkActionBar shows ${initialCount}/${initialCount} selected`);

    // Verify all individual checkboxes are checked
    // Radix UI Checkbox renders as button[role="checkbox"], not input[type="checkbox"]
    const individualCheckboxes = techManagerPage.locator(
      '[data-testid="approval-item"] button[role="checkbox"]'
    );
    const checkboxCount = await individualCheckboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      // For Radix UI, use data-state="checked" attribute instead of :checked
      await expect(individualCheckboxes.nth(i)).toHaveAttribute('data-state', 'checked');
    }
    console.log('✅ All individual item checkboxes are checked');

    // Step 7: Click '일괄 반려' button
    const bulkRejectButton = techManagerPage.getByRole('button', { name: /일괄 반려/ });
    await expect(bulkRejectButton).toBeVisible();
    await expect(bulkRejectButton).toBeEnabled();
    console.log('✅ Bulk reject button is enabled');

    await bulkRejectButton.click();

    // Step 8: Verify reject modal/dialog opens
    // Radix UI AlertDialog uses role="alertdialog", not "dialog"
    const alertDialog = techManagerPage.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible({ timeout: 5000 });

    const dialogTitle = techManagerPage.getByRole('heading', { name: '일괄 반려' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ AlertDialog opened with title "일괄 반려"');

    // Verify AlertDialog description
    const dialogDescription = techManagerPage.getByText(
      new RegExp(`선택한 ${initialCount}개 항목을 반려합니다`)
    );
    await expect(dialogDescription).toBeVisible();
    console.log(`✅ AlertDialog shows correct count (${initialCount} items)`);

    // Locate the rejection reason textarea
    const reasonTextarea = alertDialog.getByRole('textbox', { name: /반려 사유/ });
    await expect(reasonTextarea).toBeVisible();

    // Locate the confirm button
    const confirmButton = alertDialog.getByRole('button', { name: '반려' });
    await expect(confirmButton).toBeVisible();

    // Step 9: Test validation: Enter rejection reason with < 10 characters (e.g., "짧음")
    await reasonTextarea.fill('짧음');

    const shortReasonValue = await reasonTextarea.inputValue();
    console.log(`Short reason entered: "${shortReasonValue}" (${shortReasonValue.length} chars)`);
    expect(shortReasonValue).toBe('짧음');
    expect(shortReasonValue.length).toBeLessThan(10);

    // Wait a moment for validation to trigger

    // Step 10: Verify error message appears (e.g., "반려 사유는 최소 10자 이상이어야 합니다")
    const errorMessage = alertDialog.getByText(/반려 사유는 10자 이상 입력해주세요/);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    console.log('✅ Validation error message appears for short reason');

    // Verify live character count feedback (N/10)
    const charCountText = alertDialog.getByText(/\(2\/10\)/);
    await expect(charCountText).toBeVisible();
    console.log('✅ Character count feedback displayed (2/10)');

    // Verify the submit button is disabled
    await expect(confirmButton).toBeDisabled();
    console.log('✅ Submit button is disabled when reason is too short');

    // Step 11: Clear input and enter valid reason (10+ chars, e.g., "폐기 요청이 적절하지 않습니다")
    await reasonTextarea.clear();
    const validReason = '폐기 요청이 적절하지 않습니다';
    await reasonTextarea.fill(validReason);

    const validReasonValue = await reasonTextarea.inputValue();
    console.log(`Valid reason entered: "${validReasonValue}" (${validReasonValue.length} chars)`);
    expect(validReasonValue).toBe(validReason);
    expect(validReasonValue.length).toBeGreaterThanOrEqual(10);

    // Wait for validation to update

    // Verify error message disappears
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Validation error cleared after entering 10+ chars');

    // Verify submit button becomes enabled
    await expect(confirmButton).toBeEnabled();
    console.log('✅ Submit button is enabled with valid reason');

    // Step 12: Click confirm button
    await confirmButton.click();
    console.log('✅ Clicked confirm button to bulk reject');

    // Wait for the dialog to close and API call to complete
    await expect(alertDialog).not.toBeVisible({ timeout: 5000 });
    console.log('✅ AlertDialog closed after confirming');

    // Step 13: Verify toast message "2건이 반려되었습니다"
    const toastMessage = techManagerPage.getByText(
      new RegExp(`${initialCount}건이 반려되었습니다`)
    );
    await expect(toastMessage).toBeVisible({ timeout: 10000 });
    console.log(`✅ Toast notification appeared: "${initialCount}건이 반려되었습니다"`);

    // Step 14: Wait for list refresh

    // Step 15: Verify all 2 items removed from list
    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);

    // We had exactly 2 items, all should be removed
    expect(updatedCount).toBe(0);
    console.log('✅ All 2 items removed from list after bulk rejection');

    // Step 16: Verify empty state shown (Clock icon + "승인 대기 중인 요청이 없습니다")
    const emptyState = techManagerPage.getByText('승인 대기 중인 요청이 없습니다');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    console.log('✅ Empty state message displayed');

    // Verify empty state has proper accessibility
    const emptyStateContainer = techManagerPage.locator('[role="status"][aria-live="polite"]');
    await expect(emptyStateContainer).toBeVisible();
    console.log('✅ Empty state has proper accessibility attributes');

    // Verify Clock icon is visible
    const clockIcon = techManagerPage.locator('svg.lucide-clock');
    await expect(clockIcon).toBeVisible();
    console.log('✅ Clock icon displayed in empty state');

    // Verify BulkActionBar is NOT rendered (it returns null when totalCount is 0)
    const bulkActionBarAfter = techManagerPage.getByText(/전체 선택 \(\d+\/\d+\)/);
    await expect(bulkActionBarAfter).not.toBeVisible({ timeout: 2000 });
    console.log('✅ BulkActionBar hidden when no items remain');

    console.log('✅ Test completed successfully');
  });
});
