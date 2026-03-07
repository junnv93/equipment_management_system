import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import DashboardLoading from './loading';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { getDashboardAggregate } from '@/lib/api/dashboard-api-server';
import { DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE } from '@/lib/config/dashboard-config';
import { resolveDashboardScope } from '@/lib/utils/dashboard-scope';

/**
 * 대시보드 페이지 (PPR Non-Blocking 패턴)
 *
 * Architecture:
 * - Page: sync — 정적 셸 (Suspense fallback → CDN 즉시 제공)
 * - DashboardAsync: async — 동적 홀 (서버에서 스트리밍)
 * - DashboardClient: CSC — 클라이언트 상호작용
 *
 * 데이터 전략:
 * - 서버에서 단일 /api/dashboard/aggregate 호출로 8개 데이터 일괄 프리페치
 * - resolveDashboardScope()로 SSR 스코프를 결정하여 클라이언트와 동일한 범위 보장
 * - 백엔드가 Promise.allSettled로 병렬 처리 → 부분 실패 허용
 */
export default function DashboardPage(props: { searchParams: Promise<{ teamId?: string }> }) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

async function DashboardAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ teamId?: string }>;
}) {
  const [session, searchParams] = await Promise.all([getServerAuthSession(), searchParamsPromise]);

  // 세션이 없으면 초기 데이터 없이 클라이언트 렌더링
  if (!session?.user) {
    return <DashboardClient />;
  }

  // SSR도 클라이언트와 동일한 scope 결정 로직 적용
  const userRole = session.user.role?.toLowerCase() || DEFAULT_ROLE;
  const roleConfig = DASHBOARD_ROLE_CONFIG[userRole] || DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  const scope = resolveDashboardScope(
    roleConfig.controlCenter.kpiDisplay,
    roleConfig.controlCenter.requiresTeamScope,
    session.user.site,
    session.user.teamId,
    searchParams.teamId
  );

  // 단일 집계 요청 — scope.teamId로 클라이언트와 동일한 범위 조회
  let aggregate;
  try {
    aggregate = await getDashboardAggregate(scope.teamId);
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
      initialUpcomingCheckoutReturns={aggregate.upcomingCheckoutReturns ?? undefined}
    />
  );
}

export const metadata = {
  title: '대시보드 | 장비 관리 시스템',
  description: '역할별 맞춤형 대시보드 - 장비 현황, 승인 대기, 교정 일정 확인',
};
