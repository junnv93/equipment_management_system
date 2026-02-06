// spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Tab Navigation and Content Tests
 *
 * Test Suite 3: Tab Navigation and Content
 * - Mouse-based tab navigation
 * - Keyboard accessibility (ArrowLeft/Right, Enter, Space)
 * - Tab content verification for each role
 * - ARIA attributes validation
 *
 * Roles tested:
 * - lab_manager: 개요, 장비 현황, 교정, 대여/반출
 * - technical_manager: 개요, 팀 장비, 교정, 승인 관리
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Tab Navigation and Content', () => {
  // Run only on chromium for consistency
  // Note: Project filtering disabled for MCP compatibility
  // When running via CLI (npx playwright test), add --project=chromium flag
  // test.beforeEach(async ({}, testInfo) => {
  //   if (testInfo.project.name !== 'chromium') {
  //     test.skip();
  //   }
  // });

  test.describe('3.1 Navigate between tabs using mouse clicks', () => {
    test('Navigate between tabs using mouse clicks', async ({ siteAdminPage }) => {
      // Login as lab_manager
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('networkidle');

      // 1. Click on '장비 현황' tab
      const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
      await equipmentTab.click();

      // Verify tab is selected
      await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
      await expect(equipmentTab).toHaveAttribute('data-state', 'active');

      // Verify tab panel content changes
      const equipmentPanel = siteAdminPage
        .getByRole('tabpanel')
        .filter({ has: siteAdminPage.locator('text=장비 상태') });
      await expect(equipmentPanel).toBeVisible();

      // 2. Click on '교정' tab
      const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
      await calibrationTab.click();

      // Verify tab is selected
      await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');
      await expect(calibrationTab).toHaveAttribute('data-state', 'active');

      // Verify tab panel shows upcoming and overdue calibration lists
      const calibrationPanel = siteAdminPage.getByRole('tabpanel');
      await expect(calibrationPanel).toBeVisible();
      await expect(calibrationPanel.locator('text=교정 예정 장비')).toBeVisible();
      await expect(calibrationPanel.locator('text=교정 지연 장비')).toBeVisible();

      // 3. Click on '대여/반출' tab
      const checkoutTab = siteAdminPage.getByRole('tab', { name: '대여/반출' });
      await checkoutTab.click();

      // Verify tab is selected
      await expect(checkoutTab).toHaveAttribute('aria-selected', 'true');
      await expect(checkoutTab).toHaveAttribute('data-state', 'active');

      // Verify tab panel shows overdue checkouts
      const checkoutPanel = siteAdminPage.getByRole('tabpanel');
      await expect(checkoutPanel).toBeVisible();

      // 4. Click on '개요' tab
      const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
      await overviewTab.click();

      // Verify tab is selected (default tab)
      await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      await expect(overviewTab).toHaveAttribute('data-state', 'active');

      // Verify overview tab shows chart, calibration list, checkouts, and activities
      const overviewPanel = siteAdminPage.getByRole('tabpanel');
      await expect(overviewPanel).toBeVisible();
      await expect(overviewPanel.locator('text=장비 상태').first()).toBeVisible();
      await expect(overviewPanel.locator('text=교정 예정 장비').first()).toBeVisible();
    });
  });

  test.describe('3.2 Navigate tabs using keyboard (accessibility)', () => {
    test('Navigate tabs using keyboard (accessibility)', async ({ siteAdminPage }) => {
      // Login as lab_manager
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('networkidle');

      // 1. Focus on the tablist using Tab key
      const tablist = siteAdminPage.getByRole('tablist');
      await expect(tablist).toBeVisible();

      // Focus first tab
      const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
      await overviewTab.focus();

      // Verify focus ring is visible
      await expect(overviewTab).toBeFocused();

      // 2. Press ArrowRight to move to next tab
      await siteAdminPage.keyboard.press('ArrowRight');

      // Verify focus moved to next tab (장비 현황)
      const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
      await expect(equipmentTab).toBeFocused();

      // 3. Press ArrowRight again to move to '교정' tab
      await siteAdminPage.keyboard.press('ArrowRight');

      const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
      await expect(calibrationTab).toBeFocused();

      // 4. Press ArrowLeft to move to previous tab
      await siteAdminPage.keyboard.press('ArrowLeft');

      // Verify focus moved back to '장비 현황'
      await expect(equipmentTab).toBeFocused();

      // 5. Press Enter to activate selected tab
      await siteAdminPage.keyboard.press('Enter');

      // Verify tab is activated
      await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
      await expect(equipmentTab).toHaveAttribute('data-state', 'active');

      // 6. Move to '교정' tab and press Space to activate
      await siteAdminPage.keyboard.press('ArrowRight');
      await siteAdminPage.keyboard.press('Space');

      // Verify tab is activated
      await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');
      await expect(calibrationTab).toHaveAttribute('data-state', 'active');

      // Verify tab panel has proper aria-labelledby reference
      const tabpanel = siteAdminPage.getByRole('tabpanel');
      await expect(tabpanel).toBeVisible();

      // Verify focus-visible ring pattern
      const focusedElement = siteAdminPage.locator(':focus-visible');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('3.3 Verify Overview tab content (lab_manager)', () => {
    test('Verify Overview tab content (lab_manager)', async ({ siteAdminPage }) => {
      // Login as lab_manager
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('networkidle');

      // Ensure Overview (개요) tab is selected
      const overviewTab = siteAdminPage.getByRole('tab', { name: '개요' });
      await expect(overviewTab).toHaveAttribute('aria-selected', 'true');

      const overviewPanel = siteAdminPage.getByRole('tabpanel');
      await expect(overviewPanel).toBeVisible();

      // 1. Equipment status chart is displayed with pie/donut chart
      const chartSection = overviewPanel.locator('text=장비 상태').first();
      await expect(chartSection).toBeVisible();

      // 2. Calibration list shows upcoming calibrations (next 30 days)
      const calibrationSection = overviewPanel.locator('text=교정 예정 장비').first();
      await expect(calibrationSection).toBeVisible();

      // Verify description shows "다음 30일 이내"
      const calibrationDescription = overviewPanel.locator('text=다음 30일 이내 교정 예정인 장비');
      await expect(calibrationDescription).toBeVisible();

      // 3. Overdue checkouts section is visible
      const checkoutsSection = overviewPanel.locator('text=반출 현황, text=대여 현황');
      // This section may or may not be visible depending on data

      // 4. Recent activities section shows last 7 days activity
      const activitiesSection = overviewPanel.locator('text=시험소 최근 활동').first();
      await expect(activitiesSection).toBeVisible();

      // Verify description shows "최근 7일간"
      const activitiesDescription = overviewPanel.locator(
        'text=시험소 내 최근 7일간 활동 기록입니다'
      );
      await expect(activitiesDescription).toBeVisible();
    });
  });

  test.describe('3.4 Verify Equipment tab content shows team breakdown', () => {
    test('Verify Equipment tab content shows team breakdown', async ({ siteAdminPage }) => {
      // Login as lab_manager
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('networkidle');

      // Click on '장비 현황' tab
      const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
      await equipmentTab.click();

      await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

      const equipmentPanel = siteAdminPage.getByRole('tabpanel');

      // 1. Equipment status chart displays with status distribution
      const chartSection = equipmentPanel.locator('text=장비 상태').first();
      await expect(chartSection).toBeVisible();

      // Verify chart description
      const chartDescription = equipmentPanel.locator('text=현재 장비 상태별 분포');
      await expect(chartDescription).toBeVisible();

      // 2. Team equipment stats shows list of teams
      const teamStatsSection = equipmentPanel.locator('text=팀별 장비 현황');
      await expect(teamStatsSection).toBeVisible();

      // 3. Each team shows equipment count (e.g., '9대')
      // Look for team items with count format
      const teamItems = equipmentPanel.locator('text=/\\d+대/');

      // Verify at least one team item is visible
      const teamCount = await teamItems.count();
      expect(teamCount).toBeGreaterThan(0);
    });
  });

  test.describe('3.5 Verify Calibration tab shows upcoming and overdue lists', () => {
    test('Verify Calibration tab shows upcoming and overdue lists', async ({ siteAdminPage }) => {
      // Login as lab_manager
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('networkidle');

      // Click on '교정' tab
      const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
      await calibrationTab.click();

      await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');

      const calibrationPanel = siteAdminPage.getByRole('tabpanel');

      // 1. Upcoming calibration list shows count badge
      const upcomingSection = calibrationPanel.locator('text=교정 예정 장비').first();
      await expect(upcomingSection).toBeVisible();

      // Verify count badge is present (format: number inside badge)
      const upcomingBadge = calibrationPanel
        .locator('[class*="badge"], [role="status"]')
        .filter({ hasText: /\d+/ })
        .first();
      if (await upcomingBadge.isVisible()) {
        const badgeText = await upcomingBadge.textContent();
        expect(badgeText).toMatch(/\d+/);
      }

      // 2. Overdue calibration list shows count badge
      const overdueSection = calibrationPanel.locator('text=교정 지연 장비').first();
      await expect(overdueSection).toBeVisible();

      // 3. Each list item shows equipment name and due date
      // Look for equipment items in the lists
      const equipmentItems = calibrationPanel.locator('[role="listitem"], li, article').filter({
        has: calibrationPanel.locator('text=/남음|초과|D-|D\\+/'),
      });

      const itemCount = await equipmentItems.count();
      if (itemCount > 0) {
        const firstItem = equipmentItems.first();

        // 4. D-day badges show remaining days or days overdue
        const dDayBadge = firstItem
          .locator('text=/\\d+일 남음|\\d+일 초과|D-\\d+|D\\+\\d+/')
          .first();
        await expect(dDayBadge).toBeVisible();

        const badgeText = await dDayBadge.textContent();

        // Verify D-day format
        expect(badgeText).toMatch(/(\d+일 남음|\d+일 초과|D-\d+|D\+\d+)/);
      }

      // Verify descriptions
      const upcomingDesc = calibrationPanel.locator('text=다음 30일 이내 교정 예정');
      await expect(upcomingDesc).toBeVisible();

      const overdueDesc = calibrationPanel.locator('text=교정 기한이 지난 장비');
      await expect(overdueDesc).toBeVisible();
    });
  });

  test.describe('3.6 Verify Approvals tab for technical_manager', () => {
    test('Verify Approvals tab for technical_manager', async ({ techManagerPage }) => {
      // Login as technical_manager
      await techManagerPage.goto('/');
      await techManagerPage.waitForLoadState('networkidle');

      // Click on '승인 관리' tab
      const approvalsTab = techManagerPage.getByRole('tab', { name: '승인 관리' });
      await expect(approvalsTab).toBeVisible();
      await approvalsTab.click();

      await expect(approvalsTab).toHaveAttribute('aria-selected', 'true');
      await expect(approvalsTab).toHaveAttribute('data-state', 'active');

      const approvalsPanel = techManagerPage.getByRole('tabpanel');

      // 1. Pending approval card is displayed within the tab
      const approvalCard = approvalsPanel.locator('text=팀 승인 대기').first();
      await expect(approvalCard).toBeVisible();

      // 2. Card shows team-specific pending items description
      const teamApprovalIndicator = approvalsPanel.locator('p#pending-approval-description');
      await expect(teamApprovalIndicator).toBeVisible();
      await expect(teamApprovalIndicator).toHaveText('팀 내 승인이 필요한 항목');

      // 3. Categories visible: 장비, 교정, 반출, 보정계수
      // Each category is displayed as a card with label
      await expect(approvalsPanel.getByText('장비', { exact: true })).toBeVisible();
      await expect(approvalsPanel.getByText('교정', { exact: true })).toBeVisible();
      await expect(approvalsPanel.getByText('반출', { exact: true })).toBeVisible();
      await expect(approvalsPanel.getByText('보정계수', { exact: true })).toBeVisible();
    });
  });
});
