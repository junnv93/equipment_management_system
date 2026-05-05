import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemErrorEventProviderImpl } from '../system-error-event.provider';
import { SentryErrorSink } from '../sentry-error-sink';
import type { SystemErrorEventInput } from '../types';

describe('SystemErrorEventProviderImpl', () => {
  let provider: SystemErrorEventProviderImpl;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
  };
  let mockSentry: { emit: jest.Mock; isEnabled: jest.Mock };
  let mockConfig: { get: jest.Mock };

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

    mockDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        SystemErrorEventProviderImpl,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
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
          { provide: SentryErrorSink, useValue: mockSentry },
        ],
      }).compile();
      const fallbackProvider = fallbackModule.get(SystemErrorEventProviderImpl);

      const result = await fallbackProvider.count24h();
      expect(result.errorCount24h).toBe(11);
      expect(result.source).toBe('audit-rejection-proxy');
    });
  });

  describe('record()', () => {
    it('정상 경로 — db.insert 호출 + Sentry emit 호출 (no-op 가능)', async () => {
      await provider.record(buildInput());

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(mockSentry.emit).toHaveBeenCalledTimes(1);
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

  describe('record() — rate limiting + dedupe', () => {
    it('동일 (errorCode, normalizedRoute) 1분 이내 재호출 시 dedupe drop (insert 1회만)', async () => {
      const input = buildInput();
      await provider.record(input);
      await provider.record(input);
      await provider.record(input);

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('서로 다른 errorCode 는 dedupe 영향 받지 않음', async () => {
      await provider.record({ ...buildInput(), errorCode: 'A' });
      await provider.record({ ...buildInput(), errorCode: 'B' });
      await provider.record({ ...buildInput(), errorCode: 'C' });

      expect(mockDb.insert).toHaveBeenCalledTimes(3);
    });

    it('분당 INSERT 상한(60) 초과 시 sampling drop', async () => {
      const events = Array.from({ length: 70 }, (_, i) => ({
        ...buildInput(),
        errorCode: `E${i}`, // dedupe 회피를 위해 매번 다른 코드.
      }));

      for (const ev of events) await provider.record(ev);

      // 60건만 INSERT, 나머지 10건은 drop.
      expect(mockDb.insert).toHaveBeenCalledTimes(60);
    });

    it('window 회전 — 1분 경과 후 카운터 리셋되어 다시 60건 캡처 가능', async () => {
      const realNow = Date.now;
      const baseTime = realNow();
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(baseTime);

      try {
        // 1분 윈도우 내 60건 채움.
        for (let i = 0; i < 60; i++) {
          await provider.record({ ...buildInput(), errorCode: `A${i}` });
        }
        expect(mockDb.insert).toHaveBeenCalledTimes(60);

        // 추가 호출 → drop.
        await provider.record({ ...buildInput(), errorCode: 'A60' });
        expect(mockDb.insert).toHaveBeenCalledTimes(60);

        // 1분 + 1ms 경과 → 다음 호출에서 window 회전 + 카운터 리셋.
        dateNowSpy.mockReturnValue(baseTime + 60_001);
        for (let i = 0; i < 60; i++) {
          await provider.record({ ...buildInput(), errorCode: `B${i}` });
        }
        // 누적 INSERT = 60 (이전 분) + 60 (새 분) = 120.
        expect(mockDb.insert).toHaveBeenCalledTimes(120);
      } finally {
        dateNowSpy.mockRestore();
      }
    });

    it('errorCode 100자 초과 시 silent truncate + warn (DB INSERT 보호)', async () => {
      const longCode = 'A'.repeat(150);
      await provider.record({ ...buildInput(), errorCode: longCode });

      const insertedValues = mockDb.insert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertedValues.errorCode).toHaveLength(100);
      expect(insertedValues.errorCode).toBe('A'.repeat(100));
    });
  });
});
