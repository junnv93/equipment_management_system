import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SIDEBAR_ITEM_TOKENS, ANIMATION_PRESETS } from '@/lib/design-tokens';

interface NavBadgeProps {
  count: number;
  srLabel: string;
  /** 배지 클릭 시 이동 href (제공 시 Link로 렌더링) */
  badgeLinkHref?: string;
  variant?: 'default' | 'critical';
  className?: string;
}

/**
 * 사이드바 nav 아이템 배지
 *
 * - count 0이면 null
 * - count > 9면 "9+" 표시
 * - badgeLinkHref 제공 시 별도 Link로 렌더링 (배지 단독 클릭 → 필터 뷰)
 */
export function NavBadge({
  count,
  srLabel,
  badgeLinkHref,
  variant = 'default',
  className,
}: NavBadgeProps) {
  if (count <= 0) return null;

  const displayText = count > 9 ? '9+' : String(count);
  const badgeClasses = cn(
    'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
    variant === 'critical'
      ? 'bg-brand-critical text-white'
      : [SIDEBAR_ITEM_TOKENS.badge.background, SIDEBAR_ITEM_TOKENS.badge.text],
    ANIMATION_PRESETS.pulse,
    className
  );

  if (badgeLinkHref) {
    return (
      <Link
        href={badgeLinkHref}
        className={badgeClasses}
        aria-label={srLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden="true">{displayText}</span>
      </Link>
    );
  }

  return (
    <span className={badgeClasses} aria-label={srLabel}>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
