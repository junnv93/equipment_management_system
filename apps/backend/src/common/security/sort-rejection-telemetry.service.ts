import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import type {
  SortRejectionEvent,
  SortRejectionTelemetry,
  SortRejectionRateLimiter,
} from './contract';
import { SORT_REJECTION_RATE_LIMITER } from './contract';

/**
 * SortRejectionTelemetryService — sort 필드 reject 이벤트 SIEM-friendly logger.
 *
 * 설계 결정 (시니어 표준):
 *  - **별도 DB 테이블 신설 회피**: system_error_events 는 5xx 전용 SSOT (의도 위반 금지).
 *    sort rejection 은 4xx (422) → Logger.warn 으로 충분. winston/pino/Sentry 가 표준 ingest.
 *  - **fire-and-forget**: recordSortRejection() 은 void — 어떤 logger/Redis 실패도 응답 흐름 차단 금지.
 *  - **Cluster-safe rate limit**: SortRejectionRateLimiter (Redis Lua atomic) 위임.
 *    단일 인스턴스 가정 제거 — PM2/K8s replicas 환경에서 분당 합산 60건 보장.
 *  - **PII deny-list 강제**: 호출자가 검증된 SortRejectionEvent 만 전달 — 본 service 는 PII 검증 안 함.
 *
 * Logger.warn 출력 형식 (SIEM 파싱 가능):
 *   `Sort field rejection: route=... method=... reason=... invalidValue=... userId=...`
 */
@Injectable()
export class SortRejectionTelemetryService implements SortRejectionTelemetry {
  private readonly logger = new Logger(SortRejectionTelemetryService.name);

  constructor(
    @Inject(SORT_REJECTION_RATE_LIMITER)
    private readonly rateLimiter: SortRejectionRateLimiter,
    @Optional()
    private readonly metricsService?: MetricsService
  ) {}

  recordSortRejection(event: SortRejectionEvent): void {
    void this.doRecord(event);
  }

  private async doRecord(event: SortRejectionEvent): Promise<void> {
    try {
      const { allowed, reason } = await this.rateLimiter.acquireSlot({
        invalidValue: event.invalidValue,
        normalizedRoute: event.normalizedRoute,
      });

      if (!allowed) {
        if (reason !== null) {
          this.metricsService?.incrementSortRejectionDrops(reason);
        }
        return;
      }

      this.logger.warn(
        `Sort field rejection: route=${event.normalizedRoute} method=${event.httpMethod} reason=${event.reason} invalidValue=${event.invalidValue} userId=${event.userId ?? 'anonymous'}`,
        {
          event: 'sort_rejection',
          reason: event.reason,
          route: event.normalizedRoute,
          httpMethod: event.httpMethod,
          invalidValue: event.invalidValue,
          userId: event.userId,
        }
      );

      this.metricsService?.observeSortRejection(event.normalizedRoute, event.reason);
    } catch (err: unknown) {
      // fire-and-forget — telemetry 자체 실패가 응답 흐름 차단 금지
      this.logger.error(
        `SortRejectionTelemetry record failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
