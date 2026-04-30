'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  formatDday,
  getCheckoutDdayVisualClasses,
  getCheckoutDdayVisualIconKey,
  getCheckoutDdayVisualLevel,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface DdayBadgeProps {
  daysRemaining: number | null;
  variant?: 'compact' | 'hero';
  className?: string;
}

type DdaySrKey = 'overdue' | 'urgent' | 'normal' | 'relaxed';

function resolveSrKey(level: 1 | 2 | 3 | 4 | 5 | 6): DdaySrKey {
  if (level >= 5) return 'overdue';
  if (level === 4) return 'urgent';
  if (level === 3) return 'normal';
  return 'relaxed';
}

/**
 * D-day 배지 — 반납 예정일까지 남은 일수를 색+숫자+아이콘+sr-only 4중 단서로 표시.
 * daysRemaining === null이면 null 렌더 (terminal 상태 등 호출부 가드).
 *
 * **Sprint 4.5 U-09**: 시각 6-level 표현(`getCheckoutDdayVisualClasses`).
 * - level 6 (D+4+) `motion-safe:animate-pulse` — `prefers-reduced-motion` 사용자는 정적 표시.
 * - 4-tier SSOT(`getCheckoutDdayTier`)는 backend aggregation 일관성을 위해 보존.
 */
export function DdayBadge({ daysRemaining, variant = 'compact', className }: DdayBadgeProps) {
  const t = useTranslations('checkouts.detail');

  if (daysRemaining === null) return null;

  const level = getCheckoutDdayVisualLevel(daysRemaining);
  const iconKey = getCheckoutDdayVisualIconKey(daysRemaining);
  const badgeClasses = getCheckoutDdayVisualClasses(daysRemaining);
  const label = formatDday(daysRemaining);
  const srKey = resolveSrKey(level);

  return (
    <span
      role="img"
      aria-label={t(`ddaySrLabel.${srKey}`, { days: Math.abs(daysRemaining) })}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs tabular-nums',
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
