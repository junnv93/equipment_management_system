/**
 * Seed data verification utilities
 *
 * **SSOT 원칙**: expected count 는 seed array 에서 직접 도출한다.
 * 하드코딩된 magic number(예: `>= 18`)는 시드 변경 시 drift 의 원인이 되었으므로
 * 모든 count 검증은 `SEED_ARRAY.length` 또는 `SEED_ARRAY.filter(...).length` 를
 * single source of truth 로 사용한다.
 *
 * 시드는 Phase 0 에서 truncate 후 deterministic 하게 insert 되므로
 * DB count 는 seed length 와 정확히 일치해야 한다 (===).
 */

import { Pool } from 'pg';
import { CALIBRATION_PLAN_STATUS_VALUES } from '@equipment-management/schemas';

import { USERS_SEED_DATA } from '../seed-data/core/users.seed';
import { TEAMS_SEED_DATA } from '../seed-data/core/teams.seed';
import { EQUIPMENT_SEED_DATA } from '../seed-data/core/equipment.seed';
import { CALIBRATIONS_SEED_DATA } from '../seed-data/calibration/calibrations.seed';
import { NON_CONFORMANCES_SEED_DATA } from '../seed-data/operations/non-conformances.seed';
import { CHECKOUTS_SEED_DATA } from '../seed-data/operations/checkouts.seed';
import {
  CALIBRATION_PLANS_SEED_DATA,
  CALIBRATION_PLAN_ITEMS_SEED_DATA,
} from '../seed-data/calibration/calibration-plans.seed';
import { DISPOSAL_EQUIPMENT_SEED_DATA } from '../seed-data/disposal/disposal-equipment.seed';
import { TEST_SOFTWARE_SEED_DATA } from '../seed-data/software/test-software.seed';
import { LOCATION_HISTORY_SEED_DATA } from '../seed-data/history/location-history.seed';
import { MAINTENANCE_HISTORY_SEED_DATA } from '../seed-data/history/maintenance-history.seed';
import { INCIDENT_HISTORY_SEED_DATA } from '../seed-data/history/incident-history.seed';
import { EQUIPMENT_REQUESTS_SEED_DATA } from '../seed-data/admin/equipment-requests.seed';
import { EQUIPMENT_ATTACHMENTS_SEED_DATA } from '../seed-data/admin/equipment-attachments.seed';
import { AUDIT_LOGS_SEED_DATA } from '../seed-data/admin/audit-logs.seed';
import { NOTIFICATIONS_SEED_DATA } from '../seed-data/admin/notifications.seed';
import { REPAIR_HISTORY_SEED_DATA } from '../seed-data/operations/repair-history.seed';
import { CHECKOUT_ITEMS_SEED_DATA } from '../seed-data/operations/checkouts.seed';
import { CALIBRATION_FACTORS_SEED_DATA } from '../seed-data/calibration/calibration-factors.seed';
import { SOFTWARE_VALIDATIONS_SEED_DATA } from '../seed-data/software/software-validations.seed';
import { EQUIPMENT_TEST_SOFTWARE_SEED_DATA } from '../seed-data/software/equipment-test-software.seed';
import { DISPOSAL_REQUESTS_SEED_DATA } from '../seed-data/disposal/disposal-requests.seed';
import { EQUIPMENT_IMPORTS_SEED_DATA } from '../seed-data/operations/equipment-imports.seed';
import {
  INTERMEDIATE_INSPECTIONS_SEED_DATA,
  INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA,
  INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA,
  INSPECTION_RESULT_SECTIONS_SEED_DATA,
} from '../seed-data/operations/intermediate-inspections.seed';
import {
  SELF_INSPECTIONS_SEED_DATA,
  SELF_INSPECTION_ITEMS_SEED_DATA,
} from '../seed-data/operations/self-inspections.seed';

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
 * SSOT: seed array → expected count helper.
 *
 * Phase 0 에서 truncate 후 deterministic insert 되므로 DB count 는 seed length 와
 * **정확히** 일치해야 한다. `===` 비교로 검증하여 seed 외부에서 side-effect 로
 * 추가 row 가 생기는(예: DB trigger, 스케줄러 선행 실행) silent drift 를 즉시 노출.
 *
 * 의도적으로 ≥ 비교가 필요한 경우(예: seed-time 스케줄러 이벤트로 자연 증가)에는
 * `minOnly: true` 플래그를 지정한다.
 */
