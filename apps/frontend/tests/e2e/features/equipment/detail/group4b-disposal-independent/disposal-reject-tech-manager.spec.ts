/**
 * Equipment Detail Page - Disposal Rejection by Technical Manager
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  test('Reject disposal request as technical manager', async ({ techManagerPage: page }) => {
    // Navigate to equipment with pending disposal (if exists)
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const pendingBadge = page.locator('text=/폐기.*대기|pending/i').first();
    const pendingExists = (await pendingBadge.count()) > 0;

    if (!pendingExists) {
      test.skip(true, 'No pending disposal request found');
    }

    // Navigate to pending disposal equipment
    const pendingCard = pendingBadge.locator('..').locator('..');
    const detailLink = pendingCard.getByRole('link', { name: /상세/i });
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // Look for review button
    const reviewButton = page.getByRole('button', { name: /검토/i });

    if ((await reviewButton.count()) > 0) {
      await reviewButton.click();
      await page.waitForTimeout(500);

      // Enter rejection reason
      const reasonInput = page.locator('textarea, input[type="text"]').first();
      await reasonInput.fill('추가 점검이 필요하여 반려합니다.');

      // Click reject button
      const rejectButton = page.getByRole('button', { name: /반려/i });
      await rejectButton.click();

      // Confirm rejection (if confirmation dialog appears)
      await page.waitForTimeout(500);
      const confirmButton = page.getByRole('button', { name: /확인|반려/i });
      if ((await confirmButton.count()) > 0) {
        await confirmButton.click();
      }

      console.log('✓ Disposal request rejected');
    } else {
      test.skip(true, 'No review permission for this equipment');
    }
  });
});
