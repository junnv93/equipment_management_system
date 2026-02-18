/**
 * 캐시 서비스 인터페이스
 *
 * 구현체를 교체하면 In-Memory → Redis 등 외부 캐시로 전환 가능합니다.
 *
 * @example
 * // In-Memory (현재): 단일 인스턴스 운영 시 충분
 * // Redis (프로덕션): 다중 인스턴스/재시작 후에도 캐시 유지
 */
export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export interface ICacheService {
  get<T>(key: string): T | undefined | Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
  deleteByPattern(pattern: string): void | Promise<void>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  size(): number | Promise<number>;
  cleanup(): number | Promise<number>;
}
