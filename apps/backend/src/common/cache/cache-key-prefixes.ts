/**
 * 캐시 키 프리픽스 SSOT
 *
 * 모든 서비스의 캐시 키 프리픽스를 한 곳에서 관리합니다.
 * 서비스와 CacheEventListener가 동일한 상수를 참조하여
 * 프리픽스 불일치 버그를 원천 차단합니다.
 *
 * 사용처:
 * - 각 서비스의 CACHE_PREFIX → 이 상수 import
 * - CacheEventListener의 CACHE_INVALIDATION_REGISTRY → 이 상수 참조
 * - CacheInvalidationHelper의 패턴 매칭 → 이 상수 참조
 */
export const CACHE_KEY_PREFIXES = {
  /** equipment.service.ts, disposal.service.ts */
  EQUIPMENT: 'equipment:',

  /** checkouts.service.ts — 주의: 's' 포함 */
  CHECKOUTS: 'checkouts:',

  /** calibration.service.ts */
  CALIBRATION: 'calibration:',

  /** calibration-factors.service.ts */
  CALIBRATION_FACTORS: 'calibration-factors:',

  /** calibration-plans.service.ts */
  CALIBRATION_PLANS: 'calibration-plans:',

  /** non-conformances.service.ts */
  NON_CONFORMANCES: 'non-conformances:',

  /** dashboard.service.ts */
  DASHBOARD: 'dashboard:',

  /** equipment-imports (인라인 사용) */
  EQUIPMENT_IMPORTS: 'equipment-imports:',

  /** disposal.service.ts */
  DISPOSAL_REQUESTS: 'disposal-requests:',

  /** software.service.ts */
  SOFTWARE: 'software:',

  /** audit.service.ts */
  AUDIT_LOGS: 'audit-logs:',

  /** notifications.service.ts, notification-dispatcher.ts */
  NOTIFICATION: 'notification:',

  /** notification-dispatcher.ts — actorName 캐시 (5분 TTL) */
  ACTOR_NAME: 'actor:name:',

  /** approvals.service.ts */
  APPROVALS: 'approvals:',

  /** settings.service.ts */
  SETTINGS: 'settings:',

  /** reports.service.ts */
  REPORTS: 'reports:',

  /** jwt.strategy.ts — 사용자 활성 상태 캐시 */
  USER_ACTIVE: 'user_active:',

  /** data-migration.service.ts — single/multi 세션 캐시 */
  DATA_MIGRATION: 'data-migration:',
} as const;

export type CacheKeyPrefix = (typeof CACHE_KEY_PREFIXES)[keyof typeof CACHE_KEY_PREFIXES];

/**
 * 결정론적 캐시 키 생성 유틸리티
 *
 * JSON.stringify는 객체 프로퍼티 순서에 의존하여 동일 의미의 파라미터가
 * 다른 캐시 키를 생성할 수 있습니다. 이 함수는 모든 키를 재귀적으로 정렬하여
 * 순서에 무관한 안정적인 캐시 키를 생성합니다.
 *
 * @param prefix - CACHE_KEY_PREFIXES의 프리픽스 (예: 'reports:')
 * @param segment - 캐시 세그먼트 (예: 'usage', 'calibration-status')
 * @param params - 캐시 키에 포함할 파라미터 객체
 */
export function buildStableCacheKey(
  prefix: CacheKeyPrefix,
  segment: string,
  params: Record<string, unknown>
): string {
  return `${prefix}${segment}:${stableStringify(params)}`;
}

/** 키를 알파벳순으로 재귀 정렬하여 직렬화 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const sorted = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(',');
  return `{${sorted}}`;
}
