import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { count, gte, and, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { SentryErrorSink } from './sentry-error-sink';
import type {
  SystemErrorEventProvider,
  SystemErrorEventInput,
  SystemErrorEventCount,
} from '../../../common/system-health/contract';

/**
 * Rate limiting — 5xx 폭주 시 DB INSERT 폭주 방지.
 *
 * 정상 운영에서 5xx 는 분당 ≤ 10건 수준. 무인지 환경에서 캐스케이딩 장애로 5xx 폭주 시 INSERT 가
 * downstream DB 자체에 부하를 가중시킬 위험이 있어 ring-buffer 기반 sampling 적용.
 *
 * 정책:
 *  - 분당 INSERT 상한 (`MAX_INSERTS_PER_MINUTE`) 초과 시 sampling drop (logger.warn 1회/분).
 *  - 동일 (errorCode, normalizedRoute) 조합은 분당 1회만 캡처 (deduplication).
 *
 * 단일 인스턴스 가정: in-memory state 는 NestJS singleton scope 한정.
 * PM2 cluster / K8s replicas 환경에서는 인스턴스별 분당 60건 → 운영 환경별 튜닝 필요
 * (tech-debt: cluster-aware Redis-backed rate limiter).
 */
const MAX_INSERTS_PER_MINUTE = 60;
const DEDUPE_WINDOW_MS = 60_000;

/**
 * DB column 한계 (varchar(100)) — record() 시 silent truncate 가드.
 * 마이그레이션 0055 이후 100자 → ErrorCode enum 최장 53자 + 47자 마진.
 * 향후 enum 이 100자를 초과하면 logger.warn 으로 표면화 (silent 데이터 유실 차단).
 */
const ERROR_CODE_MAX_LENGTH = 100;

/**
 * `system-error-events` 테이블 SSOT 기반 5xx 카운트 + 캡처.
 *
 * 환경 변수:
 *  - `SYSTEM_HEALTH_ERROR_FALLBACK=audit-proxy` 설정 시 audit_logs reject/cancel 합산을 fallback 으로 사용.
 *    기본값: off — `system-error-events` 테이블이 진실의 소스.
 *
 * record() 는 fire-and-forget — caller 가 await 해도 어떤 예외도 throw 하지 않는다 (응답 흐름 비차단).
 */
@Injectable()
export class SystemErrorEventProviderImpl implements SystemErrorEventProvider {
  private readonly logger = new Logger(SystemErrorEventProviderImpl.name);
  private readonly fallbackEnabled: boolean;

  /** 분 단위 INSERT 카운터 — windowStartMs 가 1분 밖으로 나가면 reset. */
  private currentMinuteWindowStart = Date.now();
  private currentMinuteInserts = 0;
  private rateLimitedDropsInWindow = 0;

  /** 최근 INSERT 한 (errorCode, normalizedRoute) 키와 timestamp — dedupe. */
  private recentDedupeKeys = new Map<string, number>();

  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly configService: ConfigService,
    private readonly sentrySink: SentryErrorSink
  ) {
    const fallback = this.configService.get<string | undefined>('SYSTEM_HEALTH_ERROR_FALLBACK');
    this.fallbackEnabled = fallback === 'audit-proxy';
  }

  async count24h(): Promise<SystemErrorEventCount> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (this.fallbackEnabled) {
      // legacy fallback — audit_logs reject/cancel 합산 (default off, 호환성 보전용).
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
    if (!this.shouldCapture(event)) {
      // sampling drop — 분당 첫 drop 시에만 warn, 그 이후는 누적 카운트만.
      this.rateLimitedDropsInWindow++;
      return;
    }

    // Defensive truncate — DB varchar(100) 초과 시 silent INSERT 실패 차단.
    let safeErrorCode = event.errorCode;
    if (safeErrorCode.length > ERROR_CODE_MAX_LENGTH) {
      this.logger.warn(
        `errorCode length ${safeErrorCode.length} exceeds column limit ${ERROR_CODE_MAX_LENGTH} — truncating: ${safeErrorCode}`
      );
      safeErrorCode = safeErrorCode.slice(0, ERROR_CODE_MAX_LENGTH);
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
      // fire-and-forget — DB 자체 장애 시에도 응답 흐름 차단 금지.
      this.logger.error(
        `system_error_events INSERT failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Sentry 옵션 sink — fire-and-forget. emit 내부 catch 외에 추가 unhandled rejection 가드.
    void this.sentrySink.emit(event).catch((error: unknown) => {
      this.logger.warn(
        `Sentry sink rejection swallowed: ${error instanceof Error ? error.message : String(error)}`
      );
    });
  }

  /**
   * Rate-limit + dedupe gate.
   * - 분 윈도우 외 → 카운터 리셋 + drop 누적 1회 warn 후 0 으로.
   * - 분 윈도우 내 INSERT 한도 초과 → false (drop).
   * - 동일 (errorCode, normalizedRoute) 가 1분 이내 재발 → false (dedupe drop).
   * - 그 외 → 카운터 증가 + dedupe 키 등록 + true.
   */
  private shouldCapture(event: SystemErrorEventInput): boolean {
    const now = Date.now();

    // Window 회전.
    if (now - this.currentMinuteWindowStart >= 60_000) {
      if (this.rateLimitedDropsInWindow > 0) {
        this.logger.warn(
          `system_error_events rate-limit drop: ${this.rateLimitedDropsInWindow} events sampled out in last minute`
        );
      }
      this.currentMinuteWindowStart = now;
      this.currentMinuteInserts = 0;
      this.rateLimitedDropsInWindow = 0;
    }

    // dedupe — Map 크기 제한 (메모리 누수 방지).
    const dedupeKey = `${event.errorCode}::${event.normalizedRoute}`;
    const lastSeen = this.recentDedupeKeys.get(dedupeKey);
    if (lastSeen !== undefined && now - lastSeen < DEDUPE_WINDOW_MS) {
      return false;
    }

    // 분 한도 초과.
    if (this.currentMinuteInserts >= MAX_INSERTS_PER_MINUTE) {
      return false;
    }

    this.currentMinuteInserts++;
    this.recentDedupeKeys.set(dedupeKey, now);

    // dedupe Map 정리 — 1분 이상 된 키 제거. 매 호출마다 가벼운 sweep.
    if (this.recentDedupeKeys.size > 200) {
      for (const [key, ts] of this.recentDedupeKeys) {
        if (now - ts >= DEDUPE_WINDOW_MS) {
          this.recentDedupeKeys.delete(key);
        }
      }
    }

    return true;
  }
}
