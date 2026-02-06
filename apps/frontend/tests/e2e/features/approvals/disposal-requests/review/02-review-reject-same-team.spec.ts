/**
 * Approvals - Disposal Review: Reject Same-Team Request with Template
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 1.2 - Review and reject same-team pending disposal request with template
 *
 * This test verifies that a technical_manager can:
 * 1. Access the disposal_review tab
 * 2. View pending disposal requests from their team (Suwon)
 * 3. Open the reject modal by clicking "반려"
 * 4. Select a pre-defined rejection template
 * 5. Verify the template text populates the textarea
 * 6. Submit the rejection
 * 7. See the item removed from the list
 * 8. Verify toast notification
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C1 (Suwon team, pending disposal)
 * Disposal Request: DISP_REQ_C1_ID (reviewStatus='pending')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_REJ_C1,
  DISP_REQ_C1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Review Tab - Reject Same-Team Request with Template', () => {
  // Reset equipment to pending disposal state before each test
  test.beforeEach(async () => {
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C1,
      DISP_REQ_C1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ Test equipment reset to pending_disposal state');
  });

  // Cleanup database connection pool after all tests

  test('1.2 - Review and reject same-team pending disposal request with template', async ({
    techManagerPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 1: Wait for the approval list to load with pending items
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Verify the '폐기 검토' tab is active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    // Wait for the approval list to render
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // Step 2: Locate the disposal review item for '[Disposal Test C1] 전압계 (검토 반려)'
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Find the item containing '[Disposal Test C1] 전압계 (검토 반려)' text
    const c1Item = approvalItems
      .filter({ hasText: '[Disposal Test C1] 전압계 (검토 반려)' })
      .first();
    await expect(c1Item).toBeVisible();

    // Verify the item shows status badge '대기'
    const statusBadge = c1Item.getByText('대기');
    await expect(statusBadge).toBeVisible();

    console.log('Found disposal request for C1 equipment');

    // Step 3: Click the '반려' button (red/destructive) on the C1 item
    const rejectButton = c1Item.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();
    console.log('Clicked "반려" button');

    // Step 4: Verify the RejectModal dialog opens (role='dialog', aria-modal='true') with title '반려'
    const rejectDialog = techManagerPage.getByRole('dialog', { name: /반려/ });
    await expect(rejectDialog).toBeVisible({ timeout: 5000 });
    await expect(rejectDialog).toHaveAttribute('aria-modal', 'true');

    const dialogTitle = rejectDialog.getByRole('heading', { name: '반려' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ RejectModal opened successfully');

    // Step 5: Verify the '사유 템플릿' dropdown selector is present
    const templateLabel = rejectDialog.getByText('사유 템플릿');
    await expect(templateLabel).toBeVisible();

    const templateSelector = rejectDialog.locator('#template');
    await expect(templateSelector).toBeVisible();
    console.log('✅ Template selector is present');

    // Step 6: Open the template dropdown and verify options
    await templateSelector.click();

    // Wait for dropdown menu to open
    const dropdownMenu = techManagerPage.getByRole('listbox');
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // Verify all template options are present
    const expectedOptions = ['직접 입력', '서류 미비', '정보 오류', '절차 미준수', '타당성 부족'];

    for (const optionText of expectedOptions) {
      const option = techManagerPage.getByRole('option', { name: optionText });
      await expect(option).toBeVisible();
    }
    console.log('✅ All template options are present');

    // Step 7: Select the '타당성 부족' template from the dropdown
    const validityOption = techManagerPage.getByRole('option', { name: '타당성 부족' });
    await validityOption.click();
    console.log('Selected "타당성 부족" template');

    // Step 8: Verify the textarea (id='reject-reason') is populated with the template text
    const textarea = rejectDialog.locator('#reject-reason');
    await expect(textarea).toBeVisible();

    const expectedTemplateText =
      '타당성 부족: 요청 사유에 대한 타당성이 부족합니다. 추가 설명과 함께 재요청해주세요.';
    await expect(textarea).toHaveValue(expectedTemplateText);
    console.log('✅ Textarea populated with template text');

    // Step 9: Click the '반려' submit button in the modal
    const submitButton = rejectDialog.getByRole('button', { name: /반려/ }).last();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    console.log('Clicked submit button');

    // Step 10: Verify toast '반려 완료' appears
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('✅ Toast notification appeared');

    // Step 11: Verify the RejectModal closes and the rejected item disappears from the list
    // Wait for modal to close
    await expect(rejectDialog).not.toBeVisible({ timeout: 5000 });
    console.log('✅ RejectModal closed');

    // Wait for React Query invalidation to complete
    await techManagerPage.waitForTimeout(1000);

    // Verify the rejected item has been removed from the pending list
    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    // Verify the C1 item is no longer in the list
    const c1ItemAfter = approvalItems.filter({ hasText: '[Disposal Test C1] 전압계 (검토 반려)' });
    await expect(c1ItemAfter).toHaveCount(0);
    console.log('✅ Rejected item removed from list');

    // Verify the list count description updates
    const countDescription = techManagerPage.getByText(/총 \d+개의 승인 대기 요청이 있습니다/);
    if (updatedCount > 0) {
      await expect(countDescription).toBeVisible({ timeout: 5000 });
      const descriptionText = await countDescription.textContent();
      console.log(`List count description: ${descriptionText}`);
    }

    // If all items are processed, empty state should appear
    if (updatedCount === 0) {
      const emptyState = techManagerPage.getByText('승인 대기 중인 요청이 없습니다');
      await expect(emptyState).toBeVisible();
      console.log('✅ Empty state displayed after rejecting all items');
    }

    console.log('✅ Test completed successfully');
  });
});
