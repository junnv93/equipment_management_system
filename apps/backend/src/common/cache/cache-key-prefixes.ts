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

  /** non-conformances.service.ts — 주의: 콜론 없음 (buildCacheKey에서 추가) */
  NON_CONFORMANCES: 'non-conformances',

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

  /** notifications.service.ts */
  NOTIFICATION: 'notification:',

  /** approvals.service.ts */
  APPROVALS: 'approvals:',

  /** jwt.strategy.ts — 사용자 활성 상태 캐시 */
  USER_ACTIVE: 'user_active:',
} as const;

export type CacheKeyPrefix = (typeof CACHE_KEY_PREFIXES)[keyof typeof CACHE_KEY_PREFIXES];
