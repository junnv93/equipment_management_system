/**
 * Checkout Creation Validation E2E Tests
 * Group B1: Create Validation
 *
 * Tests form validation, equipment availability checks, and successful checkout creation
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/frontend/app/(dashboard)/checkouts/create/page.tsx - Create checkout page
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_PURPOSE_LABELS, CHECKOUT_STATUS_VALUES } from '@equipment-management/schemas';
import { verifyCheckoutStatus, verifyCheckoutInList } from '../helpers/checkout-helpers';
import { expectErrorMessage } from '../helpers/assertions';
import {
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_POWER_METER_SUW_E_ID,
} from '../../../shared/constants/test-equipment-ids';

test.describe('Group B1: Create Validation', () => {
  /**
   * B-1: Form validation - empty fields
   * Priority: P1
   *
   * Verifies that the submit button is disabled when no equipment is selected
   */
  test('B-1: Form validation - empty fields', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create (already logged in as test_engineer)
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Verify submit button is DISABLED when no equipment is selected
    const submitButton = testOperatorPage.getByRole('button', { name: '반출 신청' });
    await expect(submitButton).toBeDisabled();

    // 3. Verify the selected equipment count shows 0
    await expect(testOperatorPage.getByText('선택된 장비 (0)')).toBeVisible();

    // 4. Verify form NOT submitted (still on /checkouts/create page)
    expect(testOperatorPage.url()).toContain('/checkouts/create');
  });

  /**
   * B-2: Equipment availability check
   * Priority: P1
   *
   * Verifies only 'available' equipment can be selected
   *
   * FIXME: This test is flaky in parallel execution because other tests
   * (B-3, B-4, B-6, etc.) create checkouts that change equipment status.
   * The test logic is correct but needs dedicated equipment IDs not used
   * by create tests, or the entire group-2-create suite needs to run serially.
   */
  test.fixme('B-2: Equipment availability check', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Verify ONLY equipment with status 'available' can be selected
    // The page filters equipment with status: 'available' in the API query
    // Check that available equipment are shown
    const spectrumAnalyzer = testOperatorPage.getByTestId(
      `equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    const signalGenerator = testOperatorPage.getByTestId(`equipment-${EQUIP_SIGNAL_GEN_SUW_E_ID}`);

    await expect(spectrumAnalyzer).toBeVisible();
    await expect(signalGenerator).toBeVisible();

    // 3. Verify equipment with status 'non_conforming' are not shown
    // Power Meter has status 'non_conforming'
    const powerMeter = testOperatorPage.getByTestId(`equipment-${EQUIP_POWER_METER_SUW_E_ID}`);
    await expect(powerMeter).not.toBeVisible();

    // 4. Try to add available equipment - should work
    const addButton = testOperatorPage.getByTestId(
      `add-equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    await addButton.click();

    // 5. Verify equipment was added to selected list
    await expect(testOperatorPage.getByText('선택된 장비 (1)')).toBeVisible();
  });

  /**
   * B-3: Valid calibration checkout creation
   * Priority: P0
   *
   * Creates a valid calibration checkout and verifies it was created successfully
   */
  test('B-3: Valid calibration checkout creation', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select first available equipment
    const addButton = testOperatorPage.getByTestId(
      `add-equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    await addButton.click();

    // Verify equipment was selected
    await expect(testOperatorPage.getByText('선택된 장비 (1)')).toBeVisible();

    // 3. Fill form
    // Purpose: "교정" (calibration)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage
      .getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.calibration })
      .click();

    // Destination: "한국교정시험연구원"
    await testOperatorPage.getByLabel('반출 장소').fill('한국교정시험연구원');

    // Reason: "정기 교정 테스트"
    await testOperatorPage.getByLabel('반출 사유').fill('정기 교정 테스트');

    // Expected return date: The form has a default of 7 days from now
    // We'll use the default date that's already selected rather than changing it
    // to avoid calendar navigation complexity in E2E tests

    // 4. Submit form
    await testOperatorPage.getByRole('button', { name: '반출 신청' }).click();

    // 5. Verify redirected to checkout list page (confirms onSuccess fired)
    await testOperatorPage.waitForURL('**/checkouts', { timeout: 15000 });
    expect(testOperatorPage.url()).toContain('/checkouts');
    expect(testOperatorPage.url()).not.toContain('/create');

    // 6. Verify the created checkout appears in the list
    await expect(testOperatorPage.getByText('한국교정시험연구원').first()).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * B-4: Valid repair checkout creation
   * Priority: P0
   *
   * Creates a valid repair checkout and verifies it was created successfully
   */
  test('B-4: Valid repair checkout creation', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select first available equipment (Signal Generator)
    const addButton = testOperatorPage.getByTestId(`add-equipment-${EQUIP_SIGNAL_GEN_SUW_E_ID}`);
    await addButton.click();

    // Verify equipment was selected
    await expect(testOperatorPage.getByText('선택된 장비 (1)')).toBeVisible();

    // 3. Fill form
    // Purpose: "수리" (repair)
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage.getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.repair }).click();

    // Destination: "제조사 AS센터"
    await testOperatorPage.getByLabel('반출 장소').fill('제조사 AS센터');

    // Reason: "측정 불량 수리"
    await testOperatorPage.getByLabel('반출 사유').fill('측정 불량 수리');

    // Expected return date: The form has a default of 7 days from now
    // We'll use the default date that's already selected

    // 4. Submit form
    await testOperatorPage.getByRole('button', { name: '반출 신청' }).click();

    // 5. Verify redirected to list page (confirms onSuccess fired)
    await testOperatorPage.waitForURL('**/checkouts', { timeout: 15000 });
    expect(testOperatorPage.url()).toContain('/checkouts');
    expect(testOperatorPage.url()).not.toContain('/create');

    // 6. Verify the repair checkout appears in the list
    await expect(testOperatorPage.getByText('제조사 AS센터').first()).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * B-5: Cancel before submission
   * Priority: P3
   *
   * Verifies cancel functionality and confirms no checkout was created
   */
  test('B-5: Cancel before submission', async ({ testOperatorPage }) => {
    // 1. Navigate to /checkouts/create
    await testOperatorPage.goto('/checkouts/create');
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Select equipment
    const addButton = testOperatorPage.getByTestId(
      `add-equipment-${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`
    );
    await addButton.click();

    // 3. Partially fill form
    await testOperatorPage.getByLabel('반출 목적').click();
    await testOperatorPage
      .getByRole('option', { name: CHECKOUT_PURPOSE_LABELS.calibration })
      .click();

    await testOperatorPage.getByLabel('반출 장소').fill('테스트 장소');

    // 4. Get initial checkout count via API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const beforeResponse = await testOperatorPage.request.get(`${backendUrl}/api/checkouts`);
    const beforeData = await beforeResponse.json();
    const beforeCheckouts = beforeData.data || beforeData;
    const initialCount = beforeCheckouts.length;

    // 5. Click cancel button (there are two, use the one in the form footer)
    const cancelButtons = testOperatorPage.getByRole('button', { name: '취소' });
    await cancelButtons.last().click();

    // 6. Verify redirected back to /checkouts list page
    await testOperatorPage.waitForURL('**/checkouts');
    await testOperatorPage.waitForLoadState('networkidle');
    expect(testOperatorPage.url()).toContain('/checkouts');
    expect(testOperatorPage.url()).not.toContain('/create');

    // 7. Verify no checkout was created in DB (via API)
    const afterResponse = await testOperatorPage.request.get(`${backendUrl}/api/checkouts`);
    const afterData = await afterResponse.json();
    const afterCheckouts = afterData.data || afterData;
    const finalCount = afterCheckouts.length;

    // Count should remain the same
    expect(finalCount).toBe(initialCount);
  });
});
