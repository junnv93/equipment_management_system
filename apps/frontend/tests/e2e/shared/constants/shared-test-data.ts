/**
 * Shared Test Data Constants for E2E Tests
 *
 * SSOT for all test IDs, timeouts, and URLs used across E2E tests.
 * All constants here must match the backend seed data.
 *
 * @see apps/backend/src/database/utils/uuid-constants.ts - Backend source of truth
 * @see apps/backend/src/database/seed-test-new.ts - Seed script
 * @see packages/shared-constants/src/test-users.ts - Test user email SSOT
 */

import { TEST_USERS_BY_TEAM } from '@equipment-management/shared-constants';

// =============================================================================
// Equipment IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_EQUIPMENT_IDS = {
  // Suwon (FCC EMC/RF - E)
  SPECTRUM_ANALYZER_SUW_E: 'eeee1001-0001-4001-8001-000000000001', // available
  SIGNAL_GEN_SUW_E: 'eeee1002-0002-4002-8002-000000000002', // available
  NETWORK_ANALYZER_SUW_E: 'eeee1003-0003-4003-8003-000000000003', // available
  POWER_METER_SUW_E: 'eeee1004-0004-4004-8004-000000000004', // non_conforming
  EMC_RECEIVER_SUW_E: 'eeee1005-0005-4005-8005-000000000005', // available
  FILTER_SUW_E: 'eeee1006-0006-4006-8006-000000000006', // spare
  ANTENNA_1_SUW_E: 'eeee1007-0007-4007-8007-000000000007', // checked_out
  COUPLER_SUW_E: 'eeee1008-0008-4008-8008-000000000008', // calibration_overdue

  // Suwon (General EMC - R)
  OSCILLOSCOPE_SUW_R: 'eeee2001-0001-4001-8001-000000000001', // available (overdue)
  POWER_SUPPLY_SUW_R: 'eeee2002-0002-4002-8002-000000000002', // available (due soon)
  MULTIMETER_SUW_R: 'eeee2003-0003-4003-8003-000000000003', // available (TE 팀)

  // Suwon (SAR - S)
  SAR_PROBE_SUW_S: 'eeee3001-0001-4001-8001-000000000001', // available

  // Suwon (Automotive EMC - A)
  HARNESS_COUPLER_SUW_A: 'eeee4001-0001-4001-8001-000000000001', // available
  CURRENT_PROBE_SUW_A: 'eeee4002-0002-4002-8002-000000000002', // available
  BCI_SUW_A: 'eeee4004-0004-4004-8004-000000000004', // non_conforming

  // Uiwang (General RF - W)
  RECEIVER_UIW_W: 'eeee5001-0001-4001-8001-000000000001', // available
  TRANSMITTER_UIW_W: 'eeee5002-0002-4002-8002-000000000002', // available

  // Pyeongtaek (Automotive EMC - A)
  TEST_HARNESS_PYT_A: 'eeee6001-0001-4001-8001-000000000001', // available

  // Suwon (Software - P) — calibrationRequired: 'not_required'
  EMC32_SOFTWARE_SUW_P: 'eeee7001-0001-4001-8001-000000000001', // available, non-calibrated
  DASY6_SOFTWARE_SUW_P: 'eeee7002-0002-4002-8002-000000000002', // available, non-calibrated

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

  // Suwon Automotive EMC (2 users)
  TEST_ENGINEER_SUWON_AUTO_EMC: '00000000-0000-0000-0000-00000000000d',
  TECHNICAL_MANAGER_SUWON_AUTO_EMC: '00000000-0000-0000-0000-00000000000e',

  // Uiwang General RF (2 users)
  TECHNICAL_MANAGER_UIWANG: 'f47ac10b-58cc-4372-a567-0e02b2c3d478',
  TEST_ENGINEER_UIWANG: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',

  // Pyeongtaek Automotive EMC (3 users)
  LAB_MANAGER_PYEONGTAEK: 'cccccccc-dddd-eeee-ffff-000000000000',
  TEST_ENGINEER_PYEONGTAEK: '00000000-0000-0000-0000-000000000013',
  TECHNICAL_MANAGER_PYEONGTAEK: '00000000-0000-0000-0000-000000000014',
} as const;

// =============================================================================
// User Emails — SSOT: @equipment-management/shared-constants/test-users.ts
// =============================================================================

/** 팀 키 + 역할로 이메일을 안전하게 조회 (인덱스 의존 없음) */
function emailOf(teamKey: string, role: string): string {
  const user = TEST_USERS_BY_TEAM[teamKey]?.users.find((u) => u.role === role);
  if (!user) throw new Error(`Test user not found: ${teamKey}/${role}`);
  return user.email;
}

