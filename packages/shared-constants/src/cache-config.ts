/**
 * 캐시 TTL 상수 — Backend/Frontend 공유 SSOT
 *
 * Backend: SimpleCacheService.getOrSet() TTL
 * Frontend: React Query staleTime/gcTime
 *
 * 두 계층의 TTL이 동기화되어야 stale-data 윈도우를 최소화합니다.
 * 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 *
 * @example
 * // Backend
 * import { CACHE_TTL } from '@equipment-management/shared-constants';
 * cacheService.getOrSet(key, fn, CACHE_TTL.SHORT);
 *
 * // Frontend
 * import { CACHE_TTL } from '@equipment-management/shared-constants';
 * useQuery({ staleTime: CACHE_TTL.SHORT, ... });
 */
export const CACHE_TTL = {
  /** 30초 — 대시보드 통계, 알림 (자주 변경) */
  SHORT: 30_000,
  /** 2분 — 감사 로그 목록, 부적합 목록 */
  MEDIUM: 120_000,
  /** 5분 — 장비/교정/반출 목록 및 상세 */
  LONG: 300_000,
  /** 10분 — 감사 로그 상세 (append-only) */
  VERY_LONG: 600_000,
  /** 30분 — 참조 데이터 (팀, 상태 코드) */
  REFERENCE: 1_800_000,
} as const;

export type CacheTTLTier = keyof typeof CACHE_TTL;
