import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TeamListContent, TeamListSkeleton } from '@/components/teams/TeamListContent';
import { TeamPageHeader } from '@/components/teams/TeamPageHeader';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildTeamsPageRedirectUrl } from '@/lib/utils/role-filter-utils';
import {
  parseTeamFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/team-filter-utils';
import * as teamsApiServer from '@/lib/api/teams-api-server';
import { getPageContainerClasses } from '@/lib/design-tokens';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 팀 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Static Shell: 헤더 (즉시 렌더링, Client Component로 i18n)
 * ✅ Dynamic Hole: 팀 목록 (Suspense로 서버 스트리밍)
 */
export default function TeamsPage(props: PageProps) {
  return (
    <div className={getPageContainerClasses()}>
      {/* Static Shell: 페이지 헤더 (Client Component, i18n 사용) */}
      <TeamPageHeader />

      {/* Dynamic Hole: 팀 목록 */}
      <Suspense fallback={<TeamListSkeleton />}>
        <TeamListAsync searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function TeamListAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // 1️⃣ 역할별 기본 사이트 필터 적용 (서버 사이드 redirect)
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildTeamsPageRedirectUrl('/teams', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 2️⃣ 필터 파싱 (SSOT)
  const uiFilters = parseTeamFiltersFromSearchParams(searchParams);
  const apiFilters = convertFiltersToApiParams(uiFilters);

  // 3️⃣ 초기 데이터 서버 fetch (FCP 최적화)
  const initialData = await teamsApiServer.getTeamsList(apiFilters);

  return <TeamListContent initialData={initialData} initialFilters={uiFilters} />;
}

/**
 * 정적 메타데이터
 */
export const metadata: Metadata = {
  title: '팀 관리',
  description: '시험소 팀 목록을 조회하고 관리합니다. 팀별 멤버 및 장비 현황을 확인할 수 있습니다.',
  openGraph: {
    title: '장비 관리 - 팀 관리',
    description: '시험소 팀을 효율적으로 관리하세요.',
  },
};
