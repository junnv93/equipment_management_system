/**
 * Approvals - Disposal Review: Rejection Reason Validation
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 *
 * Test Plan: Suite 1.3 - Rejection reason validation requires minimum 10 characters
 *
 * This test verifies that a technical_manager:
 * 1. Cannot submit rejection with empty reason
 * 2. Cannot submit rejection with reason < 10 characters
 * 3. See proper validation error messages with accessibility attributes
 * 4. Can submit rejection with reason >= 10 characters
 * 5. See modal close and toast confirmation after successful rejection
 *
 * Equipment: EQUIP_DISPOSAL_EXC_D1 (Suwon team, pending disposal)
 * Disposal Request: DISP_REQ_D1_ID (reviewStatus='pending')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_EXC_D1,
  DISP_REQ_D1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { Permission } from '@equipment-management/shared-constants';

test.describe('Disposal Review Tab (technical_manager)', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending disposal state with pending review status
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_EXC_D1,
      DISP_REQ_D1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ Test equipment reset to pending_disposal state');
  });

  test('1.3 - Rejection reason validation requires minimum 10 characters', async ({
    techManagerPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Login as techManagerPage fixture (technical_manager role)
    // Already logged in via fixture

    // Step 2: Navigate to /admin/approvals?tab=disposal_review
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_t=${timestamp}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Step 3: Wait for the approval list to load with at least one pending item
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    const firstItem = approvalItems.first();

    // Get the item summary for logging
    const summaryText = await firstItem.locator('.font-medium').first().textContent();
    console.log(`Testing rejection validation on: ${summaryText}`);

    // Step 4: Click the '반려' button on the first pending disposal item
    const rejectButton = firstItem.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();

    await rejectButton.click();

    // Step 5: Verify the RejectModal dialog opens
    const rejectModal = techManagerPage.getByRole('dialog');
    await expect(rejectModal).toBeVisible({ timeout: 5000 });

    const modalTitle = rejectModal.getByRole('heading', { name: '반려' });
    await expect(modalTitle).toBeVisible();

    // Verify ARIA attributes
    await expect(rejectModal).toHaveAttribute('aria-modal', 'true');

    // Locate the rejection reason textarea
    const reasonTextarea = rejectModal.getByRole('textbox', { name: /반려 사유/ });
    await expect(reasonTextarea).toBeVisible();

    // Locate the submit button
    const submitButton = rejectModal.getByRole('button', { name: '반려' });
    await expect(submitButton).toBeVisible();

    // Step 6: Leave the rejection reason textarea empty
    // Textarea is already empty by default

    // Step 7: Click the '반려' submit button in the modal
    await submitButton.click();

    // Step 8: Verify error message appears: '반려 사유는 10자 이상 입력해주세요.'
    const errorMessage1 = rejectModal.getByText(/반려 사유는 10자 이상 입력해주세요/);
    await expect(errorMessage1).toBeVisible({ timeout: 3000 });
    console.log('✅ Validation error shown for empty reason');

    // Step 9: Verify the error has role='alert' and aria-live='assertive' for screen readers
    const errorAlert = rejectModal.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    console.log('✅ Error has proper accessibility attributes');

    // Step 10: Type '짧은 사유' (5 characters) into the reason textarea
    await reasonTextarea.fill('짧은 사유');

    const shortReasonValue = await reasonTextarea.inputValue();
    console.log(`Short reason entered: ${shortReasonValue} (${shortReasonValue.length} chars)`);
    expect(shortReasonValue).toBe('짧은 사유');

    // Step 11: Click the '반려' submit button again
    await submitButton.click();

    // Step 12: Verify the error message still shows (5 chars < 10 minimum)
    const errorMessage2 = rejectModal.getByText(/반려 사유는 10자 이상 입력해주세요/);
    await expect(errorMessage2).toBeVisible({ timeout: 3000 });
    console.log('✅ Validation error still shown for short reason (5 chars)');

    // Step 13: Clear the textarea and type valid reason (10+ characters)
    await reasonTextarea.clear();
    const validReason = '반려 사유를 충분히 작성합니다. 폐기 근거 부족합니다.';
    await reasonTextarea.fill(validReason);

    const validReasonValue = await reasonTextarea.inputValue();
    console.log(`Valid reason entered: ${validReasonValue} (${validReasonValue.length} chars)`);
    expect(validReasonValue.length).toBeGreaterThanOrEqual(10);

    // Verify error message disappears
    await expect(errorMessage2).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Validation error cleared after entering 10+ chars');

    // Step 14: Click the '반려' submit button
    await submitButton.click();

    // Step 15: Verify the dialog closes (indicating successful submission)
    await expect(rejectModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Modal closed after successful submission');

    // Step 16: Verify toast notification '반려 완료' appears
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('✅ Toast notification appeared');

    // Verify the rejected item has been removed from the pending list
    await techManagerPage.waitForTimeout(1000);

    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    console.log('✅ Test completed successfully - Rejection validation working correctly');
  });
});
