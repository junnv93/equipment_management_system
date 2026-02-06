// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-1. should show repair warning for damage/malfunction NC types', async ({
    techManagerPage: page,
  }) => {
    // 1. Navigate to NC management page for equipment with damage type NC (no repair)
    // Note: Using known test equipment ID that has damage type NC without repair
    await page.goto('/equipment/SUW-E0001/non-conformance');

    // Wait for NC list to load
    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    // 2. Find NC card with ncType = damage or malfunction
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/손상|고장/i'),
      })
      .first();

    // 3. Verify warning card is displayed
    const warningCard = ncCard.locator('[data-testid="repair-warning"]');
    await expect(warningCard).toBeVisible();

    // Yellow warning card appears with text 'Repair record required'
    await expect(warningCard).toContainText('수리 이력 필요');

    // Warning explains that damage/malfunction types require repair before closure
    await expect(warningCard).toContainText(
      '손상/고장 유형의 부적합은 종결 전 수리 이력이 필요합니다'
    );

    // Link to repair history page is provided
    const repairLink = warningCard.getByRole('link', { name: /수리 이력 등록/i });
    await expect(repairLink).toBeVisible();
    await expect(repairLink).toHaveAttribute('href', /\/repair-history/);
  });

  test('E-1. should NOT show repair warning for calibration_failure type', async ({
    techManagerPage: page,
  }) => {
    // Navigate to equipment with calibration_failure NC
    await page.goto('/equipment/SUW-E0002/non-conformance');

    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    // Find NC card with calibration_failure type
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/교정 실패/i'),
      })
      .first();

    await expect(ncCard).toBeVisible();

    // Warning does NOT appear for calibration_failure, measurement_error, or other types
    const warningCard = ncCard.locator('[data-testid="repair-warning"]');
    await expect(warningCard).not.toBeVisible();
  });
});
