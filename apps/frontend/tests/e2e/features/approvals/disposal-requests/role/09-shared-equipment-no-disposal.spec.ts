/**
 * Group A: Permissions - Test 1.5
 * Test: shared equipment hides disposal button
 * Equipment: EQUIP_DISPOSAL_PERM_A8 (available, isShared=true)
 *
 * Business Rule:
 * - Shared equipment (identified by isShared=true flag) follows a different lifecycle
 *   (checkout/checkin) and CANNOT be disposed by individual teams
 * - The disposal request button should be completely hidden for shared equipment
 *   (enforced by use-disposal-permissions.ts: canRequestDisposal = ... && !equipment.isShared)
 * - A "공용장비 안내" banner should be visible to indicate the equipment is shared
 *
 * Implementation:
 * - Frontend: useDisposalPermissions hook checks !equipment.isShared
 * - Database: equipment.is_shared column (boolean)
 * - Seed data: EQUIP_DISPOSAL_PERM_A8 has isShared=true
 *
 * IMPORTANT:
 * - This test includes automatic cleanup to ensure isShared=true before each run
 * - The cleanup ensures idempotent test execution
 * - Equipment detail page uses force-dynamic rendering to prevent stale cache
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A8 } from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToShared, cleanupPool } from '../helpers/db-cleanup';
import { Pool } from 'pg';

test.describe('Permissions - Group A', () => {
  test.beforeEach(async ({ testOperatorPage }) => {
    // Ensure clean state before each test
    await resetEquipmentToShared(EQUIP_DISPOSAL_PERM_A8);

    // Allow cache to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate with cache-busting to ensure fresh data
    const cacheBuster = Date.now();
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A8}?_t=${cacheBuster}`, {
      waitUntil: 'domcontentloaded',
    });
  });

  test('shared equipment hides disposal button', async ({ testOperatorPage }) => {
    // Wait for React hydration (disposal button is client-side rendered)
    await testOperatorPage.waitForLoadState('networkidle').catch(() => {});
    await testOperatorPage.waitForTimeout(1000);

    // 1. Verify equipment is in 'available' state (status badge uses role="status", not "button")
    const availableStatus = testOperatorPage.getByRole('status', { name: /장비 상태.*사용 가능/i });
    await expect(availableStatus).toBeVisible({ timeout: 5000 });

    // 2. Verify shared equipment banner is visible
    const sharedBanner = testOperatorPage.getByRole('heading', { name: '공용장비 안내' });
    await expect(sharedBanner).toBeVisible({ timeout: 5000 });

    // 3. Verify "폐기 요청" button is NOT visible (business rule: shared equipment cannot be disposed)
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/i });
    await expect(requestButton).not.toBeVisible();

    // 4. Verify no disposal-related buttons are present at all
    const disposalButtons = testOperatorPage.getByRole('button', { name: /폐기/i });
    const disposalButtonCount = await disposalButtons.count();
    expect(disposalButtonCount).toBe(0);

    // 5. Verify database state: equipment should still be available and isShared=true
    const DATABASE_URL =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/equipment_management';
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
      const result = await pool.query('SELECT status, is_shared FROM equipment WHERE id = $1', [
        EQUIP_DISPOSAL_PERM_A8,
      ]);
      expect(result.rows[0].status).toBe('available');
      expect(result.rows[0].is_shared).toBe(true);
    } finally {
      await pool.end();
    }
  });

  test.afterAll(async () => {
    await cleanupPool();
  });
});
