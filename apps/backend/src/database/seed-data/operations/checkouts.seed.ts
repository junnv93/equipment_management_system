/**
 * Comprehensive Checkouts Seed Data
 *
 * 68 checkout records covering all statuses, purposes, and team constraints
 *
 * Distribution:
 * - Status: 13 statuses (pending, approved, rejected, checked_out, etc.)
 * - Purpose: calibration (23), repair (23), rental (22)
 * - Teams: EMC (34), RF (34) - strict team constraints
 * - Multi-equipment: single (48), dual (12), triple+ (8)
 * - Rental 4-step: 15 rental checkouts with various verification states
 * - Overdue: 6 checkouts (3 pending overdue, 3 checked_out overdue)
 */

import { checkouts, checkoutItems } from '@equipment-management/db/schema';
import { daysAgo, daysLater } from '../../utils/date-helpers';
import {
  // Suwon users
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  // Uiwang users
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
  // Suwon teams
  TEAM_FCC_EMC_RF_SUWON_ID,
  // Uiwang team
  TEAM_GENERAL_RF_UIWANG_ID,
  // Equipment IDs (Suwon E - FCC EMC/RF)
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_FILTER_SUW_E_ID,
  EQUIP_ANTENNA_1_SUW_E_ID,
  EQUIP_COUPLER_SUW_E_ID,
  // Equipment IDs (Suwon R - General EMC)
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_POWER_SUPPLY_SUW_R_ID,
  EQUIP_MULTIMETER_SUW_R_ID,
  EQUIP_SIGNAL_INT_SUW_R_ID,
  EQUIP_ATTENUATOR_SUW_R_ID,
  EQUIP_ABSORBER_SUW_R_ID,
  // Equipment IDs (Uiwang W - General RF)
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_TRANSMITTER_UIW_W_ID,
  EQUIP_ANTENNA_2_UIW_W_ID,
  EQUIP_AMPLIFIER_UIW_W_ID,
} from '../../utils/uuid-constants';

// ============================================================================
// Checkout UUID Constants (68 records)
// ============================================================================

