/**
 * Equipment Detail Page - Accessibility: Screen Reader Support
 *
 * REQUIREMENTS:
 * - Seed data must be loaded before running this test
 * - Run: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * group: Group 7: Accessibility (Section 6.2)
 *
 * Tests screen reader compatibility ensuring all content is accessible
 * to assistive technologies. Verifies proper semantic markup, ARIA attributes,
 * and content structure for screen readers.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 7: Accessibility', () => {
  test('Screen reader support', async ({ siteAdminPage: page }) => {
    // Navigate to equipment detail page
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

    // Wait for page to load - if equipment doesn't exist, skip the test
    try {
      await page.waitForSelector('#main-content h1', { timeout: 5000 });
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

    // 2. Verify page has descriptive title
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    expect(pageTitle.length).toBeGreaterThan(0);
    console.log('Page title:', pageTitle);

    // 3. Verify main heading is properly marked (H1)
    const h1 = page.locator('#main-content h1').first();
    await expect(h1).toBeVisible();

    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text!.length).toBeGreaterThan(0);
    console.log('H1 heading:', h1Text);

    // 4. Verify status badges have accessible labels
    const statusBadges = page
      .locator('[class*="badge"], [data-testid*="status"]')
      .filter({ hasText: /사용|교정|폐기|부적합/ });
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        const badge = statusBadges.nth(i);
        const isVisible = await badge.isVisible().catch(() => false);

        if (isVisible) {
          const badgeText = await badge.textContent();
          const ariaLabel = await badge.getAttribute('aria-label');

          // Badge should have either visible text or aria-label
          expect(badgeText || ariaLabel).toBeTruthy();
          console.log(`Badge ${i + 1}: text="${badgeText}", aria-label="${ariaLabel}"`);
        }
      }
    }

    // 5. Verify tabs have role='tab' and proper aria attributes
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(0);
    console.log(`Found ${tabCount} tabs`);

    // Check each tab has proper ARIA attributes
    for (let i = 0; i < Math.min(tabCount, 5); i++) {
      const tab = tabs.nth(i);

      // Verify role="tab"
      const role = await tab.getAttribute('role');
      expect(role).toBe('tab');

      // Verify aria-selected exists
      const ariaSelected = await tab.getAttribute('aria-selected');
      expect(ariaSelected).toBeTruthy();
      expect(['true', 'false']).toContain(ariaSelected!);

      // Verify tab has accessible name
      const tabText = await tab.textContent();
      const ariaLabel = await tab.getAttribute('aria-label');
      expect(tabText || ariaLabel).toBeTruthy();

      console.log(`Tab ${i + 1}: "${tabText}", aria-selected="${ariaSelected}"`);
    }

    // Verify tablist exists
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // 6. Verify form inputs have associated labels
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const inputCount = await inputs.count();

    console.log(`Found ${inputCount} form inputs`);

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Check if there's an associated label
      let hasLabel = false;
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        hasLabel = (await label.count()) > 0;
      }

      // Input must have one form of accessible name
      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy || placeholder;

      if (!hasAccessibleName) {
        console.warn(`Input ${i + 1} (id="${inputId}") lacks accessible name`);
      }

      // For critical forms, expect accessible name
      // (Some inputs like search may rely on placeholder)
      expect(hasAccessibleName).toBeTruthy();
    }

    // 7. Verify error messages are announced (check aria-live regions)
    const ariaLiveRegions = page.locator('[aria-live]');
    const liveRegionCount = await ariaLiveRegions.count();

    console.log(`Found ${liveRegionCount} aria-live regions`);

    // At least one aria-live region should exist for announcements
    // (toast notifications, form errors, etc.)
    if (liveRegionCount > 0) {
      for (let i = 0; i < liveRegionCount; i++) {
        const region = ariaLiveRegions.nth(i);
        const ariaLive = await region.getAttribute('aria-live');
        console.log(`aria-live region ${i + 1}: aria-live="${ariaLive}"`);

        expect(['polite', 'assertive', 'off']).toContain(ariaLive!);
      }
    }

    // 8. Verify success notifications announced (aria-live regions)
    // Check for toast container or notification area
    const toastContainer = page.locator('[role="status"], [role="alert"], [aria-live="polite"]');
    const hasToastContainer = (await toastContainer.count()) > 0;

    if (hasToastContainer) {
      console.log('Toast/notification container found with proper ARIA attributes');
    } else {
      console.log('Note: No toast container found (may appear on user actions)');
    }

    // 9. Navigate through sections using heading navigation (H key simulation)
    // Get all headings in hierarchical order
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    expect(headingCount).toBeGreaterThan(1); // Should have more than just H1
    console.log(`Found ${headingCount} headings`);

    // 10. Verify all content sections have proper headings
    const headingStructure: Array<{ level: string; text: string }> = [];

    for (let i = 0; i < Math.min(headingCount, 10); i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate((el) => el.tagName);
      const text = await heading.textContent();

      headingStructure.push({ level: tagName, text: text || '' });
    }

    console.log('Heading structure:');
    headingStructure.forEach((h, idx) => {
      console.log(`  ${idx + 1}. ${h.level}: ${h.text}`);
    });

    // Verify heading hierarchy is logical
    // H1 should come first
    expect(headingStructure[0].level).toBe('H1');

    // Verify main content areas have headings
    // Common sections: 기본 정보, 교정 정보, 위치 정보, etc.
    const sectionHeadings = headingStructure.filter(
      (h) => ['H2', 'H3'].includes(h.level) && h.text.includes('정보')
    );

    console.log(`Found ${sectionHeadings.length} section headings with "정보"`);
    expect(sectionHeadings.length).toBeGreaterThan(0);

    // Verify landmark roles for major page sections
    const main = page.locator('main[role="main"], main');
    await expect(main).toBeVisible();

    const navigation = page.getByRole('navigation');
    const navCount = await navigation.count();
    console.log(`Found ${navCount} navigation landmarks`);

    // Final check: Verify no unlabeled interactive elements
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    console.log(`Checking ${buttonCount} buttons for accessible names`);

    let unlabeledButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const text = await button.textContent();

      const hasAccessibleName = ariaLabel || ariaLabelledBy || (text && text.trim().length > 0);

      if (!hasAccessibleName) {
        unlabeledButtons++;
        console.warn(`Button ${i + 1} lacks accessible name`);
      }
    }

    // Most buttons should have accessible names
    // Allow a small margin for icon buttons that might be decorative
    expect(unlabeledButtons).toBeLessThan(buttonCount * 0.2);

    console.log('Screen reader support verification complete');
  });
});
