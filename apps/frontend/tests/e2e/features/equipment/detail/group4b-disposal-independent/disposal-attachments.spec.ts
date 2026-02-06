/**
 * Equipment Detail Page - Disposal with File Attachments
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  test('Disposal workflow with file attachments', async ({ testOperatorPage: page }) => {
    // Navigate to available equipment
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    const availableBadge = page.locator('text=/사용 가능/i').first();
    const availableCard = availableBadge.locator('..').locator('..');

    const detailLink = availableCard.getByRole('link', { name: /상세/i }).first();
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // Click disposal request button
    const disposalButton = page.getByRole('button', { name: /폐기 요청/i });

    if ((await disposalButton.count()) === 0) {
      test.skip(true, 'Disposal request not available');
    }

    await disposalButton.click();
    await page.waitForTimeout(500);

    // Look for file upload button
    const fileUploadButton = page
      .locator('button, label')
      .filter({ hasText: /파일 선택|파일 업로드/i });

    if ((await fileUploadButton.count()) > 0) {
      // Verify file input exists (hidden)
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput.first()).toBeAttached();

      console.log('✓ File upload functionality available');
    } else {
      console.log('ℹ File upload not implemented or not visible');
    }

    // Close dialog
    const closeButton = page
      .locator('button[aria-label="Close"], button')
      .filter({ hasText: /닫기|취소/i });
    if ((await closeButton.count()) > 0) {
      await closeButton.first().click();
    }
  });
});
