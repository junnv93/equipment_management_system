import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { getErrorMessage } from '../utils/error';
import type { ICacheService } from './cache.interface';

interface CacheItem<T> {
  value: T;
  expiresAt: number | null;
}

const DEFAULT_MAX_SIZE = 5000;
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1분 (SHORT TTL 30s 항목의 신속한 정리)

@Injectable()
export class SimpleCacheService implements ICacheService, OnModuleDestroy {
  private readonly logger = new Logger(SimpleCacheService.name);
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private readonly defaultTtl = 1000 * 60 * 60; // 기본 1시간
  private readonly maxSize: number;
  private readonly cleanupTimer: ReturnType<typeof setInterval>;
  private readonly inflight = new Map<string, Promise<unknown>>();

  // 캐시 히트/미스 카운터 (모니터링 메트릭용)
  private hits = 0;
  private misses = 0;

  constructor() {
    this.maxSize = DEFAULT_MAX_SIZE;
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  /**
   * 캐시에서 값을 조회합니다.
   * LRU: 조회 시 delete+re-insert로 Map 순서 갱신
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return undefined;
    }

    // TTL 체크
    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.logger.debug(`Cache expired for key: ${key}`);
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // LRU: delete + re-insert로 Map 끝으로 이동 (최근 사용)
    this.cache.delete(key);
    this.cache.set(key, item);

    this.hits++;
    this.logger.debug(`Cache hit for key: ${key}`);
    return item.value as T;
  }

  /**
   * 캐시에 값을 저장합니다.
   * maxSize 초과 시 가장 오래된(LRU) 항목 제거
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTtl): void {
    // 기존 키 업데이트 시 먼저 삭제 (Map 끝으로 이동)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // maxSize 초과 시 가장 오래된(Map 첫 항목) 제거
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.logger.debug(`LRU eviction: ${oldestKey}`);
      } else {
        break;
      }
    }

    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.logger.debug(`Cache set for key: ${key}, expires in: ${ttl}ms`);
  }

  /**
   * 캐시에서 키를 삭제합니다.
   * @param key 삭제할 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted for key: ${key}`);
  }

  /**
   * 캐시를 완전히 비웁니다.
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * 패턴과 일치하는 키를 삭제합니다.
   * @param pattern 키 패턴 (정규식)
   */
  deleteByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    this.logger.debug(`Deleted ${deletedCount} cache entries matching pattern: ${pattern}`);
  }

  /**
   * 특정 프리픽스로 시작하는 모든 캐시 키를 삭제합니다.
   *
   * deleteByPattern('prefix*')의 glob-style 오용 대신 이 메서드를 사용하세요.
   * 정규식 메타문자를 이스케이프하고 '^' 앵커를 적용하여 의도치 않은 키 삭제를 방지합니다.
   *
   * @param prefix CACHE_KEY_PREFIXES 상수 (예: 'equipment:' 또는 'equipment:list:')
   */
  deleteByPrefix(prefix: string): void {
    // 정규식 메타문자 이스케이프 후 ^ 앵커 적용 — 정확한 프리픽스 매칭 보장
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.deleteByPattern(`^${escaped}`);
  }

  /**
   * 캐시에서 값을 가져오거나, 없으면 팩토리 함수를 실행하여 값을 가져옵니다.
   *
   * Thundering Herd 방지: 동일 키에 대한 동시 요청은 하나의 factory만 실행하고
   * 나머지 요청은 그 Promise를 공유합니다.
   *
   * @param key 캐시 키
   * @param factory 값을 생성하는 팩토리 함수
   * @param ttl 캐시 유효시간 (밀리초)
   * @returns 캐시된 값 또는 팩토리 함수의 결과
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    // 1. 캐시 확인
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // 2. 동일 키에 대한 inflight 요청이 있으면 해당 Promise 재사용
    const existing = this.inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    // 3. 새 factory 실행 — inflight에 등록하여 중복 실행 방지
    this.logger.debug(`Cache miss for key: ${key}, fetching data...`);
    const promise = factory()
      .then((value) => {
        // Cache both positive and negative results (negative cache with shorter TTL to prevent stampede)
        const effectiveTtl = value === undefined || value === null ? Math.min(ttl, 10_000) : ttl;
        this.set(key, value, effectiveTtl);
        return value;
      })
      .catch((error) => {
        this.logFactoryError(key, error);
        throw error;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * factory 에러 로깅 (getOrSet 내부용)
   */
  private logFactoryError(key: string, error: unknown): void {
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
  }

  /**
   * 캐시 항목의 개수를 반환합니다.
   * @returns 캐시 항목 개수
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 만료된 캐시 항목을 제거합니다.
   * @returns 제거된 항목 수
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt !== null && now > item.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired cache items`);
    }

    return removedCount;
  }

  /**
   * 캐시 통계 반환 (모니터링 메트릭용)
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}
