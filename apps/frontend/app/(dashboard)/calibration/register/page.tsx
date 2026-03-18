import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { CalibrationRegisterContent } from './CalibrationRegisterContent';
import { getPageContainerClasses } from '@/lib/design-tokens';

export default async function CalibrationRegisterPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, Permission.CREATE_CALIBRATION)) {
    redirect('/dashboard');
  }

  return (
    <Suspense
      fallback={
        <div className={getPageContainerClasses('centered')}>
          <p className="text-muted-foreground">교정 등록 페이지를 불러오는 중...</p>
        </div>
      }
    >
      <CalibrationRegisterContent />
    </Suspense>
  );
}
