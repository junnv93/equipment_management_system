/**
 * Fixed UUID constants for test data stability
 * These UUIDs are referenced in NextAuth test-login and E2E tests
 */

// =============================================================================
// SYSTEM ACTOR (nil UUID — 인증 실패, 시스템 이벤트 등 사용자 특정 불가 상황)
// =============================================================================

/** nil UUID: 시스템 생성 감사 로그에서 userId/entityId로 사용 (PostgreSQL uuid 컬럼 호환) */
export const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

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
// USERS (16 users across 3 sites, 7 teams)
// ⚠️ CRITICAL: Must match NextAuth test-login UUIDs in auth.controller.ts
// =============================================================================

// Suwon FCC EMC/RF users (5 users)
export const USER_TEST_ENGINEER_SUWON_ID = '00000000-0000-0000-0000-000000000001'; // test_engineer
export const USER_TECHNICAL_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000002'; // technical_manager
export const USER_LAB_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000003'; // lab_manager (시험소장)
export const USER_SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000004'; // system_admin
export const USER_QUALITY_MANAGER_SUWON_ID = '00000000-0000-0000-0000-000000000005'; // quality_manager
export const USER_TECHNICAL_MANAGER_SUWON_DEPUTY_ID = '00000000-0000-0000-0000-000000000006'; // technical_manager (부)

// Suwon General EMC users (2 users)
export const USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID = '00000000-0000-0000-0000-000000000009';
export const USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID = '00000000-0000-0000-0000-00000000000a';

// Suwon SAR users (2 users)
export const USER_TEST_ENGINEER_SUWON_SAR_ID = '00000000-0000-0000-0000-00000000000b';
export const USER_TECHNICAL_MANAGER_SUWON_SAR_ID = '00000000-0000-0000-0000-00000000000c';

// Suwon Automotive EMC users (2 users)
export const USER_TEST_ENGINEER_SUWON_AUTO_EMC_ID = '00000000-0000-0000-0000-00000000000d';
export const USER_TECHNICAL_MANAGER_SUWON_AUTO_EMC_ID = '00000000-0000-0000-0000-00000000000e';

// Uiwang users (2 users)
export const USER_TECHNICAL_MANAGER_UIWANG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d478';
export const USER_TEST_ENGINEER_UIWANG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Pyeongtaek users (3 users)
export const USER_LAB_MANAGER_PYEONGTAEK_ID = 'cccccccc-dddd-eeee-ffff-000000000000';
export const USER_TEST_ENGINEER_PYEONGTAEK_ID = '00000000-0000-0000-0000-000000000013';
export const USER_TECHNICAL_MANAGER_PYEONGTAEK_ID = '00000000-0000-0000-0000-000000000014';

// =============================================================================
// EQUIPMENT (36 equipment across statuses, sites, classifications)
// Pattern: eeeeNNNN-NNNN-NNNN-NNNN-NNNNNNNNNNNN
// =============================================================================

// Suwon equipment (FCC EMC/RF - E) [8 equipment]
export const EQUIP_SPECTRUM_ANALYZER_SUW_E_ID = 'eeee1001-0001-4001-8001-000000000001'; // available
export const EQUIP_SIGNAL_GEN_SUW_E_ID = 'eeee1002-0002-4002-8002-000000000002'; // available
export const EQUIP_NETWORK_ANALYZER_SUW_E_ID = 'eeee1003-0003-4003-8003-000000000003'; // available
export const EQUIP_POWER_METER_SUW_E_ID = 'eeee1004-0004-4004-8004-000000000004'; // non_conforming
export const EQUIP_EMC_RECEIVER_SUW_E_ID = 'eeee1005-0005-4005-8005-000000000005'; // available
export const EQUIP_FILTER_SUW_E_ID = 'eeee1006-0006-4006-8006-000000000006'; // spare
export const EQUIP_ANTENNA_1_SUW_E_ID = 'eeee1007-0007-4007-8007-000000000007'; // checked_out
export const EQUIP_COUPLER_SUW_E_ID = 'eeee1008-0008-4008-8008-000000000008'; // calibration_overdue

