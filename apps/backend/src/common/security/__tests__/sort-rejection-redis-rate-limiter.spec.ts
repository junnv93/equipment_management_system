import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SortRejectionRedisRateLimiterService } from '../sort-rejection-redis-rate-limiter.service';
import * as redisFactory from '../../redis/create-redis-client';

function makeMockRedisClient(
  overrides?: Partial<{
    set: jest.Mock;
    eval: jest.Mock;
    quit: jest.Mock;
  }>
) {
  const mock = {
    set: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  return { ...mock, ...overrides };
}

describe('SortRejectionRedisRateLimiterService', () => {
  let service: SortRejectionRedisRateLimiterService;
  let mockRedis: ReturnType<typeof makeMockRedisClient>;

  beforeEach(async () => {
    mockRedis = makeMockRedisClient();
    jest.spyOn(redisFactory, 'createRedisClient').mockReturnValue(mockRedis as never);
    jest.spyOn(redisFactory, 'resolveRedisConfig').mockReturnValue({
      host: 'localhost',
      port: 6379,
      tlsEnabled: false,
      tlsRejectUnauthorized: true,
      maxRetries: 0,
    });

    const module = await Test.createTestingModule({
      providers: [
        SortRejectionRedisRateLimiterService,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    service = module.get(SortRejectionRedisRateLimiterService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const event = { invalidValue: '; DROP TABLE--', normalizedRoute: '/equipment' };

  describe('정상 경로 — Redis 응답 가능', () => {
    it('SET NX 성공 + INCR ≤ 60 → allowed=true, reason=null', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(1);

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('dedupe: SET NX 실패 (null) → allowed=false, reason=dedupe', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('dedupe');
      // rate-limit eval 호출 없음 — dedupe에서 early-return
      expect(mockRedis.eval).not.toHaveBeenCalled();
    });

    it('rate-limit: INCR > 60 → allowed=false, reason=rate-limit', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(61);

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate-limit');
    });

    it('INCR = 60 (경계값) → allowed=true (상한 이하)', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(60);

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(true);
    });

    it('Redis key prefix가 sr: 로 시작 — system-health sh: 와 분리', async () => {
      await service.acquireSlot(event);

      // dedupe key: sr:dedupe:...
      const setCall = mockRedis.set.mock.calls[0] as string[];
      expect(setCall[0]).toMatch(/^sr:dedupe:/);

      // rate key: sr:rl:counter:...
      const evalCall = mockRedis.eval.mock.calls[0] as unknown[];
      expect(evalCall[2]).toMatch(/^sr:rl:counter:/);
    });
  });

  describe('graceful degradation — Redis 장애', () => {
    it('Redis set 실패 → in-memory fallback, 첫 호출 allowed=true', async () => {
      mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('Redis eval 실패 → in-memory fallback, 두 번째 동일 event → dedupe (rate-limit-fallback)', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockRejectedValue(new Error('Redis EVAL error'));

      const first = await service.acquireSlot(event);
      expect(first.allowed).toBe(true);

      const second = await service.acquireSlot(event);
      expect(second.allowed).toBe(false);
      expect(second.reason).toBe('rate-limit-fallback');
    });

    it('Redis 장애 + fallback 60건 초과 → rate-limit-fallback', async () => {
      mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));

      for (let i = 0; i < 60; i++) {
        await service.acquireSlot({ invalidValue: `attempt-${i}`, normalizedRoute: '/equipment' });
      }

      const result = await service.acquireSlot({
        invalidValue: 'attempt-60',
        normalizedRoute: '/equipment',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate-limit-fallback');
    });
  });

  describe('invalidValue 길이 보호 — 200자 cap', () => {
    it('200자 초과 invalidValue 도 Redis key 에 200자만 사용', async () => {
      const longValue = 'A'.repeat(300);
      await service.acquireSlot({ invalidValue: longValue, normalizedRoute: '/equipment' });

      const setKey = (mockRedis.set.mock.calls[0] as string[])[0];
      // sr:dedupe:/equipment::AAAA...200자 → key 내 value 부분이 200자 이하
      const valuePart = setKey.split('::')[1];
      expect(valuePart.length).toBeLessThanOrEqual(200);
    });
  });

  describe('lifecycle', () => {
    it('onModuleDestroy 호출 시 Redis client.quit() 실행', async () => {
      await service.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalledTimes(1);
    });
  });
});
