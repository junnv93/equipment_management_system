import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession, extractValidRole } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import { CalibrationRegisterContent } from './CalibrationRegisterContent';
import { RouteLoading } from '@/components/layout/RouteLoading';

export default async function CalibrationRegisterPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = extractValidRole(session);
  if (!role || !hasPermission(role, Permission.CREATE_CALIBRATION)) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<RouteLoading variant="detail" />}>
      <CalibrationRegisterContent />
    </Suspense>
  );
}
