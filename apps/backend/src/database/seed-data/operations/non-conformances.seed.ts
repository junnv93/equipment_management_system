/**
 * Non-Conformances seed data
 * 10 non-conformances with various statuses
 * 4 are linked to repair_history (1:1 relationship)
 */

import { nonConformances } from '@equipment-management/db/schema';
import { daysAgo, toDateString } from '../../utils/date-helpers';
import {
  NC_001_ID,
  NC_002_ID,
  NC_003_ID,
  NC_004_ID,
  NC_005_ID,
  NC_006_ID,
  NC_007_ID,
  NC_008_ID,
  NC_009_ID,
  NC_010_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  EQUIP_SIGNAL_INT_SUW_R_ID,
  EQUIP_MEASUREMENT_STAND_SUW_S_ID,
  EQUIP_BCI_SUW_A_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_HARNESS_COUPLER_SUW_A_ID,
  EQUIP_CURRENT_PROBE_SUW_A_ID,
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_AMPLIFIER_UIW_W_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  REPAIR_001_ID,
  REPAIR_002_ID,
  REPAIR_003_ID,
  REPAIR_004_ID,
} from '../../utils/uuid-constants';

function createNC(
  id: string,
  equipmentId: string,
  discoveryDate: Date,
  ncType: (typeof nonConformances.$inferInsert)['ncType'],
  cause: string,
  status: (typeof nonConformances.$inferInsert)['status'],
  overrides?: Partial<typeof nonConformances.$inferInsert>
): typeof nonConformances.$inferInsert {
  const now = new Date();
  return {
    id,
    equipmentId,
    discoveryDate: toDateString(discoveryDate),
    discoveredBy: USER_TEST_ENGINEER_SUWON_ID,
    cause,
    ncType,
    status,
    createdAt: discoveryDate,
    updatedAt: now,
    ...overrides,
  };
}

export const NON_CONFORMANCES_SEED_DATA: (typeof nonConformances.$inferInsert)[] = [
  // Open NC (발견됨, 대기 중)
  createNC(
    NC_001_ID,
    EQUIP_POWER_METER_SUW_E_ID,
    daysAgo(7),
    'malfunction',
    '측정값 불안정성 발생',
    'open',
    {
      actionPlan: '전자부품 점검 및 수리 예정',
    }
  ),

  // Open NC #2 (발견됨, 조치 대기)
  createNC(
    NC_002_ID,
    EQUIP_SIGNAL_INT_SUW_R_ID,
    daysAgo(10),
    'malfunction',
    '신호 왜곡 현상',
    'open',
    {
      actionPlan: '임피던스 보정 또는 부품 교체 검토',
    }
  ),

  // Open NC #3 (발견됨, 조치 대기)
  createNC(
    NC_003_ID,
    EQUIP_MEASUREMENT_STAND_SUW_S_ID,
    daysAgo(15),
    'damage',
    'Z축 스테이지 이동 불량',
    'open',
    {
      actionPlan: '베어링 교체 또는 모터 재수리',
    }
  ),

  // Corrected + Repair Link (조치 완료, 승인 대기 중)
  // ⚠️ PENDING APPROVAL: corrected 상태 = 기술책임자 승인 대기
  createNC(
    NC_006_ID,
    EQUIP_HARNESS_COUPLER_SUW_A_ID,
    daysAgo(30),
    'calibration_failure',
    '교정 실패 - 신호 손실',
    'corrected',
    {
      resolutionType: 'repair',
      repairHistoryId: REPAIR_001_ID,
      actionPlan: '내부 연결부 교체',
      correctionContent: '내부 연결부 교체 및 재교정 완료',
      correctionDate: toDateString(daysAgo(5)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    }
  ),

  // Corrected (조치 완료, 승인 대기 중)
  // ⚠️ PENDING APPROVAL: corrected 상태 = 기술책임자 승인 대기
  createNC(
    NC_007_ID,
    EQUIP_CURRENT_PROBE_SUW_A_ID,
    daysAgo(25),
    'damage',
    'BNC 커넥터 불량',
    'corrected',
    {
      resolutionType: 'repair',
      repairHistoryId: REPAIR_002_ID,
      correctionContent: 'BNC 커넥터 교체',
      correctionDate: toDateString(daysAgo(8)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    }
  ),

  // Corrected + Recalibration (조치 완료, 승인 대기 중)
  // ⚠️ PENDING APPROVAL: corrected 상태 = 기술책임자 승인 대기
  createNC(
    NC_008_ID,
    EQUIP_EMC_RECEIVER_SUW_E_ID,
    daysAgo(20),
    'measurement_error',
    '측정 오류 - 게인 편차',
    'corrected',
    {
      resolutionType: 'recalibration',
      correctionContent: '필터 보정 및 게인 재조정',
      correctionDate: toDateString(daysAgo(6)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    }
  ),

  // Corrected + Replacement (조치 완료, 승인 대기 중 - Uiwang 사이트)
  // ⚠️ PENDING APPROVAL: corrected 상태 = 기술책임자 승인 대기
  // 🌐 CROSS-SITE: Uiwang General RF 팀 소속 장비 (크로스 사이트 워크플로우 테스트용)
  createNC(
    NC_009_ID,
    EQUIP_RECEIVER_UIW_W_ID,
    daysAgo(18),
    'damage',
    '수신기 RF 앰프 손상',
    'corrected',
    {
      resolutionType: 'replacement',
      repairHistoryId: REPAIR_003_ID,
      correctionContent: 'RF 앰프 모듈 전체 교체',
      correctionDate: toDateString(daysAgo(4)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    }
  ),

  // Closed (종료됨, 기술책임자 승인)
  createNC(NC_004_ID, EQUIP_BCI_SUW_A_ID, daysAgo(40), 'malfunction', '주입 효율 저하', 'closed', {
    repairHistoryId: REPAIR_004_ID,
    correctionContent: '클램프 접촉면 정제 및 재조립',
    correctionDate: toDateString(daysAgo(18)),
    correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    closedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    closedAt: daysAgo(10),
    closureNotes: '부적합 조치 확인 및 종료 승인',
    resolutionType: 'repair',
  }),

  // Closed #2
  createNC(
    NC_005_ID,
    EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    daysAgo(45),
    'measurement_error',
    '주파수 응답 편차',
    'closed',
    {
      correctionContent: '주파수 응답 재조정 및 교정',
      correctionDate: toDateString(daysAgo(28)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      closedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      closedAt: daysAgo(15),
      closureNotes: '교정 기록 업데이트 완료',
      resolutionType: 'recalibration',
    }
  ),

  // Closed #3 (Other resolution type)
  createNC(
    NC_010_ID,
    EQUIP_AMPLIFIER_UIW_W_ID,
    daysAgo(50),
    'malfunction',
    '전력 출력 불안정',
    'closed',
    {
      correctionContent: '전체 전원부 재설계 및 수리',
      correctionDate: toDateString(daysAgo(22)),
      correctedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      closedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
      closedAt: daysAgo(20),
      closureNotes: '장기 수리 완료',
      resolutionType: 'other',
    }
  ),
];
