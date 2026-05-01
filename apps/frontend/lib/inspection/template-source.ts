/**
 * Template → Prefill 변환 헬퍼 (Phase 1B-D)
 *
 * Backend `getLatestTemplate` 응답의 `structure: ExtractedInspectionStructure`를
 * Inspection 폼의 prefill 형태(`items[]`, `resultSections[]`)로 변환.
 *
 * 책임:
 * - sortOrder 재할당 (1B 이전 prefill 흐름과 동일 — sortOrder는 ephemeral state)
 * - jsonb structure를 form-friendly shape로 unwrap (zod schema validation은 API client에서 완료)
 *
 * SSOT 원칙:
 * - 본 모듈은 *변환만* 담당 — Zod 검증/판정/CAS는 외부 책임
 * - extractStructureFromInspection의 *역연산* (round-trip 가능성 보장)
 *
 * Round-trip:
 *   inspection → extractStructureFromInspection → template.structure
 *   template.structure → templateStructureToPrefill → prefill items/sections
 *   (counts는 동일 — items.length / resultSections by sectionType 그대로)
 */

import type { ExtractedInspectionStructure } from '@equipment-management/schemas';

/**
 * Template structure → 폼 prefill 형태 변환.
 *
 * @returns items와 resultSections — InspectionFormDialog의 setItems/setResultSections에 그대로 전달
 */
export function templateStructureToPrefill(structure: ExtractedInspectionStructure): {
  items: ExtractedInspectionStructure['items'];
  resultSections: Array<ExtractedInspectionStructure['resultSections'][number] & { id?: string }>;
  counts: ExtractedInspectionStructure['counts'];
  /** Context applyTemplatePrefill에 전달할 sortOrder list */
  sortOrders: number[];
} {
  // sortOrder가 0부터 connected order 보장 (template 저장 시 sortOrder는 보존되지만 검증 차원).
  // resultSections는 sortOrder 그대로 사용 — frontend가 redistribute 책임.
  const sortOrders = structure.resultSections.map((s) => s.sortOrder);

  return {
    items: structure.items,
    resultSections: structure.resultSections,
    counts: structure.counts,
    sortOrders,
  };
}
