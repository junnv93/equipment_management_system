/**
 * Equipment Detail Page - Shared Equipment Restrictions
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Permission-Based Actions', () => {
  test('Edit and delete actions for shared equipment', async ({ siteAdminPage: page }) => {
    // Navigate to equipment list
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Look for shared equipment indicator
    const sharedIndicator = page.locator('text=/공용/i').first();
    const sharedExists = (await sharedIndicator.count()) > 0;

    if (!sharedExists) {
      test.skip(true, 'No shared equipment found');
    }

    // Navigate to shared equipment
    const sharedCard = sharedIndicator.locator('..').locator('..');
    const detailLink = sharedCard.getByRole('link', { name: /상세/i }).first();
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // Verify shared equipment banner
    const sharedBanner = page.locator('text=/공용장비/i');
    await expect(sharedBanner.first()).toBeVisible();

    // Verify Edit button is NOT visible
    const editButton = page.getByRole('button', { name: /수정/i });
    await expect(editButton).not.toBeVisible();

    // Verify Delete button is NOT visible
    const deleteButton = page.getByRole('button', { name: /삭제/i });
    await expect(deleteButton).not.toBeVisible();

    // Verify checkout button IS still visible
    const checkoutButton = page.getByRole('button', { name: /반출 신청/i });
    await expect(checkoutButton).toBeVisible();

    console.log('✓ Shared equipment restrictions enforced');
  });
});
