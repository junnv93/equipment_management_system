import { useMemo } from 'react';
import { daysBetween } from '@/lib/utils/date';
import type {
  ApprovalItem,
  ApprovalCategory,
  PendingCountsByCategory,
} from '@/lib/api/approvals-api';

interface ApprovalKpiData {
  /** 역할 기반 전체 대기 건수 */
  totalPending: number;
  /** 현재 카테고리에서 8일+ 경과 건수 */
  urgentCount: number;
  /** 현재 카테고리 평균 대기일 */
  avgWaitDays: number;
  /** 오늘 처리 건수 (v1: 미지원 — 백엔드 엔드포인트 부재) */
  todayProcessed: number | null;
}

/**
 * 승인 KPI 스트립 데이터 훅
 *
 * 신규 쿼리 없음 — 기존 pendingCounts + pendingItems에서 파생
 */
export function useApprovalKpi(
  pendingCounts: PendingCountsByCategory | undefined,
  currentItems: ApprovalItem[],
  availableTabs: ApprovalCategory[]
): ApprovalKpiData {
  return useMemo(() => {
    // 1. totalPending: 역할 기반 카테고리 합산
    const totalPending = availableTabs.reduce((sum, tab) => {
      return sum + (pendingCounts?.[tab] ?? 0);
    }, 0);

    // 2. urgentCount: 현재 카테고리 아이템 중 8일+ 경과
    const urgentCount = currentItems.filter((item) => daysBetween(item.requestedAt) >= 8).length;

    // 3. avgWaitDays: 현재 카테고리 평균 경과일
    const avgWaitDays =
      currentItems.length > 0
        ? Math.round(
            currentItems.reduce((sum, item) => sum + daysBetween(item.requestedAt), 0) /
              currentItems.length
          )
        : 0;

    // 4. todayProcessed: v1 미지원
    const todayProcessed = null;

    return { totalPending, urgentCount, avgWaitDays, todayProcessed };
  }, [pendingCounts, currentItems, availableTabs]);
}
