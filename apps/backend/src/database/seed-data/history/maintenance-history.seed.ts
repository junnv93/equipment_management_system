/**
 * Equipment Maintenance History seed data
 * 10 maintenance records (정기 유지보수)
 */

import { equipmentMaintenanceHistory } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  MAINT_HIST_001_ID,
  MAINT_HIST_002_ID,
  MAINT_HIST_003_ID,
  MAINT_HIST_004_ID,
  MAINT_HIST_005_ID,
  MAINT_HIST_006_ID,
  MAINT_HIST_007_ID,
  MAINT_HIST_008_ID,
  MAINT_HIST_009_ID,
  MAINT_HIST_010_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../../utils/uuid-constants';

export const MAINTENANCE_HISTORY_SEED_DATA: (typeof equipmentMaintenanceHistory.$inferInsert)[] = [
  {
    id: MAINT_HIST_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    performedAt: daysAgo(60),
    content: '정기 점검: 팬 필터 청소, 내부 먼지 제거, 전원부 전압 확인 (정상)',
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: MAINT_HIST_002_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    performedAt: daysAgo(180),
    content: '반기 점검: 감쇠기 교체, RF 커넥터 청소, 자기 테스트 실행 (PASS)',
    performedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: MAINT_HIST_003_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    performedAt: daysAgo(45),
    content: '정기 점검: 출력 레벨 확인 (-10dBm ± 0.3dB), 변조 신호 검증',
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: MAINT_HIST_004_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    performedAt: daysAgo(35),
    content: '정기 점검: 포트 커넥터 토크 확인, Electronic Cal Kit 검증',
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: MAINT_HIST_005_ID,
    equipmentId: EQUIP_EMC_RECEIVER_SUW_E_ID,
    performedAt: daysAgo(90),
    content: '반기 점검: CISPR 16 준거 확인, 사전선택기 동작 테스트, LISN 연결 확인',
    performedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: MAINT_HIST_006_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    performedAt: daysAgo(25),
    content: '정기 점검: 프로브 보정, 트리거 레벨 검증, 화면 교정',
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: MAINT_HIST_007_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    performedAt: daysAgo(150),
    content: '반기 점검: 배터리 교체, 팬 모터 확인, 펌웨어 업데이트 (v3.2.1)',
    performedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: MAINT_HIST_008_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    performedAt: daysAgo(40),
    content: '정기 점검: 로봇 암 동작 검증, 프로브 세척, 액체 온도 확인 (22.0±0.5°C)',
    performedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: MAINT_HIST_009_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    performedAt: daysAgo(160),
    content: '반기 점검: 팬텀 액체 교체, 프로브 감도 검증, 위치 정밀도 테스트',
    performedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: MAINT_HIST_010_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    performedAt: daysAgo(70),
    content: '정기 점검: RF 입력 커넥터 청소, 감도 확인, 자기 진단 실행 (정상)',
    performedBy: USER_TEST_ENGINEER_UIWANG_ID,
  },
];
