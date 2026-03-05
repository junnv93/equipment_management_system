'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Monitor, Calendar, Cog, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isTechnicalManagerOrAbove,
  hasPermission,
  Permission,
  FRONTEND_ROUTES,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';

interface SettingsNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  section?: 'admin';
}

function getSettingsNavItems(role?: string): SettingsNavItem[] {
  const items: SettingsNavItem[] = [
    {
      href: FRONTEND_ROUTES.SETTINGS.PROFILE,
      label: '내 프로필',
      icon: <User className="h-4 w-4" aria-hidden="true" />,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.NOTIFICATIONS,
      label: '알림 설정',
      icon: <Bell className="h-4 w-4" aria-hidden="true" />,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.DISPLAY,
      label: '표시 설정',
      icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  if (role && isTechnicalManagerOrAbove(role as UserRole)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_CALIBRATION,
      label: '교정 알림 설정',
      icon: <Calendar className="h-4 w-4" aria-hidden="true" />,
      section: 'admin',
    });
  }

  if (role && hasPermission(role as UserRole, Permission.MANAGE_SYSTEM_SETTINGS)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_SYSTEM,
      label: '시스템 설정',
      icon: <Cog className="h-4 w-4" aria-hidden="true" />,
      section: 'admin',
    });
  }

  return items;
}

/**
 * 설정 네비게이션 (Client Component)
 *
 * cacheComponents 호환 아키텍처:
 * - layout.tsx: non-blocking (async 없음) → 정적 셸 즉시 프리렌더
 * - 이 컴포넌트: useSession()으로 역할 접근 + usePathname()으로 활성 경로 감지
 * - 인증 보장: middleware.ts에서 JWT 검증 → useSession()은 항상 세션 보유
 *
 * SSOT: SessionProvider(providers.tsx) → useSession() → role
 */
export function SettingsNavigationClient() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const pathname = usePathname();
  const navItems = getSettingsNavItems(userRole);
  const hasAdminSection = navItems.some((item) => item.section === 'admin');

  return (
    <nav className="lg:w-64 flex-shrink-0" aria-label="설정 네비게이션">
      <div className="sticky top-6">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const showSeparator =
              item.section === 'admin' && index > 0 && navItems[index - 1].section !== 'admin';

            return (
              <li key={item.href}>
                {showSeparator && (
                  <div className="my-4 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                        관리
                      </span>
                    </div>
                  </div>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'motion-safe:transition-[transform,background-color,color] motion-safe:duration-200 motion-reduce:transition-none',
                    'hover:translate-x-1',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full motion-safe:transition-[transform] motion-safe:duration-200 motion-reduce:transition-none',
                        isActive ? 'bg-primary-foreground/20 scale-110' : ''
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-reduce:transition-none',
                      isActive
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    )}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        {hasAdminSection && (
          <p className="mt-4 px-3 text-xs text-muted-foreground/60 leading-relaxed">
            관리 설정은 권한에 따라 표시됩니다
          </p>
        )}
      </div>
    </nav>
  );
}
