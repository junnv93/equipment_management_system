/**
 * Approvals - Test Engineer No Access (Redirect to Dashboard)
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 4.3 - Test engineer is redirected to dashboard (no approval access)
 *
 * This test verifies that test_engineer role:
 * - Is automatically redirected to /dashboard when accessing /admin/approvals
 * - Cannot access the approvals page (not in rolesWithApprovalAccess)
 * - Does not see any approval tabs or interface
 *
 * No database setup is needed - this test validates server-side access control only.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Role-Based Access Control', () => {
  test('Test engineer redirected to dashboard (no approval access)', async ({
    testOperatorPage,
  }) => {
    // 1. Login as test_engineer using testOperatorPage fixture
    // Already logged in via fixture

    // 2. Navigate to /admin/approvals (no cache busting needed)
    await testOperatorPage.goto('/admin/approvals');

    // 3. Wait for navigation to complete (redirect to dashboard)
    await testOperatorPage.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 4. Verify URL is /dashboard (redirected away from /admin/approvals)
    await testOperatorPage.waitForURL(/\/dashboard/, { timeout: 10000 });
    const currentUrl = testOperatorPage.url();
    expect(currentUrl).toMatch(/\/dashboard$/);
    console.log(
      '✅ Step 4: User redirected to /dashboard (correct - test_engineer has no approval access)'
    );

    // 5. Verify "승인 관리" heading is NOT present
    const approvalHeading = testOperatorPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(approvalHeading).not.toBeVisible();
    console.log('✅ Step 5: "승인 관리" heading is NOT present (approval page not rendered)');

    // 6. Verify approval page content is NOT rendered
    // Check that no approval tabs exist
    const approvalTabs = testOperatorPage.getByRole('tab');
    const tabCount = await approvalTabs.count();
    expect(tabCount).toBe(0);
    console.log('✅ Step 6: No approval tabs rendered (count = 0)');

    // Verify dashboard content is displayed instead
    // Look for dashboard-specific elements (heading or stats cards)
    const dashboardContent = testOperatorPage.locator('main').first();
    await expect(dashboardContent).toBeVisible();
    console.log('  - Dashboard content is displayed');

    console.log(
      '✅ All assertions passed - test_engineer correctly denied access to approvals page'
    );
  });
});
