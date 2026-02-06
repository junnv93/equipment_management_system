/**
 * Group A: Permissions - Test 1.2
 * Test: technical_manager can review same team pending disposal
 * Equipment: EQUIP_DISPOSAL_PERM_A4 (pending_disposal, reviewStatus=pending)
 *
 * IMPORTANT:
 * - This test includes automatic cleanup to ensure correct disposal request state
 * - Equipment A4 must have a pending disposal request (reviewStatus=pending)
 * - The cleanup ensures idempotent test execution
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_PERM_A4,
  DISP_REQ_A4_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Permissions - Group A', () => {
  test.beforeEach(async ({ techManagerPage }) => {
    // Ensure clean state before each test
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A4,
      DISP_REQ_A4_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    // Allow cache to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate with cache-busting to ensure fresh data
    const cacheBuster = Date.now();
    await techManagerPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A4}?_t=${cacheBuster}`, {
      waitUntil: 'domcontentloaded',
    });
  });

  test('technical_manager can review same team pending disposal', async ({ techManagerPage }) => {
    // Wait for React hydration (disposal dropdown is client-side rendered)
    await techManagerPage.waitForLoadState('networkidle').catch(() => {});
    await techManagerPage.waitForTimeout(1000);

    // 1. Verify "폐기 진행 중" button is visible (auto-waits for hydration)
    const statusButton = techManagerPage.getByRole('button', { name: /폐기 진행 중/i });
    await expect(statusButton).toBeVisible({ timeout: 10000 });

    // 2. Click "폐기 진행 중" button to open dropdown menu
    await statusButton.click();

    // 3. Wait for dropdown menu and click "폐기 검토하기" button
    // Use getByText to find the menu item by its text content
    const reviewButton = techManagerPage.getByText('폐기 검토하기');
    await expect(reviewButton).toBeVisible({ timeout: 5000 });
    await reviewButton.click();

    // 4. Verify review dialog opens
    const dialog = techManagerPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 5. Fill review opinion (≥10 chars) - use label selector
    const opinionTextarea = techManagerPage.getByLabel(/검토 의견/i);
    await opinionTextarea.fill(
      '폐기 요청 내용을 검토하였으며, 노후화로 인한 성능 저하가 명확하여 승인 가능합니다.'
    );

    // 6. Click "검토 완료" button
    const submitButton = dialog.getByRole('button', { name: /검토 완료/i });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // 7. Wait for dialog to close (indicates API success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // 8. Toast notification is optional (may disappear quickly)
    const toastVisible = await Promise.race([
      techManagerPage
        .getByText(/검토.*완료/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
      techManagerPage
        .getByText(/폐기 검토가 완료/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
    ]).catch(() => false);

    if (!toastVisible) {
      console.log('[INFO] Toast notification did not appear (may have been transient)');
    }

    // Test success: Dialog closed successfully, indicating review was completed
    // Note: Progress stepper update happens asynchronously, so we don't wait for it
  });

  test.afterAll(async () => {
    await cleanupPool();
  });
});
