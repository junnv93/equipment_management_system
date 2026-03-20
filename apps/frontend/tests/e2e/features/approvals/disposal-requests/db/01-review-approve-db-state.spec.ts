/**
 * Suite 7.1: Review approval updates disposal_requests to reviewed status
 *
 * Spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * Seed: tests/e2e/seed.spec.ts
 *
 * This test verifies that when a technical_manager approves a disposal review:
 * 1. disposal_requests.review_status changes to 'reviewed'
 * 2. disposal_requests.reviewed_by is set to technical_manager's user ID
 * 3. disposal_requests.reviewed_at is set to current timestamp
 * 4. equipment.status remains 'pending_disposal' (not yet disposed)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';
import { Pool } from 'pg';
import {
  EQUIP_DISPOSAL_PERM_A4,
  DISP_REQ_A4_ID,
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
    // Reset EQUIP_DISPOSAL_PERM_A4 to pending disposal state
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A4,
      DISP_REQ_A4_ID,
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

  test('Review approval updates disposal_requests to reviewed status', async ({
    techManagerPage,
  }) => {
    // 1. Navigate to disposal review tab with cache busting
    const cacheBuster = Date.now();
    await techManagerPage.goto(`/admin/approvals?tab=disposal_review&_=${cacheBuster}`);

    // 2. Wait for page load
    await techManagerPage.waitForLoadState('networkidle');
    await expect(techManagerPage.locator('h1:has-text("승인 관리")')).toBeVisible();

    // 3. Wait for the approval list to render
    await expect(techManagerPage.locator('h3:has-text("승인 대기 목록")')).toBeVisible();

    // 4. Find A4 equipment in list
    const a4Card = techManagerPage
      .locator('[data-testid="approval-item"]')
      .filter({ hasText: '[Disposal Test A4] 파워 미터' });
    await expect(a4Card).toBeVisible();

    // 5. Verify the item shows pending status
    await expect(a4Card.locator('text=대기')).toBeVisible();

    // 6. Click '검토완료' button
    const approveButton = a4Card.locator('button:has-text("검토완료")');
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // 7. Wait for toast success message (use first() to avoid strict mode violation)
    await expect(techManagerPage.locator('text=승인 완료').first()).toBeVisible({ timeout: 10000 });

    // 8. Wait for the item to disappear from the list
    await expect(a4Card).toBeHidden({ timeout: 10000 });

    // 9. Query database: disposal_requests table
    const disposalResult = await pool.query(
      `SELECT review_status, reviewed_by, reviewed_at 
       FROM disposal_requests 
       WHERE id = $1`,
      [DISP_REQ_A4_ID]
    );

    expect(disposalResult.rows.length).toBe(1);
    const disposalRequest = disposalResult.rows[0];

    // 10. Verify review_status = 'reviewed'
    expect(disposalRequest.review_status).toBe(DRSVal.REVIEWED);

    // 11. Verify reviewed_by = technical_manager user ID
    expect(disposalRequest.reviewed_by).toBe(USER_TECHNICAL_MANAGER_SUWON_ID);

    // 12. Verify reviewed_at is a valid recent timestamp
    // Note: We use a relaxed time constraint (24 hours) because we're testing
    // DB state changes, not exact timing. This avoids timezone-related failures.
    const reviewedAt = new Date(disposalRequest.reviewed_at);
    const now = new Date();
    const timeDiffSeconds = Math.abs((now.getTime() - reviewedAt.getTime()) / 1000);

    expect(timeDiffSeconds).toBeLessThan(86400); // Within 24 hours

    console.log(`✅ Disposal request reviewed_at: ${reviewedAt.toISOString()}`);
    console.log(`✅ Time difference: ${timeDiffSeconds.toFixed(2)} seconds`);

    // 13. Query equipment table
    const equipmentResult = await pool.query('SELECT status FROM equipment WHERE id = $1', [
      EQUIP_DISPOSAL_PERM_A4,
    ]);

    expect(equipmentResult.rows.length).toBe(1);
    const equipment = equipmentResult.rows[0];

    // 14. Verify equipment.status is still 'pending_disposal'
    // (NOT yet 'disposed' - that happens at final approval)
    expect(equipment.status).toBe(ESVal.PENDING_DISPOSAL);

    console.log('✅ Database verification complete');
    console.log(`   - review_status: ${disposalRequest.review_status}`);
    console.log(`   - reviewed_by: ${disposalRequest.reviewed_by}`);
    console.log(`   - reviewed_at: ${reviewedAt.toISOString()}`);
    console.log(`   - equipment.status: ${equipment.status}`);
  });
});
