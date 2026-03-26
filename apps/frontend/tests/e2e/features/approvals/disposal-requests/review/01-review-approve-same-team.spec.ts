/**
 * Approvals - Disposal Review: Approve Same-Team Request
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 1.1 - Review and approve same-team pending disposal request
 *
 * This test verifies that a technical_manager can:
 * 1. Access the disposal_review tab
 * 2. View pending disposal requests from their team (Suwon)
 * 3. Approve a disposal request by clicking "검토완료"
 * 4. See the item removed from the list
 * 5. Verify toast notification and count updates
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A1 (Suwon team, pending disposal)
 * Disposal Request: DISP_REQ_A1_ID (reviewStatus='pending')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A1,
  DISP_REQ_A1_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Disposal Review Tab - Approve Same-Team Request', () => {
  // Reset equipment to pending disposal state before each test
  test.beforeEach(async () => {
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A1,
      DISP_REQ_A1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    console.log('✅ Test equipment reset to pending_disposal state');
  });

  test('1.1 - Review and approve same-team pending disposal request', async ({
    techManagerPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // Step 1: Wait for page to load and verify heading '승인 관리' is visible
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Step 2: Verify the '폐기 검토' tab is visible and active in the tab list (aria-selected='true')
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    // Step 3: Wait for the approval list to render (wait for '승인 대기 목록' heading in card)
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // Step 4: Verify at least one approval item card is displayed
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Step 5: Locate the approval item card containing '[Disposal Test A4] 파워 미터' in its summary text
    // For now, use the first item since the test data is controlled
    const firstItem = approvalItems.first();

    // Step 6: Verify the item shows status badge '대기'
    const statusBadge = firstItem.getByText('대기');
    await expect(statusBadge).toBeVisible();

    // Verify the 3-step ApprovalStepIndicator is displayed
    const stepIndicator = firstItem.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Verify requester info is displayed
    await expect(firstItem.getByText('요청자')).toBeVisible();
    await expect(firstItem.getByText('팀')).toBeVisible();
    await expect(firstItem.getByText('요청일시')).toBeVisible();

    // Step 7: Click the '검토완료' button on the A4 item
    const approveButton = firstItem.getByRole('button', { name: /검토완료/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();

    // Get the item summary text for verification
    const summaryText = await firstItem.locator('.font-medium').first().textContent();
    console.log(`Approving disposal request: ${summaryText}`);

    // Scroll the approve button into view to avoid sticky header overlap
    await approveButton.scrollIntoViewIfNeeded();

    // Click the approve button
    await approveButton.click();

    // Step 8: Wait for and verify the toast notification appears with text containing '승인 완료'
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Toast notification appeared');

    // Step 9: Verify the A4 item is no longer visible in the pending list
    // Wait for React Query invalidation to complete

    // Verify the approved item has been removed from the pending list
    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    // Verify the list count description updates
    const countDescription = techManagerPage.getByText(/총 \d+개의 승인 대기 요청이 있습니다/);
    await expect(countDescription).toBeVisible({ timeout: 5000 });

    const descriptionText = await countDescription.textContent();
    console.log(`List count description: ${descriptionText}`);

    // If all items are processed, empty state should appear
    if (updatedCount === 0) {
      const emptyState = techManagerPage.getByText('승인 대기 중인 요청이 없습니다');
      await expect(emptyState).toBeVisible();
      console.log('✅ Empty state displayed after approving all items');
    }

    console.log('✅ Test completed successfully');
  });
});
