// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should validate required fields (repairDate, repairDescription)', async ({
    testOperatorPage,
  }) => {
    // Navigate to equipment list
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // Click first equipment link
    const equipmentLink = testOperatorPage.locator('a[href*="/equipment/"]').first();
    await equipmentLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // Extract equipment ID from URL
    const url = testOperatorPage.url();
    const equipmentId = url.match(/\/equipment\/([^/]+)/)?.[1];

    if (!equipmentId) {
      throw new Error('Could not extract equipment ID from URL');
    }

    // 1. Navigate to repair history page
    await testOperatorPage.goto(`/equipment/${equipmentId}/repair-history`);
    await testOperatorPage.waitForLoadState('networkidle');

    // Verify we're on the repair history page
    await expect(
      testOperatorPage.locator('h1, h2').filter({ hasText: /수리.*이력|repair.*history/i })
    ).toBeVisible({ timeout: 10000 });

    // 2. Click 'Add Repair History' button
    const addButton = testOperatorPage
      .locator('button')
      .filter({ hasText: /수리.*이력.*추가|add.*repair/i });
    await addButton.click();
    await testOperatorPage.waitForTimeout(500);

    // Verify dialog opened
    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 3. Clear the pre-filled repair date
    const repairDateInput = dialog.locator('input[name="repairDate"], input[type="date"]').first();
    await repairDateInput.clear();

    // 4. Leave repair description empty
    const repairDescriptionInput = dialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    await repairDescriptionInput.clear();

    // 5. Click 'Register' button
    const registerButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /등록|register/i })
      .first();
    await registerButton.click();
    await testOperatorPage.waitForTimeout(500);

    // 6. Verify validation errors appear

    // Form shows validation error for empty repair date
    const dateError = dialog
      .locator('text=/수리 일자를 입력하세요|required/i, [class*="destructive"], [class*="error"]')
      .filter({ hasText: /수리 일자|date/i });
    await expect(dateError).toBeVisible({ timeout: 3000 });

    // Form shows validation error for empty repair description
    const descriptionError = dialog
      .locator(
        'text=/수리 내용.*10자|description.*10|required/i, [class*="destructive"], [class*="error"]'
      )
      .filter({ hasText: /수리 내용|description/i });
    await expect(descriptionError).toBeVisible({ timeout: 3000 });

    // Submit button remains enabled but form does not submit
    await expect(dialog).toBeVisible();
    await expect(registerButton).toBeEnabled();

    // Error messages match Zod schema messages
    await expect(dateError).toContainText(/수리 일자/);
    await expect(descriptionError).toContainText(/수리 내용.*10자|10/);
  });
});
