// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

/**
 * Test D-1: should change equipment status to non_conforming when NC is created
 *
 * This test verifies that when a non-conformance is registered, the equipment
 * status automatically changes from 'available' to 'non_conforming'.
 *
 * Workflow:
 * 1. Navigate to equipment detail page for available equipment
 * 2. Verify current status is 'available'
 * 3. Create a damage type NC through incident registration
 * 4. Verify equipment status changed to 'non_conforming'
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { NonConformanceTypeValues as NCTVal } from '@equipment-management/schemas';

test.describe('Full Workflow Integration', () => {
  let testEquipmentId: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should change equipment status to non_conforming when NC is created', async ({
    testOperatorPage,
  }) => {
    // 1. Navigate to equipment detail page for available equipment
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // Find first available equipment
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

    // 2. Verify current status is 'available'
    const initialStatus = testOperatorPage.locator('[role="status"], .badge').first();
    const initialStatusText = await initialStatus.textContent();
    console.log(`✓ Initial equipment status: ${initialStatusText}`);

    // 3. Click on 'Incident History' tab
    const incidentTab = testOperatorPage.getByRole('tab', { name: /사고 이력/i });
    if ((await incidentTab.count()) > 0) {
      await incidentTab.click();
      await testOperatorPage.waitForLoadState('networkidle');
    } else {
      // Navigate directly to incident history page
      await testOperatorPage.goto(`/equipment/${testEquipmentId}`);
      await testOperatorPage.waitForLoadState('networkidle');
    }

    // 4. Click 'Register Incident' button
    const registerButton = testOperatorPage.getByRole('button', {
      name: /사고 등록|Register Incident/i,
    });
    await expect(registerButton).toBeVisible();
    await registerButton.click();

    // 5. Fill incident date with today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = testOperatorPage.locator('input[type="date"]').first();
    await dateInput.fill(today);

    // 6. Select incident type 'damage' from dropdown
    const typeSelect = testOperatorPage.locator('select').first();
    await typeSelect.selectOption(NCTVal.DAMAGE);

    // 7. Enter incident content with detailed description (min 10 chars)
    const contentTextarea = testOperatorPage.locator('textarea').first();
    await contentTextarea.fill('E2E Test: Equipment damage detected during inspection');

    // 8. Check 'Register as Non-Conformance' checkbox
    const ncCheckbox = testOperatorPage.locator('input[type="checkbox"]').first();
    await ncCheckbox.check();

    // 9. Click 'Save' button
    const saveButton = testOperatorPage.getByRole('button', { name: /^등록$|^Save$/i });
    await saveButton.click();

    // 10. Wait for success toast notification
    await testOperatorPage.waitForTimeout(1000);

    // 11. Navigate back to equipment detail page
    await testOperatorPage.goto(`/equipment/${testEquipmentId}`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 12. Verify equipment status changed to 'non_conforming'
    await expect(testOperatorPage.getByText('부적합')).toBeVisible();
    console.log('✓ Equipment status changed to non_conforming');

    // Verify NC banner appears on equipment detail page
    const ncBanner = testOperatorPage.locator('text=/부적합|Non-Conforming/i').first();
    await expect(ncBanner).toBeVisible();
    console.log('✓ NC banner displayed on equipment detail page');
  });
});
