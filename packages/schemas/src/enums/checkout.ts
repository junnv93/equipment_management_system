import { z } from 'zod';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending: 반출 신청 (승인 대기)
 * - approved: 승인됨 (반출 가능)
 * - rejected: 거절됨
 * - checked_out: 반출 중
 * - returned: 반입 완료
 * - return_approved: 반입 최종 승인됨 (기술책임자 승인)
 * - overdue: 반입 기한 초과
 * - canceled: 취소됨
 */
// 반출 상태값 배열 (Zod enum과 동기화)
export const CHECKOUT_STATUS_VALUES = [
  'pending', // 반출 신청 (승인 대기)
  'borrower_approved', // 대여 1차 승인됨 (차용 팀 TM 승인 완료, lender TM 승인 대기) — rental 전용
  'approved', // 승인됨 (반출 가능)
  'rejected', // 거절됨
  'checked_out', // 반출 중 (교정/수리)
  // 대여 목적 양측 확인 상태 (시험소간 대여)
  'lender_checked', // ① 반출 전 확인 완료 (빌려주는 측)
  'borrower_received', // ② 인수 확인 완료 (빌리는 측)
  'in_use', // 사용 중 (대여)
  'borrower_returned', // ③ 반납 전 확인 완료 (빌린 측)
  'lender_received', // ④ 반입 확인 완료 (빌려준 측)
  'returned', // 반입 완료 (검사 완료)
  'return_approved', // 반입 최종 승인됨 (기술책임자 승인)
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

export const CheckoutStatusEnum = z.enum(CHECKOUT_STATUS_VALUES);
export type CheckoutStatus = z.infer<typeof CheckoutStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적 열거형
 */
// 반출 목적값 배열 (Zod enum과 동기화)
export const CHECKOUT_PURPOSE_VALUES = [
  'calibration', // 교정
  'repair', // 수리
  'rental', // 대여
  'return_to_vendor', // 렌탈 반납
] as const;

export const CheckoutPurposeEnum = z.enum(CHECKOUT_PURPOSE_VALUES);
export type CheckoutPurpose = z.infer<typeof CheckoutPurposeEnum>;

/**
 * 사용자가 반출 신청 시 선택 가능한 목적 (return_to_vendor는 시스템 전용)
 */
export const USER_SELECTABLE_CHECKOUT_PURPOSES = ['calibration', 'repair', 'rental'] as const;
export const UserSelectableCheckoutPurposeEnum = z.enum(USER_SELECTABLE_CHECKOUT_PURPOSES);
export type UserSelectableCheckoutPurpose = z.infer<typeof UserSelectableCheckoutPurposeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 유형 열거형
 *
 * 모든 반출 유형은 1단계 승인으로 통합됨 (기술책임자 승인):
 * - calibration: 교정 목적 반출 (외부 교정기관)
 * - repair: 수리 목적 반출 (외부 수리업체)
 * - rental: 대여 목적 반출 (시험소 간 대여)
 */
export const CHECKOUT_TYPE_VALUES = [
  'calibration', // 교정 목적 반출
  'repair', // 수리 목적 반출
  'rental', // 대여 목적 반출
] as const;

export const CheckoutTypeEnum = z.enum(CHECKOUT_TYPE_VALUES as readonly [string, ...string[]]);
export type CheckoutType = z.infer<typeof CheckoutTypeEnum>;

// ============================================================================
// 반출 방향 (outbound/inbound)
// ============================================================================

export const CHECKOUT_DIRECTION_VALUES = ['outbound', 'inbound'] as const;
export const CheckoutDirectionEnum = z.enum(CHECKOUT_DIRECTION_VALUES);
export type CheckoutDirection = z.infer<typeof CheckoutDirectionEnum>;

// ============================================================================
// 양식 출력 관점 (UL-QP-18-06) — rental 전용 2장 분리 출력
// ============================================================================

/**
 * 반출입 확인서 출력 관점
 * - lender: 빌려주는 팀 관점 (반출→반입 순서)
 * - borrower: 빌리는 팀 관점 (반입→반출 순서)
 */
export const CHECKOUT_FORM_PERSPECTIVE_VALUES = ['lender', 'borrower'] as const;
export const CheckoutFormPerspectiveEnum = z.enum(CHECKOUT_FORM_PERSPECTIVE_VALUES);
export type CheckoutFormPerspective = z.infer<typeof CheckoutFormPerspectiveEnum>;
