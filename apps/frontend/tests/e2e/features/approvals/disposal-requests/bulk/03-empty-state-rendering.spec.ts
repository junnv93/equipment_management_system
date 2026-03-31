/**
 * Approvals - Disposal Bulk Actions: Empty State Rendering
 *
 * spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * seed: tests/e2e/fixtures/auth.fixture.ts
 *
 * Test Plan: Suite 5.3 - Empty state rendering when no pending items exist
 *
 * This test verifies that when no pending disposal_final approval requests exist:
 * 1. Empty state is displayed with Clock icon
 * 2. Message "승인 대기 중인 요청이 없습니다" is shown
 * 3. BulkActionBar is not rendered (no items to bulk-act on)
 * 4. Tab badge is hidden or shows count = 0
 * 5. Empty state has proper accessibility attributes
 *
 * Equipment: All disposal_final equipment cleared to ensure empty state
 *
 * CRITICAL: This test clears all reviewed disposal requests in beforeEach
 * to guarantee an empty state for the disposal_final tab.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { Pool } from 'pg';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';

// Create a database connection pool for clearing disposal requests
const DATABASE_URL = BASE_URLS.DATABASE;
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/**
 * Clear all reviewed disposal requests to ensure empty state
 * This ensures the disposal_final tab shows the empty state UI
 */
async function clearAllReviewedDisposalRequests(): Promise<void> {
  const dbPool = getPool();

  // Delete all disposal requests with review_status = 'reviewed'
  // This ensures disposal_final tab has no pending items
  await dbPool.query(`
    DELETE FROM disposal_requests 
    WHERE review_status = 'reviewed'
  `);

  // Also reset any equipment in pending_disposal state with reviewed status
  await dbPool.query(`
    UPDATE equipment 
    SET status = 'available', updated_at = NOW()
    WHERE status = 'pending_disposal'
    AND id IN (
      SELECT equipment_id FROM disposal_requests WHERE review_status = 'reviewed'
    )
  `);

  console.log('✅ All reviewed disposal requests cleared for empty state test');
}

test.describe('Disposal Bulk Actions - Empty State Rendering', () => {
  // Clear all reviewed disposal requests before each test to ensure empty state
  test.beforeEach(async () => {
    // Step 1: Clear all reviewed disposal requests (disposal_final items)
    await clearAllReviewedDisposalRequests();

    console.log('✅ BeforeEach: Database cleared for empty state test');
  });

  // Clean up database connection after all tests
  test.afterAll(async () => {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('✅ Database pool closed');
    }
  });

  test('5.3 - Empty state rendering when no pending items exist', async ({ siteAdminPage }) => {
    // Step 2: Login as siteAdminPage (lab_manager for disposal_final tab)
    // Already logged in via fixture

    // Step 3: Navigate to /admin/approvals?tab=disposal_final with cache busting
    const timestamp = Date.now();
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_=${timestamp}`);

    // Step 4: Wait for page load
    const pageHeading = siteAdminPage.getByRole('heading', { name: '승인 관리', level: 1 });
    await expect(pageHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 4: Page loaded with heading "승인 관리"');

    // Step 5: Verify disposal_final tab is active
    const disposalFinalTab = siteAdminPage.getByRole('tab', { name: /폐기 승인/ });
    await expect(disposalFinalTab).toBeVisible();
    await expect(disposalFinalTab).toHaveAttribute('aria-selected', 'true');
    console.log('✅ Step 5: "폐기 승인" tab is active');

    // Wait for list query to complete (empty state should render)

    // Step 6: Verify Clock icon is visible (Lucide icon)
    const clockIcon = siteAdminPage.locator('svg.lucide-clock');
    await expect(clockIcon).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 6: Clock icon is visible in empty state');

    // Step 7: Verify text "승인 대기 중인 요청이 없습니다" is visible
    const emptyStateMessage = siteAdminPage.getByText('승인 대기 중인 요청이 없습니다');
    await expect(emptyStateMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 7: Empty state message "승인 대기 중인 요청이 없습니다" is visible');

    // Step 8: Verify empty state container has proper accessibility attributes
    const emptyStateContainer = siteAdminPage.locator('[role="status"][aria-live="polite"]');
    await expect(emptyStateContainer).toBeVisible();
    console.log(
      '✅ Step 8: Empty state has proper accessibility attributes (role="status", aria-live="polite")'
    );

    // Step 9: Verify BulkActionBar is NOT rendered (no items to bulk-act on)
    const bulkActionBar = siteAdminPage.getByText(/전체 선택 \(\d+\/\d+\)/);
    await expect(bulkActionBar).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Step 9: BulkActionBar is not rendered when no items exist');

    // Alternative check: Verify no approval items are displayed
    const approvalItems = siteAdminPage.locator('[data-testid="approval-item"]');
    const itemCount = await approvalItems.count();
    expect(itemCount).toBe(0);
    console.log('✅ Step 9.1: No approval items are rendered (count = 0)');

    // Step 10: Verify tab badge is hidden (count = 0)
    // Tab badge is only rendered when count > 0, so it should not be visible
    const tabBadge = disposalFinalTab.locator('span[class*="badge"]');
    const badgeCount = await tabBadge.count();

    if (badgeCount > 0) {
      // If badge exists, verify it's hidden or shows 0
      const badgeText = await tabBadge.textContent();
      console.log(`  - Badge text: "${badgeText}"`);
      expect(badgeText).toMatch(/^0$|^$/); // Either "0" or empty
    } else {
      // Badge is not rendered at all (preferred behavior when count = 0)
      console.log('  - Badge is not rendered (count = 0)');
    }

    console.log('✅ Step 10: Tab badge is hidden or shows count = 0');

    // Additional verification: Verify the list card is still rendered
    const listHeading = siteAdminPage.getByRole('heading', { name: '승인 대기 목록' });
    await expect(listHeading).toBeVisible({ timeout: 5000 });
    console.log('✅ Additional: List card with heading "승인 대기 목록" is rendered');

    // Verify description text for empty state
    const descriptionText = siteAdminPage.getByText(/총 0개의 승인 대기 요청이 있습니다/);
    await expect(descriptionText).toBeVisible({ timeout: 5000 });
    console.log('✅ Additional: List description shows "총 0개의 승인 대기 요청이 있습니다"');

    console.log('✅ Test completed successfully - Empty state renders correctly');
  });
});
