import { z } from 'zod';
import { InspectionResultSectionTypeEnum } from '../enums/inspection-result-section';

/**
 * Inspection Template Domain Types — SSOT
 *
 * UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow.
 * frontend + backend 양쪽에서 import — `@equipment-management/schemas` 단일 진입점.
 *
 * 업계 표준 매핑 (LIMS / Veeva Vault / Beamex CMX):
 * - Template Snapshot: 이 파일의 ExtractedInspectionStructure
 * - Soft Fork: ForkChoice 유니언
 * - Diff Visualization: StructureDiff
 */

// ============================================================================
// 표 셀 (rich_table) 형식
// ============================================================================

/**
 * 표 셀 — 텍스트 또는 이미지 (discriminated union).
 * - image cell의 widthCm/heightCm은 PDF 출력 시 픽셀 환산용 (UL-QP-18-03 dpi=96 기준).
 */
export const RichCellSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({
    type: z.literal('image'),
    documentId: z.string(),
    widthCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
  }),
]);
export type RichCell = z.infer<typeof RichCellSchema>;

// ============================================================================
// 점검 항목 폼 형식 (InspectionItem 폼 row)
// ============================================================================

export const InspectionItemFormShapeSchema = z.object({
  checkItem: z.string(),
  checkCriteria: z.string(),
  checkResult: z.string(),
  judgment: z.union([z.literal('pass'), z.literal('fail'), z.literal('')]),
});
export type InspectionItemFormShape = z.infer<typeof InspectionItemFormShapeSchema>;

// ============================================================================
// 점검 결과 섹션 — Create DTO Shape
// (DB의 inspection_result_sections 테이블에 저장되는 *생성 시점* 페이로드)
// ============================================================================

export const CreateInspectionResultSectionShapeSchema = z.object({
  sortOrder: z.number().int().min(0),
  sectionType: InspectionResultSectionTypeEnum,
  title: z.string().optional(),
  content: z.string().optional(),
  tableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .optional(),
  richTableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(RichCellSchema)),
    })
    .optional(),
  documentId: z.string().optional(),
  imageWidthCm: z.number().positive().optional(),
  imageHeightCm: z.number().positive().optional(),
});
export type CreateInspectionResultSectionShape = z.infer<
  typeof CreateInspectionResultSectionShapeSchema
>;

/**
 * 점검 결과 섹션 — Read Shape (DB row + 메타).
 * frontend의 ResultSection 인터페이스와 호환.
 */
export const InspectionResultSectionShapeSchema = z.object({
  id: z.string(),
  inspectionId: z.string(),
  inspectionType: z.union([z.literal('intermediate'), z.literal('self')]),
  sectionType: InspectionResultSectionTypeEnum,
  sortOrder: z.number().int().min(0),
  title: z.string().nullable(),
  content: z.string().nullable(),
  tableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .nullable(),
  richTableData: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(RichCellSchema)),
    })
    .nullable(),
  documentId: z.string().nullable(),
  imageWidthCm: z.string().nullable(),
  imageHeightCm: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InspectionResultSectionShape = z.infer<typeof InspectionResultSectionShapeSchema>;

// ============================================================================
// Extracted Structure (template snapshot)
// ============================================================================

/**
 * 점검 양식 구조 — 값을 *비운* 상태.
 * inspection_form_templates.structure(jsonb) 컬럼에 저장.
 *
 * SSOT: extractStructureFromInspection 함수의 반환값 = 이 schema.
 * jsonb 검증에 사용 — `ExtractedInspectionStructureSchema.parse(row.structure)`.
 */
export const ExtractedInspectionStructureSchema = z.object({
  items: z.array(InspectionItemFormShapeSchema),
  resultSections: z.array(CreateInspectionResultSectionShapeSchema),
  counts: z.object({
    tables: z.number().int().min(0),
    photos: z.number().int().min(0),
    texts: z.number().int().min(0),
  }),
});
export type ExtractedInspectionStructure = z.infer<typeof ExtractedInspectionStructureSchema>;

// ============================================================================
// Structure Diff — Soft Fork UI용
// ============================================================================

/**
 * 두 structure 간 변경점 — SoftForkDialog의 diff visualization.
 *
 * 비교 단위:
 * - items: checkItem 텍스트로 매칭 (sortOrder 무관 — 이름 기반)
 * - resultSections: sortOrder + sectionType + title 키 매칭
 *
 * 시간 복잡도: O(N+M) — 양쪽 Map indexing.
 */
export const StructureDiffSchema = z.object({
  itemsAdded: z.array(z.string()), // checkItem 텍스트
  itemsRemoved: z.array(z.string()),
  itemsChanged: z.array(
    z.object({
      checkItem: z.string(),
      criteriaBefore: z.string(),
      criteriaAfter: z.string(),
    })
  ),
  sectionsAdded: z.array(
    z.object({
      sortOrder: z.number(),
      sectionType: InspectionResultSectionTypeEnum,
      title: z.string().optional(),
    })
  ),
  sectionsRemoved: z.array(
    z.object({
      sortOrder: z.number(),
      sectionType: InspectionResultSectionTypeEnum,
      title: z.string().optional(),
    })
  ),
  sectionsTypeChanged: z.array(
    z.object({
      sortOrder: z.number(),
      typeBefore: InspectionResultSectionTypeEnum,
      typeAfter: InspectionResultSectionTypeEnum,
    })
  ),
  hasChanges: z.boolean(),
});
export type StructureDiff = z.infer<typeof StructureDiffSchema>;

// ============================================================================
// Fork Choice — Soft Fork 사용자 선택
// ============================================================================

/**
 * 표 구조 변경 시 사용자 의사결정.
 * - this_only: 이번 점검만 변경된 구조 사용. template 그대로.
 * - apply_forward: 다음 점검부터도 변경 적용. template version+1 (supersededBy 체이닝).
 * - cancel: 폼 편집 복귀. 제출 안 함.
 *
 * 백엔드 inspection 제출 DTO에 forkChoice 파라미터로 전달.
 */
export const FORK_CHOICE_VALUES = ['this_only', 'apply_forward', 'cancel'] as const;
export const ForkChoiceEnum = z.enum(FORK_CHOICE_VALUES);
export type ForkChoice = z.infer<typeof ForkChoiceEnum>;
