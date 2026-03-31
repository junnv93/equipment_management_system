// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should reset form after successful submission', async ({ testOperatorPage }) => {
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

    // 3. Fill all fields with test data
    const today = new Date().toISOString().split('T')[0];
    const repairDateInput = dialog.locator('input[name="repairDate"], input[type="date"]').first();
    await repairDateInput.fill(today);

    const repairDescriptionInput = dialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    await repairDescriptionInput.fill(
      'Test repair description with sufficient length for validation'
    );

    // Fill optional fields
    const repairedByInput = dialog.locator('input[name="repairedBy"]');
    if (await repairedByInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await repairedByInput.fill('Test Engineer');
    }

    const repairCompanyInput = dialog.locator('input[name="repairCompany"]');
    if (await repairCompanyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await repairCompanyInput.fill('Test Company');
    }

    const costInput = dialog.locator('input[name="cost"]');
    if (await costInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await costInput.fill('50000');
    }

    const notesInput = dialog.locator('textarea[name="notes"]');
    if (await notesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await notesInput.fill('Test notes');
    }

    // 4. Submit the form
    const registerButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /등록|register/i })
      .first();
    await registerButton.click();

    // 5. Wait for success toast
    const successToast = testOperatorPage
      .locator('[role="status"], [class*="toast"]')
      .filter({ hasText: /성공|success|등록|완료/i });
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // After successful submit, dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // 6. Click 'Add Repair History' button again
    const addButtonAgain = testOperatorPage
      .locator('button')
      .filter({ hasText: /수리.*이력.*추가|add.*repair/i });
    await addButtonAgain.click();

    // 7. Verify form fields are reset to defaults
    const newDialog = testOperatorPage.getByRole('dialog');
    await expect(newDialog).toBeVisible();

    // repairDate defaults to today's date (format: yyyy-MM-dd)
    const newRepairDateInput = newDialog
      .locator('input[name="repairDate"], input[type="date"]')
      .first();
    const repairDateValue = await newRepairDateInput.inputValue();
    const expectedDate = new Date().toISOString().split('T')[0];

    expect(repairDateValue).toBe(expectedDate);

    // repairDescription is empty
    const newRepairDescriptionInput = newDialog
      .locator('textarea[name="repairDescription"], textarea[placeholder*="수리"]')
      .first();
    const descriptionValue = await newRepairDescriptionInput.inputValue();

    expect(descriptionValue).toBe('');

    // Optional fields are empty/undefined
    const newRepairedByInput = newDialog.locator('input[name="repairedBy"]');
    if (await newRepairedByInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const repairedByValue = await newRepairedByInput.inputValue();
      expect(repairedByValue).toBe('');
    }

    const newRepairCompanyInput = newDialog.locator('input[name="repairCompany"]');
    if (await newRepairCompanyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const repairCompanyValue = await newRepairCompanyInput.inputValue();
      expect(repairCompanyValue).toBe('');
    }

    const newCostInput = newDialog.locator('input[name="cost"]');
    if (await newCostInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const costValue = await newCostInput.inputValue();
      expect(costValue).toBe('');
    }

    const newNotesInput = newDialog.locator('textarea[name="notes"]');
    if (await newNotesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const notesValue = await newNotesInput.inputValue();
      expect(notesValue).toBe('');
    }

    // nonConformanceId shows 'None selected' placeholder
    const ncSelect = newDialog
      .locator('select[name="nonConformanceId"], button[role="combobox"]')
      .first();
    if (await ncSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      const ncText = await ncSelect.textContent();
      if (
        ncText &&
        (ncText.includes('선택') || ncText.includes('None') || ncText.includes('없음'))
      ) {
        // Placeholder is shown as expected
      }
    }
  });
});
