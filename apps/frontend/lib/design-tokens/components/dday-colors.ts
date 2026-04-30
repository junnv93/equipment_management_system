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

// ============================================================================
// Visual 6-level — Sprint 4.5 U-09 (시각 표현 전용, 4-tier SSOT 보존)
// ============================================================================
//
// **하이브리드 설계**: backend aggregation은 4-tier SSOT(`getCheckoutDdayTier`)를
// 그대로 사용하고, 본 6-level은 **frontend 시각 표현 전용**. tier(아이콘)와 visual
// level(색온도)을 의도적으로 분리해 사용자 의도(6단계 색온도)와 SSOT 안정성을
// 동시 달성한다.
//
// 입력 규약: `daysRemaining` = 양수=미래, 0=오늘, 음수=overdue.
//
// 매핑:
//   level 1 (relaxed)        : days >= 7      → neutral, font-medium
//   level 2 (normal)         : 4 <= days <= 6 → brand-info tint, font-medium
//   level 3 (warning-soft)   : 1 <= days <= 3 → brand-warning, font-semibold
//   level 4 (urgent)         : days === 0     → brand-warning solid, font-bold
//   level 5 (overdue-light)  : -3 <= days <= -1 → brand-critical, font-bold
//   level 6 (critical-pulse) : days <= -4     → brand-critical, font-bold + motion-safe pulse

/** 시각 6-level 키 — 4-tier와 분리된 frontend 전용 표현. */
export type CheckoutDdayVisualLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 시각 6-level별 className 매핑.
 * level 6은 `motion-safe:animate-pulse`로 prefers-reduced-motion 사용자에게는 정적 표시 (WCAG 2.3.3).
 * 모든 색상은 brand CSS 변수 경유 — `dark:` prefix 0.
 */
export const DDAY_VISUAL_LEVEL_CLASSES = {
  1: 'bg-muted text-muted-foreground font-medium',
  2: 'bg-brand-info/10 text-brand-info font-medium',
  3: 'bg-brand-warning/14 text-brand-warning font-semibold',
  4: 'bg-brand-warning/20 text-brand-warning font-bold',
  5: 'bg-brand-critical/14 text-brand-critical font-bold',
  6: 'bg-brand-critical/20 text-brand-critical font-bold motion-safe:animate-pulse',
} as const satisfies Record<CheckoutDdayVisualLevel, string>;

/**
 * 6-level → 4-tier 아이콘 매핑.
 * tier 시스템(아이콘)을 visual level과 일관 유지.
 */
export const DDAY_VISUAL_LEVEL_ICON_KEY = {
  1: null,
  2: null,
  3: 'warning',
  4: 'warning',
  5: 'critical',
  6: 'critical',
} as const satisfies Record<CheckoutDdayVisualLevel, 'warning' | 'critical' | null>;

/**
 * `daysRemaining`을 시각 6-level로 분해.
 * 4-tier SSOT(`getCheckoutDdayTier`)와 독립 — 시각 표현 전용 헬퍼.
 *
 * @example
 *   getCheckoutDdayVisualLevel(10)  // 1 (relaxed)
 *   getCheckoutDdayVisualLevel(5)   // 2 (normal)
 *   getCheckoutDdayVisualLevel(2)   // 3 (warning-soft)
 *   getCheckoutDdayVisualLevel(0)   // 4 (urgent)
 *   getCheckoutDdayVisualLevel(-2)  // 5 (overdue-light)
 *   getCheckoutDdayVisualLevel(-5)  // 6 (critical-pulse)
 */
export function getCheckoutDdayVisualLevel(daysRemaining: number): CheckoutDdayVisualLevel {
  if (daysRemaining >= 7) return 1;
  if (daysRemaining >= 4) return 2;
  if (daysRemaining >= 1) return 3;
  if (daysRemaining === 0) return 4;
  if (daysRemaining >= -3) return 5;
  return 6;
}

/** 시각 6-level className 반환. */
export function getCheckoutDdayVisualClasses(daysRemaining: number): string {
  return DDAY_VISUAL_LEVEL_CLASSES[getCheckoutDdayVisualLevel(daysRemaining)];
}

/** 시각 6-level 아이콘 키 반환 (null = 아이콘 불필요). */
export function getCheckoutDdayVisualIconKey(daysRemaining: number): 'warning' | 'critical' | null {
  return DDAY_VISUAL_LEVEL_ICON_KEY[getCheckoutDdayVisualLevel(daysRemaining)];
}