// Suwon FCC EMC/RF (E) — Dedicated E2E checkout suite equipment (S23-S26)
export const EQUIP_RBAC_SIGNAL_GEN_SUW_E_ID = 'eeee1009-0009-4009-8009-000000000009'; // S23: RBAC test
export const EQUIP_CANCEL_RECEIVER_SUW_E_ID = 'eeee100a-000a-400a-800a-00000000000a'; // S24: Cancel test
export const EQUIP_CAS_ANALYZER_SUW_E_ID = 'eeee100b-000b-400b-800b-00000000000b'; // S25: CAS test
export const EQUIP_SHARED_ANALYZER_SUW_E_ID = 'eeee100c-000c-400c-800c-00000000000c'; // S26: Shared equipment test
// 비교정 중간점검 대상 기준 치구 — needsIntermediateCheck=true + 교정 기록 없음 (M6 검증 픽스처)
export const EQUIP_REF_JIG_SUW_E_ID = 'eeee100d-000d-400d-800d-00000000000d'; // available, not_applicable, needsIntermediateCheck=true

// Suwon equipment (General EMC - R) [6 equipment]
export const EQUIP_OSCILLOSCOPE_SUW_R_ID = 'eeee2001-0001-4001-8001-000000000001'; // available (overdue)
export const EQUIP_POWER_SUPPLY_SUW_R_ID = 'eeee2002-0002-4002-8002-000000000002'; // available (due soon)
export const EQUIP_MULTIMETER_SUW_R_ID = 'eeee2003-0003-4003-8003-000000000003'; // available
export const EQUIP_SIGNAL_INT_SUW_R_ID = 'eeee2004-0004-4004-8004-000000000004'; // non_conforming
export const EQUIP_ATTENUATOR_SUW_R_ID = 'eeee2005-0005-4005-8005-000000000005'; // checked_out
export const EQUIP_ABSORBER_SUW_R_ID = 'eeee2006-0006-4006-8006-000000000006'; // pending_disposal

// Suwon equipment (SAR - S) [6 equipment]
export const EQUIP_SAR_PROBE_SUW_S_ID = 'eeee3001-0001-4001-8001-000000000001'; // available
export const EQUIP_PHANTOM_HEAD_SUW_S_ID = 'eeee3002-0002-4002-8002-000000000002'; // available
export const EQUIP_SAR_SYSTEM_SUW_S_ID = 'eeee3003-0003-4003-8003-000000000003'; // available
export const EQUIP_MEASUREMENT_STAND_SUW_S_ID = 'eeee3004-0004-4004-8004-000000000004'; // non_conforming
export const EQUIP_LIQUID_HANDLER_SUW_S_ID = 'eeee3005-0005-4005-8005-000000000005'; // spare
export const EQUIP_TEMPERATURE_CONTROL_SUW_S_ID = 'eeee3006-0006-4006-8006-000000000006'; // checked_out

// Suwon equipment (Automotive EMC - A) [6 equipment]
export const EQUIP_HARNESS_COUPLER_SUW_A_ID = 'eeee4001-0001-4001-8001-000000000001'; // available
export const EQUIP_CURRENT_PROBE_SUW_A_ID = 'eeee4002-0002-4002-8002-000000000002'; // available
export const EQUIP_INJECTION_CLAMP_SUW_A_ID = 'eeee4003-0003-4003-8003-000000000003'; // available
export const EQUIP_BCI_SUW_A_ID = 'eeee4004-0004-4004-8004-000000000004'; // non_conforming
export const EQUIP_POWER_CONTROLLER_SUW_A_ID = 'eeee4005-0005-4005-8005-000000000005'; // pending_disposal
export const EQUIP_SENSOR_SUW_A_ID = 'eeee4006-0006-4006-8006-000000000006'; // disposed

// Uiwang equipment (General RF - W) [4 equipment]
export const EQUIP_RECEIVER_UIW_W_ID = 'eeee5001-0001-4001-8001-000000000001'; // available
export const EQUIP_TRANSMITTER_UIW_W_ID = 'eeee5002-0002-4002-8002-000000000002'; // available
export const EQUIP_ANTENNA_2_UIW_W_ID = 'eeee5003-0003-4003-8003-000000000003'; // checked_out
export const EQUIP_AMPLIFIER_UIW_W_ID = 'eeee5004-0004-4004-8004-000000000004'; // calibration_overdue

