import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { CalibrationRegisterContent } from './CalibrationRegisterContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default async function CalibrationRegisterPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;
  if (typeof role !== 'string' || !hasPermission(role as UserRole, Permission.CREATE_CALIBRATION)) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<RouteLoading variant="detail" />}>
      <CalibrationRegisterContent />
    </Suspense>
  );
}
