/**
 * Equipment seed data
 * 36 equipment items distributed across:
 * - 8 status values (each with 2+ items)
 * - 6 classification codes (E, R, W, S, A, P)
 * - 3 sites (Suwon, Uiwang, Pyeongtaek)
 * - Various calibration date ranges
 */

import { equipment } from '@equipment-management/db/schema';
import { EquipmentStatus, ManagementMethod } from '@equipment-management/schemas';
import { daysAgo, monthsAgo, daysLater, monthsLater } from '../../utils/date-helpers';
import {
  // Suwon users
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_DEPUTY_ID,
  // Suwon teams
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_SAR_SUWON_ID,
  TEAM_AUTOMOTIVE_EMC_SUWON_ID,
  // Uiwang team
  TEAM_GENERAL_RF_UIWANG_ID,
  // Pyeongtaek team
  TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
  // Equipment IDs
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_FILTER_SUW_E_ID,
  EQUIP_ANTENNA_1_SUW_E_ID,
  EQUIP_COUPLER_SUW_E_ID,
  EQUIP_RBAC_SIGNAL_GEN_SUW_E_ID,
  EQUIP_CANCEL_RECEIVER_SUW_E_ID,
  EQUIP_CAS_ANALYZER_SUW_E_ID,
  EQUIP_SHARED_ANALYZER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_POWER_SUPPLY_SUW_R_ID,
  EQUIP_MULTIMETER_SUW_R_ID,
  EQUIP_SIGNAL_INT_SUW_R_ID,
  EQUIP_ATTENUATOR_SUW_R_ID,
  EQUIP_ABSORBER_SUW_R_ID,
  EQUIP_SAR_PROBE_SUW_S_ID,
  EQUIP_PHANTOM_HEAD_SUW_S_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  EQUIP_MEASUREMENT_STAND_SUW_S_ID,
  EQUIP_LIQUID_HANDLER_SUW_S_ID,
  EQUIP_TEMPERATURE_CONTROL_SUW_S_ID,
  EQUIP_HARNESS_COUPLER_SUW_A_ID,
  EQUIP_CURRENT_PROBE_SUW_A_ID,
  EQUIP_INJECTION_CLAMP_SUW_A_ID,
  EQUIP_BCI_SUW_A_ID,
  EQUIP_POWER_CONTROLLER_SUW_A_ID,
  EQUIP_SENSOR_SUW_A_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_TRANSMITTER_UIW_W_ID,
  EQUIP_ANTENNA_2_UIW_W_ID,
  EQUIP_AMPLIFIER_UIW_W_ID,
  EQUIP_TEST_HARNESS_PYT_A_ID,
  EQUIP_POWER_AMP_PYT_A_ID,
} from '../../utils/uuid-constants';

const now = new Date();

