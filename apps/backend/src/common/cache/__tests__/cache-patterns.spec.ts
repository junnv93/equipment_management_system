import { buildDetailCachePattern, escapeRegExp } from '../cache-patterns';
import { CACHE_KEY_PREFIXES } from '../cache-key-prefixes';

describe('buildDetailCachePattern', () => {
  const id = 'abc-123-def';

  function matches(pattern: string, key: string): boolean {
    return new RegExp(pattern).test(key);
  }

  describe('equipment detail', () => {
    const pattern = buildDetailCachePattern(CACHE_KEY_PREFIXES.EQUIPMENT, 'uuid', id);

    it('단일 키 {"uuid":"..."} 매칭', () => {
      expect(matches(pattern, `equipment:detail:{"uuid":"${id}"}`)).toBe(true);
    });

    it('정렬된 복수 키 {"includeTeam":false,"uuid":"..."} 매칭 (uuid가 뒤쪽)', () => {
      expect(matches(pattern, `equipment:detail:{"includeTeam":false,"uuid":"${id}"}`)).toBe(true);
    });

    it('uuid가 앞쪽에 오는 경우도 매칭 {"uuid":"...","version":1}', () => {
      expect(matches(pattern, `equipment:detail:{"uuid":"${id}","version":1}`)).toBe(true);
    });

    it('uuid 사이에 다른 키 삽입 시에도 매칭 {"a":1,"uuid":"...","b":2}', () => {
      expect(matches(pattern, `equipment:detail:{"a":1,"uuid":"${id}","b":2}`)).toBe(true);
    });

    it('다른 UUID는 매칭 안됨', () => {
      expect(matches(pattern, `equipment:detail:{"uuid":"other-id"}`)).toBe(false);
    });

    it('detail이 아닌 list/count 네임스페이스는 매칭 안됨', () => {
      expect(matches(pattern, `equipment:list:{"uuid":"${id}"}`)).toBe(false);
      expect(matches(pattern, `equipment:count:{"uuid":"${id}"}`)).toBe(false);
    });

    it('다른 prefix(checkouts) 는 매칭 안됨', () => {
      expect(matches(pattern, `checkouts:detail:{"uuid":"${id}"}`)).toBe(false);
    });
  });

  describe('checkouts detail', () => {
    const pattern = buildDetailCachePattern(CACHE_KEY_PREFIXES.CHECKOUTS, 'uuid', id);

    it('현재 키 포맷 매칭', () => {
      expect(matches(pattern, `checkouts:detail:{"uuid":"${id}"}`)).toBe(true);
    });

    it('미래에 teamId 등 파라미터 추가되어도 매칭 (latent bug 방지)', () => {
      expect(matches(pattern, `checkouts:detail:{"teamId":"T1","uuid":"${id}"}`)).toBe(true);
    });
  });

  describe('escapeRegExp', () => {
    it('정규식 메타문자를 이스케이프', () => {
      expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c');
      expect(escapeRegExp('a+b?c')).toBe('a\\+b\\?c');
      expect(escapeRegExp('a(b)c[d]')).toBe('a\\(b\\)c\\[d\\]');
    });

    it('ID에 메타문자가 포함돼도 정확 매칭만 성공', () => {
      const trickyId = 'a.b*c';
      const pattern = buildDetailCachePattern(CACHE_KEY_PREFIXES.EQUIPMENT, 'uuid', trickyId);
      expect(matches(pattern, `equipment:detail:{"uuid":"${trickyId}"}`)).toBe(true);
      // 메타문자가 이스케이프되지 않았다면 'aXbXXc' 같은 문자열도 매칭되어버림 — 이스케이프 덕에 실패해야 함.
      expect(matches(pattern, `equipment:detail:{"uuid":"aXbXXc"}`)).toBe(false);
    });
  });
});
