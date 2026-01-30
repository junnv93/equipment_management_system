/**
 * Repair History seed data
 * 8 repairs, with 4 linked to non-conformances (1:1 relationship)
 */

import { repairHistory } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  REPAIR_001_ID,
  REPAIR_002_ID,
  REPAIR_003_ID,
  REPAIR_004_ID,
  REPAIR_005_ID,
  REPAIR_006_ID,
  REPAIR_007_ID,
  REPAIR_008_ID,
  EQUIP_HARNESS_COUPLER_SUW_A_ID,
  EQUIP_CURRENT_PROBE_SUW_A_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  EQUIP_BCI_SUW_A_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_POWER_SUPPLY_SUW_R_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../utils/uuid-constants';

export const REPAIR_HISTORY_SEED_DATA: (typeof repairHistory.$inferInsert)[] = [
  // Linked to NC-006 (Harness Coupler)
  {
    id: REPAIR_001_ID,
    equipmentId: EQUIP_HARNESS_COUPLER_SUW_A_ID,
    repairDate: daysAgo(10),
    repairDescription: '내부 연결부 교체 및 재교정',
    repairCompany: '케이사이트 서비스센터',
    cost: 2500000,
    repairResult: 'completed',
    notes: '교정 성적서 확인 완료',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  },

  // Linked to NC-007 (Current Probe)
  {
    id: REPAIR_002_ID,
    equipmentId: EQUIP_CURRENT_PROBE_SUW_A_ID,
    repairDate: daysAgo(8),
    repairDescription: 'BNC 커넥터 교체',
    repairCompany: '사내 기술팀',
    cost: 300000,
    repairResult: 'completed',
    notes: '저항 측정 및 절연 테스트 통과',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(4),
  },

  // Linked to NC-009 (RF Receiver)
  {
    id: REPAIR_003_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    repairDate: daysAgo(4),
    repairDescription: 'RF 앰프 모듈 전체 교체',
    repairCompany: '정밀전자 대리점',
    cost: 8500000,
    repairResult: 'completed',
    notes: '신호 특성 측정 완료, 이득 정상',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },

  // Linked to NC-004 (BCI)
  {
    id: REPAIR_004_ID,
    equipmentId: EQUIP_BCI_SUW_A_ID,
    repairDate: daysAgo(18),
    repairDescription: '클램프 접촉면 정제 및 재조립',
    repairCompany: '사내 기술팀',
    cost: 500000,
    repairResult: 'completed',
    notes: '주입 효율 측정: 100% 복구',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(12),
  },

  // Independent repairs (not linked to NC)

  // Oscilloscope maintenance repair
  {
    id: REPAIR_005_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    repairDate: daysAgo(35),
    repairDescription: '프로브 보정 및 터치 스크린 교체',
    repairCompany: '테크트로닉스 인증 서비스',
    cost: 3200000,
    repairResult: 'completed',
    notes: '모든 채널 보정 완료, 대역폭 확인됨',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(35),
    updatedAt: daysAgo(28),
  },

  // Power Supply preventive maintenance
  {
    id: REPAIR_006_ID,
    equipmentId: EQUIP_POWER_SUPPLY_SUW_R_ID,
    repairDate: daysAgo(28),
    repairDescription: '냉각 팬 교체 및 내부 청소',
    repairCompany: '사내 기술팀',
    cost: 400000,
    repairResult: 'completed',
    notes: '온도 센서 확인, 정상 작동',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(22),
  },

  // Network Analyzer partial repair
  {
    id: REPAIR_007_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    repairDate: daysAgo(42),
    repairDescription: '디스플레이 케이블 재접합, 메모리 보드 교체 필요',
    repairCompany: '외부 전자 서비스',
    cost: 2100000,
    repairResult: 'partial',
    notes: '디스플레이 복구됨, 메모리 확장 계획 중',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(42),
    updatedAt: daysAgo(35),
  },

  // SAR System failed repair attempt
  {
    id: REPAIR_008_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    repairDate: daysAgo(55),
    repairDescription: '온도 제어 시스템 수리 시도',
    repairCompany: '제조사 인증 기술자',
    cost: 5800000,
    repairResult: 'failed',
    notes: '수리 불가, 부품 단종 - 교체 권고',
    isDeleted: false,
    createdBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    createdAt: daysAgo(55),
    updatedAt: daysAgo(50),
  },
];
