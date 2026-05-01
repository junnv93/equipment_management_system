import type {
  CreateInspectionResultSectionShape,
  ExtractedInspectionStructure,
  InspectionItemFormShape,
  InspectionResultSectionShape,
  RichCell,
  StructureDiff,
} from '../types/inspection-template';

/**
 * Inspection Template Utilities — SSOT
 *
 * 점검 양식 구조 추출 / 비교 / 카운트 — frontend + backend 공용 pure functions.
 *
 * 사용처:
 * - frontend: useLatestTemplate hook의 prefill (Phase 1B-D)
 * - frontend: SoftForkDialog의 diff visualization (Phase 1B-E)
 * - backend: auto-create on first approve, version+1 on structure change (Phase 1B-B)
 * - backend: backfill script — 기존 inspection을 source로 첫 template 생성 (Phase 1B-C)
 */

// ============================================================================
// 입력 타입 — extractStructureFromInspection이 받을 수 있는 source shape
// ============================================================================

/**
 * 직전 점검 source — frontend의 IntermediateInspection / SelfInspection 또는
 * backend의 inspection row + items + resultSections join 결과.
 *
 * loose typing: items/resultSections 필드만 필요 (다른 메타는 무시).
 */
export interface InspectionTemplateSource {
  items?: Array<{
    checkItem?: string | null;
    checkCriteria?: string | null;
  }> | null;
  resultSections?: InspectionResultSectionShape[] | null;
}

// ============================================================================
// 표 셀 값 비움 — image cell은 text 빈 셀로 변환
// ============================================================================

interface ClearCellsResult {
  rows: RichCell[][];
  /** 1A-b의 imageCellPositions micro hint — 사용자가 사진 슬롯 위치 인지용 */
  imageCellPositions: Array<{ ri: number; ci: number }>;
}

function clearCellValues(rows: RichCell[][]): ClearCellsResult {
  const imageCellPositions: Array<{ ri: number; ci: number }> = [];
  const cleared: RichCell[][] = rows.map((row, ri) =>
    row.map((cell, ci) => {
      if (cell.type === 'image') {
        imageCellPositions.push({ ri, ci });
        return { type: 'text', value: '' };
      }
      return { type: 'text', value: '' };
    })
  );
  return { rows: cleared, imageCellPositions };
}

// ============================================================================
// 직전 점검에서 *구조만* 추출 (values stripped)
// ============================================================================

/**
 * 복사 대상:
 * - items[].checkItem, checkCriteria
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
export function extractStructureFromInspection(
  source: InspectionTemplateSource
): ExtractedInspectionStructure {
  const items: InspectionItemFormShape[] = (source.items ?? []).map((it) => ({
    checkItem: it.checkItem ?? '',
    checkCriteria: it.checkCriteria ?? '',
    checkResult: '',
    judgment: '',
  }));

  let tableCount = 0;
  let photoCount = 0;
  let textCount = 0;
  const sections: CreateInspectionResultSectionShape[] = (source.resultSections ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section, index) => {
      const base: CreateInspectionResultSectionShape = {
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
              rows: section.tableData.rows.map((row) => row.map(() => '')),
            };
          }
          break;
        }
        case 'photo': {
          photoCount += 1;
          if (section.imageWidthCm) base.imageWidthCm = Number(section.imageWidthCm);
          if (section.imageHeightCm) base.imageHeightCm = Number(section.imageHeightCm);
          break;
        }
        case 'text': {
          textCount += 1;
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

// ============================================================================
// 카운트 → banner 친화 부분 (UI용)
// ============================================================================

export function describeStructureCounts(counts: ExtractedInspectionStructure['counts']): {
  hasAny: boolean;
  parts: Array<{ key: 'tables' | 'photos' | 'texts'; count: number }>;
} {
  const parts: Array<{ key: 'tables' | 'photos' | 'texts'; count: number }> = [];
  if (counts.tables > 0) parts.push({ key: 'tables', count: counts.tables });
  if (counts.photos > 0) parts.push({ key: 'photos', count: counts.photos });
  if (counts.texts > 0) parts.push({ key: 'texts', count: counts.texts });
  return { hasAny: parts.length > 0, parts };
}

// ============================================================================
// 두 structure 비교 — Soft Fork diff visualization
// ============================================================================

/**
 * 두 ExtractedInspectionStructure 간 변경점 도출 (pure function).
 *
 * 비교 정책:
 * - items: checkItem 텍스트로 매칭 (대소문자 + 공백 trim 적용)
 * - resultSections: sortOrder 인덱스로 매칭 (동일 위치 비교)
 *   - 같은 sortOrder에서 sectionType이 다르면 typeChanged
 *   - 한쪽에만 있으면 added/removed
 *   - title 변경은 currently 무시 (sectionsTypeChanged만 추적)
 *
 * 결정성: 동일 input → 동일 output. unit test에서 정렬 검증.
 */