// Pyeongtaek equipment (Automotive EMC - A) [2 equipment]
export const EQUIP_TEST_HARNESS_PYT_A_ID = 'eeee6001-0001-4001-8001-000000000001'; // available
export const EQUIP_POWER_AMP_PYT_A_ID = 'eeee6002-0002-4002-8002-000000000002'; // available

// NOTE: 소프트웨어(EMC32, DASY6)는 소프트웨어 관리 모듈에서 관리. 장비 테이블에 포함하지 않음.

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
// Pattern: cccc00NN-00NN-40NN-80NN-0000000000NN
// =============================================================================

export const CPLAN_001_ID = 'cccc0001-0001-4001-8001-000000000001'; // draft (v1, 2026 suwon)
export const CPLAN_002_ID = 'cccc0002-0002-4002-8002-000000000002'; // pending_review (v1, 2026 uiwang)
export const CPLAN_003_ID = 'cccc0003-0003-4003-8003-000000000003'; // pending_approval (v1, 2026 pyeongtaek)
export const CPLAN_004_ID = 'cccc0004-0004-4004-8004-000000000004'; // approved (v1, 2025 suwon)
export const CPLAN_005_ID = 'cccc0005-0005-4005-8005-000000000005'; // rejected (v1, 2024 suwon, review stage)
export const CPLAN_006_ID = 'cccc0006-0006-4006-8006-000000000006'; // pending_review (v2, re-submitted from CPLAN_005)

// =============================================================================
// CALIBRATION PLAN ITEMS (12 items across 6 plans)
// Pattern: cccc10NN-00NN-40NN-80NN-0000000000NN
// =============================================================================

export const CPLAN_ITEM_001_ID = 'cccc1001-0001-4001-8001-000000000001'; // CPLAN_001 item 1
export const CPLAN_ITEM_002_ID = 'cccc1002-0002-4002-8002-000000000002'; // CPLAN_001 item 2
export const CPLAN_ITEM_003_ID = 'cccc1003-0003-4003-8003-000000000003'; // CPLAN_002 item 1
export const CPLAN_ITEM_004_ID = 'cccc1004-0004-4004-8004-000000000004'; // CPLAN_002 item 2
export const CPLAN_ITEM_005_ID = 'cccc1005-0005-4005-8005-000000000005'; // CPLAN_003 item 1
export const CPLAN_ITEM_006_ID = 'cccc1006-0006-4006-8006-000000000006'; // CPLAN_003 item 2
export const CPLAN_ITEM_007_ID = 'cccc1007-0007-4007-8007-000000000007'; // CPLAN_004 item 1 (confirmed)
export const CPLAN_ITEM_008_ID = 'cccc1008-0008-4008-8008-000000000008'; // CPLAN_004 item 2 (confirmed)
export const CPLAN_ITEM_009_ID = 'cccc1009-0009-4009-8009-000000000009'; // CPLAN_005 item 1
export const CPLAN_ITEM_010_ID = 'cccc1010-0010-4010-8010-000000000010'; // CPLAN_005 item 2
export const CPLAN_ITEM_011_ID = 'cccc1011-0011-4011-8011-000000000011'; // CPLAN_006 item 1
export const CPLAN_ITEM_012_ID = 'cccc1012-0012-4012-8012-000000000012'; // CPLAN_006 item 2

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
// SUW-E0001 통합 이력 검증용 — FK 역참조 중복 제거 규칙 (repair와 1:1 연결)
export const NC_011_ID = 'aaaa000b-000b-000b-000b-00000000000b';

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
// SUW-E0001 통합 이력 검증용 — NC와 1:1 FK 연결
export const REPAIR_009_ID = 'dddd0009-0009-0009-0009-000000000009';

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
// DISPOSAL WORKFLOW E2E TEST EQUIPMENT (21 equipment)
// Pattern: dddd00NN-00NN-40NN-80NN-0000000000NN
// =============================================================================

