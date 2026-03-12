/**
 * Equipment Incident History seed data
 * 10 incident records: damage (3), malfunction (3), change (2), repair (2)
 */

import { equipmentIncidentHistory } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  INCIDENT_001_ID,
  INCIDENT_002_ID,
  INCIDENT_003_ID,
  INCIDENT_004_ID,
  INCIDENT_005_ID,
  INCIDENT_006_ID,
  INCIDENT_007_ID,
  INCIDENT_008_ID,
  INCIDENT_009_ID,
  INCIDENT_010_ID,
  EQUIP_POWER_METER_SUW_E_ID,
  EQUIP_COUPLER_SUW_E_ID,
  EQUIP_SIGNAL_INT_SUW_R_ID,
  EQUIP_BCI_SUW_A_ID,
  EQUIP_AMPLIFIER_UIW_W_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  EQUIP_MEASUREMENT_STAND_SUW_S_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../../utils/uuid-constants';

export const INCIDENT_HISTORY_SEED_DATA: (typeof equipmentIncidentHistory.$inferInsert)[] = [
  // damage (3)
  {
    id: INCIDENT_001_ID,
    equipmentId: EQUIP_POWER_METER_SUW_E_ID,
    occurredAt: daysAgo(30),
    incidentType: 'damage',
    content: '시험 중 센서 헤드 낙하로 인한 물리적 손상. 측정값 편차 발생.',
    reportedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: INCIDENT_002_ID,
    equipmentId: EQUIP_BCI_SUW_A_ID,
    occurredAt: daysAgo(20),
    incidentType: 'damage',
    content: '차량 시험 중 클램프 접촉면 마모. 주입 효율 저하 확인.',
    reportedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: INCIDENT_003_ID,
    equipmentId: EQUIP_MEASUREMENT_STAND_SUW_S_ID,
    occurredAt: daysAgo(45),
    incidentType: 'damage',
    content: '장비 이동 시 스탠드 하부 프레임 변형. 수평 정밀도 영향.',
    reportedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },

  // malfunction (3)
  {
    id: INCIDENT_004_ID,
    equipmentId: EQUIP_COUPLER_SUW_E_ID,
    occurredAt: daysAgo(15),
    incidentType: 'malfunction',
    content: '교정 기한 초과 상태에서 출력 편차 증가 확인. 커플링 비 ±3dB 초과.',
    reportedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: INCIDENT_005_ID,
    equipmentId: EQUIP_SIGNAL_INT_SUW_R_ID,
    occurredAt: daysAgo(25),
    incidentType: 'malfunction',
    content: '전원 인가 시 자체 진단 실패. 내부 기준 신호 발생 불량.',
    reportedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: INCIDENT_006_ID,
    equipmentId: EQUIP_AMPLIFIER_UIW_W_ID,
    occurredAt: daysAgo(12),
    incidentType: 'malfunction',
    content: '고출력 모드에서 비정상 발열. 과열 보호 회로 작동으로 자동 셧다운.',
    reportedBy: USER_TEST_ENGINEER_UIWANG_ID,
  },

  // change (2)
  {
    id: INCIDENT_007_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    occurredAt: daysAgo(42),
    incidentType: 'change',
    content: '디스플레이 케이블 교체. 기존 LVDS 케이블 단선으로 신규 교체.',
    reportedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: INCIDENT_008_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    occurredAt: daysAgo(55),
    incidentType: 'change',
    content: 'SAR 프로브 교체 (EX3DV4 → EX3DV4-SN2). 이전 프로브 감도 저하.',
    reportedBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // repair (2)
  {
    id: INCIDENT_009_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    occurredAt: daysAgo(35),
    incidentType: 'repair',
    content: '메모리 보드 교체 및 펌웨어 재설치 (제조사 인증 서비스). 정상 복구.',
    reportedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: INCIDENT_010_ID,
    equipmentId: EQUIP_BCI_SUW_A_ID,
    occurredAt: daysAgo(18),
    incidentType: 'repair',
    content: '클램프 접촉면 정제 및 재조립 완료. 주입 효율 100% 복구.',
    reportedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
];
