/**
 * Approvals - Tab Navigation and URL Synchronization
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/seed.spec.ts
 *
 * Test Plan: Suite 6.1 - Tab selection synchronizes with URL query parameter
 *
 * This test verifies bidirectional synchronization between:
 * - Tab selection in UI -> URL query parameter updates
 * - URL query parameter changes -> Tab selection updates
 *
 * No database setup is needed - this test validates URL synchronization logic only.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Tab Navigation and URL Sync', () => {
  test('Tab selection synchronizes with URL query parameter', async ({ techManagerPage }) => {
    // 1. Login as techManagerPage (technical_manager)
    // Already logged in via fixture

    // 2. Navigate to /admin/approvals (no query param)
    await techManagerPage.goto('/admin/approvals');

    // 3. Wait for page load
    const heading = techManagerPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3: Page loaded with heading "승인 관리"');

    // 4. Verify default tab is active (first in ROLE_TABS for technical_manager - '장비')
    const defaultTab = techManagerPage.getByRole('tab', { name: /장비/ });
    await expect(defaultTab).toHaveAttribute('aria-selected', 'true');
    await expect(defaultTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Step 4: Default tab "장비" is active when no query param provided');

    // 5. Click '폐기 검토' tab
    const disposalReviewTab = techManagerPage.getByRole('tab', { name: /폐기 검토/ });
    await disposalReviewTab.click();
    console.log('✅ Step 5: Clicked "폐기 검토" tab');

    // 6. Verify URL updates to ?tab=disposal_review
    // Wait for the URL to contain the tab parameter (Next.js router.push is async)
    await techManagerPage.waitForURL(/tab=disposal_review/, { timeout: 3000 });
    let currentUrl = techManagerPage.url();
    expect(currentUrl).toContain('tab=disposal_review');
    console.log('✅ Step 6: URL updated to include ?tab=disposal_review');

    // 7. Verify '폐기 검토' tab has aria-selected='true'
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(disposalReviewTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Step 7: "폐기 검토" tab has aria-selected="true" and data-state="active"');

    // 8. Navigate directly to /admin/approvals?tab=disposal_review
    const timestamp = Date.now();
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${timestamp}`);

    // 9. Verify '폐기 검토' tab is active on page load
    await techManagerPage.waitForTimeout(1000); // Allow page to render
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(disposalReviewTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Step 9: "폐기 검토" tab is active when navigating directly with URL param');

    // 10. Test bidirectional sync - Change URL param programmatically (navigate to ?tab=checkout)
    await techManagerPage.goto(`/admin/approvals?tab=checkout&_=${Date.now()}`);
    await techManagerPage.waitForTimeout(1000);

    // Verify '반출' tab becomes active
    const checkoutTab = techManagerPage.getByRole('tab', { name: /반출/ });
    await expect(checkoutTab).toHaveAttribute('aria-selected', 'true');
    await expect(checkoutTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Step 10a: "반출" tab became active when URL changed to ?tab=checkout');

    // Verify disposal_review tab is no longer active
    await expect(disposalReviewTab).toHaveAttribute('aria-selected', 'false');
    await expect(disposalReviewTab).toHaveAttribute('data-state', 'inactive');
    console.log('  - "폐기 검토" tab is now inactive');

    // Click different tab ('교정 기록')
    const calibrationTab = techManagerPage.getByRole('tab', { name: /교정 기록/ });
    await calibrationTab.click();
    console.log('✅ Step 10b: Clicked "교정 기록" tab');

    // Verify URL updates accordingly
    await techManagerPage.waitForURL(/tab=calibration/, { timeout: 3000 });
    currentUrl = techManagerPage.url();
    expect(currentUrl).toContain('tab=calibration');
    console.log('✅ Step 10c: URL updated to include ?tab=calibration');

    // Verify '교정 기록' tab is now active
    await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');
    await expect(calibrationTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Step 10d: "교정 기록" tab is active after click');

    // Verify previous tab is inactive
    await expect(checkoutTab).toHaveAttribute('aria-selected', 'false');
    await expect(checkoutTab).toHaveAttribute('data-state', 'inactive');
    console.log('  - Previous "반출" tab is now inactive');

    console.log('✅ All assertions passed - Bidirectional tab/URL synchronization works correctly');
  });
});
