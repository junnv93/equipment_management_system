/**
 * Inspection Template Utilities — Phase 1A SSOT
 *
 * 직전 점검 구조에서 *값 비운* prefill 구조 추출.
 * "두 번째 점검부터 표 구조가 자동 재사용" — 사용자 멘탈 모델과 정합.
 *
 * 디자인 리뷰 §N: prefill 갭 80% 보완 (현재는 items[checkItem/checkCriteria]만 복사)
 * 업계 표준: LIMS Template Snapshot 패턴 (LabWare/Veeva/Beamex)
 *
 * SSOT: 향후 Phase 1B-backend의 inspection_form_templates 모듈에서도
 * 동일 함수 재사용 가능하도록 pure function으로 분리.
 */

import type { CreateResultSectionDto, ResultSection, RichCell } from '@/lib/api/calibration-api';
import type { InspectionJudgment } from '@equipment-management/schemas';

export interface InspectionItemFormShape {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: InspectionJudgment | '';
}

export interface ExtractedStructure {
  /** 빈 측정값을 가진 점검 항목 — checkItem/checkCriteria 만 보존 */
  items: InspectionItemFormShape[];
  /** 값 비운 결과 섹션 구조 — table/photo/text 구조 보존 */
  resultSections: CreateResultSectionDto[];
  /** 표 N개 / 사진 M개 / 텍스트 K개 카운트 (banner 표시용) */
  counts: {
    tables: number;
    photos: number;
    texts: number;
  };
}

interface SourceInspectionShape {
  items?: Array<{
    checkItem?: string | null;
    checkCriteria?: string | null;
  }>;
  resultSections?: ResultSection[];
}

/**
 * 표 셀의 값을 비움 — image cell 은 text 빈 셀로 변환 (documentId 새로 첨부 필요).
 *
 * Phase 1A 결정:
 * - text cell value → '' (빈 측정값)
 * - image cell → text 빈 셀로 변환 (사용자가 매번 새 사진 첨부)
 *   - widthCm/heightCm 같은 기하 정보는 드롭. (image 메타는 RichCell.image union 안에만 있음)
 * - 변환된 위치는 imageCellPositions로 추적 가능 (1A-b의 micro hint 적용용)
 */
function clearCellValues(rows: RichCell[][]): {
  rows: RichCell[][];
  imageCellPositions: Array<{ ri: number; ci: number }>;
} {
  const imageCellPositions: Array<{ ri: number; ci: number }> = [];
  const cleared = rows.map((row, ri) =>
    row.map((cell, ci) => {
      if (cell.type === 'image') {
        imageCellPositions.push({ ri, ci });
        return { type: 'text' as const, value: '' };
      }
      return { type: 'text' as const, value: '' };
    })
  );
  return { rows: cleared, imageCellPositions };
}

/**
 * 직전 점검에서 *구조만* 추출 (values stripped).
 *
 * 복사 대상:
 * - items[].checkItem, checkCriteria  (기존 동작)
 * - resultSections[].richTableData (헤더 + 행 구조 — 셀 값 비움)
 * - resultSections[].tableData (legacy — 행 비움)
 * - resultSections[].imageWidthCm/Height (사진 슬롯 크기)
 * - resultSections[].title (구조 의미)
 *
 * 비움 대상:
 * - items[].checkResult, judgment
 * - resultSections[].content (텍스트는 매번 새로)
 * - resultSections[].documentId (사진은 매번 새로)
 * - 표 셀의 모든 value
 */
export function extractStructureFromInspection(source: SourceInspectionShape): ExtractedStructure {
  const items: InspectionItemFormShape[] = (source.items ?? []).map((it) => ({
    checkItem: it.checkItem ?? '',
    checkCriteria: it.checkCriteria ?? '',
    checkResult: '',
    judgment: '',
  }));

  let tableCount = 0;
  let photoCount = 0;
  let textCount = 0;
  const sections: CreateResultSectionDto[] = (source.resultSections ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => {
      const base: CreateResultSectionDto = {
        sortOrder: index,
        sectionType: section.sectionType,
      };
      if (section.title) base.title = section.title;

      switch (section.sectionType) {
        case 'rich_table': {
          tableCount += 1;
          if (section.richTableData) {
            const cleared = clearCellValues(section.richTableData.rows);
            base.richTableData = {
              headers: [...section.richTableData.headers],
              rows: cleared.rows,
            };
          }
          break;
        }
        case 'data_table': {
          tableCount += 1;
          if (section.tableData) {
            base.tableData = {
              headers: [...section.tableData.headers],
              // 모든 행 빈 문자열로
              rows: section.tableData.rows.map((row) => row.map(() => '')),
            };
          }
          break;
        }
        case 'photo': {
          photoCount += 1;
          // documentId는 매번 새로 첨부 — 비움.
          // 다만 사이즈는 보존 (사용자가 같은 슬롯에 새 사진).
          if (section.imageWidthCm) base.imageWidthCm = Number(section.imageWidthCm);
          if (section.imageHeightCm) base.imageHeightCm = Number(section.imageHeightCm);
          break;
        }
        case 'text': {
          textCount += 1;
          // content는 매번 새로 — 비움.
          break;
        }
        default:
          break;
      }

      return base;
    });

  return {
    items,
    resultSections: sections,
    counts: {
      tables: tableCount,
      photos: photoCount,
      texts: textCount,
    },
  };
}

/**
 * 표 N개 · 사진 M개 · 텍스트 K개 → 사용자 친화 카운트 문자열 부분 (banner용).
 * count 가 0인 카테고리는 생략.
 */
export function describeStructureCounts(counts: ExtractedStructure['counts']): {
  hasAny: boolean;
  parts: Array<{ key: 'tables' | 'photos' | 'texts'; count: number }>;
} {
  const parts: Array<{ key: 'tables' | 'photos' | 'texts'; count: number }> = [];
  if (counts.tables > 0) parts.push({ key: 'tables', count: counts.tables });
  if (counts.photos > 0) parts.push({ key: 'photos', count: counts.photos });
  if (counts.texts > 0) parts.push({ key: 'texts', count: counts.texts });
  return { hasAny: parts.length > 0, parts };
}
