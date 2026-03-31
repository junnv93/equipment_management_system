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
  /**
   * 특정 프리픽스로 시작하는 모든 캐시 키를 삭제합니다.
   *
   * deleteByPattern의 glob-style 패턴 오용을 방지하기 위한 안전한 대안.
   * 내부적으로 정규식 메타문자를 이스케이프하고 '^' 앵커를 사용하여
   * 정확한 프리픽스 매칭을 보장합니다.
   *
   * @example
   * // ❌ 위험: 'equipment'를 포함하는 다른 서비스의 캐시도 삭제 가능
   * cacheService.deleteByPattern('equipment:*');
   *
   * // ✅ 안전: 정확히 'equipment:'로 시작하는 키만 삭제
   * cacheService.deleteByPrefix('equipment:');
   */
  deleteByPrefix(prefix: string): void | Promise<void>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  size(): number | Promise<number>;
  cleanup(): number | Promise<number>;
}