function createEquipment(
  id: string,
  name: string,
  managementNumber: string,
  teamId: string,
  site: 'suwon' | 'uiwang' | 'pyeongtaek',
  status: EquipmentStatus,
  managementMethod: ManagementMethod,
  lastCalibrationDate?: Date,
  nextCalibrationDate?: Date,
  overrides?: Partial<typeof equipment.$inferInsert>
): typeof equipment.$inferInsert {
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
    managementMethod,
    lastCalibrationDate,
    nextCalibrationDate,
    calibrationCycle: managementMethod === 'external_calibration' ? 12 : undefined,
    calibrationRequired: managementMethod === 'external_calibration' ? 'required' : 'not_required',
    specMatch: 'match',
    isActive: true,
    approvalStatus: 'approved',
    location: `${site.toUpperCase()} Lab`,
    modelName: name,
    manufacturer: 'Generic Manufacturer',
    serialNumber: `SN-${managementNumber}`,
    description: `Test equipment: ${name}`,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export const EQUIPMENT_SEED_DATA: (typeof equipment.$inferInsert)[] = [
  // =========================================================================
  // Suwon FCC EMC/RF (E) - 12 equipment (8 general + 4 dedicated E2E S23-S26)
  // Status distribution: available(4), non_conforming(2), spare(1), checked_out(1)
  // =========================================================================

  // Available + Calibration Overdue (3 months past) + 전체 필드 테스트용
  createEquipment(
    EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    '스펙트럼 분석기',
    'SUW-E0001',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(3),
    daysAgo(10),
    {
      manufacturerContact: '02-1234-5678',
      supplier: 'Keysight Technologies Korea',
      contactInfo: '031-987-6543',
      accessories: 'RF 케이블 3m x2, N-SMA 어댑터, 전용 캐리어 케이스',
      technicalManager: '김기술',
      initialLocation: 'SUWON Lab A-201',
      installationDate: new Date('2023-06-15'),
      calibrationResult: '적합',
      correctionFactor: '0.98',
      needsIntermediateCheck: true,
      intermediateCheckCycle: 6,
      lastIntermediateCheckDate: monthsAgo(2),
      nextIntermediateCheckDate: daysLater(120),
      manualLocation: 'A동 201호 캐비닛',
      managerId: USER_TECHNICAL_MANAGER_SUWON_ID,
      deputyManagerId: USER_TECHNICAL_MANAGER_SUWON_DEPUTY_ID,
    }
  ),

  // Available + Due Soon (7 days)
  createEquipment(
    EQUIP_SIGNAL_GEN_SUW_E_ID,
    '신호 발생기',
    'SUW-E0002',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(11),
    daysLater(7)
  ),

  // Available + Normal Range (45 days) + 공용장비
  createEquipment(
    EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    '네트워크 분석기 (공용)',
    'SUW-E0003',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(11),
    daysLater(45),
    { isShared: true, sharedSource: 'other_lab' }
  ),

  // Non-Conforming + Malfunction
  createEquipment(
    EQUIP_POWER_METER_SUW_E_ID,
    '전력계',
    'SUW-E0004',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'non_conforming',
    'external_calibration',
    monthsAgo(6),
    daysLater(120),
    { isActive: true }
  ),

  // Available (formerly in_use)
  createEquipment(
    EQUIP_EMC_RECEIVER_SUW_E_ID,
    'EMC 수신기',
    'SUW-E0005',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  // Spare
  createEquipment(
    EQUIP_FILTER_SUW_E_ID,
    'RF 필터',
    'SUW-E0006',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'spare',
    'self_inspection',
    monthsAgo(12),
    monthsLater(12)
  ),

  // Checked Out
  createEquipment(
    EQUIP_ANTENNA_1_SUW_E_ID,
    '안테나 시스템 1',
    'SUW-E0007',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'checked_out',
    'self_inspection',
    monthsAgo(6),
    daysLater(150)
  ),

  // Calibration Overdue
  createEquipment(
    EQUIP_COUPLER_SUW_E_ID,
    '커플러',
    'SUW-E0008',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'non_conforming',
    'external_calibration',
    monthsAgo(15),
    daysAgo(45)
  ),

  // --- Dedicated E2E Checkout Suite Equipment (S23-S26) ---
  // 병렬 실행 시 장비 상태 충돌 방지를 위한 전용 장비

  // S23: Cross-Site RBAC (available)
  createEquipment(
    EQUIP_RBAC_SIGNAL_GEN_SUW_E_ID,
    'RBAC 신호 발생기 (S23 전용)',
    'SUW-E0009',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  // S24: Cancel & Equipment Recovery (available)
  createEquipment(
    EQUIP_CANCEL_RECEIVER_SUW_E_ID,
    'Cancel EMC 수신기 (S24 전용)',
    'SUW-E0010',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  // S25: CAS Concurrent Approval (available)
  createEquipment(
    EQUIP_CAS_ANALYZER_SUW_E_ID,
    'CAS 스펙트럼 분석기 (S25 전용)',
    'SUW-E0011',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  // S26: Shared Equipment Workflow (available, isShared)
  createEquipment(
    EQUIP_SHARED_ANALYZER_SUW_E_ID,
    '공용 네트워크 분석기 (S26 전용)',
    'SUW-E0012',
    TEAM_FCC_EMC_RF_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180),
    { isShared: true, sharedSource: 'other_lab' }
  ),

  // =========================================================================
  // Suwon General EMC (R) - 6 equipment
  // Status distribution: available(3), non_conforming(1), checked_out(1), pending_disposal(1)
  // =========================================================================

  // Available + Calibration Overdue + 공용장비
  createEquipment(
    EQUIP_OSCILLOSCOPE_SUW_R_ID,
    '디지털 오실로스코프 (공용)',
    'SUW-R0001',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(14),
    daysAgo(60),
    { isShared: true, sharedSource: 'safety_lab' }
  ),

  // Available + Due Soon
  createEquipment(
    EQUIP_POWER_SUPPLY_SUW_R_ID,
    '전원 공급기',
    'SUW-R0002',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(11),
    daysLater(20)
  ),

  // In-Use
  createEquipment(
    EQUIP_MULTIMETER_SUW_R_ID,
    '멀티미터',
    'SUW-R0003',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'available',
    'self_inspection',
    monthsAgo(8),
    daysLater(120)
  ),

  // Non-Conforming
  createEquipment(
    EQUIP_SIGNAL_INT_SUW_R_ID,
    '신호 간섭기',
    'SUW-R0004',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'non_conforming',
    'external_calibration',
    monthsAgo(9),
    daysLater(90)
  ),

  // Checked Out
  createEquipment(
    EQUIP_ATTENUATOR_SUW_R_ID,
    '감쇠기',
    'SUW-R0005',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'checked_out',
    'self_inspection',
    monthsAgo(8),
    daysLater(120)
  ),

  // Pending Disposal
  createEquipment(
    EQUIP_ABSORBER_SUW_R_ID,
    '흡수 패널',
    'SUW-R0006',
    TEAM_GENERAL_EMC_SUWON_ID,
    'suwon',
    'pending_disposal',
    'external_calibration',
    monthsAgo(24),
    daysAgo(365)
  ),

  // =========================================================================
  // Suwon SAR (S) - 6 equipment
  // Status distribution: available(3), non_conforming(1), spare(1), checked_out(1)
  // =========================================================================

  createEquipment(
    EQUIP_SAR_PROBE_SUW_S_ID,
    'SAR 프로브',
    'SUW-S0001',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_PHANTOM_HEAD_SUW_S_ID,
    '팬텀 헤드',
    'SUW-S0002',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(12),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_SAR_SYSTEM_SUW_S_ID,
    'SAR 시스템 (공용)',
    'SUW-S0003',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'available',
    'self_inspection',
    monthsAgo(3),
    daysLater(270),
    { isShared: true, sharedSource: 'safety_lab' }
  ),

  createEquipment(
    EQUIP_MEASUREMENT_STAND_SUW_S_ID,
    '측정 스탠드',
    'SUW-S0004',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'non_conforming',
    'external_calibration',
    monthsAgo(12),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_LIQUID_HANDLER_SUW_S_ID,
    '액체 처리기',
    'SUW-S0005',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'spare',
    'not_applicable',
    undefined,
    undefined
  ),

  createEquipment(
    EQUIP_TEMPERATURE_CONTROL_SUW_S_ID,
    '온도 제어기',
    'SUW-S0006',
    TEAM_SAR_SUWON_ID,
    'suwon',
    'checked_out',
    'self_inspection',
    monthsAgo(9),
    daysLater(90)
  ),

  // =========================================================================
  // Suwon Automotive EMC (A) - 6 equipment
  // Status distribution: available(3), non_conforming(1), pending_disposal(1), disposed(1)
  // =========================================================================

  createEquipment(
    EQUIP_HARNESS_COUPLER_SUW_A_ID,
    '하네스 커플러',
    'SUW-A0001',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'available',
    'self_inspection',
    monthsAgo(6),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_CURRENT_PROBE_SUW_A_ID,
    '전류 프로브',
    'SUW-A0002',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(11),
    daysLater(30)
  ),

  createEquipment(
    EQUIP_INJECTION_CLAMP_SUW_A_ID,
    '주입 클램프',
    'SUW-A0003',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'available',
    'external_calibration',
    monthsAgo(6),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_BCI_SUW_A_ID,
    'BCI 시스템',
    'SUW-A0004',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'non_conforming',
    'external_calibration',
    monthsAgo(9),
    daysLater(90)
  ),

  createEquipment(
    EQUIP_POWER_CONTROLLER_SUW_A_ID,
    '전력 제어기',
    'SUW-A0005',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'pending_disposal',
    'external_calibration',
    monthsAgo(24),
    daysAgo(365)
  ),

  createEquipment(
    EQUIP_SENSOR_SUW_A_ID,
    '센서',
    'SUW-A0006',
    TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    'suwon',
    'disposed',
    'not_applicable',
    monthsAgo(36),
    monthsAgo(24),
    { isActive: true } // disposed equipment must remain queryable for audit/history
  ),

  // =========================================================================
  // Uiwang General RF (W) - 4 equipment
  // Status distribution: available(2), checked_out(1), non_conforming(1)
  // =========================================================================

  // 공용장비 (다른 시험소에서 대여)
  createEquipment(
    EQUIP_RECEIVER_UIW_W_ID,
    'RF 수신기 (공용)',
    'UIW-W0001',
    TEAM_GENERAL_RF_UIWANG_ID,
    'uiwang',
    'available',
    'external_calibration',
    monthsAgo(9),
    daysLater(90),
    { isShared: true, sharedSource: 'other_lab' }
  ),

  createEquipment(
    EQUIP_TRANSMITTER_UIW_W_ID,
    'RF 송신기',
    'UIW-W0002',
    TEAM_GENERAL_RF_UIWANG_ID,
    'uiwang',
    'available',
    'external_calibration',
    monthsAgo(11),
    daysLater(30)
  ),

  createEquipment(
    EQUIP_ANTENNA_2_UIW_W_ID,
    '안테나 시스템 2',
    'UIW-W0003',
    TEAM_GENERAL_RF_UIWANG_ID,
    'uiwang',
    'checked_out',
    'self_inspection',
    monthsAgo(9),
    daysLater(90)
  ),

  createEquipment(
    EQUIP_AMPLIFIER_UIW_W_ID,
    'RF 증폭기',
    'UIW-W0004',
    TEAM_GENERAL_RF_UIWANG_ID,
    'uiwang',
    'non_conforming',
    'external_calibration',
    monthsAgo(15),
    daysAgo(90)
  ),

  // =========================================================================
  // Pyeongtaek Automotive EMC (A) - 2 equipment
  // Status distribution: available(2)
  // =========================================================================

  createEquipment(
    EQUIP_TEST_HARNESS_PYT_A_ID,
    '테스트 하네스',
    'PYT-A0001',
    TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    'pyeongtaek',
    'available',
    'self_inspection',
    monthsAgo(6),
    daysLater(180)
  ),

  createEquipment(
    EQUIP_POWER_AMP_PYT_A_ID,
    '전력 증폭기',
    'PYT-A0002',
    TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    'pyeongtaek',
    'available',
    'external_calibration',
    monthsAgo(10),
    daysLater(60)
  ),

  // NOTE: 시험용 소프트웨어(EMC32, DASY6)는 소프트웨어 관리 모듈에서 관리.
  // 장비 테이블에 포함하지 않음.
];
