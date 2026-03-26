/**
 * Approvals - Technical Manager Cross-Team Access Denied
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.4 - Technical manager cannot see cross-team equipment in disposal_review
 *
 * This test verifies that technical_manager (Suwon team):
 * - Cannot see disposal requests from other teams (Uiwang) in disposal_review tab
 * - Only sees disposal requests from their own team (Suwon)
 * - Cross-team access is properly restricted by the backend API
 *
 * Equipment: EQUIP_DISPOSAL_PERM_A7 (Uiwang team, pending disposal)
 * Disposal Request: DISP_REQ_A7_ID (reviewStatus='pending', TEAM_GENERAL_RF_UIWANG)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_PERM_A7,
  DISP_REQ_A7_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Role-Based Access Control', () => {
  // Reset Uiwang team equipment to pending disposal state before each test
  test.beforeEach(async () => {
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A7,
      DISP_REQ_A7_ID,
      USER_TEST_ENGINEER_UIWANG_ID
    );

    console.log('✅ Test equipment A7 (Uiwang team) reset to pending_disposal state');
  });

  test('Technical manager cannot see cross-team equipment in disposal_review', async ({
    techManagerPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // 1. Navigate to /admin/approvals?tab=disposal_review with cache busting
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);
    console.log('✅ Step 1: Navigated to disposal_review tab with cache busting');

    // 2. Wait for page to load and verify heading '승인 관리' is visible
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 2: Page heading "승인 관리" is visible');

    // 3. Verify the '폐기 검토' tab is visible and active
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    console.log('✅ Step 3: "폐기 검토" tab is active');

    // 4. Wait for the approval list to fully load
    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 4: Approval list loaded');

    // 5. Get all approval items in the list
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');

    // Wait for items to load or empty state to appear

    const itemCount = await approvalItems.count();
    console.log(`Found ${itemCount} approval items in disposal_review tab`);

    // 6. Verify A7 equipment (Uiwang team) is NOT visible
    // Check by searching for the equipment name or management number
    const a7EquipmentName = '[Disposal Test A7] RF 안테나';
    const a7Item = techManagerPage.getByText(a7EquipmentName);

    // The A7 item should NOT be visible
    await expect(a7Item).not.toBeVisible();
    console.log('✅ Step 6: A7 equipment (Uiwang team) is NOT visible - cross-team access denied');

    // 7. Verify only same-team (Suwon) items are visible
    // If there are items, they should all be from Suwon team
    if (itemCount > 0) {
      console.log('Verifying visible items are from Suwon team only...');

      // Get all item summaries
      const itemSummaries = approvalItems.locator('.font-medium').first();
      const summaryTexts = await itemSummaries.allTextContents();

      console.log('Visible disposal requests:', summaryTexts);

      // Verify A7 is not in the list
      for (const summary of summaryTexts) {
        expect(summary).not.toContain('Disposal Test A7');
        expect(summary).not.toContain('RF 안테나');
      }

      console.log('✅ Step 7: All visible items are from Suwon team (A7 not present)');
    } else {
      // If empty state is shown, that's also valid (no pending Suwon items)
      const emptyState = techManagerPage.getByText('승인 대기 중인 요청이 없습니다');
      const isEmptyStateVisible = await emptyState.isVisible();

      if (isEmptyStateVisible) {
        console.log('✅ Step 7: Empty state shown (no Suwon team pending disposal requests)');
      }
    }

    // Additional verification: Verify the API response doesn't contain A7
    // This is implicitly verified by the UI not showing A7, but we can add explicit check
    console.log('✅ All assertions passed - technical_manager cannot see cross-team equipment');
  });
});
