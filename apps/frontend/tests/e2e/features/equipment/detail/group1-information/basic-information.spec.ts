// spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
// seed: apps/frontend/tests/e2e/equipment-detail/group1-information/seed.spec.ts

/**
 * Test 1.1: Display basic equipment information
 *
 * Verifies that the equipment detail page displays:
 * - Page title with equipment name
 * - Header information (name, model, management number, serial number)
 * - Status badge with correct styling
 * - Basic information section with all fields
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Equipment Information Display', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Display basic equipment information', async ({ testOperatorPage }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // Find first equipment and navigate to detail page
    const firstDetailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Verify page title displays equipment name
    await expect(testOperatorPage.locator('h1')).toBeVisible();
    const pageTitle = await testOperatorPage.locator('h1').textContent();
    expect(pageTitle).toBeTruthy();
    console.log(`✓ Page title: ${pageTitle}`);

    // 3. Verify equipment header shows required fields
    // Management number format: XXX-XYYYY (e.g., SUW-E0001)
    const managementNumber = testOperatorPage.locator('text=/[A-Z]{3}-[A-Z][0-9]{4}/');
    await expect(managementNumber.first()).toBeVisible();
    console.log('✓ Management number displayed');

    // Model information should be visible
    await expect(testOperatorPage.getByText(/모델/i)).toBeVisible();
    console.log('✓ Model information displayed');

    // 4. Verify status badge displays correct status
    const statusBadge = testOperatorPage.locator('[role="status"], .badge').first();
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    expect(statusText).toMatch(
      /사용 가능|사용 중|반출 중|교정 예정|교정 기한 초과|부적합|여분|폐기/
    );
    console.log(`✓ Status badge: ${statusText}`);

    // 5. Verify basic information section displays all fields
    await expect(testOperatorPage.getByText('장비 기본 정보')).toBeVisible();

    // Equipment name field should be displayed (target the label span)
    await expect(testOperatorPage.locator('span:text-is("장비명")').first()).toBeVisible();

    // Manufacturer field should be displayed (target the label span)
    await expect(testOperatorPage.locator('span:text-is("제조사")').first()).toBeVisible();

    // Serial number field should be displayed (target the label span)
    await expect(testOperatorPage.locator('span:text-is("일련번호")').first()).toBeVisible();

    console.log('✓ All basic information fields displayed');
  });
});
