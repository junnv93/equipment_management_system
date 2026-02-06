/**
 * Equipment Detail Page - Responsive Design: Desktop View
 *
 * REQUIREMENTS:
 * - Seed data must be loaded before running this test
 * - Run: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * Tests equipment detail page rendering on desktop displays (> 1024px).
 * Verifies max-width constraints, horizontal padding, grid layouts,
 * multi-column information sections, and ultra-wide display handling.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 6: Responsive Design', () => {
  test('Desktop view (> 1024px)', async ({ siteAdminPage: page }) => {
    // 1. Set viewport to Full HD (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });

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

    // 3. Verify content is centered with max-width constraint (max-w-7xl)
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Check for max-width container (max-w-7xl = 80rem = 1280px)
    // The structure is: #main-content > div (wrapper) > div (max-w-7xl container)
    const container = page.locator('.max-w-7xl').first();
    await expect(container).toBeVisible();

    const containerWidth = await container.evaluate((el) => el.offsetWidth);
    // max-w-7xl is 1280px, content should not exceed this significantly
    expect(containerWidth).toBeLessThanOrEqual(1400); // Allow some margin

    // Verify content is centered (has auto margins)
    const containerBox = await container.boundingBox();
    if (containerBox) {
      const viewportWidth = 1920;
      const leftMargin = containerBox.x;
      const rightMargin = viewportWidth - (containerBox.x + containerBox.width);

      // Left and right margins should be roughly equal (centered)
      const marginDifference = Math.abs(leftMargin - rightMargin);
      expect(marginDifference).toBeLessThan(50); // Allow small differences
    }

    // 4. Verify horizontal padding (px-4 sm:px-6 lg:px-8)
    const containerClasses = await container.getAttribute('class');
    expect(containerClasses).toBeTruthy();

    // On desktop, should use lg:px-8 or similar
    // Verify there's space between viewport edge and content
    if (containerBox) {
      expect(containerBox.x).toBeGreaterThan(20); // At least some padding
    }

    // 5. Verify information sections display in grid layout
    const equipmentHeader = page.locator('h1');
    await expect(equipmentHeader).toBeVisible();

    // Look for information sections (basic info, location, etc.)
    const infoSections = page.locator('section, [class*="grid"]').filter({
      has: page.locator('text=/장비명|모델명|제조사|위치|팀|교정/'),
    });

    const sectionCount = await infoSections.count();
    if (sectionCount > 0) {
      const firstSection = infoSections.first();
      await expect(firstSection).toBeVisible();

      // Check if sections use grid or multi-column layout
      const displayStyle = await firstSection.evaluate((el) =>
        window.getComputedStyle(el).getPropertyValue('display')
      );

      // Should use grid, flex, or block (with float/columns)
      expect(['grid', 'flex', 'block']).toContain(displayStyle);
    }

    // 6. Verify tabs display horizontally with icons and labels
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList).toBeVisible();

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // All tabs should be visible without scrolling
    const firstTab = tabs.first();
    const lastTab = tabs.last();

    await expect(firstTab).toBeVisible();
    await expect(lastTab).toBeVisible();

    // Tabs should have text labels (and potentially icons)
    const firstTabText = await firstTab.textContent();
    expect(firstTabText).toBeTruthy();
    expect(firstTabText!.trim().length).toBeGreaterThan(0);

    // 7. Verify action buttons are right-aligned in header
    const buttons = page.locator('button').filter({ hasText: /수정|삭제|반출|폐기/ });
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();

      // Check button positioning
      const buttonBox = await firstButton.boundingBox();
      if (buttonBox && containerBox) {
        const containerRight = containerBox.x + containerBox.width;
        const buttonRight = buttonBox.x + buttonBox.width;

        // Button should be towards the right side of container
        const distanceFromRight = containerRight - buttonRight;
        expect(distanceFromRight).toBeLessThan(200); // Close to right edge
      }
    }

    // 8. Test with ultra-wide display (2560px width)
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300); // Allow layout reflow

    // 9. Verify content remains readable and centered
    await expect(mainContent).toBeVisible();
    await expect(equipmentHeader).toBeVisible();

    // Content should still be constrained to max-width
    const ultraWideContainerWidth = await container.evaluate((el) => el.offsetWidth);
    expect(ultraWideContainerWidth).toBeLessThanOrEqual(1400); // Same max-width

    // Content should be centered with larger margins
    const ultraWideBox = await container.boundingBox();
    if (ultraWideBox) {
      const ultraWideViewportWidth = 2560;
      const ultraWideLeftMargin = ultraWideBox.x;
      const ultraWideRightMargin = ultraWideViewportWidth - (ultraWideBox.x + ultraWideBox.width);

      // Margins should be roughly equal
      const ultraWideMarginDiff = Math.abs(ultraWideLeftMargin - ultraWideRightMargin);
      expect(ultraWideMarginDiff).toBeLessThan(50);

      // Margins should be substantial
      expect(ultraWideLeftMargin).toBeGreaterThan(400); // Significant centering margin
    }

    // Verify tabs and buttons still function properly
    await expect(tabList).toBeVisible();
    await expect(tabs.first()).toBeVisible();

    if (buttonCount > 0) {
      await expect(buttons.first()).toBeVisible();
    }

    // Verify text remains readable (not stretched too wide)
    const paragraphs = page.locator('p');
    const paragraphCount = await paragraphs.count();

    if (paragraphCount > 0) {
      const firstParagraph = paragraphs.first();
      const paragraphWidth = await firstParagraph.evaluate((el) => el.offsetWidth);

      // Paragraph width should be reasonable for readability (not full max-width)
      // Ideal line length is 50-75 characters, roughly 600-800px
      expect(paragraphWidth).toBeLessThan(1200); // Not excessively wide
    }

    // Verify no horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Test responsiveness by switching back to standard desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    // Verify page still renders correctly
    await expect(mainContent).toBeVisible();
    await expect(equipmentHeader).toBeVisible();
    await expect(tabList).toBeVisible();
  });
});
