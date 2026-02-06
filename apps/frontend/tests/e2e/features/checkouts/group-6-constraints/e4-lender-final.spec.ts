/**
 * Rental 4-Step: Lender Final Return Check E2E Tests
 * Group E4: Lender Final Check
 *
 * Tests the fourth and final step of the rental 4-step verification process:
 * Step 4: Lender final return check (borrower_returned → lender_received)
 *
 * Business Rules (UL-QP-18):
 * - Only lender team's technical_manager can perform lender final check
 * - Compares equipment condition with Step 1 (lender_checkout) state
 * - Completes the rental 4-step verification process
 * - Records any changes from initial lender checkout state
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS, CONDITION_CHECK_STEP_LABELS } from '@equipment-management/schemas';
import { CHECKOUT_036_ID } from '../../../shared/constants/test-checkout-ids';

test.describe('Group E4: Lender Final Return Check', () => {
  /**
   * E-9: Lender final return check
   * Priority: P0 - CRITICAL
   *
   * Verifies that lender team's technical_manager can perform Step 4
   * of the rental verification and status transitions correctly.
   *
   * This is the final step that completes the rental 4-step process.
   *
   * Status Transition: borrower_returned → lender_received
   *
   * NOTE: CHECKOUT_036_ID is Suwon(lender) → Uiwang(borrower), borrower_returned
   * techManagerPage (Suwon) is the correct lender team for this test.
   *
   * TODO: Implement lender_return condition check flow
   * TODO: Implement comparison with lender_checkout check (Step 1)
   * TODO: Implement needsComparison field for lender_return step
   */
  test.fixme('E-9: Lender final return check', async ({ techManagerPage }) => {
    // 1. Login as technical_manager (Suwon) - lender team
    // techManagerPage fixture is Suwon team, which is the lender for CHECKOUT_036_ID

    // 2. Navigate to borrower_returned rental checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_036_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Verify checkout status is 'borrower_returned'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.borrower_returned)).toBeVisible();

    // 4. Verify status stepper shows borrower_returned as current with all prior steps completed
    const stepper = techManagerPage.locator('[data-testid="checkout-status-stepper"]');
    await expect(stepper).toBeVisible();

    // All 7 prior steps should be completed:
    // pending, approved, lender_checked, borrower_received, in_use, borrower_returned

    // 5. Click '상태 확인' button
    const checkButton = techManagerPage.getByRole('button', { name: '상태 확인' });
    await expect(checkButton).toBeVisible();
    await checkButton.click();

    // 6. Verify navigation to check page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_036_ID}/check`);

    // 7. Verify guidance message for lender return step
    await expect(
      techManagerPage.getByText(/반납받은 장비의 상태를 확인.*반출 전 상태와 비교/)
    ).toBeVisible();

    // 8. Verify step label from SSOT
    await expect(
      techManagerPage.getByText(CONDITION_CHECK_STEP_LABELS.lender_return)
    ).toBeVisible();

    // 9. Verify '이전 확인 기록' card shows lender_checkout (Step 1) data
    const previousCheckCard = techManagerPage
      .locator('[data-testid="previous-check-card"]')
      .or(techManagerPage.getByRole('region', { name: /이전 확인 기록/ }));
    await expect(previousCheckCard).toBeVisible();

    // Should display lender_checkout step data for comparison
    await expect(
      previousCheckCard.getByText(CONDITION_CHECK_STEP_LABELS.lender_checkout)
    ).toBeVisible();

    // 10. Verify '이전 확인과 비교' textarea is visible (needsComparison=true)
    const comparisonField = techManagerPage.getByLabel(/이전 확인과 비교|비교 내용/);
    await expect(comparisonField).toBeVisible();

    // 11-13. Fill condition check form
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

    // 14. Enter comparison note
    await comparisonField.fill('반출 전과 동일한 상태');

    // 15. Submit
    const submitButton = techManagerPage.getByRole('button', { name: '확인 완료' });
    await submitButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 16. Verify redirect to detail page
    await techManagerPage.waitForURL(`**/checkouts/${CHECKOUT_036_ID}`);

    // 17. Verify API call succeeded
    await techManagerPage.waitForTimeout(1000);

    // 18. Verify checkout status transitioned to 'lender_received'
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_036_ID}`);
    const checkoutData = await apiResponse.json();
    expect(checkoutData.status).toBe('lender_received');

    // 19. Verify status badge shows lender_received
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.lender_received)).toBeVisible();

    // Verify old status is gone
    await expect(
      techManagerPage.getByText(CHECKOUT_STATUS_LABELS.borrower_returned)
    ).not.toBeVisible();

    // 20. Verify status stepper shows lender_received as current
    await expect(
      techManagerPage.locator('[data-testid="checkout-status-stepper"]').getByText(/반입 확인 완료/)
    ).toBeVisible();

    // 21. Verify condition check history shows all 4 completed checks
    const checkHistory = techManagerPage
      .locator('[data-testid="condition-check-history"]')
      .or(techManagerPage.getByRole('region', { name: /상태 확인 이력/ }));

    if (await checkHistory.isVisible()) {
      // Verify all 4 steps are shown
      await expect(
        checkHistory.getByText(CONDITION_CHECK_STEP_LABELS.lender_checkout)
      ).toBeVisible();

      await expect(
        checkHistory.getByText(CONDITION_CHECK_STEP_LABELS.borrower_receive)
      ).toBeVisible();

      await expect(
        checkHistory.getByText(CONDITION_CHECK_STEP_LABELS.borrower_return)
      ).toBeVisible();

      await expect(checkHistory.getByText(CONDITION_CHECK_STEP_LABELS.lender_return)).toBeVisible();
    }

    // Verify success message
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /확인|완료|성공/ })
    ).toBeVisible();

    // ✅ RENTAL 4-STEP VERIFICATION PROCESS COMPLETE
    console.log('✅ Rental 4-step verification completed successfully');
    console.log('   Step 1: lender_checkout ✓');
    console.log('   Step 2: borrower_receive ✓');
    console.log('   Step 3: borrower_return ✓');
    console.log('   Step 4: lender_return ✓');
  });

  /**
   * E-10: Only lender technical_manager can final check
   * Priority: P1
   *
   * Verifies that:
   * 1. Borrower team's technical_manager cannot perform lender final check
   * 2. Test engineer from lender team cannot perform lender final check
   *
   * Permission Rules:
   * - Requires: technical_manager role + lender team membership
   *
   * NOTE: CHECKOUT_036_ID is Suwon(lender) → Uiwang(borrower)
   * techManagerPage (Suwon) is the lender team - correct permission
   * Need to test with borrower team (Uiwang) credentials to verify rejection
   *
   * TODO: Implement team-based permission for lender return step
   */
  test.fixme(
    'E-10: Only lender technical_manager can final check',
    async ({ techManagerPage, testOperatorPage }) => {
      // Test Part 1: Borrower team's technical_manager cannot perform lender final check
      // CHECKOUT_036_ID: Suwon(lender) → Uiwang(borrower)
      // Need Uiwang technical_manager to verify they CANNOT do lender_return

      // For this test to work correctly, need borrower team (Uiwang) fixture
      // With current fixtures (Suwon team), we verify via test_engineer role

      // Test Part 2: Test engineer from lender team (wrong role)
      // 1. Login as test_engineer (Suwon) - correct team but wrong role
      await testOperatorPage.goto(`/checkouts/${CHECKOUT_036_ID}`);
      await testOperatorPage.waitForLoadState('networkidle');

      // 2. Verify status is borrower_returned
      await expect(
        testOperatorPage.getByText(CHECKOUT_STATUS_LABELS.borrower_returned)
      ).toBeVisible();

      // 3. Verify test_engineer cannot see '상태 확인' button
      const checkButton = testOperatorPage.getByRole('button', { name: '상태 확인' });
      await expect(checkButton).not.toBeVisible();

      // 4. Try direct API call (should fail - wrong role)
      const wrongRoleAttempt = await testOperatorPage.request.post(
        `/api/checkouts/${CHECKOUT_036_ID}/condition-check`,
        {
          data: {
            step: 'lender_return',
            appearanceStatus: 'normal',
            operationStatus: 'normal',
            accessoriesStatus: 'complete',
            comparisonNote: '테스트',
          },
        }
      );

      // Verify permission denied
      expect(wrongRoleAttempt.ok()).toBe(false);
      expect([403, 401]).toContain(wrongRoleAttempt.status());

      // 5. Verify error message indicates permission violation
      const errorData = await wrongRoleAttempt.json();
      expect(errorData.message || errorData.error).toMatch(/권한|permission|role/i);

      // 6. Verify checkout status remains 'borrower_returned' (unchanged)
      const checkStatusResponse = await testOperatorPage.request.get(
        `/api/checkouts/${CHECKOUT_036_ID}`
      );
      const checkoutData = await checkStatusResponse.json();
      expect(checkoutData.status).toBe('borrower_returned');

      // 7. Verify no lender_return condition check was created
      if (checkoutData.conditionChecks) {
        const lenderReturnCheck = checkoutData.conditionChecks.find(
          (check: any) => check.step === 'lender_return'
        );
        expect(lenderReturnCheck).toBeUndefined();
      }
    }
  );
});
