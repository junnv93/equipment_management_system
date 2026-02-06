/**
 * Approvals - Lab Manager Tab Visibility
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.2 - Lab manager sees disposal_final and plan_final tabs only
 *
 * This test verifies that lab_manager role:
 * - Sees exactly 2 tabs total
 * - Can access '폐기 승인' (disposal_final) tab
 * - Can access '교정계획서 승인' (plan_final) tab
 * - Cannot see '폐기 검토' (disposal_review) tab (technical_manager only)
 * - Cannot see technical_manager-only tabs like '장비', '교정 기록', etc.
 *
 * No database setup is needed - this test validates UI role-based access control only.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Role-Based Access Control', () => {
  test('Lab manager sees disposal_final and plan_final tabs only', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager using siteAdminPage fixture
    // Already logged in via fixture

    // 2. Navigate to /admin/approvals with cache busting
    const timestamp = Date.now();
    await siteAdminPage.goto(`/admin/approvals?_=${timestamp}`);

    // 3. Verify page heading "승인 관리" visible
    const heading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3: Heading "승인 관리" is visible');

    // 4. Count all tabs using getByRole('tab')
    const allTabs = siteAdminPage.getByRole('tab');
    const tabCount = await allTabs.count();
    console.log(`✅ Step 4: Found ${tabCount} tabs`);

    // 5. Verify exactly 2 tabs total for lab_manager
    expect(tabCount).toBe(2);
    console.log('✅ Step 5: Exactly 2 tabs present for lab_manager');

    // 6. Verify '폐기 승인' tab is present
    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();
    console.log('✅ Step 6: "폐기 승인" tab is present');

    // 7. Verify '교정계획서 승인' tab is present
    const planFinalTab = siteAdminPage.getByRole('tab', { name: /교정계획서 승인/ });
    await expect(planFinalTab).toBeVisible();
    console.log('✅ Step 7: "교정계획서 승인" tab is present');

    // 8. Verify technical_manager tabs are NOT present (e.g., '장비', '폐기 검토')
    const technicalManagerTabs = [
      '장비',
      '교정 기록',
      '중간점검',
      '반출',
      '반입',
      '공용/렌탈',
      '부적합 재개',
      '폐기 검토',
    ];

    for (const tabName of technicalManagerTabs) {
      const tab = siteAdminPage.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).not.toBeVisible();
      console.log(`  - Tab "${tabName}" is NOT present (correct - technical_manager only)`);
    }

    console.log('✅ Step 8: All technical_manager tabs are correctly hidden from lab_manager');
    console.log('✅ All assertions passed - lab_manager tab visibility is correct');
  });
});
