import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsCollector } from './metrics.collector';
import { DrizzleModule } from '../../database/drizzle.module';

/**
 * MetricsModule — 관측가능성 파이프라인
 *
 * 아키텍처:
 *   MetricsCollector (스케줄러, 30s)
 *     ↓ DB 집계 쿼리 (COUNT)
 *   MetricsService (Gauge 업데이트)
 *     ↓ Prometheus 스크래핑
 *   MetricsController (GET /api/metrics)
 *     ↓ text/plain (Prometheus 형식)
 *   Prometheus → Grafana → Alertmanager → Slack
 *
 * 주의: ScheduleModule.forRoot()는 AppModule에서만 호출.
 * 여기서 재import 불필요 — @Cron 데코레이터는 루트에서 초기화된 스케줄러 사용.
 */
@Module({
  imports: [
    DrizzleModule, // DB 직접 접근 (MetricsCollector용)
    // ScheduleModule은 AppModule.forRoot()에서 이미 초기화됨
  ],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsCollector],
  exports: [MetricsService],
})
export class MetricsModule {}
