/**
 * Fixed UUID constants for test data stability
 * These UUIDs are referenced in NextAuth test-login and E2E tests
 */

// =============================================================================
// TEAMS (6 teams across 3 sites)
// =============================================================================

// Suwon teams (4 teams)
export const TEAM_FCC_EMC_RF_SUWON_ID = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'; // E
export const TEAM_GENERAL_EMC_SUWON_ID = 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289'; // R
export const TEAM_SAR_SUWON_ID = '7fd28076-fd5e-4d36-b051-bbf8a97b82db'; // S
export const TEAM_AUTOMOTIVE_EMC_SUWON_ID = 'f0a32655-00f9-4ecd-b43c-af4faed499b6'; // A

// Uiwang teams (1 team)
export const TEAM_GENERAL_RF_UIWANG_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'; // W

// Pyeongtaek teams (1 team)
export const TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID = 'b2c3d4e5-f6a7-4890-bcde-f01234567890'; // A

// =============================================================================
// USERS (8 users across 3 sites)
// ⚠️ CRITICAL: Must match NextAuth test-login UUIDs in auth.controller.ts
// =============================================================================

// Suwon users (5 users)
export const USER_TEST_ENGINEER_SUWON_ID = '00000000-0000-0000-0000-000000000001'; // test_engineer
export const USER_TECHNICAL_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000002'; // technical_manager
export const USER_LAB_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000003'; // lab_manager (시험소장)
export const USER_SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000004'; // system_admin
export const USER_QUALITY_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000005'; // quality_manager

// Uiwang users (2 users)
export const USER_TECHNICAL_MANAGER_UIWANG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d478';
export const USER_TEST_ENGINEER_UIWANG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Pyeongtaek users (1 user)
export const USER_LAB_MANAGER_PYEONGTAEK_ID = 'cccccccc-dddd-eeee-ffff-000000000000';

// =============================================================================
// EQUIPMENT (32 equipment across statuses, sites, classifications)
// Pattern: eeeeNNNN-NNNN-NNNN-NNNN-NNNNNNNNNNNN
// =============================================================================

// Suwon equipment (FCC EMC/RF - E) [8 equipment]
export const EQUIP_SPECTRUM_ANALYZER_SUW_E_ID = 'eeee1001-0001-0001-0001-000000000001'; // available
export const EQUIP_SIGNAL_GEN_SUW_E_ID = 'eeee1002-0002-0002-0002-000000000002'; // available
export const EQUIP_NETWORK_ANALYZER_SUW_E_ID = 'eeee1003-0003-0003-0003-000000000003'; // available
export const EQUIP_POWER_METER_SUW_E_ID = 'eeee1004-0004-0004-0004-000000000004'; // non_conforming
export const EQUIP_EMC_RECEIVER_SUW_E_ID = 'eeee1005-0005-0005-0005-000000000005'; // in_use
export const EQUIP_FILTER_SUW_E_ID = 'eeee1006-0006-0006-0006-000000000006'; // spare
export const EQUIP_ANTENNA_1_SUW_E_ID = 'eeee1007-0007-0007-0007-000000000007'; // checked_out
export const EQUIP_COUPLER_SUW_E_ID = 'eeee1008-0008-0008-0008-000000000008'; // calibration_overdue

// Suwon equipment (General EMC - R) [6 equipment]
export const EQUIP_OSCILLOSCOPE_SUW_R_ID = 'eeee2001-0001-0001-0001-000000000001'; // available (overdue)
export const EQUIP_POWER_SUPPLY_SUW_R_ID = 'eeee2002-0002-0002-0002-000000000002'; // available (due soon)
export const EQUIP_MULTIMETER_SUW_R_ID = 'eeee2003-0003-0003-0003-000000000003'; // in_use
export const EQUIP_SIGNAL_INT_SUW_R_ID = 'eeee2004-0004-0004-0004-000000000004'; // non_conforming
export const EQUIP_ATTENUATOR_SUW_R_ID = 'eeee2005-0005-0005-0005-000000000005'; // checked_out
export const EQUIP_ABSORBER_SUW_R_ID = 'eeee2006-0006-0006-0006-000000000006'; // pending_disposal

