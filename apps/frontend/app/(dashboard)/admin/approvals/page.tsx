import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { getTranslations } from 'next-intl/server';
import type { UserRole } from '@equipment-management/schemas';
import { APPROVAL_ROLES } from '@equipment-management/shared-constants';
import { ApprovalsClient } from '@/components/approvals/ApprovalsClient';
import { Skeleton } from '@/components/ui/skeleton';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

/**
 * 승인 관리 통합 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: i18n 헤더 + 세션 체크 + ApprovalsClient (Suspense로 서버 스트리밍)
 */

export const metadata: Metadata = {
  title: '승인 관리 | 장비 관리 시스템',
  description: '장비, 교정, 반출 등 각종 승인 요청을 통합 관리합니다',
};

function ApprovalsLoadingFallback() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="mb-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-64 mt-1" />
      </div>

      {/* KPI Strip skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-3 flex items-start gap-3 border-l-4 border-l-border"
          >
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar skeleton (lg+ only) */}
        <div className="hidden lg:block w-[220px] flex-shrink-0 space-y-2">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
          <Skeleton className="h-4 w-20 mt-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Bulk bar skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          {/* Row list skeleton */}
          <div className="border border-border rounded-lg overflow-hidden p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className={getPageContainerClasses()}>
      {/* Dynamic Hole: 헤더(i18n) + 세션 체크 + 승인 클라이언트 */}
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

  const t = await getTranslations('approvals');
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  const userId = session.user.id;
  const userTeamId = session.user.teamId;

  if (!APPROVAL_ROLES.includes(userRole)) {
    redirect('/dashboard');
  }

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <ApprovalsClient
        userRole={userRole}
        userId={userId}
        userTeamId={userTeamId}
        initialTab={initialTab}
      />
    </>
  );
}
