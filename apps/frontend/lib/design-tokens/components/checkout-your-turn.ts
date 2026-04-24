/**
 * YourTurnBadge Design Tokens
 *
 * 내 차례 뱃지: 현재 사용자가 처리해야 하는 반출 항목 표시
 * urgency 3단계: normal → warning → critical
 */

import { MICRO_TYPO } from '../semantic';

export const CHECKOUT_YOUR_TURN_BADGE_TOKENS = {
  base: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  variant: {
    normal: 'bg-brand-info/10 text-brand-info',
    warning: 'bg-brand-warning/10 text-brand-warning',
    critical: 'bg-brand-critical/10 text-brand-critical animate-pulse motion-reduce:animate-none',
  },
  icon: 'h-3 w-3',
  /** 그룹 헤더 요약 카운트 — 텍스트 전용 (배지 형태 variant는 S2로 이월) */
  summary: {
    container: `${MICRO_TYPO.badge} text-brand-info font-medium shrink-0`,
  },
} as const;

export type YourTurnBadgeUrgency = keyof typeof CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant;
