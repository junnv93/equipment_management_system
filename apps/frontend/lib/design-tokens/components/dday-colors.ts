/**
 * D-day 색상 토큰 (Layer 3: Component-Specific)
 *
 * **두 시스템 병존 (점진 이행 중)**:
 *  - **6-tier (legacy)** — `getDdayTier` / `DdayTier` / `DDAY_TIER_CLASSES` (이 파일 하단 @deprecated)
 *  - **4-tier (REVIEW_RESULT.md §4.3 / SSOT)** — `getCheckoutDday4Tier` / `Dday4Tier` / `DDAY_4TIER_CLASSES`
 *    (shared-constants `CHECKOUT_DDAY_THRESHOLDS` 임계값 사용)
 *
 * 신규 코드는 4-tier를 사용. 호출처가 전부 마이그레이션되면 6-tier 제거.
 *
 * 모든 색상은 brand CSS 변수 경유 (`:root`/`.dark` 자동 전환, `dark:` prefix 금지).
 */

import {
  getCheckoutDdayTier,
  type CheckoutDdayTier,
} from '@equipment-management/shared-constants';

// ============================================================================
// 4-tier — 신규 SSOT (REVIEW_RESULT.md §4.3)
// ============================================================================

/**
 * 와이어프레임 01의 D-day pill 클래스(`dday-ok / dday-warn / dday-danger`) + neutral 1:1 매핑.
 * 새 코드는 본 객체와 `getCheckoutDday4TierClasses()` 사용.
 */
export const DDAY_4TIER_CLASSES = {
  /** D+N (overdue) — 즉시 조치 필요 */
  danger: 'bg-brand-critical/16 text-brand-critical font-bold',
  /** D-0..D-2 — 긴급 */
  warning: 'bg-brand-warning/16 text-brand-warning font-semibold',
  /** D-3..D-14 — 정상 */
  ok: 'bg-brand-ok/14 text-brand-ok font-semibold',
  /** D-15+ — 여유 (pill 없이도 가능, neutral 톤) */
  neutral: 'bg-muted text-muted-foreground font-medium',
} as const satisfies Record<CheckoutDdayTier, string>;

/** tier별 아이콘 키 (null = 아이콘 없음) — 4-tier 버전 */
export const DDAY_4TIER_ICON_KEY = {
  danger: 'critical',
  warning: 'warning',
  ok: null,
  neutral: null,
} as const satisfies Record<CheckoutDdayTier, 'warning' | 'critical' | null>;

/**
 * 반출 도메인 D-day tier 결정 — shared-constants SSOT 직접 위임.
 * 시각/논리 일관성 보장 (frontend/backend 동일).
 */
export function getCheckoutDday4Tier(daysRemaining: number): CheckoutDdayTier {
  return getCheckoutDdayTier(daysRemaining);
}

/** tier에 해당하는 4-tier badge className 반환 (REVIEW §4.3 명세 기반). */
export function getCheckoutDday4TierClasses(daysRemaining: number): string {
  return DDAY_4TIER_CLASSES[getCheckoutDday4Tier(daysRemaining)];
}

/** tier에 해당하는 4-tier 아이콘 키 반환 (null = 아이콘 불필요). */
export function getCheckoutDday4TierIconKey(
  tier: CheckoutDdayTier
): 'warning' | 'critical' | null {
  return DDAY_4TIER_ICON_KEY[tier];
}

// ============================================================================
// 6-tier — Legacy (점진 제거 중, @deprecated)
// ============================================================================

/**
 * @deprecated REVIEW_RESULT.md §4.3 4-tier 시스템(`getCheckoutDday4Tier`)을 사용하세요.
 * 본 6-tier는 와이어프레임 명세와 불일치하며, 다음 마이너에서 제거됩니다.
 *
 * 단계 정의 (legacy):
 * - farFuture  : D-7 이상
 * - upcoming   : D-4 ~ D-6
 * - soon       : D-1 ~ D-3
 * - dueToday   : D-0
 * - overdueShort: D+1 ~ D+3
 * - overdueLong : D+4 이상
 */
export const DDAY_TIERS = [
  'farFuture',
  'upcoming',
  'soon',
  'dueToday',
  'overdueShort',
  'overdueLong',
] as const;

/** @deprecated REVIEW §4.3 4-tier 사용 — `CheckoutDdayTier` (shared-constants). */
export type DdayTier = (typeof DDAY_TIERS)[number];

/** @deprecated REVIEW §4.3 4-tier 사용 — `DDAY_4TIER_CLASSES`. */
export const DDAY_TIER_CLASSES = {
  farFuture: 'bg-muted text-muted-foreground',
  upcoming: 'bg-brand-info/10 text-brand-info',
  soon: 'bg-brand-warning/15 text-brand-warning',
  dueToday: 'bg-brand-warning text-white font-semibold',
  overdueShort: 'bg-brand-critical/15 text-brand-critical font-semibold',
  overdueLong: 'bg-brand-critical text-white font-semibold motion-safe:animate-pulse',
} as const satisfies Record<DdayTier, string>;

/** @deprecated REVIEW §4.3 4-tier 사용 — `DDAY_4TIER_ICON_KEY`. */
export const DDAY_TIER_ICON_KEY = {
  farFuture: null,
  upcoming: null,
  soon: 'warning',
  dueToday: 'warning',
  overdueShort: 'critical',
  overdueLong: 'critical',
} as const satisfies Record<DdayTier, 'warning' | 'critical' | null>;

/**
 * @deprecated REVIEW §4.3 4-tier 사용 — `getCheckoutDday4Tier`.
 * 임계값 7/4/1/0/-3 하드코딩은 shared-constants SSOT에 부합하지 않음.
 */
export function getDdayTier(daysRemaining: number): DdayTier {
  if (daysRemaining >= 7) return 'farFuture';
  if (daysRemaining >= 4) return 'upcoming';
  if (daysRemaining >= 1) return 'soon';
  if (daysRemaining === 0) return 'dueToday';
  if (daysRemaining >= -3) return 'overdueShort';
  return 'overdueLong';
}

/** @deprecated REVIEW §4.3 4-tier 사용 — `getCheckoutDday4TierClasses`. */
export function getDdayBadgeClasses(daysRemaining: number): string {
  return DDAY_TIER_CLASSES[getDdayTier(daysRemaining)];
}

/** @deprecated REVIEW §4.3 4-tier 사용 — `getCheckoutDday4TierIconKey`. */
export function getDdayIconKey(tier: DdayTier): 'warning' | 'critical' | null {
  return DDAY_TIER_ICON_KEY[tier];
}
