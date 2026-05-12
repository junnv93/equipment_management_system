import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { RejectionPresetsAdminClient } from '@/components/admin/rejection-presets/RejectionPresetsAdminClient';

/**
 * Admin: 반려 사유 프리셋 관리 페이지 (S-4).
 *
 * Server component — permission check 후 client component에 위임.
 * `Permission.MANAGE_SYSTEM_SETTINGS` 미보유 시 dashboard로 redirect.
 */
export default async function RejectionPresetsAdminPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role as UserRole, Permission.MANAGE_SYSTEM_SETTINGS)) {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin.rejectionPresets');

  return (
    <div className="space-y-6">
      <div className={PAGE_HEADER_TOKENS.titleGroup}>
        <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
      </div>
      <RejectionPresetsAdminClient />
    </div>
  );
}
