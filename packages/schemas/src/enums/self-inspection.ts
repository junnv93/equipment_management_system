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

// ============================================================================
// 기타 특기사항 (조치내용) — QP-18-05 섹션 3
// ============================================================================

export const SpecialNoteSchema = z.object({
  content: z.string().min(1),
  date: z.string().nullable(),
});
export type SpecialNote = z.infer<typeof SpecialNoteSchema>;

// ============================================================================
// 자체점검 항목 기본값
// ============================================================================

export const DEFAULT_SELF_INSPECTION_ITEMS = [
  '외관검사',
  '출력 특성 점검',
  '안전 점검',
  '기능 점검',
] as const;

/**
 * 유연 항목명 → 기존 고정 컬럼 매핑 (하위 호환용 SSOT)
 * key: selfInspectionItems.checkItem, value: equipmentSelfInspections 고정 컬럼명
 */
export const SELF_INSPECTION_LEGACY_COLUMN_MAP: Record<string, string> = {
  외관검사: 'appearance',
  '출력 특성 점검': 'functionality', // 출력 특성 = 기능 검증 → functionality 컬럼에 매핑
  '기능 점검': 'functionality',
  '안전 점검': 'safety',
  '교정 상태 점검': 'calibrationStatus',
} as const;
