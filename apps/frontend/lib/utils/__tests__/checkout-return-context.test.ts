/**
 * Sprint 4.5 U-07 — checkout-return-context 단위 테스트.
 *
 * 검증:
 *   - TTL 1시간 만료 시 null 반환 + storage 청소
 *   - private mode (sessionStorage 차단) 시 silent fallback
 *   - 빈 query 저장 회피 (clean URL을 stale로 덮지 않음)
 *   - one-shot 보장 (restore 후 자동 삭제)
 */

import {
  saveCheckoutListContext,
  restoreCheckoutListContext,
  clearCheckoutListContext,
} from '../checkout-return-context';

describe('checkout-return-context', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('saveCheckoutListContext', () => {
    it('URLSearchParams를 sessionStorage에 저장', () => {
      const params = new URLSearchParams('view=outbound&page=2');
      saveCheckoutListContext(params);
      const raw = sessionStorage.getItem('checkout.return.context');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.query).toBe('view=outbound&page=2');
      expect(typeof parsed.ts).toBe('number');
    });

    it('string 입력도 받음', () => {
      saveCheckoutListContext('search=test&status=pending');
      const raw = sessionStorage.getItem('checkout.return.context');
      expect(JSON.parse(raw!).query).toBe('search=test&status=pending');
    });

    it('빈 query는 저장하지 않음 — clean URL을 stale context로 덮지 않도록', () => {
      saveCheckoutListContext(new URLSearchParams());
      saveCheckoutListContext('');
      expect(sessionStorage.getItem('checkout.return.context')).toBeNull();
    });

    it('sessionStorage 차단 (private mode) 시 silent fallback — throw 없음', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => saveCheckoutListContext('view=outbound')).not.toThrow();
      Storage.prototype.setItem = original;
    });
  });

  describe('restoreCheckoutListContext', () => {
    it('저장된 context를 URLSearchParams로 복원', () => {
      saveCheckoutListContext('view=outbound&page=2');
      const restored = restoreCheckoutListContext();
      expect(restored).not.toBeNull();
      expect(restored!.get('view')).toBe('outbound');
      expect(restored!.get('page')).toBe('2');
    });

    it('저장된 context가 없으면 null', () => {
      expect(restoreCheckoutListContext()).toBeNull();
    });

    it('TTL 1시간 만료 시 null + storage 청소', () => {
      jest.useFakeTimers();
      const startTs = Date.now();
      jest.setSystemTime(startTs);

      saveCheckoutListContext('view=outbound');

      // 59분 후 — 아직 valid
      jest.setSystemTime(startTs + 59 * 60 * 1000);
      saveCheckoutListContext('view=outbound');
      const stored = sessionStorage.getItem('checkout.return.context');
      // TS 갱신을 위해 다시 저장 (실제 동작 시뮬레이션)
      const parsed = JSON.parse(stored!);
      // 시간을 강제로 과거로 설정 (TTL 초과 시뮬레이션)
      parsed.ts = startTs - 61 * 60 * 1000;
      sessionStorage.setItem('checkout.return.context', JSON.stringify(parsed));

      const restored = restoreCheckoutListContext();
      expect(restored).toBeNull();
      // 만료된 context는 storage에서 자동 삭제 (one-shot cleanup)
      expect(sessionStorage.getItem('checkout.return.context')).toBeNull();
    });

    it('one-shot — restore 후 자동 삭제 (두 번 복원 안 됨)', () => {
      saveCheckoutListContext('view=outbound');
      const first = restoreCheckoutListContext();
      expect(first).not.toBeNull();
      const second = restoreCheckoutListContext();
      expect(second).toBeNull();
    });

    it('손상된 JSON 시 null + silent fallback', () => {
      sessionStorage.setItem('checkout.return.context', 'not valid json{');
      expect(restoreCheckoutListContext()).toBeNull();
    });

    it('sessionStorage 차단 시 null fallback — throw 없음', () => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('access denied');
      });
      expect(restoreCheckoutListContext()).toBeNull();
      Storage.prototype.getItem = original;
    });

    it('타입 검증 — 잘못된 schema 시 null', () => {
      sessionStorage.setItem('checkout.return.context', JSON.stringify({ other: 'field' }));
      expect(restoreCheckoutListContext()).toBeNull();
    });
  });

  describe('clearCheckoutListContext', () => {
    it('저장된 context 삭제', () => {
      saveCheckoutListContext('view=outbound');
      clearCheckoutListContext();
      expect(sessionStorage.getItem('checkout.return.context')).toBeNull();
    });

    it('storage 차단 시 silent fallback', () => {
      const original = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('access denied');
      });
      expect(() => clearCheckoutListContext()).not.toThrow();
      Storage.prototype.removeItem = original;
    });
  });
});
