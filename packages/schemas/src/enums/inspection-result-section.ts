import { z } from 'zod';

// ============================================================================
// 점검 결과 섹션 유형 (중간점검 QP-18-03 / 자체점검 QP-18-05 동적 결과 영역)
// ============================================================================

export const INSPECTION_RESULT_SECTION_TYPE_VALUES = [
  'title', // 제목 블록
  'text', // 텍스트 블록
  'photo', // 이미지 블록 (documents 테이블 참조)
  'data_table', // 데이터 테이블 (JSONB: headers + rows)
] as const;

export const InspectionResultSectionTypeEnum = z.enum(INSPECTION_RESULT_SECTION_TYPE_VALUES);
export type InspectionResultSectionType = z.infer<typeof InspectionResultSectionTypeEnum>;

export const INSPECTION_TYPE_VALUES = ['intermediate', 'self'] as const;

export const InspectionTypeEnum = z.enum(INSPECTION_TYPE_VALUES);
export type InspectionType = z.infer<typeof InspectionTypeEnum>;
