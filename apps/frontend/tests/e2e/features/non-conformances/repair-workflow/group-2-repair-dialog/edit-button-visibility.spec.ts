// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

/**
 * Group B: Role-Based Permission Verification
 * B-5: edit button visibility follows isManager() hook
 *
 * This test compares edit button visibility across three role fixtures:
 * - testOperatorPage: verify edit button NOT visible (test_engineer)
 * - techManagerPage: verify edit button visible (technical_manager)
 * - siteAdminPage: verify edit button visible (lab_manager)
 *
 * Expected behavior:
 * - useAuth().isManager() returns false for test_engineer
 * - useAuth().isManager() returns true for technical_manager
 * - useAuth().isManager() returns true for lab_manager
 * - Edit button renders conditionally based on isManager()
 */

test.describe('Role-Based Permission Verification', () => {
  // Use equipment with existing NC (Power Meter with NC_001)
  const equipmentId = 'eeee1004-0004-4004-8004-000000000004';

  test.beforeEach(async ({}, testInfo) => {
    // Run only on Chromium to avoid browser compatibility issues
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('edit button visibility follows isManager() hook', async ({
    testOperatorPage,
    techManagerPage,
    siteAdminPage,
  }) => {
    // 1. Compare edit button visibility across three role fixtures

    // 2. testOperatorPage: verify edit button NOT visible
    console.log('Testing test_engineer (testOperatorPage)...');
    await testOperatorPage.goto(`/equipment/${equipmentId}/non-conformance`);

    const testEngineerEditButtons = testOperatorPage.getByRole('button', {
      name: /수정|Edit Record/i,
    });
    const testEngineerEditCount = await testEngineerEditButtons.count();

    // test_engineer should NOT see edit button (isManager() = false)
    expect(testEngineerEditCount).toBe(0);
    console.log('✅ test_engineer: Edit button NOT visible (isManager() = false)');

    // 3. techManagerPage: verify edit button visible
    console.log('Testing technical_manager (techManagerPage)...');
    await techManagerPage.goto(`/equipment/${equipmentId}/non-conformance`);

    const techManagerEditButtons = techManagerPage.getByRole('button', {
      name: /수정|Edit Record/i,
    });
    const techManagerEditCount = await techManagerEditButtons.count();

    // technical_manager should see edit button (isManager() = true)
    expect(techManagerEditCount).toBeGreaterThan(0);
    await expect(techManagerEditButtons.first()).toBeVisible();
    console.log('✅ technical_manager: Edit button visible (isManager() = true)');

    // 4. siteAdminPage: verify edit button visible
    console.log('Testing lab_manager (siteAdminPage)...');
    await siteAdminPage.goto(`/equipment/${equipmentId}/non-conformance`);

    const labManagerEditButtons = siteAdminPage.getByRole('button', { name: /수정|Edit Record/i });
    const labManagerEditCount = await labManagerEditButtons.count();

    // lab_manager should see edit button (isManager() = true)
    expect(labManagerEditCount).toBeGreaterThan(0);
    await expect(labManagerEditButtons.first()).toBeVisible();
    console.log('✅ lab_manager: Edit button visible (isManager() = true)');

    // Expected Results Verification:
    // - useAuth().isManager() returns false for test_engineer (edit button NOT visible)
    expect(testEngineerEditCount).toBe(0);

    // - useAuth().isManager() returns true for technical_manager (edit button visible)
    expect(techManagerEditCount).toBeGreaterThan(0);

    // - useAuth().isManager() returns true for lab_manager (edit button visible)
    expect(labManagerEditCount).toBeGreaterThan(0);

    // - Edit button renders conditionally based on isManager() (verified above)

    console.log('✅ B-5: Edit button visibility across all roles verified successfully');
  });
});
