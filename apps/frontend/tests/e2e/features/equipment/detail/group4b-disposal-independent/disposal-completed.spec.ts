/**
 * Equipment Detail Page - Disposal Completed State
 *
 * SSOT: Relative paths
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  test('Disposal completed state', async ({ testOperatorPage: page }) => {
    // Navigate to equipment list to find disposed equipment
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Look for disposed equipment (if exists)
    const disposedBadge = page.locator('text=/폐기/i').first();
    const disposedExists = (await disposedBadge.count()) > 0;

    if (!disposedExists) {
      test.skip(true, 'No disposed equipment found');
    }

    // Navigate to disposed equipment detail
    const disposedCard = disposedBadge.locator('..').locator('..');
    const detailLink = disposedCard.getByRole('link', { name: /상세/i });
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // Verify DisposedBanner or disposed indicator
    const disposedIndicator = page.locator('text=/폐기 완료|disposed/i');
    await expect(disposedIndicator.first()).toBeVisible();

    // Verify action buttons are disabled
    const editButton = page.getByRole('button', { name: /수정/i });
    if ((await editButton.count()) > 0) {
      await expect(editButton).toBeDisabled();
    }

    console.log('✓ Disposed equipment displays correctly');
  });
});
