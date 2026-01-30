'use client';

/**
 * Dashboard Shell (Client Component)
 *
 * 대시보드 레이아웃 UI 컴포넌트
 * - 사이드바, 헤더, 메인 콘텐츠 영역 포함
 * - usePathname 등 클라이언트 훅 사용
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - MobileNav: dynamic import (모바일에서만 필요)
 * - 아이콘: lucide-react 개별 import (tree-shaking)
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  Package2,
  FileSpreadsheet,
  ClipboardCheck,
  Users,
  Bell,
  Settings,
  Wrench,
} from 'lucide-react';
import { ReactNode, memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { NavItem } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';

// MobileNav는 모바일 뷰포트에서만 필요하므로 지연 로딩 (bundle-dynamic-imports)
const MobileNav = dynamic(
  () => import('@/components/layout/MobileNav').then((mod) => mod.MobileNav),
  {
    ssr: false,
    loading: () => (
      <div className="md:hidden w-10 h-10 animate-pulse bg-muted rounded" aria-hidden="true" />
    ),
  }
);

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive?: boolean;
}

// SidebarItem을 memo로 래핑하여 불필요한 리렌더 방지 (rerender-memo)
const SidebarItem = memo(function SidebarItem({ icon, href, label, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2',
        // prefers-reduced-motion 지원: transition-all 대신 조건부 transition
        'motion-safe:transition-all motion-reduce:transition-none',
        'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2 focus:ring-offset-ul-midnight',
        isActive
          ? 'text-white bg-white/15 font-medium'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
});

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  // navItems를 useMemo로 메모이제이션하여 불필요한 재생성 방지 (rerender-memo)
  // SSOT: FRONTEND_ROUTES 사용
  const navItems: NavItem[] = useMemo(
    () => [
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: FRONTEND_ROUTES.DASHBOARD,
        label: '대시보드',
      },
      {
        icon: <Package2 className="h-5 w-5" />,
        href: FRONTEND_ROUTES.EQUIPMENT.LIST,
        label: '장비 관리',
      },
      {
        icon: <ClipboardCheck className="h-5 w-5" />,
        href: FRONTEND_ROUTES.CHECKOUTS.LIST,
        label: '대여/반출 관리',
      },
      {
        icon: <FileSpreadsheet className="h-5 w-5" />,
        href: FRONTEND_ROUTES.CALIBRATION.LIST,
        label: '교정 관리',
      },
      {
        icon: <Users className="h-5 w-5" />,
        href: '/teams',
        label: '팀 관리',
      },
      {
        icon: <Bell className="h-5 w-5" />,
        href: FRONTEND_ROUTES.NOTIFICATIONS.LIST,
        label: '알림',
      },
      {
        icon: <Settings className="h-5 w-5" />,
        href: '/settings',
        label: '설정',
      },
    ],
    []
  );

  // isActive를 useCallback으로 안정화 (rerender-functional-setstate)
  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname?.startsWith(href);
    },
    [pathname]
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* 스킵 네비게이션 */}
      <SkipLink href="#main-content" />

      {/* 데스크톱 사이드바 - UL Midnight Blue */}
      <aside
        className="fixed inset-y-0 z-20 hidden w-64 bg-ul-midnight md:block"
        role="navigation"
        aria-label="메인 네비게이션"
      >
        {/* 사이드바 헤더 */}
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 font-semibold text-white',
              'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2 focus:ring-offset-ul-midnight rounded-md',
              'hover:bg-white/10 motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none',
              'px-2 py-1.5 -mx-2',
              'group'
            )}
            aria-label="홈으로 이동"
          >
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red',
                'group-hover:scale-110 motion-safe:transition-transform motion-reduce:transition-none'
              )}
            >
              <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="group-hover:text-ul-info motion-safe:transition-colors motion-reduce:transition-none">
              장비 관리 시스템
            </span>
          </Link>
        </div>

        {/* 네비게이션 링크 */}
        <nav className="flex flex-col gap-1 p-4" role="menubar">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              href={item.href}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>

        {/* 사이드바 하단 - UL 브랜딩 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-ul-red font-bold text-xs">UL Solutions</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/40 text-xs">Working for a safer world.</span>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* 헤더 */}
        <Header
          title="장비 관리 시스템"
          leftContent={
            <MobileNav
              navItems={navItems}
              brandName="장비 관리 시스템"
              brandIcon={<Wrench className="h-6 w-6" aria-hidden="true" />}
            />
          }
          rightContent={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserProfileDropdown />
            </div>
          }
        />

        {/* 메인 콘텐츠 */}
        <main id="main-content" className="flex-1 overflow-auto" role="main" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* 라이브 영역 (스크린리더 알림용) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-announcements" />
    </div>
  );
}
