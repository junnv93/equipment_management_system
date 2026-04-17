/**
 * Self Inspection seed data (UL-QP-18-05)
 *
 * 1 inspection on SUW-E0001 (Network Analyzer) with 4 items.
 * Validates classification/calibrationValidityPeriod snapshot path (Phase 1 migration).
 */

import { equipmentSelfInspections, selfInspectionItems } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  SELF_INSPECTION_001_ID,
  SELF_INSPECTION_ITEM_001_A_ID,
  SELF_INSPECTION_ITEM_001_B_ID,
  SELF_INSPECTION_ITEM_001_C_ID,
  SELF_INSPECTION_ITEM_001_D_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

export const SELF_INSPECTIONS_SEED_DATA: (typeof equipmentSelfInspections.$inferInsert)[] = [
  {
    id: SELF_INSPECTION_001_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    inspectionDate: daysAgo(3),
    inspectorId: USER_TECHNICAL_MANAGER_SUWON_ID,
    // 레거시 고정 컬럼 (하위 호환)
    appearance: 'pass',
    functionality: 'pass',
    safety: 'pass',
    calibrationStatus: 'pass',
    // 결과
    overallResult: 'pass',
    remarks: '외관 및 기능 점검 정상',
    specialNotes: [{ content: '시험대 청소 완료', date: daysAgo(3).toISOString().slice(0, 10) }],
    // 점검 주기 및 차기 점검일
    inspectionCycle: 6,
    nextInspectionDate: new Date(new Date(daysAgo(3)).setMonth(new Date(daysAgo(3)).getMonth() + 6))
      .toISOString()
      .slice(0, 10),
    // UL-QP-18-05 양식 헤더 snapshot (Phase 1 컬럼)
    classification: 'calibrated',
    calibrationValidityPeriod: '1년',
    // 승인 플로우
    approvalStatus: 'draft',
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    version: 1,
  },
];

export const SELF_INSPECTION_ITEMS_SEED_DATA: (typeof selfInspectionItems.$inferInsert)[] = [
  {
    id: SELF_INSPECTION_ITEM_001_A_ID,
    inspectionId: SELF_INSPECTION_001_ID,
    itemNumber: 1,
    checkItem: '외관검사',
    checkResult: 'pass',
    detailedResult: '외관 손상 없음, 청결 상태 양호',
  },
  {
    id: SELF_INSPECTION_ITEM_001_B_ID,
    inspectionId: SELF_INSPECTION_001_ID,
    itemNumber: 2,
    checkItem: '출력 특성 점검',
    checkResult: 'pass',
    detailedResult: null,
  },
  {
    id: SELF_INSPECTION_ITEM_001_C_ID,
    inspectionId: SELF_INSPECTION_001_ID,
    itemNumber: 3,
    checkItem: '안전 점검',
    checkResult: 'pass',
    detailedResult: null,
  },
  {
    id: SELF_INSPECTION_ITEM_001_D_ID,
    inspectionId: SELF_INSPECTION_001_ID,
    itemNumber: 4,
    checkItem: '기능 점검',
    checkResult: 'pass',
    detailedResult: null,
  },
];
