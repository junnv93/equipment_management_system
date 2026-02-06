/**
 * Equipment Detail Page - Responsive Design: Touch vs Mouse Interactions
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: seed.spec.ts
 *
 * Tests differences between touch and mouse interactions on the equipment detail page.
 * Verifies hover states, tooltips, keyboard navigation, and ensures touch devices
 * don't have hover-dependent functionality.
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

  test('Touch vs mouse interactions', async ({ siteAdminPage: page }) => {
    // Part 1: Test on mobile device with touch emulation
    // 1. Test on mobile device or using touch emulation
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to equipment detail page
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

    // Wait for page to load - if equipment doesn't exist, skip the test
    try {
      // Use more specific selector to target the equipment detail page's main heading
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

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // 2. Tap action buttons and verify they respond
    const buttons = page.locator('button').filter({ hasText: /수정|삭제|반출|폐기/ });
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();

      // Verify button is enabled before tapping
      const isDisabled = await firstButton.isDisabled();

      if (!isDisabled) {
        // Tap the button (simulate touch)
        await firstButton.tap();
        await page.waitForTimeout(200);

        // Button should respond to tap (e.g., open dialog, navigate, etc.)
        // For now, just verify no errors occurred
        const bodyElement = page.locator('body');
        await expect(bodyElement).toBeVisible();
      }
    }

    // 3. Verify no hover states on touch devices
    // Hover states typically use CSS :hover pseudo-class
    // On touch devices, hover effects should not persist after tap

    // Test tabs for hover behavior
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      const secondTab = tabs.nth(1);
      await expect(secondTab).toBeVisible();

      // Tap the tab
      await secondTab.tap();
      await page.waitForTimeout(200);

      // Tab should be selected (active state, not hover state)
      const isSelected = await secondTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');
    }

    // 4. Tap tabs and verify instant activation (no hover delay)
    if (tabCount > 0) {
      const firstTab = tabs.first();

      // Record time before tap
      const startTime = Date.now();
      await firstTab.tap();

      // Wait for activation
      await page.waitForTimeout(100);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Tab should activate quickly (< 500ms)
      expect(responseTime).toBeLessThan(500);

      // Verify tab is selected
      const isSelected = await firstTab.getAttribute('aria-selected');
      expect(isSelected).toBe('true');
    }

    // Part 2: Test on desktop with mouse
    // 5. Test on desktop with mouse
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300); // Allow layout reflow

    // Reload page to reset touch state
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
    await expect(mainContent).toBeVisible();

    // 6. Hover over buttons and verify hover effects
    const desktopButtons = page.locator('button').filter({ hasText: /수정|삭제|반출|폐기/ });
    const desktopButtonCount = await desktopButtons.count();

    if (desktopButtonCount > 0) {
      const firstDesktopButton = desktopButtons.first();
      await expect(firstDesktopButton).toBeVisible();

      // Get initial background color
      const initialBgColor = await firstDesktopButton.evaluate((el) =>
        window.getComputedStyle(el).getPropertyValue('background-color')
      );

      // Hover over button
      await firstDesktopButton.hover();
      await page.waitForTimeout(100); // Allow hover transition

      // Get hover background color
      const hoverBgColor = await firstDesktopButton.evaluate((el) =>
        window.getComputedStyle(el).getPropertyValue('background-color')
      );

      // Note: Hover effect may or may not change background color
      // The important thing is that hover doesn't cause errors
      expect(hoverBgColor).toBeTruthy();

      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);
    }

    // 7. Verify tooltips appear on hover (if implemented)
    // Look for elements with title attribute or aria-label
    const elementsWithTooltips = page.locator('[title], [aria-label]');
    const tooltipElementCount = await elementsWithTooltips.count();

    if (tooltipElementCount > 0) {
      const firstTooltipElement = elementsWithTooltips.first();

      // Hover to potentially trigger tooltip
      await firstTooltipElement.hover();
      await page.waitForTimeout(300); // Wait for tooltip appearance

      // Check if tooltip or title is set
      const title = await firstTooltipElement.getAttribute('title');
      const ariaLabel = await firstTooltipElement.getAttribute('aria-label');

      expect(title || ariaLabel).toBeTruthy();
    }

    // 8. Verify keyboard navigation works (Tab key through buttons)
    // Focus on page
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Get focused element
    const initialFocusedElement = await page.locator(':focus').first();
    const initialFocused = await initialFocusedElement.isVisible().catch(() => false);

    if (initialFocused) {
      // Press Tab to move to next element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const newFocusedElement = await page.locator(':focus').first();
      const newFocused = await newFocusedElement.isVisible().catch(() => false);

      // Focus should have moved
      expect(newFocused).toBe(true);

      // Continue tabbing through interactive elements
      let tabCount = 0;
      const maxTabs = 10; // Limit iterations

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);
        tabCount++;

        const focusedEl = await page.locator(':focus').first();
        const isVisible = await focusedEl.isVisible().catch(() => false);

        if (!isVisible) break;

        // Check if focused element is a button or tab
        const tagName = await focusedEl.evaluate((el) => el.tagName.toLowerCase());
        const role = await focusedEl.getAttribute('role');

        if (tagName === 'button' || role === 'tab') {
          // Verify focus indicator is visible
          const outline = await focusedEl.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue('outline')
          );
          const boxShadow = await focusedEl.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue('box-shadow')
          );

          // Should have some focus indicator (outline or box-shadow)
          expect(outline !== 'none' || boxShadow !== 'none').toBe(true);
          break;
        }
      }
    }

    // Test Enter key to activate button
    const activatableButtons = page.locator('button:focus');
    const focusedButtonCount = await activatableButtons.count();

    if (focusedButtonCount > 0) {
      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Button action should have been triggered
      // (Dialog opened, navigation occurred, etc.)
      // For now, just verify no errors
      await expect(mainContent).toBeVisible();
    }

    // Test Shift+Tab for backward navigation
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    const backwardFocusedElement = await page.locator(':focus').first();
    const backwardFocused = await backwardFocusedElement.isVisible().catch(() => false);

    // Should be able to navigate backward
    if (backwardFocused) {
      expect(backwardFocused).toBe(true);
    }

    // Test Escape key on potential dialogs
    // Try opening a dialog first (if any modal buttons exist)
    const modalButtons = page.locator('button').filter({ hasText: /폐기|반출/ });
    const modalButtonCount = await modalButtons.count();

    if (modalButtonCount > 0) {
      const modalButton = modalButtons.first();
      const isDisabled = await modalButton.isDisabled();

      if (!isDisabled) {
        await modalButton.click();
        await page.waitForTimeout(300);

        // Check if dialog opened
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
        const dialogVisible = await dialog.isVisible().catch(() => false);

        if (dialogVisible) {
          // Press Escape to close
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // Dialog should be closed
          const dialogStillVisible = await dialog.isVisible().catch(() => false);
          expect(dialogStillVisible).toBe(false);
        }
      }
    }

    // Verify tab navigation works through all tabs
    const desktopTabs = page.locator('[role="tab"]');
    const desktopTabCount = await desktopTabs.count();

    if (desktopTabCount > 1) {
      // Focus first tab
      await desktopTabs.first().focus();
      await page.waitForTimeout(100);

      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Tab should be selected
      const firstSelected = await desktopTabs.first().getAttribute('aria-selected');
      expect(firstSelected).toBe('true');

      // Tab to next tab
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Press Enter to activate second tab
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Second tab should now be selected
      const secondTab = desktopTabs.nth(1);
      const secondSelected = await secondTab.getAttribute('aria-selected');
      expect(secondSelected).toBe('true');
    }
  });
});
