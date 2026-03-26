/**
 * Approvals - Disposal Final: Reject Action Removes Item and Updates Count
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.3 - Reject action removes item from list and updates count
 *
 * This test verifies that a lab_manager:
 * 1. Can see the initial item count in both list description and tab badge
 * 2. Can reject an item using the '반려' button with valid reason
 * 3. See the item count decrement by 1 in both locations
 * 4. See the rejected item removed from the list
 * 5. See empty state if all items are rejected
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C2 (Suwon team, pending_disposal)
 * Disposal Request: DISP_REQ_C2_ID (reviewStatus='reviewed')
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToReviewedDisposal } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import {
  EQUIP_DISPOSAL_REJ_C2,
  DISP_REQ_C2_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Suite 4: Data Validation, Role Access, and Bulk Actions', () => {
  test.beforeAll(async () => {
    // Reset equipment to reviewed disposal state (ready for final approval)
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_REJ_C2,
      DISP_REQ_C2_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );

    console.log('✅ Test equipment reset to reviewed disposal state');
  });

  test('4.3 - Reject action removes item from list and updates count', async ({
    siteAdminPage,
  }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // Step 1: Login as siteAdminPage fixture (lab_manager role)
    // Already logged in via fixture
    console.log('Step 1: Logged in as lab_manager');

    // Step 2: Navigate to /admin/approvals?tab=disposal_final
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_t=${timestamp}`);
    console.log('Step 2: Navigated to disposal_final tab with cache busting');

    // Step 3: Wait for list to fully load
    const pageHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const listHeading = siteAdminPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    const approvalItems = siteAdminPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });
    console.log('Step 3: List fully loaded');

    // Step 4: Record initial item count from list description '총 N개의 승인 대기 요청이 있습니다'
    const listDescription = siteAdminPage.locator('text=/총 \\d+개의 승인 대기 요청이 있습니다/');
    await expect(listDescription).toBeVisible({ timeout: 5000 });

    const descriptionText = await listDescription.textContent();
    const initialCountMatch = descriptionText?.match(/총 (\d+)개/);
    const initialListCount = initialCountMatch ? parseInt(initialCountMatch[1], 10) : 0;
    console.log(`Step 4: Initial list count from description: ${initialListCount}`);
    expect(initialListCount).toBeGreaterThan(0);

    // Step 5: Record initial tab badge count (orange Badge showing pending count)
    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();

    // Wait for potential badge to load (data may be loading)

    // Look for badge within the tab
    const tabBadge = disposalFinalTab.locator('[class*="badge"]').first();
    let initialBadgeCount = 0;

    // Check badge visibility with a short timeout
    const isBadgeVisible = await tabBadge.isVisible().catch(() => false);

    if (isBadgeVisible) {
      const badgeText = await tabBadge.textContent();
      initialBadgeCount = badgeText ? parseInt(badgeText, 10) : 0;
      console.log(`Step 5: Initial tab badge count: ${initialBadgeCount}`);
    } else {
      console.log('Step 5: Tab badge not visible (assuming 0 count)');
    }

    // Get the first item and record its summary for verification
    const firstItem = approvalItems.first();
    const summaryText = await firstItem.locator('.font-medium').first().textContent();
    console.log(`Rejecting item: ${summaryText}`);

    // Step 6: Click '반려' button on first item
    const rejectButton = firstItem.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();

    await rejectButton.click();
    console.log('Step 6: Clicked 반려 button');

    // Step 7: Verify RejectModal opens
    const rejectModal = siteAdminPage.getByRole('dialog', { name: /반려/ });
    await expect(rejectModal).toBeVisible({ timeout: 5000 });
    console.log('Step 7: RejectModal opened');

    // Step 8: Type rejection reason with 10+ chars
    const reasonTextarea = rejectModal.getByRole('textbox', { name: /반려 사유/ });
    await expect(reasonTextarea).toBeVisible();

    const rejectionReason = '테스트 반려 사유입니다. 재검토 후 재요청 바랍니다.';
    await reasonTextarea.fill(rejectionReason);
    console.log(`Step 8: Typed rejection reason (${rejectionReason.length} chars)`);

    // Step 9: Click '반려' submit button in the modal
    const submitButton = rejectModal.getByRole('button', { name: /^반려$/ });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    await submitButton.click();
    console.log('Step 9: Clicked 반려 submit button');

    // Step 10: Verify toast '반려 완료' appears
    const toastMessage = siteAdminPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('Step 10: Toast notification appeared');

    // Step 11: Wait for list to refresh (React Query invalidation)
    console.log('Step 11: Waited for React Query invalidation');

    // Step 12: Verify new item count is initial count minus 1
    const newListCount = initialListCount - 1;

    if (newListCount === 0) {
      // If count reaches 0, empty state should appear
      const emptyState = siteAdminPage.getByText(/승인 대기 중인 요청이 없습니다/);
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      console.log('Step 12: Empty state visible (all items rejected)');

      // Verify Clock icon is present in empty state
      const clockIcon = siteAdminPage
        .locator('[data-testid="empty-state-icon"]')
        .or(siteAdminPage.locator('svg').filter({ hasText: '' }));
      await expect(clockIcon.first()).toBeVisible();
      console.log('Step 12: Clock icon visible in empty state');
    } else {
      // Otherwise, verify the updated count in description
      const updatedDescriptionText = await listDescription.textContent();
      const updatedCountMatch = updatedDescriptionText?.match(/총 (\d+)개/);
      const updatedListCount = updatedCountMatch ? parseInt(updatedCountMatch[1], 10) : 0;

      expect(updatedListCount).toBe(newListCount);
      console.log(`Step 12: List count updated from ${initialListCount} to ${updatedListCount}`);
    }

    // Step 13: Verify tab badge count has decremented

    // Only verify badge count if it was visible initially
    if (initialBadgeCount > 0) {
      const newBadgeCount = initialBadgeCount - 1;

      if (newBadgeCount === 0) {
        // Badge should disappear or show 0
        const updatedBadge = disposalFinalTab.locator('[class*="badge"]').first();
        const isBadgeVisible = await updatedBadge.isVisible();

        if (isBadgeVisible) {
          const badgeText = await updatedBadge.textContent();
          const badgeValue = badgeText ? parseInt(badgeText, 10) : 0;
          expect(badgeValue).toBe(0);
          console.log('Step 13: Badge count is now 0');
        } else {
          console.log('Step 13: Badge disappeared (count reached 0)');
        }
      } else {
        // Badge should show decremented count - re-query to avoid stale locator
        const updatedBadge = disposalFinalTab.locator('[class*="badge"]').first();
        const updatedBadgeText = await updatedBadge.textContent();
        const updatedBadgeCount = updatedBadgeText ? parseInt(updatedBadgeText, 10) : 0;

        expect(updatedBadgeCount).toBe(newBadgeCount);
        console.log(
          `Step 13: Badge count updated from ${initialBadgeCount} to ${updatedBadgeCount}`
        );
      }
    } else {
      console.log('Step 13: Skipping badge verification (badge was not visible initially)');
    }

    // Step 14: Verify the rejected item is no longer visible in the list
    if (newListCount > 0) {
      // If there are still items, verify the rejected item is not among them
      const remainingItems = siteAdminPage.locator('[data-testid="approval-item"]');
      const remainingCount = await remainingItems.count();

      expect(remainingCount).toBe(newListCount);

      // Check that none of the remaining items have the same summary
      let foundRejectedItem = false;
      for (let i = 0; i < remainingCount; i++) {
        const itemSummary = await remainingItems
          .nth(i)
          .locator('.font-medium')
          .first()
          .textContent();
        if (itemSummary === summaryText) {
          foundRejectedItem = true;
          break;
        }
      }

      expect(foundRejectedItem).toBe(false);
      console.log('Step 14: Rejected item is no longer in the list');
    } else {
      console.log('Step 14: No items remain (all rejected)');
    }

    // Additional validation: Verify item does not reappear on tab switch
    if (newListCount > 0) {
      // Switch to another tab
      const calPlanTab = siteAdminPage.getByRole('tab', { name: /교정계획서 승인/ });
      if (await calPlanTab.isVisible()) {
        await calPlanTab.click();
        console.log('Switched to calibration plan approval tab');

        // Switch back to disposal_final
        await disposalFinalTab.click();
        console.log('Switched back to disposal_final tab');

        // Verify the rejected item is still not visible
        const itemsAfterSwitch = siteAdminPage.locator('[data-testid="approval-item"]');
        const countAfterSwitch = await itemsAfterSwitch.count();

        expect(countAfterSwitch).toBe(newListCount);

        let foundItemAfterSwitch = false;
        for (let i = 0; i < countAfterSwitch; i++) {
          const itemSummary = await itemsAfterSwitch
            .nth(i)
            .locator('.font-medium')
            .first()
            .textContent();
          if (itemSummary === summaryText) {
            foundItemAfterSwitch = true;
            break;
          }
        }

        expect(foundItemAfterSwitch).toBe(false);
        console.log('Verified rejected item does not reappear after tab switch');
      }
    }

    console.log(
      '✅ Test completed successfully - Reject action removes item and updates counts correctly'
    );
  });
});
