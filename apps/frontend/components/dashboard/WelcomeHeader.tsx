'use client';

import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, Shield, ShieldCheck, Crown } from 'lucide-react';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import { DASHBOARD_WELCOME_TOKENS as T, getRoleBadgeClasses } from '@/lib/design-tokens';

interface WelcomeHeaderProps {
  className?: string;
}

// 역할 정보 정의 (label/description은 i18n에서 가져옴)
interface RoleInfo {
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  [URVal.TEST_ENGINEER]: User,
  [URVal.TECHNICAL_MANAGER]: Shield,
  [URVal.QUALITY_MANAGER]: ShieldCheck,
  [URVal.LAB_MANAGER]: ShieldCheck,
  [URVal.SYSTEM_ADMIN]: Crown,
};

function getRoleInfo(role: string): RoleInfo {
  const badge = getRoleBadgeClasses(role);
  const icon = ROLE_ICONS[role] || User;
  return { ...badge, icon };
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 14) return 'lunch';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

export function WelcomeHeader({ className }: WelcomeHeaderProps) {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.welcome');
  const locale = useLocale();

  if (status === 'loading') {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-9 w-72" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || t('defaultUser');
  const userRole = session?.user?.role?.toLowerCase() || 'user';
  const role = getRoleInfo(userRole);
  const RoleIcon = role.icon;

  const greetingKey = getGreetingKey();
  const roleLabel = t(`roles.${userRole}` as Parameters<typeof t>[0]);
  const roleDescription = t(`roleDescriptions.${userRole}` as Parameters<typeof t>[0]);

  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className={cn('space-y-2', className)} aria-label={t('ariaLabel')}>
      <h1 className={T.title}>
        {t(`greeting.${greetingKey}` as Parameters<typeof t>[0])},{' '}
        <span className="text-primary">{userName}</span>
        {t('suffix')}
      </h1>

      <div className={T.metaRow}>
        {/* 역할 배지 */}
        <Badge
          variant="secondary"
          className={cn(T.badgeLayout, role.bgColor, role.color)}
          aria-label={t('currentRole', { role: roleLabel })}
        >
          <RoleIcon className={T.roleIcon} aria-hidden="true" />
          <span>{roleLabel}</span>
        </Badge>

        {/* 온라인 상태 표시 */}
        <span className={T.onlineContainer}>
          <span className={T.onlineDot} aria-hidden="true" />
          <span className="sr-only">{t('onlineStatus')}</span>
          {t('online')}
        </span>

        {/* 구분선 */}
        <span className={T.divider} aria-hidden="true">
          |
        </span>

        {/* 날짜 */}
        <time dateTime={new Date().toISOString()} className={T.date}>
          {today}
        </time>
      </div>

      {/* 역할 설명 (작은 텍스트) — 모바일에서 QuickActionBar와 공존 시 공간 절약 */}
      <p className={cn(T.description, 'hidden sm:block')}>{roleDescription}</p>
    </div>
  );
}
