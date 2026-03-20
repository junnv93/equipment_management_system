/**
 * Shared database cleanup utilities for disposal E2E tests
 *
 * This module provides a single, reusable Pool instance to avoid
 * connection pool exhaustion when running multiple tests.
 */

import { Pool } from 'pg';
import {
  EquipmentStatusValues as ESVal,
  DisposalReviewStatusValues as DRSVal,
} from '@equipment-management/schemas';

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';

// Single shared pool instance for all tests
let sharedPool: Pool | null = null;

/**
 * Get or create the shared database pool
 */
function getPool(): Pool {
  if (!sharedPool) {
    sharedPool = new Pool({
      connectionString: DATABASE_URL,
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return sharedPool;
}

/**
 * Cleanup the shared pool (call in global teardown)
 * Made idempotent to safely handle multiple calls
 */
export async function cleanupPool(): Promise<void> {
  if (sharedPool) {
    try {
      await sharedPool.end();
    } catch (error) {
      console.warn('Pool cleanup warning:', error);
    } finally {
      sharedPool = null;
    }
  }
}

/**
 * Reset equipment to 'available' status with no disposal requests
 *
 * ⚠️ IMPORTANT: This function directly modifies the database, bypassing backend cache.
 * The backend cache has a 1-hour TTL, so old data may still be served.
 * After reset, the test should wait sufficiently before making assertions.
 */
export async function resetEquipmentToAvailable(equipmentId: string): Promise<void> {
  const pool = getPool();

  // Verify equipment exists
  const result = await pool.query('SELECT id FROM equipment WHERE id = $1', [equipmentId]);
  if (result.rows.length === 0) {
    throw new Error(
      `Equipment ${equipmentId} does not exist. Please run: pnpm --filter backend run db:seed`
    );
  }

  // Delete any existing disposal request
  await pool.query('DELETE FROM disposal_requests WHERE equipment_id = $1', [equipmentId]);

  // Reset equipment status to available with approved approval_status
  // Set updated_at far in the past to avoid cache key conflicts
  await pool.query(
    `UPDATE equipment
     SET status = $1,
         is_shared = $2,
         approval_status = $3,
         updated_at = NOW() - INTERVAL '2 hours'
     WHERE id = $4`,
    [ESVal.AVAILABLE, false, 'approved', equipmentId]
  );

  console.log(`✅ Database updated: equipment ${equipmentId} reset to ${ESVal.AVAILABLE}`);
  console.log(`⚠️  Backend cache may still contain old data (TTL: 1 hour)`);

  // Wait for DB transaction to fully commit
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Reset equipment to 'pending_disposal' status with reviewed disposal request
 */
export async function resetEquipmentToReviewedDisposal(
  equipmentId: string,
  disposalRequestId: string,
  requesterId: string,
  reviewerId: string
): Promise<void> {
  const pool = getPool();

  // Verify equipment exists
  const result = await pool.query('SELECT id FROM equipment WHERE id = $1', [equipmentId]);
  if (result.rows.length === 0) {
    throw new Error(
      `Equipment ${equipmentId} does not exist. Please run: pnpm --filter backend run db:seed`
    );
  }

  // Update equipment status
  await pool.query('UPDATE equipment SET status = $1, updated_at = NOW() WHERE id = $2', [
    ESVal.PENDING_DISPOSAL,
    equipmentId,
  ]);

  // Insert or update disposal request
  await pool.query(
    `
    INSERT INTO disposal_requests (
      id, equipment_id, reason, reason_detail, requested_by,
      review_status, reviewed_by, reviewed_at, review_opinion,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'obsolete', 'DB 시드 데이터 - 검토 완료 상태',
      $3, $5, $4, NOW(), 'DB 시드 데이터 - 검토 의견',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      review_status = $5,
      reviewed_by = $4,
      reviewed_at = NOW(),
      review_opinion = 'DB 시드 데이터 - 검토 의견',
      approved_by = NULL,
      approved_at = NULL,
      approval_comment = NULL,
      rejected_by = NULL,
      rejected_at = NULL,
      rejection_reason = NULL,
      updated_at = NOW()
  `,
    [disposalRequestId, equipmentId, requesterId, reviewerId, DRSVal.REVIEWED]
  );
}

/**
 * Reset equipment to 'pending_disposal' status with pending disposal request
 */
export async function resetEquipmentToPendingDisposal(
  equipmentId: string,
  disposalRequestId: string,
  requesterId: string
): Promise<void> {
  const pool = getPool();

  // Verify equipment exists
  const result = await pool.query('SELECT id FROM equipment WHERE id = $1', [equipmentId]);
  if (result.rows.length === 0) {
    throw new Error(
      `Equipment ${equipmentId} does not exist. Please run: pnpm --filter backend run db:seed`
    );
  }

  // Delete any existing disposal request first
  await pool.query('DELETE FROM disposal_requests WHERE equipment_id = $1', [equipmentId]);

  // Update equipment status
  await pool.query('UPDATE equipment SET status = $1, updated_at = NOW() WHERE id = $2', [
    ESVal.PENDING_DISPOSAL,
    equipmentId,
  ]);

  // Insert fresh disposal request
  await pool.query(
    `
    INSERT INTO disposal_requests (
      id, equipment_id, reason, reason_detail, requested_by,
      review_status, created_at, updated_at
    ) VALUES (
      $1, $2, 'obsolete', 'DB 시드 데이터 - 검토 대기 상태',
      $3, $4, NOW(), NOW()
    )
  `,
    [disposalRequestId, equipmentId, requesterId, DRSVal.PENDING]
  );
}

/**
 * Reset equipment to shared state
 */
export async function resetEquipmentToShared(equipmentId: string): Promise<void> {
  const pool = getPool();

  // Verify equipment exists
  const result = await pool.query('SELECT id FROM equipment WHERE id = $1', [equipmentId]);
  if (result.rows.length === 0) {
    throw new Error(
      `Equipment ${equipmentId} does not exist. Please run: pnpm --filter backend run db:seed`
    );
  }

  // Delete any existing disposal request
  await pool.query('DELETE FROM disposal_requests WHERE equipment_id = $1', [equipmentId]);

  // Reset equipment to shared state with approved approval_status
  await pool.query(
    'UPDATE equipment SET status = $1, is_shared = $2, approval_status = $3, updated_at = NOW() WHERE id = $4',
    [ESVal.AVAILABLE, true, 'approved', equipmentId]
  );
}

/**
 * Reset equipment to disposed state
 */
export async function resetEquipmentToDisposed(
  equipmentId: string,
  disposalRequestId: string,
  requesterId: string,
  reviewerId: string,
  approverId: string
): Promise<void> {
  const pool = getPool();

  // Verify equipment exists
  const result = await pool.query('SELECT id FROM equipment WHERE id = $1', [equipmentId]);
  if (result.rows.length === 0) {
    throw new Error(
      `Equipment ${equipmentId} does not exist. Please run: pnpm --filter backend run db:seed`
    );
  }

  // Update equipment status
  await pool.query('UPDATE equipment SET status = $1, updated_at = NOW() WHERE id = $2', [
    ESVal.DISPOSED,
    equipmentId,
  ]);

  // Insert or update disposal request
  await pool.query(
    `
    INSERT INTO disposal_requests (
      id, equipment_id, reason, reason_detail, requested_by,
      review_status, reviewed_by, reviewed_at, review_opinion,
      approved_by, approved_at, approval_comment,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'obsolete', 'DB 시드 데이터 - 승인 완료 상태',
      $3, $6, $4, NOW() - INTERVAL '2 days', 'DB 시드 데이터 - 검토 의견',
      $5, NOW() - INTERVAL '1 day', 'DB 시드 데이터 - 승인 코멘트',
      NOW() - INTERVAL '3 days', NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      review_status = $6,
      reviewed_by = $4,
      reviewed_at = NOW() - INTERVAL '2 days',
      review_opinion = 'DB 시드 데이터 - 검토 의견',
      approved_by = $5,
      approved_at = NOW() - INTERVAL '1 day',
      approval_comment = 'DB 시드 데이터 - 승인 코멘트',
      rejected_by = NULL,
      rejected_at = NULL,
      rejection_reason = NULL,
      updated_at = NOW()
  `,
    [disposalRequestId, equipmentId, requesterId, reviewerId, approverId, DRSVal.APPROVED]
  );
}

/**
 * Clear ALL pending disposal requests from ALL teams
 * This is useful for bulk action tests to ensure a clean slate
 */
export async function clearAllPendingDisposalRequests(): Promise<void> {
  const pool = getPool();

  // Get all equipment IDs with pending disposal requests
  const equipmentResult = await pool.query(
    `SELECT DISTINCT equipment_id FROM disposal_requests WHERE review_status = $1`,
    [DRSVal.PENDING]
  );

  // Delete all pending disposal requests
  await pool.query(`DELETE FROM disposal_requests WHERE review_status = $1`, [DRSVal.PENDING]);

  // Reset status of all affected equipment to 'available'
  if (equipmentResult.rows.length > 0) {
    const equipmentIds = equipmentResult.rows.map((row) => row.equipment_id);
    await pool.query(
      `UPDATE equipment SET status = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
      [ESVal.AVAILABLE, equipmentIds]
    );
  }

  console.log(`✅ Cleared ${equipmentResult.rows.length} pending disposal requests from database`);
}
