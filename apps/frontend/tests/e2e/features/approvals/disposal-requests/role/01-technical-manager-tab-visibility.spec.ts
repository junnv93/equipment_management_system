/**
 * Approvals - Technical Manager Tab Visibility
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.1 - Technical manager sees disposal_review but NOT disposal_final tab
 *
 * This test verifies that technical_manager role:
 * - Sees exactly 8 tabs total
 * - Can access '폐기 검토' (disposal_review) tab
 * - Cannot see '폐기 승인' (disposal_final) tab (lab_manager only)
 * - Cannot see '교정계획서 승인' (plan_final) tab (lab_manager only)
 *
 * No database setup is needed - this test validates UI role-based access control only.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Role-Based Access Control', () => {
  test('Technical manager sees disposal_review but NOT disposal_final tab', async ({
    techManagerPage,
  }) => {
    // 1. Login as technical_manager using techManagerPage fixture
    // Already logged in via fixture

    // 2. Navigate to /admin/approvals with cache busting
    const timestamp = Date.now();
    await techManagerPage.goto(`/admin/approvals?_=${timestamp}`);

    // 3. Verify page heading "승인 관리" visible
    const heading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3: Heading "승인 관리" is visible');

    // 4. Count all tabs using getByRole('tab')
    const allTabs = techManagerPage.getByRole('tab');
    const tabCount = await allTabs.count();
    console.log(`✅ Step 4: Found ${tabCount} tabs`);

    // 5. Verify exactly 8 tabs total for technical_manager
    expect(tabCount).toBe(8);
    console.log('✅ Step 5: Exactly 8 tabs present for technical_manager');

    // Verify all 8 expected tabs are visible
    const expectedTabs = [
      '장비',
      '교정 기록',
      '중간점검',
      '반출',
      '반입',
      '공용/렌탈',
      '부적합 재개',
      '폐기 검토',
    ];

    for (const tabName of expectedTabs) {
      const tab = techManagerPage.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      console.log(`  - Tab "${tabName}" is visible`);
    }

    // 6. Verify '폐기 검토' tab is present
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    console.log('✅ Step 6: "폐기 검토" tab is present');

    // 7. Verify '폐기 승인' tab is NOT present (should not exist in DOM)
    const disposalFinalTab = techManagerPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).not.toBeVisible();
    console.log('✅ Step 7: "폐기 승인" tab is NOT present (correct - lab_manager only)');

    // Additional verification: '교정계획서 승인' tab should also NOT be visible
    const planFinalTab = techManagerPage.getByRole('tab', { name: /교정계획서 승인/ });
    await expect(planFinalTab).not.toBeVisible();
    console.log('  - "교정계획서 승인" tab is also NOT present (correct - lab_manager only)');

    console.log('✅ All assertions passed - technical_manager tab visibility is correct');
  });
});
