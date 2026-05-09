import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient, resolveRedisConfig } from '../redis';
import { RATE_LIMIT_LUA } from '../system-health/system-health-rate-limiter.lua';
import type {
  SortRejectionRateLimiter,
  SortRejectionDropReason,
  SortRejectionEvent,
} from './contract';

const MAX_LOGS_PER_MINUTE = 60;
const DEDUPE_WINDOW_SEC = 60;
const RATE_LIMIT_KEY_PREFIX = 'sr:rl:counter';
const DEDUPE_KEY_PREFIX = 'sr:dedupe';

/**
 * Redis-backed cluster-aware rate limiter for sort rejection telemetry.
 *
 * 클러스터 안전성: Redis EVAL(Lua) atomic INCR + EXPIRE.
 * PM2 cluster / K8s replicas 환경에서 인스턴스 합산 분당 MAX_LOGS_PER_MINUTE 보장.
 *
 * Graceful degradation: Redis 호출 실패 → in-memory fallback 자동 전환.
 * fallback 빈도는 'rate-limit-fallback' Prometheus reason 으로 표면화.
 *
 * Key space: 'sr:' prefix — system-health 'sh:' 와 충돌 없음.
 */
@Injectable()
export class SortRejectionRedisRateLimiterService
  implements SortRejectionRateLimiter, OnModuleDestroy
{
  private readonly logger = new Logger(SortRejectionRedisRateLimiterService.name);
  private readonly client: Redis;

  // In-memory fallback state (Redis 미가용 시 사용)
  private fallbackWindowStart = Date.now();
  private fallbackInserts = 0;
  private readonly fallbackDedupeKeys = new Map<string, number>();
  private fallbackWarnedAt = 0;

  constructor(private readonly configService: ConfigService) {
    const config = resolveRedisConfig(configService);
    // maxRetries: 0 — fail-fast. Redis 실패 즉시 in-memory fallback 전환.
    this.client = createRedisClient(
      { ...config, maxRetries: 0 },
      SortRejectionRedisRateLimiterService.name
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async acquireSlot(
    event: Pick<SortRejectionEvent, 'invalidValue' | 'normalizedRoute'>
  ): Promise<{ allowed: boolean; reason: SortRejectionDropReason | null }> {
    try {
      return await this.acquireSlotRedis(event);
    } catch (err) {
      // Redis 장애 → in-memory fallback. 1회/분 warn.
      const now = Date.now();
      if (now - this.fallbackWarnedAt >= 60_000) {
        this.logger.warn(
          `SortRejectionRateLimiter Redis unavailable, using in-memory fallback: ${err instanceof Error ? err.message : String(err)}`
        );
        this.fallbackWarnedAt = now;
      }
      return this.acquireSlotFallback(event);
    }
  }

  private async acquireSlotRedis(
    event: Pick<SortRejectionEvent, 'invalidValue' | 'normalizedRoute'>
  ): Promise<{ allowed: boolean; reason: SortRejectionDropReason | null }> {
    // invalidValue 200자 cap — Redis key 안전성 + SIEM 과 동일 기준
    const safeValue = event.invalidValue.slice(0, 200);
    const dedupeKey = `${DEDUPE_KEY_PREFIX}:${event.normalizedRoute}::${safeValue}`;
    const epochMinute = Math.floor(Date.now() / 60_000);
    const rateKey = `${RATE_LIMIT_KEY_PREFIX}:${epochMinute}`;

    // Dedupe: SET key value EX seconds NX
    const dedupeResult = await this.client.set(dedupeKey, '1', 'EX', DEDUPE_WINDOW_SEC, 'NX');
    if (dedupeResult === null) {
      return { allowed: false, reason: 'dedupe' };
    }

    // Rate limit: Lua atomic INCR + EXPIRE
    const count = (await this.client.eval(
      RATE_LIMIT_LUA,
      1,
      rateKey,
      String(MAX_LOGS_PER_MINUTE)
    )) as number;
    if (count > MAX_LOGS_PER_MINUTE) {
      return { allowed: false, reason: 'rate-limit' };
    }

    return { allowed: true, reason: null };
  }

  /** Redis 미가용 시 in-memory fallback (단일 인스턴스 한정) */
  private acquireSlotFallback(
    event: Pick<SortRejectionEvent, 'invalidValue' | 'normalizedRoute'>
  ): { allowed: boolean; reason: SortRejectionDropReason | null } {
    const now = Date.now();

    // 분 윈도우 회전
    if (now - this.fallbackWindowStart >= 60_000) {
      this.fallbackWindowStart = now;
      this.fallbackInserts = 0;
    }

    const dedupeKey = `${event.normalizedRoute}::${event.invalidValue.slice(0, 200)}`;
    const lastSeen = this.fallbackDedupeKeys.get(dedupeKey);
    if (lastSeen !== undefined && now - lastSeen < 60_000) {
      return { allowed: false, reason: 'rate-limit-fallback' };
    }

    if (this.fallbackInserts >= MAX_LOGS_PER_MINUTE) {
      return { allowed: false, reason: 'rate-limit-fallback' };
    }

    this.fallbackInserts++;
    this.fallbackDedupeKeys.set(dedupeKey, now);

    // Map 크기 정리
    if (this.fallbackDedupeKeys.size > 200) {
      for (const [key, ts] of this.fallbackDedupeKeys) {
        if (now - ts >= 60_000) {
          this.fallbackDedupeKeys.delete(key);
        }
      }
    }

    return { allowed: true, reason: null };
  }
}
