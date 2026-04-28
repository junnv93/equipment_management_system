'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DDAY_4TIER_ICON_KEY,
  formatDday,
  getCheckoutDday4Tier,
  getCheckoutDday4TierClasses,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface DdayBadgeProps {
  daysRemaining: number | null;
  variant?: 'compact' | 'hero';
  className?: string;
}

/**
 * D-day 배지 — 반납 예정일까지 남은 일수를 색+숫자+아이콘 3중 단서로 표시.
 * daysRemaining === null이면 null 렌더 (terminal 상태 등 호출부 가드).
 */
export function DdayBadge({ daysRemaining, variant = 'compact', className }: DdayBadgeProps) {
  const t = useTranslations('checkouts.detail');

  if (daysRemaining === null) return null;

  const tier = getCheckoutDday4Tier(daysRemaining);
  const iconKey = DDAY_4TIER_ICON_KEY[tier];
  const badgeClasses = getCheckoutDday4TierClasses(daysRemaining);
  const label = formatDday(daysRemaining);

  return (
    <span
      role="img"
      aria-label={t('ddaySrLabel', { days: Math.abs(daysRemaining) })}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'hero' && 'px-3 py-1 text-sm',
        badgeClasses,
        className
      )}
    >
      {iconKey === 'critical' && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {iconKey === 'warning' && <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
