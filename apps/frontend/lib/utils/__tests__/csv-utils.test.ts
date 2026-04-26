import { sanitizeCsvCell } from '../csv-utils';

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
