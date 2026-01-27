import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TeamList, TeamListSkeleton } from '@/components/teams/TeamList';

/**
 * 팀 목록 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 메타데이터 및 정적 UI 처리
 * - Client Component(TeamList)에 인터랙션 위임
 * - loading.tsx로 라우트 전환 시 로딩 UI 제공
 *
 * 역할 참고:
 * - lab_manager: 시험소 내 팀 관리
 * - system_admin: 전체 팀 관리
 */
export default function TeamsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">팀 관리</h1>
        <p className="text-muted-foreground">
          시험소 팀을 관리하고 팀원 및 장비 현황을 확인합니다
        </p>
      </div>

      {/* 팀 목록 */}
      <Suspense fallback={<TeamListSkeleton />}>
        <TeamList />
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
