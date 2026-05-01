/**
 * Structure Diff helpers (Phase 1B-E)
 *
 * 현재 폼 state → ExtractedInspectionStructure 변환 → diffStructures 호출 흐름.
 * SoftForkDialog가 사용 — 사용자가 표 구조 변경 후 제출 시 변경점 표시.
 *
 * SSOT:
 * - extractStructureFromInspection (packages/schemas) — value-stripping 로직 단일 정의
 * - diffStructures (packages/schemas) — diff 비교 정책 단일 정의
 *
 * 본 모듈은 frontend 폼 state(InspectionItemForm + CreateResultSectionDto)를
 * extract 함수가 받는 InspectionTemplateSource shape로 변환만 담당.
 */

import {
  extractStructureFromInspection,
  diffStructures,
  type ExtractedInspectionStructure,
  type StructureDiff,
  type InspectionTemplateSource,
} from '@equipment-management/schemas';
import type { CreateResultSectionDto } from '@/lib/api/calibration-api';

/** Frontend 폼 state의 item shape — InspectionFormDialog의 InspectionItemForm과 일치 */
export interface FormItem {
  checkItem: string;
  checkCriteria: string;
}

/**
 * 현재 폼 state → ExtractedInspectionStructure 변환.
 *
 * 사용자가 입력한 *값*은 여기서 비워짐 (template structure 비교 목적).
 * extractStructureFromInspection은 이미 value-stripping 처리하므로 source에 값이 있어도 OK.
 *
 * @param items — 현재 폼의 점검 항목 (checkResult/judgment는 무시)
 * @param resultSections — 현재 폼의 결과 섹션 (CreateResultSectionDto shape)
 */
export function buildCurrentStructure(
  items: FormItem[],
  resultSections: CreateResultSectionDto[]
): ExtractedInspectionStructure {
  const source: InspectionTemplateSource = {
    items: items.map((it) => ({
      checkItem: it.checkItem,
      checkCriteria: it.checkCriteria,
    })),
    resultSections: resultSections.map((s) => ({
      sortOrder: s.sortOrder,
      sectionType: s.sectionType,
      title: s.title ?? null,
      content: s.content ?? null,
      tableData: s.tableData ?? null,
      richTableData: s.richTableData ?? null,
      // CreateResultSectionDto는 number | undefined, source는 string | null — 변환
      imageWidthCm: s.imageWidthCm !== undefined ? String(s.imageWidthCm) : null,
      imageHeightCm: s.imageHeightCm !== undefined ? String(s.imageHeightCm) : null,
      documentId: s.documentId ?? null,
    })),
  };
  return extractStructureFromInspection(source);
}

/**
 * 현재 폼 state ↔ template.structure 비교.
 *
 * @returns StructureDiff with hasChanges flag — true면 SoftForkDialog 노출 trigger.
 */
export function diffFormAgainstTemplate(
  currentItems: FormItem[],
  currentResultSections: CreateResultSectionDto[],
  templateStructure: ExtractedInspectionStructure
): StructureDiff {
  const currentStructure = buildCurrentStructure(currentItems, currentResultSections);
  return diffStructures(templateStructure, currentStructure);
}
