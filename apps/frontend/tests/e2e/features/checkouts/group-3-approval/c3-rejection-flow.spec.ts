/**
 * Checkout Rejection Flow E2E Tests
 * Group C3: Rejection Flow
 *
 * Tests checkout rejection workflows with technical_manager permissions.
 * These tests run SEQUENTIALLY (workers=1) because they modify checkout states.
 *
 * ⚠️ ID Separation: These tests use DIFFERENT checkout IDs than c2-approval-flow
 *   to avoid state conflicts when tests run together.
 *   - c2 (approval): uses 001, 002, 003, 005
 *   - c3 (rejection): uses 004, 006, 007, 008, 015
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data source
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';
import {
  CHECKOUT_004_ID,
  CHECKOUT_006_ID,
  CHECKOUT_007_ID,
  CHECKOUT_008_ID,
  CHECKOUT_015_ID,
} from '../../../shared/constants/test-checkout-ids';

/**
 * Helper: Fill rejection dialog and submit
 *
 * The CheckoutDetailClient's reject dialog uses:
 * - Textarea with label "반려 사유" (id="rejectReason")
 * - Confirm button labeled "반려" inside the dialog
 * - Button is disabled when reason is empty
 */
async function fillAndSubmitRejectDialog(page: import('@playwright/test').Page, reason: string) {
  // Wait for the rejection dialog to appear
  // Use accessible name '반출 반려' to distinguish from mobile nav drawer (which also has role="dialog")
  const dialog = page.getByRole('dialog', { name: '반출 반려' });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Fill the rejection reason textarea
  const reasonField = dialog.getByLabel('반려 사유');
  await expect(reasonField).toBeVisible();
  await reasonField.fill(reason);

  // Click the "반려" button INSIDE the dialog (not the page button)
  const dialogRejectButton = dialog.getByRole('button', { name: '반려' });
  await expect(dialogRejectButton).toBeEnabled();
  await dialogRejectButton.click();
}

