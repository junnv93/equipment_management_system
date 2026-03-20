import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 반납 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - good: 양호
 * - damaged: 손상
 * - lost: 분실
 * - needs_repair: 수리 필요
 * - needs_calibration: 교정 필요
 */
export const RETURN_CONDITION_VALUES = [
  'good', // 양호
  'damaged', // 손상
  'lost', // 분실
  'needs_repair', // 수리 필요
  'needs_calibration', // 교정 필요
] as const;

export const ReturnConditionEnum = z.enum(RETURN_CONDITION_VALUES);
export type ReturnCondition = z.infer<typeof ReturnConditionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 반납 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기
 * - approved: 승인됨
 * - rejected: 반려됨
 */
export const RETURN_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const;

export const ReturnApprovalStatusEnum = z.enum(RETURN_APPROVAL_STATUS_VALUES);
export type ReturnApprovalStatus = z.infer<typeof ReturnApprovalStatusEnum>;

// ============================================================================
// 대여 목적 양측 4단계 확인 관련 ENUM (시험소간 대여)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 상태 확인 단계 열거형 (대여 목적)
 *
 * 대여 목적 반출 시 양측 4단계 확인을 위한 단계 구분:
 * - lender_checkout: ① 반출 전 확인 (빌려주는 측)
 * - borrower_receive: ② 인수 시 확인 (빌리는 측)
 * - borrower_return: ③ 반납 전 확인 (빌린 측)
 * - lender_return: ④ 반입 시 확인 (빌려준 측)
 */
export const CONDITION_CHECK_STEP_VALUES = [
  'lender_checkout', // ① 반출 전 (빌려주는 측)
  'borrower_receive', // ② 인수 시 (빌리는 측)
  'borrower_return', // ③ 반납 전 (빌린 측)
  'lender_return', // ④ 반입 시 (빌려준 측)
] as const;

export const ConditionCheckStepEnum = z.enum(CONDITION_CHECK_STEP_VALUES);
export type ConditionCheckStep = z.infer<typeof ConditionCheckStepEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 외관/작동 상태 열거형
 *
 * 상태 확인 시 외관 및 작동 상태를 기록하기 위한 열거형:
 * - normal: 정상
 * - abnormal: 이상
 */
export const CONDITION_STATUS_VALUES = ['normal', 'abnormal'] as const;

export const ConditionStatusEnum = z.enum(CONDITION_STATUS_VALUES);
export type ConditionStatus = z.infer<typeof ConditionStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 부속품 상태 열거형
 *
 * 상태 확인 시 부속품 상태를 기록하기 위한 열거형:
 * - complete: 완전 (모든 부속품 확인)
 * - incomplete: 불완전 (일부 부속품 누락)
 */
export const ACCESSORIES_STATUS_VALUES = ['complete', 'incomplete'] as const;

export const AccessoriesStatusEnum = z.enum(ACCESSORIES_STATUS_VALUES);
export type AccessoriesStatus = z.infer<typeof AccessoriesStatusEnum>;
