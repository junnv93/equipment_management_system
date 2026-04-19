/**
 * Intermediate Inspection seed data (UL-QP-18-03)
 *
 * INSPECTION_001: SUW-E0001 스펙트럼 분석기 — draft (기본 케이스)
 * INSPECTION_002: SUW-E0001 스펙트럼 분석기 — approved (전체 워크플로우 + 양식 전 섹션 다운로드 검증용)
 *   - 점검 항목 5개 (pass/fail 혼합, detailedResult 멀티라인 포함)
 *   - 측정 장비 연결 2건 (intermediate_inspection_equipment)
 *   - 동적 결과 섹션 2건 (inspection_result_sections: text + table)
 */

import {
  intermediateInspections,
  intermediateInspectionItems,
  intermediateInspectionEquipment,
} from '@equipment-management/db/schema';
import { inspectionResultSections } from '@equipment-management/db/schema/inspection-result-sections';
import { daysAgo, monthsAgo } from '../../utils/date-helpers';
import {
  CALIB_001_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  INTERMEDIATE_INSPECTION_001_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_A_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_B_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_C_ID,
  INTERMEDIATE_INSPECTION_EQUIPMENT_001_A_ID,
  INTERMEDIATE_INSPECTION_002_ID,
  INTERMEDIATE_INSPECTION_ITEM_002_A_ID,
  INTERMEDIATE_INSPECTION_ITEM_002_B_ID,
  INTERMEDIATE_INSPECTION_ITEM_002_C_ID,
  INTERMEDIATE_INSPECTION_ITEM_002_D_ID,
  INTERMEDIATE_INSPECTION_ITEM_002_E_ID,
  INTERMEDIATE_INSPECTION_EQUIPMENT_002_A_ID,
  INTERMEDIATE_INSPECTION_EQUIPMENT_002_B_ID,
  INSPECTION_RESULT_SECTION_001_ID,
  INSPECTION_RESULT_SECTION_002_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_LAB_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

// =============================================================================
// 중간점검 기록 (intermediate_inspections)
// =============================================================================

export const INTERMEDIATE_INSPECTIONS_SEED_DATA: (typeof intermediateInspections.$inferInsert)[] = [
  {
    // INSPECTION_001: draft 상태 — UI 편집/제출 플로우 검증용
    id: INTERMEDIATE_INSPECTION_001_ID,
    calibrationId: CALIB_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    inspectionDate: daysAgo(7),
    inspectorId: USER_TECHNICAL_MANAGER_SUWON_ID,
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    overallResult: 'pass',
    remarks: '중간점검 결과 이상 없음',
    approvalStatus: 'draft',
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    version: 1,
  },
  {
    // INSPECTION_002: approved 상태 — 양식 전 섹션(헤더/항목/측정장비/결재/동적섹션) 다운로드 검증용
    id: INTERMEDIATE_INSPECTION_002_ID,
    calibrationId: CALIB_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    inspectionDate: daysAgo(30),
    inspectorId: USER_TECHNICAL_MANAGER_SUWON_ID,
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    overallResult: 'pass',
    remarks: 'Connector 마모 상태 확인 완료. 전 주파수 대역 기준치 이내 특성 확인.',
    approvalStatus: 'approved',
    submittedAt: daysAgo(28),
    submittedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: daysAgo(26),
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    approvedAt: daysAgo(25),
    approvedBy: USER_LAB_MANAGER_SUWON_ID,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(25),
    version: 4,
  },
];

// =============================================================================
// 점검 항목 (intermediate_inspection_items)
// =============================================================================

export const INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA: (typeof intermediateInspectionItems.$inferInsert)[] =
  [
    // --- INSPECTION_001 항목 (3건 — 전부 pass, checkResult만 사용) ---
    {
      id: INTERMEDIATE_INSPECTION_ITEM_001_A_ID,
      inspectionId: INTERMEDIATE_INSPECTION_001_ID,
      itemNumber: 1,
      checkItem: '주파수 정확도',
      checkCriteria: '±0.5 ppm 이내',
      checkResult: '0.2 ppm',
      detailedResult: null,
      judgment: 'pass',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_001_B_ID,
      inspectionId: INTERMEDIATE_INSPECTION_001_ID,
      itemNumber: 2,
      checkItem: '레벨 정확도',
      checkCriteria: '±0.5 dB 이내',
      checkResult: '0.3 dB',
      detailedResult: null,
      judgment: 'pass',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_001_C_ID,
      inspectionId: INTERMEDIATE_INSPECTION_001_ID,
      itemNumber: 3,
      checkItem: '주파수 안정도',
      checkCriteria: '±1.0 ppm 이내',
      checkResult: '0.4 ppm',
      detailedResult: null,
      judgment: 'pass',
    },

    // --- INSPECTION_002 항목 (5건 — pass/fail 혼합 + detailedResult 멀티라인 포함) ---
    {
      id: INTERMEDIATE_INSPECTION_ITEM_002_A_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      itemNumber: 1,
      checkItem: '외관 검사',
      checkCriteria: '균열·변형·오염 없음, Connector 마모 기준 이내',
      checkResult: '이상 없음',
      detailedResult: null,
      judgment: 'pass',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_002_B_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      itemNumber: 2,
      checkItem: '주파수 정확도',
      checkCriteria: '±0.5 ppm 이내',
      checkResult: '0.18 ppm',
      detailedResult: null,
      judgment: 'pass',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_002_C_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      itemNumber: 3,
      // detailedResult 멀티라인 — 렌더러의 setCellMultilineText 경로 검증
      checkItem: '출력 특성',
      checkCriteria: '제조사 선언 오차범위 이내 (±2.5 dB)',
      checkResult: 'Min: -0.8 dB, Max: +1.2 dB',
      detailedResult:
        '100 MHz: -0.3 dB\n500 MHz: -0.5 dB\n1 GHz: +0.8 dB\n3 GHz: +1.2 dB\n6 GHz: -0.8 dB',
      judgment: 'pass',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_002_D_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      itemNumber: 4,
      checkItem: '위상 잡음',
      checkCriteria: '1 GHz 기준 -100 dBc/Hz @10 kHz 이하',
      checkResult: '-98 dBc/Hz',
      detailedResult: null,
      // fail 판정 — 기준 초과, 불합격 경로 검증
      judgment: 'fail',
    },
    {
      id: INTERMEDIATE_INSPECTION_ITEM_002_E_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      itemNumber: 5,
      checkItem: '레벨 정확도',
      checkCriteria: '±0.5 dB 이내',
      checkResult: '0.25 dB',
      detailedResult: null,
      judgment: 'pass',
    },
  ];

// =============================================================================
// 측정 장비 연결 (intermediate_inspection_equipment)
// =============================================================================

export const INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA: (typeof intermediateInspectionEquipment.$inferInsert)[] =
  [
    // INSPECTION_001 측정 시 사용한 기기 — Network Analyzer (SUW-E0003)
    {
      id: INTERMEDIATE_INSPECTION_EQUIPMENT_001_A_ID,
      inspectionId: INTERMEDIATE_INSPECTION_001_ID,
      equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
      calibrationDate: monthsAgo(3),
    },
    // INSPECTION_002 측정 시 사용한 기기 — Network Analyzer + Power Meter
    {
      id: INTERMEDIATE_INSPECTION_EQUIPMENT_002_A_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
      calibrationDate: monthsAgo(6),
    },
    {
      id: INTERMEDIATE_INSPECTION_EQUIPMENT_002_B_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      equipmentId: EQUIP_POWER_METER_SUW_E_ID,
      calibrationDate: monthsAgo(4),
    },
  ];

// =============================================================================
// 동적 결과 섹션 (inspection_result_sections) — INSPECTION_002 전용
// inspectionType='intermediate', 2개 섹션 — 보충 정보만 (측정결과는 렌더러가 items SSOT로 자동 생성)
// 섹션 구성: 측정환경(text) → 특이사항(text)
// ■ 측정 결과 항목별 나열은 intermediate-inspection-renderer.service.ts injectItemsSummary() 담당
// =============================================================================

export const INSPECTION_RESULT_SECTIONS_SEED_DATA: (typeof inspectionResultSections.$inferInsert)[] =
  [
    // ■ 측정 환경 — 점검 당일 환경 조건 (항목 데이터와 무관한 보충 정보)
    {
      id: INSPECTION_RESULT_SECTION_001_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      inspectionType: 'intermediate',
      sortOrder: 1,
      sectionType: 'text',
      title: '측정 환경',
      content:
        '온도: 23±2°C, 습도: 50±10% RH\n실내 전자기환경 적합 (외부 RF 간섭 없음 확인)\n접지 저항: 10 Ω 이하 확인 완료',
      createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      updatedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    // ■ 특이사항 — 부적합 항목 조치 기록 (항목 데이터와 무관한 보충 정보)
    {
      id: INSPECTION_RESULT_SECTION_002_ID,
      inspectionId: INTERMEDIATE_INSPECTION_002_ID,
      inspectionType: 'intermediate',
      sortOrder: 2,
      sectionType: 'text',
      title: '특이사항',
      content:
        '항목 4 위상 잡음 부적합 (-98 dBc/Hz, 기준 초과 2 dBc/Hz)\n' +
        '조치: 제조사 기술지원 요청 예정, 사용 전 재점검 실시 필요\n' +
        '해당 항목 외 전 항목 기준 이내 — 단기 제한 사용 승인',
      createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      updatedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
  ];
