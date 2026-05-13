import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getServerAuthSession, extractValidRole } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';

/**
 * SoftwareLayout — PPR-compatible defense-in-depth 1차 가드
 *
 * sync outer + async inner(Suspense) 패턴:
 *   - outer(sync): PPR 정적 셸 보존 — software 섹션 Non-Blocking PPR 살아있음
 *   - inner(async): 세션 검증 + VIEW_TEST_SOFTWARE 권한 가드
 */
export default function SoftwareLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SoftwarePermissionGuard>{children}</SoftwarePermissionGuard>
    </Suspense>
  );
}

async function SoftwarePermissionGuard({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = extractValidRole(session);
  if (!role || !hasPermission(role, Permission.VIEW_TEST_SOFTWARE)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
