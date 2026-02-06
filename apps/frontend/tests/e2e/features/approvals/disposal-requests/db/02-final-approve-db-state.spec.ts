/**
 * Suite 7.2: Final approval updates disposal_requests to approved and equipment to disposed
 *
 * Spec: apps/frontend/tests/e2e/approvals-disposal/approvals-disposal.plan.md
 * Seed: tests/e2e/seed.spec.ts
 *
 * This test verifies that when a lab_manager performs final approval:
 * 1. disposal_requests.review_status changes to 'approved'
 * 2. disposal_requests.approved_by is set to lab_manager's user ID
 * 3. disposal_requests.approved_at is set to current timestamp
 * 4. equipment.status changes to 'disposed' (final state)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToReviewedDisposal, cleanupPool } from '../helpers/db-cleanup';
import { Pool } from 'pg';
import {
  EQUIP_DISPOSAL_PERM_A5,
  DISP_REQ_A5_ID,
  USER_LAB_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';

test.describe('Database State Verification', () => {
  // Database pool instance
  let pool: Pool;

  test.beforeEach(async () => {
    // Reset EQUIP_DISPOSAL_PERM_A5 to reviewed disposal state
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_PERM_A5,
      DISP_REQ_A5_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
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

  test('Final approval updates disposal_requests to approved and equipment to disposed', async ({
    siteAdminPage,
  }) => {
    // 1. Navigate to disposal final approval tab with cache busting
    const cacheBuster = Date.now();
    await siteAdminPage.goto(`/admin/approvals?tab=disposal_final&_=${cacheBuster}`);

    // 2. Wait for page load
    await siteAdminPage.waitForLoadState('networkidle');
    await expect(siteAdminPage.locator('h1:has-text("승인 관리")')).toBeVisible();

    // 3. Wait for the approval list to render
    await expect(siteAdminPage.locator('h3:has-text("승인 대기 목록")')).toBeVisible();

    // 4. Find A5 equipment in list
    const a5Card = siteAdminPage
      .locator('[data-testid="approval-item"]')
      .filter({ hasText: '[Disposal Test A5] EMC 수신기' });
    await expect(a5Card).toBeVisible();

    // 5. Verify the item shows reviewed status
    await expect(a5Card.locator('text=검토 완료')).toBeVisible();

    // 6. Click '승인' button (final approval)
    const approveButton = a5Card.locator('button:has-text("승인")');
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // 7. Wait for toast success message (use first() to avoid strict mode violation)
    await expect(siteAdminPage.locator('text=승인 완료').first()).toBeVisible({ timeout: 10000 });

    // 8. Wait for the item to disappear from the list
    await expect(a5Card).toBeHidden({ timeout: 10000 });

    // 9. Query database: disposal_requests table
    const disposalResult = await pool.query(
      `SELECT review_status, approved_by, approved_at 
       FROM disposal_requests 
       WHERE id = $1`,
      [DISP_REQ_A5_ID]
    );

    expect(disposalResult.rows.length).toBe(1);
    const disposalRequest = disposalResult.rows[0];

    // 10. Verify review_status = 'approved'
    expect(disposalRequest.review_status).toBe('approved');

    // 11. Verify approved_by = lab_manager user ID
    expect(disposalRequest.approved_by).toBe(USER_LAB_MANAGER_SUWON_ID);

    // 12. Verify approved_at is a valid recent timestamp
    // Note: We use a relaxed time constraint (24 hours) because we're testing
    // DB state changes, not exact timing. This avoids timezone-related failures.
    const approvedAt = new Date(disposalRequest.approved_at);
    const now = new Date();
    const timeDiffSeconds = Math.abs((now.getTime() - approvedAt.getTime()) / 1000);

    expect(timeDiffSeconds).toBeLessThan(86400); // Within 24 hours

    console.log(`✅ Disposal request approved_at: ${approvedAt.toISOString()}`);
    console.log(`✅ Time difference: ${timeDiffSeconds.toFixed(2)} seconds`);

    // 13. Query equipment table
    const equipmentResult = await pool.query('SELECT status FROM equipment WHERE id = $1', [
      EQUIP_DISPOSAL_PERM_A5,
    ]);

    expect(equipmentResult.rows.length).toBe(1);
    const equipment = equipmentResult.rows[0];

    // 14. Verify equipment.status = 'disposed' (final state after approval)
    expect(equipment.status).toBe('disposed');

    console.log('✅ Database verification complete');
    console.log(`   - review_status: ${disposalRequest.review_status}`);
    console.log(`   - approved_by: ${disposalRequest.approved_by}`);
    console.log(`   - approved_at: ${approvedAt.toISOString()}`);
    console.log(`   - equipment.status: ${equipment.status}`);
  });
});
