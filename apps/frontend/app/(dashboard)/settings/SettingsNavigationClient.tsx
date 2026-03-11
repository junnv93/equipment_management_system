'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Bell, Monitor, Calendar, Cog, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  isTechnicalManagerOrAbove,
  hasPermission,
  Permission,
  FRONTEND_ROUTES,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import {
  SETTINGS_NAV_TOKENS,
  getSettingsNavItemClasses,
  getSettingsNavIconCircleClasses,
  getSettingsNavChevronClasses,
} from '@/lib/design-tokens';

interface SettingsNavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  section?: 'admin';
}

function getSettingsNavItems(role?: string): SettingsNavItem[] {
  const items: SettingsNavItem[] = [
    {
      href: FRONTEND_ROUTES.SETTINGS.PROFILE,
      labelKey: 'nav.profile',
      icon: User,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.NOTIFICATIONS,
      labelKey: 'nav.notifications',
      icon: Bell,
    },
    {
      href: FRONTEND_ROUTES.SETTINGS.DISPLAY,
      labelKey: 'nav.display',
      icon: Monitor,
    },
  ];

  if (role && isTechnicalManagerOrAbove(role as UserRole)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_CALIBRATION,
      labelKey: 'nav.calibration',
      icon: Calendar,
      section: 'admin',
    });
  }

  if (role && hasPermission(role as UserRole, Permission.MANAGE_SYSTEM_SETTINGS)) {
    items.push({
      href: FRONTEND_ROUTES.SETTINGS.ADMIN_SYSTEM,
      labelKey: 'nav.system',
      icon: Cog,
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
 * - i18n: useTranslations('settings')으로 다국어 지원
 *
 * SSOT: SessionProvider(providers.tsx) → useSession() → role
 * Design Token: SETTINGS_NAV_TOKENS (settings.ts)
 */
export function SettingsNavigationClient() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const pathname = usePathname();
  const t = useTranslations('settings');
  const navItems = getSettingsNavItems(userRole);
  const hasAdminSection = navItems.some((item) => item.section === 'admin');

  return (
    <nav className={SETTINGS_NAV_TOKENS.container} aria-label={t('title')}>
      <div className={SETTINGS_NAV_TOKENS.stickyWrapper}>
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isFirstItem = index === 0;
            const showAdminSeparator =
              item.section === 'admin' && index > 0 && navItems[index - 1].section !== 'admin';

            return (
              <li key={item.href}>
                {isFirstItem && (
                  <p className={SETTINGS_NAV_TOKENS.sectionLabel}>{t('nav.personalSection')}</p>
                )}
                {showAdminSeparator && (
                  <div className={SETTINGS_NAV_TOKENS.adminSeparator}>
                    <p className={SETTINGS_NAV_TOKENS.adminSectionLabel}>{t('nav.adminSection')}</p>
                  </div>
                )}
                <Link
                  href={item.href}
                  className={getSettingsNavItemClasses(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className={getSettingsNavIconCircleClasses(isActive)}>
                      <Icon className={SETTINGS_NAV_TOKENS.icon} aria-hidden="true" />
                    </span>
                    <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
                  </div>
                  <ChevronRight
                    className={getSettingsNavChevronClasses(isActive)}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        {hasAdminSection && <p className={SETTINGS_NAV_TOKENS.adminHelp}>{t('nav.adminHelp')}</p>}
      </div>
    </nav>
  );
}
