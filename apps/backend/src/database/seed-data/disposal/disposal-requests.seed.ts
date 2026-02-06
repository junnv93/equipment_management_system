/**
 * Disposal Workflow E2E Test - Disposal Requests Seed Data
 * ========================================================
 *
 * 16개 disposal requests (각 그룹별 독립 요청):
 * - Group A: 5개 (A1=pending, A4=pending, A5=reviewed, A6=approved, A7=pending-Uiwang)
 * - Group C: 4개 (C1=pending, C2=reviewed, C3=pending, C4=reviewed)
 * - Group D: 4개 (D1=pending, D3=pending, D4=pending, D5=reviewed)
 * - Group E: 3개 (E1=pending, E2=reviewed, E3=approved)
 *
 * Group B는 테스트 중 동적 생성 (sequential workflow)
 */

import { NewDisposalRequest } from '@equipment-management/db/schema';
import {
  // Users
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  USER_LAB_MANAGER_SUWON_ID,

  // Equipment UUIDs (Group A)
  EQUIP_DISPOSAL_PERM_A1,
  EQUIP_DISPOSAL_PERM_A4,
  EQUIP_DISPOSAL_PERM_A5,
  EQUIP_DISPOSAL_PERM_A6,
  EQUIP_DISPOSAL_PERM_A7,

  // Equipment UUIDs (Group C)
  EQUIP_DISPOSAL_REJ_C1,
  EQUIP_DISPOSAL_REJ_C2,
  EQUIP_DISPOSAL_REJ_C3,
  EQUIP_DISPOSAL_REJ_C4,

  // Equipment UUIDs (Group D)
  EQUIP_DISPOSAL_EXC_D1,
  EQUIP_DISPOSAL_EXC_D3,
  EQUIP_DISPOSAL_EXC_D4,
  EQUIP_DISPOSAL_EXC_D5,

  // Equipment UUIDs (Group E)
  EQUIP_DISPOSAL_UI_E1,
  EQUIP_DISPOSAL_UI_E2,
  EQUIP_DISPOSAL_UI_E3,

  // Disposal Request IDs
  DISP_REQ_A1_ID,
  DISP_REQ_A4_ID,
  DISP_REQ_A5_ID,
  DISP_REQ_A6_ID,
  DISP_REQ_A7_ID,
  DISP_REQ_C1_ID,
  DISP_REQ_C2_ID,
  DISP_REQ_C3_ID,
  DISP_REQ_C4_ID,
  DISP_REQ_D1_ID,
  DISP_REQ_D3_ID,
  DISP_REQ_D4_ID,
  DISP_REQ_D5_ID,
  DISP_REQ_E1_ID,
  DISP_REQ_E2_ID,
  DISP_REQ_E3_ID,
} from '../../utils/uuid-constants';

// 공통 날짜 (과거 시점)
const PAST_DATE = new Date('2025-01-15T09:00:00Z');
const REVIEW_DATE = new Date('2025-01-16T10:00:00Z');
const APPROVAL_DATE = new Date('2025-01-17T11:00:00Z');

// =============================================================================
// GROUP A: 권한 검증 (5 requests)
// =============================================================================

