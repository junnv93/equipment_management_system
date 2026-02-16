import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerAuthSession } from '@/lib/auth/server-session';
import type { UserRole } from '@equipment-management/schemas';
import { APPROVAL_ROLES } from '@equipment-management/shared-constants';
import { ApprovalsClient } from '@/components/approvals/ApprovalsClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 승인 관리 통합 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Static Shell: 헤더 (즉시 렌더링)
 * ✅ Dynamic Hole: 세션 체크 + ApprovalsClient (Suspense로 서버 스트리밍)
 * ✅ SSOT FIX: getServerAuthSession() 사용 (getServerSession(authOptions) 대신)
 */

// ✅ Next.js 16: Static Metadata Export
export const metadata: Metadata = {
  title: '승인 관리 | 장비 관리 시스템',
  description: '장비, 교정, 반출 등 각종 승인 요청을 통합 관리합니다',
};

function ApprovalsLoadingFallback() {
  return (
    <div className="space-y-6">
      {/* 탭 스켈레톤 */}
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* 일괄 처리 바 스켈레톤 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* 목록 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApprovalsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="container mx-auto py-6">
      {/* Static Shell: 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">승인 관리</h1>
        <p className="text-muted-foreground">
          장비, 교정, 반출 등 각종 승인 요청을 통합 관리합니다
        </p>
      </div>

      {/* Dynamic Hole: 세션 체크 + 승인 클라이언트 */}
      <Suspense fallback={<ApprovalsLoadingFallback />}>
        <ApprovalsContentAsync searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * 비동기 세션 체크 + 승인 클라이언트 렌더링 (Suspense 내부에서 실행)
 */
async function ApprovalsContentAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : undefined;

  // ✅ SSOT: getServerAuthSession() 사용
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  const userId = session.user.id;
  const userTeamId = session.user.teamId;

  // 승인 권한이 없는 역할은 대시보드로 리다이렉트 (SSOT: APPROVAL_ROLES)
  if (!APPROVAL_ROLES.includes(userRole)) {
    redirect('/dashboard');
  }

  return (
    <ApprovalsClient
      userRole={userRole}
      userId={userId}
      userTeamId={userTeamId}
      initialTab={initialTab}
    />
  );
}
