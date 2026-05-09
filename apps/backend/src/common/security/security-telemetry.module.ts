import { Global, Module } from '@nestjs/common';
import { SortRejectionTelemetryService } from './sort-rejection-telemetry.service';
import { SORT_REJECTION_TELEMETRY } from './contract';

/**
 * SecurityTelemetryModule — sort enum reject 등 보안 의심 이벤트 telemetry 인프라.
 *
 * @Global() 이유:
 *  - GlobalExceptionFilter (APP_FILTER) 가 inject — DI 그래프 상 어디서든 접근 가능해야 함.
 *  - system-health Module 은 Dashboard 한정 scope 라 @Global() 미적용 — 본 모듈은 다름.
 *
 * 등록 위치: AppModule imports — common 인프라 우선 등록.
 */
@Global()
@Module({
  providers: [
    SortRejectionTelemetryService,
    { provide: SORT_REJECTION_TELEMETRY, useExisting: SortRejectionTelemetryService },
  ],
  exports: [SORT_REJECTION_TELEMETRY],
})
export class SecurityTelemetryModule {}
