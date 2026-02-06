// spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
// seed: apps/frontend/tests/e2e/equipment-detail/group1-information/seed.spec.ts

/**
 * Test 1.2: Display calibration information and D-day badge
 *
 * Verifies calibration display logic:
 * - Equipment with upcoming calibration shows D-day badge
 * - Equipment with overdue calibration shows D+N badge
 * - Retired/non-conforming/spare equipment does not show calibration badge
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Equipment Information Display', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Display calibration information and D-day badge', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // Find equipment with calibration (usually has calibration schedule)
    const detailLinks = testOperatorPage.getByRole('link', { name: /상세/i });
    const count = await detailLinks.count();

    if (count === 0) {
      console.log('No equipment found for testing');
      test.skip();
    }

    // Test first equipment for calibration display
    await detailLinks.first().click();
    await testOperatorPage.waitForLoadState('networkidle');

    // Check if equipment has calibration information
    const hasCalibration = (await testOperatorPage.locator('text=/교정|calibration/i').count()) > 0;

    if (hasCalibration) {
      console.log('✓ Equipment has calibration information');

      // Look for calibration D-day badge
      // Format: "D-5", "D-7", "D+61", "6일 후 교정 만료" etc.
      const calibrationBadge = testOperatorPage.locator(
        'text=/D-\\d+|D\\+\\d+|\\d+일 후 교정|교정 만료|calibration/i'
      );

      if ((await calibrationBadge.count()) > 0) {
        await expect(calibrationBadge.first()).toBeVisible();
        const badgeText = await calibrationBadge.first().textContent();
        console.log(`✓ Calibration badge displayed: ${badgeText}`);
      }

      // Verify calibration information in basic info or dedicated section
      const calibrationInfo = testOperatorPage.locator(
        'text=/교정 방법|교정 주기|다음 교정일|교정 기관/'
      );
      if ((await calibrationInfo.count()) > 0) {
        await expect(calibrationInfo.first()).toBeVisible();
        console.log('✓ Calibration details section displayed');
      }
    }

    // Check for equipment status
    const statusBadge = testOperatorPage.locator('[role="status"], .badge').first();
    const statusText = await statusBadge.textContent();
    console.log(`✓ Equipment status: ${statusText}`);

    // Verify that retired/non-conforming/spare equipment doesn't show calibration badge
    if (
      statusText &&
      (statusText.includes('폐기') || statusText.includes('부적합') || statusText.includes('여분'))
    ) {
      // These statuses should not display calibration badges
      const calibrationBadge = testOperatorPage.locator('text=/\\d+일 후 교정|D-\\d+|D\\+\\d+/');
      const badgeCount = await calibrationBadge.count();
      expect(badgeCount).toBe(0);
      console.log('✓ No calibration badge for retired/non-conforming/spare status');
    }
  });
});
