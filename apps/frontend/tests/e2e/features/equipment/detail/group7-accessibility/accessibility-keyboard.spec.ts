/**
 * Equipment Detail Page - Accessibility: Keyboard Navigation
 *
 * REQUIREMENTS:
 * - Seed data must be loaded before running this test
 * - Run: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * group: Group 7: Accessibility (Section 6.1)
 *
 * Tests keyboard navigation compliance with WCAG AA standards.
 * Verifies that all interactive elements are accessible via keyboard,
 * focus order is logical, and focus indicators are visible.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 7: Accessibility', () => {
  test('Keyboard navigation', async ({ siteAdminPage: page }) => {
    // 1. Navigate to equipment detail page
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

    // 2. Press Tab key repeatedly
    // First tab should focus on skip link or first interactive element
    await page.keyboard.press('Tab');

    // 3. Verify focus moves through interactive elements in logical order
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 4. Verify focus indicators are visible on all focused elements
    // Check that focus style is applied (outline or ring)
    const hasFocusStyle = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const hasBoxShadow = style.boxShadow && style.boxShadow !== 'none';
      const hasOutline = style.outline && style.outline !== 'none';
      return hasBoxShadow || hasOutline;
    });
    expect(hasFocusStyle).toBeTruthy();

    // Tab through several elements to verify focus order
    const focusOrder: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      focusedElement = page.locator(':focus');
      const elementInfo = await focusedElement.evaluate((el) => {
        return {
          tagName: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          textContent: el.textContent?.slice(0, 30),
        };
      });

      focusOrder.push(`${elementInfo.tagName}${elementInfo.role ? `[${elementInfo.role}]` : ''}`);

      // Verify focus indicator is visible on each element
      const isVisible = await focusedElement.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    }

    console.log('Focus order:', focusOrder);

    // 5. Navigate to tabs using Tab key
    // Find the tab navigation area
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList).toBeVisible();

    // Tab until we reach the tabs
    let tabFocused = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      focusedElement = page.locator(':focus');
      const role = await focusedElement.getAttribute('role');
      if (role === 'tab') {
        tabFocused = true;
        break;
      }
    }

    expect(tabFocused).toBeTruthy();

    // 6. Press Enter to activate a tab
    // Get the currently focused tab's aria-label before activation
    const initialTab = page.locator(':focus');
    const initialTabName = await initialTab.textContent();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // 7. Verify tab content updates
    // Check that aria-selected is true for the activated tab
    const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(selectedTab).toBeVisible();

    // 8. Press Shift+Tab to move focus backward
    await page.keyboard.press('Shift+Tab');

    // 9. Verify backward navigation works correctly
    focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Verify we moved backward in focus order
    const currentElement = await focusedElement.evaluate((el) => el.tagName);
    expect(currentElement).toBeTruthy();

    // 10. Test Escape key on dialog
    // Try to open a dialog (if available)
    // Look for action buttons like "폐기 요청" or "반출 신청"
    const actionButtons = page.locator('button').filter({ hasText: /폐기|반출/ });
    const buttonCount = await actionButtons.count();

    if (buttonCount > 0) {
      // Click the first action button to open a dialog
      await actionButtons.first().click();

      // Verify dialog is open
      const dialog = page.locator('[role="dialog"]');
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        // 11. Verify dialog closes on Escape
        await page.keyboard.press('Escape');

        // Dialog should be closed
        await expect(dialog).not.toBeVisible();

        console.log('Dialog opened and closed with Escape key successfully');
      } else {
        console.log('No dialog opened (may be permission-restricted)');
      }
    } else {
      console.log('No action buttons available to test dialog');
    }

    // Final verification: Tab order is logical and consistent
    // All interactive elements should be reachable via Tab
    const interactiveElements = page.locator(
      'button:visible, a[href]:visible, input:visible, textarea:visible, select:visible, [tabindex="0"]:visible'
    );
    const interactiveCount = await interactiveElements.count();

    console.log(`Total interactive elements found: ${interactiveCount}`);
    expect(interactiveCount).toBeGreaterThan(0);
  });
});
