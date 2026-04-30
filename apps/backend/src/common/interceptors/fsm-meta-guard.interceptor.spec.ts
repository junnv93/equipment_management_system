import { of } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { FsmMetaGuardInterceptor } from './fsm-meta-guard.interceptor';

function makeCtx(url = '/api/checkouts'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(data: unknown): CallHandler {
  return { handle: () => of(data) };
}

describe('FsmMetaGuardInterceptor', () => {
  let interceptor: FsmMetaGuardInterceptor;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new FsmMetaGuardInterceptor();
    warnSpy = jest.spyOn(interceptor['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('meta 누락 단건 → Logger.warn 1회 + payload 그대로 통과', (done) => {
    const checkout = { id: 'c-1', status: 'pending' }; // meta 없음

    interceptor.intercept(makeCtx(), makeHandler(checkout)).subscribe({
      next: (val) => {
        expect(val).toBe(checkout);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('meta_field_missing'));
        done();
      },
      error: (err: unknown) => done(err),
    });
  });

  it('nextStep schema 불일치 → Logger.warn 1회 (invalid_nextStep)', (done) => {
    const checkout = {
      id: 'c-2',
      status: 'pending',
      meta: {
        availableActions: [],
        nextStep: { label: 123, invalidField: true }, // 스키마 불일치
      },
    };

    interceptor.intercept(makeCtx(), makeHandler(checkout)).subscribe({
      next: () => {
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid_nextStep'));
        done();
      },
      error: (err: unknown) => done(err),
    });
  });

  it('정상 payload (availableActions·nextStep 모두 없는 meta) → Logger.warn 0회', (done) => {
    // meta 객체는 있지만 availableActions·nextStep 키 자체 없음 → partial_meta/invalid 검사 비해당
    const checkout = {
      id: 'c-3',
      status: 'pending',
      meta: { calculatedAt: '2026-01-01' },
    };

    interceptor.intercept(makeCtx(), makeHandler(checkout)).subscribe({
      next: () => {
        expect(warnSpy).not.toHaveBeenCalled();
        done();
      },
      error: (err: unknown) => done(err),
    });
  });
});
