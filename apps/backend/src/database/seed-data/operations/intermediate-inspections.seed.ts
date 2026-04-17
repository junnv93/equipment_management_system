/**
 * Intermediate Inspection seed data (UL-QP-18-03)
 *
 * 1 inspection on CALIB_001 / SUW-E0001 (Network Analyzer) with 3 items.
 * classification + calibrationValidityPeriod snapshot are from inception (schema L43~45).
 */

import {
  intermediateInspections,
  intermediateInspectionItems,
} from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  CALIB_001_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  INTERMEDIATE_INSPECTION_001_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_A_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_B_ID,
  INTERMEDIATE_INSPECTION_ITEM_001_C_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

export const INTERMEDIATE_INSPECTIONS_SEED_DATA: (typeof intermediateInspections.$inferInsert)[] = [
  {
    id: INTERMEDIATE_INSPECTION_001_ID,
    calibrationId: CALIB_001_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    inspectionDate: daysAgo(7),
    inspectorId: USER_TECHNICAL_MANAGER_SUWON_ID,
    // UL-QP-18-03 양식 헤더 snapshot (기존 컬럼)
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    // 결과
    overallResult: 'pass',
    remarks: '중간점검 결과 이상 없음',
    // 승인 플로우 (draft)
    approvalStatus: 'draft',
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    version: 1,
  },
];

export const INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA: (typeof intermediateInspectionItems.$inferInsert)[] =
  [
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
  ];
