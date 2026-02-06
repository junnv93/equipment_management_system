/**
 * Rental 4-Step: Lender Pre-Checkout Check E2E Tests
 * Group E1: Lender Pre-Checkout
 *
 * Tests the first step of the rental 4-step verification process:
 * Step 1: Lender pre-checkout check (approved → lender_checked)
 *
 * Business Rules (UL-QP-18):
 * - Only lender team's technical_manager can perform lender checks
 * - Cannot skip to borrower steps before completing lender pre-checkout
 * - Condition assessment: appearance, operation, accessories status
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  CONDITION_CHECK_STEP_LABELS,
} from '@equipment-management/schemas';
import { CHECKOUT_013_ID } from '../../../shared/constants/test-checkout-ids';

test.describe('Group E1: Lender Pre-Checkout Check', () => {
  /**
   * E-1: Lender pre-checkout check
   * Priority: P0 - CRITICAL
   *
   * Verifies that lender team's technical_manager can perform Step 1
   * of the rental 4-step verification and status transitions correctly.
   *
   * Status Transition: approved → lender_checked
   *
   * TODO: Implement rental 4-step condition check functionality
   * - /checkouts/[id]/check page for condition assessment
   * - EquipmentConditionForm component with appearance/operation/accessories fields
   * - POST /api/checkouts/:id/condition-check endpoint
   * - Status transition logic from approved to lender_checked
   */
  test.fixme('E-1: Lender pre-checkout check', async ({ techManagerPage }) => {
    // 1. Login as technical_manager (Suwon) - lender team
    // techManagerPage fixture automatically logs in as Suwon technical_manager

    // 2. Navigate to approved rental checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_013_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Verify checkout status is 'approved'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    // 4. Verify checkout purpose is 'rental'
    await expect(techManagerPage.getByText(CHECKOUT_PURPOSE_LABELS.rental)).toBeVisible();

    // 5. Verify CheckoutStatusStepper shows rental 8-step flow
    const stepper = techManagerPage
      .locator('[data-testid="checkout-status-stepper"]')
      .or(techManagerPage.locator('.status-stepper'));
    await expect(stepper).toBeVisible();

    // 6. Click '상태 확인' button
    const checkButton = techManagerPage.getByRole('button', { name: '상태 확인' });
    await expect(checkButton).toBeVisible();
    await checkButton.click();

    // 7. Verify navigation to check page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_013_ID}/check`);

    // 8. Verify page title
    await expect(techManagerPage.getByRole('heading', { name: '상태 확인' })).toBeVisible();

    // 9. Verify guidance message for lender checkout step
    await expect(
      techManagerPage.getByText(/장비를 반출하기 전에 현재 상태를 확인하고 기록해주세요/)
    ).toBeVisible();

    // 10. Verify step label from SSOT
    await expect(
      techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.lender_checkout)
    ).toBeVisible();

    // 11. Verify form fields exist
    // 외관 상태 (appearance)
    const appearanceNormal = techManagerPage.getByLabel(/외관 상태/).getByLabel('정상');
    await expect(appearanceNormal).toBeVisible();

    // 작동 상태 (operation)
    const operationNormal = techManagerPage.getByLabel(/작동 상태/).getByLabel('정상');
    await expect(operationNormal).toBeVisible();

    // 부속품 상태 (accessories)
    const accessoriesComplete = techManagerPage.getByLabel(/부속품 상태/).getByLabel('완전');
    await expect(accessoriesComplete).toBeVisible();

    // 추가 메모 (notes)
    const notesField = techManagerPage.getByLabel(/추가 메모|비고/);
    await expect(notesField).toBeVisible();

    // 12-14. Fill condition check form
    await appearanceNormal.check();
    await operationNormal.check();
    await accessoriesComplete.check();

    // 15. Submit the condition check
    const submitButton = techManagerPage.getByRole('button', { name: '확인 완료' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 16. Verify redirect back to detail page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_013_ID}`);

    // 17. Verify API response via network or status change
    // Wait for status update
    await techManagerPage.waitForTimeout(1000);

    // 18. Verify checkout status transitioned to 'lender_checked' via API
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_013_ID}`);
    const checkoutData = await apiResponse.json();
    expect(checkoutData.status).toBe('lender_checked');

    // 19. Verify status badge shows lender_checked
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.lender_checked)).toBeVisible();

    // Verify old status is gone
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).not.toBeVisible();

    // 20. Verify status stepper shows lender_checked as current
    await expect(
      techManagerPage
        .locator('[data-testid="checkout-status-stepper"]')
        .getByText(/반출 전 확인 완료|lender_checked/)
    ).toBeVisible();

    // Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /확인|완료|성공/ })
    ).toBeVisible();
  });

  /**
   * E-2: Only lender technical_manager can pre-check
   * Priority: P1
   *
   * Verifies that:
   * 1. Borrower team's technical_manager cannot perform lender pre-checkout
   * 2. Test engineer from lender team cannot perform lender pre-checkout
   *
   * Permission Rules:
   * - Requires: technical_manager role + lender team membership
   *
   * TODO: Implement team-based permission checking for condition checks
   * - Check lenderTeamId matches user's team
   * - Return 403 for unauthorized team
   * - Hide/disable button for wrong team/role
   */
  test.fixme('E-2: Only lender technical_manager can pre-check', async ({ testOperatorPage }) => {
    // Test Part 1: Test engineer from lender team (wrong role)

    // 1. Login as test_engineer (Suwon) - correct team but wrong role
    // testOperatorPage fixture logs in as test_engineer from Suwon

    // 2. Navigate to approved rental checkout
    await testOperatorPage.goto(`/checkouts/${CHECKOUT_013_ID}`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 3. Verify detail page loads
    await expect(testOperatorPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    // 4. Verify '상태 확인' button is NOT visible for test_engineer
    const checkButton = testOperatorPage.getByRole('button', { name: '상태 확인' });
    await expect(checkButton).not.toBeVisible();

    // 5. Try direct navigation to check page
    await testOperatorPage.goto(`/checkouts/${CHECKOUT_013_ID}/check`);
    await testOperatorPage.waitForLoadState('networkidle');

    // Should show error or redirect (verify no form is shown)
    // Either error message or redirect back to detail page
    const currentUrl = testOperatorPage.url();
    const isOnCheckPage = currentUrl.includes('/check');

    if (isOnCheckPage) {
      // If on check page, verify submit is blocked
      const submitButton = testOperatorPage.getByRole('button', { name: '확인 완료' });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Verify error message appears
        await expect(
          testOperatorPage.getByRole('alert').filter({ hasText: /권한|permission/i })
        ).toBeVisible();
      }
    }

    // 6. Verify checkout status remains 'approved' (unchanged)
    const apiResponse = await testOperatorPage.request.get(`/api/checkouts/${CHECKOUT_013_ID}`);
    const checkoutData = await apiResponse.json();
    expect(checkoutData.status).toBe('approved');
  });

  /**
   * E-3: Cannot skip step order (lender → borrower)
   * Priority: P1
   *
   * Verifies that the 4-step rental process enforces strict sequential order:
   * Cannot perform Step 2 (borrower_receive) before Step 1 (lender_checkout)
   *
   * Workflow Order:
   * approved → lender_checkout → borrower_receive → borrower_return → lender_return
   *
   * TODO: Implement step order validation
   * - getNextCheckStep() determines correct next step based on status
   * - Backend validates step matches current status
   * - Return 400 for out-of-order step attempts
   */
  test.fixme('E-3: Cannot skip step order', async ({ techManagerPage }) => {
    // 1. Navigate to approved rental (Step 1 not yet completed)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_013_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 2. Verify status is 'approved'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    // 3. Navigate to check page
    await techManagerPage.goto(`/checkouts/${CHECKOUT_013_ID}/check`);
    await techManagerPage.waitForLoadState('networkidle');

    // 4. Verify the check page shows lender_checkout as next step (not borrower_receive)
    await expect(
      techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.lender_checkout)
    ).toBeVisible();

    // Verify guidance is for lender checkout step
    await expect(techManagerPage.getByText(/장비를 반출하기 전에 현재 상태를 확인/)).toBeVisible();

    // 5. Attempt to submit borrower_receive check via API (trying to skip step 1)
    const skipAttempt = await techManagerPage.request.post(
      `/api/checkouts/${CHECKOUT_013_ID}/condition-check`,
      {
        data: {
          step: 'borrower_receive',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          accessoriesStatus: 'complete',
        },
      }
    );

    // 6. Verify server returns error (400 or 403)
    expect(skipAttempt.ok()).toBe(false);
    expect([400, 403]).toContain(skipAttempt.status());

    // 7. Verify error message indicates order violation
    const errorData = await skipAttempt.json();
    expect(errorData.message || errorData.error).toMatch(/순서|order|lender.*먼저/i);

    // 8. Verify checkout status remains 'approved' (unchanged)
    const checkStatusResponse = await techManagerPage.request.get(
      `/api/checkouts/${CHECKOUT_013_ID}`
    );
    const checkoutData = await checkStatusResponse.json();
    expect(checkoutData.status).toBe('approved');

    // 9. Verify no condition check records were created for the skipped step
    // Check that conditionChecks array doesn't contain borrower_receive step
    if (checkoutData.conditionChecks) {
      const borrowerReceiveCheck = checkoutData.conditionChecks.find(
        (check: any) => check.step === 'borrower_receive'
      );
      expect(borrowerReceiveCheck).toBeUndefined();
    }
  });
});
