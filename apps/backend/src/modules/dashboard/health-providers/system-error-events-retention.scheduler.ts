import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';

const RETENTION_DAYS_DEFAULT = 90;

/**
 * system_error_events 테이블 보존 정책 스케줄러.
 *
 * 매일 UTC 자정에 `created_at < NOW() - RETENTION_DAYS` 행 일괄 삭제.
 * 보존 기간: `SYSTEM_ERROR_EVENTS_RETENTION_DAYS` env (기본 90일).
 * fire-and-forget — 예외 발생 시 logger.error 기록 후 cron 흐름 유지.
 * DELETE rowCount 직접 수집 (행 materialization 없음).
 */
@Injectable()
export class SystemErrorEventsRetentionScheduler {
  private readonly logger = new Logger(SystemErrorEventsRetentionScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly configService: ConfigService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    const retentionDays = this.resolveRetentionDays();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - retentionMs);

    try {
      const result = await this.db.execute(
        sql`DELETE FROM system_error_events WHERE created_at < ${cutoff}`
      );
      const count = result.rowCount ?? 0;
      this.logger.log(
        `system_error_events retention cleanup: deleted ${count} rows (older than ${retentionDays} days)`
      );
    } catch (error) {
      this.logger.error(
        'system_error_events retention cleanup failed',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  private resolveRetentionDays(): number {
    const raw = this.configService.get<string | undefined>('SYSTEM_ERROR_EVENTS_RETENTION_DAYS');
    if (!raw) return RETENTION_DAYS_DEFAULT;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : RETENTION_DAYS_DEFAULT;
  }
}
