import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type {
  AsyncWorkBacklogProvider,
  AsyncWorkBacklogSnapshot,
} from '../../../common/system-health/contract';

/**
 * BullMQ 기반 async-work backlog 전략.
 *
 * `ASYNC_WORK_QUEUE_NAMES` env (콤마 구분) 로 감시할 큐 이름 목록을 지정.
 * 각 Queue 의 `getJobCounts('waiting','active','delayed')` 를 합산하여 backlog 총량 반환.
 *
 * Redis 연결 정보: `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` (cache/rate-limiter 와 동일 인스턴스).
 * `QUEUE_STRATEGY=bullmq` 설정 시 `DashboardModule.useFactory` 가 본 provider 를 선택.
 *
 * - `ASYNC_WORK_QUEUE_NAMES` 미설정 → 큐 0개 → queueSize: 0 graceful
 * - Redis 연결 실패 / getJobCounts 오류 → logger.warn + queueSize: 0 graceful (throw 없음)
 */
@Injectable()
export class BullmqBacklogProviderImpl
  implements AsyncWorkBacklogProvider, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BullmqBacklogProviderImpl.name);
  private queues: Queue[] = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const namesRaw = this.configService.get<string | undefined>('ASYNC_WORK_QUEUE_NAMES');
    if (!namesRaw) return;

    const names = namesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const connection = {
      host: this.configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.configService.get<number>('REDIS_PORT') ?? 6379,
      password: this.configService.get<string | undefined>('REDIS_PASSWORD'),
    };

    this.queues = names
      .map((name) => {
        try {
          return new Queue(name, { connection });
        } catch (error) {
          this.logger.warn(
            `BullMQ Queue '${name}' 초기화 실패: ${error instanceof Error ? error.message : String(error)}`
          );
          return null as unknown as Queue;
        }
      })
      .filter((q): q is Queue => q !== null);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.queues.map((q) => q.close().catch(() => undefined)));
    this.queues = [];
  }

  async read(): Promise<AsyncWorkBacklogSnapshot> {
    if (this.queues.length === 0) {
      return { queueSize: 0, backend: 'bullmq' };
    }

    try {
      const counts = await Promise.all(
        this.queues.map((q) => q.getJobCounts('waiting', 'active', 'delayed'))
      );
      const queueSize = counts.reduce(
        (sum, c) => sum + (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0),
        0
      );
      return { queueSize, backend: 'bullmq' };
    } catch (error) {
      this.logger.warn(
        `BullMQ backlog read 실패: ${error instanceof Error ? error.message : String(error)}`
      );
      return { queueSize: 0, backend: 'bullmq' };
    }
  }
}
