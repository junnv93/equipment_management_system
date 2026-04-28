/**
 * D-day 색상 토큰 (Layer 3: Component-Specific)
 *
 * **REVIEW_RESULT.md §4.3 4-tier SSOT 단일 시스템**:
 *  - `getCheckoutDday4Tier` / `CheckoutDdayTier` / `DDAY_4TIER_CLASSES` / `DDAY_4TIER_ICON_KEY`
 *  - shared-constants `CHECKOUT_DDAY_THRESHOLDS` 임계값(0/2/14)으로 frontend/backend 일관.
 *
 * 모든 색상은 brand CSS 변수 경유 (`:root`/`.dark` 자동 전환, `dark:` prefix 금지).
 */

import { getCheckoutDdayTier, type CheckoutDdayTier } from '@equipment-management/shared-constants';

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
export function getCheckoutDday4TierIconKey(tier: CheckoutDdayTier): 'warning' | 'critical' | null {
  return DDAY_4TIER_ICON_KEY[tier];
}
