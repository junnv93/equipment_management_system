import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';

export default async function SoftwareLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role as UserRole, Permission.VIEW_TEST_SOFTWARE)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
