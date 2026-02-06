// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-3. should show success message when repair is connected to NC', async ({
    techManagerPage: page,
  }) => {
    // 1. Navigate to NC management page for equipment with corrected NC + repair
    // Note: Using test equipment that has NC with connected repair
    await page.goto('/equipment/SUW-E0003/non-conformance');

    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    // 2. Find NC card with repairHistoryId populated
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        hasText: '수리 이력 연결됨',
      })
      .first();

    await expect(ncCard).toBeVisible();

    // Green success text shows: 'Repair record connected - closure approval available'
    const successMessage = ncCard.locator('[data-testid="repair-connected-success"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('수리 이력 연결됨');
    await expect(successMessage).toContainText('종결 승인 가능');

    // Clickable link to repair history page is visible
    const repairLink = successMessage.getByRole('link', { name: /수리 이력 보기/i });
    await expect(repairLink).toBeVisible();
    await expect(repairLink).toHaveAttribute('href', /\/repair-history/);

    // Yellow warning card is NOT displayed
    const warningCard = ncCard.locator('[data-testid="repair-warning"]');
    await expect(warningCard).not.toBeVisible();

    // NC can proceed to closure
    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const statusSelect = page.getByLabel(/상태/i);
    await expect(statusSelect).toBeVisible();

    // Verify 'closed' option is available
    const closedOption = statusSelect.locator('option[value="closed"]');
    await expect(closedOption).toBeEnabled();
  });

  test('E-3. should allow clicking repair history link from success message', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/SUW-E0003/non-conformance');

    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        hasText: '수리 이력 연결됨',
      })
      .first();

    const successMessage = ncCard.locator('[data-testid="repair-connected-success"]');
    const repairLink = successMessage.getByRole('link', { name: /수리 이력 보기/i });

    await repairLink.click();

    // Should navigate to repair history page
    await expect(page).toHaveURL(/\/repair-history/);
    await expect(page.getByRole('heading', { name: /수리 이력/i })).toBeVisible();
  });
});
