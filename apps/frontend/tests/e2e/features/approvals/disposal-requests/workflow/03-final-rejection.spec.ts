/**
 * Approvals - Disposal: Final Rejection Workflow
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 3.3 - Final rejection workflow: request -> review approve -> final reject
 *
 * This test verifies the 3-stage disposal approval workflow with final rejection:
 * 1. test_engineer requests disposal
 * 2. technical_manager reviews and approves
 * 3. lab_manager rejects at final approval stage
 * 4. Equipment status reverts to normal
 *
 * Equipment: EQUIP_DISPOSAL_REJ_C3 (Suwon team, final rejection workflow test)
 *
 * IMPORTANT: This test MUST run SEQUENTIALLY as it modifies database state across 4 steps
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToAvailable } from '../helpers/db-cleanup';

// Import SSOT constants from uuid-constants
import { EQUIP_DISPOSAL_REJ_C3 } from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe.serial('Final Rejection Disposal Workflow', () => {
  const equipmentId = EQUIP_DISPOSAL_REJ_C3;

  // Reset equipment to available state before the entire suite
  test.beforeAll(async ({ request }) => {
    // 1. Reset database
    await resetEquipmentToAvailable(equipmentId);
    console.log('✅ Test equipment reset to available state in database');

    // 2. Invalidate backend cache via API
    // This is CRITICAL because direct DB updates bypass cache invalidation
    try {
      const response = await request.post('http://localhost:3001/api/equipment/cache/invalidate');
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

    // 1. Navigate to /equipment/{EQUIP_ID_3}
    await testOperatorPage.goto(`/equipment/${equipmentId}?_=${timestamp}`);

    // 2. Wait for page to load - verify '폐기 요청' button is visible
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(requestButton).toBeVisible({ timeout: 10000 });
    await expect(requestButton).toBeEnabled();
    await requestButton.click();

    // 3. Verify disposal request dialog opens
    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 4. Select '정밀도/정확도 미보장' (inaccurate) as disposal reason
    const inaccurateRadio = testOperatorPage.getByRole('radio', { name: '정밀도/정확도 미보장' });
    await expect(inaccurateRadio).toBeVisible();
    await inaccurateRadio.click();

    // 5. Fill reason detail with 10+ characters
    const reasonTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await expect(reasonTextarea).toBeVisible();
    await reasonTextarea.fill(
      '최종 반려 워크플로우 테스트용입니다. 정확도가 기준 미달하여 폐기합니다.'
    );

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
    let pendingDisposalFound = false;

    while (attempt < maxAttempts && !pendingDisposalFound) {
      attempt++;
      const backoffMs = attempt * 500; // Exponential backoff

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking pending_disposal state...`
      );
      await testOperatorPage.waitForTimeout(backoffMs);

      // Reload with cache-busting to get fresh server-side data
      await testOperatorPage.reload({ waitUntil: 'networkidle' });

      const cacheBustTimestamp = Date.now();
      await testOperatorPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`, {
        waitUntil: 'networkidle',
      });

      // Check if '폐기 진행 중' button appeared
      const pendingStatusButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
      const isPendingVisible = await pendingStatusButton.isVisible().catch(() => false);

      if (isPendingVisible) {
        console.log(`✅ pending_disposal state detected after ${attempt} attempt(s)`);
        pendingDisposalFound = true;
      } else {
        console.log(
          `⚠️ pending_disposal state not yet visible (attempt ${attempt}/${maxAttempts})`
        );

        // Check status badge for debugging
        const statusBadge = testOperatorPage.locator('[role="status"]').first();
        const statusText = await statusBadge.textContent().catch(() => 'not found');
        console.log(`  Status badge shows: "${statusText}"`);
      }
    }

    if (!pendingDisposalFound) {
      throw new Error(
        `Failed to detect pending_disposal state after ${maxAttempts} attempts with exponential backoff`
      );
    }

    // 11. Verify the '폐기 진행 중' dropdown button is visible
    const pendingStatusButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(pendingStatusButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Equipment status updated to pending_disposal');
  });

  test('Step 2 - Approve at review stage as technical_manager', async ({ techManagerPage }) => {
    // Use cache-busting URL parameter
    const timestamp = Date.now();

    // 12. Navigate to /admin/approvals?tab=disposal_review
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // 13. Wait for approval list to load
    const pageHeading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');

    const listHeading = techManagerPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // 14. Find item matching the equipment from Step 1
    const approvalItems = techManagerPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    // Look for the item containing '[Disposal Test C3] 전류계 (최종 반려)' or use first item
    const targetItem = approvalItems
      .filter({
        hasText: '[Disposal Test C3] 전류계 (최종 반려)',
      })
      .first();

    // If the specific item is not found, use the first item
    const itemToApprove = (await targetItem.count()) > 0 ? targetItem : approvalItems.first();

    // 15. Verify item shows status '대기'
    const statusBadge = itemToApprove.getByText('대기');
    await expect(statusBadge).toBeVisible();

    // Get item summary for logging
    const summaryText = await itemToApprove.locator('.font-medium').first().textContent();
    console.log(`Approving disposal request at review stage: ${summaryText}`);

    // Record initial count
    const initialCount = await approvalItems.count();
    console.log(`Initial disposal_review items: ${initialCount}`);

    // 16. Click '검토완료' button
    const approveButton = itemToApprove.getByRole('button', { name: /검토완료/ });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();
    await approveButton.click();

    // 17. Verify toast '승인 완료'
    const toastMessage = techManagerPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('승인 완료');
    console.log('✅ Review approval toast appeared');

    // 18. Verify item disappears from disposal_review list
    const updatedCount = await approvalItems.count();
    console.log(`Updated disposal_review items: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);
    console.log('✅ Item removed from disposal_review list');
  });

  test('Step 3 - Reject at final approval stage as lab_manager', async ({ siteAdminPage }) => {
    // Use cache-busting URL parameter
    const timestamp = Date.now();

    // 19. Navigate to /admin/approvals?tab=disposal_final
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_=${timestamp}`);

    // 20. Wait for approval list to load
    const pageHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });

    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();
    await expect(disposalFinalTab).toHaveAttribute('aria-selected', 'true');

    const listHeading = siteAdminPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 10000 });

    // 21. Find item matching equipment (now with '검토 완료' status)
    const approvalItems = siteAdminPage.locator('[data-testid="approval-item"]');
    await expect(approvalItems.first()).toBeVisible({ timeout: 10000 });

    // Look for the item containing '[Disposal Test C3] 전류계 (최종 반려)' or use first item
    const targetItem = approvalItems
      .filter({
        hasText: '[Disposal Test C3] 전류계 (최종 반려)',
      })
      .first();

    // If the specific item is not found, use the first item
    const itemToReject = (await targetItem.count()) > 0 ? targetItem : approvalItems.first();

    // 22. Verify item shows '검토 완료' status
    const statusBadge = itemToReject.getByText('검토 완료');
    await expect(statusBadge).toBeVisible();

    // Verify ApprovalStepIndicator shows step 2 completed
    const stepIndicator = itemToReject.locator('[data-testid="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Get item summary for logging
    const summaryText = await itemToReject.locator('.font-medium').first().textContent();
    console.log(`Rejecting disposal request at final approval stage: ${summaryText}`);

    // Record initial count
    const initialCount = await approvalItems.count();
    console.log(`Initial disposal_final items: ${initialCount}`);

    // 23. Click '반려' button
    const rejectButton = itemToReject.getByRole('button', { name: /반려/ });
    await expect(rejectButton).toBeVisible();
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();

    // 24. Verify RejectModal opens
    const rejectDialog = siteAdminPage.getByRole('dialog', { name: /반려/ });
    await expect(rejectDialog).toBeVisible({ timeout: 5000 });
    await expect(rejectDialog).toHaveAttribute('aria-modal', 'true');

    const dialogTitle = rejectDialog.getByRole('heading', { name: '반려' });
    await expect(dialogTitle).toBeVisible();
    console.log('✅ RejectModal opened successfully');

    // 25. Type rejection reason (10+ chars)
    const textarea = rejectDialog.locator('#reject-reason');
    await expect(textarea).toBeVisible();
    await textarea.fill(
      '최종 승인 단계에서 반려합니다. 장비를 다시 교정하여 사용 가능한지 확인 후 재요청 바랍니다.'
    );

    // 26. Click '반려' submit button
    const submitButton = rejectDialog.getByRole('button', { name: /반려/ }).last();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 27. Verify toast '반려 완료'
    const toastMessage = siteAdminPage.getByRole('status');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });
    await expect(toastMessage).toContainText('반려 완료');
    console.log('✅ Final rejection toast appeared');

    // 28. Verify item disappears from disposal_final list
    await expect(rejectDialog).not.toBeVisible({ timeout: 5000 });

    const updatedCount = await approvalItems.count();
    console.log(`Updated disposal_final items: ${updatedCount}`);
    expect(updatedCount).toBeLessThan(initialCount);
    console.log('✅ Item removed from disposal_final list');
  });

  test('Step 4 - Verify equipment returns to normal', async ({ testOperatorPage }) => {
    // 29. Wait for backend transaction to commit with exponential backoff retry
    // After final rejection, equipment should revert to normal (available) state
    let attempt = 0;
    const maxAttempts = 5;
    let normalStateFound = false;

    while (attempt < maxAttempts && !normalStateFound) {
      attempt++;
      const backoffMs = attempt * 500; // 500ms, 1s, 1.5s, 2s, 2.5s

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Waiting ${backoffMs}ms before checking normal state...`
      );
      await testOperatorPage.waitForTimeout(backoffMs);

      // Navigate with cache-busting
      const cacheBustTimestamp = Date.now();
      await testOperatorPage.goto(`/equipment/${equipmentId}?_=${cacheBustTimestamp}`, {
        waitUntil: 'networkidle',
      });

      // 30. Check if equipment status reverted to normal
      const disposedButton = testOperatorPage.getByRole('button', { name: /폐기 완료/ });
      const isDisposedVisible = await disposedButton.isVisible().catch(() => false);

      const pendingDisposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
      const isPendingVisible = await pendingDisposalButton.isVisible().catch(() => false);

      if (!isDisposedVisible && !isPendingVisible) {
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
        console.log(`⚠️ Still in disposal/pending state (attempt ${attempt}/${maxAttempts})`);
      }

      // Log current status for debugging
      const currentStatusBadge = testOperatorPage.locator('[role="status"]').first();
      const currentStatus = await currentStatusBadge.textContent().catch(() => 'not found');
      console.log(`  Current status: "${currentStatus}"`);
    }

    if (!normalStateFound) {
      throw new Error(
        `Failed to detect normal state after ${maxAttempts} attempts with exponential backoff`
      );
    }

    // 31. Verify equipment status is NOT 'disposed'
    const disposedButton = testOperatorPage.getByRole('button', { name: /폐기 완료/ });
    await expect(disposedButton).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment is NOT in disposed state');

    // 32. Verify equipment status is NOT 'pending_disposal'
    const pendingDisposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(pendingDisposalButton).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment is no longer in pending_disposal state');

    // 33. Verify equipment shows normal status (e.g., 'available' or '사용 가능')
    const availableStatusBadge = testOperatorPage.getByRole('status', {
      name: /사용 가능|available/i,
    });
    await expect(availableStatusBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ Equipment status badge shows normal state');

    // 34. Verify '폐기 요청' button is visible again
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(requestButton).toBeVisible({ timeout: 10000 });
    await expect(requestButton).toBeEnabled();
    console.log('✅ Disposal request button is visible and enabled');

    console.log('✅ Final rejection workflow test passed successfully!');
    console.log(
      'Equipment successfully reverted to normal state after final rejection by lab_manager.'
    );
  });
});
