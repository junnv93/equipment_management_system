import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient, resolveRedisConfig } from '../redis';
import { RATE_LIMIT_LUA } from './system-health-rate-limiter.lua';
import type { SystemHealthRateLimiter, SystemErrorEventDropReason } from './contract';

const MAX_INSERTS_PER_MINUTE = 60;
const DEDUPE_WINDOW_SEC = 60;
const RATE_LIMIT_KEY_PREFIX = 'sh:rl:counter';
const DEDUPE_KEY_PREFIX = 'sh:dedupe';

/**
 * Redis-backed cluster-aware rate limiter for system error event capture.
 *
 * 클러스터 안전성: Redis EVAL(Lua) 으로 atomic INCR + EXPIRE.
 * 다중 인스턴스(PM2 cluster / K8s replicas)에서도 분당 총 MAX_INSERTS_PER_MINUTE 보장.
 *
 * Graceful degradation: Redis 호출 실패 → in-memory fallback 자동 전환.
 * 응답 흐름 비차단 — record() fire-and-forget contract 불변.
 *
 * fallback 빈도는 Prometheus counter 'rate-limit-fallback' reason 으로 표면화.
 */
@Injectable()
export class SystemHealthRedisRateLimiterService
  implements SystemHealthRateLimiter, OnModuleDestroy
{
  private readonly logger = new Logger(SystemHealthRedisRateLimiterService.name);
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
      SystemHealthRedisRateLimiterService.name
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async acquireSlot(
    event: Pick<{ errorCode: string; normalizedRoute: string }, 'errorCode' | 'normalizedRoute'>
  ): Promise<{ allowed: boolean; reason: SystemErrorEventDropReason | null }> {
    try {
      return await this.acquireSlotRedis(event);
    } catch (err) {
      // Redis 장애 → in-memory fallback. 1회/분 warn.
      const now = Date.now();
      if (now - this.fallbackWarnedAt >= 60_000) {
        this.logger.warn(
          `SystemHealthRateLimiter Redis unavailable, using in-memory fallback: ${err instanceof Error ? err.message : String(err)}`
        );
        this.fallbackWarnedAt = now;
      }
      return this.acquireSlotFallback(event);
    }
  }

  private async acquireSlotRedis(
    event: Pick<{ errorCode: string; normalizedRoute: string }, 'errorCode' | 'normalizedRoute'>
  ): Promise<{ allowed: boolean; reason: SystemErrorEventDropReason | null }> {
    const dedupeKey = `${DEDUPE_KEY_PREFIX}:${event.errorCode}::${event.normalizedRoute}`;
    const epochMinute = Math.floor(Date.now() / 60_000);
    const rateKey = `${RATE_LIMIT_KEY_PREFIX}:${epochMinute}`;

    // Dedupe: SET key value EX seconds NX — ioredis v5 타입 순서: EX seconds NX
    const dedupeResult = await this.client.set(dedupeKey, '1', 'EX', DEDUPE_WINDOW_SEC, 'NX');
    if (dedupeResult === null) {
      return { allowed: false, reason: 'dedupe' };
    }

    // Rate limit: Lua atomic INCR + EXPIRE
    const count = (await this.client.eval(
      RATE_LIMIT_LUA,
      1,
      rateKey,
      String(MAX_INSERTS_PER_MINUTE)
    )) as number;
    if (count > MAX_INSERTS_PER_MINUTE) {
      return { allowed: false, reason: 'rate-limit' };
    }

    return { allowed: true, reason: null };
  }

  /** Redis 미가용 시 in-memory fallback (단일 인스턴스 한정 — cluster에서는 `rate-limit-fallback` counter 증가 확인) */
  private acquireSlotFallback(
    event: Pick<{ errorCode: string; normalizedRoute: string }, 'errorCode' | 'normalizedRoute'>
  ): { allowed: boolean; reason: SystemErrorEventDropReason | null } {
    const now = Date.now();

    // 분 윈도우 회전
    if (now - this.fallbackWindowStart >= 60_000) {
      this.fallbackWindowStart = now;
      this.fallbackInserts = 0;
    }

    // Dedupe (Map 크기 제한)
    const dedupeKey = `${event.errorCode}::${event.normalizedRoute}`;
    const lastSeen = this.fallbackDedupeKeys.get(dedupeKey);
    if (lastSeen !== undefined && now - lastSeen < 60_000) {
      return { allowed: false, reason: 'rate-limit-fallback' };
    }

    // Rate limit
    if (this.fallbackInserts >= MAX_INSERTS_PER_MINUTE) {
      return { allowed: false, reason: 'rate-limit-fallback' };
    }

    this.fallbackInserts++;
    this.fallbackDedupeKeys.set(dedupeKey, now);

    // Map 정리
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
