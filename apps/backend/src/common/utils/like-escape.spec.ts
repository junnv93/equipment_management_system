import {
  LIKE_ESCAPE_CHAR,
  escapeLikePattern,
  likeContains,
  likeStartsWith,
  likeEndsWith,
} from './like-escape';

describe('like-escape', () => {
  // SSOT 상수 검증 — 이스케이프 문자가 변경되면 이 테스트가 실패하여 의도적 변경임을 확인
  describe('LIKE_ESCAPE_CHAR (SSOT)', () => {
    it('이스케이프 문자가 정의되어 있고, 단일 문자', () => {
      expect(LIKE_ESCAPE_CHAR).toBeDefined();
      expect(LIKE_ESCAPE_CHAR).toHaveLength(1);
    });

    it('현재 이스케이프 문자는 "!"', () => {
      expect(LIKE_ESCAPE_CHAR).toBe('!');
    });
  });

  describe('escapeLikePattern', () => {
    it('일반 문자열은 변경 없이 반환', () => {
      expect(escapeLikePattern('hello')).toBe('hello');
      expect(escapeLikePattern('장비검색')).toBe('장비검색');
    });

    it('% 와일드카드를 이스케이프', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(escapeLikePattern('50%')).toBe(`50${e}%`);
      expect(escapeLikePattern('%match%')).toBe(`${e}%match${e}%`);
    });

    it('_ 와일드카드를 이스케이프', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(escapeLikePattern('a_b')).toBe(`a${e}_b`);
      expect(escapeLikePattern('__')).toBe(`${e}_${e}_`);
    });

    it('이스케이프 문자 자체를 이스케이프', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(escapeLikePattern(`alert${e}`)).toBe(`alert${e}${e}`);
      expect(escapeLikePattern(`${e}${e}`)).toBe(`${e}${e}${e}${e}`);
    });

    it('백슬래시는 이스케이프하지 않음 (LIKE 특수문자 아님)', () => {
      expect(escapeLikePattern('path\\to')).toBe('path\\to');
    });

    it('복합 특수문자를 모두 이스케이프', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(escapeLikePattern(`50%_off${e}sale`)).toBe(`50${e}%${e}_off${e}${e}sale`);
    });

    it('빈 문자열 처리', () => {
      expect(escapeLikePattern('')).toBe('');
    });

    it('이스케이프 문자가 먼저 처리됨 (이중 이스케이프 방지)', () => {
      const e = LIKE_ESCAPE_CHAR;
      // 입력 '!%' → 먼저 !→!! → 그 다음 %→!% → 결과: '!!!%'
      expect(escapeLikePattern(`${e}%`)).toBe(`${e}${e}${e}%`);
    });
  });

  describe('likeContains', () => {
    it('이스케이프된 값을 % 래핑', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(likeContains('test')).toBe('%test%');
      expect(likeContains('50%')).toBe(`%50${e}%%`);
    });
  });

  describe('likeStartsWith', () => {
    it('이스케이프된 값 뒤에 % 추가', () => {
      const e = LIKE_ESCAPE_CHAR;
      expect(likeStartsWith('SUW')).toBe('SUW%');
      expect(likeStartsWith('SUW_E')).toBe(`SUW${e}_E%`);
    });
  });

  describe('likeEndsWith', () => {
    it('이스케이프된 값 앞에 % 추가', () => {
      expect(likeEndsWith('.pdf')).toBe('%.pdf');
    });
  });
});
