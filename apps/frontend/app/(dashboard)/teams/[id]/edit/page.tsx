import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * Next.js 16 PageProps 타입
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 팀 수정 페이지 (Server Component)
 *
 * PPR 패턴:
 * - Page 함수는 sync (정적 셸: 제목 + 설명)
 * - await params는 Suspense 자식 내부에서 수행 (동적 홀: 뒤로가기 링크 + 폼)
 *
 * 권한:
 * - technical_manager, lab_manager, system_admin만 수정 가능
 */
export default function EditTeamPage(props: PageProps) {
  return (
    <div className={getPageContainerClasses('form')}>
      <Suspense fallback={<EditTeamPageSkeleton />}>
        <EditTeamContentAsync paramsPromise={props.params} />
      </Suspense>
    </div>
  );
}

/** Suspense 내부 비동기 RSC — params await + UUID 검증 + 헤더 + 폼 */
async function EditTeamContentAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  // UUID 형식 검증
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const t = await getTranslations('teams');

  return (
    <>
      {/* 헤더 */}
      <PageHeader
        title={t('edit.title')}
        subtitle={t('edit.description')}
        backUrl={`/teams/${id}`}
        backLabel={t('edit.backToDetail')}
      />

      {/* 폼 (Client Component) */}
      <EditTeamFormWrapper teamId={id} />
    </>
  );
}

/**
 * 팀 수정 폼 래퍼
 */
async function EditTeamFormWrapper({ teamId }: { teamId: string }) {
  const { EditTeamFormClient } = await import('@/components/teams/EditTeamFormClient');
  return <EditTeamFormClient teamId={teamId} />;
}

/**
 * 페이지 전체 스켈레톤 (헤더 + 폼)
 */
function EditTeamPageSkeleton() {
  return (
    <>
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      {/* 폼 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * 동적 메타데이터
 */
export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  const t = await getTranslations('teams');
  return {
    title: t('edit.title'),
    description: t('edit.description'),
  };
}