// Suwon equipment (SAR - S) [6 equipment]
export const EQUIP_SAR_PROBE_SUW_S_ID = 'eeee3001-0001-0001-0001-000000000001'; // available
export const EQUIP_PHANTOM_HEAD_SUW_S_ID = 'eeee3002-0002-0002-0002-000000000002'; // available
export const EQUIP_SAR_SYSTEM_SUW_S_ID = 'eeee3003-0003-0003-0003-000000000003'; // in_use
export const EQUIP_MEASUREMENT_STAND_SUW_S_ID = 'eeee3004-0004-0004-0004-000000000004'; // non_conforming
export const EQUIP_LIQUID_HANDLER_SUW_S_ID = 'eeee3005-0005-0005-0005-000000000005'; // spare
export const EQUIP_TEMPERATURE_CONTROL_SUW_S_ID = 'eeee3006-0006-0006-0006-000000000006'; // checked_out

// Suwon equipment (Automotive EMC - A) [6 equipment]
export const EQUIP_HARNESS_COUPLER_SUW_A_ID = 'eeee4001-0001-0001-0001-000000000001'; // available
export const EQUIP_CURRENT_PROBE_SUW_A_ID = 'eeee4002-0002-0002-0002-000000000002'; // available
export const EQUIP_INJECTION_CLAMP_SUW_A_ID = 'eeee4003-0003-0003-0003-000000000003'; // in_use
export const EQUIP_BCI_SUW_A_ID = 'eeee4004-0004-0004-0004-000000000004'; // non_conforming
export const EQUIP_POWER_CONTROLLER_SUW_A_ID = 'eeee4005-0005-0005-0005-000000000005'; // pending_disposal
export const EQUIP_SENSOR_SUW_A_ID = 'eeee4006-0006-0006-0006-000000000006'; // disposed

// Uiwang equipment (General RF - W) [4 equipment]
export const EQUIP_RECEIVER_UIW_W_ID = 'eeee5001-0001-0001-0001-000000000001'; // available
export const EQUIP_TRANSMITTER_UIW_W_ID = 'eeee5002-0002-0002-0002-000000000002'; // available
export const EQUIP_ANTENNA_2_UIW_W_ID = 'eeee5003-0003-0003-0003-000000000003'; // checked_out
export const EQUIP_AMPLIFIER_UIW_W_ID = 'eeee5004-0004-0004-0004-000000000004'; // calibration_overdue

// Pyeongtaek equipment (Automotive EMC - A) [2 equipment]
export const EQUIP_TEST_HARNESS_PYT_A_ID = 'eeee6001-0001-0001-0001-000000000001'; // available
export const EQUIP_POWER_AMP_PYT_A_ID = 'eeee6002-0002-0002-0002-000000000002'; // available

// Software equipment (P) - Suwon [2 equipment]
export const EQUIP_EMC32_SUW_P_ID = 'eeee7001-0001-0001-0001-000000000001'; // available
export const EQUIP_DASY6_SUW_P_ID = 'eeee7002-0002-0002-0002-000000000002'; // available

// =============================================================================
// CALIBRATIONS (18 calibrations)
// Pattern: calib-NNNN
// =============================================================================

export const CALIB_001_ID = 'bbbb0001-0001-0001-0001-000000000001';
export const CALIB_002_ID = 'bbbb0002-0002-0002-0002-000000000002';
export const CALIB_003_ID = 'bbbb0003-0003-0003-0003-000000000003';
export const CALIB_004_ID = 'bbbb0004-0004-0004-0004-000000000004';
export const CALIB_005_ID = 'bbbb0005-0005-0005-0005-000000000005';
export const CALIB_006_ID = 'bbbb0006-0006-0006-0006-000000000006';
export const CALIB_007_ID = 'bbbb0007-0007-0007-0007-000000000007';
export const CALIB_008_ID = 'bbbb0008-0008-0008-0008-000000000008';
export const CALIB_009_ID = 'bbbb0009-0009-0009-0009-000000000009';
export const CALIB_010_ID = 'bbbb000a-000a-000a-000a-00000000000a';
export const CALIB_011_ID = 'bbbb000b-000b-000b-000b-00000000000b';
export const CALIB_012_ID = 'bbbb000c-000c-000c-000c-00000000000c';
export const CALIB_013_ID = 'bbbb000d-000d-000d-000d-00000000000d';
export const CALIB_014_ID = 'bbbb000e-000e-000e-000e-00000000000e';
export const CALIB_015_ID = 'bbbb000f-000f-000f-000f-00000000000f';
export const CALIB_016_ID = 'bbbb0010-0010-0010-0010-000000000010';
export const CALIB_017_ID = 'bbbb0011-0011-0011-0011-000000000011';
export const CALIB_018_ID = 'bbbb0012-0012-0012-0012-000000000012';

