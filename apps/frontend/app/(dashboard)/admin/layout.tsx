import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { APPROVAL_ROLES } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';

/**
 * Admin Layout — defense-in-depth 1차 가드
 *
 * APPROVAL_ROLES(technical_manager/quality_manager/lab_manager/system_admin)에
 * 속하지 않는 사용자는 dashboard로 redirect.
 * 각 page.tsx의 specific permission guard(2차 가드)는 그대로 유지.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;

  if (!APPROVAL_ROLES.includes(userRole)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
