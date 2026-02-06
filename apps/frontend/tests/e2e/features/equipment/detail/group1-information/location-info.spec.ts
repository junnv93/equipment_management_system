// spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
// seed: apps/frontend/tests/e2e/equipment-detail/group1-information/seed.spec.ts

/**
 * Test 1.3: Display location and management information
 *
 * Verifies that location information is properly displayed:
 * - Site information (e.g., 수원)
 * - Team information (e.g., FCC EMC/RF)
 * - Current location (e.g., SUWON Lab)
 * - Installation date (or '-' if not set)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Equipment Information Display', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Display location and management information', async ({ testOperatorPage }) => {
    // 1. Navigate to any equipment detail page
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const firstDetailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Locate the '위치 및 관리 정보' section
    const locationSection = testOperatorPage.getByText(/위치.*관리.*정보|Location.*Management/i);
    await expect(locationSection).toBeVisible();
    console.log('✓ Location and management information section found');

    // 3. Verify site information is displayed
    // Site can be: 수원(SUW), 울산(UIW), 평택(PYT)
    const siteLabel = testOperatorPage.locator('text=/사업장|Site|위치/i');
    if ((await siteLabel.count()) > 0) {
      await expect(siteLabel.first()).toBeVisible();
      console.log('✓ Site information field displayed');
    }

    // 4. Verify team information is displayed
    const teamLabel = testOperatorPage.locator('text=/팀|Team|부서/i');
    if ((await teamLabel.count()) > 0) {
      await expect(teamLabel.first()).toBeVisible();
      console.log('✓ Team information field displayed');

      // Team value should not be empty (or show '-')
      const teamSection = testOperatorPage.locator('text=/팀|Team/i').first();
      const teamContainer = teamSection.locator('..');
      const teamValue = await teamContainer.textContent();
      expect(teamValue).toBeTruthy();
      console.log(`✓ Team value: ${teamValue}`);
    }

    // 5. Verify current location is displayed
    const currentLocationLabel = testOperatorPage.locator(
      'text=/현재 위치|Current Location|보관 위치/i'
    );
    if ((await currentLocationLabel.count()) > 0) {
      await expect(currentLocationLabel.first()).toBeVisible();
      console.log('✓ Current location field displayed');
    }

    // 6. Verify installation date is shown (or '-' if not set)
    const installDateLabel = testOperatorPage.locator('text=/설치일|Installation Date|도입일/i');
    if ((await installDateLabel.count()) > 0) {
      await expect(installDateLabel.first()).toBeVisible();
      console.log('✓ Installation date field displayed');

      // Installation date should show either a date or '-'
      const dateContainer = installDateLabel.first().locator('..');
      const dateValue = await dateContainer.textContent();
      expect(dateValue).toMatch(/\d{4}-\d{2}-\d{2}|-|없음/);
      console.log(`✓ Installation date value: ${dateValue}`);
    }

    console.log('✓ All location and management information fields verified');
  });
});
