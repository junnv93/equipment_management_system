import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import {
  HandoverTokenService,
  HANDOVER_TOKEN_TTL_SECONDS,
} from '../services/handover-token.service';

const TEST_SECRET = 'test-secret-at-least-32-characters-long-xxxxxx';

type RedisStore = Record<string, string>;

// ioredis 전체를 in-memory store + TTL 시뮬레이션으로 mock.
// 실제 Redis 필요 없이 jti 소비/만료/재사용 시나리오를 단위 테스트.
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store: RedisStore = {};
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: jest.fn((key: string, value: string, ..._args: any[]) => {
        // NX 플래그가 있든 없든 테스트에서는 key 존재 시 재설정만 방지
        if (store[key] !== undefined) return Promise.resolve(null);
        store[key] = value;
        return Promise.resolve('OK');
      }),
      get: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      del: jest.fn((key: string) => {
        if (store[key] === undefined) return Promise.resolve(0);
        delete store[key];
        return Promise.resolve(1);
      }),
    };
  });
});

jest.mock('../../../common/redis', () => ({
  resolveRedisConfig: jest.fn().mockReturnValue({
    host: 'localhost',
    port: 6379,
    keyPrefix: '',
  }),
  createRedisClient: jest.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis');
    return new Redis();
  }),
}));

describe('HandoverTokenService', () => {
  let service: HandoverTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandoverTokenService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(TEST_SECRET) },
        },
      ],
    }).compile();

    service = module.get(HandoverTokenService);
  });

  it('issues + verifies a token once (happy path)', async () => {
    const issued = await service.issue('checkout-uuid-1', 'user-1', 'borrower_receive');
    expect(issued.token).toBeTruthy();
    expect(issued.purpose).toBe('borrower_receive');
    expect(new Date(issued.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const verified = await service.verify(issued.token);
    expect(verified.checkoutId).toBe('checkout-uuid-1');
    expect(verified.purpose).toBe('borrower_receive');
  });

  it('rejects reuse of the same token with HANDOVER_TOKEN_CONSUMED', async () => {
    const issued = await service.issue('checkout-uuid-2', 'user-1', 'borrower_return');
    await service.verify(issued.token);

    await expect(service.verify(issued.token)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a tampered token with HANDOVER_TOKEN_INVALID', async () => {
    const issued = await service.issue('checkout-uuid-3', 'user-1', 'lender_receive');
    const tampered = issued.token.slice(0, -2) + 'xx';

    await expect(service.verify(tampered)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects gibberish with HANDOVER_TOKEN_INVALID', async () => {
    await expect(service.verify('not-a-jwt')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('exposes TTL constant matching 10 minutes', () => {
    expect(HANDOVER_TOKEN_TTL_SECONDS).toBe(600);
  });

  it('rejects an expired token with HANDOVER_TOKEN_EXPIRED', async () => {
    // Mock Date.now to simulate token issued in the past
    const originalNow = Date.now;
    const pastTime = originalNow() - (HANDOVER_TOKEN_TTL_SECONDS + 60) * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(pastTime);

    const issued = await service.issue('checkout-uuid-4', 'user-1', 'borrower_receive');

    // Restore Date.now — jwt.verify will now see the token as expired
    jest.spyOn(Date, 'now').mockReturnValue(originalNow());

    await expect(service.verify(issued.token)).rejects.toBeInstanceOf(UnauthorizedException);

    jest.restoreAllMocks();
  });
});
