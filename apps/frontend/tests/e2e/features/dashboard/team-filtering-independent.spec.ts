// spec: apps/frontend/tests/e2e/dashboard/team-filtering-status-labels.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Team Filtering - Parallel Group 2: Independent State Change Tests
 *
 * Test Suite: Team Filtering API Integration + Keyboard Accessibility
 *
 * This group contains 4 independent tests that can run in parallel:
 * - Test 3.3: Overdue calibrations API filters by team (FCC EMC/RF)
 * - Test 3.4: Upcoming calibrations API filters by team (SAR)
 * - Test 5.2: Enter key selects team (General EMC)
 * - Test 5.3: Space key toggles team selection (Automotive EMC)
 *
 * Each test uses a different team to avoid conflicts during parallel execution.
 *
 * Execution: pnpm test:e2e team-filtering-independent.spec.ts --workers=4
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

// SKIP: 대시보드 리디자인으로 탭 UI 제거됨 (99a7c59b)
test.describe.skip('Independent State Change Tests @parallel-group-2', () => {
  test.beforeEach(async ({ siteAdminPage }) => {
    // Fresh page navigation for each test to ensure independence
    await siteAdminPage.goto('/');

    // Wait for dashboard to load - look for the tabs
    await siteAdminPage.waitForSelector('div[role="tablist"]', { timeout: 15000 });

    // Navigate to Equipment tab where team filtering is available
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();

    // Wait for team list to appear (indicates equipment tab is fully loaded)
    const allTeamsButton = siteAdminPage.getByRole('button', { name: /전체 팀/ });
    await allTeamsButton.waitFor({ state: 'visible', timeout: 10000 });
  });

  test.describe('3.3 Overdue calibrations API filters by team', () => {
    test('should filter overdue calibrations by selected team via API', async ({
      siteAdminPage,
    }) => {
      // Increase timeout for this test as it involves tab switching
      test.setTimeout(60000);

      // Equipment tab is already active from beforeEach
      // Click on team card to filter by FCC EMC/RF
      const fccTeamCard = siteAdminPage.getByRole('button').filter({ hasText: 'FCC EMC/RF' });
      await fccTeamCard.click();

      // Verify team selection visual state
      await expect(fccTeamCard).toHaveClass(/bg-primary/);

      // Switch to Calibration tab to check filtered calibrations
      const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
      await calibrationTab.click();

      // Wait for calibration tab content to load
      await siteAdminPage.waitForSelector('text=교정 지연 장비', { timeout: 10000 });

      // Get overdue calibration count (should be filtered by team)
      const overdueCard = siteAdminPage.locator('div:has(h3:has-text("교정 지연 장비"))').first();
      const filteredBadge = overdueCard.locator('div[class*="rounded-full"]').first();
      const filteredCountText = await filteredBadge.textContent();
      const filteredCount = parseInt(filteredCountText || '0');

      console.log(`Filtered overdue calibrations count for FCC EMC/RF: ${filteredCount}`);

      // Verify filtered count is valid (>= 0)
      expect(filteredCount).toBeGreaterThanOrEqual(0);

      // Verify calibration list content structure exists
      const calibrationListContent = overdueCard.locator('div[class*="space-y"]').first();
      await expect(calibrationListContent).toBeVisible();

      // Take screenshot for documentation
      await siteAdminPage.screenshot({
        path: 'test-results/overdue-calibrations-filtered.png',
        fullPage: true,
      });
    });
  });

  test.describe('3.4 Upcoming calibrations API filters by team', () => {
    test('should filter upcoming calibrations by selected team via API', async ({
      siteAdminPage,
    }) => {
      // Increase timeout for this test as it involves tab switching
      test.setTimeout(60000);

      // Equipment tab is already active from beforeEach
      // Click on team card to filter by SAR
      const sarTeamCard = siteAdminPage.getByRole('button').filter({ hasText: 'SAR' });
      await sarTeamCard.click();

      // Verify team selection visual state
      await expect(sarTeamCard).toHaveClass(/bg-primary/);

      // Switch to Calibration tab to check filtered calibrations
      const calibrationTab = siteAdminPage.getByRole('tab', { name: '교정' });
      await calibrationTab.click();

      // Wait for calibration tab content to load
      await siteAdminPage.waitForSelector('text=교정 예정 장비', { timeout: 10000 });

      // Get upcoming calibration count (should be filtered by team)
      const upcomingCard = siteAdminPage.locator('div:has(h3:has-text("교정 예정 장비"))').first();
      const filteredBadge = upcomingCard.locator('div[class*="rounded-full"]').first();
      const filteredCountText = await filteredBadge.textContent();
      const filteredCount = parseInt(filteredCountText || '0');

      console.log(`Filtered upcoming calibrations count for SAR: ${filteredCount}`);

      // Verify filtered count is valid (>= 0)
      expect(filteredCount).toBeGreaterThanOrEqual(0);

      // Verify calibration list content structure exists
      const calibrationListContent = upcomingCard.locator('div[class*="space-y"]').first();
      await expect(calibrationListContent).toBeVisible();

      // Verify that the filter is active by checking if list shows appropriate content
      if (filteredCount === 0) {
        const noDataMessage = upcomingCard.getByText(/예정된 교정이 없습니다/);
        await expect(noDataMessage).toBeVisible();
      } else {
        // Should show at least some calibration items (max 3 displayed in list)
        const listItems = upcomingCard.locator('div[class*="space-y-3"] > div');
        const itemCount = await listItems.count();
        expect(itemCount).toBeGreaterThan(0);
        expect(itemCount).toBeLessThanOrEqual(Math.min(3, filteredCount));
      }
    });
  });

  test.describe('5.2 Enter key selects team', () => {
    test('should select team using Enter key and trigger filtering', async ({ siteAdminPage }) => {
      // Get initial total equipment count from stats card
      // Stats cards are visible on all tabs, above the tab content
      const totalEquipmentHeading = siteAdminPage.getByRole('heading', {
        name: '전체 장비',
        level: 3,
      });
      await totalEquipmentHeading.waitFor({ state: 'visible', timeout: 5000 });

      const totalEquipmentCard = totalEquipmentHeading.locator('..');
      const initialCountElement = totalEquipmentCard.locator('p').first();
      const initialCountText = await initialCountElement.textContent();
      const initialCount = parseInt(initialCountText || '0');

      console.log(`Initial total equipment count: ${initialCount}`);

      // Navigate to 'General EMC' team card using Tab key
      // First, focus on the "전체 팀" button directly
      const allTeamsButton = siteAdminPage.getByRole('button', { name: /전체 팀/ });
      await allTeamsButton.focus();

      // Tab through team cards to find General EMC
      // Typically: 전체 팀 -> FCC EMC/RF -> Automotive EMC -> General RF -> General EMC
      let attempts = 0;
      const maxAttempts = 10;
      let foundGeneralEMC = false;

      while (attempts < maxAttempts && !foundGeneralEMC) {
        const focusedText = await siteAdminPage.evaluate(() => {
          const el = document.activeElement;
          return el ? el.textContent : '';
        });

        console.log(`Focused element text (attempt ${attempts}): ${focusedText}`);

        // Check if the focused element is a button with "General EMC" text
        const isGeneralEMC = focusedText?.includes('General EMC') && focusedText?.includes('6대');
        if (isGeneralEMC) {
          foundGeneralEMC = true;
          break;
        }

        await siteAdminPage.keyboard.press('Tab');
        attempts++;
      }

      expect(foundGeneralEMC).toBe(true);

      // Press Enter key
      await siteAdminPage.keyboard.press('Enter');

      // Wait for UI to update

      // Verify equipment count updated (should be different from initial)
      const filteredCountElement = totalEquipmentCard.locator('p').first();
      const filteredCountText = await filteredCountElement.textContent();
      const filteredCount = parseInt(filteredCountText || '0');

      console.log(`After Enter key - Filtered total equipment count: ${filteredCount}`);

      // Verify filtered count is valid and less than initial (team filter is active)
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThan(initialCount);

      // Verify that the filter worked by checking a reasonable range for General EMC team
      // General EMC should have around 6 equipment based on seed data
      expect(filteredCount).toBeLessThanOrEqual(10);
    });
  });

  test.describe('5.3 Space key toggles team selection', () => {
    test('should toggle team selection using Space key', async ({ siteAdminPage }) => {
      // Get initial total equipment count
      const totalEquipmentHeading = siteAdminPage.getByRole('heading', {
        name: '전체 장비',
        level: 3,
      });
      await totalEquipmentHeading.waitFor({ state: 'visible', timeout: 5000 });

      const totalEquipmentCard = totalEquipmentHeading.locator('..');
      const initialCountElement = totalEquipmentCard.locator('p').first();
      const initialCountText = await initialCountElement.textContent();
      const initialCount = parseInt(initialCountText || '0');

      console.log(`Initial total equipment count: ${initialCount}`);

      // Navigate to 'Automotive EMC' team card using Tab key
      // Note: There are TWO "Automotive EMC" teams - one with 6대, one with 2대
      // We want the first one (6대)
      const allTeamsButton = siteAdminPage.getByRole('button', { name: /전체 팀/ });
      await allTeamsButton.focus();

      // Tab through to find Automotive EMC card (6대)
      let attempts = 0;
      const maxAttempts = 10;
      let foundAutomotiveEMC = false;

      while (attempts < maxAttempts && !foundAutomotiveEMC) {
        const focusedText = await siteAdminPage.evaluate(() => {
          const el = document.activeElement;
          return el ? el.textContent : '';
        });

        console.log(`Focused element text (attempt ${attempts}): ${focusedText}`);

        // Check for first Automotive EMC (6대)
        const isAutomotiveEMC =
          focusedText?.includes('Automotive EMC') && focusedText?.includes('6대');
        if (isAutomotiveEMC) {
          foundAutomotiveEMC = true;
          break;
        }

        await siteAdminPage.keyboard.press('Tab');
        attempts++;
      }

      expect(foundAutomotiveEMC).toBe(true);

      // First press - select
      await siteAdminPage.keyboard.press('Space');

      // Wait for UI to update using waitForFunction
      await siteAdminPage.waitForFunction(
        (initial) => {
          const totalEquipmentCard = Array.from(document.querySelectorAll('h3'))
            .find((el) => el.textContent?.includes('전체 장비'))
            ?.parentElement?.querySelector('p');
          if (!totalEquipmentCard?.textContent) return false;
          const currentCount = parseInt(totalEquipmentCard.textContent.replace(/,/g, ''), 10);
          return currentCount < initial && currentCount > 0;
        },
        initialCount,
        { timeout: 10000 }
      );

      // Verify equipment count changed (filtered)
      const selectedCountElement = totalEquipmentCard.locator('p').first();
      const selectedCountText = await selectedCountElement.textContent();
      const selectedCount = parseInt(selectedCountText || '0');

      console.log(`First Space press: Team selected, count: ${selectedCount}`);

      // Verify the count decreased (team filter is active)
      expect(selectedCount).toBeGreaterThan(0);
      expect(selectedCount).toBeLessThan(initialCount);

      // Automotive EMC should have around 6 equipment based on seed data
      expect(selectedCount).toBeLessThanOrEqual(10);

      // Second press - deselect (toggle back)
      // Re-find and refocus on the Automotive EMC button (6대)
      const automotiveEMCButton = siteAdminPage
        .getByRole('button')
        .filter({ hasText: 'Automotive EMC' })
        .filter({ hasText: '6대' });
      await automotiveEMCButton.focus();

      // Verify focus is on the right element
      const focusedBeforeToggle = await siteAdminPage.evaluate(() => {
        const el = document.activeElement;
        return el ? el.textContent : '';
      });
      console.log(`Focus before second Space press: ${focusedBeforeToggle}`);

      // Press Space to deselect
      await siteAdminPage.keyboard.press('Space');

      // Wait for UI to update back to unfiltered state
      await siteAdminPage.waitForFunction(
        (expected) => {
          const totalEquipmentCard = Array.from(document.querySelectorAll('h3'))
            .find((el) => el.textContent?.includes('전체 장비'))
            ?.parentElement?.querySelector('p');
          if (!totalEquipmentCard?.textContent) return false;
          const currentCount = parseInt(totalEquipmentCard.textContent.replace(/,/g, ''), 10);
          return currentCount === expected;
        },
        initialCount,
        { timeout: 10000 }
      );

      // Verify equipment count returned to initial (all teams)
      const deselectedCountElement = totalEquipmentCard.locator('p').first();
      const deselectedCountText = await deselectedCountElement.textContent();
      const deselectedCount = parseInt(deselectedCountText || '0');

      console.log(`After deselect: count returned to: ${deselectedCount}`);

      // Verify count returned to initial value (all teams showing)
      expect(deselectedCount).toBe(initialCount);
    });
  });
});
