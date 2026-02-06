/**
 * Disposal Workflow E2E Test - Equipment Seed Data
 * ================================================
 *
 * 21개 장비 (5개 그룹별 독립 장비):
 * - Group A: 권한 검증 (8개)
 * - Group B: 전체 워크플로우 (1개, sequential reuse)
 * - Group C: 반려 시나리오 (4개)
 * - Group D: 예외 처리 (5개)
 * - Group E: UI/UX & Accessibility (3개)
 */

import { equipment } from '@equipment-management/db/schema';
import {
  // Teams
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,

  // Equipment UUIDs (Group A: Permissions)
  EQUIP_DISPOSAL_PERM_A1,
  EQUIP_DISPOSAL_PERM_A2,
  EQUIP_DISPOSAL_PERM_A3,
  EQUIP_DISPOSAL_PERM_A4,
  EQUIP_DISPOSAL_PERM_A5,
  EQUIP_DISPOSAL_PERM_A6,
  EQUIP_DISPOSAL_PERM_A7,
  EQUIP_DISPOSAL_PERM_A8,

  // Equipment UUIDs (Group B: Full Workflow)
  EQUIP_DISPOSAL_WORKFLOW,

  // Equipment UUIDs (Group C: Rejection)
  EQUIP_DISPOSAL_REJ_C1,
  EQUIP_DISPOSAL_REJ_C2,
  EQUIP_DISPOSAL_REJ_C3,
  EQUIP_DISPOSAL_REJ_C4,

  // Equipment UUIDs (Group D: Exceptions)
  EQUIP_DISPOSAL_EXC_D1,
  EQUIP_DISPOSAL_EXC_D2,
  EQUIP_DISPOSAL_EXC_D3,
  EQUIP_DISPOSAL_EXC_D4,
  EQUIP_DISPOSAL_EXC_D5,

  // Equipment UUIDs (Group E: UI/UX)
  EQUIP_DISPOSAL_UI_E1,
  EQUIP_DISPOSAL_UI_E2,
  EQUIP_DISPOSAL_UI_E3,
} from '../../utils/uuid-constants';

// 공통 날짜 (과거 시점)
const PAST_DATE = new Date('2025-01-01');
const CALIBRATION_DATE = new Date('2024-12-01');
const NEXT_CALIBRATION = new Date('2026-12-01');

type NewEquipment = typeof equipment.$inferInsert;

// Helper function to create equipment with common defaults
function createDisposalEquipment(
  id: string,
  name: string,
  managementNumber: string,
  teamId: string,
  site: 'suwon' | 'uiwang' | 'pyeongtaek',
  status: string,
  overrides?: Partial<NewEquipment>
): NewEquipment {
  const [siteCode, classCode, serialNum] = [
    managementNumber.substring(0, 3),
    managementNumber.charAt(4),
    parseInt(managementNumber.substring(5), 10),
  ];

  return {
    id,
    name,
    managementNumber,
    siteCode,
    classificationCode: classCode,
    managementSerialNumber: serialNum,
    teamId,
    site,
    status,
    calibrationMethod: 'external_calibration',
    lastCalibrationDate: CALIBRATION_DATE,
    nextCalibrationDate: NEXT_CALIBRATION,
    calibrationCycle: 12,
    calibrationRequired: 'required',
    specMatch: 'match',
    isActive: status !== 'disposed',
    approvalStatus: 'approved',
    location: `${site.toUpperCase()} Lab`,
    modelName: name,
    manufacturer: 'Generic Manufacturer',
    purchaseDate: PAST_DATE,
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
    ...overrides,
  };
}

// =============================================================================
// GROUP A: 권한 검증 (8 equipment)
// =============================================================================