export const TEST_USER_EMAILS = {
  // Suwon FCC EMC/RF
  TEST_ENGINEER_SUWON: emailOf('suwon-fcc-emc-rf', 'test_engineer'),
  TECHNICAL_MANAGER_SUWON: emailOf('suwon-fcc-emc-rf', 'technical_manager'),
  LAB_MANAGER_SUWON: emailOf('suwon-fcc-emc-rf', 'lab_manager'),
  QUALITY_MANAGER_SUWON: emailOf('suwon-fcc-emc-rf', 'quality_manager'),
  SYSTEM_ADMIN: emailOf('suwon-fcc-emc-rf', 'system_admin'),

  // Suwon General EMC
  TEST_ENGINEER_SUWON_GENERAL_EMC: emailOf('suwon-general-emc', 'test_engineer'),
  TECHNICAL_MANAGER_SUWON_GENERAL_EMC: emailOf('suwon-general-emc', 'technical_manager'),

  // Suwon SAR
  TEST_ENGINEER_SUWON_SAR: emailOf('suwon-sar', 'test_engineer'),
  TECHNICAL_MANAGER_SUWON_SAR: emailOf('suwon-sar', 'technical_manager'),

  // Suwon Automotive EMC
  TEST_ENGINEER_SUWON_AUTO_EMC: emailOf('suwon-auto-emc', 'test_engineer'),
  TECHNICAL_MANAGER_SUWON_AUTO_EMC: emailOf('suwon-auto-emc', 'technical_manager'),

  // Uiwang General RF
  TEST_ENGINEER_UIWANG: emailOf('uiwang-general-rf', 'test_engineer'),
  TECHNICAL_MANAGER_UIWANG: emailOf('uiwang-general-rf', 'technical_manager'),

  // Pyeongtaek Automotive EMC
  LAB_MANAGER_PYEONGTAEK: emailOf('pyeongtaek-auto-emc', 'lab_manager'),
  TEST_ENGINEER_PYEONGTAEK: emailOf('pyeongtaek-auto-emc', 'test_engineer'),
  TECHNICAL_MANAGER_PYEONGTAEK: emailOf('pyeongtaek-auto-emc', 'technical_manager'),
} as const;

// =============================================================================
// Disposal Equipment & Request IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// Group별 격리: A(권한), B(워크플로우), C(반려), D(예외), E(UI)
// =============================================================================

export const TEST_DISPOSAL_EQUIPMENT_IDS = {
  // Group A: 권한 검증 (Suwon FCC 팀)
  PERM_A1_AVAILABLE: 'dddd0001-0001-4001-8001-000000000001',
  PERM_A2_AVAILABLE: 'dddd0002-0002-4002-8002-000000000002',
  PERM_A3_AVAILABLE: 'dddd0003-0003-4003-8003-000000000003',
  PERM_A4_PENDING: 'dddd0004-0004-4004-8004-000000000004', // reviewStatus=pending
  PERM_A5_REVIEWED: 'dddd0005-0005-4005-8005-000000000005', // reviewStatus=reviewed
  PERM_A7_UIWANG: 'dddd0007-0007-4007-8007-000000000007', // Uiwang team (cross-team)
  // Group B: 전체 워크플로우 (sequential reuse)
  WORKFLOW_B1: 'dddd0101-0101-4101-8101-000000000101',
  // Group C: 반려 테스트
  REJ_C1_PENDING: 'dddd0201-0201-4201-8201-000000000201',
  REJ_C2_REVIEWED: 'dddd0202-0202-4202-8202-000000000202',
} as const;

export const TEST_DISPOSAL_REQUEST_IDS = {
  REQ_A4: 'dddd1004-0004-4004-8004-000000000004', // PERM_A4 (pending)
  REQ_A5: 'dddd1005-0005-4005-8005-000000000005', // PERM_A5 (reviewed)
  REQ_C1: 'dddd1201-0201-4201-8201-000000000201', // REJ_C1 (pending)
  REQ_C2: 'dddd1202-0202-4202-8202-000000000202', // REJ_C2 (reviewed)
} as const;

// =============================================================================
// Non-Conformance IDs
// =============================================================================

