'use client';

import { memo } from 'react';
import { Bell, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CHECKOUT_YOUR_TURN_BADGE_TOKENS } from '@/lib/design-tokens';

// ============================================================================
// Types
// ============================================================================

export interface YourTurnBadgeProps {
  urgency: 'normal' | 'warning' | 'critical';
  label?: string;
  /** tooltip/aria-label에 삽입될 액션 (예: "승인", "반납 처리") */
  action?: string;
}

// ============================================================================
// Icon map
// ============================================================================

const URGENCY_ICON = {
  normal: Bell,
  warning: AlertTriangle,
  critical: AlertCircle,
} as const;

// ============================================================================
// YourTurnBadge
// ============================================================================

/**
 * 내 차례 뱃지 — 현재 사용자가 처리해야 하는 반출 항목을 표시합니다.
 *
 * urgency에 따라 색상과 아이콘이 달라지며,
 * critical 단계에서는 `animate-pulse`로 주의를 환기합니다.
 */
function YourTurnBadgeInner({ urgency, label, action }: YourTurnBadgeProps) {
  const t = useTranslations('checkouts');
  const Icon = URGENCY_ICON[urgency];
  const resolvedLabel = label ?? t('yourTurn.label');
  const ariaLabel = action ? t('yourTurn.tooltip', { action }) : resolvedLabel;

  return (
    <span
      data-testid="your-turn-badge"
      data-urgency={urgency}
      role="status"
      aria-label={ariaLabel}
      className={`${CHECKOUT_YOUR_TURN_BADGE_TOKENS.base} ${CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant[urgency]}`}
    >
      <Icon className={CHECKOUT_YOUR_TURN_BADGE_TOKENS.icon} aria-hidden="true" />
      {resolvedLabel}
    </span>
  );
}

export const YourTurnBadge = memo(YourTurnBadgeInner);
YourTurnBadge.displayName = 'YourTurnBadge';
