/**
 * Equipment Imports Seed Data
 *
 * 10 equipment import records covering both source types and all statuses
 *
 * Distribution:
 * - Source: rental (5), internal_shared (5)
 * - Status: pending (2), approved (2), received (2), return_requested (2), returned (2)
 * - Sites: Suwon (6), Uiwang (4)
 */

import { equipmentImports } from '@equipment-management/db/schema';
import { daysAgo, daysLater } from '../../utils/date-helpers';
import {
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
} from '../../utils/uuid-constants';

// ============================================================================
// Equipment Import UUID Constants (10 records)
// ============================================================================

export const EQ_IMPORT_001_ID = '20000000-0000-0000-0000-000000000001';
export const EQ_IMPORT_002_ID = '20000000-0000-0000-0000-000000000002';
export const EQ_IMPORT_003_ID = '20000000-0000-0000-0000-000000000003';
export const EQ_IMPORT_004_ID = '20000000-0000-0000-0000-000000000004';
export const EQ_IMPORT_005_ID = '20000000-0000-0000-0000-000000000005';
export const EQ_IMPORT_006_ID = '20000000-0000-0000-0000-000000000006';
export const EQ_IMPORT_007_ID = '20000000-0000-0000-0000-000000000007';
export const EQ_IMPORT_008_ID = '20000000-0000-0000-0000-000000000008';
export const EQ_IMPORT_009_ID = '20000000-0000-0000-0000-000000000009';
export const EQ_IMPORT_010_ID = '20000000-0000-0000-0000-000000000010';

type EquipmentImportInsert = typeof equipmentImports.$inferInsert;

function createImport(
  overrides: Partial<EquipmentImportInsert> &
    Required<
      Pick<
        EquipmentImportInsert,
        | 'id'
        | 'sourceType'
        | 'requesterId'
        | 'site'
        | 'teamId'
        | 'equipmentName'
        | 'classification'
        | 'usagePeriodStart'
        | 'usagePeriodEnd'
        | 'reason'
        | 'status'
      >
    >
): EquipmentImportInsert {
  return {
    ...overrides,
    createdAt: overrides.createdAt ?? daysAgo(7),
    updatedAt: overrides.updatedAt ?? daysAgo(7),
  };
}

// ============================================================================
// EQUIPMENT IMPORTS SEED DATA (10 records)
// ============================================================================

