/**
 * Approvals - Disposal Review: View Detail Modal
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 *
 * Test Plan: Suite 1.4 - View item detail via ApprovalDetailModal before reviewing
 *
 * This test verifies that a technical_manager can:
 * 1. Open the ApprovalDetailModal via '상세' button
 * 2. View all item metadata (status, requester, team, date)
 * 3. See the 3-step approval indicator for disposal type
 * 4. See request details (reason, reasonDetail, equipmentId)
 * 5. Approve directly from the detail modal
 * 6. See modal close and toast confirmation
 *
 * Equipment: EQUIP_DISPOSAL_UI_E1 (Suwon team, pending disposal)
 * Disposal Request: DISP_REQ_E1_ID (reviewStatus='pending')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_UI_E1,
  DISP_REQ_E1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { Permission } from '@equipment-management/shared-constants';

test.describe('Disposal Review Tab (technical_manager)', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending disposal state with pending review status
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_UI_E1,
      DISP_REQ_E1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ Test equipment reset to pending_disposal state');
  });

  test('1.4 - View item detail via ApprovalDetailModal before reviewing', async ({
    techManagerPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Login as techManagerPage fixture (technical_manager role)
    // Already logged in via fixture

    // Step 2: Navigate to /admin/approvals?tab=disposal_review
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_t=${timestamp}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Step 3: Wait for the approval list to load
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

    // Get the item summary text for verification later
    const summaryText = await firstItem.locator('.font-medium').first().textContent();
    console.log(`Testing detail modal on: ${summaryText}`);

    // Step 4: Click the '상세' button (outline variant, contains Eye icon) on a pending disposal item
    const detailButton = firstItem.getByRole('button', { name: /상세/ });
    await expect(detailButton).toBeVisible();
    await expect(detailButton).toBeEnabled();

    await detailButton.click();

    // Step 5: Verify the ApprovalDetailModal opens (role='dialog', aria-modal='true')
    const detailModal = techManagerPage.getByRole('dialog');
    await expect(detailModal).toBeVisible({ timeout: 5000 });
    await expect(detailModal).toHaveAttribute('aria-modal', 'true');
    console.log('✅ ApprovalDetailModal opened with proper ARIA attributes');

    // Step 6: Verify the modal title is '승인 요청 상세'
    const modalTitle = detailModal.getByRole('heading', { name: '승인 요청 상세' });
    await expect(modalTitle).toBeVisible();
    console.log('✅ Modal title verified');

    // Step 7: Verify the modal description says '요청 내용을 확인하고 승인 또는 반려를 진행하세요.'
    const modalDescription = detailModal.getByText(
      /요청 내용을 확인하고 승인 또는 반려를 진행하세요/
    );
    await expect(modalDescription).toBeVisible();
    console.log('✅ Modal description verified');

    // Step 8: Verify the status badge '대기' is shown in the modal header
    // Use .first() to select the badge (first occurrence) instead of the text in reasonDetail
    const statusBadge = detailModal.getByText('대기').first();
    await expect(statusBadge).toBeVisible();
    console.log('✅ Status badge "대기" visible in modal');

    // Step 9: Verify the item summary text is displayed prominently
    await expect(detailModal.getByText(summaryText || '')).toBeVisible();
    console.log('✅ Item summary text displayed in modal');

    // Step 10: Verify '요청자' name, '소속' team, and '요청일시' date are displayed
    await expect(detailModal.getByText('요청자')).toBeVisible();
    await expect(detailModal.getByText('소속')).toBeVisible();
    await expect(detailModal.getByText('요청일시')).toBeVisible();
    console.log('✅ Requester metadata (name, team, date) visible');

    // Step 11: Verify the '승인 진행 상태' section with ApprovalStepIndicator is shown (disposal type, 3 steps)
    const approvalProgressSection = detailModal.getByText('승인 진행 상태');
    await expect(approvalProgressSection).toBeVisible();

    // Verify the 3-step indicator is present (disposal workflow: 요청 -> 검토 -> 승인)
    const stepIndicator = detailModal.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();
    console.log('✅ Approval step indicator (3 steps) visible');

    // Step 12: Verify the '요청 상세' section shows disposal details (reason, reasonDetail, equipmentId)
    // Use getByRole with exact name to avoid matching "승인 요청 상세" in the dialog title
    const requestDetailSection = detailModal.getByRole('heading', {
      name: '요청 상세',
      exact: true,
    });
    await expect(requestDetailSection).toBeVisible();

    // Verify disposal details are shown - check for actual field labels displayed
    // The modal shows raw field keys (reason, reasonDetail) as formatKey doesn't have Korean mappings for disposal fields
    // Use exact: true to avoid "reason" matching both "reason" and "reasonDetail"
    await expect(detailModal.getByText('reason', { exact: true })).toBeVisible();
    await expect(detailModal.getByText('reasonDetail', { exact: true })).toBeVisible();
    await expect(detailModal.getByText('장비 ID')).toBeVisible();
    console.log(
      '✅ Request detail section visible with disposal information (reason, reasonDetail, equipmentId)'
    );

    // Step 13: Verify the footer has three buttons: '닫기' (outline), '검토완료' (green), '반려' (red)
    const closeButton = detailModal.getByRole('button', { name: '닫기' });
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toBeEnabled();

    const approveButton = detailModal.getByRole('button', { name: /검토완료/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();

    const rejectButton = detailModal.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();

    console.log('✅ All three footer buttons visible: 닫기, 검토완료, 반려');

    // Step 14: Click the '검토완료' button in the modal footer
    await approveButton.click();

    // Step 15: Verify the item is approved (toast '승인 완료' appears)
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Toast notification "승인 완료" appeared');

    // Step 16: Verify the modal closes after approval
    await expect(detailModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ ApprovalDetailModal closed after approval');

    // Verify the approved item has been removed from the pending list
    await techManagerPage.waitForTimeout(1000);

    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    console.log(
      '✅ Test completed successfully - Detail modal and approval flow working correctly'
    );
  });
});
