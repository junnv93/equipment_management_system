'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { User, Bell, Monitor, Calendar, Cog } from 'lucide-react';
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
      icon: <User className="h-4 w-4" />,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.NOTIFICATIONS,
      label: '알림 설정',
      icon: <Bell className="h-4 w-4" />,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.DISPLAY,
      label: '표시 설정',
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  if (role && isTechnicalManagerOrAbove(role as UserRole)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_CALIBRATION,
      label: '교정 알림 설정',
      icon: <Calendar className="h-4 w-4" />,
      section: 'admin',
    });
  }

  if (role && hasPermission(role as UserRole, Permission.MANAGE_SYSTEM_SETTINGS)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_SYSTEM,
      label: '시스템 설정',
      icon: <Cog className="h-4 w-4" />,
      section: 'admin',
    });
  }

  return items;
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const navItems = getSettingsNavItems(userRole);

  const hasAdminSection = navItems.some((item) => item.section === 'admin');

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <nav className="md:w-56 flex-shrink-0" aria-label="설정 네비게이션">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const showSeparator =
                item.section === 'admin' && index > 0 && navItems[index - 1].section !== 'admin';

              return (
                <li key={item.href}>
                  {showSeparator && <div className="my-2 border-t border-border" />}
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                      'motion-safe:transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {hasAdminSection && (
            <p className="mt-1 px-3 text-xs text-muted-foreground/60">
              관리 설정은 권한에 따라 표시됩니다
            </p>
          )}
        </nav>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
