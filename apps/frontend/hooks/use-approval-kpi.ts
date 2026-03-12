import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApprovalCategory, PendingCountsByCategory } from '@/lib/api/approvals-api';
import { approvalsApi } from '@/lib/api/approvals-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';

interface ApprovalKpiData {
  /** 역할 기반 전체 대기 건수 (counts에서 파생) */
  totalPending: number;
  /** 현재 카테고리에서 URGENT_THRESHOLD_DAYS 이상 경과 건수 (서버 집계) */
  urgentCount: number;
  /** 현재 카테고리 평균 대기일 (서버 집계) */
  avgWaitDays: number;
  /** 오늘 처리 건수 (서버 집계) */
  todayProcessed: number | null;
}

/**
 * 승인 KPI 스트립 데이터 훅 — 서버 사이드 집계 소비자
 *
 * 변경 이력:
 * - Before: urgentCount/avgWaitDays를 클라이언트에서 전체 아이템 리스트로 계산
 * - After: 서버 SQL 집계 (COUNT FILTER + AVG) → 페이지네이션에 무관한 정확한 값
 *
 * SSOT:
 * - totalPending: counts API에서 파생 (카테고리별 합산)
 * - urgentCount/avgWaitDays/todayProcessed: GET /api/approvals/kpi?category=X 서버 집계
 * - 긴급 임계값: @equipment-management/shared-constants의 APPROVAL_KPI.URGENT_THRESHOLD_DAYS
 */
export function useApprovalKpi(
  pendingCounts: PendingCountsByCategory | undefined,
  activeCategory: ApprovalCategory | undefined,
  availableTabs: ApprovalCategory[]
): ApprovalKpiData {
  const { data: kpiData } = useQuery({
    queryKey: queryKeys.approvals.kpi(activeCategory),
    queryFn: () => approvalsApi.getKpi(activeCategory),
    ...QUERY_CONFIG.DASHBOARD,
  });

  return useMemo(() => {
    // totalPending: 역할 기반 카테고리 합산 (counts API에서 파생)
    const totalPending = availableTabs.reduce((sum, tab) => {
      return sum + (pendingCounts?.[tab] ?? 0);
    }, 0);

    return {
      totalPending,
      urgentCount: kpiData?.urgentCount ?? 0,
      avgWaitDays: kpiData?.avgWaitDays ?? 0,
      todayProcessed: kpiData?.todayProcessed ?? null,
    };
  }, [pendingCounts, availableTabs, kpiData]);
}
