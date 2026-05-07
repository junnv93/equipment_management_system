import { toCsvParam } from '../query-csv';

describe('toCsvParam', () => {
  it('returns undefined for undefined input', () => {
    expect(toCsvParam(undefined)).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(toCsvParam(null)).toBeUndefined();
  });

  it('passes through trimmed non-empty string', () => {
    expect(toCsvParam('id-a,id-b')).toBe('id-a,id-b');
  });

  it('trims surrounding whitespace from string input', () => {
    expect(toCsvParam('  id-a  ')).toBe('id-a');
  });

  it('returns undefined for empty / whitespace-only string', () => {
    expect(toCsvParam('')).toBeUndefined();
    expect(toCsvParam('   ')).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(toCsvParam([])).toBeUndefined();
  });

  it('joins single-element array without trailing separator', () => {
    expect(toCsvParam(['id-a'])).toBe('id-a');
  });

  it('joins multi-element array with comma separator', () => {
    expect(toCsvParam(['id-a', 'id-b', 'id-c'])).toBe('id-a,id-b,id-c');
  });

  it('trims each array token and skips empties', () => {
    expect(toCsvParam(['  id-a  ', '', 'id-b'])).toBe('id-a,id-b');
  });

  it('returns undefined when all array tokens trim to empty', () => {
    expect(toCsvParam(['  ', ''])).toBeUndefined();
  });

  it('accepts readonly arrays', () => {
    const tokens = ['id-a', 'id-b'] as const;
    expect(toCsvParam(tokens)).toBe('id-a,id-b');
  });
});
