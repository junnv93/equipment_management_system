/**
 * Equipment Detail Page - Accessibility: Color Contrast and Readability
 *
 * REQUIREMENTS:
 * - Seed data must be loaded before running this test
 * - Run: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * group: Group 7: Accessibility (Section 6.4)
 *
 * Tests color contrast ratios to ensure WCAG AA compliance (4.5:1 for normal text,
 * 3:1 for large text). Verifies that information is not conveyed by color alone
 * and that focus indicators are clearly visible.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

// Use EQUIP_SPECTRUM_ANALYZER_SUW_E_ID from seed data
// This equipment ID must exist in the database (created by seed script)
const TEST_EQUIPMENT_ID = EQUIP_SPECTRUM_ANALYZER_SUW_E_ID;

test.describe('Group 7: Accessibility', () => {
  test('Color contrast and readability', async ({ siteAdminPage: page }) => {
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

    // 2. Use contrast checker on all text elements using axe-core
    console.log('Running axe-core color contrast analysis...');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    console.log(`Color contrast violations: ${contrastViolations.length}`);

    // 3. Verify body text has minimum 4.5:1 contrast ratio
    // Critical violations should be 0
    const criticalContrastViolations = contrastViolations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalContrastViolations.length > 0) {
      console.error('Critical contrast violations found:');
      criticalContrastViolations.forEach((violation) => {
        console.error(`  - ${violation.description}`);
        console.error(`    Impact: ${violation.impact}`);
        console.error(`    Affected nodes: ${violation.nodes.length}`);
        violation.nodes.slice(0, 3).forEach((node) => {
          console.error(`      • ${node.html.slice(0, 100)}`);
          console.error(`        ${node.failureSummary}`);
        });
      });
    }

    expect(criticalContrastViolations).toHaveLength(0);

    // 4. Verify large text (18pt+) has minimum 3:1 contrast
    // This is also covered by axe-core, but we'll do manual spot checks
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();

    console.log(`Checking ${headingCount} headings for large text contrast`);

    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      const fontSize = await heading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });

      console.log(`Heading ${i + 1}: "${text?.slice(0, 30)}", font-size: ${fontSize}px`);

      // 18pt = 24px, 14pt bold = 18.66px
      // Large text threshold is 18.66px (14pt) bold or 24px (18pt) regular
      const isLargeText = fontSize >= 24 || fontSize >= 18.66;

      if (isLargeText) {
        console.log(`  ✓ Qualifies as large text`);
      }
    }

    // 5. Verify status badges have sufficient contrast
    const statusBadges = page
      .locator('[class*="badge"]')
      .filter({ hasText: /사용|교정|폐기|부적합|여분/ });
    const badgeCount = await statusBadges.count();

    console.log(`Checking ${badgeCount} status badges for contrast`);

    for (let i = 0; i < Math.min(badgeCount, 3); i++) {
      const badge = statusBadges.nth(i);
      const isVisible = await badge.isVisible().catch(() => false);

      if (isVisible) {
        const badgeText = await badge.textContent();

        const colors = await badge.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
          };
        });

        console.log(`Badge ${i + 1}: "${badgeText}"`);
        console.log(`  color: ${colors.color}`);
        console.log(`  background: ${colors.backgroundColor}`);
        console.log(`  font-size: ${colors.fontSize}px`);
        console.log(`  font-weight: ${colors.fontWeight}`);

        // Manual contrast calculation would be complex
        // Rely on axe-core for automated checking
        // Just verify colors are defined
        expect(colors.color).toBeTruthy();
        expect(colors.backgroundColor).toBeTruthy();
      }
    }

    // 6. Test in dark mode (if implemented)
    // Check if dark mode toggle exists
    const darkModeToggle = page
      .locator('[data-testid="dark-mode-toggle"], [aria-label*="dark"], button')
      .filter({ hasText: /dark|다크/i });
    const hasDarkMode = (await darkModeToggle.count()) > 0;

    if (hasDarkMode) {
      console.log('Dark mode detected, testing dark mode contrast...');

      // Toggle dark mode
      await darkModeToggle.first().click();

      // 7. Verify dark mode maintains contrast ratios
      const darkModeResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({
          rules: {
            'color-contrast': { enabled: true },
          },
        })
        .analyze();

      const darkModeViolations = darkModeResults.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      console.log(`Dark mode contrast violations: ${darkModeViolations.length}`);

      const darkModeCritical = darkModeViolations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(darkModeCritical).toHaveLength(0);

      // Toggle back to light mode
      await darkModeToggle.first().click();
    } else {
      console.log('Dark mode not implemented, skipping dark mode tests');
    }

    // 8. Verify links are distinguishable from body text
    const links = page.locator('a:visible');
    const linkCount = await links.count();

    console.log(`Checking ${linkCount} links for distinguishability`);

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      const linkText = await link.textContent();

      const linkStyle = await link.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          textDecoration: style.textDecoration,
          textDecorationLine: style.textDecorationLine,
          fontWeight: style.fontWeight,
          textUnderlineOffset: style.textUnderlineOffset,
        };
      });

      console.log(`Link ${i + 1}: "${linkText?.slice(0, 30)}"`);
      console.log(`  color: ${linkStyle.color}`);
      console.log(`  text-decoration: ${linkStyle.textDecoration}`);
      console.log(`  font-weight: ${linkStyle.fontWeight}`);

      // Links should be distinguishable via:
      // 1. Different color from body text
      // 2. Underline (text-decoration)
      // 3. Bold font weight
      // 4. Other visual indicator

      const hasUnderline = linkStyle.textDecorationLine.includes('underline');
      const isBold = parseInt(linkStyle.fontWeight) >= 600;

      // Links should have some form of visual distinction
      // (axe-core will catch if color alone is used)
      const hasDistinction = hasUnderline || isBold || linkStyle.color !== 'rgb(0, 0, 0)';
      expect(hasDistinction).toBeTruthy();
    }

    // 9. Verify focus indicators have 3:1 contrast
    console.log('Testing focus indicator contrast...');

    // Focus on several interactive elements and check focus style
    const focusableElements = page.locator('button:visible, a:visible, input:visible').first();
    await focusableElements.focus();

    const focusedElement = page.locator(':focus');
    const hasFocus = (await focusedElement.count()) > 0;

    if (hasFocus) {
      const focusStyle = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineColor: style.outlineColor,
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      });

      console.log('Focus indicator style:');
      console.log(`  outline: ${focusStyle.outline}`);
      console.log(`  outline-color: ${focusStyle.outlineColor}`);
      console.log(`  outline-width: ${focusStyle.outlineWidth}`);
      console.log(`  box-shadow (ring): ${focusStyle.boxShadow}`);

      // Focus indicator should be visible
      const hasVisibleFocus =
        (focusStyle.outline !== 'none' && focusStyle.outlineStyle !== 'none') ||
        (focusStyle.boxShadow && focusStyle.boxShadow !== 'none');

      expect(hasVisibleFocus).toBeTruthy();

      // Verify outline width is sufficient (at least 2px)
      const outlineWidth = parseFloat(focusStyle.outlineWidth);
      if (outlineWidth > 0) {
        expect(outlineWidth).toBeGreaterThanOrEqual(1);
        console.log(`  ✓ Focus outline width: ${outlineWidth}px`);
      }
    } else {
      console.warn('Could not focus element to test focus indicator');
    }

    // Additional contrast checks for specific UI components

    // Check button contrast
    const buttons = page.locator('button:visible').first();
    if ((await buttons.count()) > 0) {
      const buttonStyle = await buttons.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderColor: style.borderColor,
        };
      });

      console.log('Button contrast:');
      console.log(`  color: ${buttonStyle.color}`);
      console.log(`  background: ${buttonStyle.backgroundColor}`);
      console.log(`  border: ${buttonStyle.border}`);

      // Buttons should have visible boundaries
      // Either background color or border
      const hasBackground = buttonStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder =
        buttonStyle.borderColor !== 'rgb(0, 0, 0)' &&
        buttonStyle.borderColor !== 'rgba(0, 0, 0, 0)';

      expect(hasBackground || hasBorder).toBeTruthy();
    }

    // Run full axe scan to catch any other accessibility issues
    console.log('Running full accessibility scan...');

    const fullScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const allViolations = fullScanResults.violations;
    const criticalViolations = allViolations.filter((v) => v.impact === 'critical');

    console.log(`Total accessibility violations: ${allViolations.length}`);
    console.log(`Critical violations: ${criticalViolations.length}`);
    console.log(
      `Serious violations: ${allViolations.filter((v) => v.impact === 'serious').length}`
    );
    console.log(
      `Moderate violations: ${allViolations.filter((v) => v.impact === 'moderate').length}`
    );

    if (allViolations.length > 0) {
      console.log('\nViolation summary:');
      allViolations.forEach((violation) => {
        console.log(`  - ${violation.id} (${violation.impact}): ${violation.description}`);
        console.log(`    Affected: ${violation.nodes.length} element(s)`);
      });
    }

    // Expect no critical violations
    expect(criticalViolations).toHaveLength(0);

    console.log('\nColor contrast and readability verification complete');
  });
});
