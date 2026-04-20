import * as Layout from '../calibration-plan.layout';

describe('calibration-plan.layout.ts 불변식', () => {
  it('FORM_NUMBER이 UL-QP-19-01이어야 함', () => {
    expect(Layout.FORM_NUMBER).toBe('UL-QP-19-01');
  });

  it('SHEET_NAMES가 비어있지 않아야 함', () => {
    expect(Layout.SHEET_NAMES.length).toBeGreaterThan(0);
  });

  it('SHEET_NAMES 첫 번째가 Sheet1이어야 함 (UL-QP-19-01(01) 신규 양식)', () => {
    expect(Layout.SHEET_NAMES[0]).toBe('Sheet1');
  });

  it('SHEET_NAMES에 연간 교정계획서가 포함되어야 함 (구 양식 호환)', () => {
    expect(Layout.SHEET_NAMES).toContain('연간 교정계획서');
  });

  it('DATA_END_ROW가 DATA_START_ROW보다 크고 서명란(34) 이전이어야 함', () => {
    expect(Layout.DATA_END_ROW).toBeGreaterThan(Layout.DATA_START_ROW);
    expect(Layout.DATA_END_ROW).toBeLessThan(34);
  });

  it('DATA_START_ROW가 6이어야 함 (Row 1~3 제목, Row 4~5 헤더)', () => {
    expect(Layout.DATA_START_ROW).toBe(6);
  });

  it('COLUMN_COUNT가 10이어야 함 (A~J)', () => {
    expect(Layout.COLUMN_COUNT).toBe(10);
  });

  it('COLUMNS 길이가 COLUMN_COUNT와 일치해야 함', () => {
    expect(Layout.COLUMNS.length).toBe(Layout.COLUMN_COUNT);
  });

  it('COLUMNS의 첫 번째가 sequenceNumber이어야 함', () => {
    expect(Layout.COLUMNS[0].key).toBe('sequenceNumber');
  });

  it('COLUMNS의 마지막이 notes이어야 함', () => {
    expect(Layout.COLUMNS[Layout.COLUMNS.length - 1].key).toBe('notes');
  });

  it('COLUMNS key가 중복 없어야 함', () => {
    const keys = Layout.COLUMNS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
