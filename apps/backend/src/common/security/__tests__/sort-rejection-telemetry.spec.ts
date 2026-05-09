import { Logger } from '@nestjs/common';
import { SortRejectionTelemetryService } from '../sort-rejection-telemetry.service';
import { SortRejectionEvent } from '../contract';

/** spec-only — service private state 접근용 (sweep 분기 검증). */
interface ServicePrivate {
  recentRejections: Map<string, number>;
  currentMinuteCount: number;
  currentMinuteWindow: number;
}

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
    /**
     * sweep 분기는 1000개 unique key 시점에서 발동되므로 rate limit (60/분) 하에서는
     * 일반 호출만으로 17분+ advanceTimers 가 필요. spec 효율을 위해 service private state 에
     * 직접 stale 항목을 주입한 뒤 sweep 분기 진입을 검증한다.
     */
    it('1000개 도달 시 stale 항목 (1분 경과) 정리', () => {
      const privateState = service as unknown as ServicePrivate;
      const oldTimestamp = Date.now() - 120_000; // 2분 전 (stale)

      // 1000개 stale entry 직접 주입
      for (let i = 0; i < 1000; i++) {
        privateState.recentRejections.set(`stale-key-${i}`, oldTimestamp);
      }
      expect(privateState.recentRejections.size).toBe(1000);

      // 신규 호출 트리거 → sweep 분기 진입 (size >= 1000) → stale 1000개 제거 후 신규 1개 add
      service.recordSortRejection({ ...baseEvent, invalidValue: 'fresh-after-sweep' });

      // 정리 완료 — stale 키 0건 + 신규 키 1건만 잔존
      expect(privateState.recentRejections.size).toBe(1);
      expect(privateState.recentRejections.has('/equipment|fresh-after-sweep')).toBe(true);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('1000개 미달 시 sweep 미발동 — 정상 add 진행', () => {
      const privateState = service as unknown as ServicePrivate;
      const recentTimestamp = Date.now() - 1_000; // 1초 전 (still fresh)

      // 999개 fresh entry 주입 (sweep threshold 1000 미달)
      for (let i = 0; i < 999; i++) {
        privateState.recentRejections.set(`fresh-key-${i}`, recentTimestamp);
      }

      service.recordSortRejection({ ...baseEvent, invalidValue: 'add-without-sweep' });

      // sweep 미발동 — 999 + 1 = 1000 (정상 add)
      expect(privateState.recentRejections.size).toBe(1000);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('1000개 도달 + 모두 fresh 인 경우 sweep 호출되어도 항목 유지', () => {
      const privateState = service as unknown as ServicePrivate;
      const recentTimestamp = Date.now() - 1_000; // 1초 전 — dedupeWindow 60s 미만

      // 1000개 fresh entry 주입
      for (let i = 0; i < 1000; i++) {
        privateState.recentRejections.set(`fresh-key-${i}`, recentTimestamp);
      }

      service.recordSortRejection({ ...baseEvent, invalidValue: 'fresh-add' });

      // sweep 진입했지만 모두 fresh → 삭제 0건 + 신규 1건 add → 1001개
      expect(privateState.recentRejections.size).toBe(1001);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
