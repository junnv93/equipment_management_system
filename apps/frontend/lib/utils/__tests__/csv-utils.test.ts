import { parseCsvTable, sanitizeCsvCell } from '../csv-utils';

describe('sanitizeCsvCell', () => {
  it('일반 문자열은 따옴표로 감쌈', () => {
    expect(sanitizeCsvCell('hello')).toBe('"hello"');
  });

  it('내부 따옴표를 "" 로 이스케이프', () => {
    expect(sanitizeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("= 시작 값에 ' 프리픽스 (공식 주입 방지)", () => {
    expect(sanitizeCsvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
  });

  it("+ 시작 값에 ' 프리픽스", () => {
    expect(sanitizeCsvCell('+123')).toBe('"\'%2B123"'.replace('%2B', '+'));
  });

  it("- 시작 값에 ' 프리픽스", () => {
    expect(sanitizeCsvCell('-cmd')).toBe('"\'-cmd"');
  });

  it("@ 시작 값에 ' 프리픽스", () => {
    expect(sanitizeCsvCell('@user')).toBe('"\'@user"');
  });

  it('null/undefined → 빈 문자열', () => {
    expect(sanitizeCsvCell(null)).toBe('""');
    expect(sanitizeCsvCell(undefined)).toBe('""');
  });

  it('숫자 → 문자열 변환', () => {
    expect(sanitizeCsvCell(42)).toBe('"42"');
  });

  it("\\n 시작 값에 ' 프리픽스", () => {
    expect(sanitizeCsvCell('\nhidden')).toBe('"\'\\nhidden"'.replace('\\n', '\n'));
  });

  it("\\r\\n 시작 값에 ' 프리픽스", () => {
    expect(sanitizeCsvCell('\r\nhidden')).toBe('"\'\\r\\nhidden"'.replace('\\r\\n', '\r\n'));
  });
});

describe('parseCsvTable', () => {
  it('첫 행을 헤더로 해석하고 데이터 행을 반환', () => {
    expect(parseCsvTable('외관,기준,판정\n정상,흠집 없음,합격')).toEqual({
      headers: ['외관', '기준', '판정'],
      rows: [['정상', '흠집 없음', '합격']],
    });
  });

  it('quoted field 안의 쉼표와 줄바꿈을 보존', () => {
    expect(parseCsvTable('항목,비고\n"외관, 케이스","상단\n하단 확인"')).toEqual({
      headers: ['항목', '비고'],
      rows: [['외관, 케이스', '상단\n하단 확인']],
    });
  });

  it('escaped quote를 단일 quote로 복원', () => {
    expect(parseCsvTable('항목,결과\n"나사 ""A""",정상')).toEqual({
      headers: ['항목', '결과'],
      rows: [['나사 "A"', '정상']],
    });
  });

  it('짧거나 긴 행을 헤더 수에 맞춰 정규화', () => {
    expect(parseCsvTable('A,B,C\n1,2\n3,4,5,6')).toEqual({
      headers: ['A', 'B', 'C'],
      rows: [
        ['1', '2', ''],
        ['3', '4', '5'],
      ],
    });
  });

  it('빈 입력이나 빈 헤더는 null을 반환', () => {
    expect(parseCsvTable('')).toBeNull();
    expect(parseCsvTable(',,\n1,2,3')).toBeNull();
  });
});
