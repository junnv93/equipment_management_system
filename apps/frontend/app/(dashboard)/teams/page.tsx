import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TeamListContent, TeamListSkeleton } from '@/components/teams/TeamListContent';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildTeamsPageRedirectUrl } from '@/lib/utils/role-filter-utils';
import {
  parseTeamFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/team-filter-utils';
import * as teamsApiServer from '@/lib/api/teams-api-server';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 팀 목록 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 메타데이터 및 초기 데이터 fetch
 * - Client Component(TeamListContent)에 initialData props 전달
 * - placeholderData로 서버 데이터를 stale 처리 → 백그라운드 refetch 보장
 *
 * 역할별 사이트 필터:
 * - test_engineer, technical_manager, lab_manager: 사이트 필터 자동 적용
 * - quality_manager: 필터 없음 (교차 사이트 검토)
 *
 * SSOT 원칙:
 * - URL 파라미터가 유일한 진실의 소스
 * - team-filter-utils.ts에서 모든 필터 파싱/변환 로직 관리
 */
export default async function TeamsPage(props: PageProps) {
  const searchParams = await props.searchParams;

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
        <p className="text-muted-foreground">시험소 팀을 관리하고 팀원 및 장비 현황을 확인합니다</p>
      </div>

      {/* 팀 목록 */}
      <Suspense fallback={<TeamListSkeleton />}>
        <TeamListContent initialData={initialData} initialFilters={uiFilters} />
      </Suspense>
    </div>
  );
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
