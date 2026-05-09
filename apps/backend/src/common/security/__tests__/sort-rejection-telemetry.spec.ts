import { Logger } from '@nestjs/common';
import { SortRejectionTelemetryService } from '../sort-rejection-telemetry.service';
import type {
  SortRejectionEvent,
  SortRejectionRateLimiter,
  SortRejectionDropReason,
} from '../contract';
import type { MetricsService } from '../../metrics/metrics.service';

/** fire-and-forget async 내부 doRecord() 완료 대기 */
const flush = (): Promise<void> => new Promise<void>((resolve) => setImmediate(resolve));

function makeRateLimiter(
  allowed: boolean,
  reason: SortRejectionDropReason | null = null
): jest.Mocked<SortRejectionRateLimiter> {
  return {
    acquireSlot: jest
      .fn()
      .mockResolvedValue({ allowed, reason: allowed ? null : (reason ?? 'rate-limit') }),
  };
}

function makeMetricsService(): jest.Mocked<
  Pick<MetricsService, 'observeSortRejection' | 'incrementSortRejectionDrops'>
> {
  return {
    observeSortRejection: jest.fn(),
    incrementSortRejectionDrops: jest.fn(),
  };
}

/**
 * SortRejectionTelemetryService 단위 spec.
 *
 * Contract:
 *  - rateLimiter.allowed=true → Logger.warn 1회 + MetricsService.observeSortRejection 호출
 *  - rateLimiter.allowed=false → silent drop + MetricsService.incrementSortRejectionDrops 호출
 *  - 어떤 경우에도 throw 하지 않음 (fire-and-forget)
 *  - rateLimiter/metricsService 예외 시에도 응답 흐름 비차단
 *
 * Rate limit / dedupe 동작 자체는 SortRejectionRedisRateLimiterService spec 에서 검증.
 */
describe('SortRejectionTelemetryService', () => {
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
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('allowed=true — logging 허용', () => {
    it('Logger.warn 1회 트리거 — SIEM 파싱 가능 형식', async () => {
      const service = new SortRejectionTelemetryService(makeRateLimiter(true));
      service.recordSortRejection(baseEvent);
      await flush();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const [msg, payload] = warnSpy.mock.calls[0] as [string, Record<string, unknown>];
      expect(msg).toContain('Sort field rejection');
      expect(msg).toContain('route=/equipment');
      expect(msg).toContain('reason=invalid_value');
      expect(payload).toMatchObject({
        event: 'sort_rejection',
        reason: 'invalid_value',
        route: '/equipment',
        httpMethod: 'GET',
      });
    });

    it('userId null → anonymous 출력', async () => {
      const service = new SortRejectionTelemetryService(makeRateLimiter(true));
      service.recordSortRejection({ ...baseEvent, userId: null });
      await flush();

      expect(warnSpy.mock.calls[0][0]).toContain('userId=anonymous');
    });

    it('userId 있을 때 ID 포함', async () => {
      const service = new SortRejectionTelemetryService(makeRateLimiter(true));
      service.recordSortRejection({ ...baseEvent, userId: 'user-123' });
      await flush();

      expect(warnSpy.mock.calls[0][0]).toContain('userId=user-123');
    });

    it('MetricsService 주입 시 observeSortRejection 호출', async () => {
      const metrics = makeMetricsService();
      const service = new SortRejectionTelemetryService(
        makeRateLimiter(true),
        metrics as unknown as MetricsService
      );
      service.recordSortRejection(baseEvent);
      await flush();

      expect(metrics.observeSortRejection).toHaveBeenCalledTimes(1);
      expect(metrics.observeSortRejection).toHaveBeenCalledWith('/equipment', 'invalid_value');
      expect(metrics.incrementSortRejectionDrops).not.toHaveBeenCalled();
    });

    it('MetricsService 미주입 시에도 warn 정상 호출', async () => {
      const service = new SortRejectionTelemetryService(makeRateLimiter(true));
      service.recordSortRejection(baseEvent);
      await flush();

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('allowed=false — silent drop', () => {
    it('Logger.warn 호출 없음', async () => {
      const service = new SortRejectionTelemetryService(makeRateLimiter(false, 'rate-limit'));
      service.recordSortRejection(baseEvent);
      await flush();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('MetricsService 주입 시 incrementSortRejectionDrops 호출 — reason 전달', async () => {
      const metrics = makeMetricsService();
      const service = new SortRejectionTelemetryService(
        makeRateLimiter(false, 'dedupe'),
        metrics as unknown as MetricsService
      );
      service.recordSortRejection(baseEvent);
      await flush();

      expect(metrics.incrementSortRejectionDrops).toHaveBeenCalledTimes(1);
      expect(metrics.incrementSortRejectionDrops).toHaveBeenCalledWith('dedupe');
      expect(metrics.observeSortRejection).not.toHaveBeenCalled();
    });

    it('rate-limit-fallback reason도 counter 증가', async () => {
      const metrics = makeMetricsService();
      const service = new SortRejectionTelemetryService(
        makeRateLimiter(false, 'rate-limit-fallback'),
        metrics as unknown as MetricsService
      );
      service.recordSortRejection(baseEvent);
      await flush();

      expect(metrics.incrementSortRejectionDrops).toHaveBeenCalledWith('rate-limit-fallback');
    });
  });

  describe('fire-and-forget — 안정성', () => {
    it('rateLimiter.acquireSlot 이 reject 해도 service 는 throw 안 함', async () => {
      const brokenLimiter: SortRejectionRateLimiter = {
        acquireSlot: jest.fn().mockRejectedValue(new Error('redis crashed')),
      };
      const service = new SortRejectionTelemetryService(brokenLimiter);
      expect(() => service.recordSortRejection(baseEvent)).not.toThrow();
      await flush();
      // 에러 logging 시도
      expect(errorSpy).toHaveBeenCalled();
    });

    it('Logger.warn 이 throw 해도 service 는 throw 안 함', async () => {
      warnSpy.mockImplementation(() => {
        throw new Error('logger crashed');
      });
      const service = new SortRejectionTelemetryService(makeRateLimiter(true));
      expect(() => service.recordSortRejection(baseEvent)).not.toThrow();
      await flush();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('rateLimiter.acquireSlot 이 여러 번 호출돼도 각각 독립 처리', async () => {
      const rateLimiter = makeRateLimiter(true);
      const service = new SortRejectionTelemetryService(rateLimiter);

      service.recordSortRejection(baseEvent);
      service.recordSortRejection({ ...baseEvent, normalizedRoute: '/checkouts' });
      await flush();

      expect(rateLimiter.acquireSlot).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
