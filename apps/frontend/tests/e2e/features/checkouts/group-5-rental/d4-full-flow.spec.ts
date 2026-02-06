/**
 * Complete Checkout Lifecycle E2E Test
 * Group D4: Full Flow Validation
 *
 * 🔴 MOST CRITICAL TEST IN ENTIRE SUITE 🔴
 *
 * This test validates the complete equipment checkout lifecycle from start to finish:
 * 1. Equipment starts in 'available' status
 * 2. Create calibration checkout → status: 'pending'
 * 3. Approve checkout → status: 'approved'
 * 4. Start checkout → equipment status: 'checked_out'
 * 5. Return checkout → checkout status: 'returned'
 * 6. Approve return → equipment status: 'available' (restored)
 *
 * This is the ONLY test that validates the entire state machine and equipment
 * status lifecycle end-to-end. All other tests verify individual steps.
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Seed data source
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_STATUS_LABELS, EQUIPMENT_STATUS_LABELS } from '@equipment-management/schemas';

// Configure sequential execution for critical flow test
test.describe.configure({ mode: 'serial' });

test.describe('Group D4: Full Flow Validation', () => {
  // Equipment ID to use for the full flow test
  // This equipment must be in 'available' status at test start
  const TEST_EQUIPMENT_ID = 'eeee1001-0001-4001-8001-000000000001'; // EQUIP_OSCILLOSCOPE_SUW_E_ID from seed

  /**
   * D-9: Complete checkout→return flow validation
   * Priority: P0 - CRITICAL (HIGHEST PRIORITY IN ENTIRE TEST SUITE)
   *
   * Validates the entire checkout lifecycle and equipment status transitions.
   * This is the most comprehensive test that ensures the core business logic
   * of the checkout/rental management system works correctly.
   *
   * Success Criteria:
   * - Equipment status correctly transitions through all states
   * - Checkout status correctly transitions through workflow
   * - All state transitions are persisted in database
   * - Equipment returns to 'available' status after complete cycle
   *
   * TODO: Implement complete checkout workflow
   * - Checkout creation form
   * - Approval workflow (technical_manager)
   * - Checkout start (status → checked_out)
   * - Return workflow with inspections
   * - Return approval (status → available)
   */
  test.fixme('D-9: Complete checkout→return flow validation', async ({ techManagerPage }) => {
    // ============================================================
    // STEP 1: Verify equipment starts in 'available' status
    // ============================================================
    let equipmentResponse = await techManagerPage.request.get(
      `/api/equipment/${TEST_EQUIPMENT_ID}`
    );
    let equipmentData = await equipmentResponse.json();

    // Verify initial equipment status is 'available'
    expect(equipmentData.status).toBe('available');
    console.log(`✓ Equipment ${TEST_EQUIPMENT_ID} initial status: available`);

    // ============================================================
    // STEP 2: Create calibration checkout → status: 'pending'
    // ============================================================
    await techManagerPage.goto('/checkouts/create');
    await techManagerPage.waitForLoadState('networkidle');

    // Select equipment
    const equipmentSelector = techManagerPage
      .locator(`[data-equipment-id="${TEST_EQUIPMENT_ID}"]`)
      .or(techManagerPage.getByRole('row').filter({ hasText: TEST_EQUIPMENT_ID }));
    await equipmentSelector.click();

    // Fill checkout form
    await techManagerPage.getByLabel('반출 목적').selectOption('교정');
    await techManagerPage.getByLabel('반출 장소').fill('외부 교정 기관');
    await techManagerPage.getByLabel('반출 사유').fill('정기 교정');

    // Set expected return date (7 days from now)
    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + 7);
    const dateString = expectedReturnDate.toISOString().split('T')[0];
    await techManagerPage.getByLabel(/예상 반입|반입 예정/).fill(dateString);

    // Submit checkout request
    await techManagerPage.getByRole('button', { name: '신청' }).click();
    await techManagerPage.waitForLoadState('networkidle');

    // Verify success message and get checkout ID from URL or response
    await expect(
      techManagerPage.getByRole('status').filter({ hasText: /신청|완료|성공/ })
    ).toBeVisible();

    // Extract checkout ID from current URL (should redirect to /checkouts/[id])
    const currentUrl = techManagerPage.url();
    const checkoutId = currentUrl.match(/\/checkouts\/([a-f0-9-]+)/)?.[1];
    expect(checkoutId).toBeTruthy();
    console.log(`✓ Created checkout ${checkoutId} with status: pending`);

    // ============================================================
    // STEP 3: Approve checkout → status: 'approved'
    // ============================================================
    // Already on checkout detail page from redirect
    await techManagerPage.waitForLoadState('networkidle');

    // Verify status is 'pending'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.pending)).toBeVisible();

    // Click "승인" button
    const approveButton = techManagerPage.getByRole('button', { name: '승인' });
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // Confirm in dialog
    await techManagerPage.waitForTimeout(500);
    const confirmButton = techManagerPage.getByRole('button', { name: '확인' });
    await confirmButton.click();

    await techManagerPage.waitForLoadState('networkidle');
    await techManagerPage.waitForTimeout(1000);

    // Verify status changed to 'approved'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

    console.log(`✓ Approved checkout ${checkoutId}, status: approved`);

    // ============================================================
    // STEP 4: Start checkout → equipment status: 'checked_out'
    // ============================================================
    // Click "반출 시작" button
    const checkoutStartButton = techManagerPage.getByRole('button', { name: '반출 시작' });
    await expect(checkoutStartButton).toBeVisible();
    await checkoutStartButton.click();

    // Confirm in dialog
    await techManagerPage.waitForTimeout(500);
    await techManagerPage.getByRole('button', { name: '확인' }).click();

    await techManagerPage.waitForLoadState('networkidle');
    await techManagerPage.waitForTimeout(1000);

    // Verify checkout status changed to 'checked_out'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.checked_out)).toBeVisible();

    // Verify equipment status changed to 'checked_out'
    equipmentResponse = await techManagerPage.request.get(`/api/equipment/${TEST_EQUIPMENT_ID}`);
    equipmentData = await equipmentResponse.json();
    expect(equipmentData.status).toBe('checked_out');

    console.log(`✓ Started checkout ${checkoutId}, equipment status: checked_out`);

    // ============================================================
    // STEP 5: Return checkout → checkout status: 'returned'
    // ============================================================
    // Click "반입 신청" button
    const returnButton = techManagerPage.getByRole('button', { name: '반입 신청' });
    await expect(returnButton).toBeVisible();
    await returnButton.click();

    await techManagerPage.waitForTimeout(500);

    // Fill inspection form (calibration checkout requires calibrationChecked + workingStatusChecked)
    const calibrationCheck = techManagerPage.getByLabel(/교정 상태 확인|교정.*확인/);
    await calibrationCheck.check();

    const workingStatusCheck = techManagerPage.getByLabel(/작동 상태 확인|작동.*확인/);
    await workingStatusCheck.check();

    // Submit return request
    await techManagerPage.getByRole('button', { name: '확인' }).click();

    await techManagerPage.waitForLoadState('networkidle');
    await techManagerPage.waitForTimeout(1000);

    // Verify checkout status changed to 'returned'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.returned)).toBeVisible();

    // Verify equipment status is still 'checked_out' (not yet approved)
    equipmentResponse = await techManagerPage.request.get(`/api/equipment/${TEST_EQUIPMENT_ID}`);
    equipmentData = await equipmentResponse.json();
    expect(equipmentData.status).toBe('checked_out');

    console.log(
      `✓ Returned checkout ${checkoutId}, status: returned (equipment still checked_out)`
    );

    // ============================================================
    // STEP 6: Approve return → equipment status: 'available' (restored)
    // ============================================================
    // Click "반입 승인" button
    const approveReturnButton = techManagerPage.getByRole('button', { name: '반입 승인' });
    await expect(approveReturnButton).toBeVisible();
    await approveReturnButton.click();

    // Confirm in dialog
    await techManagerPage.waitForTimeout(500);
    await techManagerPage.getByRole('button', { name: '확인' }).click();

    await techManagerPage.waitForLoadState('networkidle');
    await techManagerPage.waitForTimeout(1000);

    // Verify checkout status changed to 'return_approved'
    await expect(techManagerPage.getByText(CHECKOUT_STATUS_LABELS.return_approved)).toBeVisible();

    // 🎯 CRITICAL VALIDATION: Verify equipment status restored to 'available'
    equipmentResponse = await techManagerPage.request.get(`/api/equipment/${TEST_EQUIPMENT_ID}`);
    equipmentData = await equipmentResponse.json();
    expect(equipmentData.status).toBe('available');

    console.log(
      `✓ Approved return for checkout ${checkoutId}, equipment status: available (RESTORED)`
    );

    // ============================================================
    // STEP 7: Verify complete lifecycle in UI
    // ============================================================
    // Navigate to equipment detail page
    await techManagerPage.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
    await techManagerPage.waitForLoadState('networkidle');

    // Verify equipment shows as available
    await expect(techManagerPage.getByText(EQUIPMENT_STATUS_LABELS.available)).toBeVisible();

    // Verify checkout history shows the complete lifecycle
    // Look for status history or activity log
    await expect(techManagerPage.getByText(/반출.*이력|활동.*이력/)).toBeVisible();

    console.log(`✓✓✓ COMPLETE LIFECYCLE TEST PASSED ✓✓✓`);
    console.log(`Equipment ${TEST_EQUIPMENT_ID} successfully completed full cycle:`);
    console.log(
      `  available → pending → approved → checked_out → returned → return_approved → available`
    );
  });
});
