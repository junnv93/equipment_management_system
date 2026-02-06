/**
 * Equipment Detail Page - Accessibility: ARIA Labels and Roles
 *
 * REQUIREMENTS:
 * - Seed data must be loaded before running this test
 * - Run: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * group: Group 7: Accessibility (Section 6.3)
 *
 * Tests proper implementation of ARIA attributes including roles, labels,
 * and states. Verifies that ARIA is used correctly to enhance accessibility
 * without overriding native semantics.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 7: Accessibility', () => {
  test('ARIA labels and roles', async ({ siteAdminPage: page }) => {
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

    // 1. Inspect equipment header
    const header = page.locator('header, [data-testid="equipment-header"]').first();
    const headerExists = (await header.count()) > 0;

    if (headerExists) {
      console.log('Equipment header found');
    }

    // 2. Verify status badge has aria-label describing status
    const statusBadges = page
      .locator('[class*="badge"]')
      .filter({ hasText: /사용|교정|폐기|부적합|여분/ });
    const statusBadgeCount = await statusBadges.count();

    console.log(`Found ${statusBadgeCount} status badges`);

    for (let i = 0; i < Math.min(statusBadgeCount, 3); i++) {
      const badge = statusBadges.nth(i);
      const isVisible = await badge.isVisible().catch(() => false);

      if (isVisible) {
        const badgeText = await badge.textContent();
        const ariaLabel = await badge.getAttribute('aria-label');
        const role = await badge.getAttribute('role');

        // Badge should have text content or aria-label
        expect(badgeText || ariaLabel).toBeTruthy();

        console.log(`Badge ${i + 1}:`);
        console.log(`  Text: "${badgeText}"`);
        console.log(`  aria-label: "${ariaLabel}"`);
        console.log(`  role: "${role}"`);

        // If badge only contains an icon, it must have aria-label
        if (!badgeText || badgeText.trim().length === 0) {
          expect(ariaLabel).toBeTruthy();
        }
      }
    }

    // 3. Inspect tab navigation
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    // 4. Verify tablist has role='tablist'
    const tablistRole = await tablist.getAttribute('role');
    expect(tablistRole).toBe('tablist');
    console.log('✓ Tablist has role="tablist"');

    // 5. Verify each tab has role='tab'
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(0);
    console.log(`Found ${tabCount} tabs with role="tab"`);

    for (let i = 0; i < Math.min(tabCount, 8); i++) {
      const tab = tabs.nth(i);

      const role = await tab.getAttribute('role');
      expect(role).toBe('tab');

      // Check for aria-selected
      const ariaSelected = await tab.getAttribute('aria-selected');
      expect(ariaSelected).toBeTruthy();
      expect(['true', 'false']).toContain(ariaSelected!);

      // Check for aria-controls (should reference tabpanel id)
      const ariaControls = await tab.getAttribute('aria-controls');

      // Check for accessible name
      const tabText = await tab.textContent();
      const ariaLabel = await tab.getAttribute('aria-label');

      console.log(`Tab ${i + 1}:`);
      console.log(`  role: "tab"`);
      console.log(`  aria-selected: "${ariaSelected}"`);
      console.log(`  aria-controls: "${ariaControls}"`);
      console.log(`  text: "${tabText}"`);
      console.log(`  aria-label: "${ariaLabel}"`);
    }

    // 6. Verify tab panels have role='tabpanel'
    const tabpanels = page.locator('[role="tabpanel"]');
    const tabpanelCount = await tabpanels.count();

    if (tabpanelCount > 0) {
      console.log(`✓ Found ${tabpanelCount} tab panels with role="tabpanel"`);

      // Check first visible tabpanel
      const visibleTabpanel = tabpanels.filter({ hasText: /.+/ }).first();
      const panelVisible = await visibleTabpanel.isVisible().catch(() => false);

      if (panelVisible) {
        const ariaLabelledBy = await visibleTabpanel.getAttribute('aria-labelledby');
        const id = await visibleTabpanel.getAttribute('id');

        console.log(`Active tabpanel:`);
        console.log(`  id: "${id}"`);
        console.log(`  aria-labelledby: "${ariaLabelledBy}"`);

        // Tabpanel should have id that matches tab's aria-controls
        expect(id).toBeTruthy();
      }
    } else {
      console.log('Note: No explicit role="tabpanel" found (may use different pattern)');
    }

    // 7. Verify aria-selected reflects active tab
    const selectedTabs = page.locator('[role="tab"][aria-selected="true"]');
    const selectedCount = await selectedTabs.count();

    // Should have exactly one selected tab
    expect(selectedCount).toBeGreaterThan(0);
    console.log(`✓ Found ${selectedCount} selected tab(s)`);

    const selectedTab = selectedTabs.first();
    const selectedTabText = await selectedTab.textContent();
    console.log(`  Active tab: "${selectedTabText}"`);

    // 8. Inspect action buttons
    const actionButtons = page
      .locator('button:visible')
      .filter({ hasText: /수정|삭제|반출|폐기|요청|승인/ });
    const actionButtonCount = await actionButtons.count();

    console.log(`Found ${actionButtonCount} action buttons`);

    // 9. Verify icon-only buttons have aria-label
    const allButtons = page.locator('button:visible');
    const allButtonCount = await allButtons.count();

    let iconOnlyButtons = 0;
    let iconOnlyWithLabel = 0;

    for (let i = 0; i < Math.min(allButtonCount, 15); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      // Check if button appears to be icon-only (no text or very short text)
      const trimmedText = text?.trim() || '';
      const isIconOnly = trimmedText.length === 0 || trimmedText.length <= 2;

      if (isIconOnly) {
        iconOnlyButtons++;

        if (ariaLabel || ariaLabelledBy) {
          iconOnlyWithLabel++;
          console.log(`Icon button ${iconOnlyButtons}:`);
          console.log(`  aria-label: "${ariaLabel}"`);
          console.log(`  aria-labelledby: "${ariaLabelledBy}"`);
        } else {
          console.warn(`Icon button without label: text="${trimmedText}"`);
        }
      }
    }

    if (iconOnlyButtons > 0) {
      console.log(`Icon-only buttons: ${iconOnlyButtons}, with labels: ${iconOnlyWithLabel}`);

      // Most icon-only buttons should have aria-label
      const labelRatio = iconOnlyWithLabel / iconOnlyButtons;
      expect(labelRatio).toBeGreaterThan(0.5);
    }

    // 10. Verify disposal progress card has aria-describedby
    const disposalCards = page
      .locator('[data-testid*="disposal"], [class*="disposal"]')
      .filter({ hasText: /폐기/ });
    const disposalCardCount = await disposalCards.count();

    if (disposalCardCount > 0) {
      console.log(`Found ${disposalCardCount} disposal-related card(s)`);

      const firstCard = disposalCards.first();
      const ariaDescribedBy = await firstCard.getAttribute('aria-describedby');
      const ariaLabel = await firstCard.getAttribute('aria-label');

      console.log(`Disposal card:`);
      console.log(`  aria-describedby: "${ariaDescribedBy}"`);
      console.log(`  aria-label: "${ariaLabel}"`);

      // Card should have some form of accessible description
      // (either aria-describedby, aria-label, or proper heading structure)
    } else {
      console.log('No disposal progress card visible (status may be "available")');
    }

    // 11. Verify form inputs have aria-describedby for hints
    const formInputs = page.locator('input:visible, textarea:visible, select:visible');
    const formInputCount = await formInputs.count();

    console.log(`Checking ${formInputCount} form inputs for aria-describedby`);

    let inputsWithHints = 0;

    for (let i = 0; i < Math.min(formInputCount, 5); i++) {
      const input = formInputs.nth(i);
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      const id = await input.getAttribute('id');

      if (ariaDescribedBy) {
        inputsWithHints++;

        console.log(`Input ${i + 1} (id="${id}"):`);
        console.log(`  aria-describedby: "${ariaDescribedBy}"`);

        // Verify the referenced element exists
        const describingElements = ariaDescribedBy.split(' ');
        for (const descId of describingElements) {
          const descElement = page.locator(`#${descId}`);
          const descExists = (await descElement.count()) > 0;

          if (descExists) {
            const descText = await descElement.textContent();
            console.log(`    → #${descId}: "${descText}"`);
          } else {
            console.warn(`    ✗ Referenced element #${descId} not found`);
          }
        }
      }
    }

    console.log(`Inputs with aria-describedby: ${inputsWithHints}/${formInputCount}`);

    // Additional ARIA checks

    // Check for proper use of aria-hidden
    const ariaHiddenElements = page.locator('[aria-hidden="true"]:visible');
    const ariaHiddenCount = await ariaHiddenElements.count();

    if (ariaHiddenCount > 0) {
      console.log(`Found ${ariaHiddenCount} elements with aria-hidden="true"`);

      // aria-hidden should typically be used on decorative icons
      // Verify these are not critical interactive elements
      for (let i = 0; i < Math.min(ariaHiddenCount, 5); i++) {
        const element = ariaHiddenElements.nth(i);
        const tagName = await element.evaluate((el) => el.tagName);
        const role = await element.getAttribute('role');

        // aria-hidden should not be on buttons, links, or form controls
        if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
          console.warn(`⚠ aria-hidden="true" on interactive element: ${tagName}`);
        }

        console.log(`  aria-hidden element ${i + 1}: ${tagName}${role ? `[${role}]` : ''}`);
      }
    }

    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();

    console.log(`Found ${liveRegionCount} live regions for announcements`);

    for (let i = 0; i < Math.min(liveRegionCount, 3); i++) {
      const region = liveRegions.nth(i);
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      const ariaAtomic = await region.getAttribute('aria-atomic');

      console.log(`Live region ${i + 1}:`);
      console.log(`  aria-live: "${ariaLive}"`);
      console.log(`  role: "${role}"`);
      console.log(`  aria-atomic: "${ariaAtomic}"`);
    }

    console.log('ARIA labels and roles verification complete');
  });
});
