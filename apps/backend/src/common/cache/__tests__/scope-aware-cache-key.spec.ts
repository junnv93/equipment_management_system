import { createScopeAwareCacheKeyBuilder, normalizeCacheParams } from '../scope-aware-cache-key';
import { CACHE_KEY_PREFIXES } from '../cache-key-prefixes';

describe('normalizeCacheParams', () => {
  it('should remove undefined, null, and empty string values', () => {
    const result = normalizeCacheParams({
      a: 'hello',
      b: undefined,
      c: null,
      d: '',
      e: 0,
      f: false,
    });
    expect(result).toEqual({ a: 'hello', e: 0, f: false });
  });

  it('should return empty object for all-empty params', () => {
    const result = normalizeCacheParams({ a: undefined, b: null, c: '' });
    expect(result).toEqual({});
  });

  it('should preserve arrays and nested objects', () => {
    const result = normalizeCacheParams({
      statuses: ['pending', 'approved'],
      nested: { key: 'value' },
    });
    expect(result).toEqual({
      statuses: ['pending', 'approved'],
      nested: { key: 'value' },
    });
  });
});

describe('createScopeAwareCacheKeyBuilder', () => {
  const buildKey = createScopeAwareCacheKeyBuilder(
    CACHE_KEY_PREFIXES.CHECKOUTS,
    new Set(['list', 'summary'])
  );

  it('should return baseKey when no params', () => {
    expect(buildKey('detail')).toBe('checkouts:detail');
  });

  it('should include params as sorted JSON for non-scope suffix', () => {
    const key = buildKey('detail', { uuid: 'abc-123' });
    expect(key).toBe('checkouts:detail:{"uuid":"abc-123"}');
  });

  it('should encode teamId as :t: segment for scope-aware suffix', () => {
    const key = buildKey('list', { teamId: 'team-1', page: 1 });
    expect(key).toBe('checkouts:list:t:team-1:{"page":1}');
  });

  it('should use :g: segment when teamId absent for scope-aware suffix', () => {
    const key = buildKey('list', { page: 1 });
    expect(key).toBe('checkouts:list:g:{"page":1}');
  });

  it('should use :g: segment when teamId is empty string', () => {
    const key = buildKey('summary', { teamId: '', page: 1 });
    expect(key).toBe('checkouts:summary:g:{"page":1}');
  });

  it('should NOT add scope segment for non-scope suffix even with teamId', () => {
    const key = buildKey('detail', { teamId: 'team-1', uuid: 'abc' });
    expect(key).toBe('checkouts:detail:{"teamId":"team-1","uuid":"abc"}');
  });

  it('should sort params keys alphabetically for stable keys', () => {
    const key1 = buildKey('detail', { z: 1, a: 2, m: 3 });
    const key2 = buildKey('detail', { m: 3, z: 1, a: 2 });
    expect(key1).toBe(key2);
    expect(key1).toBe('checkouts:detail:{"a":2,"m":3,"z":1}');
  });

  it('should strip undefined/null/empty params before key generation', () => {
    const key = buildKey('detail', { uuid: 'abc', empty: '', nil: null });
    expect(key).toBe('checkouts:detail:{"uuid":"abc"}');
  });

  it('should work with different scope-aware suffixes per builder', () => {
    const cfBuildKey = createScopeAwareCacheKeyBuilder(
      CACHE_KEY_PREFIXES.CALIBRATION_FACTORS,
      new Set(['list', 'registry'])
    );

    // 'registry' is scope-aware for CF
    const key = cfBuildKey('registry', { teamId: 't1', equipmentId: 'eq1' });
    expect(key).toBe('calibration-factors:registry:t:t1:{"equipmentId":"eq1"}');

    // 'summary' is NOT scope-aware for CF (only for checkouts)
    const key2 = cfBuildKey('summary', { teamId: 't1' });
    expect(key2).toBe('calibration-factors:summary:{"teamId":"t1"}');
  });

  it('should handle empty params object', () => {
    const key = buildKey('list', {});
    expect(key).toBe('checkouts:list:g:{}');
  });
});
