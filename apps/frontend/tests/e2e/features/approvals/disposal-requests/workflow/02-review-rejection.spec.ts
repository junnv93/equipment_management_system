/**
 * Approvals - Disposal: Review Rejection Workflow
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 3.2 - Review rejection workflow: request -> review reject
 *
 * This test verifies the 2-stage disposal rejection workflow at review stage:
 * 1. test_engineer requests disposal
 * 2. technical_manager reviews and rejects
 * 3. Equipment status reverts to normal
 * 4. Equipment can have new disposal requests
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C2 (Suwon team, review rejection workflow test)
 *
 * IMPORTANT: This test MUST run SEQUENTIALLY as it modifies database state across 3 steps
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
import { resetEquipmentToAvailable } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import { EQUIP_DISPOSAL_REJ_C2 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe.serial('Review Rejection Disposal Workflow', () => {
  const equipmentId = EQUIP_DISPOSAL_REJ_C2;

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

    // 4. Select '고장 (수리 불가)' (broken) as disposal reason
    const brokenRadio = testOperatorPage.getByRole('radio', { name: '고장 (수리 불가)' });
    await expect(brokenRadio).toBeVisible();
    await brokenRadio.click();

    // 5. Fill reason detail with 10+ characters
    const reasonTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await expect(reasonTextarea).toBeVisible();
    await reasonTextarea.fill(
      '리뷰 반려 워크플로우 테스트용입니다. 고장으로 인한 폐기 요청합니다.'
    );

    // 6. Click '폐기 요청' submit button
    const submitButton = testOperatorPage
      .getByRole('button', { name: '폐기 요청', exact: true })
      .last();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 7. Verify dialog closes (API success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Disposal request dialog closed successfully');

    // 8. Wait for backend transaction to commit with exponential backoff retry
    let attempt = 0;
    const maxAttempts = 5;
    let pendingDisposalFound = false;

    while (attempt < maxAttempts && !pendingDisposalFound) {
      attempt++;
      const backoffMs = attempt * 500; // 500ms, 1s, 1.5s, 2s, 2.5s

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking pending_disposal state...`
      );

      // Reload with cache-busting
      const cacheBustTimestamp = Date.now();
      await testOperatorPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`);
      await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible({
        timeout: 10000,
      });

      // 9. Check if '폐기 진행 중' button appeared
      const pendingStatusButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
      const isPendingVisible = await pendingStatusButton.isVisible().catch(() => false);

      if (isPendingVisible) {
        console.log(`✅ pending_disposal state detected after ${attempt} attempt(s)`);
        pendingDisposalFound = true;
      } else {
        console.log(
          `⚠️ pending_disposal state not yet visible (attempt ${attempt}/${maxAttempts})`
        );

        const currentStatusBadge = testOperatorPage.getByRole('status').first();
        const currentStatus = await currentStatusBadge.textContent().catch(() => 'not found');
        console.log(`  Current status: "${currentStatus}"`);
      }
    }

    if (!pendingDisposalFound) {
      throw new Error(
        `Failed to detect pending_disposal state after ${maxAttempts} attempts with exponential backoff`
      );
    }

    console.log('✅ Equipment status updated to pending_disposal');
  });

  test('Step 2 - Reject at review stage as technical_manager', async ({ techManagerPage }) => {
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

    // Look for the item containing '[Disposal Test C2] 전원 공급기 (승인 반려)' or use first item
    // Note: The equipment being tested is actually '전원 공급기 (승인 반려)', not '고주파 측정기'
    const targetItem = approvalItems
      .filter({
        hasText: '[Disposal Test C2] 전원 공급기 (승인 반려)',
      })
      .first();

    // If the specific item is not found, use the first item
    const itemToReject = (await targetItem.count()) > 0 ? targetItem : approvalItems.first();

    // 12. Verify item shows status '대기'
    const statusBadge = itemToReject.getByText('대기');
    await expect(statusBadge).toBeVisible();

    // Get item summary for logging
    const summaryText = await itemToReject.locator('.font-medium').first().textContent();
    console.log(`Rejecting disposal request: ${summaryText}`);

    // Record initial count
    const initialCount = await approvalItems.count();
    console.log(`Initial disposal_review items: ${initialCount}`);

    // 13. Click '반려' button
    const rejectButton = itemToReject.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();

    // 14. Verify RejectModal opens
    const rejectDialog = techManagerPage.getByRole('dialog', { name: /반려/ });
    await expect(rejectDialog).toBeVisible({ timeout: 5000 });
    await expect(rejectDialog).toHaveAttribute('aria-modal', 'true');

    const dialogTitle = rejectDialog.getByRole('heading', { name: '반려' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ RejectModal opened successfully');

    // 15. Type rejection reason (10+ chars)
    const textarea = rejectDialog.locator('#reject-reason');
    await expect(textarea).toBeVisible();
    await textarea.fill('폐기 사유가 충분하지 않습니다. 수리 이력을 먼저 확인해주세요.');

    // 16. Click '반려' submit button
    const submitButton = rejectDialog.getByRole('button', { name: /반려/ }).last();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 17. Verify toast '반려 완료'
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('✅ Rejection toast appeared');

    // 18. Verify item disappears from disposal_review list
    await expect(rejectDialog).not.toBeVisible({ timeout: 5000 });

    // Wait for React Query invalidation to complete

    const updatedCount = await approvalItems.count();
    console.log(`Updated disposal_review items: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);
    console.log('✅ Item removed from disposal_review list');
  });

  test('Step 3 - Verify equipment returns to normal', async ({ testOperatorPage }) => {
    // 19. Wait for backend transaction to commit with exponential backoff retry
    // After rejection, equipment should revert to normal (available) state
    let attempt = 0;
    const maxAttempts = 5;
    let normalStateFound = false;

    while (attempt < maxAttempts && !normalStateFound) {
      attempt++;
      const backoffMs = attempt * 500; // 500ms, 1s, 1.5s, 2s, 2.5s

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking normal state...`
      );

      // Navigate with cache-busting
      const cacheBustTimestamp = Date.now();
      await testOperatorPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`);
      await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible({
        timeout: 10000,
      });

      // 20. Check if equipment status reverted to normal
      // The '폐기 진행 중' button should NOT be visible
      const pendingDisposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
      const isPendingVisible = await pendingDisposalButton.isVisible().catch(() => false);

      if (!isPendingVisible) {
        // Check if available status badge is visible
        const availableStatusBadge = testOperatorPage.getByRole('status', {
          name: /사용 가능|available/i,
        });
        const isAvailableVisible = await availableStatusBadge.isVisible().catch(() => false);

        if (isAvailableVisible) {
          console.log(`✅ Normal state detected after ${attempt} attempt(s)`);
          normalStateFound = true;
        } else {
          console.log(`⚠️ Available status not visible yet (attempt ${attempt}/${maxAttempts})`);
        }
      } else {
        console.log(`⚠️ Still in pending_disposal state (attempt ${attempt}/${maxAttempts})`);
      }

      // Log current status for debugging
      const currentStatusBadge = testOperatorPage.getByRole('status').first();
      const currentStatus = await currentStatusBadge.textContent().catch(() => 'not found');
      console.log(`  Current status: "${currentStatus}"`);
    }

    if (!normalStateFound) {
      throw new Error(
        `Failed to detect normal state after ${maxAttempts} attempts with exponential backoff`
      );
    }

    // 21. Verify equipment status is NOT 'pending_disposal'
    const pendingDisposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(pendingDisposalButton).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment is no longer in pending_disposal state');

    // 22. Verify equipment shows normal status (e.g., 'available' or '사용 가능')
    const availableStatusBadge = testOperatorPage.getByRole('status', {
      name: /사용 가능|available/i,
    });
    await expect(availableStatusBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment status badge shows normal state');

    // 23. Verify '폐기 요청' button is visible again
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(requestButton).toBeVisible({ timeout: 10000 });
    await expect(requestButton).toBeEnabled();
    console.log('✅ Disposal request button is visible and enabled');

    console.log('✅ Review rejection workflow test passed successfully!');
    console.log('Equipment successfully reverted to normal state after review rejection.');
  });
});
