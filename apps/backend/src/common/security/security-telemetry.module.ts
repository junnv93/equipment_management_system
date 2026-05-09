import { Global, Module } from '@nestjs/common';
import { SortRejectionTelemetryService } from './sort-rejection-telemetry.service';
import { SortRejectionRedisRateLimiterService } from './sort-rejection-redis-rate-limiter.service';
import { SORT_REJECTION_TELEMETRY, SORT_REJECTION_RATE_LIMITER } from './contract';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * SecurityTelemetryModule — sort enum reject 등 보안 의심 이벤트 telemetry 인프라.
 *
 * @Global() 이유:
 *  - GlobalExceptionFilter (APP_FILTER) 가 inject — DI 그래프 상 어디서든 접근 가능해야 함.
 *
 * imports MetricsModule:
 *  - SortRejectionTelemetryService 가 @Optional() MetricsService inject — Prometheus counter 증가.
 *  - MetricsModule 은 @Global 아님 → 명시적 import 필요.
 *
 * 등록 위치: AppModule imports — common 인프라 우선 등록.
 */
@Global()
@Module({
  imports: [MetricsModule],
  providers: [
    SortRejectionRedisRateLimiterService,
    { provide: SORT_REJECTION_RATE_LIMITER, useExisting: SortRejectionRedisRateLimiterService },
    SortRejectionTelemetryService,
    { provide: SORT_REJECTION_TELEMETRY, useExisting: SortRejectionTelemetryService },
  ],
  exports: [SORT_REJECTION_TELEMETRY],
})
export class SecurityTelemetryModule {}