export const DISPOSAL_EQUIPMENT_GROUP_A: NewEquipment[] = [
  // A1: available (test_engineer 테스트)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A1,
    '[Disposal Test A1] 스펙트럼 분석기',
    'SUW-E2026',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'FSW-26',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A1-001',
      location: 'SUW-E-101',
      price: 50000000,
    }
  ),

  // A2: available (technical_manager 테스트)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A2,
    '[Disposal Test A2] 신호 발생기',
    'SUW-E2027',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'SMW-200A',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A2-001',
      location: 'SUW-E-102',
      price: 45000000,
    }
  ),

  // A3: available (lab_manager 테스트)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A3,
    '[Disposal Test A3] 네트워크 분석기',
    'SUW-E2028',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'ZNB-40',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A3-001',
      location: 'SUW-E-103',
      price: 60000000,
    }
  ),

  // A4: pending_disposal (reviewStatus=pending)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A4,
    '[Disposal Test A4] 파워 미터',
    'SUW-E2029',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'NRP-Z11',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A4-001',
      location: 'SUW-E-104',
      price: 8000000,
    }
  ),

  // A5: pending_disposal (reviewStatus=reviewed)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A5,
    '[Disposal Test A5] EMC 수신기',
    'SUW-E2030',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'ESRP-7',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A5-001',
      location: 'SUW-E-105',
      price: 30000000,
    }
  ),

  // A6: disposed
  // Note: isActive=true because disposed equipment must remain queryable for audit/history
  // The 'disposed' status itself indicates the equipment is no longer in active use
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A6,
    '[Disposal Test A6] 감쇠기',
    'SUW-E2031',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'disposed',
    {
      modelName: 'ATT-50-3G',
      manufacturer: 'Mini-Circuits',
      serialNumber: 'DISP-A6-001',
      location: 'SUW-E-106',
      price: 2000000,
      isActive: true,
    }
  ),

  // A7: pending_disposal (Uiwang team)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A7,
    '[Disposal Test A7] RF 안테나',
    'UIW-W2001',
    TEAM_GENERAL_RF_UIWANG_ID,
    'uiwang',
    'pending_disposal',
    {
      modelName: 'HG2400-15',
      manufacturer: 'L-Com',
      serialNumber: 'DISP-A7-001',
      location: 'UIW-W-201',
      price: 3000000,
    }
  ),

  // A8: available (isShared=true)
  createDisposalEquipment(
    EQUIP_DISPOSAL_PERM_A8,
    '[Disposal Test A8] 공용 오실로스코프',
    'SUW-E2032',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'RTO2044',
      manufacturer: 'Rohde & Schwarz',
      serialNumber: 'DISP-A8-001',
      location: 'SUW-E-107',
      price: 70000000,
      isShared: true, // ★ 공용장비: 폐기 요청 불가
    }
  ),
];

// =============================================================================
// GROUP B: 전체 워크플로우 (1 equipment, sequential reuse)
// =============================================================================

export const DISPOSAL_EQUIPMENT_GROUP_B: NewEquipment[] = [
  createDisposalEquipment(
    EQUIP_DISPOSAL_WORKFLOW,
    '[Disposal Test B - Workflow] 주파수 카운터',
    'SUW-E2033',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'FC-5340A',
      manufacturer: 'Keysight',
      serialNumber: 'DISP-WF-001',
      location: 'SUW-E-108',
      price: 15000000,
    }
  ),
];

// =============================================================================
// GROUP C: 반려 시나리오 (4 equipment)
// =============================================================================

export const DISPOSAL_EQUIPMENT_GROUP_C: NewEquipment[] = [
  // C1: pending_disposal (reviewStatus=pending, review rejection test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_REJ_C1,
    '[Disposal Test C1] 전압계 (검토 반려)',
    'SUW-E2034',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'DMM-7510',
      manufacturer: 'Keithley',
      serialNumber: 'DISP-C1-001',
      location: 'SUW-E-109',
      price: 12000000,
    }
  ),

  // C2: pending_disposal (reviewStatus=reviewed, approval rejection test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_REJ_C2,
    '[Disposal Test C2] 전원 공급기 (승인 반려)',
    'SUW-E2035',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'E36312A',
      manufacturer: 'Keysight',
      serialNumber: 'DISP-C2-001',
      location: 'SUW-E-110',
      price: 8000000,
    }
  ),

  // C3: pending_disposal (validation test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_REJ_C3,
    '[Disposal Test C3] 멀티미터 (검증)',
    'SUW-E2036',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: '34461A',
      manufacturer: 'Keysight',
      serialNumber: 'DISP-C3-001',
      location: 'SUW-E-111',
      price: 5000000,
    }
  ),

  // C4: pending_disposal (cancel test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_REJ_C4,
    '[Disposal Test C4] 함수 발생기 (취소)',
    'SUW-E2037',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: '33600A',
      manufacturer: 'Keysight',
      serialNumber: 'DISP-C4-001',
      location: 'SUW-E-112',
      price: 6000000,
    }
  ),
];

