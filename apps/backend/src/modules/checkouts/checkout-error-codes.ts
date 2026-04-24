/**
 * SINGLE SOURCE OF TRUTH: checkouts 모듈 에러 코드
 *
 * checkouts.service.ts / checkouts.controller.ts 에서 인라인 문자열 대신 사용.
 * 프론트엔드 비공유 — 백엔드 전용 상수 (shared-constants 등록 불필요).
 */
export const CheckoutErrorCode = {
  /** FSM 전이 불가 상태 */
  INVALID_TRANSITION: 'CHECKOUT_INVALID_TRANSITION',
  /** 권한 부족 */
  FORBIDDEN: 'CHECKOUT_FORBIDDEN',
  /** 유효하지 않은 UUID 형식 */
  INVALID_UUID: 'CHECKOUT_INVALID_UUID',
  /** 반출 레코드를 찾을 수 없음 */
  NOT_FOUND: 'CHECKOUT_NOT_FOUND',
  /** 다른 사이트/팀 소속 장비 반출 시도 */
  CROSS_TEAM_FORBIDDEN: 'CHECKOUT_CROSS_TEAM_FORBIDDEN',
  /** 반출 장비 항목 없음 */
  NO_EQUIPMENT: 'CHECKOUT_NO_EQUIPMENT',
  /** 장비 UUID가 존재하지 않음 */
  EQUIPMENT_NOT_FOUND: 'CHECKOUT_EQUIPMENT_NOT_FOUND',
  /** 해당 장비에 이미 활성 반출이 존재함 */
  EQUIPMENT_ALREADY_ACTIVE: 'CHECKOUT_EQUIPMENT_ALREADY_ACTIVE',
  /** 장비 상태가 반출 불가 상태 */
  EQUIPMENT_STATUS_INVALID: 'CHECKOUT_EQUIPMENT_STATUS_INVALID',
  /** 자기 팀 장비만 가능 */
  OWN_TEAM_ONLY: 'CHECKOUT_OWN_TEAM_ONLY',
  /** 다른 팀 장비만 가능 */
  OTHER_TEAM_ONLY: 'CHECKOUT_OTHER_TEAM_ONLY',
  /** 반납 예정일이 오늘 이전 */
  INVALID_RETURN_DATE: 'CHECKOUT_INVALID_RETURN_DATE',
  /** 반납 예정일이 과거 */
  RETURN_DATE_PAST: 'CHECKOUT_RETURN_DATE_PAST',
  /** 승인자 팀 정보 필요 */
  APPROVER_REQUIRED: 'CHECKOUT_APPROVER_REQUIRED',
  /** 대여 목적: 장비 소속 팀 기술책임자만 승인/반려 가능 */
  LENDER_TEAM_ONLY: 'CHECKOUT_LENDER_TEAM_ONLY',
  /** 반려 사유 필수 */
  REJECTION_REASON_REQUIRED: 'CHECKOUT_REJECTION_REASON_REQUIRED',
  /** 반출 시작 전 작동 상태 확인 필수 */
  WORKING_STATUS_REQUIRED: 'CHECKOUT_WORKING_STATUS_REQUIRED',
  /** 교정 목적: 반출 전 교정 확인 필수 */
  CALIBRATION_CHECK_REQUIRED: 'CHECKOUT_CALIBRATION_CHECK_REQUIRED',
  /** 수리 목적: 반출 전 수리 확인 필수 */
  REPAIR_CHECK_REQUIRED: 'CHECKOUT_REPAIR_CHECK_REQUIRED',
  /** 컨디션 체크는 렌탈 목적만 가능 */
  CONDITION_CHECK_RENTAL_ONLY: 'CHECKOUT_CONDITION_CHECK_RENTAL_ONLY',
  /** 유효하지 않은 컨디션 체크 단계 */
  INVALID_CONDITION_STEP: 'CHECKOUT_INVALID_CONDITION_STEP',
  /** 현재 상태에서 해당 컨디션 체크 단계 불가 */
  INVALID_STATUS_FOR_STEP: 'CHECKOUT_INVALID_STATUS_FOR_STEP',
  /** 대기(PENDING) 상태만 수정 가능 */
  ONLY_PENDING_CAN_UPDATE: 'CHECKOUT_ONLY_PENDING_CAN_UPDATE',
  /** 차용 팀 1차 승인/반려는 rental 목적만 가능 */
  BORROWER_APPROVE_RENTAL_ONLY: 'CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY',
  /** 차용 팀 기술책임자만 1차 승인/반려 가능 */
  BORROWER_TEAM_ONLY: 'CHECKOUT_BORROWER_TEAM_ONLY',
} as const;

export type CheckoutErrorCode = (typeof CheckoutErrorCode)[keyof typeof CheckoutErrorCode];
