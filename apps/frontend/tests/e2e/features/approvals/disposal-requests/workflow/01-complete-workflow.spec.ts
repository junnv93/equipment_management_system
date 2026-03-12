/**
 * Approvals - Disposal: Complete Integrated Workflow
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 3.1 - Complete workflow: request -> review approve -> final approve
 *
 * This test verifies the complete 3-stage disposal approval workflow:
 * 1. test_engineer requests disposal
 * 2. technical_manager reviews and approves
 * 3. lab_manager gives final approval
 * 4. Equipment status changes to 'disposed'
 *
 * Equipment: EQUIP_DISPOSAL_WORKFLOW (Suwon team, sequential workflow test)
 *
 * IMPORTANT: This test MUST run SEQUENTIALLY as it modifies database state across 4 steps
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
import { resetEquipmentToAvailable } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import { EQUIP_DISPOSAL_WORKFLOW } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe.serial('Complete Disposal Workflow', () => {
  const equipmentId = EQUIP_DISPOSAL_WORKFLOW;

  // Reset equipment to available state before the entire suite
  test.beforeAll(async ({ request }) => {
    // 1. Reset database
    await resetEquipmentToAvailable(equipmentId);
    console.log('✅ Test equipment reset to available state in database');

    // 2. Invalidate backend cache via API
    // This is CRITICAL because direct DB updates bypass cache invalidation
    try {
      const response = await request.post(`${BASE_URLS.BACKEND}/api/equipment/cache/invalidate`, {
        headers: { 'X-Internal-Api-Key': process.env.INTERNAL_API_KEY ?? 'dev-internal-key' },
      });
      if (response.ok()) {
        console.log('✅ Backend cache invalidated via API');
      } else {
        console.warn(`⚠️  Cache invalidation returned status ${response.status()}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to invalidate cache: ${error}`);
    }
  });

  // Cleanup database connection pool after all tests

  test('Step 1 - Request disposal as test_engineer', async ({ testOperatorPage }) => {
    // Use cache-busting URL parameter to avoid stale data
    const timestamp = Date.now();

    // 1. Navigate to /equipment/{EQUIP_ID}
    await testOperatorPage.goto(`/equipment/${equipmentId}?_=${timestamp}`);

    // 2. Wait for page to load - verify '폐기 요청' button is visible
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(requestButton).toBeVisible({ timeout: 10000 });
    await expect(requestButton).toBeEnabled();
    await requestButton.click();

    // 3. Verify disposal request dialog opens
    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 4. Select '노후화' (obsolete) as disposal reason
    const obsoleteRadio = testOperatorPage.getByRole('radio', { name: '노후화' });
    await expect(obsoleteRadio).toBeVisible();
    await obsoleteRadio.click();

    // 5. Fill reason detail with 10+ characters
    const reasonTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await expect(reasonTextarea).toBeVisible();
    await reasonTextarea.fill('통합 워크플로우 테스트용 폐기 요청입니다. 노후화 교체 필요.');

    // 6. Set up response listener BEFORE clicking submit
    const responsePromise = testOperatorPage.waitForResponse(
      (response) =>
        response.url().includes(`/api/equipment/${equipmentId}/disposal/request`) &&
        response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // 7. Click '폐기 요청' submit button
    const submitButton = testOperatorPage
      .getByRole('button', { name: '폐기 요청', exact: true })
      .last();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 8. Wait for the API response to ensure backend transaction completed
    const response = await responsePromise;
    const status = response.status();
    console.log(`API response status: ${status}`);

    if (status !== 201) {
      const responseBody = await response.text();
      console.error(`Disposal request failed with status ${status}: ${responseBody}`);
      throw new Error(`Disposal request API failed with status ${status}`);
    }

    // 9. Verify dialog closes (API success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Disposal request dialog closed successfully');

    // 10. Wait for backend transaction to commit and propagate
    // The disposal service uses a transaction, so we need to ensure it's fully committed
    // Use exponential backoff: 500ms, 1s, 1.5s, 2s, 2.5s
    let attempt = 0;
    const maxAttempts = 5;
    let disposalButtonFound = false;

    while (attempt < maxAttempts && !disposalButtonFound) {
      attempt++;
      const backoffMs = attempt * 500; // Exponential backoff

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking equipment state...`
      );
      await testOperatorPage.waitForTimeout(backoffMs);

      // Reload with cache-busting to get fresh server-side data
      await testOperatorPage.reload({ waitUntil: 'networkidle' });

      const cacheBustTimestamp = Date.now();
      await testOperatorPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`, {
        waitUntil: 'networkidle',
      });

      // Check if disposal status appeared
      const disposalButtons = testOperatorPage.locator('button:has-text("폐기")');
      const disposalButtonCount = await disposalButtons.count();

      if (disposalButtonCount > 0) {
        console.log(`✅ Found ${disposalButtonCount} disposal buttons after ${attempt} attempt(s)`);
        disposalButtonFound = true;

        // Log button texts for debugging
        for (let i = 0; i < Math.min(disposalButtonCount, 3); i++) {
          const buttonText = await disposalButtons.nth(i).textContent();
          console.log(`  [${i}] Button text: "${buttonText}"`);
        }
      } else {
        console.log(`⚠️ No disposal buttons found yet (attempt ${attempt}/${maxAttempts})`);

        // Check status badge for debugging
        const statusBadge = testOperatorPage.locator('[role="status"]').first();
        const statusText = await statusBadge.textContent().catch(() => 'not found');
        console.log(`  Status badge shows: "${statusText}"`);
      }
    }

    if (!disposalButtonFound) {
      throw new Error(
        `Failed to detect disposal status after ${maxAttempts} attempts with exponential backoff`
      );
    }

    // 12. Verify the '폐기 진행 중' dropdown button is visible
    const pendingStatusButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(pendingStatusButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Equipment status updated to pending_disposal');
  });

  test('Step 2 - Review as technical_manager', async ({ techManagerPage }) => {
    // Use cache-busting URL parameter
    const timestamp = Date.now();

    // 9. Navigate to /admin/approvals?tab=disposal_review
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // 10. Wait for approval list to load
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // 11. Find item matching the equipment from Step 1
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    // Look for the item containing 'Workflow Test Equipment' or use first item
    const targetItem = approvalItems.first();

    // 12. Verify item shows status '대기' and step 1 completed
    const statusBadge = targetItem.getByText('대기');
    await expect(statusBadge).toBeVisible();

    const stepIndicator = targetItem.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Verify requester info is displayed
    await expect(targetItem.getByText('요청자')).toBeVisible();
    await expect(targetItem.getByText('팀')).toBeVisible();
    await expect(targetItem.getByText('요청일시')).toBeVisible();

    // Get item summary for logging
    const summaryText = await targetItem.locator('.font-medium').first().textContent();
    console.log(`Reviewing disposal request: ${summaryText}`);

    // Record initial count
    const initialCount = await approvalItems.count();
    console.log(`Initial disposal_review items: ${initialCount}`);

    // 13. Click '검토완료' button
    const approveButton = targetItem.getByRole('button', { name: /검토완료/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();
    await approveButton.click();

    // 14. Verify toast '승인 완료'
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Review approval toast appeared');

    // 15. Verify item disappears from disposal_review list
    const updatedCount = await approvalItems.count();
    console.log(`Updated disposal_review items: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);
    console.log('✅ Item removed from disposal_review list');
  });

  test('Step 3 - Final approve as lab_manager', async ({ siteAdminPage }) => {
    // Use cache-busting URL parameter
    const timestamp = Date.now();

    // 16. Navigate to /admin/approvals?tab=disposal_final
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_=${timestamp}`);

    // 17. Wait for approval list to load
    const pageHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();
    await expect(disposalFinalTab).toHaveAttribute('aria-selected', 'true');

    const listHeading = siteAdminPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // 18. Find item matching equipment (now with '검토 완료' status)
    const approvalItems = siteAdminPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    const targetItem = approvalItems.first();

    // 19. Verify item shows '검토 완료' status
    const statusBadge = targetItem.getByText('검토 완료');
    await expect(statusBadge).toBeVisible();

    // 20. Verify ApprovalStepIndicator shows step 2 completed
    const stepIndicator = targetItem.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Verify requester info is displayed
    await expect(targetItem.getByText('요청자')).toBeVisible();
    await expect(targetItem.getByText('팀')).toBeVisible();
    await expect(targetItem.getByText('요청일시')).toBeVisible();

    // Get item summary for logging
    const summaryText = await targetItem.locator('.font-medium').first().textContent();
    console.log(`Final approving disposal request: ${summaryText}`);

    // Record initial count
    const initialCount = await approvalItems.count();
    console.log(`Initial disposal_final items: ${initialCount}`);

    // 21. Click '승인' button
    const approveButton = targetItem.getByRole('button', { name: /^승인$/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();
    await approveButton.click();

    // 22. Verify toast '승인 완료'
    const toastMessage = siteAdminPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Final approval toast appeared');

    // 23. Verify item disappears from disposal_final list
    const updatedCount = await approvalItems.count();
    console.log(`Updated disposal_final items: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);
    console.log('✅ Item removed from disposal_final list');
  });

  test('Step 4 - Verify final state', async ({ siteAdminPage }) => {
    // 24. Wait for backend transaction to commit with exponential backoff retry
    // After final approval, backend needs time to commit the transaction
    let attempt = 0;
    const maxAttempts = 5;
    let disposedStateFound = false;

    while (attempt < maxAttempts && !disposedStateFound) {
      attempt++;
      const backoffMs = attempt * 500; // 500ms, 1s, 1.5s, 2s, 2.5s

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking disposed state...`
      );
      await siteAdminPage.waitForTimeout(backoffMs);

      // Navigate with cache-busting
      const cacheBustTimestamp = Date.now();
      await siteAdminPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`, {
        waitUntil: 'networkidle',
      });

      // 25. Check if equipment status shows '폐기' (disposed)
      const disposedBadge = siteAdminPage.getByRole('status', { name: /폐기/ });
      const isDisposedBadgeVisible = await disposedBadge.isVisible().catch(() => false);

      if (isDisposedBadgeVisible) {
        console.log(`✅ Disposed state detected after ${attempt} attempt(s)`);
        disposedStateFound = true;
      } else {
        console.log(`⚠️ Disposed state not yet visible (attempt ${attempt}/${maxAttempts})`);

        // Log current status for debugging
        const currentStatusBadge = siteAdminPage.locator('[role="status"]').first();
        const currentStatus = await currentStatusBadge.textContent().catch(() => 'not found');
        console.log(`  Current status: "${currentStatus}"`);
      }
    }

    if (!disposedStateFound) {
      throw new Error(
        `Failed to detect disposed state after ${maxAttempts} attempts with exponential backoff`
      );
    }

    // 26. Verify equipment status shows '폐기' (disposed)
    const disposedBadge = siteAdminPage.getByRole('status', { name: /폐기/ });
    await expect(disposedBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment status badge shows disposed state');

    // 27. Verify '폐기 완료' button is visible and disabled
    const disposedButton = siteAdminPage.getByRole('button', { name: /폐기 완료/ });
    await expect(disposedButton).toBeVisible({ timeout: 10000 });
    await expect(disposedButton).toBeDisabled();
    console.log('✅ Disposed button is visible and disabled');

    // 28. Verify DisposedBanner is visible
    const disposedBanner = siteAdminPage.getByText(/장비 폐기 완료/i);
    await expect(disposedBanner).toBeVisible({ timeout: 5000 });
    console.log('✅ Disposal completion banner is visible');

    console.log('✅ Complete disposal workflow test passed successfully!');
  });
});
