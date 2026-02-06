// spec: apps/frontend/tests/e2e/disposal/disposal-workflow.plan.md
// seed: tests/e2e/disposal/seed.spec.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToReviewedDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('UI/UX & Accessibility', () => {
  test.afterAll(async () => {
    await cleanupPool();
  });

  test('progress stepper - step 2 (reviewed)', async ({ testOperatorPage }) => {
    // Equipment IDs from seed data (Group E)
    const equipmentId = 'dddd0402-0402-4402-8402-000000000402'; // EQUIP_DISPOSAL_UI_E2
    const disposalRequestId = 'dddd1402-0402-4402-8402-000000000402'; // DISP_REQ_E2_ID
    const requesterId = '00000000-0000-0000-0000-000000000001'; // USER_TEST_ENGINEER_SUWON_ID
    const reviewerId = '00000000-0000-0000-0000-000000000002'; // USER_TECHNICAL_MANAGER_SUWON_ID

    // Reset equipment to reviewed disposal state for test consistency
    await resetEquipmentToReviewedDisposal(equipmentId, disposalRequestId, requesterId, reviewerId);

    // 1. Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${equipmentId}`);

    // 2. Click "폐기 진행 중" button to open dropdown menu
    const disposalButton = testOperatorPage.getByRole('button', { name: /폐기 진행 중/ });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. Wait for dropdown menu to appear and locate it
    const dropdownMenu = testOperatorPage.getByRole('menu');
    await expect(dropdownMenu).toBeVisible({ timeout: 10000 });

    // 4. Verify progress stepper at step 2 (reviewed state)
    // When reviewed: step 1 & 2 are complete, step 3 is current

    // Step 1 (요청) should be COMPLETED (green with checkmark)
    const step1Container = dropdownMenu.locator('.flex.flex-col.items-center.gap-1').nth(0);
    await expect(step1Container.getByText('요청', { exact: true })).toBeVisible();
    await expect(step1Container.locator('.border-green-500.bg-green-500')).toBeVisible();

    // Step 2 (검토) should be COMPLETED (green with checkmark)
    const step2Container = dropdownMenu.locator('.flex.flex-col.items-center.gap-1').nth(1);
    await expect(step2Container.getByText('검토', { exact: true })).toBeVisible();
    await expect(step2Container.locator('.border-green-500.bg-green-500')).toBeVisible();

    // Step 3 (승인) should be CURRENT (orange with aria-current="step")
    const currentStep = dropdownMenu.locator('[aria-current="step"]');
    await expect(currentStep).toBeVisible();
    const step3Container = currentStep.locator('..');
    await expect(step3Container.getByText('승인', { exact: true })).toBeVisible();

    // 5. Verify only one step has aria-current="step" in the dropdown
    const allStepsWithAriaCurrent = dropdownMenu.locator('[aria-current="step"]');
    await expect(allStepsWithAriaCurrent).toHaveCount(1);

    // 6. Verify all three step labels are visible in the dropdown
    await expect(dropdownMenu.getByText('요청', { exact: true })).toBeVisible();
    await expect(dropdownMenu.getByText('검토', { exact: true })).toBeVisible();
    await expect(dropdownMenu.getByText('승인', { exact: true })).toBeVisible();

    console.log(
      '✅ Progress stepper step 2 (reviewed) verified - steps 1 & 2 complete, step 3 current'
    );
  });
});
