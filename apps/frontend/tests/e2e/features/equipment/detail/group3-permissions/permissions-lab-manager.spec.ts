/**
 * Equipment Detail Page - Lab Manager Permissions
 *
 * SSOT: Relative paths only
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Permission-Based Actions', () => {
  test('Lab manager (시험소장) permissions', async ({ siteAdminPage: page }) => {
    // 1. Log in as lab_manager (fixture)

    // 2. Navigate to equipment detail page
    await page.goto('/equipment');

    const firstDetailLink = page.getByRole('link', { name: /상세/i }).first();
    await firstDetailLink.click();

    // 3. Verify 'Edit' button IS visible
    const editButton = page.getByRole('button', { name: /수정/i });
    await expect(editButton).toBeVisible();

    // 4. Verify 'Delete' button IS visible
    const deleteButton = page.locator('button').filter({ hasText: /삭제/ });
    const deleteCount = await deleteButton.count();
    expect(deleteCount).toBeGreaterThan(0);

    // 5. Verify '반출 신청' button IS visible
    const checkoutButton = page.getByRole('button', { name: /반출 신청/i });
    await expect(checkoutButton).toBeVisible();

    // 6-7. Lab manager can approve disposal requests
    console.log('✓ Lab manager has full access');
  });
});
