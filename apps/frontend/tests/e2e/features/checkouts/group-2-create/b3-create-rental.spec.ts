/**
 * Checkout Creation Rental E2E Tests
 * Group B3: Create Rental
 *
 * Tests rental-specific checkout creation scenarios with lender team and site configuration
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/frontend/app/(dashboard)/checkouts/create/page.tsx - Create checkout page
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_PURPOSE_LABELS } from '@equipment-management/schemas';
import {
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
} from '../../../shared/constants/test-equipment-ids';

// Team constants from backend uuid-constants.ts
const TEAM_FCC_EMC_RF_SUWON_ID = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1';

test.describe('Group B3: Create Rental', () => {
  /**
   * B-12: Valid rental checkout creation
   * Priority: P0 - CRITICAL
   *
   * Verifies that a rental checkout can be created with lender team and site information
   *
   * TODO: Frontend implementation required
   * - Add conditional fields in /checkouts/create page when purpose="rental"
   * - Show "대여 제공 팀" (lenderTeamId) dropdown
   * - Show "대여 제공 사이트" (lenderSiteId) dropdown
   * - Update CreateCheckoutDto in backend to include lenderTeamId/lenderSiteId
   * - Frontend API client already has lenderTeamId/lenderSiteId in Checkout interface
   */
  test.fixme('B-12: Valid rental checkout creation', async ({ testOperatorPage }) => {
    // TODO: Rental lender/borrower team fields not yet implemented
    // 1. Navigate to /checkouts/create (already logged in as test_engineer via fixture)
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select first available equipment
    const addButton = testOperatorPage.getByTestId(
      `add-equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    await addButton.click();

    // Verify equipment was selected
    await expect(testOperatorPage.getByText('선택된 장비 (1)')).toBeVisible();

    // 3. Fill form with rental-specific fields
    // Purpose: "대여" (rental)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage.getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.rental }).click();

    // Destination: "의왕 시험소"
    await testOperatorPage.getByLabel('반출 장소').fill('의왕 시험소');

    // Reason: "일시적 장비 부족"
    await testOperatorPage.getByLabel('반출 사유').fill('일시적 장비 부족');

    // Lender Team: Select TEAM_FCC_EMC_RF_SUWON_ID (수원 FCC EMC/RF팀)
    // NOTE: These fields appear conditionally when purpose is "rental"
    await testOperatorPage.getByLabel('대여 제공 팀').click();
    await testOperatorPage.getByRole('option', { name: /FCC EMC\/RF/ }).click();

    // Lender Site: Select "suwon" (수원)
    await testOperatorPage.getByLabel('대여 제공 사이트').click();
    await testOperatorPage.getByRole('option', { name: '수원' }).click();

    // Expected return date: Use default (7 days)
    // No date picker interaction needed - use the default

    // 4. Submit form
    await testOperatorPage.getByRole('button', { name: '반출 신청' }).click();

    // 5. Verify redirected to /checkouts list page
    await testOperatorPage.waitForLoadState('networkidle');
    await testOperatorPage.waitForURL('**/checkouts');
    expect(testOperatorPage.url()).toContain('/checkouts');
    expect(testOperatorPage.url()).not.toContain('/create');

    // 6. Verify success message: "반출 신청 완료"
    await expect(
      testOperatorPage.getByRole('status').filter({ hasText: '반출 신청 완료' })
    ).toBeVisible();

    // 7. Verify rental checkout was created successfully
    // The success message and redirect confirm the checkout was created
    // Rental checkout should have lenderTeamId and lenderSiteId set
  });

  /**
   * B-13: Rental form shows additional fields
   * Priority: P2
   *
   * Verifies that rental-specific fields (lender team, lender site) appear/disappear
   * based on the selected purpose
   *
   * TODO: Frontend implementation required
   * - Implement conditional rendering logic for rental fields
   * - Fields should only show when purpose="rental"
   * - Fields should hide when purpose changes to "calibration" or "repair"
   */
  test.fixme('B-13: Rental form shows additional fields', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select equipment
    const addButton = testOperatorPage.getByTestId(
      `add-equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    await addButton.click();

    // 3. Select purpose: "대여" (rental)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage.getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.rental }).click();

    // 4. Verify additional rental-specific fields appear
    // "대여 제공 팀" (Lender Team) dropdown
    await expect(testOperatorPage.getByLabel('대여 제공 팀')).toBeVisible();

    // "대여 제공 사이트" (Lender Site) dropdown
    await expect(testOperatorPage.getByLabel('대여 제공 사이트')).toBeVisible();

    // 5. Select purpose: "교정" (calibration)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage
      .getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.calibration })
      .click();

    // 6. Verify rental-specific fields are hidden
    await expect(testOperatorPage.getByLabel('대여 제공 팀')).not.toBeVisible();
    await expect(testOperatorPage.getByLabel('대여 제공 사이트')).not.toBeVisible();
  });

  /**
   * B-14: Rental to different site
   * Priority: P2
   *
   * Verifies that a rental checkout can be created to a different site
   * (e.g., from Suwon to Uiwang)
   *
   * TODO: Frontend implementation required
   * - Implement cross-site rental functionality
   * - Allow selection of different lenderSiteId than current user's site
   * - Validate that lenderTeamId matches the selected lenderSiteId
   */
  test.fixme('B-14: Rental to different site', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create (already logged in as test_engineer at Suwon site)
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select equipment from Suwon (EQUIP_SIGNAL_GEN_SUW_E_ID)
    const addButton = testOperatorPage.getByTestId(`add-equipment-${EQUIP_SIGNAL_GEN_SUW_E_ID}`);
    await addButton.click();

    // Verify equipment was selected
    await expect(testOperatorPage.getByText('선택된 장비 (1)')).toBeVisible();

    // 3. Fill form with rental to different site
    // Purpose: "대여" (rental)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage.getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.rental }).click();

    // Destination: "의왕 시험소" (Uiwang lab)
    await testOperatorPage.getByLabel('반출 장소').fill('의왕 시험소');

    // Reason: "프로젝트 지원"
    await testOperatorPage.getByLabel('반출 사유').fill('프로젝트 지원');

    // Lender Team: TEAM_FCC_EMC_RF_SUWON_ID (Suwon team)
    await testOperatorPage.getByLabel('대여 제공 팀').click();
    await testOperatorPage.getByRole('option', { name: /FCC EMC\/RF/ }).click();

    // Lender Site: "suwon"
    await testOperatorPage.getByLabel('대여 제공 사이트').click();
    await testOperatorPage.getByRole('option', { name: '수원' }).click();

    // Expected return date: Use default (7 days)
    // No date picker interaction needed

    // 4. Submit form
    await testOperatorPage.getByRole('button', { name: '반출 신청' }).click();

    // 5. Verify redirect to list page
    await testOperatorPage.waitForLoadState('networkidle');
    await testOperatorPage.waitForURL('**/checkouts');
    expect(testOperatorPage.url()).toContain('/checkouts');

    // 6. Verify success message
    await expect(
      testOperatorPage.getByRole('status').filter({ hasText: '반출 신청 완료' })
    ).toBeVisible();

    // 7. Verify rental to different site was created successfully
    // The UI already confirms the checkout was created
    // Cross-site rental: Suwon equipment → Uiwang site with Suwon lender info
  });
});
