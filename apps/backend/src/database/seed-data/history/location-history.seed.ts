/**
 * Equipment Location History seed data
 * 10 location change records across multiple equipment
 */

import { equipmentLocationHistory } from '@equipment-management/db/schema';
import { daysAgo } from '../../utils/date-helpers';
import {
  LOC_HIST_001_ID,
  LOC_HIST_002_ID,
  LOC_HIST_003_ID,
  LOC_HIST_004_ID,
  LOC_HIST_005_ID,
  LOC_HIST_006_ID,
  LOC_HIST_007_ID,
  LOC_HIST_008_ID,
  LOC_HIST_009_ID,
  LOC_HIST_010_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_NETWORK_ANALYZER_SUW_E_ID,
  EQUIP_OSCILLOSCOPE_SUW_R_ID,
  EQUIP_SAR_PROBE_SUW_S_ID,
  EQUIP_RECEIVER_UIW_W_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../../utils/uuid-constants';

export const LOCATION_HISTORY_SEED_DATA: (typeof equipmentLocationHistory.$inferInsert)[] = [
  // Spectrum Analyzer — 3 moves
  {
    id: LOC_HIST_001_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    changedAt: daysAgo(90),
    previousLocation: null,
    newLocation: '수원 본관 1층 입고실',
    notes: '신규 장비 입고',
    changedBy: USER_TEST_ENGINEER_SUWON_ID,
  },
  {
    id: LOC_HIST_002_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    changedAt: daysAgo(85),
    previousLocation: '수원 본관 1층 입고실',
    newLocation: '수원 본관 2층 EMC 시험실 A',
    notes: '초기 설치 완료',
    changedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: LOC_HIST_003_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    changedAt: daysAgo(10),
    previousLocation: '수원 본관 2층 EMC 시험실 A',
    newLocation: '수원 본관 3층 RF 시험실',
    notes: 'RF 시험 지원을 위한 임시 이동',
    changedBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // Signal Generator — 2 moves
  {
    id: LOC_HIST_004_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    changedAt: daysAgo(120),
    previousLocation: null,
    newLocation: '수원 본관 2층 EMC 시험실 A',
    notes: '최초 배치',
    changedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: LOC_HIST_005_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    changedAt: daysAgo(30),
    previousLocation: '수원 본관 2층 EMC 시험실 A',
    newLocation: '수원 본관 2층 EMC 시험실 B',
    notes: '시험실 재배치',
    changedBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // Network Analyzer — 2 moves
  {
    id: LOC_HIST_006_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    changedAt: daysAgo(150),
    previousLocation: null,
    newLocation: '수원 본관 2층 EMC 시험실 A',
    notes: null,
    changedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },
  {
    id: LOC_HIST_007_ID,
    equipmentId: EQUIP_NETWORK_ANALYZER_SUW_E_ID,
    changedAt: daysAgo(42),
    previousLocation: '수원 본관 2층 EMC 시험실 A',
    newLocation: '수원 별관 1층 수리실',
    notes: '수리를 위한 이동',
    changedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },

  // Oscilloscope — 1 move
  {
    id: LOC_HIST_008_ID,
    equipmentId: EQUIP_OSCILLOSCOPE_SUW_R_ID,
    changedAt: daysAgo(200),
    previousLocation: null,
    newLocation: '수원 본관 2층 일반 EMC 시험실',
    notes: '최초 배치',
    changedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
  },

  // SAR Probe — 1 move
  {
    id: LOC_HIST_009_ID,
    equipmentId: EQUIP_SAR_PROBE_SUW_S_ID,
    changedAt: daysAgo(100),
    previousLocation: null,
    newLocation: '수원 본관 4층 SAR 시험실',
    notes: null,
    changedBy: USER_TEST_ENGINEER_SUWON_ID,
  },

  // Uiwang Receiver — 1 move
  {
    id: LOC_HIST_010_ID,
    equipmentId: EQUIP_RECEIVER_UIW_W_ID,
    changedAt: daysAgo(60),
    previousLocation: null,
    newLocation: '의왕 1층 RF 시험실',
    notes: '의왕 시험소 배치',
    changedBy: USER_TEST_ENGINEER_UIWANG_ID,
  },
];
