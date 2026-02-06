/**
 * Comprehensive E2E Test Seed Data - Phase 1 & 2 (WORKING)
 * ======================================================
 *
 * Seed script for database tables covering Phase 1 & most of Phase 2
 *
 * Usage:
 *   DATABASE_URL=... pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
 *
 * Phase 1 Coverage (Complete):
 * - Teams (6), Users (8), Equipment (32)
 * - Calibrations (18), Non-Conformances (10)
 *
 * Phase 2 Coverage (Implemented):
 * - Repair History (8), Calibration Factors (12)
 *
 * Phase 3: Stubbed for future implementation
 *
 * Total Records: ~150+
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

// Phase 2 seed data modules (STUBBED)
// import { CALIBRATION_PLANS_SEED_DATA, CALIBRATION_PLAN_ITEMS_SEED_DATA } from './seed-data/calibration/calibration-plans.seed';

// Phase 3 seed data modules (Disposal E2E tests)
import { DISPOSAL_EQUIPMENT_SEED_DATA } from './seed-data/disposal/disposal-equipment.seed';
import { DISPOSAL_REQUESTS_SEED_DATA } from './seed-data/disposal/disposal-requests.seed';

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
      } catch (err: any) {
        if (err.message.includes('does not exist')) {
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

    // Teams (6 records)
    console.log('  → Teams (6)');
    await db.insert(schema.teams).values(TEAMS_SEED_DATA);

    // Users (8 records)
    console.log('  → Users (8)');
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

    // Calibration Plans & Items (STUBBED - Phase 2)
    // TODO: Implement calibration plans seed data

    // Checkouts & Items (68 checkouts + items)
    console.log('  → Checkouts (68)');
    await db.insert(schema.checkouts).values(CHECKOUTS_SEED_DATA);
    console.log('  → Checkout Items (equipment associations)');
    await db.insert(schema.checkoutItems).values(CHECKOUT_ITEMS_SEED_DATA);

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

    // TODO: Implement software history (8)

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
    // PHASE 4: HISTORY & ADMIN (STUBBED)
    // =========================================================================
    // console.log('\n📋 Phase 4: Inserting history & administrative data...');
    // TODO: Implement location history (20)
    // TODO: Implement maintenance history (15)
    // TODO: Implement incident history (15)
    // TODO: Implement equipment requests (6)
    // TODO: Implement equipment attachments (8)
    // TODO: Implement audit logs (30)

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
