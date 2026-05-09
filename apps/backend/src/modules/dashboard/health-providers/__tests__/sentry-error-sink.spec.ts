import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryErrorSink } from '../sentry-error-sink';
import type { SystemErrorEventInput } from '../../../../common/system-health/contract';

const mockSentryInit = jest.fn();
const mockSentryCaptureException = jest.fn();

jest.mock('@sentry/node', () => ({
  init: (...args: unknown[]) => mockSentryInit(...args),
  captureException: (...args: unknown[]) => mockSentryCaptureException(...args),
}));

describe('SentryErrorSink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildInput(): SystemErrorEventInput {
    return {
      errorCode: 'InternalServerError',
      httpMethod: 'POST',
      normalizedRoute: '/api/equipment/:id',
      statusCode: 500,
      userId: null,
      stackHash: 'abc123hash',
      stackPreview: null,
    };
  }

  async function buildSink(
    envOverrides: Record<string, string | undefined> = {}
  ): Promise<SentryErrorSink> {
    const env: Record<string, string | undefined> = {
      SENTRY_DSN: undefined,
      SENTRY_ENVIRONMENT: undefined,
      SENTRY_RELEASE: undefined,
      ...envOverrides,
    };
    const mockConfig = { get: jest.fn((key: string) => env[key]) };
    const module = await Test.createTestingModule({
      providers: [SentryErrorSink, { provide: ConfigService, useValue: mockConfig }],
    }).compile();
    return module.get(SentryErrorSink);
  }

  it('SENTRY_DSN 미설정 → Sentry.init 미호출 + isEnabled()===false + emit() no-op', async () => {
    const sink = await buildSink({ SENTRY_DSN: undefined });

    expect(mockSentryInit).not.toHaveBeenCalled();
    expect(sink.isEnabled()).toBe(false);
    await expect(sink.emit(buildInput())).resolves.toBeUndefined();
    expect(mockSentryCaptureException).not.toHaveBeenCalled();
  });

  it('SENTRY_DSN 빈 문자열 → enabled=false (falsy DSN 처리)', async () => {
    const sink = await buildSink({ SENTRY_DSN: '' });

    expect(sink.isEnabled()).toBe(false);
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it('SENTRY_DSN 설정 → Sentry.init 가 dsn 포함 객체로 호출됨 + isEnabled()===true', async () => {
    const sink = await buildSink({ SENTRY_DSN: 'https://test@sentry.io/1' });

    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://test@sentry.io/1' })
    );
    expect(sink.isEnabled()).toBe(true);
  });

  it('SENTRY_DSN 설정 + emit(input) → Sentry.captureException 이 Error + 올바른 hint 로 호출됨', async () => {
    const sink = await buildSink({ SENTRY_DSN: 'https://test@sentry.io/1' });
    const input = buildInput();
    await sink.emit(input);

    expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    const [errorArg, hintArg] = mockSentryCaptureException.mock.calls[0] as [
      Error,
      { tags: Record<string, string>; extra: Record<string, unknown> },
    ];

    // Error 객체: name=errorCode, message=httpMethod+route
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.name).toBe(input.errorCode);
    expect(errorArg.message).toContain(input.httpMethod);
    expect(errorArg.message).toContain(input.normalizedRoute);

    // hint tags: errorCode 포함 + httpMethod/route/statusCode
    expect(hintArg.tags).toEqual(
      expect.objectContaining({
        errorCode: input.errorCode,
        httpMethod: input.httpMethod,
        normalizedRoute: input.normalizedRoute,
        statusCode: String(input.statusCode),
      })
    );
    // extra: stackHash/stackPreview
    expect(hintArg.extra).toEqual(
      expect.objectContaining({
        stackHash: input.stackHash,
        stackPreview: input.stackPreview,
      })
    );
  });

  it('SENTRY_ENVIRONMENT + SENTRY_RELEASE 설정 시 Sentry.init 옵션에 포함됨 (S-1)', async () => {
    const sink = await buildSink({
      SENTRY_DSN: 'https://test@sentry.io/1',
      SENTRY_ENVIRONMENT: 'production',
      SENTRY_RELEASE: 'v1.2.3',
    });

    expect(sink.isEnabled()).toBe(true);
    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/1',
        environment: 'production',
        release: 'v1.2.3',
      })
    );
  });
});
