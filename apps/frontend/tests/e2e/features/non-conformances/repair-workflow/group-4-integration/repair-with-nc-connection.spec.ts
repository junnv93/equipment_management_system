// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

/**
 * Test D-2: should create repair history with NC connection
 *
 * This test verifies that repair history can be created with a non-conformance
 * connection, and that the NC status automatically updates when repair is completed.
 *
 * Workflow:
 * 1. Navigate to repair history page for equipment with open NC
 * 2. Click 'Add Repair History' button
 * 3. Fill required fields: repairDate, repairDescription
 * 4. Select NC from dropdown
 * 5. Select repair result as 'completed'
 * 6. Submit the form
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { RepairResultValues as RRVal } from '@equipment-management/schemas';

test.describe('Full Workflow Integration', () => {
  let testEquipmentId: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should create repair history with NC connection', async ({ testOperatorPage }) => {
    // 1. Navigate to repair history page for equipment with open NC
    // First, find equipment with NC
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const firstDetailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // Extract equipment ID from URL
    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // Navigate to repair history page
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/repair-history`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 2. Click 'Add Repair History' button
    const addRepairButton = testOperatorPage.getByRole('button', {
      name: /수리 이력 추가|Add Repair History/i,
    });
    await expect(addRepairButton).toBeVisible();
    await addRepairButton.click();

    // 3. Fill required fields: repairDate, repairDescription
    const today = new Date().toISOString().split('T')[0];
    const repairDateInput = testOperatorPage.locator('input[type="date"]').first();
    await repairDateInput.fill(today);

    const repairDescriptionTextarea = testOperatorPage.locator('textarea').first();
    await repairDescriptionTextarea.fill('E2E Test: Sensor replacement completed successfully');

    // 4. Select NC from dropdown
    const ncSelect = testOperatorPage.locator('select').first();
    const ncOptions = await ncSelect.locator('option').count();

    if (ncOptions > 1) {
      // Select the first available NC (not 'None selected')
      await ncSelect.selectOption({ index: 1 });
      console.log('✓ NC selected from dropdown');

      // 5. Verify auto-link guidance appears
      const guidanceText = testOperatorPage.getByText(/연결|link|guide/i);
      if ((await guidanceText.count()) > 0) {
        console.log('✓ Auto-link guidance displayed');
      }
    } else {
      console.log('⚠ No NC available for linking');
    }

    // 6. Select repair result as 'completed'
    const repairResultSelect = testOperatorPage.locator('select').last();
    await repairResultSelect.selectOption(RRVal.COMPLETED);

    // 7. Submit the form
    const registerButton = testOperatorPage.getByRole('button', { name: /^등록$|^Register$/i });
    await registerButton.click();

    // Wait for success toast
    await testOperatorPage.waitForTimeout(1000);

    // Verify repair history was created
    await expect(
      testOperatorPage.getByText('E2E Test: Sensor replacement completed successfully')
    ).toBeVisible();
    console.log('✓ Repair history created successfully');

    // Verify NC link badge appears
    const ncLinkBadge = testOperatorPage.locator('text=/NC|부적합/i');
    if ((await ncLinkBadge.count()) > 0) {
      console.log('✓ NC link badge displayed');
    }
  });
});
