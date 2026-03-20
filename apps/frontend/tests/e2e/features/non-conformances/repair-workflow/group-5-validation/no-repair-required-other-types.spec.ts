// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  NonConformanceStatusValues as NCSVal,
  ResolutionTypeValues as RTVal,
} from '@equipment-management/schemas';

test.describe('Group E: Data Integrity and Business Rules', () => {
  test('E-6. should not require repair for calibration_failure or measurement_error types', async ({
    techManagerPage: page,
  }) => {
    // 1. Navigate to NC management page with calibration_failure NC
    // Note: Equipment SUW-E0008 has calibration_failure NC
    await page.goto('/equipment/SUW-E0008/non-conformance');

    await expect(page.getByRole('heading', { name: /부적합 관리/i })).toBeVisible();

    // Find calibration_failure type NC
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/교정 실패|calibration.failure/i'),
      })
      .first();

    await expect(ncCard).toBeVisible();

    // 2. Verify no repair warning card appears
    const warningCard = ncCard.locator('[data-testid="repair-warning"]');
    await expect(warningCard).not.toBeVisible();

    // calibration_failure and measurement_error types do not show repair warning
    await expect(ncCard).not.toContainText('수리 이력 필요');

    // 3. Attempt to change status to corrected
    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const statusSelect = page.getByLabel(/상태/i);
    await expect(statusSelect).toBeVisible();

    // Setup dialog listener (should not trigger)
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    // Change status to corrected
    await statusSelect.selectOption(NCSVal.CORRECTED);

    // Wait a moment to ensure no dialog appears
    await page.waitForTimeout(500);

    // 4. Verify no confirmation dialog appears
    // These types can be corrected without repair
    expect(dialogTriggered).toBe(false);

    // Verify status change is allowed
    const selectedValue = await statusSelect.inputValue();
    expect(selectedValue).toBe(NCSVal.CORRECTED);
  });

  test('E-6. should allow recalibration as resolution type instead of repair', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/SUW-E0008/non-conformance');

    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/교정 실패/i'),
      })
      .first();

    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await editButton.click();

    // Verify resolution type field is available
    const resolutionTypeSelect = page.getByLabel(/해결 방법|resolution.type/i);
    await expect(resolutionTypeSelect).toBeVisible();

    // resolutionType can be 'recalibration' instead of 'repair'
    const recalibrationOption = resolutionTypeSelect.locator('option[value="recalibration"]');
    await expect(recalibrationOption).toBeVisible();

    // Select recalibration
    await resolutionTypeSelect.selectOption(RTVal.RECALIBRATION);

    const selectedValue = await resolutionTypeSelect.inputValue();
    expect(selectedValue).toBe(RTVal.RECALIBRATION);
  });

  test('E-6. should allow technical_manager to close calibration_failure without repair', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/SUW-E0009/non-conformance');

    // Find calibration_failure NC with corrected status
    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/교정 실패/i'),
      })
      .filter({
        has: page.locator('text=/시정완료|corrected/i'),
      })
      .first();

    await expect(ncCard).toBeVisible();

    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await editButton.click();

    const statusSelect = page.getByLabel(/상태/i);

    // Technical manager can close without repair requirement
    const closedOption = statusSelect.locator('option[value="closed"]');
    await expect(closedOption).toBeVisible();
    await expect(closedOption).toBeEnabled();

    // Verify no dialog appears when closing
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await statusSelect.selectOption(NCSVal.CLOSED);
    await page.waitForTimeout(500);

    expect(dialogTriggered).toBe(false);
  });

  test('E-6. should allow measurement_error type to be corrected without repair', async ({
    techManagerPage: page,
  }) => {
    // Navigate to equipment with measurement_error NC
    await page.goto('/equipment/SUW-E0010/non-conformance');

    const ncCard = page
      .locator('[data-testid="nc-card"]')
      .filter({
        has: page.locator('text=/측정 오류|measurement.error/i'),
      })
      .first();

    await expect(ncCard).toBeVisible();

    // Verify no repair warning
    const warningCard = ncCard.locator('[data-testid="repair-warning"]');
    await expect(warningCard).not.toBeVisible();

    // Can be corrected without repair
    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await editButton.click();

    const statusSelect = page.getByLabel(/상태/i);
    await statusSelect.selectOption(NCSVal.CORRECTED);

    // No dialog should appear
    await page.waitForTimeout(500);

    const selectedValue = await statusSelect.inputValue();
    expect(selectedValue).toBe(NCSVal.CORRECTED);
  });
});
