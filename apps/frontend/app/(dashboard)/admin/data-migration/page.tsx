import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { type UserRole } from '@equipment-management/schemas';
import { Permission, hasPermission } from '@equipment-management/shared-constants';
import EquipmentMigrationWizard from '@/components/data-migration/EquipmentMigrationWizard';

export default async function DataMigrationPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role as UserRole, Permission.PERFORM_DATA_MIGRATION)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('data-migration');

  return (
    <div className="space-y-6">
      <div className={PAGE_HEADER_TOKENS.titleGroup}>
        <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
      </div>
      <EquipmentMigrationWizard />
    </div>
  );
}
