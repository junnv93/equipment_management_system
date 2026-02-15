import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TeamDetailLoading from './loading';

/**
 * Next.js 16 PageProps 타입
 * params는 Promise로 반환됨
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 팀 상세 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - params는 Promise이므로 await 필수
 * - UUID 형식 검증 (하드코딩된 팀 ID 제거)
 * - Client Component(TeamDetailWrapper)에 데이터 fetch 위임
 */
export default async function TeamDetailPage(props: PageProps) {
  const { id } = await props.params;

  // UUID 형식 검증
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<TeamDetailLoading />}>
        <TeamDetailClient teamId={id} />
      </Suspense>
    </div>
  );
}

/**
 * 팀 상세 클라이언트 래퍼
 * Server Component에서 팀 ID를 받아 Client Component로 전달
 */
async function TeamDetailClient({ teamId }: { teamId: string }) {
  const { TeamDetailWrapper } = await import('@/components/teams/TeamDetailWrapper');
  return <TeamDetailWrapper teamId={teamId} />;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: `팀 상세 - ${id}`,
    description: '팀의 상세 정보, 팀원 및 장비 현황을 확인합니다.',
  };
}
