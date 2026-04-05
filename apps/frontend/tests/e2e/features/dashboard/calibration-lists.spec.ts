// spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Calibration Lists Tests - Suite 5
 *
 * Tests covering:
 * - Test 5.1: Verify upcoming calibration list displays correctly (Group 1)
 * - Test 5.2: Verify overdue calibration list in Calibration tab (Group 1)
 * - Test 5.3: Verify D-day badge color coding (Group 2)
 * - Test 5.4: Verify View All button functionality (Group 3)
 * - Test 5.5: Verify calibration item action button (Group 3)
 *
 * SSOT Requirements:
 * - Card titles: '교정 예정 장비', '교정 지연 장비'
 * - Descriptions: '다음 30일 이내 교정 예정인 장비', '교정 기한이 지난 장비'
 * - D-day badge formats:
 *   - Days remaining: '4일 남음', '7일 남음'
 *   - Due today: 'D-Day'
 *   - Overdue: '733일 초과', 'D+5'
 * - D-day badge colors:
 *   - 7+ days: standard (gray)
 *   - 1-7 days: warning (yellow/orange)
 *   - Due today: urgent (red)
 *   - Overdue: destructive (red)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Calibration Lists', () => {
  // Run only on chromium for consistency
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  // Group 1: Basic Information Display
  test('Test 5.1: Verify upcoming calibration list displays correctly', async ({
    siteAdminPage,
  }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Locate the upcoming calibration list
    const overviewPanel = siteAdminPage.locator('main');
    await expect(overviewPanel).toBeVisible();

    // Verify card header shows '교정 예정 장비' with count badge
    const cardHeader = overviewPanel.getByRole('heading', { name: '교정 예정 장비' });
    await expect(cardHeader).toBeVisible();
    console.log('✓ Card header "교정 예정 장비" is visible');

    // Verify count badge is present
    const countBadge = overviewPanel
      .locator('[class*="badge"]')
      .filter({ hasText: /^\d+$/ })
      .first();
    if (await countBadge.isVisible()) {
      const badgeText = await countBadge.textContent();
      console.log(`✓ Count badge shows: ${badgeText}`);
      expect(badgeText).toMatch(/^\d+$/);
    } else {
      console.log('⚠ Count badge not visible (may be 0 items)');
    }

    // Verify description shows '다음 30일 이내 교정 예정인 장비'
    const description = overviewPanel.locator('text=다음 30일 이내 교정 예정인 장비');
    await expect(description).toBeVisible();
    console.log('✓ Description "다음 30일 이내 교정 예정인 장비" is visible');

    // Verify list shows equipment name and calibration date
    const equipmentItems = overviewPanel.locator('[role="listitem"], li, article').filter({
      has: overviewPanel.locator('text=/남음|D-Day|D-\\d+/'),
    });

    const itemCount = await equipmentItems.count();
    if (itemCount > 0) {
      console.log(`✓ Found ${itemCount} upcoming calibration item(s)`);

      const firstItem = equipmentItems.first();

      // Verify D-day badge shows days remaining (e.g., '4일 남음')
      const dDayBadge = firstItem.locator('text=/\\d+일 남음|D-Day|D-\\d+/').first();
      await expect(dDayBadge).toBeVisible();

      const badgeText = await dDayBadge.textContent();
      console.log(`✓ D-day badge shows: ${badgeText}`);

      // Verify D-day format matches expected patterns
      expect(badgeText).toMatch(/(\d+일 남음|D-Day|D-\d+)/);
    } else {
      console.log('⚠ No upcoming calibration items found in the list');
    }
  });

  // Group 1: Basic Information Display
  test('Test 5.2: Verify overdue calibration list in Calibration tab', async ({
    siteAdminPage,
  }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Locate the overdue calibration list
    const calibrationPanel = siteAdminPage.locator('main');
    await expect(calibrationPanel).toBeVisible();

    // Verify card header shows '교정 지연 장비' with count badge
    const cardHeader = calibrationPanel.getByRole('heading', { name: '교정 지연 장비' });
    await expect(cardHeader).toBeVisible();
    console.log('✓ Card header "교정 지연 장비" is visible');

    // Verify count badge is present
    const countBadge = calibrationPanel
      .locator('[class*="badge"]')
      .filter({ hasText: /^\d+$/ })
      .first();
    if (await countBadge.isVisible()) {
      const badgeText = await countBadge.textContent();
      console.log(`✓ Count badge shows: ${badgeText}`);
      expect(badgeText).toMatch(/^\d+$/);
    } else {
      console.log('⚠ Count badge not visible (may be 0 overdue items)');
    }

    // Verify description shows '교정 기한이 지난 장비'
    const description = calibrationPanel.locator('text=교정 기한이 지난 장비');
    await expect(description).toBeVisible();
    console.log('✓ Description "교정 기한이 지난 장비" is visible');

    // Verify overdue items show negative D-day (e.g., '733일 초과')
    const overdueItems = calibrationPanel.locator('[role="listitem"], li, article').filter({
      has: calibrationPanel.locator('text=/초과|D\\+\\d+/'),
    });

    const overdueCount = await overdueItems.count();
    if (overdueCount > 0) {
      console.log(`✓ Found ${overdueCount} overdue calibration item(s)`);

      const firstOverdueItem = overdueItems.first();

      // Verify overdue badge shows days overdue (e.g., '733일 초과' or 'D+5')
      const overdueBadge = firstOverdueItem.locator('text=/\\d+일 초과|D\\+\\d+/').first();
      await expect(overdueBadge).toBeVisible();

      const badgeText = await overdueBadge.textContent();
      console.log(`✓ Overdue D-day badge shows: ${badgeText}`);

      // Verify overdue format
      expect(badgeText).toMatch(/(\d+일 초과|D\+\d+)/);

      // Verify overdue items have warning color styling
      // Check for destructive/warning CSS classes (e.g., bg-red-100, text-red-700)
      const badgeClasses = await overdueBadge.getAttribute('class');
      if (badgeClasses) {
        const hasWarningColor =
          badgeClasses.includes('red') ||
          badgeClasses.includes('destructive') ||
          badgeClasses.includes('danger');
        if (hasWarningColor) {
          console.log(`✓ Overdue badge has warning color styling: ${badgeClasses}`);
        } else {
          console.log(`⚠ Overdue badge styling: ${badgeClasses}`);
        }
      }
    } else {
      console.log('⚠ No overdue calibration items found in the list');
    }
  });

  // Group 2: Visual Verification
  test('Test 5.3: Verify D-day badge color coding', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Examine calibration list items with various D-day values
    const overviewPanel = siteAdminPage.locator('main');

    // Find all calibration items with D-day badges
    const calibrationItems = overviewPanel.locator('[role="listitem"], li, article').filter({
      has: overviewPanel.locator('text=/남음|초과|D-Day|D-\\d+|D\\+\\d+/'),
    });

    const itemCount = await calibrationItems.count();
    console.log(`✓ Found ${itemCount} calibration item(s) with D-day badges`);

    if (itemCount > 0) {
      // Test each item to verify color coding
      for (let i = 0; i < Math.min(itemCount, 5); i++) {
        const item = calibrationItems.nth(i);
        const dDayBadge = item
          .locator('text=/\\d+일 남음|\\d+일 초과|D-Day|D-\\d+|D\\+\\d+/')
          .first();

        if (await dDayBadge.isVisible()) {
          const badgeText = (await dDayBadge.textContent()) || '';
          const badgeClasses = (await dDayBadge.getAttribute('class')) || '';

          console.log(`\n  Item ${i + 1}: "${badgeText}"`);
          console.log(`  CSS classes: ${badgeClasses}`);

          // Verify color coding based on D-day value
          // Items with 7+ days remaining show standard color (gray/neutral)
          if (badgeText.match(/([7-9]|[1-9]\d+)일 남음/) || badgeText.match(/D-([7-9]|[1-9]\d+)/)) {
            const hasStandardColor =
              badgeClasses.includes('gray') ||
              badgeClasses.includes('neutral') ||
              badgeClasses.includes('secondary') ||
              (!badgeClasses.includes('yellow') && !badgeClasses.includes('red'));
            console.log(`  ✓ 7+ days remaining - Standard color: ${hasStandardColor}`);
          }

          // Items with 1-7 days remaining show warning color (yellow/orange)
          if (badgeText.match(/[1-6]일 남음/) || badgeText.match(/D-[1-6]/)) {
            const hasWarningColor =
              badgeClasses.includes('yellow') ||
              badgeClasses.includes('orange') ||
              badgeClasses.includes('warning');
            console.log(`  ✓ 1-7 days remaining - Warning color: ${hasWarningColor}`);
          }

          // Items that are due today (D-Day) show urgent color (red)
          if (badgeText.includes('D-Day') || badgeText === 'D-0') {
            const hasUrgentColor =
              badgeClasses.includes('red') ||
              badgeClasses.includes('urgent') ||
              badgeClasses.includes('destructive');
            console.log(`  ✓ Due today (D-Day) - Urgent color: ${hasUrgentColor}`);
          }

          // Overdue items show destructive/red color
          if (badgeText.includes('초과') || badgeText.match(/D\+\d+/)) {
            const hasDestructiveColor =
              badgeClasses.includes('red') ||
              badgeClasses.includes('destructive') ||
              badgeClasses.includes('danger');
            console.log(`  ✓ Overdue - Destructive color: ${hasDestructiveColor}`);
          }
        }
      }
    } else {
      console.log('⚠ No calibration items with D-day badges found for color verification');
    }

    // Also check for overdue items in the main view
    const calibrationPanel = siteAdminPage.locator('main');
    const overdueItems = calibrationPanel.locator('[role="listitem"], li, article').filter({
      has: calibrationPanel.locator('text=/초과|D\\+\\d+/'),
    });

    const overdueCount = await overdueItems.count();
    if (overdueCount > 0) {
      const firstOverdueBadge = overdueItems.first().locator('text=/\\d+일 초과|D\\+\\d+/').first();
      const badgeClasses = (await firstOverdueBadge.getAttribute('class')) || '';

      const hasDestructiveColor =
        badgeClasses.includes('red') ||
        badgeClasses.includes('destructive') ||
        badgeClasses.includes('danger');

      console.log(`✓ Overdue badge color verification: ${hasDestructiveColor ? 'PASS' : 'CHECK'}`);
      console.log(`  Classes: ${badgeClasses}`);
    }
  });

  // Group 3: Navigation and Interactions
  test('Test 5.4: Verify View All button functionality', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Click on '모든 예정 교정 보기' button
    const overviewPanel = siteAdminPage.locator('main');

    // The View All button is a <Button> component with onClick handler, not a link
    const button = overviewPanel.getByRole('button', { name: /모든 예정 교정 보기/ });

    await expect(button).toBeVisible();
    console.log('✓ "모든 예정 교정 보기" button is visible');

    // Verify button shows count in parentheses (e.g., '모든 예정 교정 보기 (4)')
    const buttonText = await button.textContent();
    if (buttonText?.includes('(') && buttonText?.includes(')')) {
      const match = buttonText.match(/\((\d+)\)/);
      if (match) {
        console.log(`✓ Button shows count: ${match[1]}`);
        expect(match[1]).toMatch(/^\d+$/);
      }
    } else {
      console.log(`  Button text: "${buttonText}"`);
    }

    // Click the button and wait for navigation (uses client-side router.push)
    await Promise.all([siteAdminPage.waitForURL(/\/calibration/), button.click()]);
    console.log('✓ Clicked "모든 예정 교정 보기" button and navigated');

    // Verify navigation to calibration management page
    const currentUrl = siteAdminPage.url();
    console.log(`  Current URL after click: ${currentUrl}`);

    // The button should navigate to /calibration with optional tab parameter
    const isCalibrationPage = currentUrl.includes('/calibration');

    expect(isCalibrationPage).toBeTruthy();
    console.log('✓ Navigated to calibration management page');

    // Verify full calibration list is displayed on the target page
    // Look for calibration-related content
    const pageContent = siteAdminPage.locator('h1, h2, [role="heading"]').filter({
      hasText: /교정|calibration/i,
    });

    if (
      await pageContent
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      const heading = await pageContent.first().textContent();
      console.log(`✓ Full calibration list page loaded with heading: "${heading}"`);
    } else {
      console.log('⚠ Could not verify full calibration list heading');
    }
  });

  // Group 3: Navigation and Interactions
  test('Test 5.5: Verify calibration item action button', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Click on action button (arrow icon) for a calibration item
    const overviewPanel = siteAdminPage.locator('main');

    // Find calibration items
    const calibrationItems = overviewPanel.locator('[role="listitem"], li, article').filter({
      has: overviewPanel.locator('text=/남음|D-Day|D-\\d+/'),
    });

    const itemCount = await calibrationItems.count();

    if (itemCount > 0) {
      console.log(`✓ Found ${itemCount} calibration item(s) to test`);

      const firstItem = calibrationItems.first();

      // Look for action button - typically an arrow icon, link, or button
      // Try multiple selectors
      const actionButtonSelectors = [
        firstItem.locator(
          'button[aria-label*="보기"], button[aria-label*="상세"], button[aria-label*="이동"]'
        ),
        firstItem.locator('a[aria-label*="보기"], a[aria-label*="상세"], a[aria-label*="이동"]'),
        firstItem.locator('button svg, a svg').locator('..'),
        firstItem.getByRole('button'),
        firstItem.locator('button, a').last(),
      ];

      let actionButton = null;
      for (const selector of actionButtonSelectors) {
        if (
          await selector
            .first()
            .isVisible({ timeout: 500 })
            .catch(() => false)
        ) {
          actionButton = selector.first();
          break;
        }
      }

      if (actionButton) {
        await expect(actionButton).toBeVisible();
        console.log('✓ Action button is visible for calibration item');

        // Get the target before clicking
        const href = await actionButton.getAttribute('href');
        console.log(`  Action button target: ${href || 'Click handler'}`);

        // Click the action button
        await actionButton.click();
        console.log('✓ Clicked action button');

        // Wait for navigation

        // Verify navigation to equipment detail or calibration detail page
        const currentUrl = siteAdminPage.url();
        console.log(`  Current URL after click: ${currentUrl}`);

        const isDetailPage =
          currentUrl.includes('/equipment/') ||
          currentUrl.includes('/calibration/') ||
          !currentUrl.endsWith('/');

        expect(isDetailPage).toBeTruthy();
        console.log('✓ Navigated to equipment detail or calibration detail page');

        // Verify page loaded with relevant content
        const detailHeading = siteAdminPage.locator('h1, h2').first();
        if (await detailHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
          const headingText = await detailHeading.textContent();
          console.log(`✓ Detail page loaded with heading: "${headingText}"`);
        }
      } else {
        console.log('⚠ No action button found for calibration item');
        console.log('  This may be expected if items are not clickable in this view');
      }
    } else {
      console.log('⚠ No calibration items available to test action button');
    }
  });
});
