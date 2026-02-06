/**
 * Checkout Return Processing E2E Tests
 * Group D2: Return Processing
 *
 * Tests checkout return workflows with inspection requirements and equipment status restoration
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data source
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_012_ID,
  CHECKOUT_019_ID,
  CHECKOUT_020_ID,
  CHECKOUT_042_ID,
  CHECKOUT_059_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe('Group D2: Return Processing', () => {
  /**
   * D-4: Return checkout with mandatory inspections
   * Priority: P0 - CRITICAL
   *
   * Verifies that returning a calibration checkout requires mandatory inspection checks:
   * - calibrationChecked (required for calibration purpose)
   * - workingStatusChecked (always required)
   *
   * TODO: Implement checkout return functionality
   * - Return form with inspection checkboxes
   * - Validation that calibrationChecked is required for calibration checkouts
   * - Validation that workingStatusChecked is always required
   */
  test.fixme('D-4: Return checkout with mandatory inspections', async ({ techManagerPage }) => {
    // 1. Navigate to checked_out calibration checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_019_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify status is 'checked_out'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

    // 2. Click "반입 신청" button
    const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
    await expect(returnButton).toBeVisible();
    await returnButton.click();

    // Wait for return form dialog
    await techManagerPage.waitForTimeout(500);

    // 3. Fill inspection form
    // Check "교정 상태 확인" (calibrationChecked - REQUIRED for calibration)
    const calibrationCheck = techManagerPage.getByLabel(/교정 상태 확인|교정.*확인/);
    await calibrationCheck.check();

    // Check "작동 상태 확인" (workingStatusChecked - ALWAYS REQUIRED)
    const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
    await workingStatusCheck.check();

    // 4. Submit return request
    const submitButton = techManagerPage.getByRole('button', { name: '확인' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 5. Verify status changes to 'returned'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

    // Verify old status is gone
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).not.toBeVisible();

    // 6. Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /반입|완료/ })
    ).toBeVisible();
  });

  /**
   * D-8: Approve return → restore equipment to 'available'
   * Priority: P0 - CRITICAL
   *
   * Verifies that approving a return restores equipment status to 'available'
   * This completes the checkout lifecycle: available → checked_out → available
   *
   * TODO: Implement return approval functionality
   * - Return approval button for technical_manager/lab_manager
   * - Equipment status restoration to 'available'
   * - Checkout status transition to 'return_approved'
   */
  test.fixme(
    'D-8: Approve return → restore equipment to available',
    async ({ techManagerPage }) => {
      // 1. Navigate to returned checkout
      await techManagerPage.goto(`/checkouts/${CHECKOUT_042_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // Verify status is 'returned'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

      // 2. Click "반입 승인" button
      const approveReturnButton = techManagerPage.getByRole('button', { name: '반입 승인' });
      await expect(approveReturnButton).toBeVisible();
      await approveReturnButton.click();

      // 3. Confirm in dialog
      const confirmButton = techManagerPage.getByRole('button', { name: '확인' });
      await confirmButton.click();

      await techManagerPage.waitForLoadState('networkidle');

      // 4. Verify checkout status changes to 'return_approved'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.return_approved)).toBeVisible();

      // Verify old status is gone
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).not.toBeVisible();

      // 5. Verify equipment status changes to 'available' via API
      // Get equipment ID from checkout data
      const response = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_042_ID}`);
      const checkoutData = await response.json();
      const equipmentId = checkoutData.equipment[0].id;

      // Verify equipment status
      const equipmentResponse = await techManagerPage.request.get(`/api/equipment/${equipmentId}`);
      const equipmentData = await equipmentResponse.json();
      expect(equipmentData.status).toBe('available');

      // 6. Verify success message
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /승인|완료/ })
      ).toBeVisible();
    }
  );

  /**
   * D-10: Return with notes
   * Priority: P2
   *
   * Verifies that return notes can be added during the return process
   * Notes should be displayed on the checkout detail page
   *
   * TODO: Implement return notes functionality
   * - Return form with optional notes field
   * - Display notes on checkout detail page
   */
  test.fixme('D-10: Return with notes', async ({ techManagerPage }) => {
    // 1. Navigate to checked_out repair checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_020_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify status is 'checked_out'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

    // 2. Click "반입 신청" button
    const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
    await returnButton.click();

    await techManagerPage.waitForTimeout(500);

    // 3. Fill mandatory inspections
    // For repair checkout: repairChecked + workingStatusChecked
    const repairCheck = techManagerPage.getByLabel(/수리 상태 확인|수리.*확인/);
    await repairCheck.check();

    const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
    await workingStatusCheck.check();

    // 4. Fill notes field
    const notesField = techManagerPage
      .getByLabel(/반입 비고|비고|메모/)
      .or(techManagerPage.locator('textarea[name="notes"]'));
    await notesField.fill('외관에 긁힘 있음');

    // 5. Submit
    const submitButton = techManagerPage.getByRole('button', { name: '확인' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 6. Verify status changes to 'returned'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

    // 7. Verify notes are displayed on detail page
    await expect(techManagerPage.getByText('외관에 긁힘 있음')).toBeVisible();

    // Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /반입|완료/ })
    ).toBeVisible();
  });

  /**
   * D-11: Overdue checkout warning
   * Priority: P1
   *
   * Verifies that overdue checkouts display a warning badge
   * and can still be returned normally
   *
   * TODO: Implement overdue checkout UI indicators
   * - Display "연체" or "기한 초과" badge
   * - Highlight overdue status with warning color
   * - Allow normal return workflow for overdue checkouts
   */
  test.fixme('D-11: Overdue checkout warning', async ({ techManagerPage }) => {
    // 1. Navigate to overdue checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_059_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 2. Verify "연체" or "기한 초과" warning badge is visible
    const overdueWarning = techManagerPage.getByText(/연체|기한 초과|overdue/i);
    await expect(overdueWarning).toBeVisible();

    // 3. Verify overdue status is highlighted (check for warning/error styling)
    // Look for red/warning color or specific styling class
    const statusBadge = techManagerPage
      .locator('[class*="badge"]')
      .filter({ hasText: /연체|기한/ });
    await expect(statusBadge).toHaveClass(/red|warning|error|destructive/);

    // 4. Verify checkout can still be returned normally
    const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
    await expect(returnButton).toBeVisible();
    await expect(returnButton).toBeEnabled();
  });

  /**
   * D-12: Cannot return before checkout
   * Priority: P1
   *
   * Verifies that checkouts in 'approved' status cannot be returned
   * Must be checked out first before return is possible
   *
   * Workflow order enforcement: approved → checked_out → returned
   */
  test.fixme('D-12: Cannot return before checkout', async ({ techManagerPage }) => {
    // 1. Navigate to approved (not yet checked_out) checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_012_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 2. Verify status is 'approved'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    // 3. Verify "반입 신청" button is NOT visible
    const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
    await expect(returnButton).not.toBeVisible();

    // 4. Verify only "반출 시작" button is visible
    const checkoutButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    await expect(checkoutButton).toBeVisible();

    // Verify no return-related UI elements
    await expect(techManagerPage.getByText(/반입 승인|반입 완료/)).not.toBeVisible();
  });
});
