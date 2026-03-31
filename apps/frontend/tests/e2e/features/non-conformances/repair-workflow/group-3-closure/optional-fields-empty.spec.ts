// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should submit successfully with optional fields empty', async ({ testOperatorPage }) => {
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

    // 3. Fill only required fields: repairDate, repairDescription (10+ chars)
    const today = new Date().toISOString().split('T')[0];
    const repairDateInput = dialog.locator('input[name="repairDate"], input[type="date"]').first();
    await repairDateInput.fill(today);

    const repairDescriptionInput = dialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    await repairDescriptionInput.fill('Valid repair description with more than 10 characters');

    // 4. Leave optional fields empty: repairedBy, repairCompany, cost, repairResult, notes
    // Ensure they are cleared if pre-filled
    const repairedByInput = dialog.locator('input[name="repairedBy"]');
    if (await repairedByInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await repairedByInput.clear();
    }

    const repairCompanyInput = dialog.locator('input[name="repairCompany"]');
    if (await repairCompanyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await repairCompanyInput.clear();
    }

    const costInput = dialog.locator('input[name="cost"]');
    if (await costInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await costInput.clear();
    }

    const notesInput = dialog.locator('textarea[name="notes"]');
    if (await notesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await notesInput.clear();
    }

    // 5. Click 'Register' button
    const registerButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /등록|register/i })
      .first();
    await registerButton.click();

    // Form submits successfully
    // Success toast appears
    const successToast = testOperatorPage
      .locator('[role="status"], [class*="toast"]')
      .filter({ hasText: /성공|success|등록|완료/i });
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Empty optional fields are converted to undefined (not empty strings)
    // Backend accepts the submission without validation errors

    // Dialog should close after successful submission
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
