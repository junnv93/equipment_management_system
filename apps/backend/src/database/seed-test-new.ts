/**
 * Comprehensive E2E Test Seed Data - Phase 1~4 (COMPLETE)
 * ======================================================
 *
 * Usage:
 *   pnpm --filter backend run db:seed
 *
 * Phase 1: Teams (7), Users (16), Equipment (32), Calibrations (18), NC (10)
 * Phase 2: Repair History (8), Calibration Factors (12), Checkouts (68), Cal Plans (6+12)
 * Phase 3: Disposal Equipment (21), Disposal Requests (15)
 * Phase 4: Software History (8), Location History (10), Maintenance History (10),
 *          Incident History (10), Equipment Requests (6), Attachments (6), Audit Logs (20)
 *
 * Total Records: ~300+
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Database schema
import * as schema from '@equipment-management/db/schema';

// Phase 1 seed data modules (IMPLEMENTED)
import { TEAMS_SEED_DATA } from './seed-data/core/teams.seed';
import { USERS_SEED_DATA } from './seed-data/core/users.seed';
import { EQUIPMENT_SEED_DATA } from './seed-data/core/equipment.seed';
import { CALIBRATIONS_SEED_DATA } from './seed-data/calibration/calibrations.seed';
import { NON_CONFORMANCES_SEED_DATA } from './seed-data/operations/non-conformances.seed';
// form_templates는 main.ts의 seedFromFilesystem이 docs/procedure/template/의 실제 파일로 시드함.
// placeholder seed는 다운로드 시 ENOENT를 일으키므로 제거됨.

// Phase 2 seed data modules (IMPLEMENTED)
import { REPAIR_HISTORY_SEED_DATA } from './seed-data/operations/repair-history.seed';
import { CALIBRATION_FACTORS_SEED_DATA } from './seed-data/calibration/calibration-factors.seed';
import {
  CHECKOUTS_SEED_DATA,
  CHECKOUT_ITEMS_SEED_DATA,
} from './seed-data/operations/checkouts.seed';

// Phase 2 seed data modules
import {
  CALIBRATION_PLANS_SEED_DATA,
  CALIBRATION_PLAN_ITEMS_SEED_DATA,
} from './seed-data/calibration/calibration-plans.seed';

// Phase 3 seed data modules (Disposal E2E tests)
import { DISPOSAL_EQUIPMENT_SEED_DATA } from './seed-data/disposal/disposal-equipment.seed';
import { DISPOSAL_REQUESTS_SEED_DATA } from './seed-data/disposal/disposal-requests.seed';

// Phase 4 seed data modules (History & Admin)
import { LOCATION_HISTORY_SEED_DATA } from './seed-data/history/location-history.seed';
import { MAINTENANCE_HISTORY_SEED_DATA } from './seed-data/history/maintenance-history.seed';
import { INCIDENT_HISTORY_SEED_DATA } from './seed-data/history/incident-history.seed';
// Test Software (UL-QP-18-07 관리대장) seed data
import { TEST_SOFTWARE_SEED_DATA } from './seed-data/software/test-software.seed';
// Software Validations (UL-QP-18-09) seed data
import { SOFTWARE_VALIDATIONS_SEED_DATA } from './seed-data/software/software-validations.seed';
// Equipment ↔ Test Software M:N links
import { EQUIPMENT_TEST_SOFTWARE_SEED_DATA } from './seed-data/software/equipment-test-software.seed';
import { EQUIPMENT_REQUESTS_SEED_DATA } from './seed-data/admin/equipment-requests.seed';
import { EQUIPMENT_ATTACHMENTS_SEED_DATA } from './seed-data/admin/equipment-attachments.seed';
import { AUDIT_LOGS_SEED_DATA } from './seed-data/admin/audit-logs.seed';

// Utilities
import { verifySeed, printVerificationResults } from './utils/verification';

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';

console.log('\n🌱 E2E TEST SEED DATA GENERATION');
console.log('='.repeat(80));
console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

// =============================================================================
// MAIN SEED EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(pool, { schema });

  try {
    // =========================================================================
    // PHASE 0: CLEANUP (Delete in reverse dependency order)
    // =========================================================================
    console.log('\n🧹 Phase 0: Cleaning up existing data...');

    const tables = [
      'audit_logs',
      'equipment_attachments',
      'equipment_requests',
      'disposal_requests',
      'equipment_incident_history',
      'equipment_maintenance_history',
      'equipment_location_history',
      'equipment_test_software',
      'software_validations',
      'test_software',
      'calibration_factors',
      'repair_history',
      'non_conformances',
      'form_templates',
      'checkout_items',
      'checkouts',
      'calibration_plan_items',
      'calibration_plans',
      'calibrations',
      'equipment',
      'users',
      'teams',
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        console.log(`✓ ${table}`);
      } catch (err: unknown) {
        // Check for PostgreSQL error code 42P01 (relation does not exist)
        // Error can be in err.code or err.cause.code (Drizzle wraps errors)
        const e = err as Record<string, unknown>;
        const cause = e.cause as Record<string, unknown> | undefined;
        const errorCode = e.code || cause?.code;
        const errorMsg =
          (e.message as string | undefined) || (cause?.message as string | undefined) || '';
        if (errorCode === '42P01' || errorMsg.includes('does not exist')) {
          console.log(`⊗ ${table} (not yet created)`);
        } else {
          throw err;
        }
      }
    }

    // =========================================================================
    // PHASE 1: CORE ENTITIES (No dependencies)
    // =========================================================================
    console.log('\n📋 Phase 1: Inserting core entities...');

    // Teams
    console.log(`  → Teams (${TEAMS_SEED_DATA.length})`);
    await db.insert(schema.teams).values(TEAMS_SEED_DATA);

    // Users
    console.log(`  → Users (${USERS_SEED_DATA.length})`);
    await db.insert(schema.users).values(USERS_SEED_DATA);

    // Equipment (32 records)
    console.log('  → Equipment (32)');
    await db.insert(schema.equipment).values(EQUIPMENT_SEED_DATA);

    // =========================================================================
    // PHASE 1B: CALIBRATIONS & PLANS
    // =========================================================================
    console.log('\n📋 Phase 1B: Inserting calibrations & plans...');

    // Calibrations (18 records)
    console.log('  → Calibrations (18)');
    await db.insert(schema.calibrations).values(CALIBRATIONS_SEED_DATA);

    // =========================================================================
    // PHASE 1B: OPERATIONS
    // =========================================================================
    console.log('\n📋 Phase 1B: Inserting operations...');

    // Non-Conformances (10)
    console.log('  → Non-Conformances (10)');
    await db.insert(schema.nonConformances).values(NON_CONFORMANCES_SEED_DATA);

    // Form Templates: main.ts:158 seedFromFilesystem이 백엔드 부팅 시 docs/procedure/template/의
    // 실제 파일로 시드함. placeholder seed는 다운로드 시 ENOENT를 일으켜 제거됨.

    // Calibration Plans & Items (6 plans + 12 items)
    console.log('  → Calibration Plans (6)');
    await db.insert(schema.calibrationPlans).values(CALIBRATION_PLANS_SEED_DATA);
    console.log('  → Calibration Plan Items (12)');
    await db.insert(schema.calibrationPlanItems).values(CALIBRATION_PLAN_ITEMS_SEED_DATA);

    // Checkouts & Items (68 checkouts + items)
    console.log('  → Checkouts (68)');
    await db.insert(schema.checkouts).values(CHECKOUTS_SEED_DATA);
    console.log('  → Checkout Items (equipment associations)');
    await db.insert(schema.checkoutItems).values(CHECKOUT_ITEMS_SEED_DATA);

    // ✅ equipment.status 동기화 — checkout.status='checked_out'인 장비의 equipment.status도 'checked_out'으로 설정
    // 런타임에는 CheckoutsService.startCheckout()이 이 동기화를 수행하지만, 시드 데이터는 직접 INSERT하므로 별도 동기화 필요
    console.log('  → Equipment status sync (checkout → equipment)');
    const syncResult = await pool.query(`
      UPDATE equipment
      SET status = 'checked_out', updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT ci.equipment_id
        FROM checkout_items ci
        JOIN checkouts c ON ci.checkout_id = c.id
        WHERE c.status = 'checked_out'
      )
      AND status != 'checked_out'
    `);
    console.log(`    ✅ ${syncResult.rowCount}건 장비 상태 동기화됨`);

    // =========================================================================
    // PHASE 2: EXTENDED ENTITIES (Partially Implemented)
    // =========================================================================
    console.log('\n📋 Phase 2: Inserting extended entities...');

    // Repair History (8)
    console.log('  → Repair History (8)');
    await db.insert(schema.repairHistory).values(REPAIR_HISTORY_SEED_DATA);

    // Calibration Factors (12)
    console.log('  → Calibration Factors (12)');
    await db.insert(schema.calibrationFactors).values(CALIBRATION_FACTORS_SEED_DATA);

    // Test Software — UL-QP-18-07 관리대장
    console.log(`  → Test Software (${TEST_SOFTWARE_SEED_DATA.length})`);
    await db.insert(schema.testSoftware).values(TEST_SOFTWARE_SEED_DATA);

    // Software Validations — UL-QP-18-09 유효성 확인
    console.log(`  → Software Validations (${SOFTWARE_VALIDATIONS_SEED_DATA.length})`);
    await db.insert(schema.softwareValidations).values(SOFTWARE_VALIDATIONS_SEED_DATA);

    // Equipment ↔ Test Software M:N links
    console.log(
      `  → Equipment ↔ Test Software Links (${EQUIPMENT_TEST_SOFTWARE_SEED_DATA.length})`
    );
    await db.insert(schema.equipmentTestSoftware).values(EQUIPMENT_TEST_SOFTWARE_SEED_DATA);

    // =========================================================================
    // PHASE 3: DISPOSAL WORKFLOW E2E TEST DATA
    // =========================================================================
    console.log('\n📋 Phase 3: Inserting disposal workflow E2E test data...');

    // Disposal Equipment (21)
    console.log('  → Disposal Equipment (21)');
    await db.insert(schema.equipment).values(DISPOSAL_EQUIPMENT_SEED_DATA);

    // Disposal Requests (15)
    console.log('  → Disposal Requests (15)');
    await db.insert(schema.disposalRequests).values(DISPOSAL_REQUESTS_SEED_DATA);

    // =========================================================================
    // PHASE 4: HISTORY & ADMIN
    // =========================================================================
    console.log('\n📋 Phase 4: Inserting history & administrative data...');

    // Phase 4 각 항목은 스키마 미동기화 시에도 나머지가 실행되도록 try-catch
    const phase4Items: Array<{ label: string; fn: () => Promise<void> }> = [
      {
        label: `Equipment Location History (${LOCATION_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentLocationHistory)
            .values(LOCATION_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Maintenance History (${MAINTENANCE_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentMaintenanceHistory)
            .values(MAINTENANCE_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Incident History (${INCIDENT_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentIncidentHistory)
            .values(INCIDENT_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Requests (${EQUIPMENT_REQUESTS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentRequests)
            .values(EQUIPMENT_REQUESTS_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Attachments (${EQUIPMENT_ATTACHMENTS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentAttachments)
            .values(EQUIPMENT_ATTACHMENTS_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Audit Logs (${AUDIT_LOGS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.auditLogs)
            .values(AUDIT_LOGS_SEED_DATA)
            .then(() => {}),
      },
    ];

    for (const item of phase4Items) {
      try {
        console.log(`  → ${item.label}`);
        await item.fn();
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        const cause = e.cause as Record<string, unknown> | undefined;
        const errorCode = e.code || cause?.code;
        const errorMsg =
          (e.message as string | undefined) || (cause?.message as string | undefined) || '';
        if (errorCode === '42P01' || errorCode === '42703' || errorMsg.includes('does not exist')) {
          console.warn(
            `  ⚠️ ${item.label} skipped (schema drift) — run "pnpm --filter backend run db:migrate"`
          );
        } else {
          console.error(`  ❌ ${item.label} FAILED: ${errorMsg.slice(0, 200)}`);
        }
      }
    }

    // =========================================================================
    // POST PHASE 4: SSOT — equipment.location ← latest location history
    // =========================================================================
    console.log('\n🔄 Post Phase 4: Syncing equipment.location from location history (SSOT)...');
    try {
      const locationSyncResult = await db.execute(sql`
        UPDATE equipment e
        SET location = sub.new_location,
            updated_at = NOW()
        FROM (
          SELECT DISTINCT ON (equipment_id)
            equipment_id,
            new_location
          FROM equipment_location_history
          ORDER BY equipment_id, changed_at DESC, created_at DESC
        ) sub
        WHERE e.id = sub.equipment_id
          AND (e.location IS DISTINCT FROM sub.new_location)
      `);
      const syncCount = (locationSyncResult as { rowCount?: number }).rowCount ?? 0;
      console.log(`  ✅ ${syncCount}건 장비 위치 동기화됨 (location history → equipment.location)`);
    } catch (err) {
      console.warn(
        `  ⚠️ Location SSOT sync skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // POST PHASE 4: i18n 키 미번역 데이터 수정
    // =========================================================================
    // 스케줄러(onModuleInit)가 i18n 로딩 전에 실행되어 키 원문이 DB에 저장된 경우 수정
    console.log('\n🌐 Post Phase 4: Fixing i18n raw keys in DB...');
    try {
      // equipment_incident_history.content
      const incidentFix = await db.execute(sql`
        UPDATE equipment_incident_history
        SET content = '교정 기한 초과로 인한 자동 부적합 전환'
        WHERE content LIKE '%system.calibrationOverdue.incidentContent%'
      `);
      // non_conformances.cause
      const causeFix = await db.execute(sql`
        UPDATE non_conformances
        SET cause = '교정 기한 초과 (다음 교정일: ' ||
          COALESCE(
            (SELECT to_char(e.next_calibration_date, 'YYYY-MM-DD')
             FROM equipment e WHERE e.id = non_conformances.equipment_id),
            '미정'
          ) || ')'
        WHERE cause LIKE '%system.calibrationOverdue.ncCause%'
      `);
      // non_conformances.action_plan
      const planFix = await db.execute(sql`
        UPDATE non_conformances
        SET action_plan = '교정 수행 필요'
        WHERE action_plan LIKE '%system.calibrationOverdue.defaultActionPlan%'
      `);
      const totalFixed =
        ((incidentFix as { rowCount?: number }).rowCount ?? 0) +
        ((causeFix as { rowCount?: number }).rowCount ?? 0) +
        ((planFix as { rowCount?: number }).rowCount ?? 0);
      if (totalFixed > 0) {
        console.log(`  ✅ ${totalFixed}건 i18n 키 → 한국어 번역 수정됨`);
      } else {
        console.log('  ✅ i18n 미번역 데이터 없음');
      }
    } catch (err) {
      console.warn(
        `  ⚠️ i18n fix skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // POST PHASE 4: equipment_attachments → documents 테이블 동기화
    // =========================================================================
    // 프론트엔드 AttachmentsTab은 documents 테이블을 쿼리함 (equipment_attachments는 deprecated)
    console.log('\n📄 Post Phase 4: Syncing equipment_attachments → documents table...');
    try {
      const docSyncResult = await db.execute(sql`
        INSERT INTO documents (
          equipment_id, request_id, document_type, status,
          file_name, original_file_name, file_path, file_size, mime_type,
          description, revision_number, is_latest, uploaded_at, created_at, updated_at
        )
        SELECT
          ea.equipment_id, ea.request_id,
          ea.attachment_type::text,
          'active',
          ea.file_name, ea.original_file_name, ea.file_path, ea.file_size, ea.mime_type,
          ea.description, 1, true, ea.uploaded_at,
          COALESCE(ea.created_at, NOW()), COALESCE(ea.updated_at, NOW())
        FROM equipment_attachments ea
        WHERE NOT EXISTS (
          SELECT 1 FROM documents d
          WHERE d.file_path = ea.file_path
            AND d.original_file_name = ea.original_file_name
        )
          AND (ea.equipment_id IS NULL OR ea.equipment_id IN (SELECT id FROM equipment))
          AND (ea.request_id IS NULL OR ea.request_id IN (SELECT id FROM equipment_requests))
      `);
      const docSyncCount = (docSyncResult as { rowCount?: number }).rowCount ?? 0;
      console.log(`  ✅ ${docSyncCount}건 문서 동기화됨 (equipment_attachments → documents)`);
    } catch (err) {
      console.warn(
        `  ⚠️ Document sync skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // VERIFICATION
    // =========================================================================
    console.log('\n🔍 Verifying seed data...');
    const result = await verifySeed(pool);
    printVerificationResults(result);

    if (result.passed) {
      console.log('✅ SEED DATA GENERATION COMPLETE!\n');
      await pool.end();
      process.exit(0);
    } else {
      console.log('❌ SEED DATA VERIFICATION FAILED\n');
      await pool.end();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR DURING SEEDING:');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// Run main
main();
