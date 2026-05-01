/**
 * structure-diff helpers — Phase 1B-E
 *
 * 시나리오:
 * 1. buildCurrentStructure: form state → ExtractedInspectionStructure 변환
 * 2. diffFormAgainstTemplate: hasChanges=false (변경 없음)
 * 3. diffFormAgainstTemplate: items 추가
 * 4. diffFormAgainstTemplate: items 삭제
 * 5. diffFormAgainstTemplate: section 추가
 * 6. round-trip: extract → diff against itself → hasChanges=false
 */

import { buildCurrentStructure, diffFormAgainstTemplate } from '../structure-diff';
import type { CreateResultSectionDto } from '@/lib/api/calibration-api';

describe('buildCurrentStructure', () => {
  it('strips judgment/checkResult values', () => {
    const items = [{ checkItem: '외관', checkCriteria: '파손 없음' }];
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'title', title: '결과' },
    ];
    const result = buildCurrentStructure(items, sections);
    expect(result.items[0].checkResult).toBe('');
    expect(result.items[0].judgment).toBe('');
    expect(result.items[0].checkItem).toBe('외관');
    expect(result.items[0].checkCriteria).toBe('파손 없음');
  });

  it('counts sections by type', () => {
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'rich_table', richTableData: { headers: ['A'], rows: [] } },
      { sortOrder: 1, sectionType: 'photo', imageWidthCm: 10, imageHeightCm: 8 },
      { sortOrder: 2, sectionType: 'text' },
    ];
    const result = buildCurrentStructure([], sections);
    expect(result.counts).toEqual({ tables: 1, photos: 1, texts: 1 });
  });
});

describe('diffFormAgainstTemplate', () => {
  const baseTemplateStructure = {
    items: [
      { checkItem: '외관', checkCriteria: '파손 없음', checkResult: '', judgment: '' as const },
      { checkItem: '동작', checkCriteria: '정상', checkResult: '', judgment: '' as const },
    ],
    resultSections: [{ sortOrder: 0, sectionType: 'title' as const, title: '결과' }],
    counts: { tables: 0, photos: 0, texts: 1 },
  };

  it('hasChanges=false when form matches template exactly', () => {
    const items = [
      { checkItem: '외관', checkCriteria: '파손 없음' },
      { checkItem: '동작', checkCriteria: '정상' },
    ];
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'title', title: '결과' },
    ];
    const diff = diffFormAgainstTemplate(items, sections, baseTemplateStructure);
    expect(diff.hasChanges).toBe(false);
  });

  it('detects added items', () => {
    const items = [
      { checkItem: '외관', checkCriteria: '파손 없음' },
      { checkItem: '동작', checkCriteria: '정상' },
      { checkItem: '신규항목', checkCriteria: '추가됨' },
    ];
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'title', title: '결과' },
    ];
    const diff = diffFormAgainstTemplate(items, sections, baseTemplateStructure);
    expect(diff.hasChanges).toBe(true);
    expect(diff.itemsAdded).toContain('신규항목');
  });

  it('detects removed items', () => {
    const items = [{ checkItem: '외관', checkCriteria: '파손 없음' }];
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'title', title: '결과' },
    ];
    const diff = diffFormAgainstTemplate(items, sections, baseTemplateStructure);
    expect(diff.hasChanges).toBe(true);
    expect(diff.itemsRemoved).toContain('동작');
  });

  it('detects added sections', () => {
    const items = [
      { checkItem: '외관', checkCriteria: '파손 없음' },
      { checkItem: '동작', checkCriteria: '정상' },
    ];
    const sections: CreateResultSectionDto[] = [
      { sortOrder: 0, sectionType: 'title', title: '결과' },
      { sortOrder: 1, sectionType: 'photo', imageWidthCm: 10, imageHeightCm: 8 },
    ];
    const diff = diffFormAgainstTemplate(items, sections, baseTemplateStructure);
    expect(diff.hasChanges).toBe(true);
    expect(diff.sectionsAdded.length).toBeGreaterThan(0);
  });
});
