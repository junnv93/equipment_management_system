import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeamForm } from '@/components/teams/TeamForm';
import { PageHeader } from '@/components/shared/PageHeader';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { CreateTeamPageSkeleton } from './CreateTeamPageSkeleton';

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
    <Suspense fallback={<CreateTeamPageSkeleton />}>
      <CreateTeamContentAsync />
    </Suspense>
  );
}

/** Suspense 내부 비동기 RSC — i18n + 헤더 + 폼 */
async function CreateTeamContentAsync() {
  const t = await getTranslations('teams');

  return (
    <div className={getPageContainerClasses('form')}>
      {/* 헤더 */}
      <PageHeader
        title={t('create.title')}
        subtitle={t('create.description')}
        backUrl="/teams"
        backLabel={t('create.backToList')}
      />

      {/* 폼 */}
      <TeamForm mode="create" />
    </div>
  );
}

export const metadata: Metadata = {
  title: '팀 등록',
  description: '새로운 팀을 등록합니다.',
};
