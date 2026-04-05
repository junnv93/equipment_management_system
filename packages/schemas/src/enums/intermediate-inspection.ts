import { z } from 'zod';

/**
 * UL-QP-18-03 중간점검표 상태/판정 열거형
 */

// ============================================================================
// 점검 기록 승인 상태
// ============================================================================

export const INSPECTION_APPROVAL_STATUS_VALUES = [
  'draft', // 초안
  'submitted', // 제출됨
  'reviewed', // 검토됨
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const InspectionApprovalStatusEnum = z.enum(INSPECTION_APPROVAL_STATUS_VALUES);
export type InspectionApprovalStatus = z.infer<typeof InspectionApprovalStatusEnum>;

// ============================================================================
// 점검 항목 판정
// ============================================================================

export const INSPECTION_JUDGMENT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
] as const;

export const InspectionJudgmentEnum = z.enum(INSPECTION_JUDGMENT_VALUES);
export type InspectionJudgment = z.infer<typeof InspectionJudgmentEnum>;

// ============================================================================
// 점검 전체 결과
// ============================================================================

export const INSPECTION_RESULT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
  'conditional', // 조건부 적합
] as const;

export const InspectionResultEnum = z.enum(INSPECTION_RESULT_VALUES);
export type InspectionResult = z.infer<typeof InspectionResultEnum>;

// ============================================================================
// 장비 분류 (교정기기/비교정기기)
// ============================================================================

export const EQUIPMENT_CLASSIFICATION_VALUES = [
  'calibrated', // 교정기기
  'non_calibrated', // 비교정기기
] as const;

export const EquipmentClassificationEnum = z.enum(EQUIPMENT_CLASSIFICATION_VALUES);
export type EquipmentClassification = z.infer<typeof EquipmentClassificationEnum>;
