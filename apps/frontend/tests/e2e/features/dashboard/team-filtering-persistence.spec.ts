// spec: apps/frontend/tests/e2e/dashboard/team-filtering-status-labels.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Team Filtering Persistence Tests
 *
 * Test Suite: Team Filtering Persistence (Tab Switching)
 *
 * Each test independently verifies that team selection persists when switching tabs.
 * Tests are independent and can run in parallel.
 *
 * Authentication: Uses siteAdminPage fixture (lab_manager role)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

// SKIP: 대시보드 리디자인으로 탭 UI 제거됨 (99a7c59b)
test.describe.skip('Team Filtering Persistence', () => {
  const selectedTeamName = 'SAR';

  test('should persist team selection when switching to 교정 (Calibration) tab', async ({
    siteAdminPage,
  }) => {
    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    // 3. Wait for tab panel to be visible
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 4. Wait for team cards to load and click team card 'SAR'
    await siteAdminPage.waitForSelector(`text=${selectedTeamName}`);
    const teamCard = equipmentPanel.getByRole('button').filter({ hasText: selectedTeamName });
    await teamCard.click();

    // 5. Verify 'SAR' card has selected styling
    await expect(teamCard).toHaveClass(/bg-primary/);
    await expect(teamCard).toHaveClass(/border-primary/);

    // 6. Click '교정' tab
    const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
    await calibrationTab.click();
    await expect(calibrationTab).toHaveAttribute('data-state', 'active');

    // 7. Wait for calibration content to be visible
    await expect(siteAdminPage.getByText('교정 예정 장비')).toBeVisible();

    // 8. Verify team selection persists: switch back to equipment tab and check styling
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    const equipmentPanelAfterReturn = siteAdminPage.getByRole('tabpanel');
    const teamCardAfterReturn = equipmentPanelAfterReturn
      .getByRole('button')
      .filter({ hasText: selectedTeamName });
    await expect(teamCardAfterReturn).toHaveClass(/bg-primary/);
    await expect(teamCardAfterReturn).toHaveClass(/border-primary/);
  });

  test('should persist team selection when switching to 대여/반출 (Rental) tab', async ({
    siteAdminPage,
  }) => {
    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    // 3. Wait for tab panel and click team card 'SAR'
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();
    await siteAdminPage.waitForSelector(`text=${selectedTeamName}`);

    const teamCard = equipmentPanel.getByRole('button').filter({ hasText: selectedTeamName });
    await teamCard.click();
    await expect(teamCard).toHaveClass(/bg-primary/);

    // 4. Click '대여/반출' tab
    const rentalTab = siteAdminPage.getByRole('tab', { name: '대여/반출' });
    await rentalTab.click();
    await expect(rentalTab).toHaveAttribute('data-state', 'active');

    // 5. Wait for rental tab content
    await expect(siteAdminPage.getByText('반출 현황')).toBeVisible();

    // 6. Verify team selection persists by checking equipment tab
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    const equipmentPanelAfterReturn = siteAdminPage.getByRole('tabpanel');
    const teamCardAfterReturn = equipmentPanelAfterReturn
      .getByRole('button')
      .filter({ hasText: selectedTeamName });
    await expect(teamCardAfterReturn).toHaveClass(/bg-primary/);
    await expect(teamCardAfterReturn).toHaveClass(/border-primary/);
  });

  test('should persist team selection through complete round-trip (장비 현황 → 교정 → 대여/반출 → 장비 현황)', async ({
    siteAdminPage,
  }) => {
    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2. Click '장비 현황' tab and select team
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();
    await siteAdminPage.waitForSelector(`text=${selectedTeamName}`);

    const teamCard = equipmentPanel.getByRole('button').filter({ hasText: selectedTeamName });
    await teamCard.click();
    await expect(teamCard).toHaveClass(/bg-primary/);

    // 3. Switch to '교정' tab
    const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
    await calibrationTab.click();
    await expect(calibrationTab).toHaveAttribute('data-state', 'active');
    await expect(siteAdminPage.getByText('교정 예정 장비')).toBeVisible();

    // 4. Switch to '대여/반출' tab
    const rentalTab = siteAdminPage.getByRole('tab', { name: '대여/반출' });
    await rentalTab.click();
    await expect(rentalTab).toHaveAttribute('data-state', 'active');
    await expect(siteAdminPage.getByText('반출 현황')).toBeVisible();

    // 5. Return to '장비 현황' tab (complete round-trip)
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    const equipmentPanelFinal = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanelFinal).toBeVisible();

    // 6. Verify 'SAR' team card still has selected styling after round-trip
    const teamCardFinal = equipmentPanelFinal
      .getByRole('button')
      .filter({ hasText: selectedTeamName });
    await expect(teamCardFinal).toHaveClass(/bg-primary/);
    await expect(teamCardFinal).toHaveClass(/border-primary/);

    // 7. Verify '전체 팀' button does NOT have selected styling
    const allTeamsButton = equipmentPanelFinal.getByRole('button').filter({ hasText: '전체 팀' });
    await expect(allTeamsButton).not.toHaveClass(/bg-primary/);
  });
});
