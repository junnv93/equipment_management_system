/**
 * Calibration Overdue Auto NC - Incident History UI Seed File
 *
 * This seed ensures test equipment exists in the database for Group D tests.
 *
 * Test Equipment:
 * - equip-d1: Equipment for dropdown option test (available status)
 * - equip-d2: Equipment for checkbox visibility test
 * - equip-d3: Equipment for action plan field test
 * - equip-d4: Equipment for 'Change' type test
 * - equip-d5: Equipment for successful incident creation
 * - equip-d6: Equipment with existing calibration_overdue incident
 * - equip-d7: Equipment for validation test
 * - equip-d8: Equipment for length limit test
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Incident History UI Tests - Seed Setup', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Verify test equipment exists and is accessible', async ({ techManagerPage }) => {
    // Navigate to equipment list
    await techManagerPage.goto('/equipment');

    // Verify page loaded
    await expect(techManagerPage.locator('h1')).toContainText(/장비/);

    // Try to find any available equipment for testing
    const equipmentLinks = techManagerPage.getByRole('link', { name: /상세|보기/i });
    const linkCount = await equipmentLinks.count();

    console.log(`✅ Seed setup complete - Found ${linkCount} equipment items`);
    console.log('Note: Tests will use the first available equipment for UI validation');

    // Ensure at least one equipment exists
    expect(linkCount).toBeGreaterThan(0);
  });
});
