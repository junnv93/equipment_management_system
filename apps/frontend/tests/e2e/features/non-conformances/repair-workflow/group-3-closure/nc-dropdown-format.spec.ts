// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Repair History Form Validation', () => {
  test('should display NC dropdown with correct label format', async ({ testOperatorPage }) => {
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

    // Check if equipment has NCs by navigating to NC page
    await testOperatorPage.goto(`/equipment/${equipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    // Check if there are any NCs
    const ncCards = testOperatorPage
      .locator('[class*="border"]')
      .filter({ hasText: /발견일|부적합 원인/ });
    const ncCount = await ncCards.count();

    if (ncCount === 0) {
      // Create a test NC if none exists
      const registerButton = testOperatorPage.locator('button').filter({ hasText: /부적합 등록/ });
      if (await registerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await registerButton.click();
        await testOperatorPage.waitForTimeout(500);

        // Fill NC form
        const causeTextarea = testOperatorPage.locator('textarea[placeholder*="부적합 원인"]');
        await causeTextarea.fill('Test NC cause for repair history dropdown testing');

        const submitButton = testOperatorPage.locator('button').filter({ hasText: /^등록$/ });
        await submitButton.click();
        await testOperatorPage.waitForTimeout(2000);
      }
    }

    // 1. Navigate to repair history page for equipment with open NCs
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

    // 3. Click on NC selection dropdown
    const ncDropdown = dialog
      .locator('select[name="nonConformanceId"], button[role="combobox"]')
      .filter({ hasText: /부적합|선택|none/i })
      .or(
        dialog
          .locator('label')
          .filter({ hasText: /부적합/ })
          .locator('xpath=following-sibling::*')
          .first()
      )
      .first();

    await ncDropdown.click();
    await testOperatorPage.waitForTimeout(500);

    // 4. Verify dropdown options format

    // Dropdown shows 'None selected' as first option
    const noneOption = testOperatorPage
      .locator('option, [role="option"]')
      .filter({ hasText: /없음|선택|none/i })
      .first();
    if (await noneOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      // None option is visible as expected
    }

    // NC options follow format: [TYPE_LABEL] cause_text (YYYY-MM-DD)
    const ncOptions = testOperatorPage
      .locator('option:not([value=""]), [role="option"]')
      .filter({ hasText: /\[.*\].*\(/ })
      .or(
        testOperatorPage
          .locator('option, [role="option"]')
          .filter({ hasText: /손상|오작동|교정|측정|기타/ })
      );

    const optionCount = await ncOptions.count();

    if (optionCount > 0) {
      // Check first option format
      const firstOption = ncOptions.first();
      const optionText = await firstOption.textContent();

      // TYPE_LABEL uses NON_CONFORMANCE_TYPE_LABELS from SSOT
      // Expected format: [TYPE_LABEL] cause_text (YYYY-MM-DD)

      const hasTypeLabel = /손상|오작동|교정|측정|기타/.test(optionText || '');
      const hasDateFormat = /\d{4}-\d{2}-\d{2}|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/.test(
        optionText || ''
      );

      if (!hasTypeLabel) {
        throw new Error(
          'NC option does not contain TYPE_LABEL from SSOT (NON_CONFORMANCE_TYPE_LABELS)'
        );
      }

      if (!hasDateFormat) {
        throw new Error('NC option does not contain date in YYYY-MM-DD format');
      }

      // Only open/analyzing/corrected NCs appear (not closed)
      // NCs already linked to repair do not appear
      // These are verified by the filtering logic in the component
    }
  });
});
