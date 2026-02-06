/**
 * Checkout Permission Checks E2E Tests
 * Group C1: Permission Checks
 *
 * Tests role-based permissions for checkout approval workflows following UL-QP-18
 *
 * Test Scenarios:
 * - C-1: test_engineer cannot approve checkouts (P1 - High)
 * - C-2: technical_manager can approve checkouts (P1 - High)
 * - C-7: Rental approval by wrong team is denied (P1 - High)
 * - C-12: Cannot modify checkout after approval (P1 - High)
 *
 * Critical Requirements:
 * - Uses SSOT imports from @equipment-management/schemas
 * - Uses testOperatorPage and techManagerPage fixtures
 * - Verifies actual permissions through UI state changes
 * - NO backend API calls for verification (auth issues)
 * - Uses existing seed data checkout IDs
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data
 * @see apps/frontend/tests/e2e/fixtures/auth.fixture.ts - Auth fixtures
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CHECKOUT_001_ID,
  CHECKOUT_005_ID,
  CHECKOUT_009_ID,
} from '../../../shared/constants/test-checkout-ids';
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';

test.describe('Group C1: Permission Checks', () => {
  /**
   * C-1: test_engineer cannot approve
   * Priority: P1 - High
   *
   * Verifies that test_engineer role cannot approve checkouts.
   * They can only request checkouts, not approve them.
   *
   * FIXME: Checkout detail page does not implement permission-based button visibility yet.
   * Currently all users see approve/reject buttons regardless of their role.
   * Backend should return `canApprove` flag in checkout API response.
   * Frontend CheckoutDetailClient should conditionally render buttons based on permissions.
   *
   * Implementation Required:
   * 1. Backend: Add `canApprove: boolean` field to checkout API response based on user role
   * 2. Frontend: CheckoutDetailClient.tsx renderActions() should check canApprove flag
   * 3. Backend enforces permission via @RequirePermissions(Permission.APPROVE_CHECKOUT)
   * 4. test_engineer role does NOT have Permission.APPROVE_CHECKOUT (verified in role-permissions.ts)
   */
  test.fixme('C-1: test_engineer cannot approve', async ({ testOperatorPage }) => {
    // Navigate to pending checkout detail page
    await testOperatorPage.goto(`/checkouts/${CHECKOUT_001_ID}`, { waitUntil: 'networkidle' });

    // Wait for page to be fully loaded
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // Take a screenshot for debugging
    await testOperatorPage.screenshot({
      path: 'test-results/checkout-detail-state.png',
      fullPage: true,
    });

    // Get page visible text for debugging (innerText returns only visible text)
    const pageText = await testOperatorPage.locator('body').innerText();
    const has401 = pageText?.includes('401');
    const hasStatusCodeError = pageText?.includes('status code');
    const hasErrorHeader = pageText?.includes('반출/반입 관리 오류');

    console.log('Page visible text includes "401":', has401);
    console.log('Page visible text includes "status code":', hasStatusCodeError);
    console.log('Page visible text includes "반출/반입 관리 오류":', hasErrorHeader);
    console.log('Full visible text:\n', pageText);

    // Check for various error conditions
    const has404Error =
      pageText?.includes('404') || pageText?.includes('페이지를 찾을 수 없습니다');
    const hasRequestFailedError = has401 && hasStatusCodeError;
    const hasError = hasErrorHeader;

    if (has404Error) {
      throw new Error(`
❌ Checkout detail page returned a 404 Not Found error.

Root Cause:
The checkout detail page at /app/(dashboard)/checkouts/[id]/page.tsx exists but is returning 404.
This typically happens when:
1. Next.js dev server hasn't recompiled the page after code changes
2. There's a compilation error preventing the page from loading
3. The new server API imports are causing module resolution issues

Fix Applied:
1. Created /lib/api/checkout-api-server.ts with server-side API functions
   - Uses createServerApiClient() which properly handles NextAuth session tokens
   - Exports getCheckoutServer() and getConditionChecksServer()

2. Updated /app/(dashboard)/checkouts/[id]/page.tsx to use server API client
   - Changed from: checkoutApi.getCheckout(id)
   - Changed to: getCheckoutServer(id)

Action Required:
The Next.js dev server needs to recompile the page.
1. Check for compilation errors in the terminal running the dev server
2. If no errors, try restarting: pnpm --filter frontend run dev
3. Rerun this test

Debug Screenshot: test-results/checkout-detail-state.png
Visible page text shows: ${pageText?.substring(0, 200)}
      `);
    }

    if (hasRequestFailedError || hasError) {
      throw new Error(`
Checkout detail page returned a 401 Unauthorized error.

This means the server API client is not properly passing NextAuth session tokens.
Check test-results/checkout-detail-state.png for details.
      `);
    }

    // Wait for the page content to load by checking for the status badge
    await testOperatorPage.waitForSelector(`text=${CHECKOUT_STATUS_LABELS.pending}`, {
      timeout: 10000,
    });

    // Verify status badge shows pending state (using SSOT label)
    await expect(testOperatorPage.getByText(CHECKOUT_STATUS_LABELS.pending)).toBeVisible();

    // Verify "승인" (approve) button is NOT visible for test_engineer role
    const approveButton = testOperatorPage.getByRole('button', { name: '승인' });
    await expect(approveButton).not.toBeVisible();

    // Verify "반려" (reject) button is also NOT visible for test_engineer role
    const rejectButton = testOperatorPage.getByRole('button', { name: '반려' });
    await expect(rejectButton).not.toBeVisible();
  });

  /**
   * C-2: technical_manager can approve
   * Priority: P1 - High
   *
   * Verifies that technical_manager has permission to approve checkouts
   * from their team.
   *
   * FIXME: Checkout detail page does not implement permission-based button visibility yet.
   * Currently all users see approve/reject buttons regardless of their role.
   * Backend should return `canApprove` flag in checkout API response.
   * Frontend CheckoutDetailClient should conditionally render buttons based on permissions.
   */
  test.fixme('C-2: technical_manager can approve', async ({ techManagerPage }) => {
    // Navigate to pending checkout detail page
    await techManagerPage.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify "승인" (approve) button IS visible
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    await expect(approveButton).toBeVisible();
    await expect(approveButton).toBeEnabled();

    // Click approve button
    await approveButton.click();

    // Wait for confirmation dialog
    await techManagerPage.waitForTimeout(500);

    // Confirm in dialog
    const confirmButton = techManagerPage.getByRole('button', { name: '확인' }).last();
    await confirmButton.click();

    // Wait for status update
    await techManagerPage.waitForLoadState('networkidle');
    await techManagerPage.waitForTimeout(1000);

    // Verify status changed to approved (using SSOT label)
    const statusBadge = techManagerPage
      .getByRole('status')
      .filter({ hasText: CHECKOUT_STATUS_LABELS.approved });
    await expect(statusBadge).toBeVisible();

    // Verify "반출 시작" button is now visible
    await expect(techManagerPage.getByRole('button', { name: /반출 시작/ })).toBeVisible();
  });

  /**
   * C-7: Rental approval by wrong team
   * Priority: P1 - High
   *
   * Verifies that only the lending team's technical_manager can approve
   * rental checkouts.
   *
   * FIXME: Checkout detail page does not implement team-based permission checking yet.
   * Currently all technical_managers see approve buttons regardless of team ownership.
   * Backend should check lending team membership in approve API and return 403 if unauthorized.
   * Frontend should receive `canApprove` flag based on team membership.
   */
  test.fixme('C-7: Rental approval by wrong team', async ({ techManagerPage }) => {
    // Navigate to rental checkout from different team
    await techManagerPage.goto(`/checkouts/${CHECKOUT_005_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify approve button is NOT visible (wrong team)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    await expect(approveButton).not.toBeVisible();

    // Verify status shows pending (using SSOT label)
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.pending)).toBeVisible();

    // Verify rental information is displayed (page loads correctly)
    await expect(techManagerPage.getByText(/반출 목적/)).toBeVisible();
  });

  /**
   * C-12: Cannot modify after approval
   * Priority: P1 - High
   *
   * Verifies that after a checkout is approved, it cannot be modified.
   *
   * FIXME: Checkout detail page returns 401 Unauthorized error.
   * The page is a Server Component but uses client-side API client (checkout-api.ts).
   * Server Components cannot use getSession() from 'next-auth/react'.
   *
   * Solution required:
   * 1. Use createServerApiClient() from server-api-client.ts instead
   * 2. Or move data fetching to a separate Server Action
   * 3. Ensure NextAuth session token is properly passed to backend API
   *
   * Related files:
   * - apps/frontend/app/(dashboard)/checkouts/[id]/page.tsx (Server Component)
   * - apps/frontend/lib/api/checkout-api.ts (client-side API)
   * - apps/frontend/lib/api/server-api-client.ts (server-side API - should use this)
   */
  test.fixme('C-12: Cannot modify after approval', async ({ techManagerPage }) => {
    // Navigate to approved checkout detail page
    await techManagerPage.goto(`/checkouts/${CHECKOUT_009_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify status is approved (using SSOT label)
    const statusBadge = techManagerPage
      .locator('[class*="Badge"]')
      .filter({ hasText: CHECKOUT_STATUS_LABELS.approved });
    await expect(statusBadge).toBeVisible();

    // Verify "수정" (edit) button is NOT visible
    const editButton = techManagerPage.getByRole('button', { name: '수정' });
    await expect(editButton).not.toBeVisible();

    // Verify "승인" button is NOT visible (already approved)
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    await expect(approveButton).not.toBeVisible();

    // Verify no editable input fields are present
    const editableInputs = techManagerPage.locator(
      'input[type="text"]:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
    );
    const inputCount = await editableInputs.count();
    expect(inputCount).toBe(0);
  });
});
