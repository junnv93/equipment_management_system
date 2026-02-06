// spec: dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Team Filtering Basic Flow - Independent Tests
 *
 * Test Suite: Team Filtering Basic Functionality
 *
 * NOTE: These tests were previously sequential but have been refactored to be
 * independent due to Playwright fixture behavior (each test gets fresh context).
 * Each test now includes full navigation and setup, making them more robust.
 *
 * Test Coverage:
 * 1. Test 2.2: Filter equipment by selecting a team card
 * 2. Test 2.3: Switch selection between different team cards
 * 3. Test 2.4: Deselect team by clicking it again (toggle behavior)
 * 4. Test 2.5: Reset filter using '전체 팀' button
 *
 * Authentication: Uses siteAdminPage fixture (lab_manager role)
 *
 * Key Changes from Original Design:
 * - Removed waitForResponse() network interception (unreliable, causes timeouts)
 * - Uses DOM state verification with waitForFunction() for count changes
 * - Each test is self-contained and can run independently
 * - Validates real business logic through UI state changes
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Team Filtering Basic Flow @sequential-group-1', () => {
  // Variables used for logging within tests (not shared state)
  let selectedTeamName: string;
  let initialEquipmentCount: number;
  let filteredEquipmentCount: number;

  test('should filter equipment count when team card is clicked', async ({ siteAdminPage }) => {
    // Test 2.2: First test in chain - includes navigation

    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/');
    await siteAdminPage.waitForLoadState('load');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();

    // Verify tab is active
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');
    await expect(equipmentTab).toHaveAttribute('data-state', 'active');

    // 3. Wait for initial data load
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 4. Capture initial total equipment count from DOM
    // Wait for stats cards to be visible and extract the "전체 장비" count
    const totalEquipmentCard = siteAdminPage
      .getByText('전체 장비')
      .locator('..')
      .locator('[data-testid="stats-value"]');
    await expect(totalEquipmentCard).toBeVisible();

    const initialCountText = await totalEquipmentCard.textContent();
    initialEquipmentCount = parseInt(initialCountText?.replace(/,/g, '') || '0', 10);

    console.log(`[Test 2.2] Initial equipment count: ${initialEquipmentCount}`);

    // 5. Verify initial state - '전체 팀' should be selected
    // Find the button by its text content
    const allTeamsButton = equipmentPanel.getByRole('button', { name: /전체 팀/ });
    await expect(allTeamsButton).toBeVisible();

    // 6. Click on team card 'FCC EMC/RF'
    selectedTeamName = 'FCC EMC/RF';
    // Team cards have role="button"
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(selectedTeamName) });
    await expect(teamCard).toBeVisible();
    await teamCard.click();

    // 7. Wait for the equipment count to update in DOM
    // The count should decrease when filtering by team
    await siteAdminPage.waitForFunction(
      (initialCount) => {
        const statsValue = document.querySelector('[data-testid="stats-value"]');
        if (!statsValue?.textContent) return false;
        const currentCount = parseInt(statsValue.textContent.replace(/,/g, ''), 10);
        return currentCount < initialCount && currentCount > 0;
      },
      initialEquipmentCount,
      { timeout: 10000 }
    );

    // 8. Capture filtered equipment count from DOM
    const filteredCountText = await totalEquipmentCard.textContent();
    filteredEquipmentCount = parseInt(filteredCountText?.replace(/,/g, '') || '0', 10);

    console.log(`[Test 2.2] Filtered equipment count: ${filteredEquipmentCount}`);

    // 9. Verify filteredEquipmentCount < initialEquipmentCount
    expect(filteredEquipmentCount).toBeLessThan(initialEquipmentCount);
    expect(filteredEquipmentCount).toBeGreaterThan(0);

    // 10. Verify team card has selected styling
    await expect(teamCard).toHaveClass(/bg-primary/);
    await expect(teamCard).toHaveClass(/border-primary/);

    // 11. Verify '전체 팀' button no longer has selected state
    await expect(allTeamsButton).not.toHaveClass(/bg-primary/);

    // 12. Verify chart section is visible with updated data
    const chartSection = equipmentPanel.locator('text=장비 상태').first();
    await expect(chartSection).toBeVisible();
  });

  test('should display visual selection state on selected team card', async ({ siteAdminPage }) => {
    // Test 2.3: Test visual selection styling when switching between teams

    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/');
    await siteAdminPage.waitForLoadState('load');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

    // 3. Wait for panel and verify '전체 팀' is initially selected
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    const allTeamsButton = equipmentPanel.getByRole('button', { name: /전체 팀/ });
    await expect(allTeamsButton).toBeVisible();
    await expect(allTeamsButton).toHaveClass(/bg-primary/);

    // 4. Select a team ('FCC EMC/RF')
    const teamName = 'FCC EMC/RF';
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(teamName) });
    await expect(teamCard).toBeVisible();
    await teamCard.click();

    // Wait for React state to update
    await siteAdminPage.waitForTimeout(500);

    // 5. Verify team card now has selected styling
    await expect(teamCard).toHaveClass(/bg-primary/);
    await expect(teamCard).toHaveClass(/border-primary/);

    // 6. Verify '전체 팀' button NO LONGER has selected state
    await expect(allTeamsButton).not.toHaveClass(/bg-primary/);

    // 7. Deselect by clicking the same team again
    await teamCard.click();
    await siteAdminPage.waitForTimeout(500);

    // 8. Verify '전체 팀' button regains selected state
    await expect(allTeamsButton).toHaveClass(/bg-primary/);

    // 9. Verify team card loses selected styling
    await expect(teamCard).not.toHaveClass(/bg-primary/);

    console.log(`[Test 2.3] Verified visual selection state for ${teamName}`);
  });

  test('should deselect team and return to all teams when clicked again', async ({
    siteAdminPage,
  }) => {
    // Test 2.4: Independent test - includes full navigation and setup

    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/');
    await siteAdminPage.waitForLoadState('load');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();

    // Verify tab is active
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

    // 3. Wait for initial data load
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 4. Capture initial total equipment count
    const totalEquipmentCard = siteAdminPage
      .getByText('전체 장비')
      .locator('..')
      .locator('[data-testid="stats-value"]');
    await expect(totalEquipmentCard).toBeVisible();

    const initialCountText = await totalEquipmentCard.textContent();
    const testInitialCount = parseInt(initialCountText?.replace(/,/g, '') || '0', 10);

    // 5. Select a team ('General EMC')
    selectedTeamName = 'General EMC';
    const teamCard = equipmentPanel.getByRole('button', { name: new RegExp(selectedTeamName) });
    await expect(teamCard).toBeVisible();
    await teamCard.click();

    // Wait for filtering to apply
    await siteAdminPage.waitForFunction(
      (initialCount) => {
        const statsValue = document.querySelector('[data-testid="stats-value"]');
        if (!statsValue?.textContent) return false;
        const currentCount = parseInt(statsValue.textContent.replace(/,/g, ''), 10);
        return currentCount < initialCount && currentCount > 0;
      },
      testInitialCount,
      { timeout: 10000 }
    );

    // Verify team is selected
    await expect(teamCard).toHaveClass(/bg-primary/);

    // 6. Click on the same team card again to deselect
    await teamCard.click();

    // 7. Wait for the equipment count to return to initial value
    await siteAdminPage.waitForFunction(
      (expectedCount) => {
        const statsValue = document.querySelector('[data-testid="stats-value"]');
        if (!statsValue?.textContent) return false;
        const currentCount = parseInt(statsValue.textContent.replace(/,/g, ''), 10);
        return currentCount === expectedCount;
      },
      testInitialCount,
      { timeout: 10000 }
    );

    // 8. Verify count returned to initial value
    const unfilteredCountText = await totalEquipmentCard.textContent();
    const unfilteredCount = parseInt(unfilteredCountText?.replace(/,/g, '') || '0', 10);
    expect(unfilteredCount).toBe(testInitialCount);

    // 9. Verify '전체 팀' button regains selected state
    const allTeamsButton = equipmentPanel.getByRole('button', { name: /전체 팀/ });
    await expect(allTeamsButton).toHaveClass(/bg-primary/);

    // 10. Verify team card loses selected styling
    await expect(teamCard).not.toHaveClass(/bg-primary/);

    // 11. Verify chart shows unfiltered data
    const chartSection = equipmentPanel.locator('text=장비 상태').first();
    await expect(chartSection).toBeVisible();

    console.log(`[Test 2.4] Deselected ${selectedTeamName}, returned to 전체 팀`);
    console.log(`[Test 2.4] Equipment count returned to ${unfilteredCount}`);
  });

  test('should reset filter when 전체 팀 button is clicked', async ({ siteAdminPage }) => {
    // Test 2.5: Independent test - includes full navigation and setup

    // 1. Navigate to /dashboard
    await siteAdminPage.goto('/');
    await siteAdminPage.waitForLoadState('load');

    // 2. Click '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await equipmentTab.click();

    // Verify tab is active
    await expect(equipmentTab).toHaveAttribute('aria-selected', 'true');

    // 3. Wait for initial data load
    const equipmentPanel = siteAdminPage.getByRole('tabpanel');
    await expect(equipmentPanel).toBeVisible();

    // 4. Capture initial total equipment count
    const totalEquipmentCard = siteAdminPage
      .getByText('전체 장비')
      .locator('..')
      .locator('[data-testid="stats-value"]');
    await expect(totalEquipmentCard).toBeVisible();

    const initialCountText = await totalEquipmentCard.textContent();
    const testInitialCount = parseInt(initialCountText?.replace(/,/g, '') || '0', 10);

    // 5. Click on any team card to create filtered state ('FCC EMC/RF')
    const testTeamName = 'FCC EMC/RF';
    const testTeamCard = equipmentPanel.getByRole('button', { name: new RegExp(testTeamName) });
    await expect(testTeamCard).toBeVisible();

    await testTeamCard.click();

    // 6. Wait for count to decrease (filtered state)
    await siteAdminPage.waitForFunction(
      (initialCount) => {
        const statsValue = document.querySelector('[data-testid="stats-value"]');
        if (!statsValue?.textContent) return false;
        const currentCount = parseInt(statsValue.textContent.replace(/,/g, ''), 10);
        return currentCount < initialCount && currentCount > 0;
      },
      testInitialCount,
      { timeout: 10000 }
    );

    // 7. Verify filtered state (reduced equipment count)
    const filteredCountText = await totalEquipmentCard.textContent();
    const filteredCount = parseInt(filteredCountText?.replace(/,/g, '') || '0', 10);
    expect(filteredCount).toBeLessThan(testInitialCount);

    console.log(`[Test 2.5] Filtered to ${testTeamName}: ${filteredCount} equipment`);

    // 8. Click '전체 팀' button
    const allTeamsButton = equipmentPanel.getByRole('button', { name: /전체 팀/ });
    await allTeamsButton.click();

    // 9. Wait for count to return to initial value
    await siteAdminPage.waitForFunction(
      (expectedCount) => {
        const statsValue = document.querySelector('[data-testid="stats-value"]');
        if (!statsValue?.textContent) return false;
        const currentCount = parseInt(statsValue.textContent.replace(/,/g, ''), 10);
        return currentCount === expectedCount;
      },
      testInitialCount,
      { timeout: 10000 }
    );

    // 10. Verify all team cards lose selection styling
    await expect(testTeamCard).not.toHaveClass(/bg-primary/);

    // 11. Verify '전체 팀' button gains selection styling
    await expect(allTeamsButton).toHaveClass(/bg-primary/);

    // 12. Verify equipment counts return to full totals
    const unfilteredCountText = await totalEquipmentCard.textContent();
    const unfilteredCount = parseInt(unfilteredCountText?.replace(/,/g, '') || '0', 10);
    expect(unfilteredCount).toBe(testInitialCount);

    // 13. Verify chart is visible
    const chartSection = equipmentPanel.locator('text=장비 상태').first();
    await expect(chartSection).toBeVisible();

    console.log(`[Test 2.5] Reset to 전체 팀: ${unfilteredCount} equipment`);
  });
});
