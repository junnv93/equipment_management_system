import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import DashboardLoading from './loading';
import { getServerAuthSession } from '@/lib/auth/server-session';
import {
  getDashboardSummary,
  getDashboardEquipmentByTeam,
  getDashboardOverdueCalibrations,
  getDashboardUpcomingCalibrations,
  getDashboardOverdueCheckouts,
  getDashboardEquipmentStatusStats,
} from '@/lib/api/dashboard-api-server';

/**
 * 대시보드 페이지 (PPR Non-Blocking 패턴)
 *
 * Architecture:
 * - Page: sync — 정적 셸 (Suspense fallback → CDN 즉시 제공)
 * - DashboardAsync: async — 동적 홀 (서버에서 스트리밍)
 * - DashboardClient: CSC — 클라이언트 상호작용
 *
 * 데이터 전략:
 * - 서버에서 Promise.allSettled로 6개 API 병렬 프리페치
 * - 개별 API 실패가 전체 대시보드를 차단하지 않음
 * - DashboardClient에서 placeholderData로 받아 React Query hydration
 * - recentActivities 제외 (백엔드가 항상 [] 반환)
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
  const teamId = undefined; // 초기 로드 시 teamId 없음 (URL params는 클라이언트에서 처리)

  // 세션이 없으면 초기 데이터 없이 클라이언트 렌더링
  if (!session?.user) {
    return <DashboardClient />;
  }

  // 6개 API 병렬 프리페치 (개별 실패 허용)
  const [
    summaryResult,
    equipmentByTeamResult,
    overdueCalibResult,
    upcomingCalibResult,
    overdueCheckoutsResult,
    statusStatsResult,
  ] = await Promise.allSettled([
    getDashboardSummary(teamId),
    getDashboardEquipmentByTeam(teamId),
    getDashboardOverdueCalibrations(teamId),
    getDashboardUpcomingCalibrations(30, teamId),
    getDashboardOverdueCheckouts(teamId),
    getDashboardEquipmentStatusStats(teamId),
  ]);

  return (
    <DashboardClient
      initialSummary={summaryResult.status === 'fulfilled' ? summaryResult.value : undefined}
      initialEquipmentByTeam={
        equipmentByTeamResult.status === 'fulfilled' ? equipmentByTeamResult.value : undefined
      }
      initialOverdueCalibrations={
        overdueCalibResult.status === 'fulfilled' ? overdueCalibResult.value : undefined
      }
      initialUpcomingCalibrations={
        upcomingCalibResult.status === 'fulfilled' ? upcomingCalibResult.value : undefined
      }
      initialOverdueCheckouts={
        overdueCheckoutsResult.status === 'fulfilled' ? overdueCheckoutsResult.value : undefined
      }
      initialEquipmentStatusStats={
        statusStatsResult.status === 'fulfilled' ? statusStatsResult.value : undefined
      }
    />
  );
}

export const metadata = {
  title: '대시보드 | 장비 관리 시스템',
  description: '역할별 맞춤형 대시보드 - 장비 현황, 승인 대기, 교정 일정 확인',
};