export function diffStructures(
  before: ExtractedInspectionStructure,
  after: ExtractedInspectionStructure
): StructureDiff {
  const normalize = (s: string): string => s.trim().toLowerCase();

  // ---------- items diff ----------
  const beforeItems = new Map<string, InspectionItemFormShape>();
  for (const item of before.items) {
    if (item.checkItem) beforeItems.set(normalize(item.checkItem), item);
  }
  const afterItems = new Map<string, InspectionItemFormShape>();
  for (const item of after.items) {
    if (item.checkItem) afterItems.set(normalize(item.checkItem), item);
  }

  const itemsAdded: string[] = [];
  const itemsRemoved: string[] = [];
  const itemsChanged: StructureDiff['itemsChanged'] = [];

  for (const [key, item] of afterItems) {
    if (!beforeItems.has(key)) {
      itemsAdded.push(item.checkItem);
    } else {
      const prev = beforeItems.get(key);
      if (prev && prev.checkCriteria !== item.checkCriteria) {
        itemsChanged.push({
          checkItem: item.checkItem,
          criteriaBefore: prev.checkCriteria,
          criteriaAfter: item.checkCriteria,
        });
      }
    }
  }
  for (const [key, item] of beforeItems) {
    if (!afterItems.has(key)) {
      itemsRemoved.push(item.checkItem);
    }
  }

  // ---------- sections diff (by sortOrder) ----------
  const beforeSections = new Map<number, CreateInspectionResultSectionShape>();
  for (const s of before.resultSections) beforeSections.set(s.sortOrder, s);
  const afterSections = new Map<number, CreateInspectionResultSectionShape>();
  for (const s of after.resultSections) afterSections.set(s.sortOrder, s);

  const sectionsAdded: StructureDiff['sectionsAdded'] = [];
  const sectionsRemoved: StructureDiff['sectionsRemoved'] = [];
  const sectionsTypeChanged: StructureDiff['sectionsTypeChanged'] = [];

  for (const [sortOrder, section] of afterSections) {
    if (!beforeSections.has(sortOrder)) {
      sectionsAdded.push({
        sortOrder,
        sectionType: section.sectionType,
        ...(section.title ? { title: section.title } : {}),
      });
    } else {
      const prev = beforeSections.get(sortOrder);
      if (prev && prev.sectionType !== section.sectionType) {
        sectionsTypeChanged.push({
          sortOrder,
          typeBefore: prev.sectionType,
          typeAfter: section.sectionType,
        });
      }
    }
  }
  for (const [sortOrder, section] of beforeSections) {
    if (!afterSections.has(sortOrder)) {
      sectionsRemoved.push({
        sortOrder,
        sectionType: section.sectionType,
        ...(section.title ? { title: section.title } : {}),
      });
    }
  }

  // 정렬 — 결정성 보장 (test 안정성)
  itemsAdded.sort();
  itemsRemoved.sort();
  itemsChanged.sort((a, b) => a.checkItem.localeCompare(b.checkItem));
  sectionsAdded.sort((a, b) => a.sortOrder - b.sortOrder);
  sectionsRemoved.sort((a, b) => a.sortOrder - b.sortOrder);
  sectionsTypeChanged.sort((a, b) => a.sortOrder - b.sortOrder);

  const hasChanges =
    itemsAdded.length > 0 ||
    itemsRemoved.length > 0 ||
    itemsChanged.length > 0 ||
    sectionsAdded.length > 0 ||
    sectionsRemoved.length > 0 ||
    sectionsTypeChanged.length > 0;

  return {
    itemsAdded,
    itemsRemoved,
    itemsChanged,
    sectionsAdded,
    sectionsRemoved,
    sectionsTypeChanged,
    hasChanges,
  };
}