// Group A: 권한 검증 (8 equipment)
export const EQUIP_DISPOSAL_PERM_A1 = 'dddd0001-0001-4001-8001-000000000001'; // available, Suwon FCC
export const EQUIP_DISPOSAL_PERM_A2 = 'dddd0002-0002-4002-8002-000000000002'; // available, Suwon FCC
export const EQUIP_DISPOSAL_PERM_A3 = 'dddd0003-0003-4003-8003-000000000003'; // available, Suwon FCC
export const EQUIP_DISPOSAL_PERM_A4 = 'dddd0004-0004-4004-8004-000000000004'; // pending_disposal (reviewStatus=pending)
export const EQUIP_DISPOSAL_PERM_A5 = 'dddd0005-0005-4005-8005-000000000005'; // pending_disposal (reviewStatus=reviewed)
export const EQUIP_DISPOSAL_PERM_A6 = 'dddd0006-0006-4006-8006-000000000006'; // disposed
export const EQUIP_DISPOSAL_PERM_A7 = 'dddd0007-0007-4007-8007-000000000007'; // pending_disposal (Uiwang team)
export const EQUIP_DISPOSAL_PERM_A8 = 'dddd0008-0008-4008-8008-000000000008'; // available (isShared=true)

// Group B: 전체 워크플로우 (1 equipment - sequential reuse)
export const EQUIP_DISPOSAL_WORKFLOW = 'dddd0101-0101-4101-8101-000000000101'; // available, Suwon FCC

// Group C: 반려 시나리오 (4 equipment)
export const EQUIP_DISPOSAL_REJ_C1 = 'dddd0201-0201-4201-8201-000000000201'; // pending_disposal (reviewStatus=pending)
export const EQUIP_DISPOSAL_REJ_C2 = 'dddd0202-0202-4202-8202-000000000202'; // pending_disposal (reviewStatus=reviewed)
export const EQUIP_DISPOSAL_REJ_C3 = 'dddd0203-0203-4203-8203-000000000203'; // pending_disposal (reviewStatus=pending, validation)
export const EQUIP_DISPOSAL_REJ_C4 = 'dddd0204-0204-4204-8204-000000000204'; // pending_disposal (reviewStatus=reviewed, cancel)

// Group D: 예외 처리 (5 equipment)
export const EQUIP_DISPOSAL_EXC_D1 = 'dddd0301-0301-4301-8301-000000000301'; // pending_disposal (중복 요청)
export const EQUIP_DISPOSAL_EXC_D2 = 'dddd0302-0302-4302-8302-000000000302'; // available (유효성 검증)
export const EQUIP_DISPOSAL_EXC_D3 = 'dddd0303-0303-4303-8303-000000000303'; // pending_disposal (취소, requester=test_engineer)
export const EQUIP_DISPOSAL_EXC_D4 = 'dddd0304-0304-4304-8304-000000000304'; // pending_disposal (취소, requester=다른 사용자)
export const EQUIP_DISPOSAL_EXC_D5 = 'dddd0305-0305-4305-8305-000000000305'; // pending_disposal (reviewStatus=reviewed, 취소 불가)

// Group E: UI/UX & Accessibility (3 equipment)
export const EQUIP_DISPOSAL_UI_E1 = 'dddd0401-0401-4401-8401-000000000401'; // pending_disposal (reviewStatus=pending)
export const EQUIP_DISPOSAL_UI_E2 = 'dddd0402-0402-4402-8402-000000000402'; // pending_disposal (reviewStatus=reviewed)
export const EQUIP_DISPOSAL_UI_E3 = 'dddd0403-0403-4403-8403-000000000403'; // disposed

// =============================================================================
// DISPOSAL REQUESTS (15 requests)
// Pattern: dddd1NNN-00NN-40NN-80NN-0000000000NN
// =============================================================================