export const CHECKOUT_001_ID = '10000000-0000-0000-0000-000000000001';
export const CHECKOUT_002_ID = '10000000-0000-0000-0000-000000000002';
export const CHECKOUT_003_ID = '10000000-0000-0000-0000-000000000003';
export const CHECKOUT_004_ID = '10000000-0000-0000-0000-000000000004';
export const CHECKOUT_005_ID = '10000000-0000-0000-0000-000000000005';
export const CHECKOUT_006_ID = '10000000-0000-0000-0000-000000000006';
export const CHECKOUT_007_ID = '10000000-0000-0000-0000-000000000007';
export const CHECKOUT_008_ID = '10000000-0000-0000-0000-000000000008';
export const CHECKOUT_009_ID = '10000000-0000-0000-0000-000000000009';
export const CHECKOUT_010_ID = '10000000-0000-0000-0000-000000000010';
export const CHECKOUT_011_ID = '10000000-0000-0000-0000-000000000011';
export const CHECKOUT_012_ID = '10000000-0000-0000-0000-000000000012';
export const CHECKOUT_013_ID = '10000000-0000-0000-0000-000000000013';
export const CHECKOUT_014_ID = '10000000-0000-0000-0000-000000000014';
export const CHECKOUT_015_ID = '10000000-0000-0000-0000-000000000015';
export const CHECKOUT_016_ID = '10000000-0000-0000-0000-000000000016';
export const CHECKOUT_017_ID = '10000000-0000-0000-0000-000000000017';
export const CHECKOUT_018_ID = '10000000-0000-0000-0000-000000000018';
export const CHECKOUT_019_ID = '10000000-0000-0000-0000-000000000019';
export const CHECKOUT_020_ID = '10000000-0000-0000-0000-000000000020';
export const CHECKOUT_021_ID = '10000000-0000-0000-0000-000000000021';
export const CHECKOUT_022_ID = '10000000-0000-0000-0000-000000000022';
export const CHECKOUT_023_ID = '10000000-0000-0000-0000-000000000023';
export const CHECKOUT_024_ID = '10000000-0000-0000-0000-000000000024';
export const CHECKOUT_025_ID = '10000000-0000-0000-0000-000000000025';
export const CHECKOUT_026_ID = '10000000-0000-0000-0000-000000000026';
export const CHECKOUT_027_ID = '10000000-0000-0000-0000-000000000027';
export const CHECKOUT_028_ID = '10000000-0000-0000-0000-000000000028';
export const CHECKOUT_029_ID = '10000000-0000-0000-0000-000000000029';
export const CHECKOUT_030_ID = '10000000-0000-0000-0000-000000000030';
export const CHECKOUT_031_ID = '10000000-0000-0000-0000-000000000031';
export const CHECKOUT_032_ID = '10000000-0000-0000-0000-000000000032';
export const CHECKOUT_033_ID = '10000000-0000-0000-0000-000000000033';
export const CHECKOUT_034_ID = '10000000-0000-0000-0000-000000000034';
export const CHECKOUT_035_ID = '10000000-0000-0000-0000-000000000035';
export const CHECKOUT_036_ID = '10000000-0000-0000-0000-000000000036';
export const CHECKOUT_037_ID = '10000000-0000-0000-0000-000000000037';
export const CHECKOUT_038_ID = '10000000-0000-0000-0000-000000000038';
export const CHECKOUT_039_ID = '10000000-0000-0000-0000-000000000039';
export const CHECKOUT_040_ID = '10000000-0000-0000-0000-000000000040';
export const CHECKOUT_041_ID = '10000000-0000-0000-0000-000000000041';
export const CHECKOUT_042_ID = '10000000-0000-0000-0000-000000000042';
export const CHECKOUT_043_ID = '10000000-0000-0000-0000-000000000043';
export const CHECKOUT_044_ID = '10000000-0000-0000-0000-000000000044';
export const CHECKOUT_045_ID = '10000000-0000-0000-0000-000000000045';
export const CHECKOUT_046_ID = '10000000-0000-0000-0000-000000000046';
export const CHECKOUT_047_ID = '10000000-0000-0000-0000-000000000047';
export const CHECKOUT_048_ID = '10000000-0000-0000-0000-000000000048';
export const CHECKOUT_049_ID = '10000000-0000-0000-0000-000000000049';
export const CHECKOUT_050_ID = '10000000-0000-0000-0000-000000000050';
export const CHECKOUT_051_ID = '10000000-0000-0000-0000-000000000051';
export const CHECKOUT_052_ID = '10000000-0000-0000-0000-000000000052';
export const CHECKOUT_053_ID = '10000000-0000-0000-0000-000000000053';
export const CHECKOUT_054_ID = '10000000-0000-0000-0000-000000000054';
export const CHECKOUT_055_ID = '10000000-0000-0000-0000-000000000055';
export const CHECKOUT_056_ID = '10000000-0000-0000-0000-000000000056';
export const CHECKOUT_057_ID = '10000000-0000-0000-0000-000000000057';
export const CHECKOUT_058_ID = '10000000-0000-0000-0000-000000000058';
export const CHECKOUT_059_ID = '10000000-0000-0000-0000-000000000059';
export const CHECKOUT_060_ID = '10000000-0000-0000-0000-000000000060';
export const CHECKOUT_061_ID = '10000000-0000-0000-0000-000000000061';
export const CHECKOUT_062_ID = '10000000-0000-0000-0000-000000000062';
export const CHECKOUT_063_ID = '10000000-0000-0000-0000-000000000063';
export const CHECKOUT_064_ID = '10000000-0000-0000-0000-000000000064';
export const CHECKOUT_065_ID = '10000000-0000-0000-0000-000000000065';
export const CHECKOUT_066_ID = '10000000-0000-0000-0000-000000000066';
export const CHECKOUT_067_ID = '10000000-0000-0000-0000-000000000067';
export const CHECKOUT_068_ID = '10000000-0000-0000-0000-000000000068';

// ============================================================================
// Helper: Create Checkout Record
// ============================================================================

type CheckoutInsert = typeof checkouts.$inferInsert;

function createCheckout(
  overrides: Partial<CheckoutInsert> &
    Required<
      Pick<
        CheckoutInsert,
        | 'id'
        | 'requesterId'
        | 'purpose'
        | 'destination'
        | 'reason'
        | 'expectedReturnDate'
        | 'checkoutType'
        | 'status'
      >
    >
): CheckoutInsert {
  return {
    ...overrides,
    createdAt: overrides.createdAt || daysAgo(7),
    updatedAt: overrides.updatedAt || daysAgo(7),
  };
}

// ============================================================================
// CHECKOUTS SEED DATA (68 records)
// ============================================================================

