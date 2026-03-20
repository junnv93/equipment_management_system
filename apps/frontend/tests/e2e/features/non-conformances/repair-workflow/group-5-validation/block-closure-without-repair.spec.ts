// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { NonConformanceStatusValues as NCSVal } from '@equipment-management/schemas';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-2. should block NC closure without repair for damage/malfunction', async ({
    techManagerPage: page,
  }) => {
    // 1. Login as technical_manager (already done via fixture)

    // 2. Navigate to NC management page with damage NC without repair
    await page.goto('/equipment/SUW-E0001/non-conformance');

    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    // Find damage type NC without repair
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/손상/i'),
      })
      .first();

    await expect(ncCard).toBeVisible();

    // 3. Click 'Edit Record' button
    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 4. Try to change status to 'corrected'
    const statusSelect = page.getByLabel(/상태/i);
    await expect(statusSelect).toBeVisible();

    // Setup dialog handler before changing status
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      // Dialog message mentions repair requirement
      expect(dialog.type()).toBe('confirm');
      expect(dialogMessage).toContain('수리 이력');

      // Clicking Cancel prevents status change
      await dialog.dismiss();
    });

    await statusSelect.selectOption(NCSVal.CORRECTED);

    // 5. Verify dialog appears
    // Wait for dialog to be handled
    await page.waitForEvent('dialog');

    // Verify dialog message was captured
    expect(dialogMessage).toBeTruthy();
  });

  test('E-2. should redirect to repair history when user confirms dialog', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/SUW-E0001/non-conformance');

    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/손상/i'),
      })
      .first();

    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await editButton.click();

    const statusSelect = page.getByLabel(/상태/i);

    // Setup dialog handler to accept
    page.on('dialog', async (dialog) => {
      // Clicking OK redirects to repair history page
      await dialog.accept();
    });

    await statusSelect.selectOption(NCSVal.CORRECTED);

    // Wait for navigation to repair history page
    await expect(page).toHaveURL(/\/repair-history/);
  });
});