export const DISP_REQ_A4_ID = 'dddd1004-0004-4004-8004-000000000004'; // EQUIP_DISPOSAL_PERM_A4 (pending)
export const DISP_REQ_A5_ID = 'dddd1005-0005-4005-8005-000000000005'; // EQUIP_DISPOSAL_PERM_A5 (reviewed)
export const DISP_REQ_A6_ID = 'dddd1006-0006-4006-8006-000000000006'; // EQUIP_DISPOSAL_PERM_A6 (approved)
export const DISP_REQ_A7_ID = 'dddd1007-0007-4007-8007-000000000007'; // EQUIP_DISPOSAL_PERM_A7 (pending, Uiwang)
export const DISP_REQ_C1_ID = 'dddd1201-0201-4201-8201-000000000201'; // EQUIP_DISPOSAL_REJ_C1 (pending)
export const DISP_REQ_C2_ID = 'dddd1202-0202-4202-8202-000000000202'; // EQUIP_DISPOSAL_REJ_C2 (reviewed)
export const DISP_REQ_C3_ID = 'dddd1203-0203-4203-8203-000000000203'; // EQUIP_DISPOSAL_REJ_C3 (pending)
export const DISP_REQ_C4_ID = 'dddd1204-0204-4204-8204-000000000204'; // EQUIP_DISPOSAL_REJ_C4 (reviewed)
export const DISP_REQ_A1_ID = 'dddd1001-0001-4001-8001-000000000001'; // EQUIP_DISPOSAL_PERM_A1 (pending review)
export const DISP_REQ_D1_ID = 'dddd1301-0301-4301-8301-000000000301'; // EQUIP_DISPOSAL_EXC_D1 (pending, duplicate test)
export const DISP_REQ_D3_ID = 'dddd1303-0303-4303-8303-000000000303'; // EQUIP_DISPOSAL_EXC_D3 (pending, cancel by requester)
export const DISP_REQ_D4_ID = 'dddd1304-0304-4304-8304-000000000304'; // EQUIP_DISPOSAL_EXC_D4 (pending, cancel by different user)
export const DISP_REQ_D5_ID = 'dddd1305-0305-4305-8305-000000000305'; // EQUIP_DISPOSAL_EXC_D5 (reviewed, cannot cancel)
export const DISP_REQ_E1_ID = 'dddd1401-0401-4401-8401-000000000401'; // EQUIP_DISPOSAL_UI_E1 (pending)
export const DISP_REQ_E2_ID = 'dddd1402-0402-4402-8402-000000000402'; // EQUIP_DISPOSAL_UI_E2 (reviewed)
export const DISP_REQ_E3_ID = 'dddd1403-0403-4403-8403-000000000403'; // EQUIP_DISPOSAL_UI_E3 (approved)

// =============================================================================
// SOFTWARE HISTORY (8 records)
// Pattern: ffff00NN-00NN-40NN-80NN-0000000000NN
// =============================================================================

export const SOFT_HIST_001_ID = 'ffff0001-0001-4001-8001-000000000001';
export const SOFT_HIST_002_ID = 'ffff0002-0002-4002-8002-000000000002';
export const SOFT_HIST_003_ID = 'ffff0003-0003-4003-8003-000000000003';
export const SOFT_HIST_004_ID = 'ffff0004-0004-4004-8004-000000000004';
export const SOFT_HIST_005_ID = 'ffff0005-0005-4005-8005-000000000005';
export const SOFT_HIST_006_ID = 'ffff0006-0006-4006-8006-000000000006';
export const SOFT_HIST_007_ID = 'ffff0007-0007-4007-8007-000000000007';
export const SOFT_HIST_008_ID = 'ffff0008-0008-4008-8008-000000000008';

// =============================================================================
// LOCATION HISTORY (10 records)
// Pattern: 11110NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const LOC_HIST_001_ID = '11110001-0001-4001-8001-000000000001';
export const LOC_HIST_002_ID = '11110002-0002-4002-8002-000000000002';
export const LOC_HIST_003_ID = '11110003-0003-4003-8003-000000000003';
export const LOC_HIST_004_ID = '11110004-0004-4004-8004-000000000004';
export const LOC_HIST_005_ID = '11110005-0005-4005-8005-000000000005';
export const LOC_HIST_006_ID = '11110006-0006-4006-8006-000000000006';
export const LOC_HIST_007_ID = '11110007-0007-4007-8007-000000000007';
export const LOC_HIST_008_ID = '11110008-0008-4008-8008-000000000008';
export const LOC_HIST_009_ID = '11110009-0009-4009-8009-000000000009';
export const LOC_HIST_010_ID = '1111000a-000a-400a-800a-00000000000a';

