/**
 * Equipment Detail Page - Test Operator Permissions
 *
 * SSOT: Uses relative paths only
 *
 * Tests that test operators (시험실무자) have correct permissions:
 * - Cannot see Edit button
 * - Cannot see Delete button
 * - Can request checkout
 * - Can request disposal for available equipment
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Permission-Based Actions', () => {
  test('Test operator (시험실무자) permissions', async ({ testOperatorPage: page }) => {
    // 1. Log in as test_engineer (already done by fixture)

    // 2. Navigate to equipment detail page
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Navigate to first equipment
    const firstDetailLink = page.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();
    await page.waitForLoadState('networkidle');

    // 3. Verify 'Edit' button is NOT visible
    const editButton = page.getByRole('button', { name: /수정/i });
    await expect(editButton).not.toBeVisible();

    // 4. Verify 'Delete' button is NOT visible
    const deleteButton = page.getByRole('button', { name: /삭제/i });
    await expect(deleteButton).not.toBeVisible();

    // 5. Verify '반출 신청' button IS visible
    const checkoutButton = page.getByRole('button', { name: /반출 신청/i });
    await expect(checkoutButton).toBeVisible();

    // 6-7. Verify disposal request button visibility depends on equipment status
    // For available equipment, disposal button should be visible
    const statusText = await page.locator('[role="status"], .badge').first().textContent();

    if (statusText?.includes('사용 가능') || statusText?.includes('available')) {
      const disposalButton = page.getByRole('button', { name: /폐기 요청/i });
      await expect(disposalButton).toBeVisible();
    }

    console.log('✓ Test operator permissions verified');
  });
});
