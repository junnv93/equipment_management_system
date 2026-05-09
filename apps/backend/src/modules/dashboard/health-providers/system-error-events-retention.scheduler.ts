import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lt } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';

const RETENTION_DAYS = 90;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * system_error_events 테이블 90일 보존 정책 스케줄러.
 *
 * 매일 UTC 자정에 `created_at < NOW() - 90 days` 행 일괄 삭제.
 * fire-and-forget — 예외 발생 시 logger.error 기록 후 cron 흐름 유지.
 */
@Injectable()
export class SystemErrorEventsRetentionScheduler {
  private readonly logger = new Logger(SystemErrorEventsRetentionScheduler.name);

  constructor(@Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    try {
      const deleted = await this.db
        .delete(schema.systemErrorEvents)
        .where(lt(schema.systemErrorEvents.createdAt, cutoff))
        .returning({ id: schema.systemErrorEvents.id });

      this.logger.log(
        `system_error_events retention cleanup: deleted ${deleted.length} rows (older than ${RETENTION_DAYS} days)`
      );
    } catch (error) {
      this.logger.error(
        'system_error_events retention cleanup failed',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
