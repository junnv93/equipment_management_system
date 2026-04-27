/**
 * D-day 6단계 색온도 토큰 (Layer 3: Component-Specific)
 *
 * 3단계(ok/warn/danger) → 6단계 시스템으로 확장.
 * 모든 색상은 brand CSS 변수 경유 (`:root`/`.dark` 자동 전환, `dark:` prefix 금지).
 *
 * 단계 정의:
 * - farFuture  : D-7 이상   → neutral (여유)
 * - upcoming   : D-4 ~ D-6  → info 힌트 (인지 시작)
 * - soon       : D-1 ~ D-3  → warning (주의)
 * - dueToday   : D-0        → warning 강조 (오늘 반납)
 * - overdueShort: D+1 ~ D+3 → critical (초과)
 * - overdueLong : D+4 이상  → critical pulse (위험)
 */

export const DDAY_TIERS = [
  'farFuture',
  'upcoming',
  'soon',
  'dueToday',
  'overdueShort',
  'overdueLong',
] as const;

export type DdayTier = (typeof DDAY_TIERS)[number];

/** tier별 badge 클래스 (badge 컨테이너 className에 직접 적용) */
export const DDAY_TIER_CLASSES = {
  farFuture: 'bg-muted text-muted-foreground',
  upcoming: 'bg-brand-info/10 text-brand-info',
  soon: 'bg-brand-warning/15 text-brand-warning',
  dueToday: 'bg-brand-warning text-white font-semibold',
  overdueShort: 'bg-brand-critical/15 text-brand-critical font-semibold',
  overdueLong: 'bg-brand-critical text-white font-semibold motion-safe:animate-pulse',
} as const satisfies Record<DdayTier, string>;

/** tier별 아이콘 키 (null = 아이콘 없음) */
export const DDAY_TIER_ICON_KEY = {
  farFuture: null,
  upcoming: null,
  soon: 'warning',
  dueToday: 'warning',
  overdueShort: 'critical',
  overdueLong: 'critical',
} as const satisfies Record<DdayTier, 'warning' | 'critical' | null>;

/**
 * daysRemaining → DdayTier 분류.
 * 음수 = 기한 초과, 0 = 오늘, 양수 = 남은 일수.
 */
export function getDdayTier(daysRemaining: number): DdayTier {
  if (daysRemaining >= 7) return 'farFuture';
  if (daysRemaining >= 4) return 'upcoming';
  if (daysRemaining >= 1) return 'soon';
  if (daysRemaining === 0) return 'dueToday';
  if (daysRemaining >= -3) return 'overdueShort';
  return 'overdueLong';
}

/** tier에 해당하는 badge className 반환. */
export function getDdayBadgeClasses(daysRemaining: number): string {
  return DDAY_TIER_CLASSES[getDdayTier(daysRemaining)];
}

/** tier에 해당하는 아이콘 키 반환 (null = 아이콘 불필요). */
export function getDdayIconKey(tier: DdayTier): 'warning' | 'critical' | null {
  return DDAY_TIER_ICON_KEY[tier];
}
