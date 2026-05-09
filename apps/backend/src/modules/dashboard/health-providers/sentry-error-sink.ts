import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import type { SystemErrorEventInput } from '../../../common/system-health/contract';

/**
 * Sentry sink. SENTRY_DSN 미설정 시 no-op.
 *
 * 자체 호스팅 SSOT 는 system_error_events 테이블이며, Sentry 는 alert/triage 용 외부 sink.
 * `@sentry/node` 는 정식 의존성 (`apps/backend/package.json`) — 설치 없이 DSN 미설정 만으로 비활성화.
 */
@Injectable()
export class SentryErrorSink {
  private readonly logger = new Logger(SentryErrorSink.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const dsn = this.configService.get<string | undefined>('SENTRY_DSN');
    if (!dsn) {
      this.enabled = false;
      return;
    }

    const environment = this.configService.get<string | undefined>('SENTRY_ENVIRONMENT');
    const release = this.configService.get<string | undefined>('SENTRY_RELEASE');

    try {
      Sentry.init({
        dsn,
        ...(environment !== undefined && { environment }),
        ...(release !== undefined && { release }),
      });
      this.enabled = true;
      this.logger.log('Sentry sink initialized.');
    } catch (error) {
      this.logger.warn(
        `Sentry init 실패 — sink 비활성화: ${error instanceof Error ? error.message : String(error)}`
      );
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async emit(event: SystemErrorEventInput): Promise<void> {
    if (!this.enabled) return;
    try {
      // captureException: errorCode 기반 fingerprint 그루핑 (captureMessage는 메시지 문자열 기반으로 그루핑 불정확)
      const err = new Error(`${event.httpMethod} ${event.normalizedRoute}`);
      err.name = event.errorCode;
      Sentry.captureException(err, {
        tags: {
          errorCode: event.errorCode,
          httpMethod: event.httpMethod,
          normalizedRoute: event.normalizedRoute,
          statusCode: String(event.statusCode),
        },
        extra: {
          stackHash: event.stackHash,
          stackPreview: event.stackPreview,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Sentry emit 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
