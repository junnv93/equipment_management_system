import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryErrorSink } from '../sentry-error-sink';
import type { SystemErrorEventInput } from '../types';

describe('SentryErrorSink', () => {
  function buildInput(): SystemErrorEventInput {
    return {
      errorCode: 'InternalServerError',
      httpMethod: 'POST',
      normalizedRoute: '/api/equipment/:id',
      statusCode: 500,
      userId: null,
      stackHash: 'hashx',
      stackPreview: null,
    };
  }

  async function buildSink(dsn?: string): Promise<SentryErrorSink> {
    const mockConfig = {
      get: jest.fn((key: string) => (key === 'SENTRY_DSN' ? dsn : undefined)),
    };
    const module = await Test.createTestingModule({
      providers: [SentryErrorSink, { provide: ConfigService, useValue: mockConfig }],
    }).compile();
    return module.get(SentryErrorSink);
  }

  it('SENTRY_DSN 미설정 시 enabled=false + emit no-op', async () => {
    const sink = await buildSink(undefined);
    expect(sink.isEnabled()).toBe(false);
    await expect(sink.emit(buildInput())).resolves.toBeUndefined();
  });

  it('SENTRY_DSN 빈 문자열 시 enabled=false', async () => {
    const sink = await buildSink('');
    expect(sink.isEnabled()).toBe(false);
  });

  it('SENTRY_DSN 설정 + @sentry/node 미설치 시 영구 비활성화 (1 회 warn 후 emit no-op)', async () => {
    // dynamic import 가 실패하는 환경 — 의존성이 실제로 없으므로 내부 catch 블록 진입.
    const sink = await buildSink('https://test@sentry.io/1');

    // 비동기 lazy load 가 끝날 때까지 기다린다.
    await new Promise((resolve) => setImmediate(resolve));

    // 의존성이 없으므로 emit 호출은 throw 없이 no-op.
    await expect(sink.emit(buildInput())).resolves.toBeUndefined();
  });
});
