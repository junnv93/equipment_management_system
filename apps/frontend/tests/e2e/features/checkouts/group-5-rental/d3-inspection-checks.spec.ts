/**
 * Checkout Inspection Checks E2E Tests
 * Group D3: Inspection Checks
 *
 * Tests mandatory inspection validation during checkout return process
 *
 * Critical Business Rules (UL-QP-18):
 * - Calibration checkouts: calibrationChecked + workingStatusChecked required
 * - Repair checkouts: repairChecked + workingStatusChecked required
 * - All checkouts: workingStatusChecked ALWAYS required
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data source
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_021_ID,
  CHECKOUT_022_ID,
  CHECKOUT_023_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe('Group D3: Inspection Checks', () => {
  /**
   * D-5: Calibration inspection check (calibrationChecked required)
   * Priority: P0 - CRITICAL
   *
   * Verifies that calibration checkouts MUST have calibrationChecked = true
   * during return process. Submit should fail without this check.
   *
   * Business Rule: Calibration checkouts require verification that
   * calibration was performed and equipment is in calibrated state.
   *
   * TODO: Implement return form validation for calibration checkouts
   * - Show calibrationChecked checkbox for calibration purpose
   * - Validate that checkbox is checked before submit
   * - Display error message if validation fails
   */
  test.fixme(
    'D-5: Calibration inspection check (calibrationChecked required)',
    async ({ techManagerPage }) => {
      // 1. Navigate to checked_out calibration checkout
      await techManagerPage.goto(`/checkouts/${CHECKOUT_021_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // Verify it's a calibration checkout
      await expect(techManagerPage.getByText(/교정|calibration/i)).toBeVisible();

      // Verify status is 'checked_out'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 2. Click "반입 신청" button
      const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
      await returnButton.click();

      await techManagerPage.waitForTimeout(500);

      // 3. Try to submit WITHOUT checking calibrationChecked
      // Only check workingStatusChecked
      const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
      await workingStatusCheck.check();

      // Do NOT check calibrationChecked
      const calibrationCheck = techManagerPage.getByLabel(/교정 상태 확인|교정.*확인/);
      await expect(calibrationCheck).toBeVisible(); // Field exists
      // Leave it unchecked

      // Try to submit
      const submitButton = techManagerPage.getByRole('button', { name: '확인' });
      await submitButton.click();

      // 4. Verify error message appears
      await expect(
        techManagerPage.getByRole('alert').filter({ hasText: /교정.*확인|필수|required/i })
      ).toBeVisible();

      // 5. Verify status has NOT changed (still checked_out)
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 6. Now check calibrationChecked and verify it succeeds
      await calibrationCheck.check();
      await submitButton.click();

      await techManagerPage.waitForLoadState('networkidle');

      // Verify status changed to 'returned'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

      // Verify success message
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /반입|완료/ })
      ).toBeVisible();
    }
  );

  /**
   * D-6: Repair inspection check (repairChecked required)
   * Priority: P0 - CRITICAL
   *
   * Verifies that repair checkouts MUST have repairChecked = true
   * during return process. Submit should fail without this check.
   *
   * Business Rule: Repair checkouts require verification that
   * repair was completed and equipment is in working condition.
   *
   * TODO: Implement return form validation for repair checkouts
   * - Show repairChecked checkbox for repair purpose
   * - Validate that checkbox is checked before submit
   * - Display error message if validation fails
   */
  test.fixme(
    'D-6: Repair inspection check (repairChecked required)',
    async ({ techManagerPage }) => {
      // 1. Navigate to checked_out repair checkout
      await techManagerPage.goto(`/checkouts/${CHECKOUT_022_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // Verify it's a repair checkout
      await expect(techManagerPage.getByText(/수리|repair/i)).toBeVisible();

      // Verify status is 'checked_out'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 2. Click "반입 신청" button
      const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
      await returnButton.click();

      await techManagerPage.waitForTimeout(500);

      // 3. Try to submit WITHOUT checking repairChecked
      // Only check workingStatusChecked
      const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
      await workingStatusCheck.check();

      // Do NOT check repairChecked
      const repairCheck = techManagerPage.getByLabel(/수리 상태 확인|수리.*확인/);
      await expect(repairCheck).toBeVisible(); // Field exists
      // Leave it unchecked

      // Try to submit
      const submitButton = techManagerPage.getByRole('button', { name: '확인' });
      await submitButton.click();

      // 4. Verify error message appears
      await expect(
        techManagerPage.getByRole('alert').filter({ hasText: /수리.*확인|필수|required/i })
      ).toBeVisible();

      // 5. Verify status has NOT changed (still checked_out)
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 6. Now check repairChecked and verify it succeeds
      await repairCheck.check();
      await submitButton.click();

      await techManagerPage.waitForLoadState('networkidle');

      // Verify status changed to 'returned'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

      // Verify success message
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /반입|완료/ })
      ).toBeVisible();
    }
  );

  /**
   * D-7: Working status check (workingStatusChecked always required)
   * Priority: P0 - CRITICAL
   *
   * Verifies that workingStatusChecked is ALWAYS required for ALL checkouts,
   * regardless of purpose (calibration, repair, or rental).
   *
   * Business Rule: All equipment returning from checkout MUST be verified
   * to be in working condition before return approval.
   *
   * TODO: Implement return form validation for workingStatusChecked
   * - Show workingStatusChecked checkbox for ALL checkout purposes
   * - Validate that checkbox is ALWAYS checked before submit
   * - Display error message if validation fails
   */
  test.fixme(
    'D-7: Working status check (workingStatusChecked always required)',
    async ({ techManagerPage }) => {
      // 1. Navigate to checked_out calibration checkout
      await techManagerPage.goto(`/checkouts/${CHECKOUT_023_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // Verify status is 'checked_out'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 2. Click "반입 신청" button
      const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
      await returnButton.click();

      await techManagerPage.waitForTimeout(500);

      // 3. Try to submit WITHOUT checking workingStatusChecked
      // For calibration checkout, only check calibrationChecked (not workingStatus)
      const calibrationCheck = techManagerPage.getByLabel(/교정 상태 확인|교정.*확인/);
      await calibrationCheck.check();

      // Do NOT check workingStatusChecked
      const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
      await expect(workingStatusCheck).toBeVisible(); // Field exists
      // Leave it unchecked

      // Try to submit
      const submitButton = techManagerPage.getByRole('button', { name: '확인' });
      await submitButton.click();

      // 4. Verify error message appears emphasizing workingStatusChecked is required
      await expect(
        techManagerPage
          .getByRole('alert')
          .filter({ hasText: /작동 상태.*확인|작동.*필수|working.*required/i })
      ).toBeVisible();

      // 5. Verify status has NOT changed (still checked_out)
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

      // 6. Now check workingStatusChecked and verify it succeeds
      await workingStatusCheck.check();
      await submitButton.click();

      await techManagerPage.waitForLoadState('networkidle');

      // Verify status changed to 'returned'
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

      // Verify success message
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /반입|완료/ })
      ).toBeVisible();
    }
  );
});
