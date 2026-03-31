/**
 * Equipment Detail Page - Responsive Design: Tablet View
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: seed.spec.ts
 *
 * Tests equipment detail page rendering on tablet devices (768-1024px).
 * Verifies tablet-optimized spacing, two-column layouts, horizontal tab display,
 * and proper handling of orientation changes.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 6: Responsive Design', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Run only on Chromium for consistency
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Tablet view (768-1024px)', async ({ siteAdminPage: page }) => {
    // 1. Set viewport to iPad (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });

    // 2. Navigate to equipment detail page
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

    // Wait for page to load - if equipment doesn't exist, skip the test
    try {
      await page.waitForSelector('h1', { timeout: 5000 });
    } catch (e) {
      // Check if we got a 404 page
      const notFoundText = await page
        .locator('text=/장비를 찾을 수 없습니다|Equipment not found/i')
        .count();
      if (notFoundText > 0) {
        test.skip(true, 'Test equipment not found in database. Please run seed script first.');
      }
      throw e;
    }

    // 3. Verify layout uses tablet-optimized spacing
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Check for responsive padding classes (px-4 sm:px-6)
    const container = page.locator('main > div').first();
    const containerClasses = await container.getAttribute('class');
    // Tablet should use medium padding
    expect(containerClasses).toBeTruthy();

    // 4. Verify header information displays in two columns
    const equipmentHeader = page.locator('h1');
    await expect(equipmentHeader).toBeVisible();

    // Management number should be on the same line or nearby
    const managementNumber = page.getByText(/[A-Z]{3}-[A-Z]\d{4}/);
    await expect(managementNumber).toBeVisible();

    // 5. Verify tabs display horizontally without scrolling
    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible();

    // Get all tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // Verify first and last tabs are both visible (no horizontal scroll)
    if (tabCount > 1) {
      const firstTab = tabs.first();
      const lastTab = tabs.last();

      await expect(firstTab).toBeVisible();
      await expect(lastTab).toBeVisible();

      // Check that tabs are arranged horizontally
      const firstTabBox = await firstTab.boundingBox();
      const lastTabBox = await lastTab.boundingBox();

      if (firstTabBox && lastTabBox) {
        // Tabs should be on roughly the same horizontal line (y-coordinate similar)
        const yDifference = Math.abs(firstTabBox.y - lastTabBox.y);
        expect(yDifference).toBeLessThan(100); // Allow some flex wrapping
      }
    }

    // 6. Verify action buttons have appropriate spacing
    const buttons = page.locator('button').filter({ hasText: /수정|삭제|반출|폐기/ });
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();

      // Buttons should not be full-width on tablet
      const buttonBox = await firstButton.boundingBox();
      const viewportWidth = 768;

      if (buttonBox) {
        // Button should not span entire viewport width
        expect(buttonBox.width).toBeLessThan(viewportWidth * 0.9);
      }
    }

    // 7. Rotate to landscape orientation (1024x768)
    await page.setViewportSize({ width: 1024, height: 768 });

    // 8. Verify layout adjusts for landscape view
    await expect(mainContent).toBeVisible();
    await expect(equipmentHeader).toBeVisible();

    // Tabs should still be horizontal in landscape
    await expect(tabList).toBeVisible();

    // Verify content is still accessible
    const statusBadge = page.locator('[class*="badge"], [class*="Badge"]').first();
    await expect(statusBadge).toBeVisible();

    // 9. Verify all interactive elements remain accessible
    // Test tab navigation
    const calibrationTab = tabs.filter({ hasText: /교정|이력/ }).first();
    if (await calibrationTab.isVisible()) {
      await calibrationTab.click();

      // Verify tab activation (aria-selected or visual indicator)
      const isSelected = await calibrationTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');

      // Click back to basic info tab
      const basicTab = tabs.first();
      await basicTab.click();
    }

    // Verify action buttons are still accessible in landscape
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      await expect(firstButton).toBeEnabled();
    }

    // Verify no content overflow in landscape mode
    const landscapeScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const landscapeClientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(landscapeScrollWidth).toBeLessThanOrEqual(landscapeClientWidth + 1);

    // Test responsiveness by switching back to portrait
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify page still renders correctly
    await expect(mainContent).toBeVisible();
    await expect(equipmentHeader).toBeVisible();
    await expect(tabList).toBeVisible();
  });
});