// =============================================================================
// MAINTENANCE HISTORY (10 records)
// Pattern: 22220NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const MAINT_HIST_001_ID = '22220001-0001-4001-8001-000000000001';
export const MAINT_HIST_002_ID = '22220002-0002-4002-8002-000000000002';
export const MAINT_HIST_003_ID = '22220003-0003-4003-8003-000000000003';
export const MAINT_HIST_004_ID = '22220004-0004-4004-8004-000000000004';
export const MAINT_HIST_005_ID = '22220005-0005-4005-8005-000000000005';
export const MAINT_HIST_006_ID = '22220006-0006-4006-8006-000000000006';
export const MAINT_HIST_007_ID = '22220007-0007-4007-8007-000000000007';
export const MAINT_HIST_008_ID = '22220008-0008-4008-8008-000000000008';
export const MAINT_HIST_009_ID = '22220009-0009-4009-8009-000000000009';
export const MAINT_HIST_010_ID = '2222000a-000a-400a-800a-00000000000a';

// =============================================================================
// INCIDENT HISTORY (10 records)
// Pattern: 33330NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const INCIDENT_001_ID = '33330001-0001-4001-8001-000000000001';
export const INCIDENT_002_ID = '33330002-0002-4002-8002-000000000002';
export const INCIDENT_003_ID = '33330003-0003-4003-8003-000000000003';
export const INCIDENT_004_ID = '33330004-0004-4004-8004-000000000004';
export const INCIDENT_005_ID = '33330005-0005-4005-8005-000000000005';
export const INCIDENT_006_ID = '33330006-0006-4006-8006-000000000006';
export const INCIDENT_007_ID = '33330007-0007-4007-8007-000000000007';
export const INCIDENT_008_ID = '33330008-0008-4008-8008-000000000008';
export const INCIDENT_009_ID = '33330009-0009-4009-8009-000000000009';
export const INCIDENT_010_ID = '3333000a-000a-400a-800a-00000000000a';
export const INCIDENT_011_ID = '3333000b-000b-400b-800b-00000000000b';

// =============================================================================
// EQUIPMENT REQUESTS (6 records)
// Pattern: 44440NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const EQUIP_REQ_001_ID = '44440001-0001-4001-8001-000000000001';
export const EQUIP_REQ_002_ID = '44440002-0002-4002-8002-000000000002';
export const EQUIP_REQ_003_ID = '44440003-0003-4003-8003-000000000003';
export const EQUIP_REQ_004_ID = '44440004-0004-4004-8004-000000000004';
export const EQUIP_REQ_005_ID = '44440005-0005-4005-8005-000000000005';
export const EQUIP_REQ_006_ID = '44440006-0006-4006-8006-000000000006';

// =============================================================================
// EQUIPMENT ATTACHMENTS (6 records)
// Pattern: 55550NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const ATTACH_001_ID = '55550001-0001-4001-8001-000000000001';
export const ATTACH_002_ID = '55550002-0002-4002-8002-000000000002';
export const ATTACH_003_ID = '55550003-0003-4003-8003-000000000003';
export const ATTACH_004_ID = '55550004-0004-4004-8004-000000000004';
export const ATTACH_005_ID = '55550005-0005-4005-8005-000000000005';
export const ATTACH_006_ID = '55550006-0006-4006-8006-000000000006';

// =============================================================================
// SOFTWARE VALIDATIONS (10 records across all statuses)
// Pattern: 66660NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const SW_VALID_001_ID = '66660001-0001-4001-8001-000000000001'; // draft (vendor)
export const SW_VALID_002_ID = '66660002-0002-4002-8002-000000000002'; // submitted (vendor)
export const SW_VALID_003_ID = '66660003-0003-4003-8003-000000000003'; // approved (vendor)
export const SW_VALID_004_ID = '66660004-0004-4004-8004-000000000004'; // quality_approved (vendor)
export const SW_VALID_005_ID = '66660005-0005-4005-8005-000000000005'; // rejected (vendor)
export const SW_VALID_006_ID = '66660006-0006-4006-8006-000000000006'; // draft (self)
export const SW_VALID_007_ID = '66660007-0007-4007-8007-000000000007'; // submitted (self)
export const SW_VALID_008_ID = '66660008-0008-4008-8008-000000000008'; // approved (self)
export const SW_VALID_009_ID = '66660009-0009-4009-8009-000000000009'; // quality_approved (self)
export const SW_VALID_010_ID = '6666000a-000a-400a-800a-00000000000a'; // rejected (self)

