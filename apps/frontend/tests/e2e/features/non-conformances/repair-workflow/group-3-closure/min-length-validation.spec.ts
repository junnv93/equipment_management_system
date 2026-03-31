// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should validate minimum length for repairDescription (10 chars)', async ({
    testOperatorPage,
  }) => {
    // Navigate to equipment list
    await testOperatorPage.goto('/equipment');

    // Click first equipment link
    const equipmentLink = testOperatorPage.locator('a[href*="/equipment/"]').first();
    await equipmentLink.click();

    // Extract equipment ID from URL
    const url = testOperatorPage.url();
    const equipmentId = url.match(/\/equipment\/([^/]+)/)?.[1];

    if (!equipmentId) {
      throw new Error('Could not extract equipment ID from URL');
    }

    // 1. Navigate to repair history page
    await testOperatorPage.goto(`/equipment/${equipmentId}/repair-history`);

    // 2. Click 'Add Repair History' button
    const addButton = testOperatorPage
      .locator('button')
      .filter({ hasText: /수리.*이력.*추가|add.*repair/i });
    await addButton.click();

    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 3. Enter repair date
    const today = new Date().toISOString().split('T')[0];
    const repairDateInput = dialog.locator('input[name="repairDate"], input[type="date"]').first();
    await repairDateInput.fill(today);

    // 4. Enter repair description with only 5 characters
    const repairDescriptionInput = dialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    await repairDescriptionInput.fill('12345');

    // 5. Click 'Register' button
    const registerButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /등록|register/i })
      .first();
    await registerButton.click();

    // 6. Verify validation error for min length

    // Validation error shows: 'Repair description must be at least 10 characters'
    const minLengthError = dialog.locator(
      'text=/수리 내용.*10자|description.*10/i, [class*="destructive"], [class*="error"]'
    );
    await expect(minLengthError).toBeVisible({ timeout: 3000 });

    // Form does not submit with invalid description
    await expect(dialog).toBeVisible();

    // Error clears when description reaches 10+ characters
    await repairDescriptionInput.fill('1234567890'); // Exactly 10 characters

    // Error should disappear
    await expect(minLengthError).not.toBeVisible({ timeout: 3000 });

    // Test with 10+ characters (valid)
    await repairDescriptionInput.fill('This is a valid repair description');

    await expect(minLengthError).not.toBeVisible();
  });
});
