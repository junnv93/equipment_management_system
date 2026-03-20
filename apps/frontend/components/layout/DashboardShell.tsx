'use client';

/**
 * Dashboard Shell (Client Component)
 *
 * 대시보드 레이아웃 UI 컴포넌트
 * - 사이드바: 섹션 그룹핑 + 접기/펼치기 (Phase 1-3)
 * - 헤더: 글로벌 검색 트리거 (Phase 4)
 * - 모바일: MobileNav 드로어
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - SidebarItem: memo로 불필요한 리렌더 방지
 * - filteredSections: useMemo로 의존성 변경 시만 재계산
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ReactNode, memo, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { cn } from '@/lib/utils';
import type { UserRole } from '@equipment-management/schemas';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { GlobalSearchTrigger } from '@/components/layout/GlobalSearchTrigger';
import { hasApprovalPermissions } from '@/lib/utils/permission-helpers';
import { approvalsApi, type PendingCountsByCategory } from '@/lib/api/approvals-api';
import { queryKeys, CACHE_TIMES, REFETCH_INTERVALS } from '@/lib/api/query-config';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';
import {
  getHeaderSpacingClass,
  getHeaderBarClasses,
  FOCUS_TOKENS,
  ANIMATION_PRESETS,
  TRANSITION_PRESETS,
  SIDEBAR_LAYOUT,
  SIDEBAR_COLORS,
  SIDEBAR_ITEM_TOKENS,
  SIDEBAR_SECTION_TOKENS,
  LAYOUT_Z_INDEX,
  SIDEBAR_ELEVATION,
  getSidebarItemClasses,
  getSidebarWidthClasses,
  getSidebarMarginClasses,
} from '@/lib/design-tokens';
import { getFilteredNavSections, isNavItemActive } from '@/lib/navigation/nav-config';
import type { FilteredNavSection } from '@/lib/navigation/nav-config';
import { saveRecentPage } from '@/components/layout/GlobalSearchDialog';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useTranslations } from 'next-intl';

interface SidebarItemProps {
  icon: LucideIcon;
  href: string;
  label: string;
  isActive?: boolean;
  badge?: number;
  isCollapsed?: boolean;
}

// SidebarItem을 memo로 래핑하여 불필요한 리렌더 방지 (rerender-memo)
const SidebarItem = memo(function SidebarItem({
  icon: Icon,
  href,
  label,
  isActive,
  badge,
  isCollapsed,
}: SidebarItemProps) {
  const t = useTranslations('navigation');
  return (
    <Link
      href={href}
      className={cn(getSidebarItemClasses(!!isActive, isCollapsed))}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      <span aria-hidden="true">
        <Icon className={SIDEBAR_ITEM_TOKENS.iconSize} />
      </span>
      {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
      {/* 펼쳐진 상태: 숫자 배지 */}
      {!isCollapsed && badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
            SIDEBAR_ITEM_TOKENS.badge.background,
            SIDEBAR_ITEM_TOKENS.badge.text,
            ANIMATION_PRESETS.pulse
          )}
          aria-label={t('layout.notificationCount', { count: badge })}
        >
          {badge}
        </span>
      )}
      {/* 접힌 상태: dot 인디케이터 */}
      {isCollapsed && badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
            SIDEBAR_ITEM_TOKENS.badge.background
          )}
          aria-label={t('layout.notificationCount', { count: badge })}
        />
      )}
    </Link>
  );
});

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  const { isCollapsed, toggle } = useSidebarState();

  // SSE 알림 실시간 스트림 (세션 있을 때만 자동 연결)
  useNotificationStream();

  // 승인 대기 카운트 조회 (권한이 있는 경우에만)
  // SSE를 통해 실시간 무효화됨 (useNotificationStream에서 approval-changed 이벤트 처리)
  // refetchInterval은 SSE 연결 끊김 시 안전망 (10분)
  const { data: pendingCounts } = useQuery<PendingCountsByCategory>({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled: !!userRole && hasApprovalPermissions(userRole),
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: REFETCH_INTERVALS.SSE_FALLBACK,
  });

  // SSOT: nav-config.ts에서 필터링된 섹션 조회
  // getFilteredNavSections가 useMemo 안에서만 호출되므로 참조 안정적
  const filteredSections = useMemo(
    () =>
      getFilteredNavSections(userRole, (key) => t(key as Parameters<typeof t>[0]), pendingCounts),
    [userRole, pendingCounts, t]
  );

  // 페이지 방문 시 최근 페이지 자동 저장 — 검색 다이얼로그 '최근 페이지' 섹션용
  useEffect(() => {
    const activeItem = filteredSections
      .flatMap((s) => s.items)
      .find((item) => isNavItemActive(item.href, pathname));
    if (activeItem) {
      saveRecentPage(pathname, activeItem.label);
    }
  }, [pathname, filteredSections]);

  // Layer 0: 세션 복원 전까지 인증 의존 컴포넌트 미마운트
  if (status === 'loading') {
    return <DashboardShellSkeleton />;
  }

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen bg-background">
        {/* 스킵 네비게이션 */}
        <SkipLink href="#main-content" />

        {/* 데스크톱 사이드바 - UL Midnight Blue */}
        <aside
          className={cn(
            'fixed inset-y-0 hidden md:flex md:flex-col',
            LAYOUT_Z_INDEX.sidebar,
            getSidebarWidthClasses(isCollapsed),
            SIDEBAR_COLORS.background,
            SIDEBAR_ELEVATION.shadow,
            SIDEBAR_LAYOUT.transition
          )}
          aria-label={t('layout.sidebar')}
        >
          {/* 사이드바 헤더 — 펼침/접힘 모두 동일 높이 영역 내 토글 버튼 배치 */}
          <div
            className={cn(
              'flex items-center border-b shrink-0',
              SIDEBAR_LAYOUT.headerHeight,
              SIDEBAR_COLORS.border,
              isCollapsed ? 'px-2 justify-between' : 'px-4'
            )}
          >
            {isCollapsed ? (
              <>
                <Link
                  href="/"
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                    FOCUS_TOKENS.classes.onDark
                  )}
                  aria-label={t('layout.goHome')}
                >
                  <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 text-white/50 hover:text-white hover:bg-white/10',
                    FOCUS_TOKENS.classes.onDark
                  )}
                  onClick={toggle}
                  aria-label={t('layout.expandSidebar')}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={cn(
                    'flex items-center gap-2 font-semibold text-white group',
                    FOCUS_TOKENS.classes.onDark,
                    'rounded-md hover:bg-white/10 px-2 py-1.5 -mx-2',
                    TRANSITION_PRESETS.fastBg
                  )}
                  aria-label={t('layout.goHome')}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                      'group-hover:scale-110',
                      TRANSITION_PRESETS.fastTransform
                    )}
                  >
                    <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                  <span className={cn('group-hover:text-brand-info', TRANSITION_PRESETS.fastColor)}>
                    {t('layout.systemName')}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'ml-auto h-7 w-7 text-white/50 hover:text-white hover:bg-white/10',
                    FOCUS_TOKENS.classes.onDark
                  )}
                  onClick={toggle}
                  aria-label={t('layout.collapseSidebar')}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>

          {/* 네비게이션 섹션 */}
          <nav
            className="flex flex-col flex-1 overflow-y-auto p-2"
            aria-label={t('layout.mainNav')}
          >
            {filteredSections.map((section: FilteredNavSection, sectionIndex: number) => (
              <div key={section.sectionLabel}>
                {/* 섹션 구분선 (첫 섹션 제외) */}
                {sectionIndex > 0 && (
                  <div
                    className={cn(SIDEBAR_SECTION_TOKENS.divider, isCollapsed ? 'my-1' : undefined)}
                  />
                )}
                {/* 섹션 라벨 (펼쳐진 상태에서만) */}
                {!isCollapsed && (
                  <div
                    className={cn(
                      SIDEBAR_SECTION_TOKENS.label,
                      sectionIndex === 0
                        ? SIDEBAR_SECTION_TOKENS.firstSpacing
                        : SIDEBAR_SECTION_TOKENS.spacing
                    )}
                  >
                    {section.sectionLabel}
                  </div>
                )}
                {/* 아이템 목록 */}
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      icon={item.icon}
                      href={item.href}
                      label={item.label}
                      isActive={isNavItemActive(item.href, pathname)}
                      badge={item.badge}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* 사이드바 하단 — 브랜딩 (mt-auto로 항상 하단 고정) */}
          {!isCollapsed && (
            <div className={cn('mt-auto p-4 border-t shrink-0', SIDEBAR_COLORS.border)}>
              <div className="flex items-center gap-2">
                <span className={cn('font-bold text-xs', SIDEBAR_COLORS.brandPrimary)}>
                  UL Solutions
                </span>
                <span className="text-white/30 text-xs">|</span>
                <span className={cn('text-xs', SIDEBAR_COLORS.brandSecondary)}>
                  Working for a safer world.
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div
          className={cn(
            'flex flex-col flex-1',
            getSidebarMarginClasses(isCollapsed),
            SIDEBAR_LAYOUT.transition
          )}
        >
          {/* 헤더 */}
          <Header
            title={t('layout.systemName')}
            leftContent={
              <>
                <MobileNav
                  navSections={filteredSections}
                  brandName={t('layout.systemName')}
                  brandIcon={<Wrench className="h-6 w-6" aria-hidden="true" />}
                />
                <GlobalSearchTrigger filteredSections={filteredSections} />
              </>
            }
            rightContent={
              <div className={cn('flex items-center', getHeaderSpacingClass())}>
                <ThemeToggle />
                <NotificationsDropdown />
                <UserProfileDropdown />
              </div>
            }
          />

          {/* 메인 콘텐츠 */}
          <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
            {children}
          </main>
        </div>

        {/* 라이브 영역 (스크린리더 알림용) */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-announcements" />
      </div>
    </BreadcrumbProvider>
  );
}

/**
 * DashboardShell 스켈레톤
 *
 * 세션 복원 중(status === 'loading') 표시되는 레이아웃 스켈레톤.
 */
export function DashboardShellSkeleton() {
  const t = useTranslations('navigation');
  return (
    <div className="flex min-h-screen bg-background">
      {/* 데스크톱 사이드바 스켈레톤 */}
      <aside
        className={cn(
          'fixed inset-y-0 hidden md:block',
          LAYOUT_Z_INDEX.sidebar,
          SIDEBAR_LAYOUT.expanded.width,
          SIDEBAR_COLORS.background,
          SIDEBAR_ELEVATION.shadow
        )}
        aria-label={t('layout.sidebar')}
      >
        <div
          className={cn(
            'flex items-center border-b px-4',
            SIDEBAR_LAYOUT.headerHeight,
            SIDEBAR_COLORS.border
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red">
              <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-semibold text-white">{t('layout.systemName')}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label={t('layout.mainNav')}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Skeleton className="h-5 w-5 rounded bg-white/10" />
              <Skeleton className="h-4 flex-1 bg-white/10" />
            </div>
          ))}
        </nav>

        <div className={cn('absolute bottom-0 left-0 right-0 p-4 border-t', SIDEBAR_COLORS.border)}>
          <div className="flex items-center gap-2">
            <span className={cn('font-bold text-xs', SIDEBAR_COLORS.brandPrimary)}>
              UL Solutions
            </span>
            <span className="text-white/30 text-xs">|</span>
            <span className={cn('text-xs', SIDEBAR_COLORS.brandSecondary)}>
              Working for a safer world.
            </span>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 스켈레톤 */}
      <div className={cn('flex flex-col flex-1', SIDEBAR_LAYOUT.expanded.marginLeft)}>
        <header className={getHeaderBarClasses()}>
          <Skeleton className="h-6 w-6 md:hidden" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <Skeleton className="h-9 w-48" />
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
