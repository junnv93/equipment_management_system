/**
 * Test Equipment IDs for E2E Tests
 *
 * SSOT: These constants must match apps/backend/src/database/utils/uuid-constants.ts
 * These IDs are created by seed script and used across E2E tests
 *
 * @see apps/backend/src/database/utils/uuid-constants.ts - Source of truth
 * @see apps/backend/src/database/seed-test-new.ts - Seed script that creates these
 */

// Suwon equipment (FCC EMC/RF - E)
export const EQUIP_SPECTRUM_ANALYZER_SUW_E_ID = 'eeee1001-0001-4001-8001-000000000001'; // available
export const EQUIP_SIGNAL_GEN_SUW_E_ID = 'eeee1002-0002-4002-8002-000000000002'; // available
export const EQUIP_NETWORK_ANALYZER_SUW_E_ID = 'eeee1003-0003-4003-8003-000000000003'; // available
export const EQUIP_POWER_METER_SUW_E_ID = 'eeee1004-0004-4004-8004-000000000004'; // non_conforming

// Suwon accessories (A)
export const EQUIP_HARNESS_COUPLER_SUW_A_ID = 'eeee4001-0001-4001-8001-000000000001'; // available

// Suwon rental (R)
export const EQUIP_OSCILLOSCOPE_SUW_R_ID = 'eeee2001-0001-4001-8001-000000000001'; // available

// Add more equipment IDs as needed from uuid-constants.ts
