// spec: apps/frontend/tests/e2e/disposal/disposal-workflow.plan.md
// seed: tests/e2e/disposal/seed.spec.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('UI/UX & Accessibility', () => {
  test('progress stepper - step 1 (pending)', async ({ testOperatorPage }) => {
    // 1. Navigate to equipment detail page
    await testOperatorPage.goto('/equipment/dddd0401-0401-4401-8401-000000000401');

    // 2. Click "폐기 진행 중" button to open dropdown menu
    const disposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. Wait for dropdown menu to appear and locate it
    const dropdownMenu = testOperatorPage.getByRole('menu');
    await expect(dropdownMenu).toBeVisible({ timeout: 10000 });

    // 4. Verify progress stepper step 1 is current (active) inside dropdown menu
    // Step 1 should have aria-current="step" and contain "요청" text
    const currentStep = dropdownMenu.locator('[aria-current="step"]');
    await expect(currentStep).toBeVisible();

    // Verify the current step is step 1 (요청)
    // The step should have orange styling (current state)
    const step1Container = currentStep.locator('..');
    await expect(step1Container.getByText('요청')).toBeVisible();

    // 5. Verify all three step labels are visible in the dropdown
    // Use exact: true to avoid matching "요청 취소"
    await expect(dropdownMenu.getByText('요청', { exact: true })).toBeVisible();
    await expect(dropdownMenu.getByText('검토', { exact: true })).toBeVisible();
    await expect(dropdownMenu.getByText('승인', { exact: true })).toBeVisible();

    // 6. Verify only one step has aria-current="step" in the dropdown
    const allStepsWithAriaCurrent = dropdownMenu.locator('[aria-current="step"]');
    await expect(allStepsWithAriaCurrent).toHaveCount(1);

    console.log('✅ Progress stepper step 1 active state verified');
  });
});
