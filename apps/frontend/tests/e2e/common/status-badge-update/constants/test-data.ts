/**
 * ✅ SSOT: Status Badge Update 테스트 상수
 *
 * 모든 enum/label은 shared package에서 import
 * ❌ 금지: 하드코딩된 status 문자열, UUID, 라벨
 */

import {
  EquipmentStatus,
  NonConformanceStatus,
  EQUIPMENT_STATUS_LABELS,
  NON_CONFORMANCE_STATUS_LABELS,
} from '@equipment-management/schemas';

// 테스트 장비 ID (uuid-constants.ts 기반)
export const STATUS_UPDATE_TEST_EQUIPMENT_ID = 'eeee1001-0001-4001-8001-000000000001'; // EQUIP_SPECTRUM_ANALYZER_SUW_E_ID
export const LIST_SYNC_TEST_EQUIPMENT_ID = 'eeee1002-0002-4002-8002-000000000002'; // EQUIP_SIGNAL_GEN_SUW_E_ID
export const NC_CLOSURE_TEST_EQUIPMENT_ID = 'eeee1004-0004-4004-8004-000000000004'; // EQUIP_POWER_METER_SUW_E_ID

// 관리번호 (Seed 데이터와 매칭)
// ✅ FIXED: 실제 seed data의 관리번호 사용
export const EQUIPMENT_MANAGEMENT_NUMBERS = {
  STATUS_UPDATE: 'SUW-E0001', // EQUIP_SPECTRUM_ANALYZER_SUW_E_ID
  LIST_SYNC: 'SUW-E0002', // EQUIP_SIGNAL_GEN_SUW_E_ID
  NC_CLOSURE: 'SUW-E0004', // EQUIP_POWER_METER_SUW_E_ID
} as const;

// ✅ SSOT: 상태/부적합 라벨은 @equipment-management/schemas에서 직접 import
// EQUIPMENT_STATUS_LABELS, NON_CONFORMANCE_STATUS_LABELS - 위에서 import됨

// 타임아웃 (ms)
export const TIMEOUTS = {
  DIALOG_ANIMATION: 500,
  UI_UPDATE: 1000,
  API_RESPONSE: 5000,
  NAVIGATION: 10000,
  CACHE_INVALIDATION: 3000, // React Query invalidate + refetch
  PAGE_LOAD: 15000,
  HYDRATION_CHECK: 3000,
} as const;

// 사고 유형
export const INCIDENT_TYPES = {
  DAMAGE: '손상',
  MALFUNCTION: '고장',
  LOST: '분실',
  OTHER: '기타',
} as const;
