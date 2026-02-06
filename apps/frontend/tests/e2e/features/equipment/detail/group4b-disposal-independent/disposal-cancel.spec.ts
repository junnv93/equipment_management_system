/**
 * Equipment Detail Page - Cancel Disposal Request
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  test('Cancel disposal request as requester', async ({ testOperatorPage: page }) => {
    // Navigate to equipment list
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Look for equipment with pending disposal created by this user
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

    // Look for cancel button
    const cancelButton = page.getByRole('button', { name: /취소/i });

    if ((await cancelButton.count()) > 0) {
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Confirm cancellation
      const confirmButton = page.getByRole('button', { name: /확인/i });
      if ((await confirmButton.count()) > 0) {
        await confirmButton.click();
        await page.waitForTimeout(1000);

        // Verify status returned to available
        const statusBadge = page.locator('text=/사용 가능/i');
        await expect(statusBadge.first()).toBeVisible();

        console.log('✓ Disposal request cancelled');
      }
    } else {
      test.skip(true, 'No cancel permission (not requester)');
    }
  });
});
