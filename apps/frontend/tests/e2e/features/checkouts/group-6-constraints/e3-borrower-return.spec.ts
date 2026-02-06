/**
 * Rental 4-Step: Borrower Pre-Return Check E2E Tests
 * Group E3: Borrower Pre-Return
 *
 * Tests the third step of the rental 4-step verification process:
 * Step 3: Borrower pre-return check (in_use → borrower_returned)
 *
 * Business Rules (UL-QP-18):
 * - Only borrower team's technical_manager can perform borrower return
 * - Compares equipment condition with Step 2 (borrower_receive) state
 * - Records equipment condition before returning to lender
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS, CONDITION_CHECK_STEP_LABELS } from '@equipment-management/schemas';
import { CHECKOUT_033_ID } from '../../../shared/constants/test-checkout-ids';

test.describe('Group E3: Borrower Pre-Return Check', () => {
  /**
   * E-7: Borrower pre-return check
   * Priority: P0 - CRITICAL
   *
   * Verifies that borrower team's technical_manager can perform Step 3
   * of the rental verification and status transitions correctly.
   *
   * Status Transition: in_use → borrower_returned
   *
   * NOTE: This test requires borrower team technical_manager fixture.
   * CHECKOUT_033_ID: Suwon(lender) → Uiwang(borrower), status='in_use'
   * Need Uiwang technical_manager to perform borrower return check.
   *
   * TODO: Implement borrower_return condition check flow
   * TODO: Implement comparison with borrower_receive check (Step 2)
   */
  test.fixme('E-7: Borrower pre-return check', async ({ techManagerPage }) => {
    // CRITICAL: This test needs borrower team (Uiwang) technical_manager
    // Current techManagerPage is Suwon team (lender)
    // For CHECKOUT_033_ID (Suwon→Uiwang), need Uiwang technical_manager

    // 1. Login as technical_manager (Uiwang) - borrower team
    // TODO: Implement borrower team login

    // 2. Navigate to in_use rental checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_033_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Verify checkout status is 'in_use'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.in_use)).toBeVisible();

    // 4. Verify status stepper shows in_use as current with prior steps completed
    const stepper = techManagerPage.locator('[data-testid="checkout-status-stepper"]');
    await expect(stepper).toBeVisible();

    // Verify completed steps: approved, lender_checked, borrower_received
    // (Visual indication with green checkmarks or completed state)

    // 5. Click '상태 확인' button
    const checkButton = techManagerPage.getByRole('button', { name: '상태 확인' });
    await expect(checkButton).toBeVisible();
    await checkButton.click();

    // 6. Verify navigation to check page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_033_ID}/check`);

    // 7. Verify guidance message for borrower return step
    await expect(
      techManagerPage.getByText(/장비를 반납하기 전에 현재 상태를 확인.*인수 시 상태와 비교/)
    ).toBeVisible();

    // 8. Verify step label from SSOT
    await expect(
      techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.borrower_return)
    ).toBeVisible();

    // 9. Verify '이전 확인 기록' card is shown
    // Should show borrower_receive check data for comparison
    const previousCheckCard = techManagerPage
      .locator('[data-testid="previous-check-card"]')
      .or(techManagerPage.getByRole('region', { name: /이전 확인 기록/ }));
    await expect(previousCheckCard).toBeVisible();

    // Should display borrower_receive step data
    await expect(
      previousCheckCard.getByText(CONDITION_CHECK_STEP_LABELS.borrower_receive)
    ).toBeVisible();

    // 10-12. Fill condition check form
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

    // 13. Submit
    const submitButton = techManagerPage.getByRole('button', { name: '확인 완료' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 14. Verify redirect to detail page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_033_ID}`);

    // 15. Verify API call succeeded
    await techManagerPage.waitForTimeout(1000);

    // 16. Verify checkout status transitioned to 'borrower_returned'
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_033_ID}`);
    const checkoutData = await apiResponse.json();
    expect(checkoutData.status).toBe('borrower_returned');

    // 17. Verify status badge shows borrower_returned
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.borrower_returned)).toBeVisible();

    // Verify old status is gone
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.in_use)).not.toBeVisible();

    // 18. Verify status stepper shows borrower_returned as current
    await expect(
      techManagerPage
        .locator('[data-testid="checkout-status-stepper"]')
        .getByText(/반납 전 확인 완료/)
    ).toBeVisible();

    // Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /확인|완료|성공/ })
    ).toBeVisible();
  });

  /**
   * E-8: Only borrower technical_manager can pre-return
   * Priority: P1
   *
   * Verifies that:
   * 1. Lender team's technical_manager cannot perform borrower return
   * 2. Test engineer from borrower team cannot perform borrower return
   *
   * Permission Rules:
   * - Requires: technical_manager role + borrower team membership
   *
   * NOTE: CHECKOUT_033_ID is Suwon(lender) → Uiwang(borrower)
   * Current techManagerPage is Suwon team (lender), so they should NOT
   * be able to perform borrower_return check.
   *
   * TODO: Implement team-based permission for borrower return step
   */
  test.fixme(
    'E-8: Only borrower technical_manager can pre-return',
    async ({ techManagerPage, testOperatorPage }) => {
      // Test Part 1: Lender team's technical_manager cannot perform borrower return
      // CHECKOUT_033_ID: Suwon(lender) → Uiwang(borrower), status='in_use'
      // techManagerPage (Suwon) is the LENDER, should NOT be able to do borrower_return

      // 1. Login as technical_manager (Suwon) - lender team
      await techManagerPage.goto(`/checkouts/${CHECKOUT_033_ID}`);
      await techManagerPage.waitForLoadState('networkidle');

      // 2. Verify status is in_use
      await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.in_use)).toBeVisible();

      // 3. Try to navigate to check page
      await techManagerPage.goto(`/checkouts/${CHECKOUT_033_ID}/check`);
      await techManagerPage.waitForLoadState('networkidle');

      // 4. Try API call to perform borrower_return (should fail - wrong team)
      const wrongTeamAttempt = await techManagerPage.request.post(
        `/api/checkouts/${CHECKOUT_033_ID}/condition-check`,
        {
          data: {
            step: 'borrower_return',
            appearanceStatus: 'normal',
            operationStatus: 'normal',
            accessoriesStatus: 'complete',
          },
        }
      );

      // 5. Verify permission denied (403 Forbidden)
      expect(wrongTeamAttempt.ok()).toBe(false);
      expect(wrongTeamAttempt.status()).toBe(403);

      // 6. Verify error message indicates team permission violation
      const errorData = await wrongTeamAttempt.json();
      expect(errorData.message || errorData.error).toMatch(/팀|team|권한|permission/i);

      // Test Part 2: Test engineer from borrower team (wrong role)
      // 1. Login as test_engineer
      await testOperatorPage.goto(`/checkouts/${CHECKOUT_033_ID}`);
      await testOperatorPage.waitForLoadState('networkidle');

      // 2. Verify test_engineer cannot see '상태 확인' button
      const checkButton = testOperatorPage.getByRole('button', { name: '상태 확인' });
      await expect(checkButton).not.toBeVisible();

      // 3. Try direct API call (should fail - wrong role)
      const wrongRoleAttempt = await testOperatorPage.request.post(
        `/api/checkouts/${CHECKOUT_033_ID}/condition-check`,
        {
          data: {
            step: 'borrower_return',
            appearanceStatus: 'normal',
            operationStatus: 'normal',
            accessoriesStatus: 'complete',
          },
        }
      );

      // Verify permission denied
      expect(wrongRoleAttempt.ok()).toBe(false);
      expect([403, 401]).toContain(wrongRoleAttempt.status());

      // 4. Verify checkout status remains 'in_use' (unchanged)
      const checkStatusResponse = await testOperatorPage.request.get(
        `/api/checkouts/${CHECKOUT_033_ID}`
      );
      const checkoutData = await checkStatusResponse.json();
      expect(checkoutData.status).toBe('in_use');
    }
  );
});