// =============================================================================
// EQUIPMENT ↔ TEST SOFTWARE LINKS (8 M:N records)
// Pattern: 77770NNN-0NNN-40NN-80NN-0000000000NN
// =============================================================================

export const EQ_SW_LINK_001_ID = '77770001-0001-4001-8001-000000000001';
export const EQ_SW_LINK_002_ID = '77770002-0002-4002-8002-000000000002';
export const EQ_SW_LINK_003_ID = '77770003-0003-4003-8003-000000000003';
export const EQ_SW_LINK_004_ID = '77770004-0004-4004-8004-000000000004';
export const EQ_SW_LINK_005_ID = '77770005-0005-4005-8005-000000000005';
export const EQ_SW_LINK_006_ID = '77770006-0006-4006-8006-000000000006';
export const EQ_SW_LINK_007_ID = '77770007-0007-4007-8007-000000000007';
export const EQ_SW_LINK_008_ID = '77770008-0008-4008-8008-000000000008';

// =============================================================================
// INTERMEDIATE INSPECTIONS (UL-QP-18-03)
// Pattern: ii0NNNNN-...
// =============================================================================

export const INTERMEDIATE_INSPECTION_001_ID = '91110001-0001-4001-8001-000000000001';
export const INTERMEDIATE_INSPECTION_ITEM_001_A_ID = '91110001-1001-4001-8001-000000000001';
export const INTERMEDIATE_INSPECTION_ITEM_001_B_ID = '91110001-1002-4001-8001-000000000002';
export const INTERMEDIATE_INSPECTION_ITEM_001_C_ID = '91110001-1003-4001-8001-000000000003';
// 측정 장비 연결 — INSPECTION_001 측정 시 사용한 기기
export const INTERMEDIATE_INSPECTION_EQUIPMENT_001_A_ID = '91110001-2001-4001-8001-000000000001';

// INSPECTION_002: SUW-E0001(스펙트럼 분석기) approved 상태 — 양식 전 섹션 다운로드 검증용
export const INTERMEDIATE_INSPECTION_002_ID = '91110002-0001-4001-8001-000000000001';
export const INTERMEDIATE_INSPECTION_ITEM_002_A_ID = '91110002-1001-4001-8001-000000000001';
export const INTERMEDIATE_INSPECTION_ITEM_002_B_ID = '91110002-1002-4001-8001-000000000002';
export const INTERMEDIATE_INSPECTION_ITEM_002_C_ID = '91110002-1003-4001-8001-000000000003';
export const INTERMEDIATE_INSPECTION_ITEM_002_D_ID = '91110002-1004-4001-8001-000000000004';
export const INTERMEDIATE_INSPECTION_ITEM_002_E_ID = '91110002-1005-4001-8001-000000000005';
export const INTERMEDIATE_INSPECTION_EQUIPMENT_002_A_ID = '91110002-2001-4001-8001-000000000001';
export const INTERMEDIATE_INSPECTION_EQUIPMENT_002_B_ID = '91110002-2002-4001-8001-000000000002';

// inspection_result_sections — INSPECTION_002 보충 섹션 (측정환경 + 특이사항)
// ■ 측정 결과 항목 나열은 렌더러가 items SSOT로 자동 생성 — DB 섹션 불필요
export const INSPECTION_RESULT_SECTION_001_ID = '93330001-0001-4001-8001-000000000001';
export const INSPECTION_RESULT_SECTION_002_ID = '93330001-0002-4001-8001-000000000002';

// =============================================================================
// SELF INSPECTIONS (UL-QP-18-05)
// Pattern: 9555NNNN-...
// =============================================================================

export const SELF_INSPECTION_001_ID = '95550001-0001-4001-8001-000000000001';
export const SELF_INSPECTION_ITEM_001_A_ID = '95550001-1001-4001-8001-000000000001';
export const SELF_INSPECTION_ITEM_001_B_ID = '95550001-1002-4001-8001-000000000002';
export const SELF_INSPECTION_ITEM_001_C_ID = '95550001-1003-4001-8001-000000000003';
export const SELF_INSPECTION_ITEM_001_D_ID = '95550001-1004-4001-8001-000000000004';

// =============================================================================
// TEAM SPECIAL ID (placeholder team for test users)
// =============================================================================

export const TEAM_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000099';
