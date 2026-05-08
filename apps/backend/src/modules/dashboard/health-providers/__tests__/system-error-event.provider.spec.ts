import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemErrorEventProviderImpl } from '../system-error-event.provider';
import { SentryErrorSink } from '../sentry-error-sink';
import { MetricsService } from '../../../../common/metrics/metrics.service';
import type {
  SystemErrorEventInput,
  SystemHealthRateLimiter,
} from '../../../../common/system-health/contract';
import { SYSTEM_HEALTH_RATE_LIMITER } from '../../../../common/system-health/contract';

describe('SystemErrorEventProviderImpl', () => {
  let provider: SystemErrorEventProviderImpl;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
  };
  let mockSentry: { emit: jest.Mock; isEnabled: jest.Mock };
  let mockConfig: { get: jest.Mock };
  let mockRateLimiter: jest.Mocked<SystemHealthRateLimiter>;
  let mockMetrics: { incrementSystemErrorEventDrops: jest.Mock };

  function makeQueryChain(result: { count: number }[]) {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.from = jest.fn().mockReturnValue(chain);
    chain.where = jest.fn().mockResolvedValue(result);
    return chain;
  }

  function buildInput(): SystemErrorEventInput {
    return {
      errorCode: 'InternalServerError',
      httpMethod: 'POST',
      normalizedRoute: '/api/equipment/:id',
      statusCode: 500,
      userId: null,
      stackHash: 'abcd1234',
      stackPreview: null,
    };
  }

  beforeEach(async () => {
    mockSentry = {
      emit: jest.fn().mockResolvedValue(undefined),
      isEnabled: jest.fn().mockReturnValue(false),
    };
    mockConfig = { get: jest.fn(() => undefined) };
    mockMetrics = { incrementSystemErrorEventDrops: jest.fn() };

    mockDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
    };

    // 기본값: 허용 (allowed=true)
    mockRateLimiter = {
      acquireSlot: jest.fn().mockResolvedValue({ allowed: true, reason: null }),
    };

    const module = await Test.createTestingModule({
      providers: [
        SystemErrorEventProviderImpl,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SYSTEM_HEALTH_RATE_LIMITER, useValue: mockRateLimiter },
        { provide: MetricsService, useValue: mockMetrics },
        { provide: SentryErrorSink, useValue: mockSentry },
      ],
    }).compile();

    provider = module.get(SystemErrorEventProviderImpl);
  });

  describe('count24h()', () => {
    it('default(off) — system_error_events 테이블 카운트 + source = system-error-events', async () => {
      const chain = makeQueryChain([{ count: 7 }]);
      mockDb.select = jest.fn().mockReturnValue(chain);

      const result = await provider.count24h();

      expect(result.errorCount24h).toBe(7);
      expect(result.source).toBe('system-error-events');
    });

    it('테이블 비어있으면 0 반환', async () => {
      const chain = makeQueryChain([]);
      mockDb.select = jest.fn().mockReturnValue(chain);

      const result = await provider.count24h();
      expect(result.errorCount24h).toBe(0);
    });

    it('쿼리 실패 시 0 + system-error-events source 유지 (상태 흐름 보존)', async () => {
      const chain: Record<string, jest.Mock> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockRejectedValue(new Error('table missing'));
      mockDb.select = jest.fn().mockReturnValue(chain);

      const result = await provider.count24h();
      expect(result.errorCount24h).toBe(0);
      expect(result.source).toBe('system-error-events');
    });
  });

  describe('count24h() — fallback (audit-proxy)', () => {
    it('SYSTEM_HEALTH_ERROR_FALLBACK=audit-proxy 시 audit_logs 합산 + source = audit-rejection-proxy', async () => {
      mockConfig.get.mockImplementation((key: string) =>
        key === 'SYSTEM_HEALTH_ERROR_FALLBACK' ? 'audit-proxy' : undefined
      );
      const chain = makeQueryChain([{ count: 11 }]);
      mockDb.select = jest.fn().mockReturnValue(chain);

      const fallbackModule = await Test.createTestingModule({
        providers: [
          SystemErrorEventProviderImpl,
          { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
          { provide: ConfigService, useValue: mockConfig },
          { provide: SYSTEM_HEALTH_RATE_LIMITER, useValue: mockRateLimiter },
          { provide: MetricsService, useValue: mockMetrics },
          { provide: SentryErrorSink, useValue: mockSentry },
        ],
      }).compile();
      const fallbackProvider = fallbackModule.get(SystemErrorEventProviderImpl);

      const result = await fallbackProvider.count24h();
      expect(result.errorCount24h).toBe(11);
      expect(result.source).toBe('audit-rejection-proxy');
    });
  });

  describe('record() — 정상 경로', () => {
    it('acquireSlot allowed=true → db.insert 호출 + Sentry emit 호출', async () => {
      await provider.record(buildInput());

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockSentry.emit).toHaveBeenCalledTimes(1);
      expect(mockMetrics.incrementSystemErrorEventDrops).not.toHaveBeenCalled();
    });

    it('db.insert 실패해도 throw 안 함 (fire-and-forget)', async () => {
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockRejectedValue(new Error('DB down')),
      });

      await expect(provider.record(buildInput())).resolves.toBeUndefined();
    });

    it('Sentry emit 도 어떤 예외도 throw 시키지 않음', async () => {
      mockSentry.emit.mockRejectedValueOnce(new Error('sentry borked'));

      await expect(provider.record(buildInput())).resolves.toBeUndefined();
    });
  });

  describe('record() — rate limiter drop 분기', () => {
    it('acquireSlot allowed=false reason=rate-limit → INSERT 생략 + counter 증가', async () => {
      mockRateLimiter.acquireSlot.mockResolvedValueOnce({ allowed: false, reason: 'rate-limit' });

      await provider.record(buildInput());

      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockMetrics.incrementSystemErrorEventDrops).toHaveBeenCalledWith('rate-limit');
    });

    it('acquireSlot allowed=false reason=dedupe → INSERT 생략 + counter 증가', async () => {
      mockRateLimiter.acquireSlot.mockResolvedValueOnce({ allowed: false, reason: 'dedupe' });

      await provider.record(buildInput());

      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockMetrics.incrementSystemErrorEventDrops).toHaveBeenCalledWith('dedupe');
    });

    it('acquireSlot allowed=false reason=rate-limit-fallback → INSERT 생략 + counter 증가', async () => {
      mockRateLimiter.acquireSlot.mockResolvedValueOnce({
        allowed: false,
        reason: 'rate-limit-fallback',
      });

      await provider.record(buildInput());

      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockMetrics.incrementSystemErrorEventDrops).toHaveBeenCalledWith(
        'rate-limit-fallback'
      );
    });

    it('errorCode 100자 초과 시 truncate + errorcode-truncate counter 증가 (INSERT는 진행)', async () => {
      const longCode = 'A'.repeat(150);
      await provider.record({ ...buildInput(), errorCode: longCode });

      const insertedValues = mockDb.insert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertedValues.errorCode).toHaveLength(100);
      expect(mockMetrics.incrementSystemErrorEventDrops).toHaveBeenCalledWith('errorcode-truncate');
      // INSERT는 여전히 진행됨
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });
  });
});
