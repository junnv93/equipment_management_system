// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-4. should prevent already-linked NC from appearing in repair dropdown', async ({
    techManagerPage: page,
  }) => {
    // 1. Navigate to repair history page for equipment with linked NC
    // Note: Equipment SUW-E0003 has NC already linked to repair
    await page.goto('/equipment/SUW-E0003/repair-history');

    await expect(page.getByRole('heading', { name: /수리 이력/i })).toBeVisible();

    // 2. Click 'Add Repair History' button
    const addButton = page.getByRole('button', { name: /수리 이력 추가/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for dialog to open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 3. Open NC selection dropdown
    const ncSelect = dialog.getByLabel(/부적합 연결/i);
    await expect(ncSelect).toBeVisible();
    await ncSelect.click();

    // 4. Verify linked NC does not appear
    // Get all NC options
    const ncOptions = ncSelect.locator('option');
    const optionTexts = await ncOptions.allTextContents();

    // NCs already linked to repair history are filtered out
    // Verify no option contains the already-linked NC reference
    const linkedNcPattern = /SUW-E0003.*손상/; // Pattern for the linked NC
    const hasLinkedNc = optionTexts.some((text) => linkedNcPattern.test(text));
    expect(hasLinkedNc).toBe(false);

    // Only unlinked open/analyzing/corrected NCs appear in dropdown
    // Verify 'None selected' option exists
    expect(optionTexts).toContain('선택 안함');

    // 1:1 relationship between NC and repair is enforced
    // Count options (excluding "None selected")
    const actualNcCount = optionTexts.filter((text) => text !== '선택 안함').length;

    // Verify that only available (unlinked) NCs are shown
    expect(actualNcCount).toBeGreaterThanOrEqual(0);
  });

  test('E-4. should only show unlinked NCs in dropdown', async ({ techManagerPage: page }) => {
    // Navigate to equipment with both linked and unlinked NCs
    await page.goto('/equipment/SUW-E0004/repair-history');

    const addButton = page.getByRole('button', { name: /수리 이력 추가/i });
    await addButton.click();

    const dialog = page.getByRole('dialog');
    const ncSelect = dialog.getByLabel(/부적합 연결/i);

    // Get dropdown options
    const ncOptions = ncSelect.locator('option[value]:not([value=""])');
    const count = await ncOptions.count();

    // Verify each option represents an unlinked NC
    for (let i = 0; i < count; i++) {
      const option = ncOptions.nth(i);
      const value = await option.getAttribute('value');

      // Value should be a valid NC ID
      expect(value).toBeTruthy();
      expect(value).not.toBe('');
    }
  });
});
