import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { count, gte, and, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { SentryErrorSink } from './sentry-error-sink';
import type {
  SystemErrorEventProvider,
  SystemErrorEventInput,
  SystemErrorEventCount,
  SystemHealthRateLimiter,
} from '../../../common/system-health/contract';
import { SYSTEM_HEALTH_RATE_LIMITER } from '../../../common/system-health/contract';

/**
 * DB column 한계 (varchar(100)) — record() 시 silent truncate 가드.
 * 마이그레이션 0055 이후 100자 → ErrorCode enum 최장 53자 + 47자 마진.
 * 향후 enum 이 100자를 초과하면 logger.warn 으로 표면화 (silent 데이터 유실 차단).
 */
const ERROR_CODE_MAX_LENGTH = 100;

/**
 * `system-error-events` 테이블 SSOT 기반 5xx 카운트 + 캡처.
 *
 * Rate limiting: Redis-backed cluster-aware (SystemHealthRedisRateLimiterService).
 * PM2 cluster / K8s replicas 환경에서도 분당 총 60건 보장.
 * Redis 미가용 시 in-memory fallback 자동 전환 — 응답 흐름 비차단.
 *
 * record() 는 fire-and-forget — caller 가 await 해도 어떤 예외도 throw 하지 않는다.
 */
@Injectable()
export class SystemErrorEventProviderImpl implements SystemErrorEventProvider {
  private readonly logger = new Logger(SystemErrorEventProviderImpl.name);
  private readonly fallbackEnabled: boolean;

  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly configService: ConfigService,
    @Inject(SYSTEM_HEALTH_RATE_LIMITER) private readonly rateLimiter: SystemHealthRateLimiter,
    private readonly metricsService: MetricsService,
    private readonly sentrySink: SentryErrorSink
  ) {
    const fallback = this.configService.get<string | undefined>('SYSTEM_HEALTH_ERROR_FALLBACK');
    this.fallbackEnabled = fallback === 'audit-proxy';
  }

  async count24h(): Promise<SystemErrorEventCount> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (this.fallbackEnabled) {
      const [row] = await this.db
        .select({ count: count() })
        .from(schema.auditLogs)
        .where(
          and(
            gte(schema.auditLogs.createdAt, twentyFourHoursAgo),
            inArray(schema.auditLogs.action, ['reject', 'cancel'])
          )
        );
      return {
        errorCount24h: row?.count ?? 0,
        source: 'audit-rejection-proxy',
      };
    }

    try {
      const [row] = await this.db
        .select({ count: count() })
        .from(schema.systemErrorEvents)
        .where(gte(schema.systemErrorEvents.createdAt, twentyFourHoursAgo));
      return {
        errorCount24h: row?.count ?? 0,
        source: 'system-error-events',
      };
    } catch (error) {
      this.logger.warn(
        `system_error_events count24h query failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return { errorCount24h: 0, source: 'system-error-events' };
    }
  }

  async record(event: SystemErrorEventInput): Promise<void> {
    // Rate limit + dedupe gate (Redis-backed, cluster-aware)
    const { allowed, reason } = await this.rateLimiter.acquireSlot(event);
    if (!allowed && reason !== null) {
      this.metricsService.incrementSystemErrorEventDrops(reason);
      return;
    }

    // Defensive truncate — DB varchar(100) 초과 시 silent INSERT 실패 차단.
    let safeErrorCode = event.errorCode;
    if (safeErrorCode.length > ERROR_CODE_MAX_LENGTH) {
      this.logger.warn(
        `errorCode length ${safeErrorCode.length} exceeds column limit ${ERROR_CODE_MAX_LENGTH} — truncating: ${safeErrorCode}`
      );
      safeErrorCode = safeErrorCode.slice(0, ERROR_CODE_MAX_LENGTH);
      this.metricsService.incrementSystemErrorEventDrops('errorcode-truncate');
    }

    try {
      await this.db.insert(schema.systemErrorEvents).values({
        errorCode: safeErrorCode,
        httpMethod: event.httpMethod,
        normalizedRoute: event.normalizedRoute,
        statusCode: event.statusCode,
        userId: event.userId,
        stackHash: event.stackHash,
        stackPreview: event.stackPreview,
      });
    } catch (error) {
      this.logger.error(
        `system_error_events INSERT failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    void this.sentrySink.emit(event).catch((error: unknown) => {
      this.logger.warn(
        `Sentry sink rejection swallowed: ${error instanceof Error ? error.message : String(error)}`
      );
    });
  }
}
