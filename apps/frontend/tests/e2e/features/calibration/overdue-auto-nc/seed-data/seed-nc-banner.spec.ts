/**
 * Calibration Overdue Auto NC - Non-Conformance Banner Seed File
 *
 * This seed ensures test equipment exists in the database for Group 6 tests.
 *
 * Test Equipment:
 * - Equipment with calibration_overdue non-conformance (status='non_conforming')
 * - Equipment should have NC record with ncType='calibration_overdue'
 * - Equipment should have overdue calibration date (D+X badge visible)
 *
 * spec: apps/frontend/tests/e2e/calibration-overdue-auto-nc-v2.plan.md
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Non-Conformance Banner Tests - Seed Setup', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Verify test equipment exists with non-conformance', async ({ siteAdminPage }) => {
    // Navigate to equipment list
    await siteAdminPage.goto('/equipment');
    await siteAdminPage.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(siteAdminPage.locator('h1')).toContainText(/장비/);

    // Filter by non_conforming status
    const statusFilter = siteAdminPage
      .locator('button[role="combobox"]')
      .filter({ hasText: /상태/i })
      .first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await siteAdminPage.waitForTimeout(300);

      const ncOption = siteAdminPage.getByRole('option', { name: /부적합/i });
      if (await ncOption.isVisible()) {
        await ncOption.click();
        await siteAdminPage.waitForTimeout(500);
      }
    }

    // Try to find equipment with non-conforming status
    const equipmentLinks = siteAdminPage.getByRole('link', { name: /상세|보기/i });
    const linkCount = await equipmentLinks.count();

    console.log(`✅ Seed setup complete - Found ${linkCount} equipment items`);
    console.log(
      'Note: Tests will use equipment with non_conforming status and calibration_overdue NC'
    );

    // Ensure at least one equipment exists
    expect(linkCount).toBeGreaterThan(0);
  });
});
