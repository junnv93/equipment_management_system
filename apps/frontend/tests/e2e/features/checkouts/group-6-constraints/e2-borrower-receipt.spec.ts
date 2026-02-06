/**
 * Rental 4-Step: Borrower Receipt Check E2E Tests
 * Group E2: Borrower Receipt
 *
 * Tests the second step of the rental 4-step verification process:
 * Step 2: Borrower receipt check (lender_checked → borrower_received)
 *
 * Business Rules (UL-QP-18):
 * - Only borrower team's technical_manager can perform borrower receipt
 * - Cannot perform Step 2 before Step 1 (lender_checkout) is completed
 * - Records equipment condition at time of receipt by borrower
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS, CONDITION_CHECK_STEP_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_013_ID,
  CHECKOUT_027_ID,
  CHECKOUT_028_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe('Group E2: Borrower Receipt Check', () => {
  /**
   * E-4: Borrower receipt check
   * Priority: P0 - CRITICAL
   *
   * Verifies that borrower team's technical_manager can perform Step 2
   * of the rental verification and status transitions correctly.
   *
   * Status Transition: lender_checked → borrower_received
   *
   * NOTE: This test requires a borrower team technical_manager fixture.
   * CHECKOUT_027_ID: Suwon(lender) → Uiwang(borrower)
   * Need Uiwang technical_manager to perform borrower receipt check.
   *
   * TODO: Implement borrower team fixture or use API login
   * TODO: Implement borrower_receive condition check flow
   */
  test.fixme('E-4: Borrower receipt check', async ({ techManagerPage }) => {
    // CRITICAL: This test needs borrower team (Uiwang) technical_manager
    // Current techManagerPage is Suwon team (lender)
    // For CHECKOUT_027_ID (Suwon→Uiwang), need Uiwang technical_manager

    // Workaround: Use API to login as Uiwang technical_manager
    // Or create borrowerTechManagerPage fixture

    // 1. Login as technical_manager (Uiwang) - borrower team
    // TODO: Implement borrower team login

    // 2. Navigate to lender_checked rental checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_027_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Verify checkout status is 'lender_checked'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.lender_checked)).toBeVisible();

    // 4. Verify status stepper shows lender_checked as current
    const stepper = techManagerPage.locator('[data-testid="checkout-status-stepper"]');
    await expect(stepper).toBeVisible();

    // 5. Click '상태 확인' button
    const checkButton = techManagerPage.getByRole('button', { name: '상태 확인' });
    await expect(checkButton).toBeVisible();
    await checkButton.click();

    // 6. Verify navigation to check page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_027_ID}/check`);

    // 7. Verify guidance message for borrower receipt step
    await expect(
      techManagerPage.getByText(/장비를 인수받으셨습니다.*인수 시점의 장비 상태를 확인/)
    ).toBeVisible();

    // 8. Verify step label from SSOT
    await expect(
      techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.borrower_receive)
    ).toBeVisible();

    // 9-11. Fill condition check form
    await techManagerPage
      .getByLabel(/외관 상태/)
      .getByLabel('정상')
      .check();
    await techManagerPage
      .getByLabel(/작동 상태/)
      .getByLabel('정상')
      .check();
    await techManagerPage
      .getByLabel(/부속품 상태/)
      .getByLabel('완전')
      .check();

    // 12. Enter optional note
    const notesField = techManagerPage.getByLabel(/추가 메모|비고/);
    await notesField.fill('인수 시 상태 양호');

    // 13. Submit
    const submitButton = techManagerPage.getByRole('button', { name: '확인 완료' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 14. Verify redirect to detail page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_027_ID}`);

    // 15. Verify API call succeeded
    await techManagerPage.waitForTimeout(1000);

    // 16. Verify checkout status transitioned to 'borrower_received'
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_027_ID}`);
    const checkoutData = await apiResponse.json();
    expect(checkoutData.status).toBe('borrower_received');

    // 17. Verify status badge shows borrower_received
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.borrower_received)).toBeVisible();

    // Verify old status is gone
    await expect(
      techManagerPage.getByText(CHECKOUT_STATUS_LABELS.lender_checked)
    ).not.toBeVisible();

    // 18. Verify status stepper shows borrower_received as current
    await expect(
      techManagerPage.locator('[data-testid="checkout-status-stepper"]').getByText(/인수 확인 완료/)
    ).toBeVisible();

    // 21. Verify condition check history shows borrower receipt entry
    // Look for condition checks section
    const checkHistory = techManagerPage
      .locator('[data-testid="condition-check-history"]')
      .or(techManagerPage.getByRole('region', { name: /상태 확인 이력/ }));

    if (await checkHistory.isVisible()) {
      // Verify borrower_receive check is shown
      await expect(
        checkHistory.getByText(CONDITION_CHECK_STEP_LABELS.borrower_receive)
      ).toBeVisible();
    }

    // Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /확인|완료|성공/ })
    ).toBeVisible();
  });

  /**
   * E-5: Only borrower technical_manager can receipt
   * Priority: P1
   *
   * Verifies that:
   * 1. Lender team's technical_manager cannot perform borrower receipt
   * 2. Test engineer from borrower team cannot perform borrower receipt
   *
   * Permission Rules:
   * - Requires: technical_manager role + borrower team membership
   *
   * NOTE: CHECKOUT_028_ID is Uiwang(lender) → Suwon(borrower)
   * Current techManagerPage is Suwon team, so they are the BORROWER for this checkout.
   * We need to verify Uiwang (lender) technical_manager CANNOT do borrower receipt.
   *
   * TODO: Implement team-based permission for borrower steps
   */
  test.fixme(
    'E-5: Only borrower technical_manager can receipt',
    async ({ techManagerPage, testOperatorPage }) => {
      // CHECKOUT_028_ID: Uiwang(lender) → Suwon(borrower)
      // techManagerPage (Suwon) is the borrower team for this checkout

      // Test Part 1: Verify lender team cannot perform borrower receipt
      // For CHECKOUT_028_ID, Uiwang is lender, so Uiwang technical_manager should NOT
      // be able to perform borrower_receive check.

      // 1. Navigate to lender_checked rental checkout
      await techManagerPage.goto(`/checkouts/${CHECKOUT_028_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // 2. Verify status is lender_checked
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.lender_checked)).toBeVisible();

      // For this test to work correctly, we would need Uiwang technical_manager fixture
      // to verify they CANNOT perform borrower receipt.
      // With current fixtures, we can only verify via API

      // 3. Try API call to perform borrower_receive (should fail if wrong team)
      const apiAttempt = await techManagerPage.request.post(
        `/api/checkouts/${CHECKOUT_028_ID}/condition-check`,
        {
          data: {
            step: 'borrower_receive',
            appearanceStatus: 'normal',
            operationStatus: 'normal',
            accessoriesStatus: 'complete',
          },
        }
      );

      // This should succeed if techManagerPage is the borrower team
      // For proper test, need to use lender team credentials

      // Test Part 2: Test engineer from borrower team (wrong role)
      // 1. Login as test_engineer
      await testOperatorPage.goto(`/checkouts/${CHECKOUT_027_ID}`);
      await testOperatorPage.waitForLoadState('networkidle');

      // 2. Verify test_engineer cannot see '상태 확인' button
      const checkButton = testOperatorPage.getByRole('button', { name: '상태 확인' });
      await expect(checkButton).not.toBeVisible();

      // 3. Try direct API call (should fail - wrong role)
      const wrongRoleAttempt = await testOperatorPage.request.post(
        `/api/checkouts/${CHECKOUT_027_ID}/condition-check`,
        {
          data: {
            step: 'borrower_receive',
            appearanceStatus: 'normal',
            operationStatus: 'normal',
            accessoriesStatus: 'complete',
          },
        }
      );

      // Verify permission denied
      expect(wrongRoleAttempt.ok()).toBe(false);
      expect([403, 401]).toContain(wrongRoleAttempt.status());

      // 4. Verify checkout status remains unchanged
      const checkStatusResponse = await testOperatorPage.request.get(
        `/api/checkouts/${CHECKOUT_027_ID}`
      );
      const checkoutData = await checkStatusResponse.json();
      expect(checkoutData.status).toBe('lender_checked');
    }
  );

  /**
   * E-6: Cannot skip order (borrower receipt after lender check)
   * Priority: P1
   *
   * Verifies that Step 2 (borrower_receive) cannot be performed
   * before Step 1 (lender_checkout) is completed.
   *
   * Workflow Order:
   * approved → lender_checkout (Step 1) → borrower_receive (Step 2)
   *
   * TODO: Implement step order validation for borrower_receive
   */
  test.fixme(
    'E-6: Cannot skip order (borrower receipt after lender check)',
    async ({ techManagerPage }) => {
      // 1. Navigate to approved rental (Step 1 NOT completed)
      await techManagerPage.goto(`/checkouts/${CHECKOUT_013_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // 2. Verify status is 'approved' (lender_checkout not yet done)
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

      // 3. Attempt to submit borrower_receive check via API (skip Step 1)
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

      // 4. Verify server returns error (400 Bad Request)
      expect(skipAttempt.ok()).toBe(false);
      expect(skipAttempt.status()).toBe(400);

      // 5. Verify error message indicates order violation
      const errorData = await skipAttempt.json();
      expect(errorData.message || errorData.error).toMatch(/순서|order|lender.*먼저|먼저.*lender/i);

      // 6. Navigate to check page
      await techManagerPage.goto(`/checkouts/${CHECKOUT_013_ID}/check`);
      await techManagerPage.waitForLoadState('networkidle');

      // 7. Verify the check page shows lender_checkout as next step (not borrower_receive)
      await expect(
        techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.lender_checkout)
      ).toBeVisible();

      // Should NOT show borrower_receive step label
      await expect(
        techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.borrower_receive)
      ).not.toBeVisible();

      // 8. Verify getNextCheckStep logic: approved → lender_checkout
      // The guidance text confirms the correct step
      await expect(
        techManagerPage.getByText(/장비를 반출하기 전에 현재 상태를 확인/)
      ).toBeVisible();

      // 9. Verify checkout status remains 'approved'
      const checkStatusResponse = await techManagerPage.request.get(
        `/api/checkouts/${CHECKOUT_013_ID}`
      );
      const checkoutData = await checkStatusResponse.json();
      expect(checkoutData.status).toBe('approved');

      // 10. Verify no borrower_receive condition check was created
      if (checkoutData.conditionChecks) {
        const borrowerReceiveCheck = checkoutData.conditionChecks.find(
          (check: any) => check.step === 'borrower_receive'
        );
        expect(borrowerReceiveCheck).toBeUndefined();
      }
    }
  );
});
