/**
 * 교정 승인 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { hasPermission, Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';
import CalibrationApprovalsContent from './CalibrationApprovalsContent';

export default async function CalibrationApprovalsPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, Permission.APPROVE_CALIBRATION)) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <CalibrationApprovalsContent />
    </Suspense>
  );
}