// =============================================================================
// GROUP D: 예외 처리 (5 equipment)
// =============================================================================

export const DISPOSAL_EQUIPMENT_GROUP_D: NewEquipment[] = [
  // D1: pending_disposal (duplicate request test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_EXC_D1,
    '[Disposal Test D1] 센서 (중복)',
    'SUW-E2038',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'TX-1000',
      manufacturer: 'Generic',
      serialNumber: 'DISP-D1-001',
      location: 'SUW-E-113',
      price: 3000000,
    }
  ),

  // D2: available (validation test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_EXC_D2,
    '[Disposal Test D2] 케이블 (검증)',
    'SUW-E2039',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    {
      modelName: 'CBL-100M',
      manufacturer: 'Generic',
      serialNumber: 'DISP-D2-001',
      location: 'SUW-E-114',
      price: 1000000,
    }
  ),

  // D3: pending_disposal (cancel by requester)
  createDisposalEquipment(
    EQUIP_DISPOSAL_EXC_D3,
    '[Disposal Test D3] 어댑터 (취소-요청자)',
    'SUW-E2040',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'ADP-50',
      manufacturer: 'Generic',
      serialNumber: 'DISP-D3-001',
      location: 'SUW-E-115',
      price: 500000,
    }
  ),

  // D4: pending_disposal (cancel by different user - should fail)
  createDisposalEquipment(
    EQUIP_DISPOSAL_EXC_D4,
    '[Disposal Test D4] 커넥터 (취소-타인)',
    'SUW-E2041',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'CON-N-M',
      manufacturer: 'Generic',
      serialNumber: 'DISP-D4-001',
      location: 'SUW-E-116',
      price: 300000,
    }
  ),

  // D5: pending_disposal (reviewStatus=reviewed, cannot cancel)
  createDisposalEquipment(
    EQUIP_DISPOSAL_EXC_D5,
    '[Disposal Test D5] 터미네이터 (취소불가)',
    'SUW-E2042',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'TERM-50',
      manufacturer: 'Generic',
      serialNumber: 'DISP-D5-001',
      location: 'SUW-E-117',
      price: 200000,
    }
  ),
];

// =============================================================================
// GROUP E: UI/UX & Accessibility (3 equipment)
// =============================================================================

export const DISPOSAL_EQUIPMENT_GROUP_E: NewEquipment[] = [
  // E1: pending_disposal (reviewStatus=pending, progress stepper test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_UI_E1,
    '[Disposal Test E1] 프로브 (UI-pending)',
    'SUW-E2043',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'PRB-100',
      manufacturer: 'Generic',
      serialNumber: 'DISP-E1-001',
      location: 'SUW-E-118',
      price: 4000000,
    }
  ),

  // E2: pending_disposal (reviewStatus=reviewed, progress stepper test)
  createDisposalEquipment(
    EQUIP_DISPOSAL_UI_E2,
    '[Disposal Test E2] 클램프 (UI-reviewed)',
    'SUW-E2044',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'pending_disposal',
    {
      modelName: 'CLP-200',
      manufacturer: 'Generic',
      serialNumber: 'DISP-E2-001',
      location: 'SUW-E-119',
      price: 5000000,
    }
  ),

  // E3: disposed (progress stepper test - all steps complete)
  // Note: isActive=true because disposed equipment must remain queryable for audit/history
  // The 'disposed' status itself indicates the equipment is no longer in active use
  createDisposalEquipment(
    EQUIP_DISPOSAL_UI_E3,
    '[Disposal Test E3] 필터 (UI-disposed)',
    'SUW-E2045',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'disposed',
    {
      modelName: 'FLT-50',
      manufacturer: 'Generic',
      serialNumber: 'DISP-E3-001',
      location: 'SUW-E-120',
      price: 2000000,
      isActive: true,
    }
  ),
];

// =============================================================================
// EXPORT ALL DISPOSAL EQUIPMENT
// =============================================================================

export const DISPOSAL_EQUIPMENT_SEED_DATA: NewEquipment[] = [
  ...DISPOSAL_EQUIPMENT_GROUP_A,
  ...DISPOSAL_EQUIPMENT_GROUP_B,
  ...DISPOSAL_EQUIPMENT_GROUP_C,
  ...DISPOSAL_EQUIPMENT_GROUP_D,
  ...DISPOSAL_EQUIPMENT_GROUP_E,
];
