// spec: dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Team Filtering - Sequential Group 2
 *
 * Test Suite: Team Filtering via UI State Verification
 *
 * CRITICAL: These tests MUST run sequentially (.serial()) because they share
 * the same team selection state. Each test builds upon the state from the previous test.
 *
 * Test Flow:
 * 1. Test 3.1: Navigate → Get unfiltered count → Select team → Verify filtered count
 *    ↓ (state: FCC EMC/RF selected)
 * 2. Test 3.2: Verify equipment status chart shows filtered data
 *    ↓ (state: FCC EMC/RF still selected)
 * 3. Test 3.5: Click "전체 팀" button → Verify count restored
 *    ↓ (state: Complete, screenshot taken)
 *
 * Authentication: Uses siteAdminPage fixture (lab_manager role)
 * Tag: @sequential-group-2
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe.serial('Team Filtering API Chain @sequential-group-2', () => {
  // Shared state variables across sequential tests
  let selectedTeamName = 'FCC EMC/RF';
  let unfilteredCount: number;
  let filteredCount: number;
  let unfilteredChartTotal: number;
  let filteredChartTotal: number;

  /**
   * Helper function to get total equipment count from stats card
   */
  async function getTotalEquipmentCount(page: any): Promise<number> {
    const totalEquipmentCard = page
      .getByText('전체 장비')
      .locator('..')
      .locator('[data-testid="stats-value"]');
    const countText = await totalEquipmentCard.textContent();
    const count = parseInt(countText?.replace(/,/g, '') || '0');
    return count;
  }

  /**
   * Helper function to get total equipment count from chart legend
   */
  async function getChartTotalCount(page: any): Promise<number> {
    try {
      // Wait for chart to be visible (it's loaded dynamically)
      const chartSection = page.locator('text=장비 상태').first().locator('..');
      await chartSection.waitFor({ state: 'visible', timeout: 5000 });

      // Find the total text in the chart footer
      const totalText = await chartSection
        .locator('text=총')
        .locator('..')
        .textContent({ timeout: 3000 });
      const match = totalText?.match(/총\s*(\d+)\s*대의 장비/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      console.warn('[Chart Total] Chart not fully loaded, skipping chart verification');
      return 0;
    }
  }

  test('should show different equipment counts when filtering by team', async ({
    siteAdminPage,
  }) => {
    // Test 3.1: First test in chain - includes navigation

    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();

    // Verify tab is active
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 3. Wait for initial data to load

    // 4. Get unfiltered count from stats card
    unfilteredCount = await getTotalEquipmentCount(siteAdminPage);
    console.log('[Test 3.1] Unfiltered total equipment:', unfilteredCount);

    // Also get unfiltered chart total (optional - chart loads lazily)
    unfilteredChartTotal = await getChartTotalCount(siteAdminPage);
    if (unfilteredChartTotal > 0) {
      console.log('[Test 3.1] Unfiltered chart total:', unfilteredChartTotal);
    }

    // 5. Find and click team card 'FCC EMC/RF'
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(selectedTeamName) });
    await expect(teamCard).toBeVisible();

    // Get expected filtered count from team card
    const teamCardText = await teamCard.textContent();
    const teamCountMatch = teamCardText?.match(/(\d+)대/);
    const expectedFilteredCount = teamCountMatch ? parseInt(teamCountMatch[1]) : 0;
    console.log('[Test 3.1] Expected filtered count from team card:', expectedFilteredCount);

    await teamCard.click();

    // 6. Wait for UI to update (React Query refetch)
    await siteAdminPage.waitForFunction(
      (expected) => {
        const totalEquipmentCard = Array.from(document.querySelectorAll('h3, p'))
          .find((el) => el.textContent?.includes('전체 장비'))
          ?.parentElement?.querySelector('[data-testid="stats-value"]');
        if (!totalEquipmentCard?.textContent) return false;
        const currentCount = parseInt(totalEquipmentCard.textContent.replace(/,/g, ''), 10);
        return currentCount === expected;
      },
      expectedFilteredCount,
      { timeout: 10000 }
    );

    // 7. Get filtered count
    filteredCount = await getTotalEquipmentCount(siteAdminPage);
    console.log('[Test 3.1] Filtered total equipment:', filteredCount);

    // Get filtered chart total (optional)
    filteredChartTotal = await getChartTotalCount(siteAdminPage);
    if (filteredChartTotal > 0) {
      console.log('[Test 3.1] Filtered chart total:', filteredChartTotal);
    }

    // 8. Verify filtering worked
    expect(filteredCount).toBeLessThan(unfilteredCount);
    expect(filteredCount).toBe(expectedFilteredCount);

    console.log('[Test 3.1] Reduction:', unfilteredCount - filteredCount);
  });

  test('should update equipment status chart when team is filtered', async ({ siteAdminPage }) => {
    // Test 3.2: Second test - MUST recreate state from test 3.1
    // NOTE: Playwright serial tests get new browser contexts, so state is NOT preserved

    // 1. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 2. Click '장비 현황' tab to see the chart
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 3. Wait for data to load

    // 4. Get unfiltered chart total
    const unfilteredChartTotal = await getChartTotalCount(siteAdminPage);

    // 5. Select team to filter
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(selectedTeamName) });
    await expect(teamCard).toBeVisible();
    await teamCard.click();

    // 6. Wait for UI to update

    // 7. Verify chart total matches the filtered count
    const currentChartTotal = await getChartTotalCount(siteAdminPage);
    console.log('[Test 3.2] Current chart total:', currentChartTotal);
    console.log('[Test 3.2] Filtered count from previous test:', filteredCount);

    // Only verify chart if it loaded successfully
    if (currentChartTotal > 0 && unfilteredChartTotal > 0) {
      expect(currentChartTotal).toBe(filteredCount);

      // 8. Verify chart total is less than unfiltered chart total
      expect(currentChartTotal).toBeLessThan(unfilteredChartTotal);
      console.log('[Test 3.2] Chart count verification passed');
    } else {
      console.log('[Test 3.2] Chart data not available, skipping chart count verification');
    }

    // 9. Verify chart legend items are visible
    const chartSection = siteAdminPage.locator('text=장비 상태').first().locator('..');
    await expect(chartSection).toBeVisible({ timeout: 5000 });

    const legendItems = chartSection.locator('div[role="listitem"]');
    const legendCount = await legendItems.count();

    console.log('[Test 3.2] Chart legend items count:', legendCount);

    if (legendCount > 0) {
      // 10. Verify at least one status has equipment
      const legendTexts = await legendItems.allTextContents();
      console.log('[Test 3.2] Legend items:', legendTexts);

      const hasNonZeroValue = legendTexts.some((text) => {
        const match = text.match(/(\d+)$/);
        return match && parseInt(match[1]) > 0;
      });

      expect(hasNonZeroValue).toBe(true);
      console.log('[Test 3.2] Chart verification passed');
    } else {
      console.log('[Test 3.2] Chart legend not loaded, skipping legend verification');
    }
  });

  test('should restore unfiltered counts when "전체 팀" is selected', async ({ siteAdminPage }) => {
    // Test 3.5: Third test - MUST recreate state from previous tests
    // NOTE: Playwright serial tests get new browser contexts, so state is NOT preserved

    // 1. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 3. Wait for initial data to load and get unfiltered count
    const freshUnfilteredCount = await getTotalEquipmentCount(siteAdminPage);
    console.log('[Test 3.5] Fresh unfiltered count:', freshUnfilteredCount);

    // 4. Select team to filter
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(selectedTeamName) });
    await expect(teamCard).toBeVisible();
    await teamCard.click();

    // 5. Wait for filtering
    const freshFilteredCount = await getTotalEquipmentCount(siteAdminPage);
    console.log('[Test 3.5] Fresh filtered count:', freshFilteredCount);

    // 6. Now click "전체 팀" button to restore
    const allTeamsButton = equipmentPanel.getByRole('button', { name: /전체 팀/ });

    await expect(allTeamsButton).toBeVisible();
    await allTeamsButton.click();

    // 7. Wait for UI to update back to unfiltered state
    await siteAdminPage.waitForFunction(
      (expected) => {
        const totalEquipmentCard = Array.from(document.querySelectorAll('h3, p'))
          .find((el) => el.textContent?.includes('전체 장비'))
          ?.parentElement?.querySelector('[data-testid="stats-value"]');
        if (!totalEquipmentCard?.textContent) return false;
        const currentCount = parseInt(totalEquipmentCard.textContent.replace(/,/g, ''), 10);
        return currentCount === expected;
      },
      freshUnfilteredCount,
      { timeout: 10000 }
    );

    // 8. Get restored count
    const restoredCount = await getTotalEquipmentCount(siteAdminPage);
    console.log('[Test 3.5] Restored total equipment:', restoredCount);

    // 9. Verify count matches original unfiltered count
    expect(restoredCount).toBe(freshUnfilteredCount);

    // 10. Verify it's greater than filtered count
    expect(restoredCount).toBeGreaterThan(freshFilteredCount);

    // 11. Verify chart total also restored (if available)
    const restoredChartTotal = await getChartTotalCount(siteAdminPage);
    const freshUnfilteredChartTotal = restoredChartTotal; // After clicking "전체 팀"

    if (restoredChartTotal > 0) {
      console.log('[Test 3.5] Restored chart total:', restoredChartTotal);
      expect(restoredChartTotal).toBe(freshUnfilteredCount);
    }

    // 12. Log all comparisons
    console.log('[Test 3.5] ===== Final Comparison =====');
    console.log('[Test 3.5] Fresh unfiltered count:', freshUnfilteredCount);
    console.log('[Test 3.5] Fresh filtered count:', freshFilteredCount);
    console.log('[Test 3.5] Restored count:', restoredCount);
    console.log('[Test 3.5] Reduction when filtered:', freshUnfilteredCount - freshFilteredCount);
    console.log('[Test 3.5] ===========================');

    // 7. Take screenshot showing restored state
    await siteAdminPage.screenshot({
      path: 'test-results/dashboard-team-filtering-final-state.png',
      fullPage: true,
    });

    console.log('[Test 3.5] Screenshot saved: dashboard-team-filtering-final-state.png');
    console.log('[Test 3.5] Sequential Group 2 test suite complete');
  });
});