async function checkCount(
  pool: Pool,
  name: string,
  table: string,
  expected: number,
  whereClause = '',
  options: { minOnly?: boolean } = {}
): Promise<VerificationResult['checks'][number]> {
  const sql = `SELECT COUNT(*)::int AS count FROM ${table}${whereClause ? ` WHERE ${whereClause}` : ''}`;
  const res = await pool.query(sql);
  const actual = parseInt(res.rows[0]?.count ?? 0, 10);
  const passed = options.minOnly ? actual >= expected : actual === expected;
  return { name, passed, actual, expected };
}

/**
 * Verify all critical seed data requirements using seed-derived expected counts.
 */
export async function verifySeed(pool: Pool): Promise<VerificationResult> {
  const checks: VerificationResult['checks'] = [];

  try {
    // =========================================================================
    // Phase 1: Core Entity Counts (SSOT: seed.length)
    // =========================================================================

    checks.push(await checkCount(pool, 'Users count', 'users', USERS_SEED_DATA.length));
    checks.push(await checkCount(pool, 'Teams count', 'teams', TEAMS_SEED_DATA.length));

    // Equipment 는 두 시드(core + disposal)가 동일 테이블에 insert 됨
    const expectedEquipment = EQUIPMENT_SEED_DATA.length + DISPOSAL_EQUIPMENT_SEED_DATA.length;
    checks.push(await checkCount(pool, 'Equipment count', 'equipment', expectedEquipment));

    // =========================================================================
    // Phase 1: Equipment Status Distribution (필터별 최소 1건 — 시드 의도)
    // =========================================================================

    const statusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM equipment GROUP BY status'
    );
    const statusMap = new Map(statusResult.rows.map((r) => [r.status, parseInt(r.count, 10)]));

    const filterableStatuses = [
      'available',
      'checked_out',
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
    // Phase 1: Calibration Data (SSOT: seed array .length 및 filter)
    // =========================================================================

    checks.push(
      await checkCount(pool, 'Calibrations count', 'calibrations', CALIBRATIONS_SEED_DATA.length)
    );

    const expectedPendingCalibs = CALIBRATIONS_SEED_DATA.filter(
      (c) => c.approvalStatus === 'pending_approval'
    ).length;
    checks.push(
      await checkCount(
        pool,
        'Calibrations pending approval',
        'calibrations',
        expectedPendingCalibs,
        "approval_status = 'pending_approval'"
      )
    );

    // =========================================================================
    // Phase 1: Non-Conformances
    // =========================================================================

    checks.push(
      await checkCount(
        pool,
        'Non-conformances count',
        'non_conformances',
        NON_CONFORMANCES_SEED_DATA.length
      )
    );

    // =========================================================================
    // Phase 1B: Checkouts
    // =========================================================================

    checks.push(await checkCount(pool, 'Checkouts count', 'checkouts', CHECKOUTS_SEED_DATA.length));

    const expectedPendingCheckouts = CHECKOUTS_SEED_DATA.filter(
      (c) => c.status === 'pending'
    ).length;
    checks.push(
      await checkCount(
        pool,
        'Pending checkouts',
        'checkouts',
        expectedPendingCheckouts,
        "status = 'pending'"
      )
    );

    // =========================================================================
    // Phase 2: Calibration Plans (3-step approval)
    // =========================================================================

    checks.push(
      await checkCount(
        pool,
        'Calibration Plans count',
        'calibration_plans',
        CALIBRATION_PLANS_SEED_DATA.length
      )
    );

    // Status distribution: 워크플로우 상태별 최소 1건 (도메인 invariant)
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

    checks.push(
      await checkCount(
        pool,
        'Calibration Plan Items count',
        'calibration_plan_items',
        CALIBRATION_PLAN_ITEMS_SEED_DATA.length
      )
    );

    // =========================================================================
    // Phase 4: History & Admin
    // =========================================================================

    checks.push(
      await checkCount(pool, 'Test Software count', 'test_software', TEST_SOFTWARE_SEED_DATA.length)
    );

    checks.push(
      await checkCount(
        pool,
        'Location History count',
        'equipment_location_history',
        LOCATION_HISTORY_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Maintenance History count',
        'equipment_maintenance_history',
        MAINTENANCE_HISTORY_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Incident History count',
        'equipment_incident_history',
        INCIDENT_HISTORY_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Equipment Requests count',
        'equipment_requests',
        EQUIPMENT_REQUESTS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Equipment Attachments count',
        'equipment_attachments',
        EQUIPMENT_ATTACHMENTS_SEED_DATA.length
      )
    );

    // audit_logs 는 running backend(dev server, session refresh, OnEvent async 핸들러)와
    // 경합 가능 — seed insert 와 verification 사이에 login/activity 이벤트가 1건 끼어들 수
    // 있다. SSOT 원칙 유지를 위해 하한 체크로만 강제 (minOnly).
    checks.push(
      await checkCount(pool, 'Audit Logs count', 'audit_logs', AUDIT_LOGS_SEED_DATA.length, '', {
        minOnly: true,
      })
    );

    checks.push(
      await checkCount(pool, 'Notifications count', 'notifications', NOTIFICATIONS_SEED_DATA.length)
    );

    // =========================================================================
    // Phase 4B: Coverage gap fill (32차 verification.ts SSOT 후속)
    // =========================================================================

    checks.push(
      await checkCount(
        pool,
        'Repair History count',
        'repair_history',
        REPAIR_HISTORY_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Checkout Items count',
        'checkout_items',
        CHECKOUT_ITEMS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Calibration Factors count',
        'calibration_factors',
        CALIBRATION_FACTORS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Software Validations count',
        'software_validations',
        SOFTWARE_VALIDATIONS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Equipment Test Software count',
        'equipment_test_software',
        EQUIPMENT_TEST_SOFTWARE_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Disposal Requests count',
        'disposal_requests',
        DISPOSAL_REQUESTS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Equipment Imports count',
        'equipment_imports',
        EQUIPMENT_IMPORTS_SEED_DATA.length
      )
    );

    // =========================================================================
    // Intermediate Inspections (UL-QP-18-03) — 전 테이블 SSOT 검증
    // =========================================================================

    checks.push(
      await checkCount(
        pool,
        'Intermediate Inspections count',
        'intermediate_inspections',
        INTERMEDIATE_INSPECTIONS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Intermediate Inspection Items count',
        'intermediate_inspection_items',
        INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Intermediate Inspection Equipment count',
        'intermediate_inspection_equipment',
        INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Inspection Result Sections (intermediate) count',
        'inspection_result_sections',
        INSPECTION_RESULT_SECTIONS_SEED_DATA.length,
        "inspection_type = 'intermediate'"
      )
    );

    // =========================================================================
    // Self Inspections (UL-QP-18-05) — 전 테이블 SSOT 검증
    // =========================================================================

    checks.push(
      await checkCount(
        pool,
        'Self Inspections count',
        'equipment_self_inspections',
        SELF_INSPECTIONS_SEED_DATA.length
      )
    );

    checks.push(
      await checkCount(
        pool,
        'Self Inspection Items count',
        'self_inspection_items',
        SELF_INSPECTION_ITEMS_SEED_DATA.length
      )
    );

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
