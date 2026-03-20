import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 교정계획서 상태 열거형
 *
 * 3단계 승인 워크플로우:
 * - draft: 작성 중 (기술책임자가 계획서 작성 중)
 * - pending_review: 검토 대기 (품질책임자에게 검토 요청됨) ← 신규
 * - pending_approval: 승인 대기 (시험소장에게 승인 요청됨)
 * - approved: 승인됨 (시험소장이 승인 완료)
 * - rejected: 반려됨 (품질책임자 또는 시험소장이 반려, 사유 필수)
 *
 * 상태 전이:
 * draft → pending_review → pending_approval → approved
 *    ↑__________________________|__________________|
 *                    rejected
 *
 * @see docs/development/API_STANDARDS.md
 */
export const CALIBRATION_PLAN_STATUS_VALUES = [
  'draft', // 작성 중
  'pending_review', // 검토 대기 (품질책임자)
  'pending_approval', // 승인 대기 (시험소장)
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationPlanStatusEnum = z.enum(CALIBRATION_PLAN_STATUS_VALUES);
export type CalibrationPlanStatus = z.infer<typeof CalibrationPlanStatusEnum>;

/**
 * 교정계획서 상태 상수 객체 (코드에서 직접 비교용)
 * @example CalibrationPlanStatusValues.DRAFT === 'draft'
 */
export const CalibrationPlanStatusValues = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 교정계획서 반려 단계 열거형
 *
 * - review: 품질책임자 검토 단계에서 반려
 * - approval: 시험소장 승인 단계에서 반려
 */
export const REJECTION_STAGE_VALUES = ['review', 'approval'] as const;
export const RejectionStageEnum = z.enum(REJECTION_STAGE_VALUES);
export type RejectionStage = z.infer<typeof RejectionStageEnum>;
