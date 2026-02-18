/**
 * 토큰 블랙리스트 Provider 인터페이스
 *
 * 로그아웃된 토큰을 추적하여 재사용을 방지합니다.
 * 구현체를 교체하면 Redis 등 외부 스토어로 전환할 수 있습니다.
 *
 * @example
 * // In-Memory (현재): 단일 인스턴스 운영 시 충분
 * // Redis (향후): 다중 인스턴스 운영 시 공유 블랙리스트 필요
 */
export const TOKEN_BLACKLIST = Symbol('TOKEN_BLACKLIST');

export interface TokenBlacklistProvider {
  /**
   * 토큰을 블랙리스트에 등록
   * @param token - 블랙리스트에 등록할 토큰
   * @param ttlMs - TTL(밀리초). 토큰 만료 시간까지만 유지하여 메모리 낭비 방지
   */
  add(token: string, ttlMs: number): void | Promise<void>;

  /**
   * 토큰이 블랙리스트에 있는지 확인
   * @param token - 확인할 토큰
   * @returns 블랙리스트에 등록되어 있으면 true
   */
  isBlacklisted(token: string): Promise<boolean>;
}
