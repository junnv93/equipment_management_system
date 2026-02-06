/**
 * Checkout Approval Flow E2E Tests
 * Group C2: Approval Flow
 *
 * Tests checkout approval and rejection workflows with technical_manager permissions
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data source
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_001_ID,
  CHECKOUT_002_ID,
  CHECKOUT_003_ID,
  CHECKOUT_005_ID,
  CHECKOUT_007_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe('Group C2: Approval Flow', () => {
  // Must run serially - tests modify shared checkout state (pending → approved)
  // With fullyParallel, multiple workers would race on the same checkout IDs
  test.describe.configure({ mode: 'serial' });
  /**
   * Reset checkout statuses to 'pending' before running tests
   * This ensures tests can run repeatedly without manual seed reset
   */
  test.beforeAll(async ({ request }) => {
    console.log('\n🔄 [C2] Resetting checkout statuses to pending...');

    // Get JWT token from backend test-login endpoint for authentication
    const API_BASE = 'http://localhost:3001';
    let authToken = '';
    try {
      const loginResp = await request.get(`${API_BASE}/api/auth/test-login?role=technical_manager`);
      if (loginResp.ok()) {
        const loginData = await loginResp.json();
        authToken = loginData.access_token || loginData.token || '';
      }
    } catch (error) {
      console.warn('  ⚠ Could not get auth token for reset:', error);
    }

    const checkoutIdsToReset = [
      CHECKOUT_001_ID, // C-3
      CHECKOUT_002_ID, // C-6
      CHECKOUT_003_ID, // C-4
      CHECKOUT_005_ID, // C-5
    ];

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    for (const checkoutId of checkoutIdsToReset) {
      try {
        const response = await request.patch(`${API_BASE}/api/checkouts/${checkoutId}`, {
          data: { status: 'pending' },
          headers,
        });

        if (response.ok()) {
          console.log(`  ✓ Reset ${checkoutId} to pending`);
        } else {
          console.warn(`  ⚠ Failed to reset ${checkoutId}: ${response.status()}`);
        }
      } catch (error) {
        console.warn(`  ⚠ Error resetting ${checkoutId}:`, error);
      }
    }
    console.log('✅ [C2] Checkout reset complete\n');
  });

  /**
   * C-3: Approve calibration checkout
   * Priority: P0 - CRITICAL
   *
   * Verifies that a technical_manager can approve a pending calibration checkout
   * and the status transitions correctly from 'pending' to 'approved'
   */
  test('C-3: Approve calibration checkout', async ({ techManagerPage }) => {
    // 1. Navigate to pending calibration checkout (CHECKOUT_001_ID)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Wait for the page heading to be visible
    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // 2. Wait for action buttons to appear (auth state loaded)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    const startButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    const listButton = techManagerPage.getByRole('button', { name: '목록으로' });

    // Wait for any action button to appear (indicates auth + data loaded)
    await expect(approveButton.or(startButton).or(listButton)).toBeVisible({ timeout: 15000 });

    // VERIFY checkout is in pending status (must have "승인" button)
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await expect(rejectButton).toBeVisible();

    // 3. Click "승인" button (no confirmation dialog - direct action)
    await approveButton.click();

    // Wait for mutation to complete and page to refresh
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 5. Verify status changed by checking buttons
    // "승인" and "반려" buttons should be gone
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();

    // 6. Verify "반출 시작" button becomes visible (next workflow step)
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).toBeVisible();
  });

  /**
   * C-4: Approve repair checkout
   * Priority: P0 - CRITICAL
   *
   * Verifies that a technical_manager can approve a pending repair checkout
   */
  test('C-4: Approve repair checkout', async ({ techManagerPage }) => {
    // 1. Navigate to pending repair checkout (CHECKOUT_003_ID)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_003_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Wait for the page heading to be visible
    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // 2. Wait for action buttons to appear (auth state loaded)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    const startButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    const listButton = techManagerPage.getByRole('button', { name: '목록으로' });

    await expect(approveButton.or(startButton).or(listButton)).toBeVisible({ timeout: 15000 });

    // VERIFY checkout is in pending status
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await expect(rejectButton).toBeVisible();

    // 3. Click "승인" button
    await approveButton.click();

    // Wait for mutation to complete
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 4. Verify status changed
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();

    // 5. Verify "반출 시작" button becomes visible
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).toBeVisible();
  });

  /**
   * C-5: Approve rental checkout
   * Priority: P0 - CRITICAL
   */
  test('C-5: Approve rental checkout', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_005_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for action buttons
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const startButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    const listButton = techManagerPage.getByRole('button', { name: '목록으로' });

    await expect(approveButton.or(startButton).or(listButton)).toBeVisible({ timeout: 15000 });

    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await expect(rejectButton).toBeVisible();

    // 3. Click "승인" button (no confirmation dialog - direct action)
    await approveButton.click();

    // Wait for mutation to complete and page to refresh
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 4. Verify status changed by checking buttons
    // "승인" and "반려" buttons should be gone
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();

    // 5. For rental checkouts after approval, "반출 시작" button appears first
    // (상태 확인 is only available after the checkout has been started)
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).toBeVisible();
  });

  /**
   * C-6: Status transition after approval
   * Priority: P0 - CRITICAL
   *
   * Verifies that status transitions are properly persisted and reflected in UI
   */
  test('C-6: Status transition after approval', async ({ techManagerPage }) => {
    // 1. Navigate to CHECKOUT_002_ID (pending calibration - Suwon R)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_002_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Wait for the page heading to be visible
    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for auth state to load
    // Wait for action buttons (auth state loaded)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    const startButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    const listButton = techManagerPage.getByRole('button', { name: '목록으로' });

    await expect(approveButton.or(startButton).or(listButton)).toBeVisible({ timeout: 15000 });

    // 2. VERIFY pending status
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await expect(rejectButton).toBeVisible();

    // 3. Approve
    await approveButton.click();
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 4. Verify workflow buttons change
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();
    await expect(startButton).toBeVisible();

    // 5. Refresh page and verify status persists
    await techManagerPage.reload();
    await techManagerPage.waitForLoadState('networkidle');
    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for buttons to load after refresh
    await expect(
      techManagerPage.getByRole('button', { name: '반출 시작' }).or(listButton)
    ).toBeVisible({ timeout: 15000 });

    // Workflow buttons should remain the same after refresh
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '승인' })).not.toBeVisible();
  });

  /**
   * C-8: Approve multiple equipment checkout
   * Priority: P2
   *
   * Verifies that multi-equipment checkouts are approved as a single unit
   *
   * TODO: Fix checkout detail page authentication (401 error)
   * - Server Component uses client-side API incorrectly (getSession() doesn't work in SSR)
   * - Need to use createServerApiClient() or auth() instead
   * - See CHECKOUT_PERMISSION_TESTS_ANALYSIS.md for full details
   */
  test.fixme('C-8: Approve multiple equipment checkout', async ({ techManagerPage }) => {
    // 1. Navigate to multi-equipment checkout (CHECKOUT_007_ID - has 2 equipment)
    await techManagerPage.goto(`/checkouts/${CHECKOUT_007_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // 2. Verify multiple equipment are listed in checkout details
    // Look for equipment count indicator or multiple equipment items
    // The page should show "2" equipment items or similar indicator
    const equipmentSection = techManagerPage
      .locator('[data-testid="checkout-equipment-list"]')
      .or(techManagerPage.locator('text=/장비.*2/i'));
    await expect(equipmentSection.first()).toBeVisible();

    // Verify pending status
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.pending)).toBeVisible();

    // 3. Approve the checkout
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    await approveButton.click();
    const confirmButton = techManagerPage.getByRole('button', { name: '확인' });
    await confirmButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 4. Verify all equipment in the checkout transition together
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    // 5. Verify success message (may mention multiple equipment)
    await expect(techManagerPage.getByRole('status').filter({ hasText: '승인' })).toBeVisible();

    // Verify next step button is available
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).toBeVisible();
  });

  /**
   * C-11: Status transition after rejection
   * Priority: P0 - CRITICAL
   *
   * Verifies that rejection ends the workflow and status transitions to 'rejected'
   *
   * TODO: Fix checkout detail page authentication (401 error)
   * - Server Component uses client-side API incorrectly (getSession() doesn't work in SSR)
   * - Need to use createServerApiClient() or auth() instead
   * - See CHECKOUT_PERMISSION_TESTS_ANALYSIS.md for full details
   */
  test.fixme('C-11: Status transition after rejection', async ({ techManagerPage }) => {
    // Use CHECKOUT_008_ID (pending repair multi-equipment) for rejection test
    const CHECKOUT_008_ID = '10000000-0000-0000-0000-000000000008';

    // 1. Login as technical_manager
    // 2. Navigate to pending checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_008_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify initial status is 'pending'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.pending)).toBeVisible();

    // 3. Click "반려" (reject) button
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    // 4. Enter rejection reason in dialog: "예산 부족"
    // Look for a textarea or input field for rejection reason
    const reasonField = techManagerPage
      .getByLabel(/반려 사유|사유|이유/)
      .or(
        techManagerPage.locator('textarea').or(techManagerPage.locator('input[type="text"]').last())
      );
    await reasonField.fill('예산 부족');

    // 5. Confirm rejection
    const confirmButton = techManagerPage.getByRole('button', { name: '확인' });
    await confirmButton.click();

    await techManagerPage.waitForLoadState('networkidle');

    // 6. Verify status changed to 'rejected'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.rejected)).toBeVisible();

    // Verify old status is gone
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.pending)).not.toBeVisible();

    // 7. Verify rejection reason is displayed
    await expect(techManagerPage.getByText('예산 부족')).toBeVisible();

    // 8. Verify no action buttons are available (workflow ended)
    // Common action buttons should not be present
    await expect(techManagerPage.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반려' })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).not.toBeVisible();

    // Verify success/info message about rejection
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /반려|거절/ })
    ).toBeVisible();
  });
});
