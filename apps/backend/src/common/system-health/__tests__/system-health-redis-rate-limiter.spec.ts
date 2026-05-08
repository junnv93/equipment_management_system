import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemHealthRedisRateLimiterService } from '../system-health-redis-rate-limiter.service';
import * as redisFactory from '../../redis/create-redis-client';

/** Redis client 전체를 mock으로 교체 */
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

describe('SystemHealthRedisRateLimiterService', () => {
  let service: SystemHealthRedisRateLimiterService;
  let mockRedis: ReturnType<typeof makeMockRedisClient>;

  beforeEach(async () => {
    mockRedis = makeMockRedisClient();
    // createRedisClient 팩토리를 spy — service 생성자가 호출
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
        SystemHealthRedisRateLimiterService,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    service = module.get(SystemHealthRedisRateLimiterService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const event = { errorCode: 'InternalServerError', normalizedRoute: '/api/equipment/:id' };

  describe('정상 경로 — Redis 응답 가능', () => {
    it('SET NX 성공 + INCR ≤ 60 → allowed=true', async () => {
      mockRedis.set.mockResolvedValue('OK'); // dedupe 통과
      mockRedis.eval.mockResolvedValue(1); // rate-limit count=1

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('dedupe: SET NX 실패 (null) → allowed=false reason=dedupe', async () => {
      mockRedis.set.mockResolvedValue(null); // 이미 존재하는 dedupe 키

      const result = await service.acquireSlot(event);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('dedupe');
      // rate-limit eval 호출 없음 — dedupe에서 early-return
      expect(mockRedis.eval).not.toHaveBeenCalled();
    });

    it('rate-limit: INCR > 60 → allowed=false reason=rate-limit', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockResolvedValue(61); // 분당 상한 초과

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
  });

  describe('graceful degradation — Redis 장애', () => {
    it('Redis set 실패 → in-memory fallback, allowed=true (첫 호출)', async () => {
      mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.acquireSlot(event);

      // fallback에서 첫 호출은 허용
      expect(result.allowed).toBe(true);
      // reason은 null (fallback에서 허용된 경우)
      expect(result.reason).toBeNull();
    });

    it('Redis eval 실패 → in-memory fallback, 두 번째 동일 event는 rate-limit-fallback', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.eval.mockRejectedValue(new Error('Redis EVAL error'));

      // 첫 호출 (fallback 허용)
      const first = await service.acquireSlot(event);
      expect(first.allowed).toBe(true);

      // 두 번째 동일 event: fallback dedupe → drop (rate-limit-fallback)
      const second = await service.acquireSlot(event);
      expect(second.allowed).toBe(false);
      expect(second.reason).toBe('rate-limit-fallback');
    });

    it('Redis 장애 + fallback 60건 초과 → rate-limit-fallback', async () => {
      mockRedis.set.mockRejectedValue(new Error('ECONNREFUSED'));

      // 각각 다른 errorCode로 fallback 60건 소진
      for (let i = 0; i < 60; i++) {
        await service.acquireSlot({ errorCode: `E${i}`, normalizedRoute: '/api/test' });
      }

      // 61번째: rate-limit-fallback
      const result = await service.acquireSlot({
        errorCode: 'E_overflow',
        normalizedRoute: '/api/test',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate-limit-fallback');
    });
  });

  describe('lifecycle', () => {
    it('onModuleDestroy 호출 시 Redis client.quit() 실행', async () => {
      await service.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalledTimes(1);
    });
  });
});
