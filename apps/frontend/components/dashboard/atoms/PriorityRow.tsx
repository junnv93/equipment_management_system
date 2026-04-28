/**
 * PriorityRow — 승인 대기 카드의 우선순위 행 (대시보드 개선안 §2.3)
 *
 * 레이아웃: [icon | name | count | cta]
 *
 * variant 규칙 (PendingApprovalCard에서 자동 결정):
 *  - heavy   : 가장 큰 건수 + count > 0 → border-l 빨강 + bg tint
 *  - default : 일반 row
 *  - muted   : count = 0 또는 통합 row (opacity 0.55)
 *
 * i18n: ctaLabel/aria-label은 `dashboard.priorityRow.*` 키 또는 호출처가 직접 번역된 문자열을 prop으로 전달.
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PriorityRowVariant = 'heavy' | 'default' | 'muted';
export type PriorityIconTone = 'danger' | 'info' | 'warn' | 'purple' | 'muted';

const ICON_TONE_CLASSES: Record<PriorityIconTone, string> = {
  danger: 'text-brand-critical',
  info: 'text-brand-info',
  warn: 'text-brand-warning',
  purple: 'text-brand-purple',
  muted: 'text-muted-foreground',
};

interface PriorityRowProps {
  icon: ReactNode;
  iconTone?: PriorityIconTone;
  name: string;
  count: number | null;
  variant?: PriorityRowVariant;
  /** 클릭 시 이동할 URL — 미지정 시 div로 렌더 (통합 row용). */
  href?: string;
  /**
   * 우측 CTA 텍스트.
   *  - undefined: i18n 기본값 `dashboard.priorityRow.defaultCta` ("검토" / "Review")
   *  - string: 호출처가 직접 번역한 문자열
   *  - null: CTA 숨김
   */
  ctaLabel?: string | null;
  className?: string;
}

export function PriorityRow({
  icon,
  iconTone = 'muted',
  name,
  count,
  variant = 'default',
  href,
  ctaLabel,
  className,
}: PriorityRowProps) {
  const t = useTranslations('dashboard.priorityRow');
  const effectiveCta = ctaLabel ?? t('defaultCta');
  const fallbackCta = t('fallbackCta');

  const containerClass = cn(
    'group grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 px-3 py-2.5 rounded-lg border bg-card text-card-foreground',
    'motion-safe:transition-colors',
    variant === 'heavy' &&
      'border-l-[3px] border-l-brand-critical bg-brand-critical/5 hover:bg-brand-critical/10',
    variant === 'default' && 'border-border hover:bg-muted/50',
    variant === 'muted' && 'border-border opacity-55',
    className
  );

  const inner = (
    <>
      <span className={cn('shrink-0 grid place-items-center', ICON_TONE_CLASSES[iconTone])}>
        {icon}
      </span>
      <span className={cn('text-sm font-medium truncate', variant === 'muted' && 'font-normal')}>
        {name}
      </span>
      <span
        className={cn(
          'font-mono font-bold tabular-nums text-base text-right min-w-[2ch]',
          variant === 'heavy' && 'text-brand-critical',
          variant === 'muted' && 'text-muted-foreground text-sm font-semibold',
          count === null && 'sr-only'
        )}
        aria-hidden={count === null ? 'true' : undefined}
      >
        {count ?? 0}
      </span>
      {ctaLabel !== null && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-medium text-brand-info',
            variant === 'muted' && 'text-muted-foreground'
          )}
        >
          {effectiveCta}
          <ChevronRight
            className="h-3 w-3 motion-safe:transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      )}
    </>
  );

  if (!href) {
    return <div className={containerClass}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={containerClass}
      aria-label={
        count != null
          ? t('ariaLabelWithCount', { name, count, action: effectiveCta })
          : t('ariaLabelWithoutCount', { name, action: ctaLabel ?? fallbackCta })
      }
    >
      {inner}
    </Link>
  );
}
