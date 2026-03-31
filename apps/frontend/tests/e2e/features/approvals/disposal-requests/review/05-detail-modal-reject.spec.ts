/**
 * Approvals - Disposal Review: Detail Modal Reject Button Opens RejectModal
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 1.5 - Detail modal reject button opens RejectModal
 *
 * This test verifies the modal chaining behavior where:
 * 1. Opening the detail modal via '상세' button
 * 2. Clicking '반려' in the detail modal closes it
 * 3. The RejectModal opens with the correct item context
 * 4. Rejection submitted from RejectModal processes correctly
 * 5. Both modals close and item is removed from the list
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C3 (Suwon team, pending disposal)
 * Disposal Request: DISP_REQ_C3_ID (reviewStatus='pending')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_REJ_C3,
  DISP_REQ_C3_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Review Tab - Detail Modal Reject Button', () => {
  // Reset equipment to pending disposal state before each test
  test.beforeEach(async () => {
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C3,
      DISP_REQ_C3_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ Test equipment reset to pending_disposal state');
  });

  // Cleanup database connection pool after all tests

  test('1.5 - Detail modal reject button opens RejectModal', async ({ techManagerPage }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 2: Wait for the approval list to load
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Verify the '폐기 검토' tab is active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    console.log('✅ Disposal Review tab is active');

    // Wait for the approval list to render
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Step 3: Find and click '상세' button on C1 item to open ApprovalDetailModal
    const c1Item = approvalItems.filter({ hasText: '[Disposal Test C3] 멀티미터 (검증)' }).first();
    await expect(c1Item).toBeVisible();
    console.log('Found C1 disposal request item');

    const detailButton = c1Item.getByRole('button', { name: /상세/ });
    await expect(detailButton).toBeVisible();
    await expect(detailButton).toBeEnabled();
    await detailButton.click();
    console.log('Clicked "상세" button');

    // Step 4: Verify the detail modal is open with correct content
    const detailModal = techManagerPage.getByRole('dialog');
    await expect(detailModal).toBeVisible({ timeout: 5000 });
    await expect(detailModal).toHaveAttribute('aria-modal', 'true');
    console.log('✅ ApprovalDetailModal opened');

    // Verify modal title
    const modalTitle = detailModal.getByRole('heading', { name: '승인 요청 상세' });
    await expect(modalTitle).toBeVisible();

    // Verify status badge - Target the Badge component specifically by its class to avoid matching seed data text
    const statusBadge = detailModal
      .locator('.inline-flex.items-center.rounded-md')
      .getByText('대기');
    await expect(statusBadge).toBeVisible();

    // Verify the item summary is displayed
    const itemSummary = detailModal.getByText('[Disposal Test C3] 멀티미터 (검증)');
    await expect(itemSummary).toBeVisible();
    console.log('✅ Detail modal content verified');

    // Step 5: Verify footer buttons are present
    const closeButton = detailModal.getByRole('button', { name: '닫기' });
    await expect(closeButton).toBeVisible();

    const approveButton = detailModal.getByRole('button', { name: /검토완료/ });
    await expect(approveButton).toBeVisible();

    const rejectButtonInDetailModal = detailModal.getByRole('button', { name: /반려/ });
    await expect(rejectButtonInDetailModal).toBeVisible();
    await expect(rejectButtonInDetailModal).toBeEnabled();
    console.log('✅ Footer buttons visible: 닫기, 검토완료, 반려');

    // Step 6: Click the '반려' button in the detail modal footer
    await rejectButtonInDetailModal.click();
    console.log('Clicked "반려" button in detail modal');

    // Step 7: Verify the ApprovalDetailModal closes (modal chaining)
    await expect(detailModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Detail modal closed');

    // Step 8: Verify the RejectModal opens with title '반려'
    const rejectModal = techManagerPage.getByRole('dialog', { name: /반려/ });
    await expect(rejectModal).toBeVisible({ timeout: 5000 });
    await expect(rejectModal).toHaveAttribute('aria-modal', 'true');
    console.log('✅ RejectModal opened after detail modal closed');

    const rejectModalTitle = rejectModal.getByRole('heading', { name: '반려' });
    await expect(rejectModalTitle).toBeVisible();

    // Verify the description references the same item
    const rejectModalDescription = rejectModal.getByText(/멀티미터/);
    await expect(rejectModalDescription).toBeVisible();
    console.log('✅ RejectModal has correct item context');

    // Step 9: Type a valid rejection reason (10+ characters)
    const textarea = rejectModal.locator('#reject-reason');
    await expect(textarea).toBeVisible();

    const rejectionReason = '상세 모달에서 반려합니다. 추가 서류 제출이 필요합니다.';
    await textarea.fill(rejectionReason);
    console.log('Entered rejection reason:', rejectionReason);

    // Step 10: Click the '반려' submit button in the RejectModal
    const submitButton = rejectModal.getByRole('button', { name: /반려/ }).last();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    console.log('Clicked submit button in RejectModal');

    // Step 11: Verify toast '반려 완료' appears
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('✅ Toast notification "반려 완료" appeared');

    // Step 12: Verify the RejectModal closes
    await expect(rejectModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ RejectModal closed after submission');

    // Step 13: Verify the rejected item is removed from the list

    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    // Verify the C1 item is no longer in the list
    const c1ItemAfter = approvalItems.filter({ hasText: '[Disposal Test C3] 멀티미터 (검증)' });
    await expect(c1ItemAfter).toHaveCount(0);
    console.log('✅ Rejected item removed from list');

    console.log('✅ Test completed successfully - Modal chaining and rejection workflow verified');
  });
});
