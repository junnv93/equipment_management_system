import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import DashboardLoading from './loading';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { getDashboardAggregate } from '@/lib/api/dashboard-api-server';

/**
 * 대시보드 페이지 (PPR Non-Blocking 패턴)
 *
 * Architecture:
 * - Page: sync — 정적 셸 (Suspense fallback → CDN 즉시 제공)
 * - DashboardAsync: async — 동적 홀 (서버에서 스트리밍)
 * - DashboardClient: CSC — 클라이언트 상호작용
 *
 * 데이터 전략:
 * - 서버에서 단일 /api/dashboard/aggregate 호출로 7개 데이터 일괄 프리페치
 * - 백엔드가 Promise.allSettled로 병렬 처리 → 부분 실패 허용
 * - HTTP 왕복 7 → 1 (JWT 파싱, DB 커넥션 오버헤드 대폭 감소)
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardAsync />
    </Suspense>
  );
}

async function DashboardAsync() {
  const session = await getServerAuthSession();

  // 세션이 없으면 초기 데이터 없이 클라이언트 렌더링
  if (!session?.user) {
    return <DashboardClient />;
  }

  // 단일 집계 요청 (7개 개별 요청 → 1개)
  // 실패 시 undefined로 처리 (클라이언트에서 TanStack Query로 재시도)
  let aggregate;
  try {
    aggregate = await getDashboardAggregate();
  } catch {
    // 집계 요청 전체 실패 시 클라이언트 렌더링으로 폴백
    return <DashboardClient />;
  }

  return (
    <DashboardClient
      initialSummary={aggregate.summary ?? undefined}
      initialEquipmentByTeam={aggregate.equipmentByTeam ?? undefined}
      initialOverdueCalibrations={aggregate.overdueCalibrations ?? undefined}
      initialUpcomingCalibrations={aggregate.upcomingCalibrations ?? undefined}
      initialOverdueCheckouts={aggregate.overdueCheckouts ?? undefined}
      initialEquipmentStatusStats={aggregate.equipmentStatusStats ?? undefined}
      initialRecentActivities={aggregate.recentActivities ?? undefined}
    />
  );
}

export const metadata = {
  title: '대시보드 | 장비 관리 시스템',
  description: '역할별 맞춤형 대시보드 - 장비 현황, 승인 대기, 교정 일정 확인',
};
