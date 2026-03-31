import { Injectable, Logger, OnModuleDestroy, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getErrorMessage } from '../utils/error';
import { resolveRedisConfig, createRedisClient } from '../redis';
import type { ICacheService } from './cache.interface';

/**
 * Redis 기반 캐시 서비스
 *
 * ICacheService 구현체로, SimpleCacheService와 동일한 인터페이스를 제공합니다.
 * 프로덕션 환경에서 수평 확장 및 재시작 후 캐시 유지가 필요한 경우 사용합니다.
 *
 * 환경변수:
 *   REDIS_HOST (기본: localhost)
 *   REDIS_PORT (기본: 6379)
 *   REDIS_PASSWORD (선택)
 */
@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis;
  private readonly defaultTtl = 1000 * 60 * 60; // 기본 1시간

  constructor(private readonly configService: ConfigService) {
    const config = resolveRedisConfig(this.configService);
    this.client = createRedisClient({ ...config, maxRetries: 3 }, RedisCacheService.name);

    this.client.connect().catch((err) => {
      this.logger.error(`Redis connection error: ${getErrorMessage(err)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(key);
    if (!raw) {
      return undefined;
    }
    this.logger.debug(`Cache hit for key: ${key}`);
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTtl): Promise<void> {
    const ttlSeconds = Math.ceil(ttl / 1000);
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    this.logger.debug(`Cache set for key: ${key}, expires in: ${ttl}ms`);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
    this.logger.debug(`Cache deleted for key: ${key}`);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
    this.logger.debug('Cache cleared');
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const count = await this.scanAndDelete(`*${pattern}*`);
    this.logger.debug(`Deleted ${count} cache entries matching pattern: ${pattern}`);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    // Redis glob 특수문자(?, *, [, ]) 이스케이프 — 정규식 메타문자와 다름
    const escaped = prefix.replace(/[?*[\]]/g, '\\$&');
    const count = await this.scanAndDelete(`${escaped}*`);
    this.logger.debug(`Deleted ${count} cache entries with prefix: ${prefix}`);
  }

  /**
   * Redis SCAN cursor iteration으로 glob에 매칭되는 키를 모두 찾아 삭제합니다.
   *
   * KEYS 커맨드는 O(N) 블로킹이므로 SCAN으로 비블로킹 처리합니다.
   * deleteByPattern / deleteByPrefix 양쪽의 공통 구현입니다.
   *
   * @param redisGlob Redis glob 패턴 (예: `*foo*`, `foo:*`)
   * @returns 삭제된 키 수
   */
  private async scanAndDelete(redisGlob: string): Promise<number> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, found] = await this.client.scan(cursor, 'MATCH', redisGlob, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...found);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    return keys.length;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    this.logger.debug(`Cache miss for key: ${key}, fetching data...`);
    try {
      const value = await factory();
      if (value !== undefined && value !== null) {
        await this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status >= 400 && status < 500) {
          this.logger.debug(`Expected error in cache factory for key ${key}: ${error.message}`);
        } else {
          this.logger.error(
            `Unexpected server error in cache factory for key ${key}: ${error.message}`
          );
        }
      } else {
        this.logger.error(
          `Unexpected error in cache factory for key ${key}: ${getErrorMessage(error)}`
        );
      }
      throw error;
    }
  }

  async size(): Promise<number> {
    return this.client.dbsize();
  }

  /**
   * Redis는 TTL 기반 자동 만료를 지원하므로 수동 cleanup 불필요.
   * SimpleCacheService 인터페이스 호환을 위해 0 반환.
   */
  async cleanup(): Promise<number> {
    return 0;
  }
}
