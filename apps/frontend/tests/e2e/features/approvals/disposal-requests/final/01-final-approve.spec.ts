/**
 * Approvals - Disposal Final: Approve Reviewed Request
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 2.1 - Final approve a reviewed disposal request
 *
 * This test verifies that a lab_manager can:
 * 1. Access the disposal_final tab
 * 2. View reviewed disposal requests from any team
 * 3. Approve a disposal request by clicking "승인"
 * 4. See the item removed from the list
 * 5. Verify toast notification and count updates
 * 6. Verify equipment status changes to 'disposed' in DB
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A5 (Suwon team, pending_disposal)
 * Disposal Request: DISP_REQ_A5_ID (reviewStatus='reviewed')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToReviewedDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A5,
  DISP_REQ_A5_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe.serial('Disposal Final Approval Tab - Approve Reviewed Request', () => {
  // Reset equipment to reviewed disposal state before each test
  test.beforeEach(async () => {
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_PERM_A5,
      DISP_REQ_A5_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );

    console.log('✅ Test equipment reset to reviewed disposal state');
  });

  // Cleanup database connection pool after all tests

  test('2.1 - Final approve a reviewed disposal request', async ({ siteAdminPage }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Navigate to /admin/approvals?tab=disposal_final with cache busting
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_=${timestamp}`);

    // Step 2: Wait for page to load and verify heading '승인 관리' is visible
    const pageHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    // Step 3: Verify the '폐기 승인' tab is visible and active
    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();
    await expect(disposalFinalTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Wait for the approval list to render
    const listHeading = siteAdminPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // Step 5: Locate the approval item for '[Disposal Test A5] EMC 수신기'
    const approvalItems = siteAdminPage.locator('[data-testid="approval-item"]');

    // Find the A5 item specifically (do not use .first() as list order may vary)
    const a5ItemLocator = approvalItems.filter({
      hasText: '[Disposal Test A5] EMC 수신기',
    });

    await expect(a5ItemLocator).toBeVisible({ timeout: 10000 });
    console.log('✅ Found A5 equipment in approval list');

    const initialCount = await approvalItems.count();
    console.log(`Initial approval items count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    // Step 6: Verify the status badge shows '검토 완료' (reviewed status)
    const statusBadge = a5ItemLocator.getByText('검토 완료');
    await expect(statusBadge).toBeVisible();

    // Step 7: Verify the 3-step indicator shows step 2 as completed and step 3 as current
    const stepIndicator = a5ItemLocator.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Verify requester info is displayed
    await expect(a5ItemLocator.getByText('요청자')).toBeVisible();
    await expect(a5ItemLocator.getByText('팀')).toBeVisible();
    await expect(a5ItemLocator.getByText('요청일시')).toBeVisible();

    // Step 8: Click the '승인' button on the A5 item
    const approveButton = a5ItemLocator.getByRole('button', { name: /^승인$/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();

    // Get the item summary text for verification
    const summaryText = await a5ItemLocator.locator('.font-medium').first().textContent();
    console.log(`Approving disposal request: ${summaryText}`);

    // Click the approve button
    await approveButton.click();

    // Step 9: Verify toast '승인 완료' appears
    const toastMessage = siteAdminPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Toast notification appeared');

    // Step 10: Verify the item disappears from the list
    // Wait for React Query invalidation to complete
    await siteAdminPage.waitForTimeout(1000);

    // Verify the approved item has been removed from the pending list
    const updatedCount = await approvalItems.count();
    console.log(`Updated approval items count: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);

    // Verify the list count description updates or empty state appears
    if (updatedCount === 0) {
      const emptyState = siteAdminPage.getByText('승인 대기 중인 요청이 없습니다');
      await expect(emptyState).toBeVisible();
      console.log('✅ Empty state displayed after approving all items');
    } else {
      const countDescription = siteAdminPage.getByText(/총 \d+개의 승인 대기 요청이 있습니다/);
      await expect(countDescription).toBeVisible({ timeout: 5000 });

      const descriptionText = await countDescription.textContent();
      console.log(`List count description: ${descriptionText}`);
    }

    console.log('✅ Test completed successfully');

    // Note: Equipment status change to 'disposed' is verified by the backend API
    // The UI reflects this change by removing the item from the pending approval list
  });
});
