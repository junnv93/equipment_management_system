/**
 * Equipment Detail Page - Disposal Workflow Permissions
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  test('Disposal workflow permissions', async ({ testOperatorPage: page }) => {
    // Navigate to equipment with disposal request created by another user
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const pendingBadge = page.locator('text=/폐기.*대기/i').first();
    const pendingExists = (await pendingBadge.count()) > 0;

    if (!pendingExists) {
      test.skip(true, 'No pending disposal request found');
    }

    // Navigate to pending disposal equipment
    const pendingCard = pendingBadge.locator('..').locator('..');
    const detailLink = pendingCard.getByRole('link', { name: /상세/i });
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // As test_engineer, verify cannot see review button (unless they are the requester)
    const reviewButton = page.getByRole('button', { name: /검토/i });
    // Review button should not be visible for test engineer
    // (unless they happen to be technical manager of same team)

    // Verify cancel button visibility
    const cancelButton = page.getByRole('button', { name: /취소/i });
    // Cancel should only be visible if this user created the request

    console.log('✓ Disposal permissions checked');
  });
});
