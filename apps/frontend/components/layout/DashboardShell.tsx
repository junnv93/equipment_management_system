'use client';

/**
 * Dashboard Shell (Client Component)
 *
 * 대시보드 레이아웃 UI 컴포넌트
 * - 사이드바, 헤더, 메인 콘텐츠 영역 포함
 * - usePathname 등 클라이언트 훅 사용
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - MobileNav: 직접 import (SSR-safe, CSS md:hidden으로 데스크톱 숨김)
 * - 아이콘: lucide-react 개별 import (tree-shaking)
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package2,
  FileSpreadsheet,
  ClipboardCheck,
  CheckSquare,
  Users,
  Bell,
  Settings,
  Wrench,
  FileText,
  FileSearch,
} from 'lucide-react';
import { ReactNode, memo, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES, Permission, hasPermission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { MobileNav, type NavItem } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserProfileDropdown } from '@/components/layout/UserProfileDropdown';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { hasApprovalPermissions } from '@/lib/utils/permission-helpers';
import { approvalsApi, type PendingCountsByCategory } from '@/lib/api/approvals-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { computeApprovalTotal } from '@/lib/utils/approval-count-utils';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  isActive?: boolean;
  badge?: number; // 선택적: 알림 배지 (승인 대기 건수 등)
}

// SidebarItem을 memo로 래핑하여 불필요한 리렌더 방지 (rerender-memo)
const SidebarItem = memo(function SidebarItem({
  icon,
  href,
  label,
  isActive,
  badge,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 relative',
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
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-ul-red text-white animate-pulse"
          aria-label={`${badge}건의 알림`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
});

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  // SSE 알림 실시간 스트림 (세션 있을 때만 자동 연결)
  // useNotificationStream 내부에서 accessToken 없으면 no-op
  useNotificationStream();

  // 승인 대기 카운트 조회 (권한이 있는 경우에만)
  // SSOT: ApprovalsService (GET /api/approvals/counts) — 대시보드 카드, 승인 페이지와 동일 소스
  // enabled: false일 때 쿼리 비활성화 → 세션 로딩 중 API 호출 없음
  const { data: pendingCounts } = useQuery<PendingCountsByCategory>({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled: !!userRole && hasApprovalPermissions(userRole),
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: 60000,
  });

  // 선언적 네비게이션 설정
  // SSOT: FRONTEND_ROUTES(경로) + Permission(가시성) + hasPermission(필터링)
  // requiredPermission이 null이면 모든 역할에게 표시
  const navItems: NavItem[] = useMemo(() => {
    const role = userRole as UserRole | undefined;

    // 각 메뉴의 가시성을 Permission 상수로 선언 — 역할 하드코딩 없음
    const navConfig: Array<{
      icon: React.ReactNode;
      href: string;
      label: string;
      requiredPermission: Permission | null;
      badge?: number;
    }> = [
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        href: FRONTEND_ROUTES.DASHBOARD,
        label: '대시보드',
        requiredPermission: null, // 모든 역할
      },
      {
        icon: <Package2 className="h-5 w-5" />,
        href: FRONTEND_ROUTES.EQUIPMENT.LIST,
        label: '장비 관리',
        requiredPermission: Permission.VIEW_EQUIPMENT,
      },
      {
        icon: <ClipboardCheck className="h-5 w-5" />,
        href: FRONTEND_ROUTES.CHECKOUTS.LIST,
        label: '반출입 관리',
        requiredPermission: Permission.VIEW_CHECKOUTS,
      },
      {
        icon: <FileSpreadsheet className="h-5 w-5" />,
        href: FRONTEND_ROUTES.CALIBRATION.LIST,
        label: '교정 관리',
        requiredPermission: Permission.VIEW_CALIBRATIONS,
      },
      {
        icon: <FileText className="h-5 w-5" />,
        href: FRONTEND_ROUTES.CALIBRATION_PLANS.LIST,
        label: '교정계획서',
        requiredPermission: Permission.VIEW_CALIBRATION_PLANS,
      },
      {
        icon: <CheckSquare className="h-5 w-5" />,
        href: FRONTEND_ROUTES.ADMIN.APPROVALS,
        label: '승인 관리',
        requiredPermission: Permission.APPROVE_EQUIPMENT, // 승인 권한 중 하나라도 있으면 표시
        badge: (() => {
          if (!role || !hasApprovalPermissions(role)) return undefined;
          const total = computeApprovalTotal(pendingCounts, role);
          return total > 0 ? total : undefined;
        })(),
      },
      {
        icon: <FileSearch className="h-5 w-5" />,
        href: FRONTEND_ROUTES.ADMIN.AUDIT_LOGS,
        label: '감사 로그',
        requiredPermission: Permission.VIEW_AUDIT_LOGS,
      },
      {
        icon: <Users className="h-5 w-5" />,
        href: FRONTEND_ROUTES.TEAMS.LIST,
        label: '팀 관리',
        requiredPermission: Permission.VIEW_TEAMS,
      },
      {
        icon: <Bell className="h-5 w-5" />,
        href: FRONTEND_ROUTES.NOTIFICATIONS.LIST,
        label: '알림',
        requiredPermission: Permission.VIEW_NOTIFICATIONS,
      },
      {
        icon: <Settings className="h-5 w-5" />,
        href: FRONTEND_ROUTES.SETTINGS.INDEX,
        label: '설정',
        requiredPermission: null, // 모든 역할
      },
    ];

    // Permission 기반 필터링 — 역할 추가/변경 시 role-permissions.ts만 수정하면 됨
    return navConfig.filter((item) => {
      if (item.requiredPermission === null) return true;
      if (!role) return false;

      // 승인 관리는 기존 hasApprovalPermissions 로직 유지 (복수 권한 OR 조건)
      if (item.href === FRONTEND_ROUTES.ADMIN.APPROVALS) {
        return hasApprovalPermissions(role);
      }

      return hasPermission(role, item.requiredPermission);
    });
  }, [userRole, pendingCounts]);

  // isActive를 useCallback으로 안정화 (rerender-functional-setstate)
  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname?.startsWith(href);
    },
    [pathname]
  );

  // Layer 0: 세션 복원 전까지 인증 의존 컴포넌트 미마운트
  // → 하위 컴포넌트의 API 호출이 토큰 없이 발생하는 문제 원천 차단
  // NOTE: 모든 hooks 호출 이후에 위치해야 함 (React 규칙: 조건부 early return 전 hooks 완료)
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
                badge={item.badge}
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
                <NotificationsDropdown />
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
    </BreadcrumbProvider>
  );
}

/**
 * DashboardShell 스켈레톤
 *
 * 세션 복원 중(status === 'loading') 표시되는 레이아웃 스켈레톤.
 * 사이드바 구조는 정적으로 렌더링하고, 메인 콘텐츠 영역만 스켈레톤 처리.
 */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* 데스크톱 사이드바 스켈레톤 */}
      <aside className="fixed inset-y-0 z-20 hidden w-64 bg-ul-midnight md:block">
        {/* 사이드바 헤더 */}
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ul-red">
              <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-semibold text-white">장비 관리 시스템</span>
          </div>
        </div>

        {/* 네비게이션 스켈레톤 */}
        <nav className="flex flex-col gap-1 p-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Skeleton className="h-5 w-5 rounded bg-white/10" />
              <Skeleton className="h-4 flex-1 bg-white/10" />
            </div>
          ))}
        </nav>

        {/* 사이드바 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-ul-red font-bold text-xs">UL Solutions</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/40 text-xs">Working for a safer world.</span>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 스켈레톤 */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* 헤더 스켈레톤 */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Skeleton className="h-6 w-6 md:hidden" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* 메인 콘텐츠 스켈레톤 */}
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
