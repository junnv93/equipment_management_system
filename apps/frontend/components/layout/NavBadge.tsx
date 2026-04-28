import { cn } from '@/lib/utils';
import { SIDEBAR_ITEM_TOKENS, ANIMATION_PRESETS } from '@/lib/design-tokens';

interface NavBadgeProps {
  count: number;
  /**
   * 스크린리더 라벨. 부모 anchor에도 같은 aria-label이 부여되면 link의
   * accessible name이 우선되므로 중복 announce는 발생하지 않는다.
   */
  srLabel: string;
  variant?: 'default' | 'critical';
  className?: string;
}

/**
 * 사이드바/모바일 nav 배지 (시각 + SR 라벨 단일 책임)
 *
 * - count <= 0이면 null
 * - count > 9면 "9+" 표시
 * - 항상 `<span>` 으로 렌더 — 링크 의미 부여는 caller(부모 anchor)가 담당
 *
 * 안티패턴 회피: 본 컴포넌트가 `<a>` 또는 `<Link>`를 직접 렌더하지 않음으로써
 * 부모 anchor 안에 nested anchor가 들어가는 hydration error를 구조적으로 차단.
 * 보조 동선이 필요하면 caller가 sibling anchor 패턴을 사용해야 한다
 * (예: `NavRowWithSecondaryAction` 컴포넌트).
 */
export function NavBadge({ count, srLabel, variant = 'default', className }: NavBadgeProps) {
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

  return (
    <span className={badgeClasses} aria-label={srLabel}>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
