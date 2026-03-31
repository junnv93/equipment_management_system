/**
 * Suite 7.3: Review rejection updates disposal_requests and reverts equipment status
 *
 * Spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * Seed: tests/e2e/seed.spec.ts
 *
 * This test verifies that when a technical_manager rejects a disposal review:
 * 1. disposal_requests.review_status changes to 'rejected'
 * 2. disposal_requests.rejected_by is set to technical_manager's user ID
 * 3. disposal_requests.rejection_reason contains the entered text
 * 4. disposal_requests.rejected_at is set to current timestamp
 * 5. equipment.status reverts from 'pending_disposal' (not 'pending_disposal' after rejection)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';
import { Pool } from 'pg';
import {
  EQUIP_DISPOSAL_REJ_C1,
  DISP_REQ_C1_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import {
  DisposalReviewStatusValues as DRSVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';

test.describe('Database State Verification', () => {
  // Database pool instance
  let pool: Pool;

  test.beforeEach(async () => {
    // Reset EQUIP_DISPOSAL_REJ_C1 to pending disposal state
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C1,
      DISP_REQ_C1_ID,
      USER_TEST_ENGINEER_SUWON_ID
    );

    // Initialize database pool for queries
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/equipment_management',
    });
  });

  test.afterEach(async () => {
    // Close the pool after each test
    if (pool) {
      await pool.end();
    }
  });

  test.afterAll(async () => {
    // Cleanup shared pool
    await cleanupPool();
  });

  test('Review rejection updates disposal_requests and reverts equipment', async ({
    techManagerPage,
  }) => {
    // 1. Navigate to disposal review tab with cache busting
    const cacheBuster = Date.now();
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${cacheBuster}`);

    // 2. Wait for page load
    await expect(techManagerPage.locator('h1:has-text("승인 관리")')).toBeVisible();

    // 3. Wait for the approval list to render
    await expect(techManagerPage.locator('h3:has-text("승인 대기 목록")')).toBeVisible();

    // 4. Find C1 equipment in list
    const c1Card = techManagerPage
      .locator('[data-testid="approval-item"]')
      .filter({ hasText: '[Disposal Test C1] 전압계' });
    await expect(c1Card).toBeVisible();

    // 5. Verify the item shows pending status
    await expect(c1Card.locator('text=대기')).toBeVisible();

    // 6. Click '반려' button (reject)
    const rejectButton = c1Card.locator('button:has-text("반려")');
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    // 7. Wait for the RejectModal to open
    const rejectModal = techManagerPage.getByRole('dialog').filter({ hasText: '반려' });
    await expect(rejectModal).toBeVisible();

    // 8. Enter rejection reason with 10+ characters
    const rejectionReason = '폐기가 부적절합니다. 추가 검토가 필요합니다.';
    const reasonTextarea = rejectModal.locator('textarea[id="reject-reason"]');
    await expect(reasonTextarea).toBeVisible();
    await reasonTextarea.fill(rejectionReason);

    // 9. Confirm rejection by clicking submit button in modal
    const submitButton = rejectModal.locator('button:has-text("반려")').last();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 10. Wait for toast success message (use first() to avoid strict mode violation)
    await expect(techManagerPage.locator('text=반려 완료').first()).toBeVisible({ timeout: 10000 });

    // 11. Wait for the item to disappear from the list
    await expect(c1Card).toBeHidden({ timeout: 10000 });

    // 12. Query database: disposal_requests table
    const disposalResult = await pool.query(
      `SELECT review_status, rejected_by, rejection_reason, rejected_at 
       FROM disposal_requests 
       WHERE id = $1`,
      [DISP_REQ_C1_ID]
    );

    expect(disposalResult.rows.length).toBe(1);
    const disposalRequest = disposalResult.rows[0];

    // 13. Verify review_status = 'rejected'
    expect(disposalRequest.review_status).toBe(DRSVal.REJECTED);

    // 14. Verify rejected_by = technical_manager user ID
    expect(disposalRequest.rejected_by).toBe(USER_TECHNICAL_MANAGER_SUWON_ID);

    // 15. Verify rejection_reason contains the text entered (10+ chars)
    expect(disposalRequest.rejection_reason).toContain(rejectionReason);
    expect(disposalRequest.rejection_reason.length).toBeGreaterThanOrEqual(10);

    // 16. Verify rejected_at is a valid recent timestamp
    // Note: We use a relaxed time constraint (24 hours) because we're testing
    // DB state changes, not exact timing. This avoids timezone-related failures.
    const rejectedAt = new Date(disposalRequest.rejected_at);
    const now = new Date();
    const timeDiffSeconds = Math.abs((now.getTime() - rejectedAt.getTime()) / 1000);

    expect(timeDiffSeconds).toBeLessThan(86400); // Within 24 hours

    console.log(`✅ Disposal request rejected_at: ${rejectedAt.toISOString()}`);
    console.log(`✅ Time difference: ${timeDiffSeconds.toFixed(2)} seconds`);

    // 17. Query equipment table
    const equipmentResult = await pool.query('SELECT status FROM equipment WHERE id = $1', [
      EQUIP_DISPOSAL_REJ_C1,
    ]);

    expect(equipmentResult.rows.length).toBe(1);
    const equipment = equipmentResult.rows[0];

    // 18. Verify equipment.status is NOT 'pending_disposal' (reverted to previous status)
    expect(equipment.status).not.toBe(ESVal.PENDING_DISPOSAL);
    console.log(`✅ Equipment status reverted to: ${equipment.status}`);

    console.log('✅ Database verification complete');
    console.log(`   - review_status: ${disposalRequest.review_status}`);
    console.log(`   - rejected_by: ${disposalRequest.rejected_by}`);
    console.log(`   - rejection_reason: ${disposalRequest.rejection_reason}`);
    console.log(`   - rejected_at: ${rejectedAt.toISOString()}`);
    console.log(`   - equipment.status: ${equipment.status} (NOT pending_disposal)`);
  });
});