test.describe('Group C3: Rejection Flow', () => {
  // Must run serially - tests modify shared checkout state (pending → rejected)
  // With fullyParallel, multiple workers would race on the same checkout IDs
  test.describe.configure({ mode: 'serial' });
  /**
   * Reset checkout statuses to 'pending' before running tests
   * This ensures tests can run repeatedly without manual seed reset
   */
  test.beforeAll(async ({ request }) => {
    console.log('\n🔄 [C3] Resetting checkout statuses to pending...');

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
      CHECKOUT_004_ID, // C-10
      CHECKOUT_006_ID, // C-9 additional
      CHECKOUT_007_ID, // C-9
      CHECKOUT_008_ID, // C-13
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
    console.log('✅ [C3] Checkout reset complete\n');
  });

  /**
   * C-9: Reject calibration checkout
   * Priority: P0 - CRITICAL
   *
   * Verifies that a technical_manager can reject a pending calibration checkout
   * and the rejection reason is properly saved and displayed.
   * Uses CHECKOUT_007_ID (pending calibration multi-equipment) to avoid conflict with c2.
   */
  test('C-9: Reject calibration checkout', async ({ techManagerPage }) => {
    // 1. Navigate to pending calibration checkout
    await techManagerPage.goto(`/checkouts/${CHECKOUT_007_ID}`);
    await techManagerPage.waitForLoadState('domcontentloaded');

    // Wait for the page heading
    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for action buttons (React hydration + session loading)
    // Wait for "반려" button directly - it appears after auth state loads for pending checkouts
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });

    // 2. VERIFY pending status (both buttons visible)
    await expect(rejectButton).toBeVisible({ timeout: 15000 });
    await expect(approveButton).toBeVisible();

    // 3. Click "반려" button to open reject dialog
    await rejectButton.click();

    // 4. Fill reason and submit via dialog
    await fillAndSubmitRejectDialog(techManagerPage, '교정 기관 인증 만료로 반출 불가합니다');

    // Wait for mutation to complete
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 5. Verify workflow ended - approval/rejection buttons gone
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).not.toBeVisible();

    // 6. Verify rejection reason displayed on page
    await expect(techManagerPage.getByText('교정 기관 인증 만료로 반출 불가합니다')).toBeVisible();
  });

  /**
   * C-10: Reject repair checkout
   * Priority: P1 - High
   *
   * Verifies that a technical_manager can reject a pending repair checkout.
   * Uses CHECKOUT_004_ID (pending repair Uiwang) - no conflict with c2.
   */
  test('C-10: Reject repair checkout', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_004_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for action buttons (React hydration + session loading)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    await expect(rejectButton).toBeVisible({ timeout: 15000 });
    await expect(approveButton).toBeVisible();

    // Click reject to open dialog
    await rejectButton.click();

    // Fill reason and submit
    await fillAndSubmitRejectDialog(techManagerPage, '수리 비용이 장비 가치를 초과하여 반려합니다');

    await techManagerPage.waitForLoadState('domcontentloaded');

    // Verify workflow ended
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();

    // Verify reason displayed
    await expect(
      techManagerPage.getByText('수리 비용이 장비 가치를 초과하여 반려합니다')
    ).toBeVisible();
  });

  /**
   * C-13: Rejection reason required
   * Priority: P2
   *
   * Verifies that rejection requires a reason to be entered.
   * The confirm button is DISABLED when reason is empty.
   * Uses CHECKOUT_008_ID (pending repair multi-equipment).
   */
  test('C-13: Rejection reason required', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_008_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for action buttons (React hydration + session loading)
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    await expect(rejectButton).toBeVisible({ timeout: 15000 });

    // Click "반려" to open dialog
    await rejectButton.click();

    // Dialog should appear - use accessible name to avoid mobile nav drawer conflict
    const dialog = techManagerPage.getByRole('dialog', { name: '반출 반려' });
    await expect(dialog).toBeVisible();

    // Verify the confirm button is DISABLED when reason is empty
    const dialogRejectButton = dialog.getByRole('button', { name: '반려' });
    await expect(dialogRejectButton).toBeDisabled();

    // Fill the reason field
    const reasonField = dialog.getByLabel('반려 사유');
    await reasonField.fill('장비 상태 확인이 필요하여 반려합니다');

    // Now the button should be ENABLED
    await expect(dialogRejectButton).toBeEnabled();

    // Submit
    await dialogRejectButton.click();

    await techManagerPage.waitForLoadState('domcontentloaded');

    // Verify workflow ended
    await expect(rejectButton).not.toBeVisible({ timeout: 10000 });
    await expect(techManagerPage.getByRole('button', { name: '승인' })).not.toBeVisible();

    // Verify reason displayed
    await expect(techManagerPage.getByText('장비 상태 확인이 필요하여 반려합니다')).toBeVisible();
  });

  /**
   * C-14: Rejection reflected in list view
   * Priority: P2
   *
   * Verifies that rejection updates list view correctly.
   * This test runs AFTER other rejection tests (C-9, C-10, C-9 additional)
   * and verifies their rejections are reflected in the checkout list.
   *
   * Note: Does NOT reject its own checkout - verifies list reflects prior rejections.
   */
  test('C-14: Rejection reflected in list view', async ({ techManagerPage }) => {
    // Navigate to checkout list
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // Wait for list to load
    await expect(
      techManagerPage.getByRole('heading', { name: /반출 목록|반출 관리/ })
    ).toBeVisible();

    // Wait for data rows to appear - use table row locator
    await expect(techManagerPage.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });

    // Use the status filter Select to filter by rejected status
    // The trigger button contains the text "상태" with a filter icon
    const statusTrigger = techManagerPage
      .locator('button[role="combobox"]')
      .filter({ hasText: '상태' });
    await statusTrigger.click();

    // Select "거부됨" from dropdown
    // Note: The list page uses "거부됨" (not "거절됨" from SSOT CHECKOUT_STATUS_LABELS)
    // This is a known SSOT inconsistency in CheckoutsContent.tsx
    await techManagerPage.getByRole('option', { name: '거부됨' }).click();

    // Wait for filtered results to load
    await techManagerPage.waitForLoadState('networkidle');

    // Verify at least one rejected checkout with "거부됨" badge is visible
    // Previous tests (C-9, C-10, C-9 additional) have already rejected checkouts
    await expect(techManagerPage.getByText('거부됨').first()).toBeVisible({ timeout: 10000 });
  });

  /**
   * C-9 (additional): Reject rental checkout
   * Priority: P0 - CRITICAL
   *
   * Verifies that a technical_manager can reject a rental checkout.
   * Uses CHECKOUT_006_ID (pending rental Uiwang → Suwon).
   */
  test('C-9 (additional): Reject rental checkout', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_006_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for action buttons (React hydration + session loading)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    const rejectButton = techManagerPage.getByRole('button', { name: '반려' });
    await expect(rejectButton).toBeVisible({ timeout: 15000 });
    await expect(approveButton).toBeVisible();

    // Verify it's a rental checkout
    await expect(techManagerPage.getByText('대여').first()).toBeVisible();

    // Reject with reason
    await rejectButton.click();
    await fillAndSubmitRejectDialog(
      techManagerPage,
      '대여 정책 위반으로 반려합니다. 재신청 부탁드립니다'
    );

    await techManagerPage.waitForLoadState('domcontentloaded');

    // Verify workflow ended
    await expect(approveButton).not.toBeVisible({ timeout: 10000 });
    await expect(rejectButton).not.toBeVisible();

    // Verify no rental-specific buttons
    await expect(techManagerPage.getByRole('button', { name: /반출 전 확인/ })).not.toBeVisible();

    // Verify rejection reason displayed
    await expect(
      techManagerPage.getByText('대여 정책 위반으로 반려합니다. 재신청 부탁드립니다')
    ).toBeVisible();
  });

  /**
   * C-12: Cannot modify after rejection
   * Priority: P1 - High
   *
   * Verifies that rejected checkouts cannot be modified (workflow ended).
   * Uses CHECKOUT_015_ID (already rejected in seed data).
   */
  test('C-12: Cannot modify after rejection', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/checkouts/${CHECKOUT_015_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByRole('heading', { name: '반출 상세' })).toBeVisible();

    // Wait for page to fully load - "목록으로" is a link (not a button) on the detail page
    await expect(techManagerPage.getByRole('link', { name: '목록으로' })).toBeVisible({
      timeout: 15000,
    });

    // Verify status is "거절됨" (rejected)
    // Use .first() to avoid strict mode violation
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.rejected).first()).toBeVisible();

    // Verify no action buttons
    await expect(techManagerPage.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반려' })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: /반입/ })).not.toBeVisible();
    await expect(techManagerPage.getByRole('button', { name: /수정|편집/ })).not.toBeVisible();
  });
});
