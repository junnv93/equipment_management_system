/**
 * Team Constraints Permission Tests
 * Group F1: Team-Based Access Control
 *
 * Tests the team-based permission layer that enforces:
 * - EMC team users cannot create/approve checkouts for RF team equipment
 * - Same-team operations are allowed
 *
 * Two-layer Permission Architecture:
 * 1. RBAC (Role-Based): PermissionsGuard checks role permissions
 * 2. Team Constraints: checkTeamPermission checks team ownership
 *
 * Error Messages:
 * - RBAC violation: '이 작업을 수행할 권한이 없습니다.'
 * - Team violation: 'EMC팀은 RF팀 장비에 대한 반출 신청/승인 권한이 없습니다.'
 *
 * @see packages/shared-constants/src/role-permissions.ts - RBAC rules
 * @see apps/backend/src/modules/checkouts/checkouts.service.ts - Team constraints
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';

test.describe('Group F1: Team Constraints', () => {
  /**
   * F-1: EMC team user cannot create checkout for RF team equipment (Negative Test)
   * Priority: P0 - CRITICAL
   *
   * Verifies that team constraint is enforced at the backend.
   * Frontend may show RF equipment (queries all available), but backend blocks creation.
   *
   * Team Rule: FCC_EMC_RF team cannot access GENERAL_RF team equipment
   * Equipment: UIW-W0001 (RF 수신기 - GENERAL_RF team, Uiwang)
   * User: technical_manager (TEAM_FCC_EMC_RF_SUWON_ID)
   *
   * TODO: Implement team-based permission checking in checkout creation
   * - Backend checkTeamPermission in checkouts.service.ts
   * - Return 403 with specific error message for team violations
   */
  test.fixme(
    'F-1: EMC team cannot create checkout for RF equipment',
    async ({ techManagerPage }) => {
      // 1. Login as technical_manager (FCC EMC/RF Suwon team)
      // techManagerPage fixture automatically logs in

      // 2. Navigate to checkout creation page
      await techManagerPage.goto('/checkouts/create');

      // 3. Verify page loads
      await expect(techManagerPage.getByRole('heading', { name: /장비 반출 신청/ })).toBeVisible();

      // 4. Search for RF team equipment
      const searchInput = techManagerPage.getByPlaceholder(/장비.*검색|search/i);
      await searchInput.fill('RF 수신기');

      // 5. Try to select RF equipment (UIW-W0001)
      // Equipment may appear in list since frontend queries all available equipment
      const rfEquipment = techManagerPage.getByText(/UIW-W0001|RF 수신기/).first();

      if (await rfEquipment.isVisible()) {
        // 6. Click to select the RF equipment
        const selectButton = rfEquipment
          .locator('..')
          .getByRole('button', { name: /추가|선택/ })
          .or(rfEquipment.locator('..').getByTestId('select-equipment'));

        if (await selectButton.isVisible()) {
          await selectButton.click();

          // 7. Verify equipment added to selected list
          await expect(
            techManagerPage
              .getByRole('region', { name: /선택된 장비/ })
              .getByText(/UIW-W0001|RF 수신기/)
          ).toBeVisible();
        }
      }

      // 8. Fill checkout form
      await techManagerPage.getByLabel(/반출 목적|목적/).selectOption('교정');
      await techManagerPage.getByLabel(/반출 장소|장소/).fill('외부 교정 기관');
      await techManagerPage.getByLabel(/반출 사유|사유/).fill('정기 교정 의뢰');

      // Set expected return date (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];
      await techManagerPage.getByLabel(/예상 반입|반입 예정/).fill(dateString);

      // 9. Submit form
      const submitButton = techManagerPage.getByRole('button', { name: /반출 신청|신청/ });
      await submitButton.click();

      // 10. Verify error toast appears
      const errorToast = techManagerPage
        .getByRole('alert')
        .or(techManagerPage.getByRole('status').filter({ hasText: /오류|error/i }));
      await expect(errorToast).toBeVisible();

      // 11. Verify error message mentions team permission
      await expect(
        techManagerPage.getByText(/EMC팀은 RF팀 장비.*권한|team.*permission/i)
      ).toBeVisible();

      // 12. Verify page did NOT redirect (still on /checkouts/create)
      expect(techManagerPage.url()).toContain('/checkouts/create');

      // 13. Verify no success toast
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /반출 신청 완료|성공/ })
      ).not.toBeVisible();
    }
  );

  /**
   * F-1 (Positive): EMC team CAN create checkout for same-team equipment
   * Priority: P0 - CRITICAL
   *
   * Verifies that same-team checkout creation works without team constraint violation.
   *
   * Equipment: SUW-E0001 (스펙트럼 분석기 - FCC_EMC_RF team, Suwon)
   * User: technical_manager (TEAM_FCC_EMC_RF_SUWON_ID)
   *
   * TODO: Already partially implemented - verify end-to-end flow
   */
  test.fixme(
    'F-1 (positive): EMC team CAN create checkout for same-team equipment',
    async ({ techManagerPage }) => {
      // 1. Login as technical_manager (FCC EMC/RF Suwon team)
      // 2. Navigate to checkout creation page
      await techManagerPage.goto('/checkouts/create');

      // 3. Verify page loads
      await expect(techManagerPage.getByRole('heading', { name: /장비 반출 신청/ })).toBeVisible();

      // 4. Search for same-team equipment
      const searchInput = techManagerPage.getByPlaceholder(/장비.*검색|search/i);
      await searchInput.fill('스펙트럼 분석기');

      // 5. Verify same-team equipment appears
      const sameTeamEquipment = techManagerPage.getByText(/SUW-E0001|스펙트럼 분석기/).first();
      await expect(sameTeamEquipment).toBeVisible();

      // 6. Select the equipment
      const selectButton = sameTeamEquipment
        .locator('..')
        .getByRole('button', { name: /추가|선택/ })
        .or(sameTeamEquipment.locator('..').getByTestId('select-equipment'));
      await selectButton.click();

      // 7. Verify equipment added to selected list
      const selectedSection = techManagerPage.getByRole('region', { name: /선택된 장비/ });
      await expect(selectedSection.getByText(/SUW-E0001|스펙트럼 분석기/)).toBeVisible();

      // 8. Fill checkout form
      await techManagerPage.getByLabel(/반출 목적/).selectOption('교정');
      await techManagerPage.getByLabel(/반출 장소/).fill('한국표준과학연구원');
      await techManagerPage.getByLabel(/반출 사유/).fill('정기 교정 의뢰 - 연간 교정 계획');

      // Set expected return date (14 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dateString = futureDate.toISOString().split('T')[0];
      await techManagerPage.getByLabel(/예상 반입/).fill(dateString);

      // 9. Submit form
      const submitButton = techManagerPage.getByRole('button', { name: /반출 신청/ });
      await submitButton.click();

      // 10. Verify success toast
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /반출 신청 완료|성공/ })
      ).toBeVisible();

      // 11. Verify redirect to /checkouts
      await techManagerPage.waitForURL('**/checkouts');
      expect(techManagerPage.url()).toContain('/checkouts');
      expect(techManagerPage.url()).not.toContain('/create');
    }
  );

  /**
   * F-2: EMC team technical_manager cannot approve checkout for RF equipment (Negative Test)
   * Priority: P0 - CRITICAL
   *
   * Verifies that team constraint is enforced during checkout approval.
   *
   * NOTE: This test requires a pending checkout with RF equipment.
   * Since all test users belong to FCC EMC/RF team, creating such a checkout
   * requires special setup or direct API manipulation.
   *
   * TODO: Implement team-based permission checking in checkout approval
   * - Backend checkTeamPermission in approval endpoint
   * - Return 403 for cross-team approval attempts
   */
  test.fixme(
    'F-2: EMC team cannot approve checkout for RF equipment',
    async ({ techManagerPage }) => {
      // This test requires a pending checkout with RF equipment
      // For now, test via direct API call

      // Precondition: Assume CHECKOUT_006_ID contains RF equipment (need seed data)
      const testCheckoutId = '10000000-0000-0000-0000-000000000006'; // pending - rental (Uiwang → Suwon)

      // Attempt to approve via API
      const approveAttempt = await techManagerPage.request.patch(
        `/api/checkouts/${testCheckoutId}/approve`,
        {
          data: {
            approverNotes: 'Approved',
          },
        }
      );

      // Verify API returns 403
      expect(approveAttempt.ok()).toBe(false);
      expect(approveAttempt.status()).toBe(403);

      // Verify error message
      const errorData = await approveAttempt.json();
      expect(errorData.message || errorData.error).toMatch(
        /EMC팀은 RF팀 장비.*권한|team.*permission/i
      );

      // Verify checkout status unchanged via API
      const checkStatusResponse = await techManagerPage.request.get(
        `/api/checkouts/${testCheckoutId}`
      );
      const checkoutData = await checkStatusResponse.json();
      expect(checkoutData.status).toBe(CSVal.PENDING);
    }
  );

  /**
   * F-2 (Positive): EMC team CAN approve checkout for same-team equipment
   * Priority: P0 - CRITICAL
   *
   * Verifies end-to-end workflow:
   * 1. test_engineer creates checkout (pending)
   * 2. technical_manager approves checkout (approved)
   *
   * TODO: Verify approval workflow works for same-team checkouts
   */
  test.fixme(
    'F-2 (positive): EMC team CAN approve same-team checkout',
    async ({ testOperatorPage, techManagerPage }) => {
      // STEP 1: Create checkout as test_engineer
      // 1. Login as test_engineer
      await testOperatorPage.goto('/checkouts/create');

      // 2. Search and select same-team equipment
      const searchInput = testOperatorPage.getByPlaceholder(/장비.*검색/i);
      await searchInput.fill('SUW-E0001');

      const equipment = testOperatorPage.getByText(/SUW-E0001/).first();
      const selectButton = equipment
        .locator('..')
        .getByRole('button', { name: /추가|선택/ })
        .or(equipment.locator('..').getByTestId('select-equipment'));
      await selectButton.click();

      // 3. Fill form
      await testOperatorPage.getByLabel(/반출 목적/).selectOption('교정');
      await testOperatorPage.getByLabel(/반출 장소/).fill('외부 교정 기관');
      await testOperatorPage.getByLabel(/반출 사유/).fill('정기 교정');

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      await testOperatorPage.getByLabel(/예상 반입/).fill(futureDate.toISOString().split('T')[0]);

      // 4. Submit
      await testOperatorPage.getByRole('button', { name: /반출 신청/ }).click();

      // 5. Verify success and get checkout ID from URL or response
      await testOperatorPage.waitForURL('**/checkouts');

      // STEP 2: Approve as technical_manager
      // 1. Login as technical_manager
      await techManagerPage.goto('/admin/approvals');

      // 2. Click '반출' tab
      const checkoutTab = techManagerPage.getByRole('tab', { name: /반출/ });
      await checkoutTab.click();

      // 3. Find the pending checkout (identify by equipment or recent creation)
      // Look for SUW-E0001 in the approvals list
      const pendingCheckout = techManagerPage
        .getByRole('row')
        .filter({ hasText: /SUW-E0001/ })
        .first();
      await expect(pendingCheckout).toBeVisible();

      // 4. Click approve button
      const approveButton = pendingCheckout.getByRole('button', { name: /승인/ });
      await approveButton.click();

      // 5. Confirm in modal if needed
      const confirmButton = techManagerPage.getByRole('button', { name: /확인/ });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // 6. Verify success toast
      await expect(
        techManagerPage.getByRole('status').filter({ hasText: /승인.*완료|approved/i })
      ).toBeVisible();

      // 7. Navigate to checkouts list and verify status changed
      await techManagerPage.goto('/checkouts');

      // Find the checkout and verify 'approved' status
      const approvedCheckout = techManagerPage
        .getByRole('row')
        .filter({ hasText: /SUW-E0001/ })
        .first();
      await expect(approvedCheckout.getByText(/승인됨|approved/i)).toBeVisible();
    }
  );
});
