import { Module, Global } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DrizzleModule } from '../../database/drizzle.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { MetricsModule } from '../../common/metrics/metrics.module';
import { SystemHealthModule } from '../../common/system-health/system-health.module';
import {
  STORAGE_HEALTH_PROVIDER,
  ASYNC_WORK_BACKLOG_PROVIDER,
  SYSTEM_ERROR_EVENT_PROVIDER,
} from '../../common/system-health/contract';
import { StorageHealthProviderImpl } from './health-providers/storage-health.provider';
import { AsyncWorkBacklogProviderImpl } from './health-providers/async-work-backlog.provider';
import { SystemErrorEventProviderImpl } from './health-providers/system-error-event.provider';
import { SentryErrorSink } from './health-providers/sentry-error-sink';

/**
 * 대시보드 모듈
 *
 * 역할별 맞춤형 대시보드 데이터 + 시스템 상태 (`getSystemHealth`) 를 제공합니다.
 *
 * SystemHealthProvider 컨트랙트 (`health-providers/`) 는 GlobalExceptionFilter (5xx 캡처) 가 사용하므로
 * `@Global()` 로 등록하여 어떤 모듈에서든 토큰 주입이 가능하게 한다 — APP_FILTER DI 그래프 회피.
 */
@Global()
@Module({
  imports: [DrizzleModule, ApprovalsModule, MonitoringModule, MetricsModule, SystemHealthModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    SentryErrorSink,
    StorageHealthProviderImpl,
    AsyncWorkBacklogProviderImpl,
    SystemErrorEventProviderImpl,
    { provide: STORAGE_HEALTH_PROVIDER, useExisting: StorageHealthProviderImpl },
    { provide: ASYNC_WORK_BACKLOG_PROVIDER, useExisting: AsyncWorkBacklogProviderImpl },
    { provide: SYSTEM_ERROR_EVENT_PROVIDER, useExisting: SystemErrorEventProviderImpl },
  ],
  exports: [
    DashboardService,
    STORAGE_HEALTH_PROVIDER,
    ASYNC_WORK_BACKLOG_PROVIDER,
    SYSTEM_ERROR_EVENT_PROVIDER,
  ],
})
export class DashboardModule {}
