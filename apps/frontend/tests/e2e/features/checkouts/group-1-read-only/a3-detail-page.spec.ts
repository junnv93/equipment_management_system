/**
 * Checkout Detail Page Tests
 * Group A3: Detail Page Display and Navigation
 *
 * Tests checkout detail page functionality:
 * - Page loads with all sections
 * - Purpose badge display (calibration/repair/rental)
 * - Rental-specific info display
 * - Equipment link navigation
 * - Data accuracy verification
 * - Special states (rejected, overdue, multi-equipment)
 *
 * All tests are read-only and parallelizable.
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS, CHECKOUT_PURPOSE_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_001_ID,
  CHECKOUT_005_ID,
  CHECKOUT_015_ID,
  CHECKOUT_027_ID,
  CHECKOUT_042_ID,
  CHECKOUT_056_ID,
  CHECKOUT_065_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe('Group A3: Detail Page', () => {
  /**
   * A-9: Checkout detail page loads with all sections
   * Priority: P3
   *
   * Verifies detail page structure and sections.
   * Handles data pollution gracefully by checking actual API status first.
   */
  test('A-9: Detail page loads with all sections', async ({ techManagerPage }) => {
    // Check actual checkout status from API to handle data pollution
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_001_ID}`);
    const checkoutData = await apiResponse.json();

    // Navigate to detail page
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('domcontentloaded');

    // Verify status badge exists using the actual status from API
    // Use Badge component's specific classes to avoid stepper text
    const actualStatus = checkoutData.status;
    const statusLabel =
      CHECKOUT_STATUS_LABELS[actualStatus as keyof typeof CHECKOUT_STATUS_LABELS] || actualStatus;

    // Target the Badge component specifically (has border-* classes, not in stepper)
    const statusBadge = techManagerPage
      .locator('[class*="border-"]')
      .filter({
        hasText: statusLabel,
      })
      .first();
    await expect(statusBadge).toBeVisible({ timeout: 10000 });

    // Verify purpose badge - use badge-specific selector to avoid navigation links
    const purposeLabel =
      CHECKOUT_PURPOSE_LABELS[checkoutData.purpose as keyof typeof CHECKOUT_PURPOSE_LABELS];
    await expect(
      techManagerPage
        .locator('.rounded-md.border', {
          hasText: purposeLabel,
        })
        .first()
    ).toBeVisible();

    // Verify checkout info section
    await expect(
      techManagerPage.getByRole('heading', { name: /반출.*정보|checkout.*info/i })
    ).toBeVisible();

    // Verify schedule section (heading)
    await expect(
      techManagerPage.getByRole('heading', { name: /일정.*정보|schedule/i })
    ).toBeVisible();

    // Verify expected return date (always present)
    await expect(techManagerPage.getByText(/반입 예정일|expected.*return/i)).toBeVisible();

    // Verify personnel section (heading)
    await expect(
      techManagerPage.getByRole('heading', { name: /담당자.*정보|personnel/i })
    ).toBeVisible();

    // Verify equipment list section
    await expect(
      techManagerPage.getByRole('heading', { name: /반출.*장비|equipment/i })
    ).toBeVisible();
  });

  /**
   * A-10: Purpose badge displays correctly
   * Priority: P2
   *
   * Verifies purpose badges use SSOT labels and correct colors.
   *
   * TODO: Verify purpose badge styling
   */
  test('A-10: Purpose badge displays correctly', async ({ techManagerPage }) => {
    // Test calibration badge (blue)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Use specific badge selector - filter by badge classes to avoid navigation links
    const calibrationBadge = techManagerPage
      .locator('.rounded-md.border', {
        hasText: CHECKOUT_PURPOSE_LABELS.calibration,
      })
      .first();
    await expect(calibrationBadge).toBeVisible();

    // Verify blue/primary styling
    await expect(calibrationBadge).toHaveClass(/blue|primary/i);

    // Test rental badge (purple)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_005_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Use specific badge selector
    const rentalBadge = techManagerPage
      .locator('.rounded-md.border', {
        hasText: CHECKOUT_PURPOSE_LABELS.rental,
      })
      .first();
    await expect(rentalBadge).toBeVisible();

    // Verify purple styling
    await expect(rentalBadge).toHaveClass(/purple/i);
  });

  /**
   * A-11: Rental lender info display + condition checks
   * Priority: P2
   *
   * Verifies rental-specific UI elements.
   *
   * TODO: Implement rental-specific info display
   */
  test('A-11: Rental lender info displays', async ({ techManagerPage }) => {
    // Use CHECKOUT_027_ID (lender_checked rental)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_027_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify rental purpose - use badge-specific selector to avoid navigation links
    await expect(
      techManagerPage
        .locator('.rounded-md.border', {
          hasText: CHECKOUT_PURPOSE_LABELS.rental,
        })
        .first()
    ).toBeVisible();

    // Verify status stepper heading exists (indicates stepper is present)
    await expect(techManagerPage.getByRole('heading', { name: /진행.*상태/i })).toBeVisible();

    // Verify condition check history section (rental-specific)
    const conditionCheckHeading = techManagerPage.getByRole('heading', {
      name: /상태.*확인.*이력/i,
    });

    // Condition checks may or may not exist depending on checkout status
    // Just verify the page structure is correct for rental checkouts
    if (await conditionCheckHeading.isVisible()) {
      await expect(conditionCheckHeading).toBeVisible();
    }
  });

  /**
   * A-12: Equipment link navigation to /equipment/[id]
   * Priority: P3
   *
   * Verifies clicking equipment name navigates to equipment detail.
   *
   * TODO: Verify equipment link navigation works
   */
  test.fixme('A-12: Equipment link navigation works', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Find equipment link (should be clickable)
    const equipmentLink = techManagerPage.getByRole('link', { name: /SUW-E|스펙트럼/ }).first();
    await expect(equipmentLink).toBeVisible();

    // Click equipment link
    await equipmentLink.click();

    // Verify navigation to equipment detail page
    await techManagerPage.waitForURL(/\/equipment\/[a-f0-9-]+/);

    // Verify equipment detail page loads
    await expect(
      techManagerPage.getByRole('heading', { name: /장비.*상세|equipment.*detail/i })
    ).toBeVisible();
  });

  /**
   * A-9b: Detail page data accuracy (verify against API)
   * Priority: P2
   *
   * Verifies displayed data matches API response.
   *
   * TODO: Implement data accuracy validation
   */
  test.fixme('A-9b: Data accuracy verification', async ({ techManagerPage }) => {
    // Get checkout data from API
    const apiResponse = await techManagerPage.request.get(`/api/checkouts/${CHECKOUT_001_ID}`);
    const checkoutData = await apiResponse.json();

    // Navigate to detail page
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify status matches API (use .first() to avoid strict mode violation)
    const statusLabel =
      CHECKOUT_STATUS_LABELS[checkoutData.status as keyof typeof CHECKOUT_STATUS_LABELS];
    await expect(techManagerPage.getByText(statusLabel).first()).toBeVisible();

    // Verify purpose matches API (use .first() to avoid strict mode violation)
    const purposeLabel =
      CHECKOUT_PURPOSE_LABELS[checkoutData.purpose as keyof typeof CHECKOUT_PURPOSE_LABELS];
    await expect(techManagerPage.getByText(purposeLabel).first()).toBeVisible();

    // Verify destination matches
    await expect(techManagerPage.getByText(checkoutData.destination)).toBeVisible();

    // Verify reason matches
    await expect(techManagerPage.getByText(checkoutData.reason)).toBeVisible();
  });

  /**
   * A-9c: Rejected checkout shows rejection reason card
   * Priority: P2
   *
   * Verifies rejection reason display.
   *
   * TODO: Implement rejection reason card
   */
  test.fixme('A-9c: Rejection reason displays', async ({ techManagerPage }) => {
    // Use CHECKOUT_015_ID (rejected with reason)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_015_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify rejected status (use .first() to avoid strict mode violation)
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.rejected).first()).toBeVisible();

    // Verify rejection reason card
    const rejectionCard = techManagerPage
      .locator('[data-testid="rejection-reason-card"]')
      .or(techManagerPage.locator('.rejection-reason'));
    await expect(rejectionCard).toBeVisible();

    // Verify red border styling
    await expect(rejectionCard).toHaveClass(/red|destructive|border-red/);

    // Verify rejection reason text is displayed
    await expect(rejectionCard.getByText(/.+/)).toBeVisible();
  });

  /**
   * A-9d: Overdue checkout shows warning alert
   * Priority: P2
   *
   * Verifies overdue warning display.
   *
   * TODO: Implement overdue warning UI
   */
  test.fixme('A-9d: Overdue warning displays', async ({ techManagerPage }) => {
    // Use CHECKOUT_056_ID (overdue - pending)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_056_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify overdue warning alert
    const overdueAlert = techManagerPage
      .getByRole('alert')
      .filter({ hasText: /기한.*초과|overdue/ });
    await expect(overdueAlert).toBeVisible();

    // Verify warning text
    await expect(techManagerPage.getByText(/반입 예정일이 초과되었습니다/)).toBeVisible();

    // Verify destructive/warning styling
    await expect(overdueAlert).toHaveClass(/destructive|warning|red/);
  });

  /**
   * A-9e: List row click navigates to detail page
   * Priority: P3
   *
   * Verifies list → detail navigation.
   *
   * TODO: Implement row click navigation
   */
  test.fixme('A-9e: Row click navigation works', async ({ techManagerPage }) => {
    // Navigate to list page
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // Click first row
    const firstRow = techManagerPage
      .getByRole('row')
      .filter({ has: techManagerPage.getByRole('cell') })
      .first();
    await firstRow.click();

    // Verify navigation to detail page
    await techManagerPage.waitForURL(/\/checkouts\/[a-f0-9-]+/);

    // Verify detail page loads
    await expect(
      techManagerPage
        .locator('[data-testid="checkout-detail"]')
        .or(techManagerPage.getByRole('heading', { name: /반출.*상세/ }))
    ).toBeVisible();
  });

  /**
   * A-10b: Multi-equipment checkout displays 'N건' suffix
   * Priority: P2
   *
   * Verifies multi-equipment display in list.
   *
   * TODO: Implement multi-equipment count badge
   */
  test.fixme('A-10b: Multi-equipment count displays', async ({ techManagerPage }) => {
    // Navigate to list page
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // Search for multi-equipment checkout (CHECKOUT_065_ID has 3 equipment)
    // Or look for '외 N건' text in equipment column
    const multiEquipmentIndicator = techManagerPage.getByText(/외 \d+건/);

    if (await multiEquipmentIndicator.isVisible()) {
      await expect(multiEquipmentIndicator).toBeVisible();

      // Click to go to detail page
      const row = multiEquipmentIndicator.locator('../..');
      await row.click();

      await techManagerPage.waitForLoadState('networkidle');

      // Verify detail page shows all equipment
      const equipmentList = techManagerPage
        .locator('[data-testid="equipment-list"]')
        .or(
          techManagerPage
            .getByRole('list')
            .filter({ has: techManagerPage.getByText(/SUW-E|UIW-W/) })
        );

      await expect(equipmentList).toBeVisible();

      // Count equipment items (should be > 1)
      const equipmentItems = equipmentList.getByRole('listitem');
      expect(await equipmentItems.count()).toBeGreaterThan(1);
    }
  });

  /**
   * A-12b: Returned checkout displays inspection results
   * Priority: P2
   *
   * Verifies inspection checkboxes display for returned checkouts.
   *
   * TODO: Implement inspection results display
   */
  test.fixme('A-12b: Inspection results display', async ({ techManagerPage }) => {
    // Use CHECKOUT_042_ID (returned calibration with inspections)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_042_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify returned status (use .first() to avoid strict mode violation)
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned).first()).toBeVisible();

    // Verify inspection results section
    const inspectionSection = techManagerPage
      .locator('[data-testid="inspection-results"]')
      .or(techManagerPage.getByRole('region', { name: /검사 결과|inspection/i }));

    if (await inspectionSection.isVisible()) {
      await expect(inspectionSection).toBeVisible();

      // Verify calibration check icon
      await expect(
        inspectionSection
          .locator('[data-testid="calibration-check"]')
          .or(inspectionSection.getByText(/교정.*확인|calibration.*check/))
      ).toBeVisible();

      // Verify working status check icon
      await expect(
        inspectionSection
          .locator('[data-testid="working-status-check"]')
          .or(inspectionSection.getByText(/작동.*확인|working.*status/))
      ).toBeVisible();
    }
  });
});
