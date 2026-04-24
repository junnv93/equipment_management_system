/**
 * YourTurnBadge Design Tokens
 *
 * 내 차례 뱃지: 현재 사용자가 처리해야 하는 반출 항목 표시
 * urgency 3단계: normal → warning → critical
 */

export const CHECKOUT_YOUR_TURN_BADGE_TOKENS = {
  base: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  variant: {
    normal: 'bg-brand-info/10 text-brand-info',
    warning: 'bg-brand-warning/10 text-brand-warning',
    critical: 'bg-brand-critical/10 text-brand-critical animate-pulse motion-reduce:animate-none',
  },
  icon: 'h-3 w-3',
} as const;

export type YourTurnBadgeUrgency = keyof typeof CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant;
