'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, Shield, ShieldCheck, Crown } from 'lucide-react';
import { DASHBOARD_ROLE_BADGES } from '@/lib/design-tokens';

interface WelcomeHeaderProps {
  className?: string;
}

// 역할 정보 정의 (label/description은 i18n에서 가져옴)
interface RoleInfo {
  color: string;
  bgColor: string;
  icon: React.ElementType;
}

const roleInfo: Record<string, RoleInfo> = {
  test_engineer: { ...DASHBOARD_ROLE_BADGES.test_engineer, icon: User },
  technical_manager: { ...DASHBOARD_ROLE_BADGES.technical_manager, icon: Shield },
  quality_manager: { ...DASHBOARD_ROLE_BADGES.quality_manager, icon: ShieldCheck },
  lab_manager: { ...DASHBOARD_ROLE_BADGES.lab_manager, icon: ShieldCheck },
  system_admin: { ...DASHBOARD_ROLE_BADGES.system_admin, icon: Crown },
  admin: { ...DASHBOARD_ROLE_BADGES.admin, icon: Crown },
  user: { ...DASHBOARD_ROLE_BADGES.user, icon: User },
};

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
  const role = roleInfo[userRole] || roleInfo['user'];
  const RoleIcon = role.icon;

  const greetingKey = getGreetingKey();
  const roleLabel = t(`roles.${userRole}` as Parameters<typeof t>[0]);
  const roleDescription = t(`roleDescriptions.${userRole}` as Parameters<typeof t>[0]);

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className={cn('space-y-2', className)} role="banner" aria-label={t('ariaLabel')}>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {t(`greeting.${greetingKey}` as Parameters<typeof t>[0])},{' '}
        <span className="text-primary">{userName}</span>
        {t('suffix')}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        {/* 역할 배지 */}
        <Badge
          variant="secondary"
          className={cn('flex items-center gap-1.5 py-1 px-2.5', role.bgColor, role.color)}
          aria-label={t('currentRole', { role: roleLabel })}
        >
          <RoleIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{roleLabel}</span>
        </Badge>

        {/* 온라인 상태 표시 */}
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-ul-green" aria-hidden="true" />
          <span className="sr-only">{t('onlineStatus')}</span>
          {t('online')}
        </span>

        {/* 구분선 */}
        <span className="hidden sm:inline text-muted-foreground/30" aria-hidden="true">
          |
        </span>

        {/* 날짜 */}
        <time dateTime={new Date().toISOString()} className="text-sm text-muted-foreground">
          {today}
        </time>
      </div>

      {/* 역할 설명 (작은 텍스트) */}
      <p className="text-xs text-muted-foreground/70 hidden md:block leading-relaxed">
        {roleDescription}
      </p>
    </div>
  );
}
