/**
 * Shared Test Data Constants for E2E Tests
 *
 * SSOT for all test IDs, timeouts, and URLs used across E2E tests.
 * All constants here must match the backend seed data.
 *
 * @see apps/backend/src/database/utils/uuid-constants.ts - Backend source of truth
 * @see apps/backend/src/database/seed-test-new.ts - Seed script
 */

// =============================================================================
// Equipment IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_EQUIPMENT_IDS = {
  // Suwon (FCC EMC/RF - E)
  SPECTRUM_ANALYZER_SUW_E: 'eeee1001-0001-4001-8001-000000000001', // available
  SIGNAL_GEN_SUW_E: 'eeee1002-0002-4002-8002-000000000002', // available
  NETWORK_ANALYZER_SUW_E: 'eeee1003-0003-4003-8003-000000000003', // available
  POWER_METER_SUW_E: 'eeee1004-0004-4004-8004-000000000004', // non_conforming
  EMC_RECEIVER_SUW_E: 'eeee1005-0005-4005-8005-000000000005', // in_use
  FILTER_SUW_E: 'eeee1006-0006-4006-8006-000000000006', // spare
  ANTENNA_1_SUW_E: 'eeee1007-0007-4007-8007-000000000007', // checked_out
  COUPLER_SUW_E: 'eeee1008-0008-4008-8008-000000000008', // calibration_overdue

  // Suwon (General EMC - R)
  OSCILLOSCOPE_SUW_R: 'eeee2001-0001-4001-8001-000000000001', // available (overdue)
  POWER_SUPPLY_SUW_R: 'eeee2002-0002-4002-8002-000000000002', // available (due soon)

  // Suwon (SAR - S)
  SAR_PROBE_SUW_S: 'eeee3001-0001-4001-8001-000000000001', // available

  // Suwon (Automotive EMC - A)
  HARNESS_COUPLER_SUW_A: 'eeee4001-0001-4001-8001-000000000001', // available

  // Uiwang (General RF - W)
  RECEIVER_UIW_W: 'eeee5001-0001-4001-8001-000000000001', // available
  TRANSMITTER_UIW_W: 'eeee5002-0002-4002-8002-000000000002', // available

  // Pyeongtaek (Automotive EMC - A)
  TEST_HARNESS_PYT_A: 'eeee6001-0001-4001-8001-000000000001', // available

  // Convenience aliases for race condition tests (using available equipment)
  EQUIPMENT_1: 'eeee1001-0001-4001-8001-000000000001', // SPECTRUM_ANALYZER_SUW_E (available)
  EQUIPMENT_2: 'eeee1002-0002-4002-8002-000000000002', // SIGNAL_GEN_SUW_E (available)
  EQUIPMENT_3: 'eeee1003-0003-4003-8003-000000000003', // NETWORK_ANALYZER_SUW_E (available)
  EQUIPMENT_4: 'eeee3001-0001-4001-8001-000000000001', // SAR_PROBE_SUW_S (available)
  EQUIPMENT_5: 'eeee4001-0001-4001-8001-000000000001', // HARNESS_COUPLER_SUW_A (available)
  EQUIPMENT_6: 'eeee5001-0001-4001-8001-000000000001', // RECEIVER_UIW_W (available)
  EQUIPMENT_7: 'eeee5002-0002-4002-8002-000000000002', // TRANSMITTER_UIW_W (available)
} as const;