export const EQUIPMENT_IMPORTS_SEED_DATA: EquipmentImportInsert[] = [
  // ========================================================================
  // RENTAL IMPORTS (5 records) — QP-18-06 양식 사용
  // ========================================================================

  // 1. Rental - pending (Suwon)
  createImport({
    id: EQ_IMPORT_001_ID,
    sourceType: 'rental',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: 'EMI Test Receiver (렌탈)',
    modelName: 'ESR26',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'RS-2024-00123',
    classification: 'fcc_emc_rf',
    vendorName: '㈜한미계측기',
    vendorContact: '031-456-7890',
    externalIdentifier: 'HM-ESR26-001',
    usagePeriodStart: daysLater(3),
    usagePeriodEnd: daysLater(33),
    usageLocation: 'EMC 2번 챔버',
    quantityOut: 1,
    reason: 'EMC 시험 증가에 따른 추가 리시버 필요',
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 2. Rental - approved (Uiwang)
  createImport({
    id: EQ_IMPORT_002_ID,
    sourceType: 'rental',
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    site: 'uiwang',
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    equipmentName: 'Signal Generator (렌탈)',
    modelName: 'SMB100B',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'RS-2024-00456',
    classification: 'general_emc',
    vendorName: '㈜케이텍시스템즈',
    vendorContact: '02-567-8901',
    externalIdentifier: 'KT-SMB100B-003',
    usagePeriodStart: daysLater(1),
    usagePeriodEnd: daysLater(31),
    usageLocation: 'RF 측정실',
    quantityOut: 1,
    reason: 'RF 호환성 시험 장비 부족',
    status: 'approved',
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    approvedAt: daysAgo(1),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),

  // 3. Rental - received (Suwon) — export 테스트 핵심 레코드
  createImport({
    id: EQ_IMPORT_003_ID,
    sourceType: 'rental',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: 'Spectrum Analyzer (렌탈)',
    modelName: 'FSW26',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'RS-2024-00789',
    classification: 'fcc_emc_rf',
    vendorName: '㈜한미계측기',
    vendorContact: '031-456-7890',
    externalIdentifier: 'HM-FSW26-002',
    usagePeriodStart: daysAgo(10),
    usagePeriodEnd: daysLater(20),
    usageLocation: 'EMC 1번 챔버',
    quantityOut: 1,
    reason: '기존 스펙트럼 분석기 교정 기간 중 대체 장비 필요',
    status: 'received',
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(12),
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedAt: daysAgo(10),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '프로브, 전원케이블, 매뉴얼 포함',
    },
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
  }),

  // 4. Rental - return_requested (Suwon)
  createImport({
    id: EQ_IMPORT_004_ID,
    sourceType: 'rental',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: 'Power Meter (렌탈)',
    modelName: 'NRX',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'RS-2024-01012',
    classification: 'fcc_emc_rf',
    vendorName: '㈜테크노시스템',
    vendorContact: '02-345-6789',
    externalIdentifier: 'TS-NRX-005',
    usagePeriodStart: daysAgo(25),
    usagePeriodEnd: daysAgo(1),
    usageLocation: 'RF 측정실',
    quantityOut: 1,
    reason: '전력 측정 시험 프로젝트용 렌탈',
    status: 'return_requested',
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(27),
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedAt: daysAgo(25),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '센서 헤드 2개 포함',
    },
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  }),

  // 5. Rental - returned (Uiwang) — 완료 상태 export 테스트
  createImport({
    id: EQ_IMPORT_005_ID,
    sourceType: 'rental',
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    site: 'uiwang',
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    equipmentName: 'Network Analyzer (렌탈)',
    modelName: 'ZNB20',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'RS-2024-01345',
    classification: 'general_emc',
    vendorName: '㈜케이텍시스템즈',
    vendorContact: '02-567-8901',
    externalIdentifier: 'KT-ZNB20-001',
    usagePeriodStart: daysAgo(45),
    usagePeriodEnd: daysAgo(15),
    usageLocation: 'RF 측정실',
    quantityOut: 1,
    quantityReturned: 1,
    reason: 'S-파라미터 측정 프로젝트 완료',
    status: 'returned',
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    approvedAt: daysAgo(47),
    receivedBy: USER_TEST_ENGINEER_UIWANG_ID,
    receivedAt: daysAgo(45),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '교정 인증서 포함',
    },
    returnedCondition: {
      appearance: 'normal',
      abnormality: 'none',
      notes: '이상 없음',
    },
    createdAt: daysAgo(50),
    updatedAt: daysAgo(14),
  }),

  // ========================================================================
  // INTERNAL SHARED IMPORTS (5 records) — QP-18-10 양식 사용
  // ========================================================================

  // 6. Internal Shared - pending (Suwon)
  createImport({
    id: EQ_IMPORT_006_ID,
    sourceType: 'internal_shared',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: '공용 오실로스코프',
    modelName: 'RTO6',
    manufacturer: 'Rohde & Schwarz',
    classification: 'fcc_emc_rf',
    ownerDepartment: 'General EMC Lab',
    internalContact: '내선 3456',
    borrowingJustification: 'ESD 시험 시 파형 관찰 필요',
    usagePeriodStart: daysLater(2),
    usagePeriodEnd: daysLater(9),
    usageLocation: 'EMC 3번 챔버',
    quantityOut: 1,
    reason: 'ESD 파형 관찰용 오실로스코프 필요',
    status: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }),

  // 7. Internal Shared - approved (Uiwang)
  createImport({
    id: EQ_IMPORT_007_ID,
    sourceType: 'internal_shared',
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    site: 'uiwang',
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    equipmentName: '공용 전력증폭기',
    modelName: 'BBA150',
    manufacturer: 'Rohde & Schwarz',
    classification: 'general_emc',
    ownerDepartment: 'FCC EMC/RF Lab',
    internalContact: '내선 1234',
    borrowingJustification: 'RE 시험 출력 부족으로 외부 증폭기 필요',
    usagePeriodStart: daysLater(1),
    usagePeriodEnd: daysLater(14),
    usageLocation: 'RF 측정실',
    quantityOut: 1,
    reason: '전력증폭기 대여 (RE 시험)',
    status: 'approved',
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    approvedAt: daysAgo(1),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  }),

  // 8. Internal Shared - received (Suwon) — export 테스트 핵심 레코드
  createImport({
    id: EQ_IMPORT_008_ID,
    sourceType: 'internal_shared',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: '공용 LISN',
    modelName: 'ENV216',
    manufacturer: 'Rohde & Schwarz',
    classification: 'fcc_emc_rf',
    ownerDepartment: 'SAR Lab',
    internalContact: '내선 5678',
    borrowingJustification: 'CE 시험 LISN 추가 필요 (2대 동시 운용)',
    usagePeriodStart: daysAgo(5),
    usagePeriodEnd: daysLater(10),
    usageLocation: 'EMC 1번 챔버',
    quantityOut: 1,
    reason: 'CE 시험용 LISN 대여',
    status: 'received',
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(7),
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedAt: daysAgo(5),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '전원케이블, EUT 케이블 포함',
    },
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  }),

  // 9. Internal Shared - return_requested (Uiwang)
  createImport({
    id: EQ_IMPORT_009_ID,
    sourceType: 'internal_shared',
    requesterId: USER_TEST_ENGINEER_UIWANG_ID,
    site: 'uiwang',
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    equipmentName: '공용 안테나',
    modelName: 'HL562E',
    manufacturer: 'Rohde & Schwarz',
    classification: 'general_emc',
    ownerDepartment: 'FCC EMC/RF Lab',
    internalContact: '내선 1234',
    borrowingJustification: 'RE 시험 안테나 교체 기간 중 대체',
    usagePeriodStart: daysAgo(20),
    usagePeriodEnd: daysAgo(5),
    usageLocation: 'RF 측정실',
    quantityOut: 1,
    reason: '안테나 교체 기간 중 대체 장비',
    status: 'return_requested',
    approverId: USER_TECHNICAL_MANAGER_UIWANG_ID,
    approvedAt: daysAgo(22),
    receivedBy: USER_TEST_ENGINEER_UIWANG_ID,
    receivedAt: daysAgo(20),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '마운트 브라켓 포함',
    },
    createdAt: daysAgo(25),
    updatedAt: daysAgo(5),
  }),

  // 10. Internal Shared - returned (Suwon) — 완료 상태 export 테스트
  createImport({
    id: EQ_IMPORT_010_ID,
    sourceType: 'internal_shared',
    requesterId: USER_TEST_ENGINEER_SUWON_ID,
    site: 'suwon',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    equipmentName: '공용 커플러',
    modelName: 'EZ-17',
    manufacturer: 'ETS-Lindgren',
    classification: 'fcc_emc_rf',
    ownerDepartment: 'Automotive EMC Lab',
    internalContact: '내선 7890',
    borrowingJustification: 'FCC CE 시험 커플러 교정 기간 중 대체',
    usagePeriodStart: daysAgo(30),
    usagePeriodEnd: daysAgo(10),
    usageLocation: 'EMC 2번 챔버',
    quantityOut: 1,
    quantityReturned: 1,
    reason: '커플러 교정 기간 중 대체 장비',
    status: 'returned',
    approverId: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(32),
    receivedBy: USER_TEST_ENGINEER_SUWON_ID,
    receivedAt: daysAgo(30),
    receivingCondition: {
      appearance: 'normal',
      operation: 'normal',
      accessories: 'complete',
      notes: '교정 인증서 포함',
    },
    returnedCondition: {
      appearance: 'normal',
      abnormality: 'none',
      notes: '이상 없음, 원래 상태 반환',
    },
    createdAt: daysAgo(35),
    updatedAt: daysAgo(9),
  }),
];