// =============================================================================
// CALIBRATION PLANS (6 plans)
// Pattern: cplan-NNNN
// =============================================================================

export const CPLAN_001_ID = 'cplan-0001'; // draft (v1)
export const CPLAN_002_ID = 'cplan-0002'; // pending_review (v1)
export const CPLAN_003_ID = 'cplan-0003'; // pending_approval (v1)
export const CPLAN_004_ID = 'cplan-0004'; // approved (v1)
export const CPLAN_005_ID = 'cplan-0005'; // rejected (v1)
export const CPLAN_006_ID = 'cplan-0006'; // pending_review (v2, re-submitted)

// =============================================================================
// NON-CONFORMANCES (10 non-conformances)
// Pattern: nc-NNNN
// =============================================================================

export const NC_001_ID = 'aaaa0001-0001-0001-0001-000000000001';
export const NC_002_ID = 'aaaa0002-0002-0002-0002-000000000002';
export const NC_003_ID = 'aaaa0003-0003-0003-0003-000000000003';
export const NC_004_ID = 'aaaa0004-0004-0004-0004-000000000004';
export const NC_005_ID = 'aaaa0005-0005-0005-0005-000000000005';
export const NC_006_ID = 'aaaa0006-0006-0006-0006-000000000006';
export const NC_007_ID = 'aaaa0007-0007-0007-0007-000000000007';
export const NC_008_ID = 'aaaa0008-0008-0008-0008-000000000008';
export const NC_009_ID = 'aaaa0009-0009-0009-0009-000000000009';
export const NC_010_ID = 'aaaa000a-000a-000a-000a-00000000000a';

// =============================================================================
// REPAIR HISTORY (8 repairs)
// Pattern: reph-NNNN
// =============================================================================

export const REPAIR_001_ID = 'dddd0001-0001-0001-0001-000000000001'; // linked to NC-006
export const REPAIR_002_ID = 'dddd0002-0002-0002-0002-000000000002'; // linked to NC-007
export const REPAIR_003_ID = 'dddd0003-0003-0003-0003-000000000003'; // linked to NC-008
export const REPAIR_004_ID = 'dddd0004-0004-0004-0004-000000000004'; // linked to NC-009
export const REPAIR_005_ID = 'dddd0005-0005-0005-0005-000000000005'; // standalone
export const REPAIR_006_ID = 'dddd0006-0006-0006-0006-000000000006'; // standalone
export const REPAIR_007_ID = 'dddd0007-0007-0007-0007-000000000007'; // standalone
export const REPAIR_008_ID = 'dddd0008-0008-0008-0008-000000000008'; // standalone

// =============================================================================
// CHECKOUTS (15 checkouts)
// Pattern: chk-NNNN
// =============================================================================

export const CHECKOUT_001_ID = 'chk-0001';
export const CHECKOUT_002_ID = 'chk-0002';
export const CHECKOUT_003_ID = 'chk-0003';
export const CHECKOUT_004_ID = 'chk-0004';
export const CHECKOUT_005_ID = 'chk-0005';
export const CHECKOUT_006_ID = 'chk-0006';
export const CHECKOUT_007_ID = 'chk-0007';
export const CHECKOUT_008_ID = 'chk-0008';
export const CHECKOUT_009_ID = 'chk-0009';
export const CHECKOUT_010_ID = 'chk-0010';
export const CHECKOUT_011_ID = 'chk-0011';
export const CHECKOUT_012_ID = 'chk-0012';
export const CHECKOUT_013_ID = 'chk-0013';
export const CHECKOUT_014_ID = 'chk-0014';
export const CHECKOUT_015_ID = 'chk-0015';

// =============================================================================
// TEAM SPECIAL ID (placeholder team for test users)
// =============================================================================

export const TEAM_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000099';
