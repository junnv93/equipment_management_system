/**
 * extractStructureFromInspection — Phase 1A SSOT pure function 검증
 *
 * 시나리오:
 * 1. items: checkItem/checkCriteria 보존 + 값 비움
 * 2. resultSections: richTableData 헤더 보존 + 셀 value 비움
 * 3. image cell → text 빈 셀 변환
 * 4. photo: imageWidthCm/Height 보존 + documentId 비움
 * 5. text: title 보존 + content 비움
 * 6. counts: tables/photos/texts 카운트
 * 7. describeStructureCounts: 0인 카테고리 생략
 */

import { extractStructureFromInspection, describeStructureCounts } from '../template-utils';
import type { ResultSection } from '@/lib/api/calibration-api';

const baseSection = (overrides: Partial<ResultSection>): ResultSection => ({
  id: 's1',
  inspectionId: 'i1',
  inspectionType: 'intermediate',
  sectionType: 'title',
  sortOrder: 0,
  title: null,
  content: null,
  tableData: null,
  richTableData: null,
  documentId: null,
  imageWidthCm: null,
  imageHeightCm: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('extractStructureFromInspection', () => {
  it('items: checkItem/checkCriteria 보존 + checkResult/judgment 비움', () => {
    const result = extractStructureFromInspection({
      items: [
        { checkItem: '외관 검사', checkCriteria: '마모 없음' },
        { checkItem: '출력 점검', checkCriteria: '+10 ± 0.5 dBm' },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      checkItem: '외관 검사',
      checkCriteria: '마모 없음',
      checkResult: '',
      judgment: '',
    });
    expect(result.items[1].checkItem).toBe('출력 점검');
    expect(result.items[1].checkResult).toBe('');
  });

  it('rich_table: 헤더 보존 + 셀 value 비움', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({
          sortOrder: 0,
          sectionType: 'rich_table',
          richTableData: {
            headers: ['주파수', '이득', '규격'],
            rows: [
              [
                { type: 'text', value: '1.0' },
                { type: 'text', value: '44.12' },
                { type: 'text', value: 'pass' },
              ],
            ],
          },
        }),
      ],
    });

    expect(result.resultSections).toHaveLength(1);
    expect(result.resultSections[0].sectionType).toBe('rich_table');
    expect(result.resultSections[0].richTableData?.headers).toEqual(['주파수', '이득', '규격']);
    expect(result.resultSections[0].richTableData?.rows[0]).toEqual([
      { type: 'text', value: '' },
      { type: 'text', value: '' },
      { type: 'text', value: '' },
    ]);
    expect(result.counts.tables).toBe(1);
  });

  it('image cell → text 빈 셀 변환 (documentId는 매번 새로)', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({
          sortOrder: 0,
          sectionType: 'rich_table',
          richTableData: {
            headers: ['셀1', '셀2'],
            rows: [
              [
                { type: 'text', value: '값' },
                { type: 'image', documentId: 'doc-123', widthCm: 5, heightCm: 5 },
              ],
            ],
          },
        }),
      ],
    });

    expect(result.resultSections[0].richTableData?.rows[0]).toEqual([
      { type: 'text', value: '' },
      { type: 'text', value: '' }, // image → text 변환
    ]);
  });

  it('photo: imageWidthCm/Height 보존 + documentId 비움', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({
          sortOrder: 0,
          sectionType: 'photo',
          documentId: 'doc-123',
          imageWidthCm: '12',
          imageHeightCm: '9',
        }),
      ],
    });

    expect(result.resultSections[0].sectionType).toBe('photo');
    expect(result.resultSections[0].imageWidthCm).toBe(12);
    expect(result.resultSections[0].imageHeightCm).toBe(9);
    expect(result.resultSections[0].documentId).toBeUndefined(); // 비움
    expect(result.counts.photos).toBe(1);
  });

  it('text: title 보존 + content 비움', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({
          sortOrder: 0,
          sectionType: 'text',
          title: '판정 근거',
          content: '이전 점검에서 작성한 텍스트 내용',
        }),
      ],
    });

    expect(result.resultSections[0].sectionType).toBe('text');
    expect(result.resultSections[0].title).toBe('판정 근거');
    expect(result.resultSections[0].content).toBeUndefined(); // 비움
    expect(result.counts.texts).toBe(1);
  });

  it('counts: 다양한 sectionType 합산', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({ sortOrder: 0, sectionType: 'rich_table' }),
        baseSection({ sortOrder: 1, sectionType: 'rich_table' }),
        baseSection({ sortOrder: 2, sectionType: 'photo' }),
        baseSection({ sortOrder: 3, sectionType: 'text' }),
      ],
    });

    expect(result.counts).toEqual({ tables: 2, photos: 1, texts: 1 });
  });

  it('sortOrder 정렬 + 0부터 재인덱스', () => {
    const result = extractStructureFromInspection({
      resultSections: [
        baseSection({ sortOrder: 5, sectionType: 'text', title: 'B' }),
        baseSection({ sortOrder: 1, sectionType: 'text', title: 'A' }),
      ],
    });

    expect(result.resultSections[0].title).toBe('A');
    expect(result.resultSections[0].sortOrder).toBe(0);
    expect(result.resultSections[1].title).toBe('B');
    expect(result.resultSections[1].sortOrder).toBe(1);
  });

  it('빈 source → 빈 결과', () => {
    const result = extractStructureFromInspection({});
    expect(result.items).toEqual([]);
    expect(result.resultSections).toEqual([]);
    expect(result.counts).toEqual({ tables: 0, photos: 0, texts: 0 });
  });
});

describe('describeStructureCounts', () => {
  it('0인 카테고리 생략', () => {
    const desc = describeStructureCounts({ tables: 2, photos: 0, texts: 1 });
    expect(desc.hasAny).toBe(true);
    expect(desc.parts).toEqual([
      { key: 'tables', count: 2 },
      { key: 'texts', count: 1 },
    ]);
  });

  it('모두 0이면 hasAny=false', () => {
    const desc = describeStructureCounts({ tables: 0, photos: 0, texts: 0 });
    expect(desc.hasAny).toBe(false);
    expect(desc.parts).toEqual([]);
  });

  it('순서: tables → photos → texts', () => {
    const desc = describeStructureCounts({ tables: 1, photos: 1, texts: 1 });
    expect(desc.parts.map((p) => p.key)).toEqual(['tables', 'photos', 'texts']);
  });
});
