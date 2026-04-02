import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import MonitoringDashboardClient from '@/components/monitoring/MonitoringDashboardClient';

export default async function MonitoringPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role as UserRole, Permission.MANAGE_SYSTEM_SETTINGS)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('monitoring');

  return (
    <div className="space-y-6">
      <div className={PAGE_HEADER_TOKENS.titleGroup}>
        <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
      </div>
      <MonitoringDashboardClient />
    </div>
  );
}
