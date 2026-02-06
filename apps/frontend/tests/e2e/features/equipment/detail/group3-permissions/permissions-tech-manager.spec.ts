/**
 * Equipment Detail Page - Technical Manager Permissions
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Permission-Based Actions', () => {
  test('Technical manager (기술책임자) permissions', async ({ techManagerPage: page }) => {
    // Navigate to equipment detail
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const firstDetailLink = page.getByRole('link', { name: /상세/i }).first();
    await firstDetailLink.click();
    await page.waitForLoadState('networkidle');

    // Verify 'Edit' button IS visible
    const editButton = page.getByRole('button', { name: /수정/i });
    await expect(editButton).toBeVisible();

    // Verify 'Delete' button is NOT visible
    const deleteButton = page.getByRole('button', { name: /삭제/i });
    await expect(deleteButton).not.toBeVisible();

    // Verify '반출 신청' button IS visible
    const checkoutButton = page.getByRole('button', { name: /반출 신청/i });
    await expect(checkoutButton).toBeVisible();

    // Click Edit button and verify navigation
    const currentUrl = page.url();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Should navigate to edit page
    const newUrl = page.url();
    expect(newUrl).toContain('/edit');

    console.log('✓ Technical manager permissions verified');
  });
});
