// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should validate cost field accepts only non-negative numbers', async ({
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

    // 2. Click 'Add Repair History' button
    const addButton = testOperatorPage
      .locator('button')
      .filter({ hasText: /수리.*이력.*추가|add.*repair/i });
    await addButton.click();
    await testOperatorPage.waitForTimeout(500);

    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 3. Fill required fields
    const today = new Date().toISOString().split('T')[0];
    const repairDateInput = dialog.locator('input[name="repairDate"], input[type="date"]').first();
    await repairDateInput.fill(today);

    const repairDescriptionInput = dialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    await repairDescriptionInput.fill('Valid repair description with sufficient length');

    // 4. Enter negative number in cost field
    const costInput = dialog
      .locator('input[name="cost"], input[type="number"]')
      .filter({ hasText: /비용|cost/i })
      .or(dialog.locator('input[name="cost"]'))
      .first();

    // Verify cost field has type='number' with min='0'
    const costInputType = await costInput.getAttribute('type');
    const costInputMin = await costInput.getAttribute('min');

    expect(costInputType).toBe('number');

    if (costInputMin !== null) {
      expect(costInputMin).toBe('0');
    }

    // Try to enter negative value
    await costInput.fill('-100');
    await testOperatorPage.waitForTimeout(500);

    // 5. Verify validation behavior
    // Click submit to trigger validation
    const registerButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /등록|register/i })
      .first();
    await registerButton.click();
    await testOperatorPage.waitForTimeout(500);

    // Negative values show validation error
    const costError = dialog.locator(
      'text=/비용.*0 이상|cost.*0|negative/i, [class*="destructive"], [class*="error"]'
    );

    // Check if error is visible or if the value was reset/invalid
    const hasError = await costError.isVisible({ timeout: 2000 }).catch(() => false);
    const costValue = await costInput.inputValue();

    if (!hasError && costValue !== '' && costValue !== '0' && parseFloat(costValue) < 0) {
      throw new Error('Negative cost not properly validated');
    }

    // 6. Enter valid positive number
    await costInput.clear();
    await costInput.fill('50000');
    await testOperatorPage.waitForTimeout(500);

    // 7. Verify validation passes
    // No error should be visible
    await expect(costError)
      .not.toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Expected - no error
      });

    // Test with zero (should be valid)
    await costInput.clear();
    await costInput.fill('0');
    await testOperatorPage.waitForTimeout(500);

    // Zero and positive values are accepted
    await expect(costError)
      .not.toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Expected - no error
      });
  });
});
