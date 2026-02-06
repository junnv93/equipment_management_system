/**
 * Equipment Detail Page - Disposal Button Visibility
 *
 * SSOT: Relative paths
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Permission-Based Actions', () => {
  test('Disposal request button visibility by status', async ({ siteAdminPage: page }) => {
    // 1. Log in as lab_manager

    // 2. Navigate to equipment list
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Find equipment with 'available' status
    const availableBadge = page.locator('text=/사용 가능/i').first();
    const availableCard = availableBadge.locator('..').locator('..');

    if ((await availableCard.count()) > 0) {
      // 3. Navigate to available equipment
      const detailLink = availableCard.getByRole('link', { name: /상세/i }).first();
      await detailLink.click();
      await page.waitForLoadState('networkidle');

      // 4. Verify '폐기 요청' button is visible
      const disposalButton = page.getByRole('button', { name: /폐기 요청/i });
      await expect(disposalButton).toBeVisible();

      console.log('✓ Disposal button visible for available equipment');
    }

    // Check pending disposal status
    await page.goto('/equipment');
    const pendingBadge = page.locator('text=/폐기.*중|pending/i').first();

    if ((await pendingBadge.count()) > 0) {
      const pendingCard = pendingBadge.locator('..').locator('..');
      const detailLink = pendingCard.getByRole('link', { name: /상세/i }).first();
      await detailLink.click();
      await page.waitForLoadState('networkidle');

      // Verify progress indicator
      const progressIndicator = page.locator('text=/폐기.*중/i');
      await expect(progressIndicator.first()).toBeVisible();

      console.log('✓ Disposal progress shown for pending equipment');
    }
  });
});
