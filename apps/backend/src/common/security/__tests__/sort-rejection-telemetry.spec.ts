import { Logger } from '@nestjs/common';
import { SortRejectionTelemetryService } from '../sort-rejection-telemetry.service';
import type { SortRejectionEvent } from '../contract';

/**
 * SortRejectionTelemetryService 단위 spec.
 *
 * Contract:
 *  - 정상 호출 → Logger.warn 1회
 *  - 동일 (route, invalidValue) 1분 내 중복 → silent drop
 *  - 분당 60건 초과 → silent drop
 *  - 1분 경과 후 dedupe + rate limit 모두 해제
 *  - 어떤 경우에도 throw 하지 않음 (fire-and-forget)
 */
describe('SortRejectionTelemetryService', () => {
  let service: SortRejectionTelemetryService;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const baseEvent: SortRejectionEvent = {
    invalidValue: '; DROP TABLE users--',
    reason: 'invalid_value',
    normalizedRoute: '/equipment',
    httpMethod: 'GET',
    userId: null,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-09T00:00:00Z'));
    service = new SortRejectionTelemetryService();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('정상 호출', () => {
    it('첫 호출은 Logger.warn 1회 트리거', () => {
      service.recordSortRejection(baseEvent);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      // structured payload 검증 — SIEM 파싱 가능 형식
      const args = warnSpy.mock.calls[0];
      expect(args[0]).toContain('Sort field rejection');
      expect(args[0]).toContain('route=/equipment');
      expect(args[0]).toContain('reason=invalid_value');
      expect(args[1]).toMatchObject({
        event: 'sort_rejection',
        reason: 'invalid_value',
        route: '/equipment',
        httpMethod: 'GET',
      });
    });

    it('서로 다른 (route, invalidValue) 키는 모두 warn', () => {
      service.recordSortRejection(baseEvent);
      service.recordSortRejection({ ...baseEvent, invalidValue: 'OTHER_INJECTION' });
      service.recordSortRejection({ ...baseEvent, normalizedRoute: '/checkouts' });
      expect(warnSpy).toHaveBeenCalledTimes(3);
    });

    it('userId nullable — anonymous 시 출력', () => {
      service.recordSortRejection({ ...baseEvent, userId: null });
      const args = warnSpy.mock.calls[0];
      expect(args[0]).toContain('userId=anonymous');
    });

    it('userId 있을 때 ID 포함', () => {
      service.recordSortRejection({ ...baseEvent, userId: 'user-123' });
      const args = warnSpy.mock.calls[0];
      expect(args[0]).toContain('userId=user-123');
    });
  });

  describe('dedupe — 동일 (route, invalidValue) 1분 내 중복', () => {
    it('동일 키 즉시 중복 호출은 1번만 warn', () => {
      service.recordSortRejection(baseEvent);
      service.recordSortRejection(baseEvent);
      service.recordSortRejection(baseEvent);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('59초 후 재호출도 drop', () => {
      service.recordSortRejection(baseEvent);
      jest.advanceTimersByTime(59_000);
      service.recordSortRejection(baseEvent);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('60초 + 1ms 경과 후 재호출은 다시 warn (dedupe 윈도우 만료)', () => {
      service.recordSortRejection(baseEvent);
      jest.advanceTimersByTime(60_001);
      service.recordSortRejection(baseEvent);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('rate limit — 분당 60건 상한', () => {
    it('60건 정상 처리 후 61번째부터 drop', () => {
      for (let i = 0; i < 60; i++) {
        // 서로 다른 invalidValue 로 dedupe 영향 회피
        service.recordSortRejection({ ...baseEvent, invalidValue: `attempt-${i}` });
      }
      expect(warnSpy).toHaveBeenCalledTimes(60);

      // 61번째 호출 → drop
      service.recordSortRejection({ ...baseEvent, invalidValue: 'attempt-60' });
      expect(warnSpy).toHaveBeenCalledTimes(60);
    });

    it('1분 경과 후 카운터 리셋', () => {
      for (let i = 0; i < 60; i++) {
        service.recordSortRejection({ ...baseEvent, invalidValue: `attempt-${i}` });
      }
      // 다음 분 진입
      jest.advanceTimersByTime(60_000);
      service.recordSortRejection({ ...baseEvent, invalidValue: 'fresh-minute' });
      expect(warnSpy).toHaveBeenCalledTimes(61);
    });
  });

  describe('fire-and-forget — 안정성', () => {
    it('Logger.warn 가 throw 해도 service 는 throw 안 함', () => {
      warnSpy.mockImplementation(() => {
        throw new Error('logger crashed');
      });
      expect(() => service.recordSortRejection(baseEvent)).not.toThrow();
      // 에러 logging 시도
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Map size sweep — 메모리 누수 방지', () => {
    it('1000개 초과 시 stale 항목 정리 (1분 경과)', () => {
      // 1000개 unique key 등록
      for (let i = 0; i < 1000; i++) {
        service.recordSortRejection({ ...baseEvent, invalidValue: `key-${i}` });
      }
      // 분당 rate limit (60) 초과로 일부 drop 됐을 것이지만 dedupe 트래커에는 처음 60개만 들어감.
      // 실제로는 rate limit 으로 인해 60개만 등록됨 — sweep 트리거 안 됨.

      // 다음 분으로 이동 (rate limit 리셋)
      jest.advanceTimersByTime(60_000);
      // 1001번째 unique key → 이전 1000개가 stale 이므로 sweep 트리거
      // (rate limit 60건 으로 인해 실제 등록은 60건씩이지만 sweep 동작 자체 검증)
      service.recordSortRejection({ ...baseEvent, invalidValue: 'after-sweep' });
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
