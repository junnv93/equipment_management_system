/**
 * 승인 카운트 SSOT 유틸리티
 *
 * 네비 뱃지, 대시보드 카드, 승인 관리 페이지 3곳이
 * 동일한 카운트 데이터(PendingCountsByCategory)를 사용하도록 보장합니다.
 *
 * SSOT 체인:
 *   Backend: ApprovalsService.getPendingCountsByRole()
 *     → API: GET /api/approvals/counts
 *       → Frontend Query Key: queryKeys.approvals.counts(role)
 *         → 이 유틸리티가 역할별 총합 계산
 */

import type { UserRole } from '@equipment-management/schemas';
import {
  ROLE_TABS,
  TAB_META,
  type ApprovalCategory,
  type PendingCountsByCategory,
} from '@/lib/api/approvals-api';

/**
 * 역할별 승인 대기 총합 계산
 *
 * ROLE_TABS에 정의된 해당 역할의 가시 탭 카운트만 합산합니다.
 * 이렇게 하면 네비 뱃지 = 대시보드 카드 합계 = 승인 페이지 탭 합계 가 보장됩니다.
 */
export function computeApprovalTotal(
  counts: PendingCountsByCategory | undefined,
  role: string | undefined
): number {
  if (!counts || !role) return 0;

  const tabs = ROLE_TABS[role as UserRole] || [];
  return tabs.reduce((sum, tab) => sum + (counts[tab] || 0), 0);
}

/**
 * 대시보드 카드용 카테고리 메타 정보
 *
 * ROLE_TABS + TAB_META에서 파생되므로 별도 카테고리 목록 정의가 불필요합니다.
 */
export interface DashboardApprovalCategory {
  key: ApprovalCategory;
  label: string;
  href: string;
  color: string;
  bgColor: string;
}

const CATEGORY_COLORS: Record<ApprovalCategory, { color: string; bgColor: string }> = {
  outgoing: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  incoming: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  equipment: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  calibration: {
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  inspection: {
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  nonconformity: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  disposal_review: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  disposal_final: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  plan_review: {
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  plan_final: {
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  software: {
    color: 'text-pink-700 dark:text-pink-300',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
};

/**
 * 역할별 대시보드 카드 카테고리 목록 생성
 *
 * ROLE_TABS + TAB_META + CATEGORY_COLORS에서 파생합니다.
 * 승인 관리 페이지 탭과 1:1 매핑되므로 클릭 시 정확한 탭으로 이동합니다.
 */
export function getDashboardApprovalCategories(
  role: string,
  approvalsRoute: string,
  t: (key: string) => string
): DashboardApprovalCategory[] {
  const tabs = ROLE_TABS[role as UserRole] || [];

  return tabs.map((tab) => {
    const meta = TAB_META[tab];
    const colors = CATEGORY_COLORS[tab];

    return {
      key: tab,
      label: t(meta.labelKey),
      href: `${approvalsRoute}?tab=${tab}`,
      color: colors.color,
      bgColor: colors.bgColor,
    };
  });
}
