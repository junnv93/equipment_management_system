import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 교정 승인 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending_approval: 승인 대기 (시험실무자가 등록)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_APPROVAL_STATUS_VALUES = [
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationApprovalStatusEnum = z.enum(CALIBRATION_APPROVAL_STATUS_VALUES);
export type CalibrationApprovalStatus = z.infer<typeof CalibrationApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 등록자 역할 열거형
 */
export const CALIBRATION_REGISTERED_BY_ROLE_VALUES = [
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
] as const;

export const CalibrationRegisteredByRoleEnum = z.enum(CALIBRATION_REGISTERED_BY_ROLE_VALUES);
export type CalibrationRegisteredByRole = z.infer<typeof CalibrationRegisteredByRoleEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 결과 열거형
 *
 * 표준 결과값 (소문자):
 * - pass: 적합 (PASS)
 * - fail: 부적합 (FAIL)
 * - conditional: 조건부 적합 (CONDITIONAL)
 */
export const CALIBRATION_RESULT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
  'conditional', // 조건부 적합
] as const;

export const CalibrationResultEnum = z.enum(CALIBRATION_RESULT_VALUES);
export type CalibrationResult = z.infer<typeof CalibrationResultEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - antenna_gain: 안테나 이득
 * - cable_loss: 케이블 손실
 * - path_loss: 경로 손실
 * - amplifier_gain: 증폭기 이득
 * - other: 기타
 */
export const CALIBRATION_FACTOR_TYPE_VALUES = [
  'antenna_gain', // 안테나 이득
  'cable_loss', // 케이블 손실
  'path_loss', // 경로 손실
  'amplifier_gain', // 증폭기 이득
  'other', // 기타
] as const;

export const CalibrationFactorTypeEnum = z.enum(CALIBRATION_FACTOR_TYPE_VALUES);
export type CalibrationFactorType = z.infer<typeof CalibrationFactorTypeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (시험실무자가 변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationFactorApprovalStatusEnum = z.enum(
  CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES
);
export type CalibrationFactorApprovalStatus = z.infer<typeof CalibrationFactorApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 필요 여부 열거형
 *
 * 표준 값 (소문자):
 * - required: 필요
 * - not_required: 불필요
 */
export const CALIBRATION_REQUIRED_VALUES = [
  'required', // 필요
  'not_required', // 불필요
] as const;

export const CalibrationRequiredEnum = z.enum(CALIBRATION_REQUIRED_VALUES);
export type CalibrationRequired = z.infer<typeof CalibrationRequiredEnum>;

// NOTE: CalibrationStatusEnum/CalibrationStatus는 calibration.ts에서 정의 (SSOT)
// 여기서 재정의 금지 — 중복 export 충돌 발생

/**
 * SINGLE SOURCE OF TRUTH: 중간점검 상태 열거형
 *
 * 중간점검 필터링 및 UI 표시에 사용:
 * - pending: 대기 (점검 필요)
 * - completed: 완료
 * - overdue: 기한 초과
 * - due: 점검 예정 (곧 도래)
 */
export const INTERMEDIATE_CHECK_STATUS_VALUES = [
  'pending', // 대기
  'completed', // 완료
  'overdue', // 기한 초과
  'due', // 점검 예정
] as const;

export const IntermediateCheckStatusEnum = z.enum(INTERMEDIATE_CHECK_STATUS_VALUES);
export type IntermediateCheckStatus = z.infer<typeof IntermediateCheckStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 시방일치 여부 열거형
 *
 * 표준 값 (소문자):
 * - match: 일치
 * - mismatch: 불일치
 */
export const SPEC_MATCH_VALUES = [
  'match', // 일치
  'mismatch', // 불일치
] as const;

export const SpecMatchEnum = z.enum(SPEC_MATCH_VALUES as readonly [string, ...string[]]);
export type SpecMatch = z.infer<typeof SpecMatchEnum>;

// ============================================================================
// 중간점검 필터 상태 (Backend calibration.service 쿼리용)
// ============================================================================

export const INTERMEDIATE_CHECK_FILTER_STATUS_VALUES = ['overdue', 'due', 'pending'] as const;

export type IntermediateCheckFilterStatus =
  (typeof INTERMEDIATE_CHECK_FILTER_STATUS_VALUES)[number];
