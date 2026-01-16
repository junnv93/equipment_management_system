import { Injectable, Logger } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
  expiresAt: number | null;
}

@Injectable()
export class SimpleCacheService {
  private readonly logger = new Logger(SimpleCacheService.name);
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTtl = 1000 * 60 * 60; // 기본 1시간

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
   * 캐시에서 값을 가져오거나, 없으면 팩토리 함수를 실행하여 값을 가져옵니다.
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
    // 캐시 확인
    const cachedValue = this.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // 캐시에 없으면 팩토리 함수 실행
    this.logger.debug(`Cache miss for key: ${key}, fetching data...`);
    try {
      const value = await factory();

      // 값이 유효하면 캐시에 저장
      if (value !== undefined && value !== null) {
        this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      // 예상된 HTTP 예외(4xx)는 로깅하지 않음 (테스트 및 정상적인 비즈니스 로직)
      // 5xx 서버 에러만 ERROR 레벨로 로깅
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status >= 400 && status < 500) {
          // 클라이언트 에러(4xx): 예상된 예외이므로 DEBUG 레벨로만 로깅
          this.logger.debug(`Expected error in cache factory for key ${key}: ${error.message}`);
        } else {
          // 서버 에러(5xx): 예상치 못한 에러이므로 ERROR 레벨로 로깅
          this.logger.error(
            `Unexpected server error in cache factory for key ${key}: ${error.message}`
          );
        }
      } else {
        // HTTP 예외가 아닌 경우: 예상치 못한 에러이므로 ERROR 레벨로 로깅
        this.logger.error(`Unexpected error in cache factory for key ${key}: ${error.message}`);
      }
      throw error;
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
}