export const TEST_NC_IDS = {
  // open (Suwon FCC EMC/RF team)
  NC_001_MALFUNCTION_OPEN: 'aaaa0001-0001-0001-0001-000000000001', // POWER_METER, malfunction
  // open (General EMC / SAR teams — TM(FCC) 접근 불가)
  NC_002_ANALYZING_NO_REPAIR: 'aaaa0002-0002-0002-0002-000000000002', // SIGNAL_INT, malfunction
  NC_003_DAMAGE_ANALYZING: 'aaaa0003-0003-0003-0003-000000000003', // MEASUREMENT_STAND, damage
  // closed (Automotive EMC — TM(FCC) 접근 불가)
  NC_004_CLOSED: 'aaaa0004-0004-0004-0004-000000000004', // BCI, malfunction
  // closed (Suwon FCC — TM 접근 가능)
  NC_005_CLOSED: 'aaaa0005-0005-0005-0005-000000000005', // NETWORK_ANALYZER, measurement_error
  // corrected (Automotive EMC — TM(FCC) 접근 불가)
  NC_006_WITH_REPAIR: 'aaaa0006-0006-0006-0006-000000000006', // HARNESS_COUPLER, calibration_failure
  NC_007_DAMAGE_CORRECTED: 'aaaa0007-0007-0007-0007-000000000007', // CURRENT_PROBE, damage
  // corrected (Suwon FCC — TM 접근 가능)
  NC_008_CORRECTED: 'aaaa0008-0008-0008-0008-000000000008', // EMC_RECEIVER, measurement_error
  // corrected (Uiwang — TM(FCC) 접근 불가)
  NC_009_CORRECTED_UIW: 'aaaa0009-0009-0009-0009-000000000009', // RECEIVER_UIW, damage
  // closed (Uiwang — TM(FCC) 접근 불가)
  NC_010_CLOSED_UIW: 'aaaa000a-000a-000a-000a-00000000000a', // AMPLIFIER_UIW, malfunction
} as const;

// =============================================================================
// Calibration Plan IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_CALIBRATION_PLAN_IDS = {
  CPLAN_001_DRAFT: 'cccc0001-0001-4001-8001-000000000001', // draft (v1, 2026 suwon FCC)
  CPLAN_002_PENDING_REVIEW: 'cccc0002-0002-4002-8002-000000000002', // pending_review (v1, 2026 uiwang)
  CPLAN_003_PENDING_APPROVAL: 'cccc0003-0003-4003-8003-000000000003', // pending_approval (v1, 2026 suwon General EMC)
  CPLAN_004_APPROVED: 'cccc0004-0004-4004-8004-000000000004', // approved (v1, 2025 suwon FCC)
  CPLAN_005_REJECTED: 'cccc0005-0005-4005-8005-000000000005', // rejected (v1, 2024 suwon FCC)
  CPLAN_006_RESUBMITTED: 'cccc0006-0006-4006-8006-000000000006', // pending_review (v2 from 005)
} as const;

export const TEST_CALIBRATION_PLAN_ITEM_IDS = {
  ITEM_001: 'cccc1001-0001-4001-8001-000000000001', // CPLAN_001 item 1
  ITEM_002: 'cccc1002-0002-4002-8002-000000000002', // CPLAN_001 item 2
  ITEM_003: 'cccc1003-0003-4003-8003-000000000003', // CPLAN_002 item 1
  ITEM_004: 'cccc1004-0004-4004-8004-000000000004', // CPLAN_002 item 2
  ITEM_005: 'cccc1005-0005-4005-8005-000000000005', // CPLAN_003 item 1
  ITEM_006: 'cccc1006-0006-4006-8006-000000000006', // CPLAN_003 item 2
  ITEM_007: 'cccc1007-0007-4007-8007-000000000007', // CPLAN_004 item 1 (confirmed)
  ITEM_008: 'cccc1008-0008-4008-8008-000000000008', // CPLAN_004 item 2 (confirmed)
  ITEM_009: 'cccc1009-0009-4009-8009-000000000009', // CPLAN_005 item 1
  ITEM_010: 'cccc1010-0010-4010-8010-000000000010', // CPLAN_005 item 2
  ITEM_011: 'cccc1011-0011-4011-8011-000000000011', // CPLAN_006 item 1
  ITEM_012: 'cccc1012-0012-4012-8012-000000000012', // CPLAN_006 item 2
} as const;

// =============================================================================
// Calibration IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_CALIBRATION_IDS = {
  CALIB_001: 'bbbb0001-0001-0001-0001-000000000001',
  CALIB_002: 'bbbb0002-0002-0002-0002-000000000002',
  CALIB_003: 'bbbb0003-0003-0003-0003-000000000003',
  CALIB_004: 'bbbb0004-0004-0004-0004-000000000004',
  CALIB_005: 'bbbb0005-0005-0005-0005-000000000005',
  CALIB_006: 'bbbb0006-0006-0006-0006-000000000006',
} as const;

// =============================================================================
// Team IDs (SSOT: backend/src/database/utils/uuid-constants.ts)
// =============================================================================

export const TEST_TEAM_IDS = {
  FCC_EMC_RF_SUWON: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
  GENERAL_EMC_SUWON: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289',
  SAR_SUWON: '7fd28076-fd5e-4d36-b051-bbf8a97b82db',
  AUTOMOTIVE_EMC_SUWON: 'f0a32655-00f9-4ecd-b43c-af4faed499b6',
  GENERAL_RF_UIWANG: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
  AUTOMOTIVE_EMC_PYEONGTAEK: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
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
  DATABASE:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/equipment_management',
} as const;
