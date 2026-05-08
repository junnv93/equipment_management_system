import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../../../common/metrics/metrics.service';
import type {
  AsyncWorkBacklogProvider,
  AsyncWorkBacklogSnapshot,
} from '../../../common/system-health/contract';

/**
 * `pending-work-aggregate` strategy — 외부 큐(BullMQ 등) 미도입 환경 기본.
 *
 * MetricsCollector 가 주기적으로 갱신하는 prom-client gauge 두 개를 합산:
 *  - pendingApprovalsGauge (전체 카테고리 라벨 합)
 *  - activeCheckoutsGauge
 *
 * "actionable backlog" — 사용자 응답을 기다리는 비동기 작업의 양. BullMQ 도입 시 backend = 'bullmq' 로
 * 새 strategy 추가 (interface 만 같으면 dashboard.service 변경 불필요).
 */
@Injectable()
export class AsyncWorkBacklogProviderImpl implements AsyncWorkBacklogProvider {
  private readonly logger = new Logger(AsyncWorkBacklogProviderImpl.name);

  constructor(private readonly metricsService: MetricsService) {}

  async read(): Promise<AsyncWorkBacklogSnapshot> {
    try {
      const [pendingApprovals, activeCheckouts] = await Promise.all([
        this.metricsService.readPendingApprovalsTotal(),
        this.metricsService.readActiveCheckoutsTotal(),
      ]);
      return {
        queueSize: pendingApprovals + activeCheckouts,
        backend: 'pending-work-aggregate',
      };
    } catch (error) {
      this.logger.warn(
        `Async-work backlog read failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return { queueSize: 0, backend: 'pending-work-aggregate' };
    }
  }
}
