/**
 * Seed data verification utilities
 * Validates that all seed data meets requirements for E2E tests
 */

import { Pool } from 'pg';
import { CALIBRATION_PLAN_STATUS_VALUES } from '@equipment-management/schemas';

interface VerificationResult {
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    actual?: number | string;
    expected?: number | string;
    details?: string;
  }[];
}

/**
 * Verify all critical seed data requirements using raw SQL
 */
export async function verifySeed(pool: Pool): Promise<VerificationResult> {
  const checks = [];

  try {
    // =========================================================================
    // Phase 1: Core Entity Counts
    // =========================================================================

    // Users count
    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Users count',
      passed: userCount >= 8,
      actual: userCount,
      expected: 8,
    });

    // Teams count
    const teamResult = await pool.query('SELECT COUNT(*) as count FROM teams');
    const teamCount = parseInt(teamResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Teams count',
      passed: teamCount >= 6,
      actual: teamCount,
      expected: 6,
    });

    // Equipment count
    const equipResult = await pool.query('SELECT COUNT(*) as count FROM equipment');
    const equipCount = parseInt(equipResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Equipment count',
      passed: equipCount >= 32,
      actual: equipCount,
      expected: 32,
    });

    // =========================================================================
    // Phase 1: Equipment Status Distribution
    // =========================================================================

    const statusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM equipment GROUP BY status'
    );
    const statusMap = new Map(statusResult.rows.map((r) => [r.status, parseInt(r.count, 10)]));

    // Verify each filter-able status has at least 2 equipment
    const filterableStatuses = [
      'available',
      'in_use',
      'checked_out',
      'calibration_overdue',
      'non_conforming',
      'spare',
      'pending_disposal',
      'disposed',
    ];

    for (const status of filterableStatuses) {
      const count = statusMap.get(status) || 0;
      checks.push({
        name: `Equipment status: ${status}`,
        passed: count >= 1,
        actual: count,
        expected: 1,
      });
    }

    // =========================================================================
    // Phase 1: Calibration Data
    // =========================================================================

    const calibResult = await pool.query('SELECT COUNT(*) as count FROM calibrations');
    const calibCount = parseInt(calibResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Calibrations count',
      passed: calibCount >= 18,
      actual: calibCount,
      expected: 18,
    });

    // Pending approval calibrations
    const pendingApprovalCalibs = await pool.query(
      "SELECT COUNT(*) as count FROM calibrations WHERE approval_status = 'pending_approval'"
    );
    const pendingCount = parseInt(pendingApprovalCalibs.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Calibrations pending approval',
      passed: pendingCount >= 6,
      actual: pendingCount,
      expected: 6,
    });

    // =========================================================================
    // Phase 1: Non-Conformances
    // =========================================================================

    const ncResult = await pool.query('SELECT COUNT(*) as count FROM non_conformances');
    const ncCount = parseInt(ncResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Non-conformances count',
      passed: ncCount >= 10,
      actual: ncCount,
      expected: 10,
    });

    // =========================================================================
    // Phase 1B: Checkouts
    // =========================================================================

    const checkoutResult = await pool.query('SELECT COUNT(*) as count FROM checkouts');
    const checkoutCount = parseInt(checkoutResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Checkouts count',
      passed: checkoutCount >= 68,
      actual: checkoutCount,
      expected: 68,
    });

    // Pending checkouts (for C-1 permission test)
    const pendingCheckouts = await pool.query(
      "SELECT COUNT(*) as count FROM checkouts WHERE status = 'pending'"
    );
    const pendingCheckoutCount = parseInt(pendingCheckouts.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Pending checkouts',
      passed: pendingCheckoutCount >= 8,
      actual: pendingCheckoutCount,
      expected: 8,
    });

    // =========================================================================
    // Phase 2: Calibration Plans (3-step approval)
    // =========================================================================

    const cplanResult = await pool.query('SELECT COUNT(*) as count FROM calibration_plans');
    const cplanCount = parseInt(cplanResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Calibration Plans count',
      passed: cplanCount >= 6,
      actual: cplanCount,
      expected: 6,
    });

    // Status distribution: at least 1 per workflow state
    const cplanStatusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM calibration_plans GROUP BY status'
    );
    const cplanStatusMap = new Map(
      cplanStatusResult.rows.map((r) => [r.status, parseInt(r.count, 10)])
    );

    for (const status of CALIBRATION_PLAN_STATUS_VALUES) {
      const count = cplanStatusMap.get(status) || 0;
      checks.push({
        name: `Calibration Plan status: ${status}`,
        passed: count >= 1,
        actual: count,
        expected: 1,
      });
    }

    // Plan items
    const cplanItemResult = await pool.query(
      'SELECT COUNT(*) as count FROM calibration_plan_items'
    );
    const cplanItemCount = parseInt(cplanItemResult.rows[0]?.count ?? 0, 10);
    checks.push({
      name: 'Calibration Plan Items count',
      passed: cplanItemCount >= 12,
      actual: cplanItemCount,
      expected: 12,
    });

    // =========================================================================
    // SUMMARY
    // =========================================================================

    const passed = checks.every((check) => check.passed);

    return { passed, checks };
  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
}

/**
 * Print verification results
 */
export function printVerificationResults(result: VerificationResult): void {
  console.log('\n✅ SEED DATA VERIFICATION REPORT\n');
  console.log('=' + '='.repeat(79));

  let passCount = 0;
  let failCount = 0;

  for (const check of result.checks) {
    if (check.passed) {
      passCount++;
      console.log(`✅ ${check.name}`);
      if (check.actual !== undefined) {
        console.log(`   → ${check.actual} (expected: ${check.expected})`);
      }
    } else {
      failCount++;
      console.log(`❌ ${check.name}`);
      console.log(`   → Actual: ${check.actual}, Expected: ${check.expected}`);
      if (check.details) {
        console.log(`   → ${check.details}`);
      }
    }
  }

  console.log('=' + '='.repeat(79));
  console.log(`\nSummary: ${passCount}/${result.checks.length} checks passed`);

  if (result.passed) {
    console.log('✅ All verifications passed! Data is ready for E2E tests.\n');
  } else {
    console.log(`❌ ${failCount} checks failed. Please review the data.\n`);
  }
}