// =============================================================================
// User IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_USER_IDS = {
  // Suwon FCC EMC/RF (5 users)
  TEST_ENGINEER_SUWON: '00000000-0000-0000-0000-000000000001',
  TECHNICAL_MANAGER_SUWON: '00000000-0000-0000-0000-000000000002',
  LAB_MANAGER_SUWON: '00000000-0000-0000-0000-000000000003',
  SYSTEM_ADMIN: '00000000-0000-0000-0000-000000000004',
  QUALITY_MANAGER_SUWON: '00000000-0000-0000-0000-000000000005',

  // Suwon General EMC (2 users)
  TEST_ENGINEER_SUWON_GENERAL_EMC: '00000000-0000-0000-0000-000000000009',
  TECHNICAL_MANAGER_SUWON_GENERAL_EMC: '00000000-0000-0000-0000-00000000000a',

  // Suwon SAR (2 users)
  TEST_ENGINEER_SUWON_SAR: '00000000-0000-0000-0000-00000000000b',
  TECHNICAL_MANAGER_SUWON_SAR: '00000000-0000-0000-0000-00000000000c',

  // Uiwang General RF (2 users)
  TECHNICAL_MANAGER_UIWANG: 'f47ac10b-58cc-4372-a567-0e02b2c3d478',
  TEST_ENGINEER_UIWANG: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',

  // Pyeongtaek Automotive EMC (3 users)
  LAB_MANAGER_PYEONGTAEK: 'cccccccc-dddd-eeee-ffff-000000000000',
  TEST_ENGINEER_PYEONGTAEK: '00000000-0000-0000-0000-000000000013',
  TECHNICAL_MANAGER_PYEONGTAEK: '00000000-0000-0000-0000-000000000014',
} as const;

// =============================================================================
// User Emails (for test-login)
// =============================================================================

export const TEST_USER_EMAILS = {
  // Suwon FCC EMC/RF
  TEST_ENGINEER_SUWON: 'test.engineer@example.com',
  TECHNICAL_MANAGER_SUWON: 'tech.manager@example.com',
  LAB_MANAGER_SUWON: 'lab.manager@example.com',
  QUALITY_MANAGER_SUWON: 'quality.manager@example.com',
  SYSTEM_ADMIN: 'system.admin@example.com',

  // Suwon General EMC
  TEST_ENGINEER_SUWON_GENERAL_EMC: 'test.engineer.suwon.general.emc@example.com',
  TECHNICAL_MANAGER_SUWON_GENERAL_EMC: 'tech.manager.suwon.general.emc@example.com',

  // Suwon SAR
  TEST_ENGINEER_SUWON_SAR: 'test.engineer.suwon.sar@example.com',
  TECHNICAL_MANAGER_SUWON_SAR: 'tech.manager.suwon.sar@example.com',

  // Uiwang General RF
  TEST_ENGINEER_UIWANG: 'user1@example.com',
  TECHNICAL_MANAGER_UIWANG: 'manager2@example.com',

  // Pyeongtaek Automotive EMC
  LAB_MANAGER_PYEONGTAEK: 'admin2@example.com',
  TEST_ENGINEER_PYEONGTAEK: 'test.engineer.pyeongtaek@example.com',
  TECHNICAL_MANAGER_PYEONGTAEK: 'tech.manager.pyeongtaek@example.com',
} as const;

// =============================================================================
// Non-Conformance IDs
// =============================================================================

export const TEST_NC_IDS = {
  NC_001_MALFUNCTION_OPEN: 'aaaa0001-0001-0001-0001-000000000001',
  NC_002_ANALYZING_NO_REPAIR: 'aaaa0002-0002-0002-0002-000000000002',
  NC_003_DAMAGE_ANALYZING: 'aaaa0003-0003-0003-0003-000000000003',
  NC_004_CLOSED: 'aaaa0004-0004-0004-0004-000000000004',
  NC_006_WITH_REPAIR: 'aaaa0006-0006-0006-0006-000000000006',
  NC_007_DAMAGE_CORRECTED: 'aaaa0007-0007-0007-0007-000000000007',
} as const;

// =============================================================================
// Timeouts (milliseconds)
// =============================================================================

export const TEST_TIMEOUTS = {
  DIALOG_ANIMATION: 500,
  UI_UPDATE: 1000,
  API_RESPONSE: 5000,
  NAVIGATION: 10000,
  CACHE_INVALIDATION: 3000,
  PAGE_LOAD: 15000,
  HYDRATION_CHECK: 3000,
} as const;

// =============================================================================
// Base URLs
// =============================================================================

export const BASE_URLS = {
  FRONTEND: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  BACKEND: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;
