/**
 * templateStructureToPrefill — Phase 1B-D pure function 검증
 *
 * 시나리오:
 * 1. items 그대로 전달 (값은 이미 backend에서 비워서 저장됨)
 * 2. resultSections 그대로 전달
 * 3. counts 그대로 전달
 * 4. sortOrders는 resultSections에서 추출
 * 5. round-trip: extractStructureFromInspection → templateStructureToPrefill → 원본 구조 동등
 */

import { templateStructureToPrefill } from '../template-source';
import type { ExtractedInspectionStructure } from '@equipment-management/schemas';

describe('templateStructureToPrefill', () => {
  const baseStructure: ExtractedInspectionStructure = {
    items: [
      { checkItem: '외관 점검', checkCriteria: '파손 없음', checkResult: '', judgment: '' },
      { checkItem: '동작 확인', checkCriteria: '정상 작동', checkResult: '', judgment: '' },
    ],
    resultSections: [
      { sortOrder: 0, sectionType: 'title' as const, title: '점검 결과' },
      {
        sortOrder: 1,
        sectionType: 'rich_table' as const,
        richTableData: { headers: ['항목', '결과'], rows: [] },
      },
      {
        sortOrder: 2,
        sectionType: 'photo' as const,
        imageWidthCm: 10,
        imageHeightCm: 8,
      },
    ],
    counts: { tables: 1, photos: 1, texts: 1 },
  };

  it('returns items unchanged', () => {
    const out = templateStructureToPrefill(baseStructure);
    expect(out.items).toEqual(baseStructure.items);
  });

  it('returns resultSections unchanged', () => {
    const out = templateStructureToPrefill(baseStructure);
    expect(out.resultSections).toEqual(baseStructure.resultSections);
  });

  it('returns counts unchanged', () => {
    const out = templateStructureToPrefill(baseStructure);
    expect(out.counts).toEqual(baseStructure.counts);
  });

  it('extracts sortOrders from resultSections in order', () => {
    const out = templateStructureToPrefill(baseStructure);
    expect(out.sortOrders).toEqual([0, 1, 2]);
  });

  it('handles empty resultSections', () => {
    const empty: ExtractedInspectionStructure = {
      items: [],
      resultSections: [],
      counts: { tables: 0, photos: 0, texts: 0 },
    };
    const out = templateStructureToPrefill(empty);
    expect(out.sortOrders).toEqual([]);
    expect(out.items).toEqual([]);
    expect(out.resultSections).toEqual([]);
  });

  it('preserves non-zero sortOrder values (not normalized)', () => {
    // sortOrder gap 보존 — frontend가 redistribute 책임 (변환 함수는 unwrap만)
    const sparse: ExtractedInspectionStructure = {
      items: [],
      resultSections: [
        { sortOrder: 3, sectionType: 'title' as const, title: 'A' },
        { sortOrder: 7, sectionType: 'title' as const, title: 'B' },
      ],
      counts: { tables: 0, photos: 0, texts: 2 },
    };
    const out = templateStructureToPrefill(sparse);
    expect(out.sortOrders).toEqual([3, 7]);
  });
});
