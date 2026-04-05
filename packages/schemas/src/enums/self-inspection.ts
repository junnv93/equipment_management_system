import { z } from 'zod';

/**
 * UL-QP-18-05 자체점검표 열거형
 */

// ============================================================================
// 점검 항목 판정 (외관/기능/안전/교정상태 등 개별 항목)
// ============================================================================

export const SELF_INSPECTION_ITEM_JUDGMENT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
  'na', // 해당없음
] as const;

export const SelfInspectionItemJudgmentEnum = z.enum(SELF_INSPECTION_ITEM_JUDGMENT_VALUES);
export type SelfInspectionItemJudgment = z.infer<typeof SelfInspectionItemJudgmentEnum>;

// ============================================================================
// 점검 전체 결과
// ============================================================================

export const SELF_INSPECTION_RESULT_VALUES = [
  'pass', // 적합
  'fail', // 부적합
] as const;

export const SelfInspectionResultEnum = z.enum(SELF_INSPECTION_RESULT_VALUES);
export type SelfInspectionResult = z.infer<typeof SelfInspectionResultEnum>;

// ============================================================================
// 자체점검 상태
// ============================================================================

export const SELF_INSPECTION_STATUS_VALUES = [
  'draft', // 초안
  'completed', // 점검 완료
  'confirmed', // 확인 완료 (기술책임자)
] as const;

export const SelfInspectionStatusEnum = z.enum(SELF_INSPECTION_STATUS_VALUES);
export type SelfInspectionStatus = z.infer<typeof SelfInspectionStatusEnum>;