export const DISPOSAL_REQUESTS_GROUP_A: NewDisposalRequest[] = [
  // A1: pending (test_engineer 요청, 검토 대기 - Suite 1.1 전용)
  {
    id: DISP_REQ_A1_ID,
    equipmentId: EQUIP_DISPOSAL_PERM_A1,
    reason: 'obsolete',
    reasonDetail: '장비 노후화로 인한 성능 저하. Suite 1.1 테스트용 데이터입니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // A4: pending (test_engineer 요청, 검토 대기)
  {
    id: DISP_REQ_A4_ID,
    equipmentId: EQUIP_DISPOSAL_PERM_A4,
    reason: 'obsolete',
    reasonDetail: '장비 노후화로 인한 성능 저하가 심각합니다. 최신 모델로 교체가 필요합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // A5: reviewed (technical_manager 검토 완료, 승인 대기)
  {
    id: DISP_REQ_A5_ID,
    equipmentId: EQUIP_DISPOSAL_PERM_A5,
    reason: 'defective',
    reasonDetail: '수리 불가능한 하드웨어 고장이 발생했습니다. 부품 단종으로 수리가 불가합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'reviewed',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '장비 상태 확인 결과 수리 불가 판정. 폐기가 적절합니다.',
    createdAt: PAST_DATE,
    updatedAt: REVIEW_DATE,
  },

  // A6: approved (lab_manager 최종 승인, 폐기 완료)
  {
    id: DISP_REQ_A6_ID,
    equipmentId: EQUIP_DISPOSAL_PERM_A6,
    reason: 'replaced',
    reasonDetail: '신규 장비로 교체되어 기존 장비는 더 이상 필요하지 않습니다.',
    requestedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'approved',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '신규 장비로 대체 완료. 폐기 진행 가능합니다.',
    approvedBy: USER_LAB_MANAGER_SUWON_ID,
    approvedAt: APPROVAL_DATE,
    approvalComment: '최종 승인합니다. 폐기 절차를 진행하십시오.',
    createdAt: PAST_DATE,
    updatedAt: APPROVAL_DATE,
  },

  // A7: pending (Uiwang team, 다른 팀 검토 권한 테스트)
  {
    id: DISP_REQ_A7_ID,
    equipmentId: EQUIP_DISPOSAL_PERM_A7,
    reason: 'obsolete',
    reasonDetail: '의왕 팀 장비 노후화로 인한 폐기 요청입니다. 교체 장비가 준비되었습니다.',
    requestedBy: USER_TECHNICAL_MANAGER_UIWANG_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },
];

// =============================================================================
// GROUP C: 반려 시나리오 (4 requests)
// =============================================================================

export const DISPOSAL_REQUESTS_GROUP_C: NewDisposalRequest[] = [
  // C1: pending (검토 단계 반려 테스트)
  {
    id: DISP_REQ_C1_ID,
    equipmentId: EQUIP_DISPOSAL_REJ_C1,
    reason: 'defective',
    reasonDetail: '장비 고장으로 인한 폐기 요청입니다. 수리 견적이 구매 가격의 80%를 초과합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // C2: reviewed (승인 단계 반려 테스트)
  {
    id: DISP_REQ_C2_ID,
    equipmentId: EQUIP_DISPOSAL_REJ_C2,
    reason: 'obsolete',
    reasonDetail:
      '제조사 지원 종료로 인한 폐기 요청입니다. 더 이상 소프트웨어 업데이트가 제공되지 않습니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'reviewed',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '장비 상태 점검 완료. 폐기 진행을 권장합니다.',
    createdAt: PAST_DATE,
    updatedAt: REVIEW_DATE,
  },

  // C3: pending (검증 테스트용)
  {
    id: DISP_REQ_C3_ID,
    equipmentId: EQUIP_DISPOSAL_REJ_C3,
    reason: 'defective',
    reasonDetail: '측정 정확도가 사양을 벗어나며 교정이 불가능합니다. 폐기가 필요합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // C4: reviewed (취소 테스트용)
  {
    id: DISP_REQ_C4_ID,
    equipmentId: EQUIP_DISPOSAL_REJ_C4,
    reason: 'replaced',
    reasonDetail: '신규 모델로 교체되어 기존 장비는 더 이상 사용하지 않습니다.',
    requestedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'reviewed',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '신규 장비 도입 완료. 폐기 가능합니다.',
    createdAt: PAST_DATE,
    updatedAt: REVIEW_DATE,
  },
];

// =============================================================================
// GROUP D: 예외 처리 (4 requests)
// =============================================================================

export const DISPOSAL_REQUESTS_GROUP_D: NewDisposalRequest[] = [
  // D1: pending (중복 요청 테스트)
  {
    id: DISP_REQ_D1_ID,
    equipmentId: EQUIP_DISPOSAL_EXC_D1,
    reason: 'defective',
    reasonDetail: '센서 오작동으로 인한 폐기 요청입니다. 재현 가능한 오류가 발생합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // D3: pending (요청자 취소 테스트 - requestedBy=test_engineer)
  {
    id: DISP_REQ_D3_ID,
    equipmentId: EQUIP_DISPOSAL_EXC_D3,
    reason: 'obsolete',
    reasonDetail: '어댑터 노후화로 인한 폐기 요청입니다. 하지만 대체품 입고가 지연되고 있습니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // D4: pending (다른 사용자 취소 테스트 - requestedBy=technical_manager)
  {
    id: DISP_REQ_D4_ID,
    equipmentId: EQUIP_DISPOSAL_EXC_D4,
    reason: 'replaced',
    reasonDetail: '커넥터 교체로 인한 폐기 요청입니다. 신규 규격의 커넥터로 대체되었습니다.',
    requestedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // D5: reviewed (검토 후 취소 불가 테스트)
  {
    id: DISP_REQ_D5_ID,
    equipmentId: EQUIP_DISPOSAL_EXC_D5,
    reason: 'defective',
    reasonDetail:
      '터미네이터 임피던스 불량으로 인한 폐기 요청입니다. 측정 오차가 허용 범위를 초과합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'reviewed',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '장비 점검 완료. 수리 불가 판정으로 폐기가 적절합니다.',
    createdAt: PAST_DATE,
    updatedAt: REVIEW_DATE,
  },
];

// =============================================================================
// GROUP E: UI/UX & Accessibility (3 requests)
// =============================================================================

export const DISPOSAL_REQUESTS_GROUP_E: NewDisposalRequest[] = [
  // E1: pending (진행도 스텝 1 테스트)
  {
    id: DISP_REQ_E1_ID,
    equipmentId: EQUIP_DISPOSAL_UI_E1,
    reason: 'defective',
    reasonDetail: '프로브 팁 손상으로 인한 폐기 요청입니다. 측정 오류가 빈번하게 발생합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'pending',
    createdAt: PAST_DATE,
    updatedAt: PAST_DATE,
  },

  // E2: reviewed (진행도 스텝 2 테스트)
  {
    id: DISP_REQ_E2_ID,
    equipmentId: EQUIP_DISPOSAL_UI_E2,
    reason: 'obsolete',
    reasonDetail: '클램프 구형 모델로 신규 장비와 호환성이 떨어집니다. 교체가 필요합니다.',
    requestedBy: USER_TEST_ENGINEER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'reviewed',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '신규 모델 도입으로 기존 장비 폐기가 적절합니다.',
    createdAt: PAST_DATE,
    updatedAt: REVIEW_DATE,
  },

  // E3: approved (진행도 스텝 3 테스트 - 완료)
  {
    id: DISP_REQ_E3_ID,
    equipmentId: EQUIP_DISPOSAL_UI_E3,
    reason: 'defective',
    reasonDetail: '필터 성능 저하로 인한 폐기 요청입니다. 차단 주파수가 사양을 벗어났습니다.',
    requestedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    requestedAt: PAST_DATE,
    reviewStatus: 'approved',
    reviewedBy: USER_TECHNICAL_MANAGER_SUWON_ID,
    reviewedAt: REVIEW_DATE,
    reviewOpinion: '성능 저하 확인. 폐기 진행합니다.',
    approvedBy: USER_LAB_MANAGER_SUWON_ID,
    approvedAt: APPROVAL_DATE,
    approvalComment: '최종 승인. 폐기 절차를 완료하십시오.',
    createdAt: PAST_DATE,
    updatedAt: APPROVAL_DATE,
  },
];

// =============================================================================
// EXPORT ALL DISPOSAL REQUESTS
// =============================================================================

export const DISPOSAL_REQUESTS_SEED_DATA: NewDisposalRequest[] = [
  ...DISPOSAL_REQUESTS_GROUP_A,
  ...DISPOSAL_REQUESTS_GROUP_C,
  ...DISPOSAL_REQUESTS_GROUP_D,
  ...DISPOSAL_REQUESTS_GROUP_E,
];
