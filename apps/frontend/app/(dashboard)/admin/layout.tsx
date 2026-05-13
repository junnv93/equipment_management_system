import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getServerAuthSession, extractValidRole } from '@/lib/auth/server-session';
import { APPROVAL_ROLES } from '@equipment-management/shared-constants';

/**
 * AdminLayout — PPR-compatible defense-in-depth 1차 가드
 *
 * sync outer + async inner(Suspense) 패턴:
 *   - outer(sync): PPR 정적 셸 보존 — approvals/audit-logs Non-Blocking PPR가 살아있음
 *   - inner(async): 세션 검증 + APPROVAL_ROLES 가드 (1차)
 *   - page.tsx의 specific permission guard(2차)는 그대로 유지
 *
 * APPROVAL_ROLES: technical_manager / quality_manager / lab_manager / system_admin
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminRoleGuard>{children}</AdminRoleGuard>
    </Suspense>
  );
}

async function AdminRoleGuard({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = extractValidRole(session);
  if (!role || !APPROVAL_ROLES.includes(role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
