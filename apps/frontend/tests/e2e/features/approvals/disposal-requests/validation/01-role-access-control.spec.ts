/**
 * Approvals - Role-based Tab Visibility and Access Control
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.1 - Role-based tab visibility and access control
 *
 * This test verifies that the approvals page correctly implements role-based access control:
 * - technical_manager sees 8 tabs including '폐기 검토' but NOT '폐기 승인'
 * - lab_manager sees 2 tabs: '폐기 승인' and '교정계획서 승인'
 * - test_engineer is redirected to /dashboard (no approval access)
 *
 * No database setup is needed - this test only validates UI access control.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Suite 4: Data Validation, Role Access, and Bulk Actions', () => {
  test('4.1 - Role-based tab visibility and access control', async ({
    techManagerPage,
    siteAdminPage,
    testOperatorPage,
  }) => {
    // ============================================================================
    // Test A - technical_manager tabs
    // ============================================================================

    // Step 1: Login as technical_manager and navigate to /admin/approvals
    await techManagerPage.goto('/admin/approvals');

    // Step 2: Verify heading '승인 관리' is visible
    const techManagerHeading = techManagerPage.getByRole('heading', {
      name: '승인 관리',
      level: 1,
    });
    await expect(techManagerHeading).toBeVisible({ timeout: 10000 });

    // Step 3: Verify the following tabs are visible for technical_manager:
    // 장비, 교정 기록, 중간점검, 반출, 반입, 공용/렌탈, 부적합 재개, 폐기 검토
    const expectedTechManagerTabs = [
      '장비',
      '교정 기록',
      '중간점검',
      '반출',
      '반입',
      '공용/렌탈',
      '부적합 재개',
      '폐기 검토',
    ];

    for (const tabName of expectedTechManagerTabs) {
      const tab = techManagerPage.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      console.log(`✅ technical_manager - Tab visible: ${tabName}`);
    }

    // Step 4: Verify '폐기 검토' tab is present
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTab).toBeVisible();
    console.log('✅ technical_manager - "폐기 검토" tab is visible');

    // Step 5: Verify '폐기 승인' tab is NOT visible (only for lab_manager)
    const disposalFinalTab = techManagerPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).not.toBeVisible();
    console.log('✅ technical_manager - "폐기 승인" tab is NOT visible (correct)');

    // Step 6: Click '폐기 검토' tab
    await disposalReviewTab.click();

    // Step 7: Verify tab is active via aria-selected attribute (more robust than URL check)
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    console.log('✅ technical_manager - "폐기 검토" tab is active (aria-selected=true)');

    // ============================================================================
    // Test B - lab_manager tabs
    // ============================================================================

    // Step 8: Login as lab_manager and navigate to /admin/approvals
    await siteAdminPage.goto('/admin/approvals');

    // Step 9: Verify heading '승인 관리' is visible
    const labManagerHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(labManagerHeading).toBeVisible({ timeout: 10000 });

    // Step 10: Verify the following tabs are visible for lab_manager:
    // 폐기 승인, 교정계획서 승인
    const expectedLabManagerTabs = ['폐기 승인', '교정계획서 승인'];

    for (const tabName of expectedLabManagerTabs) {
      const tab = siteAdminPage.getByRole('tab', { name: new RegExp(tabName) });
      await expect(tab).toBeVisible();
      console.log(`✅ lab_manager - Tab visible: ${tabName}`);
    }

    // Step 11: Verify '폐기 검토' tab is NOT visible (only for technical_manager)
    const disposalReviewTabLabManager = siteAdminPage.getByRole('tab', { name: /폐기 검토/ });
    await expect(disposalReviewTabLabManager).not.toBeVisible();
    console.log('✅ lab_manager - "폐기 검토" tab is NOT visible (correct)');

    // Step 12: Click '폐기 승인' tab
    const disposalFinalTabLabManager = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await disposalFinalTabLabManager.click();

    // Step 13: Verify tab is active via aria-selected attribute (more robust than URL check)
    await expect(disposalFinalTabLabManager).toHaveAttribute('aria-selected', 'true');
    console.log('✅ lab_manager - "폐기 승인" tab is active (aria-selected=true)');

    // ============================================================================
    // Test C - test_engineer access denied
    // ============================================================================

    // Step 14: Login as test_engineer and navigate to /admin/approvals
    await testOperatorPage.goto('/admin/approvals');

    // Step 15: Verify user is redirected to /dashboard
    await testOperatorPage.waitForTimeout(2000);
    const testEngineerUrl = testOperatorPage.url();
    expect(testEngineerUrl).toContain('/dashboard');
    console.log('✅ test_engineer - Redirected to /dashboard (correct, no approval access)');

    // Step 16: Verify approvals page content is NOT displayed
    const approvalsHeading = testOperatorPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(approvalsHeading).not.toBeVisible();
    console.log('✅ test_engineer - "승인 관리" heading is NOT visible (correct)');

    console.log('✅ All role-based access control tests completed successfully');
  });
});
