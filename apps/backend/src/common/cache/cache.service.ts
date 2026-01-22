import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '../utils/error';

interface CacheItem<T> {
  value: T;
  expiresAt: number | null;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTtl = 1000 * 60 * 60; // 기본 1시간

  /**
   * 캐시에서 데이터를 가져오거나, 데이터가 없으면 팩토리 함수를 실행하여 데이터를 가져옵니다.
   * @param key 캐시 키
   * @param factory 데이터를 생성하는 팩토리 함수
   * @param ttl 캐시 유효시간 (밀리초)
   * @returns 캐시된 데이터 또는 팩토리 함수에서 반환된 데이터
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      // 캐시 확인
      const cachedValue = this.get<T>(key);

      if (cachedValue !== undefined) {
        return cachedValue;
      }

      // 캐시에 없으면 팩토리 함수 실행
      this.logger.debug(`Cache miss for key: ${key}, fetching data...`);
      const data = await factory();

      // 결과를 캐시에 저장
      if (data !== undefined && data !== null) {
        this.set(key, data, ttl);
        this.logger.debug(`Data stored in cache for key: ${key}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error in cache operation for key ${key}: ${getErrorMessage(error)}`);
      // 캐시 오류 시 팩토리 함수 결과 직접 반환
      return factory();
    }
  }

  /**
   * 캐시에서 값을 조회합니다.
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // TTL 체크
    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.logger.debug(`Cache expired for key: ${key}`);
      this.cache.delete(key);
      return undefined;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return item.value;
  }

  /**
   * 캐시에 값을 저장합니다.
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 캐시 유효시간 (밀리초)
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTtl): void {
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.logger.debug(`Cache set for key: ${key}, expires in: ${ttl}ms`);
  }

  /**
   * 키에 해당하는 캐시 데이터를 삭제합니다.
   * @param key 삭제할 캐시 키
   */
  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 패턴에 일치하는 모든 캐시 키를 삭제합니다.
   * @param pattern 캐시 키 패턴 (정규식)
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern);
      let deletedCount = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }

      this.logger.debug(`Deleted ${deletedCount} cache entries matching pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error deleting cache by pattern ${pattern}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 모든 캐시를 비웁니다.
   */
  async reset(): Promise<void> {
    try {
      this.cache.clear();
      this.logger.debug('Cache reset completed');
    } catch (error) {
      this.logger.error(`Error resetting cache: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 현재 캐시 스토어가 Redis인지 확인합니다.
   * 메모리 캐시이므로 항상 false 반환
   */
  isRedisStore(): boolean {
    return false;
  }
}
