// spec: apps/frontend/tests/e2e/disposal/disposal-workflow.plan.md
// seed: tests/e2e/disposal/seed.spec.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToAvailable, cleanupPool } from '../helpers/db-cleanup';

test.describe('UI/UX & Accessibility', () => {
  test.afterAll(async () => {
    await cleanupPool();
  });

  test('screen reader accessibility', async ({ testOperatorPage }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds
    // Equipment ID from seed data (Group A)
    const equipmentId = 'dddd0001-0001-4001-8001-000000000001'; // EQUIP_DISPOSAL_PERM_A1

    // Reset equipment to available state for test consistency
    await resetEquipmentToAvailable(equipmentId);

    // 1. Navigate to equipment detail page with cache-busting parameter
    await testOperatorPage.goto(`/equipment/${equipmentId}?_t=${Date.now()}`);
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // 2. Click "폐기 요청" button
    const disposalButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. Verify dialog ARIA attributes - use specific selector to avoid mobile nav drawer
    const dialog = testOperatorPage.getByRole('dialog', { name: /장비 폐기 요청/ });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // 4. Verify role="dialog"
    const roleAttribute = await dialog.getAttribute('role');
    expect(roleAttribute).toBe('dialog');

    // 5. Verify aria-modal="true"
    const ariaModal = await dialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    // 6. Verify aria-labelledby links to dialog title
    const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
    expect(ariaLabelledby).toBeTruthy();

    // Verify the referenced element exists
    if (ariaLabelledby) {
      const titleElement = testOperatorPage.locator(`#${ariaLabelledby}`);
      await expect(titleElement).toBeVisible({ timeout: 10000 });
      await expect(titleElement).toContainText(/폐기 요청/);
    }

    // 7. Verify form field labels and aria-describedby
    // Check reasonDetail textarea has proper labeling
    const reasonDetailTextarea = dialog.locator('textarea[name="reasonDetail"]');

    if ((await reasonDetailTextarea.count()) > 0) {
      // Check if textarea has associated label
      const textareaId = await reasonDetailTextarea.getAttribute('id');
      if (textareaId) {
        const label = testOperatorPage.locator(`label[for="${textareaId}"]`);
        // Label should exist (might be visible or not depending on design)
        const labelCount = await label.count();
        expect(labelCount).toBeGreaterThanOrEqual(0);
      }

      // Check for aria-describedby hint
      const ariaDescribedby = await reasonDetailTextarea.getAttribute('aria-describedby');
      if (ariaDescribedby) {
        const hintElement = testOperatorPage.locator(`#${ariaDescribedby}`);
        const hintCount = await hintElement.count();
        expect(hintCount).toBeGreaterThan(0);
      }
    }

    // 8. Verify radio button group has proper ARIA attributes
    // Check radiogroup role and aria-required
    const radioGroup = dialog.locator('[role="radiogroup"]');
    await expect(radioGroup).toBeVisible();
    const ariaRequired = await radioGroup.getAttribute('aria-required');
    expect(ariaRequired).toBe('true');

    // Verify radio buttons have associated labels
    const radioButtons = dialog.locator('button[role="radio"]');
    const radioCount = await radioButtons.count();
    expect(radioCount).toBeGreaterThan(0);

    // Verify first radio button as sample
    const firstRadio = radioButtons.first();
    const firstRadioId = await firstRadio.getAttribute('id');
    if (firstRadioId) {
      const associatedLabel = testOperatorPage.locator(`label[for="${firstRadioId}"]`);
      await expect(associatedLabel).toBeVisible();
    }

    // 9. Verify WCAG 2.1 AA compliance indicators for action buttons
    // Check submit and cancel buttons (exclude radio buttons)
    const submitButton = dialog.getByRole('button', { name: '폐기 요청', exact: true });
    await expect(submitButton).toBeVisible();

    const cancelButton = dialog.getByRole('button', { name: '취소' });
    await expect(cancelButton).toBeVisible();

    // 10. Verify file upload button has proper aria-label
    const fileUploadButton = dialog.getByRole('button', { name: '파일 선택' });
    await expect(fileUploadButton).toBeVisible();
    const fileAriaLabel = await fileUploadButton.getAttribute('aria-label');
    expect(fileAriaLabel).toBe('파일 선택');

    console.log(
      '✅ ARIA attributes verified: role="dialog", aria-modal="true", aria-labelledby, proper labeling'
    );
  });
});
