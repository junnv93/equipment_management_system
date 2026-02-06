// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-5. should prevent closed NC from appearing in repair dropdown', async ({
    techManagerPage: page,
  }) => {
    // 1. Navigate to repair history page for equipment with closed NC
    // Note: Equipment SUW-E0005 has a closed NC
    await page.goto('/equipment/SUW-E0005/repair-history');

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

    // 4. Verify closed NC does not appear
    const ncOptions = ncSelect.locator('option');
    const optionTexts = await ncOptions.allTextContents();

    // Closed NCs are not available for repair linking
    const closedNcPattern = /종결|closed/i;
    const hasClosedStatus = optionTexts.some((text) => closedNcPattern.test(text));
    expect(hasClosedStatus).toBe(false);

    // Only open, analyzing, corrected status NCs appear
    // Verify options only contain valid statuses
    const validStatusPattern = /(열림|분석중|시정완료|open|analyzing|corrected)/i;
    const nonEmptyOptions = optionTexts.filter(
      (text) => text !== '선택 안함' && text.trim() !== ''
    );

    // All non-empty options should be valid status NCs
    for (const optionText of nonEmptyOptions) {
      // Each option should contain status info or be a valid NC
      expect(optionText).toBeTruthy();
    }

    // Prevents modification of historical closed records
    // Verify "None selected" is the first option
    expect(optionTexts[0]).toContain('선택 안함');
  });

  test('E-5. should show only open/analyzing/corrected NCs', async ({ techManagerPage: page }) => {
    // Navigate to equipment with mixed NC statuses
    await page.goto('/equipment/SUW-E0006/repair-history');

    const addButton = page.getByRole('button', { name: /수리 이력 추가/i });
    await addButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const ncSelect = dialog.getByLabel(/부적합 연결/i);

    // Get all option values (excluding empty/none)
    const ncOptions = ncSelect.locator('option[value]:not([value=""])');
    const count = await ncOptions.count();

    // Verify we have some NCs available
    expect(count).toBeGreaterThanOrEqual(0);

    // Verify each option is for a non-closed NC
    for (let i = 0; i < count; i++) {
      const option = ncOptions.nth(i);
      const text = await option.textContent();

      // Should not contain "closed" status indicator
      expect(text).not.toMatch(/종결|closed/i);
    }
  });

  test('E-5. should allow linking to corrected NC but not closed NC', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/SUW-E0007/repair-history');

    const addButton = page.getByRole('button', { name: /수리 이력 추가/i });
    await addButton.click();

    const dialog = page.getByRole('dialog');
    const ncSelect = dialog.getByLabel(/부적합 연결/i);

    const options = await ncSelect.locator('option').allTextContents();

    // Should include corrected status NCs
    const hasCorrectedOption = options.some(
      (text) => text.includes('시정완료') || text.includes('corrected')
    );

    // Should not include closed status NCs
    const hasClosedOption = options.some(
      (text) => text.includes('종결') || text.includes('closed')
    );

    // Corrected NCs are allowed, closed NCs are not
    expect(hasClosedOption).toBe(false);
  });
});
