/**
 * Checkout Test Constants - Suite-Specific ID Allocation
 *
 * Each suite has its own dedicated checkout IDs to prevent cross-suite interference.
 * IDs reference seed data from: apps/backend/src/database/seed-data/operations/checkouts.seed.ts
 *
 * @see apps/frontend/tests/e2e/shared/constants/test-checkout-ids.ts - ID definitions
 */

import {
  CHECKOUT_001_ID,
  CHECKOUT_002_ID,
  CHECKOUT_003_ID,
  CHECKOUT_004_ID,
  CHECKOUT_005_ID,
  CHECKOUT_006_ID,
  CHECKOUT_007_ID,
  CHECKOUT_008_ID,
  CHECKOUT_009_ID,
  CHECKOUT_010_ID,
  CHECKOUT_012_ID,
  CHECKOUT_014_ID,
  CHECKOUT_015_ID,
  CHECKOUT_017_ID,
  CHECKOUT_019_ID,
  CHECKOUT_020_ID,
  CHECKOUT_021_ID,
  CHECKOUT_022_ID,
  CHECKOUT_027_ID,
  CHECKOUT_028_ID,
  CHECKOUT_030_ID,
  CHECKOUT_033_ID,
  CHECKOUT_036_ID,
  CHECKOUT_042_ID,
  CHECKOUT_043_ID,
  CHECKOUT_044_ID,
  CHECKOUT_050_ID,
  CHECKOUT_056_ID,
  CHECKOUT_059_ID,
  CHECKOUT_062_ID,
} from '../../../shared/constants/test-checkout-ids';

import { TEST_EQUIPMENT_IDS, TEST_USER_IDS } from '../../../shared/constants/shared-test-data';

// ============================================================================
// Suite 01: Read-Only (parallel) - 기존 시드 데이터 조회만
// ============================================================================
export const SUITE_01 = {
  RETURN_APPROVED: CHECKOUT_050_ID,
  REJECTED: CHECKOUT_017_ID,
  OVERDUE: CHECKOUT_059_ID,
  CANCELED: CHECKOUT_062_ID,
} as const;

// ============================================================================
// Suite 03: Approval (serial) - pending → approved
// ============================================================================
export const SUITE_03 = {
  CALIBRATION: CHECKOUT_001_ID, // pending - calibration
  REPAIR: CHECKOUT_003_ID, // pending - repair
  RENTAL: CHECKOUT_005_ID, // pending - rental
  PERSISTENCE: CHECKOUT_002_ID, // pending - calibration (for refresh check)
} as const;

// ============================================================================
// Suite 04: Rejection (serial) - pending → rejected
// ============================================================================
export const SUITE_04 = {
  CALIBRATION: CHECKOUT_004_ID, // pending - repair (for rejection)
  REPAIR: CHECKOUT_006_ID, // pending - rental (for rejection)
  EMPTY_REASON: CHECKOUT_007_ID, // pending - multi (empty reason test)
  RENTAL: CHECKOUT_008_ID, // pending - multi (rental rejection)
} as const;

// ============================================================================
// Suite 05: Start (serial) - approved → checked_out
// ============================================================================
export const SUITE_05 = {
  APPROVED_CAL: CHECKOUT_009_ID, // approved - calibration
  PENDING_BLOCK: CHECKOUT_056_ID, // overdue pending (NOT approved → blocked)
  APPROVED_MULTI: CHECKOUT_010_ID, // approved - repair
} as const;

// ============================================================================
// Suite 06: Return (serial) - checked_out → returned
// ============================================================================
export const SUITE_06 = {
  CALIBRATION: CHECKOUT_019_ID, // checked_out - calibration
  REPAIR: CHECKOUT_022_ID, // checked_out - repair (fixed: 020 was calibration, not repair)
  MISSING_CHECK: CHECKOUT_021_ID, // checked_out - calibration (missing check test)
  WRONG_STATUS: CHECKOUT_015_ID, // rejected (cannot return → API 400)
} as const;

// ============================================================================
// Suite 07: Return Approval (serial) - returned → return_approved
// ============================================================================
export const SUITE_07 = {
  CALIBRATION: CHECKOUT_042_ID, // returned - calibration
  WRONG_STATUS: CHECKOUT_012_ID, // approved (cannot approve return → API 400)
  MULTI: CHECKOUT_044_ID, // returned - calibration (multi)
} as const;

// ============================================================================
// Suite 10: Rental 4-Step (serial) - condition check API transitions
// ============================================================================
export const SUITE_10 = {
  STEP1_LENDER: CHECKOUT_014_ID, // approved - rental → lender_checked
  STEP2_BORROWER: CHECKOUT_027_ID, // lender_checked → in_use
  STEP3_RETURN: CHECKOUT_033_ID, // in_use → borrower_returned
  STEP4_FINAL: CHECKOUT_036_ID, // borrower_returned → lender_received
  ORDER_VIOLATION: CHECKOUT_028_ID, // rental (reset to approved, skip step test)
  HISTORY: CHECKOUT_030_ID, // borrower_received (has existing checks)
} as const;

// ============================================================================
// Shared Equipment IDs
// ============================================================================
export const EQUIP = TEST_EQUIPMENT_IDS;

// ============================================================================
// Shared User IDs
// ============================================================================
export const USERS = TEST_USER_IDS;

// ============================================================================
// Backend API Base URL
// ============================================================================
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
