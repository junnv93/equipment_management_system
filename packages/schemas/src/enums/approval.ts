import { z } from 'zod';

// ============================================================================
// 통합 승인 상태 (승인 관리 통합 페이지용)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 통합 승인 상태 열거형
 *
 * 승인 관리 통합 페이지에서 사용하는 표준 승인 상태입니다.
 * 다단계 승인 프로세스를 지원합니다.
 *
 * ⚠️ 주의: equipment-request.ts의 ApprovalStatus와 구분하기 위해
 * "UnifiedApprovalStatus"로 명명합니다.
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending: 대기 (1단계 승인용)
 * - pending_review: 검토 대기 (다단계 1단계)
 * - reviewed: 검토 완료 (다단계 2단계 대기)
 * - approved: 승인 완료
 * - rejected: 반려
 *
 * 상태 전이 예시:
 * - 1단계 승인: pending → approved/rejected
 * - 2단계 승인 (폐기): pending_review → reviewed → approved/rejected
 * - 3단계 승인 (교정계획서): pending_review → reviewed → approved/rejected
 *
 * @see docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
 */
export const UNIFIED_APPROVAL_STATUS_VALUES = [
  'pending', // 대기 (1단계 승인용)
  'pending_review', // 검토 대기 (다단계 1단계)
  'reviewed', // 검토 완료 (다단계 2단계 대기)
  'approved', // 승인 완료
  'rejected', // 반려
] as const;

export const UnifiedApprovalStatusEnum = z.enum(UNIFIED_APPROVAL_STATUS_VALUES);
export type UnifiedApprovalStatus = z.infer<typeof UnifiedApprovalStatusEnum>;

/**
 * 통합 승인 상태 값 객체 (dot-notation 접근용)
 * @example UnifiedApprovalStatusValues.PENDING // 'pending'
 */
export const UnifiedApprovalStatusValues = {
  PENDING: 'pending',
  PENDING_REVIEW: 'pending_review',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// ============================================================================
// 통합 승인 액션
// ============================================================================

export const UNIFIED_APPROVAL_ACTION_VALUES = ['approve', 'reject'] as const;

// ============================================================================
// 승인 카테고리 (Approval Category)
// ============================================================================

export const APPROVAL_CATEGORY_VALUES = [
  'outgoing',
  'incoming',
  'equipment',
  'calibration',
  'inspection',
  'nonconformity',
  'disposal_review',
  'disposal_final',
  'plan_review',
  'plan_final',
  'software',
] as const;

export type ApprovalCategory = (typeof APPROVAL_CATEGORY_VALUES)[number];

export const ApprovalCategoryValues = {
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
  EQUIPMENT: 'equipment',
  CALIBRATION: 'calibration',
  INSPECTION: 'inspection',
  NONCONFORMITY: 'nonconformity',
  DISPOSAL_REVIEW: 'disposal_review',
  DISPOSAL_FINAL: 'disposal_final',
  PLAN_REVIEW: 'plan_review',
  PLAN_FINAL: 'plan_final',
  SOFTWARE: 'software',
} as const satisfies Record<string, ApprovalCategory>;
