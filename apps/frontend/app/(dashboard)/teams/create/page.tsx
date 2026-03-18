import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TeamForm } from '@/components/teams/TeamForm';
import { getPageContainerClasses, SUB_PAGE_HEADER_TOKENS } from '@/lib/design-tokens';

/**
 * 팀 등록 페이지 (Server Component)
 *
 * PPR 패턴:
 * - Page 함수는 sync (정적 셸: container)
 * - 헤더 + 폼은 Suspense 내부에서 비동기 렌더링 (동적 홀: i18n + TeamForm)
 *
 * 권한:
 * - technical_manager, lab_manager, system_admin만 접근 가능
 * - 클라이언트에서 권한 체크 후 리다이렉트
 */
export default function CreateTeamPage() {
  return (
    <div className={getPageContainerClasses('form')}>
      <Suspense fallback={<CreateTeamPageSkeleton />}>
        <CreateTeamContentAsync />
      </Suspense>
    </div>
  );
}

/** Suspense 내부 비동기 RSC — i18n + 헤더 + 폼 */
async function CreateTeamContentAsync() {
  const t = await getTranslations('teams');

  return (
    <>
      {/* 헤더 */}
      <div className={SUB_PAGE_HEADER_TOKENS.container}>
        <Button variant="outline" size="icon" asChild>
          <Link href="/teams" aria-label={t('create.backToList')}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className={SUB_PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{t('create.title')}</h1>
          <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{t('create.description')}</p>
        </div>
      </div>

      {/* 폼 */}
      <TeamForm mode="create" />
    </>
  );
}

/**
 * 페이지 전체 스켈레톤 (헤더 + 폼)
 */
function CreateTeamPageSkeleton() {
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

export const metadata: Metadata = {
  title: '팀 등록',
  description: '새로운 팀을 등록합니다.',
};
