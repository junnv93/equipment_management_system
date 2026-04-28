'use client';

import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_ITEM_TOKENS,
  SIDEBAR_ROW_TOKENS,
  getSidebarItemClasses,
  getSidebarRowPrimaryClasses,
  getSidebarRowSecondaryClasses,
} from '@/lib/design-tokens';
import { NavBadge } from '@/components/layout/NavBadge';
import { NavLink } from '@/components/navigation/nav-link';
import type { FilteredNavSecondaryAction } from '@/lib/navigation/nav-config';

interface NavRowWithSecondaryActionProps {
  icon: LucideIcon;
  href: string;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  badge?: number;
  /** 보조 액션 (배지 클릭 시 이동). 있으면 sibling anchor로 렌더, 없으면 inline span 배지 */
  secondaryAction?: FilteredNavSecondaryAction;
}

/**
 * 사이드바 nav 행 — 메인 링크 + 선택적 보조 액션 링크 패턴 SSOT
 *
 * 렌더 구조 (3가지 분기):
 * 1. `isCollapsed`: 단일 anchor + dot indicator (보조 액션은 시각 공간 부족으로 미표시)
 * 2. expanded + secondaryAction 없음: 단일 anchor + inline `<span>` 배지
 * 3. expanded + secondaryAction 있음: `<div>` 컨테이너 + 형제 anchor 2개 (메인 + 보조)
 *
 * 회피 안티패턴:
 * - `<a>` 안 `<a>` (HTML 명세 위반, React hydration error)
 * - `<a>` 안 `<button onClick=router.push>` (WCAG 4.1.1 parsing 위반, URL 공유 손실)
 *
 * 워크플로 보존 (분기 3):
 * - 메인 클릭 → `href` (전체 목록)
 * - 보조 클릭 → `secondaryAction.href` (필터 뷰 등)
 * - 우클릭/Cmd+클릭 → 두 동선 모두 새 탭 가능 (URL 기반 anchor이므로)
 *
 * 접근성:
 * - WCAG 2.4.3 Focus Order: DOM 순서 = Tab 순서 (메인 → 보조 → 다음 item)
 * - WCAG 4.1.2 Name, Role, Value: 메인은 label 텍스트, 보조는 명시 aria-label
 * - 두 anchor 모두 focus-visible (FOCUS_TOKENS.classes.onDark 경유)
 *
 * 성능:
 * - `memo` 래핑 — props 안정 시 리렌더 없음 (DashboardShell의 useMemo와 협조)
 */
export const NavRowWithSecondaryAction = memo(function NavRowWithSecondaryAction({
  icon: Icon,
  href,
  label,
  isActive,
  isCollapsed,
  badge,
  secondaryAction,
}: NavRowWithSecondaryActionProps) {
  const t = useTranslations('navigation');
  const hasBadge = badge !== undefined && badge > 0;
  const collapsedDotLabel = t('layout.notificationCount', { count: badge ?? 0 });
  const inlineBadgeLabel = t('layout.notificationCount', { count: badge ?? 0 });

  // 분기 3: expanded + 보조 액션 — sibling anchors
  if (!isCollapsed && hasBadge && secondaryAction) {
    const secondaryAriaLabel = t(secondaryAction.ariaKey as Parameters<typeof t>[0], {
      count: badge ?? 0,
    });
    // 메인 anchor에 명시 aria-label — 보조 anchor와 의미 구분 (SR 안내 명료성)
    const primaryAriaLabel = t(secondaryAction.primaryAriaKey as Parameters<typeof t>[0]);
    return (
      <div className={cn(SIDEBAR_ROW_TOKENS.container)}>
        <NavLink
          href={href}
          variant="sidebar"
          className={cn(getSidebarRowPrimaryClasses(!!isActive))}
          aria-current={isActive ? 'page' : undefined}
          aria-label={primaryAriaLabel}
        >
          <span aria-hidden="true">
            <Icon className={SIDEBAR_ITEM_TOKENS.iconSize} />
          </span>
          <span className="flex-1 truncate">{label}</span>
        </NavLink>
        <NavLink
          href={secondaryAction.href}
          variant="sidebar"
          className={cn(getSidebarRowSecondaryClasses())}
          aria-label={secondaryAriaLabel}
        >
          <NavBadge count={badge ?? 0} srLabel={secondaryAriaLabel} />
        </NavLink>
      </div>
    );
  }

  // 분기 1, 2: 단일 anchor (collapsed 또는 보조 액션 없음)
  return (
    <NavLink
      href={href}
      variant="sidebar"
      className={cn(getSidebarItemClasses(!!isActive, isCollapsed))}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      <span aria-hidden="true">
        <Icon className={SIDEBAR_ITEM_TOKENS.iconSize} />
      </span>
      {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
      {!isCollapsed && hasBadge && <NavBadge count={badge ?? 0} srLabel={inlineBadgeLabel} />}
      {isCollapsed && hasBadge && (
        <span
          className={cn(SIDEBAR_ROW_TOKENS.collapsedDot, SIDEBAR_ITEM_TOKENS.badge.background)}
          aria-label={collapsedDotLabel}
        />
      )}
    </NavLink>
  );
});