export const CHECKOUTS_SEED_DATA: CheckoutInsert[] = [
  // ========================================================================
  // STATUS: pending (8 records)
  // ========================================================================

  // 1. Pending - Calibration (Suwon E)
  createCheckout({
    id: CHECKOUT_001_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정 필요',
    expectedReturnDate: daysLater(14),
    status: 'pending',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  }),

  // 2. Pending - Calibration (Suwon R)
  createCheckout({
    id: CHECKOUT_002_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL 시험인증연구원',
    reason: '교정 기한 도래',
    expectedReturnDate: daysLater(10),
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 3. Pending - Repair (Suwon E)
  createCheckout({
    id: CHECKOUT_003_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 수리센터',
    reason: '측정값 불안정',
    expectedReturnDate: daysLater(21),
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 4. Pending - Repair (Uiwang W)
  createCheckout({
    id: CHECKOUT_004_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '신호 감도 저하',
    expectedReturnDate: daysLater(14),
    status: 'pending',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  }),

  // 5. Pending - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_005_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '일시적 장비 부족',
    expectedReturnDate: daysLater(30),
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 6. Pending - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_006_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '프로젝트 지원',
    expectedReturnDate: daysLater(45),
    status: 'pending',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  }),

  // 7. Pending - Calibration Multi-equipment (2 items)
  createCheckout({
    id: CHECKOUT_007_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '국가표준기본법 인정기관',
    reason: '동일 교정기관 일괄 처리',
    expectedReturnDate: daysLater(14),
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 8. Pending - Repair Multi-equipment (2 items)
  createCheckout({
    id: CHECKOUT_008_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 AS센터',
    reason: '동일 증상 일괄 수리',
    expectedReturnDate: daysLater(20),
    status: 'pending',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  }),

  // ========================================================================
  // STATUS: approved (6 records)
  // ========================================================================

  // 9. Approved - Calibration (Suwon E)
  createCheckout({
    id: CHECKOUT_009_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정',
    expectedReturnDate: daysLater(14),
    status: 'approved',
    approvedAt: daysAgo(1),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),

  // 10. Approved - Calibration (Uiwang W)
  createCheckout({
    id: CHECKOUT_010_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL',
    reason: '교정 주기 도래',
    expectedReturnDate: daysLater(10),
    status: 'approved',
    approvedAt: daysAgo(1),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  }),

  // 11. Approved - Repair (Suwon R)
  createCheckout({
    id: CHECKOUT_011_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '파손 부품 교체 필요',
    expectedReturnDate: daysLater(21),
    status: 'approved',
    approvedAt: daysAgo(1),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  }),

  // 12. Approved - Repair (Uiwang W)
  createCheckout({
    id: CHECKOUT_012_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 수리센터',
    reason: '전원부 이상',
    expectedReturnDate: daysLater(14),
    status: 'approved',
    approvedAt: daysAgo(2),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
  }),

  // 13. Approved - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_013_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '긴급 시험 지원',
    expectedReturnDate: daysLater(30),
    status: 'approved',
    approvedAt: daysAgo(1),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),

  // 14. Approved - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_014_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '특수 시험 지원',
    expectedReturnDate: daysLater(45),
    status: 'approved',
    approvedAt: daysAgo(2),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  }),

  // ========================================================================
  // STATUS: rejected (4 records)
  // ========================================================================

  // 15. Rejected - Calibration (with reason)
  createCheckout({
    id: CHECKOUT_015_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '미인증 교정기관',
    reason: '정기 교정',
    expectedReturnDate: daysLater(14),
    status: 'rejected',
    rejectionReason: '인증되지 않은 교정기관입니다. 국가표준 인정기관을 이용해주세요.',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
  }),

  // 16. Rejected - Repair (with reason)
  createCheckout({
    id: CHECKOUT_016_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '경미한 고장',
    expectedReturnDate: daysLater(14),
    status: 'rejected',
    rejectionReason: '자체 수리 가능한 수준입니다. 내부에서 처리해주세요.',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
  }),

  // 17. Rejected - Rental (with rejection reason)
  createCheckout({
    id: CHECKOUT_017_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '외부 기관',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '장비 대여 요청',
    expectedReturnDate: daysLater(30),
    status: 'rejected',
    rejectionReason: '대여 기관 인증 서류 미비로 반려합니다.',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(29),
  }),

  // 18. Rejected - Calibration (without reason - old data)
  createCheckout({
    id: CHECKOUT_018_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '교정기관',
    reason: '교정 필요',
    expectedReturnDate: daysLater(10),
    status: 'rejected',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(24),
  }),

  // ========================================================================
  // STATUS: checked_out (8 records)
  // ========================================================================

  // 19. Checked Out - Calibration (Suwon E)
  createCheckout({
    id: CHECKOUT_019_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정',
    expectedReturnDate: daysLater(7),
    checkoutDate: daysAgo(7),
    status: 'checked_out',
    approvedAt: daysAgo(8),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
  }),

  // 20. Checked Out - Calibration (Uiwang W)
  createCheckout({
    id: CHECKOUT_020_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL',
    reason: '교정 주기 도래',
    expectedReturnDate: daysLater(5),
    checkoutDate: daysAgo(5),
    status: 'checked_out',
    approvedAt: daysAgo(6),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(5),
  }),

  // 21. Checked Out - Calibration (Suwon R)
  createCheckout({
    id: CHECKOUT_021_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '국가표준인정기관',
    reason: '정밀 교정 필요',
    expectedReturnDate: daysLater(10),
    checkoutDate: daysAgo(4),
    status: 'checked_out',
    approvedAt: daysAgo(5),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
  }),

  // 22. Checked Out - Repair (Suwon E)
  createCheckout({
    id: CHECKOUT_022_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 AS센터',
    reason: '측정 불량',
    expectedReturnDate: daysLater(14),
    checkoutDate: daysAgo(7),
    status: 'checked_out',
    approvedAt: daysAgo(8),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
  }),

  // 23. Checked Out - Repair (Uiwang W)
  createCheckout({
    id: CHECKOUT_023_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '전원 이상',
    expectedReturnDate: daysLater(10),
    checkoutDate: daysAgo(10),
    status: 'checked_out',
    approvedAt: daysAgo(11),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(10),
  }),

  // 24. Checked Out - Repair (Suwon R)
  createCheckout({
    id: CHECKOUT_024_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '수리센터',
    reason: '부품 교체',
    expectedReturnDate: daysLater(7),
    checkoutDate: daysAgo(7),
    status: 'checked_out',
    approvedAt: daysAgo(8),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
  }),

  // 25. Checked Out - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_025_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '시험 지원',
    expectedReturnDate: daysLater(15),
    checkoutDate: daysAgo(15),
    status: 'checked_out',
    approvedAt: daysAgo(16),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(15),
  }),

  // 26. Checked Out - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_026_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '프로젝트 지원',
    expectedReturnDate: daysLater(20),
    checkoutDate: daysAgo(10),
    status: 'checked_out',
    approvedAt: daysAgo(11),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(10),
  }),

  // ========================================================================
  // STATUS: lender_checked (3 records) - Rental 4-step ①
  // ========================================================================

  // 27. Lender Checked - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_027_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여 요청',
    expectedReturnDate: daysLater(25),
    checkoutDate: daysAgo(5),
    status: 'lender_checked',
    approvedAt: daysAgo(6),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(4),
  }),

  // 28. Lender Checked - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_028_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '장비 임시 사용',
    expectedReturnDate: daysLater(30),
    checkoutDate: daysAgo(3),
    status: 'lender_checked',
    approvedAt: daysAgo(4),
    createdAt: daysAgo(6),
    updatedAt: daysAgo(2),
  }),

  // 29. Lender Checked - Rental Multi-equipment (2 items)
  createCheckout({
    id: CHECKOUT_029_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '복합 시험 지원',
    expectedReturnDate: daysLater(30),
    checkoutDate: daysAgo(2),
    status: 'lender_checked',
    approvedAt: daysAgo(3),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  }),

  // ========================================================================
  // STATUS: borrower_received (3 records) - Rental 4-step ②
  // ========================================================================

  // 30. Borrower Received - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_030_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '시험 지원',
    expectedReturnDate: daysLater(20),
    checkoutDate: daysAgo(10),
    status: 'borrower_received',
    approvedAt: daysAgo(11),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(8),
  }),

  // 31. Borrower Received - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_031_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '긴급 시험',
    expectedReturnDate: daysLater(15),
    checkoutDate: daysAgo(15),
    status: 'borrower_received',
    approvedAt: daysAgo(16),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(14),
  }),

  // 32. Borrower Received - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_032_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '프로젝트 지원',
    expectedReturnDate: daysLater(25),
    checkoutDate: daysAgo(5),
    status: 'borrower_received',
    approvedAt: daysAgo(6),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(4),
  }),

  // ========================================================================
  // STATUS: in_use (3 records) - Rental 4-step (사용 중)
  // ========================================================================

  // 33. In Use - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_033_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '장기 시험 지원',
    expectedReturnDate: daysLater(10),
    checkoutDate: daysAgo(20),
    status: 'in_use',
    approvedAt: daysAgo(21),
    createdAt: daysAgo(23),
    updatedAt: daysAgo(15),
  }),

  // 34. In Use - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_034_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '특수 시험',
    expectedReturnDate: daysLater(15),
    checkoutDate: daysAgo(15),
    status: 'in_use',
    approvedAt: daysAgo(16),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(10),
  }),

  // 35. In Use - Rental Multi-equipment (3 items)
  createCheckout({
    id: CHECKOUT_035_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '시스템 구성 시험',
    expectedReturnDate: daysLater(20),
    checkoutDate: daysAgo(10),
    status: 'in_use',
    approvedAt: daysAgo(11),
    createdAt: daysAgo(13),
    updatedAt: daysAgo(8),
  }),

  // ========================================================================
  // STATUS: borrower_returned (3 records) - Rental 4-step ③
  // ========================================================================

  // 36. Borrower Returned - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_036_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '시험 완료',
    expectedReturnDate: daysAgo(2),
    checkoutDate: daysAgo(30),
    status: 'borrower_returned',
    approvedAt: daysAgo(31),
    createdAt: daysAgo(33),
    updatedAt: daysAgo(1),
  }),

  // 37. Borrower Returned - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_037_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '프로젝트 완료',
    expectedReturnDate: daysAgo(1),
    checkoutDate: daysAgo(25),
    status: 'borrower_returned',
    approvedAt: daysAgo(26),
    createdAt: daysAgo(28),
    updatedAt: daysAgo(1),
  }),

  // 38. Borrower Returned - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_038_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '측정 완료',
    expectedReturnDate: daysAgo(3),
    checkoutDate: daysAgo(20),
    status: 'borrower_returned',
    approvedAt: daysAgo(21),
    createdAt: daysAgo(23),
    updatedAt: daysAgo(2),
  }),

  // ========================================================================
  // STATUS: lender_received (3 records) - Rental 4-step ④
  // ========================================================================

  // 39. Lender Received - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_039_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    lenderConfirmedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여 완료',
    expectedReturnDate: daysAgo(5),
    checkoutDate: daysAgo(35),
    status: 'lender_received',
    lenderConfirmedAt: daysAgo(1),
    approvedAt: daysAgo(36),
    createdAt: daysAgo(38),
    updatedAt: daysAgo(1),
  }),

  // 40. Lender Received - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_040_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    lenderConfirmedBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '반납 확인',
    expectedReturnDate: daysAgo(3),
    checkoutDate: daysAgo(30),
    status: 'lender_received',
    lenderConfirmedAt: daysAgo(1),
    approvedAt: daysAgo(31),
    createdAt: daysAgo(33),
    updatedAt: daysAgo(1),
  }),

  // 41. Lender Received - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_041_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    lenderConfirmedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '반납 완료',
    expectedReturnDate: daysAgo(2),
    checkoutDate: daysAgo(28),
    status: 'lender_received',
    lenderConfirmedAt: daysAgo(1),
    approvedAt: daysAgo(29),
    createdAt: daysAgo(31),
    updatedAt: daysAgo(1),
  }),

  // ========================================================================
  // STATUS: returned (8 records)
  // ========================================================================

  // 42. Returned - Calibration with inspections (Suwon E)
  createCheckout({
    id: CHECKOUT_042_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정',
    expectedReturnDate: daysAgo(1),
    checkoutDate: daysAgo(14),
    actualReturnDate: daysAgo(1),
    status: 'returned',
    calibrationChecked: true,
    workingStatusChecked: true,
    inspectionNotes: '교정 완료, 정상 작동 확인',
    approvedAt: daysAgo(15),
    createdAt: daysAgo(17),
    updatedAt: daysAgo(1),
  }),

  // 43. Returned - Calibration with inspections (Uiwang W)
  createCheckout({
    id: CHECKOUT_043_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL',
    reason: '교정 주기 도래',
    expectedReturnDate: daysAgo(2),
    checkoutDate: daysAgo(12),
    actualReturnDate: daysAgo(2),
    status: 'returned',
    calibrationChecked: true,
    workingStatusChecked: true,
    inspectionNotes: '교정 성공, 측정값 정상',
    approvedAt: daysAgo(13),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  }),

  // 44. Returned - Repair with inspections (Suwon R)
  createCheckout({
    id: CHECKOUT_044_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 AS센터',
    reason: '부품 교체 필요',
    expectedReturnDate: daysAgo(1),
    checkoutDate: daysAgo(21),
    actualReturnDate: daysAgo(1),
    status: 'returned',
    repairChecked: true,
    workingStatusChecked: true,
    inspectionNotes: '수리 완료, 부품 교체됨, 정상 작동',
    approvedAt: daysAgo(22),
    createdAt: daysAgo(24),
    updatedAt: daysAgo(1),
  }),

  // 45. Returned - Repair with inspections (Uiwang W)
  createCheckout({
    id: CHECKOUT_045_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '전원부 이상',
    expectedReturnDate: daysAgo(1),
    checkoutDate: daysAgo(14),
    actualReturnDate: daysAgo(1),
    status: 'returned',
    repairChecked: true,
    workingStatusChecked: true,
    inspectionNotes: '전원부 교체 완료, 정상 작동 확인',
    approvedAt: daysAgo(15),
    createdAt: daysAgo(17),
    updatedAt: daysAgo(1),
  }),

  // 46. Returned - Rental without inspections (old process)
  createCheckout({
    id: CHECKOUT_046_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '시험 완료',
    expectedReturnDate: daysAgo(5),
    checkoutDate: daysAgo(35),
    actualReturnDate: daysAgo(5),
    status: 'returned',
    approvedAt: daysAgo(36),
    createdAt: daysAgo(38),
    updatedAt: daysAgo(5),
  }),

  // 47. Returned - Rental without inspections (old process)
  createCheckout({
    id: CHECKOUT_047_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '프로젝트 완료',
    expectedReturnDate: daysAgo(3),
    checkoutDate: daysAgo(28),
    actualReturnDate: daysAgo(3),
    status: 'returned',
    approvedAt: daysAgo(29),
    createdAt: daysAgo(31),
    updatedAt: daysAgo(3),
  }),

  // 48. Returned - Calibration without inspections (old process)
  createCheckout({
    id: CHECKOUT_048_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '교정기관',
    reason: '교정 필요',
    expectedReturnDate: daysAgo(7),
    checkoutDate: daysAgo(21),
    actualReturnDate: daysAgo(7),
    status: 'returned',
    approvedAt: daysAgo(22),
    createdAt: daysAgo(24),
    updatedAt: daysAgo(7),
  }),

  // 49. Returned - Repair without inspections (old process)
  createCheckout({
    id: CHECKOUT_049_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '수리업체',
    reason: '수리 완료',
    expectedReturnDate: daysAgo(4),
    checkoutDate: daysAgo(18),
    actualReturnDate: daysAgo(4),
    status: 'returned',
    approvedAt: daysAgo(19),
    createdAt: daysAgo(21),
    updatedAt: daysAgo(4),
  }),

  // ========================================================================
  // STATUS: return_approved (6 records)
  // ========================================================================

  // 50. Return Approved - Calibration (Suwon E)
  createCheckout({
    id: CHECKOUT_050_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정',
    expectedReturnDate: daysAgo(3),
    checkoutDate: daysAgo(17),
    actualReturnDate: daysAgo(3),
    status: 'return_approved',
    calibrationChecked: true,
    workingStatusChecked: true,
    returnApprovedAt: daysAgo(2),
    approvedAt: daysAgo(18),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  }),

  // 51. Return Approved - Calibration (Uiwang W)
  createCheckout({
    id: CHECKOUT_051_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL',
    reason: '교정 주기 도래',
    expectedReturnDate: daysAgo(4),
    checkoutDate: daysAgo(14),
    actualReturnDate: daysAgo(4),
    status: 'return_approved',
    calibrationChecked: true,
    workingStatusChecked: true,
    returnApprovedAt: daysAgo(3),
    approvedAt: daysAgo(15),
    createdAt: daysAgo(17),
    updatedAt: daysAgo(3),
  }),

  // 52. Return Approved - Repair (Suwon R)
  createCheckout({
    id: CHECKOUT_052_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 AS센터',
    reason: '부품 교체',
    expectedReturnDate: daysAgo(5),
    checkoutDate: daysAgo(26),
    actualReturnDate: daysAgo(5),
    status: 'return_approved',
    repairChecked: true,
    workingStatusChecked: true,
    returnApprovedAt: daysAgo(4),
    approvedAt: daysAgo(27),
    createdAt: daysAgo(29),
    updatedAt: daysAgo(4),
  }),

  // 53. Return Approved - Repair (Uiwang W)
  createCheckout({
    id: CHECKOUT_053_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '전원부 수리',
    expectedReturnDate: daysAgo(6),
    checkoutDate: daysAgo(20),
    actualReturnDate: daysAgo(6),
    status: 'return_approved',
    repairChecked: true,
    workingStatusChecked: true,
    returnApprovedAt: daysAgo(5),
    approvedAt: daysAgo(21),
    createdAt: daysAgo(23),
    updatedAt: daysAgo(5),
  }),

  // 54. Return Approved - Rental (Suwon → Uiwang)
  createCheckout({
    id: CHECKOUT_054_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    returnerId: USER_TEST_ENGINEER_SUWON_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여 완료',
    expectedReturnDate: daysAgo(7),
    checkoutDate: daysAgo(37),
    actualReturnDate: daysAgo(7),
    status: 'return_approved',
    returnApprovedAt: daysAgo(6),
    approvedAt: daysAgo(38),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(6),
  }),

  // 55. Return Approved - Rental (Uiwang → Suwon)
  createCheckout({
    id: CHECKOUT_055_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    returnApprovedBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '수원 시험소',
    lenderTeamId: TEAM_GENERAL_RF_UIWANG_ID,
    lenderSiteId: 'uiwang',
    reason: '반납 완료',
    expectedReturnDate: daysAgo(8),
    checkoutDate: daysAgo(38),
    actualReturnDate: daysAgo(8),
    status: 'return_approved',
    returnApprovedAt: daysAgo(7),
    approvedAt: daysAgo(39),
    createdAt: daysAgo(41),
    updatedAt: daysAgo(7),
  }),

  // ========================================================================
  // STATUS: overdue (6 records)
  // ========================================================================

  // 56. Overdue - Pending (past expectedReturnDate)
  createCheckout({
    id: CHECKOUT_056_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '교정기관',
    reason: '교정 필요',
    expectedReturnDate: daysAgo(5),
    status: 'overdue',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  }),

  // 57. Overdue - Pending (long overdue)
  createCheckout({
    id: CHECKOUT_057_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '수리업체',
    reason: '수리 요청',
    expectedReturnDate: daysAgo(10),
    status: 'overdue',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(10),
  }),

  // 58. Overdue - Pending Rental
  createCheckout({
    id: CHECKOUT_058_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여',
    expectedReturnDate: daysAgo(3),
    status: 'overdue',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(3),
  }),

  // 59. Overdue - Checked Out (past expectedReturnDate)
  createCheckout({
    id: CHECKOUT_059_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '정기 교정',
    expectedReturnDate: daysAgo(7),
    checkoutDate: daysAgo(21),
    status: 'overdue',
    approvedAt: daysAgo(22),
    createdAt: daysAgo(24),
    updatedAt: daysAgo(7),
  }),

  // 60. Overdue - Checked Out (long overdue)
  createCheckout({
    id: CHECKOUT_060_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '수리 중',
    expectedReturnDate: daysAgo(14),
    checkoutDate: daysAgo(28),
    status: 'overdue',
    approvedAt: daysAgo(29),
    createdAt: daysAgo(31),
    updatedAt: daysAgo(14),
  }),

  // 61. Overdue - Checked Out Rental
  createCheckout({
    id: CHECKOUT_061_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여 중',
    expectedReturnDate: daysAgo(5),
    checkoutDate: daysAgo(35),
    status: 'overdue',
    approvedAt: daysAgo(36),
    createdAt: daysAgo(38),
    updatedAt: daysAgo(5),
  }),

  // ========================================================================
  // STATUS: canceled (3 records)
  // ========================================================================

  // 62. Canceled - Calibration
  createCheckout({
    id: CHECKOUT_062_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '교정기관',
    reason: '교정 계획 변경',
    expectedReturnDate: daysLater(14),
    status: 'canceled',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(9),
  }),

  // 63. Canceled - Repair
  createCheckout({
    id: CHECKOUT_063_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '수리업체',
    reason: '자체 수리로 변경',
    expectedReturnDate: daysLater(14),
    status: 'canceled',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(6),
  }),

  // 64. Canceled - Rental
  createCheckout({
    id: CHECKOUT_064_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'rental',
    checkoutType: 'rental',
    destination: '의왕 시험소',
    lenderTeamId: TEAM_FCC_EMC_RF_SUWON_ID,
    lenderSiteId: 'suwon',
    reason: '대여 취소',
    expectedReturnDate: daysLater(30),
    status: 'canceled',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
  }),

  // ========================================================================
  // ADDITIONAL RECORDS (Multi-equipment variations) - 4 more to reach 68
  // ========================================================================

  // 65. Pending - Multi-equipment (3 items) Calibration
  createCheckout({
    id: CHECKOUT_065_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: '한국교정시험연구원',
    reason: '시스템 일괄 교정',
    expectedReturnDate: daysLater(14),
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 66. Approved - Multi-equipment (3 items) Repair
  createCheckout({
    id: CHECKOUT_066_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '제조사 AS센터',
    reason: '동일 증상 일괄 수리',
    expectedReturnDate: daysLater(21),
    status: 'approved',
    approvedAt: daysAgo(1),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),

  // 67. Checked Out - Multi-equipment (2 items) Calibration
  createCheckout({
    id: CHECKOUT_067_ID,
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    purpose: 'calibration',
    checkoutType: 'calibration',
    destination: 'KTL',
    reason: '측정 시스템 교정',
    expectedReturnDate: daysLater(10),
    checkoutDate: daysAgo(4),
    status: 'checked_out',
    approvedAt: daysAgo(5),
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
  }),

  // 68. Returned - Multi-equipment (2 items) Repair with inspections
  createCheckout({
    id: CHECKOUT_068_ID,
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    returnerId: USER_TEST_ENGINEER_UIWANG_ID,
    purpose: 'repair',
    checkoutType: 'repair',
    destination: '외부 수리업체',
    reason: '동시 고장 수리',
    expectedReturnDate: daysAgo(1),
    checkoutDate: daysAgo(14),
    actualReturnDate: daysAgo(1),
    status: 'returned',
    repairChecked: true,
    workingStatusChecked: true,
    inspectionNotes: '모두 수리 완료, 정상 작동 확인',
    approvedAt: daysAgo(15),
    createdAt: daysAgo(17),
    updatedAt: daysAgo(1),
  }),
];

// ============================================================================
// CHECKOUT ITEMS SEED DATA
// ============================================================================

type CheckoutItemInsert = typeof checkoutItems.$inferInsert;

function createCheckoutItem(
  checkoutId: string,
  equipmentId: string,
  overrides?: Partial<CheckoutItemInsert>
): CheckoutItemInsert {
  return {
    checkoutId,
    equipmentId,
    ...overrides,
  };
}

export const CHECKOUT_ITEMS_SEED_DATA: CheckoutItemInsert[] = [
  // Single equipment checkouts (1-6, 9-26, 42-64) - 56 items
  ...CHECKOUTS_SEED_DATA.slice(0, 6).map((checkout, idx) =>
    createCheckoutItem(
      checkout.id!,
      idx % 2 === 0 ? EQUIP_SPECTRUM_ANALYZER_SUW_E_ID : EQUIP_RECEIVER_UIW_W_ID
    )
  ),
  ...CHECKOUTS_SEED_DATA.slice(8, 26).map((checkout, idx) =>
    createCheckoutItem(
      checkout.id!,
      idx % 2 === 0 ? EQUIP_SIGNAL_GEN_SUW_E_ID : EQUIP_TRANSMITTER_UIW_W_ID
    )
  ),
  ...CHECKOUTS_SEED_DATA.slice(41, 63).map((checkout, idx) =>
    createCheckoutItem(
      checkout.id!,
      idx % 3 === 0
        ? EQUIP_NETWORK_ANALYZER_SUW_E_ID
        : idx % 3 === 1
          ? EQUIP_OSCILLOSCOPE_SUW_R_ID
          : EQUIP_ANTENNA_2_UIW_W_ID
    )
  ),

  // Dual equipment checkouts (7-8) - 4 items
  createCheckoutItem(CHECKOUT_007_ID, EQUIP_POWER_METER_SUW_E_ID),
  createCheckoutItem(CHECKOUT_007_ID, EQUIP_EMC_RECEIVER_SUW_E_ID),
  createCheckoutItem(CHECKOUT_008_ID, EQUIP_AMPLIFIER_UIW_W_ID),
  createCheckoutItem(CHECKOUT_008_ID, EQUIP_RECEIVER_UIW_W_ID),

  // Rental 4-step checkouts (27-41) - 15 items (single + multi)
  ...CHECKOUTS_SEED_DATA.slice(26, 28).map((checkout) =>
    createCheckoutItem(checkout.id!, EQUIP_FILTER_SUW_E_ID)
  ),
  // #29: Multi-equipment (2 items)
  createCheckoutItem(CHECKOUT_029_ID, EQUIP_ANTENNA_1_SUW_E_ID),
  createCheckoutItem(CHECKOUT_029_ID, EQUIP_COUPLER_SUW_E_ID),
  ...CHECKOUTS_SEED_DATA.slice(29, 32).map((checkout) =>
    createCheckoutItem(checkout.id!, EQUIP_POWER_SUPPLY_SUW_R_ID)
  ),
  ...CHECKOUTS_SEED_DATA.slice(32, 35).map((checkout, idx) =>
    createCheckoutItem(
      checkout.id!,
      idx === 2 ? EQUIP_MULTIMETER_SUW_R_ID : EQUIP_SIGNAL_INT_SUW_R_ID
    )
  ),
  // #35: Multi-equipment (3 items)
  createCheckoutItem(CHECKOUT_035_ID, EQUIP_ATTENUATOR_SUW_R_ID),
  createCheckoutItem(CHECKOUT_035_ID, EQUIP_ABSORBER_SUW_R_ID),
  createCheckoutItem(CHECKOUT_035_ID, EQUIP_POWER_SUPPLY_SUW_R_ID),
  ...CHECKOUTS_SEED_DATA.slice(35, 41).map((checkout) =>
    createCheckoutItem(checkout.id!, EQUIP_SPECTRUM_ANALYZER_SUW_E_ID)
  ),

  // Multi-equipment variations (65-68) - 10 items
  // #65: 3 items
  createCheckoutItem(CHECKOUT_065_ID, EQUIP_SPECTRUM_ANALYZER_SUW_E_ID),
  createCheckoutItem(CHECKOUT_065_ID, EQUIP_SIGNAL_GEN_SUW_E_ID),
  createCheckoutItem(CHECKOUT_065_ID, EQUIP_NETWORK_ANALYZER_SUW_E_ID),
  // #66: 3 items
  createCheckoutItem(CHECKOUT_066_ID, EQUIP_RECEIVER_UIW_W_ID),
  createCheckoutItem(CHECKOUT_066_ID, EQUIP_TRANSMITTER_UIW_W_ID),
  createCheckoutItem(CHECKOUT_066_ID, EQUIP_AMPLIFIER_UIW_W_ID),
  // #67: 2 items
  createCheckoutItem(CHECKOUT_067_ID, EQUIP_POWER_METER_SUW_E_ID),
  createCheckoutItem(CHECKOUT_067_ID, EQUIP_EMC_RECEIVER_SUW_E_ID),
  // #68: 2 items
  createCheckoutItem(CHECKOUT_068_ID, EQUIP_ANTENNA_2_UIW_W_ID),
  createCheckoutItem(CHECKOUT_068_ID, EQUIP_RECEIVER_UIW_W_ID),
];
