/**
 * Equipment ↔ Test Software M:N link seed data
 *
 * 8 records: 장비와 시험용 소프트웨어 간의 연결 관계
 * 실제 시험실에서 하나의 장비가 여러 SW로 제어되고,
 * 하나의 SW가 여러 장비를 제어하는 M:N 관계를 반영합니다.
 */

import type { NewEquipmentTestSoftware } from '@equipment-management/db/schema';
import {
  EQ_SW_LINK_001_ID,
  EQ_SW_LINK_002_ID,
  EQ_SW_LINK_003_ID,
  EQ_SW_LINK_004_ID,
  EQ_SW_LINK_005_ID,
  EQ_SW_LINK_006_ID,
  EQ_SW_LINK_007_ID,
  EQ_SW_LINK_008_ID,
  // Equipment IDs
  EQUIP_EMC_RECEIVER_SUW_E_ID,
  EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
  EQUIP_SIGNAL_GEN_SUW_E_ID,
  EQUIP_SAR_PROBE_SUW_S_ID,
  EQUIP_SAR_SYSTEM_SUW_S_ID,
  EQUIP_PHANTOM_HEAD_SUW_S_ID,
} from '../../utils/uuid-constants';
import {
  TEST_SOFTWARE_EMC32_RED_ID,
  TEST_SOFTWARE_IECSOFT_ID,
  TEST_SOFTWARE_EMC32_EMC_ID,
  TEST_SOFTWARE_DASY5_ID,
  TEST_SOFTWARE_DASY6_ID,
  TEST_SOFTWARE_DASY8_SAR_ID,
  TEST_SOFTWARE_SEMCAD_X_ID,
} from './test-software.seed';

type SeedRow = NewEquipmentTestSoftware;

export const EQUIPMENT_TEST_SOFTWARE_SEED_DATA: SeedRow[] = [
  // EMC 수신기 ↔ EMC32 (RED) — RF/EMC 방사 시험 자동화
  {
    id: EQ_SW_LINK_001_ID,
    equipmentId: EQUIP_EMC_RECEIVER_SUW_E_ID,
    testSoftwareId: TEST_SOFTWARE_EMC32_RED_ID,
    notes: 'RED 방사 방해 자동 시험용',
  },

  // EMC 수신기 ↔ EMC32 (EMC) — EMC 전도/방사 시험
  {
    id: EQ_SW_LINK_002_ID,
    equipmentId: EQUIP_EMC_RECEIVER_SUW_E_ID,
    testSoftwareId: TEST_SOFTWARE_EMC32_EMC_ID,
    notes: 'CISPR 32 전도/방사 방해 시험용',
  },

  // 스펙트럼 분석기 ↔ IECSoft — 전도성 방해 시험
  {
    id: EQ_SW_LINK_003_ID,
    equipmentId: EQUIP_SPECTRUM_ANALYZER_SUW_E_ID,
    testSoftwareId: TEST_SOFTWARE_IECSOFT_ID,
    notes: 'IEC 61000-4 전도성 내성 시험 제어',
  },

  // 신호 발생기 ↔ EMC32 (RED) — 신호 생성 제어
  {
    id: EQ_SW_LINK_004_ID,
    equipmentId: EQUIP_SIGNAL_GEN_SUW_E_ID,
    testSoftwareId: TEST_SOFTWARE_EMC32_RED_ID,
    notes: '시험 신호 생성 자동 제어',
  },

  // SAR 프로브 ↔ DASY5 — SAR 측정
  {
    id: EQ_SW_LINK_005_ID,
    equipmentId: EQUIP_SAR_PROBE_SUW_S_ID,
    testSoftwareId: TEST_SOFTWARE_DASY5_ID,
    notes: 'SAR 프로브 데이터 수집',
  },

  // SAR 시스템 ↔ DASY8 — 최신 SAR 측정 시스템
  {
    id: EQ_SW_LINK_006_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    testSoftwareId: TEST_SOFTWARE_DASY8_SAR_ID,
    notes: 'DASY8 통합 SAR 측정',
  },

  // SAR 시스템 ↔ DASY6 — SAR 측정 (하위 호환)
  {
    id: EQ_SW_LINK_007_ID,
    equipmentId: EQUIP_SAR_SYSTEM_SUW_S_ID,
    testSoftwareId: TEST_SOFTWARE_DASY6_ID,
    notes: 'DASY6 하위 호환 SAR 측정',
  },

  // 팬텀 헤드 ↔ SEMCAD X — SAR 시뮬레이션 검증
  {
    id: EQ_SW_LINK_008_ID,
    equipmentId: EQUIP_PHANTOM_HEAD_SUW_S_ID,
    testSoftwareId: TEST_SOFTWARE_SEMCAD_X_ID,
    notes: 'SAR 시뮬레이션 vs 실측 비교 검증',
  },
];
