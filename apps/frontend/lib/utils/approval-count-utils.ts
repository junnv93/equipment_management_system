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
import {
  getSemanticContainerTextClasses,
  getSemanticBgLightClasses,
  type SemanticColorKey,
} from '@/lib/design-tokens/brand';
import type { ApprovalCategoryPriority } from '@/lib/config/dashboard-config';

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
  /** 카드 시각적 우선순위 — config의 approvalCategoryPriorities에서 파생 */
  priority: ApprovalCategoryPriority;
}

/**
 * 승인 카테고리 → 시맨틱 색상 매핑
 *
 * brand.ts의 SemanticColorKey를 사용하여 SSOT 체인 유지.
 * CSS 변수 → Tailwind → brand 헬퍼 체인으로 다크모드/사이트 테마 자동 대응.
 */
const CATEGORY_SEMANTIC_COLOR: Record<ApprovalCategory, SemanticColorKey> = {
  outgoing: 'repair', // 반출 → orange 계열
  incoming: 'ok', // 반입 → green 계열
  equipment: 'info', // 장비 → blue 계열
  calibration: 'ok', // 교정 → green 계열
  inspection: 'temporary', // 점검 → cyan 계열
  nonconformity: 'warning', // 부적합 → amber 계열
  disposal_review: 'critical', // 폐기 검토 → red 계열
  disposal_final: 'critical', // 폐기 승인 → red 계열
  plan_review: 'purple', // 계획 검토 → violet 계열
  plan_final: 'purple', // 계획 승인 → violet 계열
  software_validation: 'purple', // 소프트웨어 유효성 → purple 계열
};

const CATEGORY_COLORS: Record<ApprovalCategory, { color: string; bgColor: string }> =
  Object.fromEntries(
    Object.entries(CATEGORY_SEMANTIC_COLOR).map(([key, semanticKey]) => [
      key,
      {
        color: getSemanticContainerTextClasses(semanticKey),
        bgColor: getSemanticBgLightClasses(semanticKey),
      },
    ])
  ) as Record<ApprovalCategory, { color: string; bgColor: string }>;

/**
 * 역할별 대시보드 카드 카테고리 목록 생성
 *
 * ROLE_TABS + TAB_META + CATEGORY_COLORS에서 파생합니다.
 * 승인 관리 페이지 탭과 1:1 매핑되므로 클릭 시 정확한 탭으로 이동합니다.
 *
 * @param priorities - config의 approvalCategoryPriorities (미지정 카테고리는 'default')
 */
export function getDashboardApprovalCategories(
  role: string,
  approvalsRoute: string,
  t: (key: string) => string,
  priorities?: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>
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
      priority: priorities?.[tab] ?? 'default',
    };
  });
}
