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
import { SOFTWARE_HISTORY_SEED_DATA } from './seed-data/history/software-history.seed';
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
      'software_history',
      'calibration_factors',
      'repair_history',
      'non_conformances',
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

    // Software History (8)
    console.log('  → Software History (8)');
    await db.insert(schema.softwareHistory).values(SOFTWARE_HISTORY_SEED_DATA);

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
