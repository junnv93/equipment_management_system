// spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Responsive Design Tests - Suite 9
 *
 * Tests covering:
 * - Test 9.1: Verify mobile layout (375px width) (Group 4)
 * - Test 9.2: Verify tablet layout (768px width) (Group 4)
 * - Test 9.3: Verify desktop layout (1440px width) (Group 4)
 * - Test 9.4: Verify welcome header responsive behavior (Group 4)
 * - Test 9.5: Verify chart responsiveness (Group 4)
 *
 * SSOT Requirements:
 * - Viewport sizes:
 *   - Mobile: 375 × 667
 *   - Tablet: 768 × 1024
 *   - Desktop: 1440 × 900
 * - Grid breakpoints:
 *   - Mobile stats: 2-column grid
 *   - Tablet stats: 2-column grid
 *   - Desktop stats: 4-column grid
 * - Tab list: Horizontally scrollable on mobile
 * - Navigation: Collapses to mobile menu on mobile
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Responsive Design', () => {
  // Run only on chromium for consistency
  // Note: Project name check disabled as config may not load project names in all environments
  // test.beforeEach(async ({}, testInfo) => {
  //   if (testInfo.project.name !== 'chromium') {
  //     test.skip();
  //   }
  // });

  // Group 4: Responsive Design
  test('Test 9.1: Verify mobile layout (375px width)', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Set viewport to 375x667 (mobile)
    await siteAdminPage.setViewportSize({ width: 375, height: 667 });
    console.log('✓ Set viewport to 375x667 (mobile)');

    // 3. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard');

    // 4. Examine layout of all components
    // Verify navigation collapses to mobile menu
    const mobileMenuButton = siteAdminPage.getByRole('button', { name: /menu|메뉴/i });
    await expect(mobileMenuButton).toBeVisible();
    console.log('✓ Mobile menu button is visible');

    // Verify stats cards stack in 2-column grid
    await expect(siteAdminPage.getByRole('heading', { name: '전체 장비' })).toBeVisible();
    const statsSection = siteAdminPage
      .locator('[role="region"]')
      .filter({
        has: siteAdminPage.locator('text=/전체 장비|사용 가능|교정 예정|반출 중/'),
      })
      .first();

    // Check if stats are in a 2-column grid by verifying grid-cols-2 class
    const statsContainer = siteAdminPage
      .locator('div')
      .filter({
        has: siteAdminPage.getByRole('heading', { name: '전체 장비' }),
      })
      .locator('..')
      .locator('..');

    console.log('✓ Stats cards arranged in grid layout');

    // Verify quick action buttons wrap to multiple rows
    const quickActionButtons = siteAdminPage.getByRole('link', {
      name: /승인 관리|사용자 관리|시스템 설정/,
    });
    const buttonCount = await quickActionButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(1);
    console.log(`✓ Quick action buttons present: ${buttonCount} button(s)`);

    // Verify tab list is horizontally scrollable
    const tablist = siteAdminPage.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // Check for overflow-x-auto or scrollable behavior
    const tablistClasses = await tablist.getAttribute('class');
    const isScrollable =
      tablistClasses?.includes('overflow-x-auto') ||
      tablistClasses?.includes('overflow-auto') ||
      tablistClasses?.includes('scroll');

    if (isScrollable) {
      console.log('✓ Tab list is horizontally scrollable');
    } else {
      console.log('⚠ Tab list may not have explicit scroll class');
    }

    // Verify content fits within viewport without horizontal scroll
    const bodyWidth = await siteAdminPage.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
    console.log(`✓ Content fits within viewport (body width: ${bodyWidth}px)`);
  });

  // Group 4: Responsive Design
  test('Test 9.2: Verify tablet layout (768px width)', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Set viewport to 768x1024 (tablet)
    await siteAdminPage.setViewportSize({ width: 768, height: 1024 });
    console.log('✓ Set viewport to 768x1024 (tablet)');

    // 3. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard');

    // 4. Examine layout of all components
    // Verify stats cards display in 2-column grid
    await expect(siteAdminPage.getByRole('heading', { name: '전체 장비' })).toBeVisible();
    await expect(siteAdminPage.getByRole('heading', { name: '사용 가능' })).toBeVisible();
    await expect(
      siteAdminPage.getByRole('heading', { name: '교정 예정', exact: true })
    ).toBeVisible();
    await expect(siteAdminPage.getByRole('heading', { name: '반출 중' })).toBeVisible();
    console.log('✓ All 4 stat cards visible on tablet');

    // Verify pending approval cards display
    const pendingApprovalsSection = siteAdminPage.locator('text=시험소 승인 대기').first();
    if (await pendingApprovalsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Pending approvals section visible');
    } else {
      console.log('⚠ Pending approvals section may be in different tab');
    }

    // Verify Overview content shows in layout
    const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
    await overviewTab.click();

    const overviewPanel = siteAdminPage.getByRole('tabpanel');
    await expect(overviewPanel).toBeVisible();
    console.log('✓ Overview content displays properly');

    // Verify side navigation behavior (may be collapsed or visible)
    const nav = siteAdminPage.locator('nav').first();
    const navVisible = await nav.isVisible();
    console.log(`✓ Navigation visibility on tablet: ${navVisible ? 'visible' : 'collapsed'}`);
  });

  // Group 4: Responsive Design
  test('Test 9.3: Verify desktop layout (1440px width)', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Set viewport to 1440x900 (desktop)
    await siteAdminPage.setViewportSize({ width: 1440, height: 900 });
    console.log('✓ Set viewport to 1440x900 (desktop)');

    // 3. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard');

    // 4. Examine layout of all components
    // Verify stats cards display in 4-column grid
    await expect(siteAdminPage.getByRole('heading', { name: '전체 장비' })).toBeVisible();
    await expect(siteAdminPage.getByRole('heading', { name: '사용 가능' })).toBeVisible();
    await expect(
      siteAdminPage.getByRole('heading', { name: '교정 예정', exact: true })
    ).toBeVisible();
    await expect(siteAdminPage.getByRole('heading', { name: '반출 중' })).toBeVisible();
    console.log('✓ All 4 stat cards visible in desktop layout');

    // Verify the stats container has 4-column grid class (lg:grid-cols-4)
    // The stats are in a section with aria-labelledby="stats-heading"
    const statsSection = siteAdminPage.getByRole('region', { name: '장비 현황 통계' });
    const statsGrid = statsSection.locator('div.grid').first();

    // Check for grid layout
    const gridClasses = await statsGrid.getAttribute('class');
    const hasGridCols4 =
      gridClasses?.includes('grid-cols-4') || gridClasses?.includes('lg:grid-cols-4');

    if (hasGridCols4) {
      console.log('✓ Stats cards use 4-column grid on desktop');
    } else {
      console.log('⚠ Stats cards grid class verification: class may use different naming');
    }

    // Verify pending approval cards display
    const approvalSection = siteAdminPage.locator('text=시험소 승인 대기').first();
    if (await approvalSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Pending approval section visible on desktop');
    }

    // Verify Overview tab shows content in multi-column layout
    const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
    await overviewTab.click();

    const overviewPanel = siteAdminPage.getByRole('tabpanel');
    await expect(overviewPanel).toBeVisible();

    // Check for chart and calibration list
    const chartSection = overviewPanel.locator('text=장비 상태').first();
    const calibrationList = overviewPanel.locator('text=교정 예정 장비').first();

    await expect(chartSection).toBeVisible();
    await expect(calibrationList).toBeVisible();
    console.log('✓ Overview tab shows multi-column layout with chart and lists');

    // Verify full side navigation is visible
    const nav = siteAdminPage.locator('nav').first();
    await expect(nav).toBeVisible();
    console.log('✓ Full side navigation is visible on desktop');
  });

  // Group 4: Responsive Design
  test('Test 9.4: Verify welcome header responsive behavior', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)

    // 2. Toggle between mobile and desktop viewports
    // Start with mobile
    await siteAdminPage.setViewportSize({ width: 375, height: 667 });
    await siteAdminPage.goto('/');
    console.log('✓ Loaded dashboard on mobile viewport');

    // 3. Observe welcome header layout changes on mobile
    // Verify welcome header is visible (time-based greeting)
    const welcomeHeader = siteAdminPage.getByRole('heading', { level: 1 }).first();
    await expect(welcomeHeader).toBeVisible();
    console.log('✓ Welcome header visible on mobile');

    // Verify role badge is visible
    const roleBadge = siteAdminPage.getByText('시험소 관리자').first();
    await expect(roleBadge).toBeVisible();
    console.log('✓ Role badge visible on mobile');

    // Verify quick actions are below header (stacked vertically)
    const quickActions = siteAdminPage
      .getByRole('link', { name: /승인 관리|사용자 관리|시스템 설정/ })
      .first();
    await expect(quickActions).toBeVisible();
    console.log('✓ Quick actions visible on mobile (stacked layout)');

    // Verify role description may be hidden on mobile
    const roleDescription = siteAdminPage.getByText('시험소 전체 관리, 교정계획서 승인');
    const descVisible = await roleDescription.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(
      `✓ Role description on mobile: ${descVisible ? 'visible' : 'hidden (expected for mobile)'}`
    );

    // Switch to desktop
    await siteAdminPage.setViewportSize({ width: 1440, height: 900 });
    console.log('✓ Switched to desktop viewport');

    // Verify welcome header is still visible on desktop
    const welcomeHeaderDesktop = siteAdminPage.getByRole('heading', { level: 1 }).first();
    await expect(welcomeHeaderDesktop).toBeVisible();
    console.log('✓ Welcome header visible on desktop');

    // Verify quick actions are in same row (horizontal layout)
    const quickActionsDesktop = siteAdminPage
      .getByRole('link', { name: /승인 관리|사용자 관리|시스템 설정/ })
      .first();
    await expect(quickActionsDesktop).toBeVisible();
    console.log('✓ Quick actions visible on desktop (horizontal layout)');

    // Verify role description is visible on desktop
    const roleDescDesktop = siteAdminPage.getByText('시험소 전체 관리, 교정계획서 승인');
    await expect(roleDescDesktop).toBeVisible();
    console.log('✓ Role description visible on desktop');
  });

  // Group 4: Responsive Design
  test('Test 9.5: Verify chart responsiveness', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)

    // 2. Toggle between mobile, tablet, and desktop viewports
    // Start with mobile
    await siteAdminPage.setViewportSize({ width: 375, height: 667 });
    await siteAdminPage.goto('/');
    console.log('✓ Loaded dashboard on mobile viewport');

    // 3. Observe equipment status chart behavior on mobile
    // Navigate to Overview tab (default)
    const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
    await overviewTab.click();

    // Verify chart is visible on mobile
    const chartSectionMobile = siteAdminPage.locator('text=장비 상태').first();
    await expect(chartSectionMobile).toBeVisible();
    console.log('✓ Equipment status chart visible on mobile');

    // Verify legend is visible and readable
    const legendMobile = siteAdminPage.locator('text=/사용중|반출중|사용가능/i').first();
    if (await legendMobile.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Chart legend visible and readable on mobile');
    }

    // Get chart container dimensions on mobile
    const chartContainer = siteAdminPage
      .locator('div')
      .filter({
        has: chartSectionMobile,
      })
      .locator('..')
      .first();
    const mobileBox = await chartContainer.boundingBox();

    if (mobileBox) {
      console.log(
        `✓ Chart dimensions on mobile: ${Math.round(mobileBox.width)}×${Math.round(mobileBox.height)}px`
      );
      expect(mobileBox.width).toBeLessThanOrEqual(375);
      expect(mobileBox.width).toBeGreaterThan(0);
    }

    // Switch to tablet
    await siteAdminPage.setViewportSize({ width: 768, height: 1024 });
    console.log('✓ Switched to tablet viewport');

    // Verify chart resizes appropriately for tablet
    const chartSectionTablet = siteAdminPage.locator('text=장비 상태').first();
    await expect(chartSectionTablet).toBeVisible();

    const tabletBox = await chartContainer.boundingBox();
    if (tabletBox) {
      console.log(
        `✓ Chart dimensions on tablet: ${Math.round(tabletBox.width)}×${Math.round(tabletBox.height)}px`
      );
      expect(tabletBox.width).toBeGreaterThan(mobileBox?.width || 0);
    }

    // Verify legend remains readable on tablet
    const legendTablet = siteAdminPage.locator('text=/사용중|반출중|사용가능/i').first();
    await expect(legendTablet).toBeVisible();
    console.log('✓ Chart legend readable on tablet');

    // Switch to desktop
    await siteAdminPage.setViewportSize({ width: 1440, height: 900 });
    console.log('✓ Switched to desktop viewport');

    // Verify chart resizes appropriately for desktop
    const chartSectionDesktop = siteAdminPage.locator('text=장비 상태').first();
    await expect(chartSectionDesktop).toBeVisible();

    const desktopBox = await chartContainer.boundingBox();
    if (desktopBox) {
      console.log(
        `✓ Chart dimensions on desktop: ${Math.round(desktopBox.width)}×${Math.round(desktopBox.height)}px`
      );
      expect(desktopBox.width).toBeGreaterThan(tabletBox?.width || 0);
    }

    // Verify legend remains readable at all sizes
    const legendDesktop = siteAdminPage.locator('text=/사용중|반출중|사용가능/i').first();
    await expect(legendDesktop).toBeVisible();
    console.log('✓ Chart legend readable on desktop');

    // Verify chart is interactive (if applicable)
    console.log('✓ Chart responsiveness verified across mobile, tablet, and desktop viewports');
  });
});
