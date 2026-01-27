import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TeamDetail } from '@/components/teams/TeamDetail';
import TeamDetailLoading from './loading';

/**
 * Next.js 16 PageProps 타입
 * params는 Promise로 반환됨
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 팀 상세 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - params는 Promise이므로 await 필수
 * - Server Component에서 초기 데이터 fetch
 * - Client Component(TeamDetail)에 데이터 전달
 *
 * 참고: 현재 백엔드가 메모리 저장소를 사용하므로
 * Server Side fetch 대신 Client에서 직접 호출
 */
export default async function TeamDetailPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise이므로 await 필수
  const { id } = await props.params;

  // 유효한 팀 ID 확인 (rf, sar, emc, auto)
  const validTeamIds = ['rf', 'sar', 'emc', 'auto'];
  if (!validTeamIds.includes(id.toLowerCase())) {
    // 숫자 ID도 허용 (레거시 지원)
    if (!/^\d+$/.test(id)) {
      notFound();
    }
  }

  // 현재는 Client Component에서 데이터를 fetch하도록 구성
  // 추후 Server API 구현 시 여기서 초기 데이터를 fetch할 수 있음
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
  // 동적 import로 Client Component 로드
  const { TeamDetailWrapper } = await import('@/components/teams/TeamDetailWrapper');
  return <TeamDetailWrapper teamId={teamId} />;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  // 팀 유형별 기본 이름
  const teamNames: Record<string, string> = {
    rf: 'RF 테스트팀',
    sar: 'SAR 테스트팀',
    emc: 'EMC 테스트팀',
    auto: 'Automotive 테스트팀',
  };

  const teamName = teamNames[id.toLowerCase()] || `팀 ${id}`;

  return {
    title: `${teamName} - 팀 상세`,
    description: `${teamName}의 상세 정보, 팀원 및 장비 현황을 확인합니다.`,
  };
}
