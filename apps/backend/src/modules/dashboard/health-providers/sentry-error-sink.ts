import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SystemErrorEventInput } from '../../../common/system-health/contract';

/**
 * 옵션 Sentry sink. SENTRY_DSN 미설정 또는 `@sentry/node` 의존성 미설치 시 no-op.
 *
 * 자체 호스팅 SSOT 는 system_error_events 테이블이며, Sentry 는 alert/triage 용 외부 sink.
 * `@sentry/node` 는 `package.json` 에 추가하지 않는다 — 운영자가 DSN + 의존성 직접 설치 시에만 활성화.
 *
 * 미설치 환경에서 dynamic import 실패는 1 회 logger.warn 후 영구 비활성화 (재시도 없음).
 */
@Injectable()
export class SentryErrorSink {
  private readonly logger = new Logger(SentryErrorSink.name);
  private enabled: boolean;
  private sentryClient: { captureMessage: (msg: string, extra: object) => void } | null = null;
  private dependencyMissingWarned = false;

  constructor(private readonly configService: ConfigService) {
    const dsn = this.configService.get<string | undefined>('SENTRY_DSN');
    this.enabled = typeof dsn === 'string' && dsn.length > 0;
    if (this.enabled) {
      void this.lazyLoadSentry(dsn as string);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async emit(event: SystemErrorEventInput): Promise<void> {
    if (!this.enabled || !this.sentryClient) return;
    try {
      this.sentryClient.captureMessage(`SystemErrorEvent: ${event.errorCode}`, {
        level: 'error',
        tags: {
          httpMethod: event.httpMethod,
          normalizedRoute: event.normalizedRoute,
          statusCode: String(event.statusCode),
        },
        extra: {
          stackHash: event.stackHash,
          // stackPreview 는 development 한정으로만 채워지며, production 에선 null.
          stackPreview: event.stackPreview,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Sentry emit failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async lazyLoadSentry(dsn: string): Promise<void> {
    try {
      // dynamic import — `@sentry/node` 미설치 환경에서 정적 의존 회피.
      // 의도적으로 webpack/ts 가 정적 분석하지 못하게 string variable 경유.
      const moduleName = '@sentry/node';
      const sentry = (await import(moduleName)) as {
        init: (opts: { dsn: string }) => void;
        captureMessage: (msg: string, extra: object) => void;
      };
      sentry.init({ dsn });
      this.sentryClient = { captureMessage: sentry.captureMessage };
      this.logger.log('Sentry sink initialized.');
    } catch (error) {
      if (!this.dependencyMissingWarned) {
        this.logger.warn(
          `Sentry sink disabled — '@sentry/node' not installed or import failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        this.dependencyMissingWarned = true;
      }
      this.enabled = false;
    }
  }
}
