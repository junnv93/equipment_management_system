/**
 * Navigation Configuration (SSOT)
 *
 * 데스크톱 사이드바/모바일 드로어 공유 네비게이션 설정
 * - 아이콘: LucideIcon 컴포넌트 참조 (JSX 아님) — 렌더링 측에서 sizing 적용
 * - 섹션 그룹핑: 3개 섹션 (운영/관리/시스템)
 * - Permission 기반 필터링 (역할 하드코딩 없음)
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package2,
  FileSpreadsheet,
  ClipboardCheck,
  CheckSquare,
  Users,
  Settings,
  FileText,
  FileSearch,
  AlertTriangle,
  Upload,
  Activity,
  Monitor,
  Cable,
} from 'lucide-react';
import {
  FRONTEND_ROUTES,
  Permission,
  hasPermission,
  CHECKOUT_QUERY_PARAMS,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { hasApprovalPermissions } from '@/lib/utils/permission-helpers';
import { computeApprovalTotal } from '@/lib/utils/approval-count-utils';
import type { PendingCountsByCategory } from '@/lib/api/approvals-api';

/** 배지 데이터 소스 식별자 */
export type NavBadgeSourceKey = 'approvals' | 'checkouts-your-turn';

/** 보조 anchor의 aria-label i18n 키 (navigation namespace). */
export type NavSecondaryActionAriaKey = 'layout.checkoutYourTurnAria';

/** 메인 anchor의 aria-label i18n 키 (navigation namespace). */
export type NavSecondaryActionPrimaryAriaKey = 'layout.checkoutOpenList';

/**
 * 배지 설정 — discriminated union으로 분기 silent break 방지
 *
 * - `count`: 단순 카운트 배지만 표시 (메인 anchor 안에 span)
 * - `count-with-action`: 카운트 배지가 별도 보조 anchor로 동작 (필터 뷰 진입)
 *
 * 메모리 교훈: optional prop 분기는 silent break 위험 (GuidanceCallout ctaKind와 동일).
 * `kind` 필드로 명시화하여 caller가 누락 분기를 못하도록 강제.
 */
export type NavItemBadgeConfig =
  | { kind: 'count'; sourceKey: NavBadgeSourceKey }
  | {
      kind: 'count-with-action';
      sourceKey: NavBadgeSourceKey;
      action: {
        /** URL query param 이름 (CHECKOUT_QUERY_PARAMS 등 SSOT 경유) */
        queryParam: string;
        /** URL query 값 (CHECKOUT_QUERY_PARAMS.VIEW_VALUES 등 SSOT 경유) */
        queryValue: string;
        /** 보조 anchor의 aria-label i18n 키 (ICU `{count}` 지원) */
        ariaKey: NavSecondaryActionAriaKey;
        /**
         * 메인 anchor의 aria-label i18n 키.
         * 보조 anchor와 의미 구분을 위해 명시 (예: 메인은 "전체 목록", 보조는 "내 차례 N건").
         * sibling anchor 패턴에서 SR이 두 link의 의도를 즉시 구별하도록.
         */
        primaryAriaKey: NavSecondaryActionPrimaryAriaKey;
      };
    };

/** 정적 네비게이션 아이템 설정 */
export interface NavItemConfig {
  icon: LucideIcon;
  href: string;
  /** i18n 키 (navigation 네임스페이스) */
  labelKey: string;
  requiredPermission: Permission | null;
  /** 배지 + 선택적 보조 액션 (count-with-action일 때만 보조 anchor 렌더) */
  badge?: NavItemBadgeConfig;
}

/** 정적 섹션 설정 */
export interface NavSection {
  /** i18n 키 (navigation.sections.*) */
  sectionKey: string;
  items: NavItemConfig[];
}

/**
 * 보조 액션 (정규화된 형태) — caller가 즉시 사용 가능
 *
 * sibling anchor 패턴에서 두 anchor의 SR 안내가 명료하도록 양쪽 i18n 키를 모두 정규화.
 */
export interface FilteredNavSecondaryAction {
  href: string;
  /** 보조 anchor aria-label i18n 키 */
  ariaKey: NavSecondaryActionAriaKey;
  /** 메인 anchor aria-label i18n 키 (보조 anchor와 의미 구분) */
  primaryAriaKey: NavSecondaryActionPrimaryAriaKey;
}

/** 필터링/번역 완료된 네비게이션 아이템 */
export interface FilteredNavItem {
  icon: LucideIcon;
  href: string;
  label: string;
  badge?: number;
  /** 배지 클릭 시 이동할 보조 액션 (count-with-action 분기에서만 채워짐) */
  secondaryAction?: FilteredNavSecondaryAction;
}

/** 필터링/번역 완료된 섹션 */
export interface FilteredNavSection {
  sectionLabel: string;
  items: FilteredNavItem[];
}

/**
 * 정적 네비게이션 섹션 설정
 *
 * 순서: 운영 → 관리 → 시스템
 * Notifications 제거: 헤더 NotificationsDropdown으로 통합 (이슈 #6)
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: 'sections.operations',
    items: [
      {
        icon: LayoutDashboard,
        href: FRONTEND_ROUTES.DASHBOARD,
        labelKey: 'dashboard',
        requiredPermission: null,
      },
      {
        icon: Package2,
        href: FRONTEND_ROUTES.EQUIPMENT.LIST,
        labelKey: 'equipment',
        requiredPermission: Permission.VIEW_EQUIPMENT,
      },
      {
        icon: ClipboardCheck,
        href: FRONTEND_ROUTES.CHECKOUTS.LIST,
        labelKey: 'checkouts',
        requiredPermission: Permission.VIEW_CHECKOUTS,
        badge: {
          kind: 'count-with-action',
          sourceKey: 'checkouts-your-turn',
          action: {
            queryParam: CHECKOUT_QUERY_PARAMS.VIEW,
            queryValue: CHECKOUT_QUERY_PARAMS.VIEW_VALUES.YOUR_TURN,
            ariaKey: 'layout.checkoutYourTurnAria',
            primaryAriaKey: 'layout.checkoutOpenList',
          },
        },
      },
      {
        icon: FileSpreadsheet,
        href: FRONTEND_ROUTES.CALIBRATION.LIST,
        labelKey: 'calibration',
        requiredPermission: Permission.VIEW_CALIBRATIONS,
      },
      {
        icon: FileText,
        href: FRONTEND_ROUTES.CALIBRATION_PLANS.LIST,
        labelKey: 'calibrationPlans',
        requiredPermission: Permission.VIEW_CALIBRATION_PLANS,
      },
      {
        icon: AlertTriangle,
        href: FRONTEND_ROUTES.NON_CONFORMANCES.LIST,
        labelKey: 'nonConformances',
        requiredPermission: Permission.VIEW_EQUIPMENT,
      },
      {
        icon: Monitor,
        href: FRONTEND_ROUTES.SOFTWARE.LIST,
        labelKey: 'software',
        requiredPermission: Permission.VIEW_TEST_SOFTWARE,
      },
      {
        icon: Cable,
        href: FRONTEND_ROUTES.CABLES.LIST,
        labelKey: 'cables',
        requiredPermission: Permission.VIEW_EQUIPMENT,
      },
    ],
  },
  {
    sectionKey: 'sections.management',
    items: [
      {
        icon: FileText,
        href: FRONTEND_ROUTES.FORM_TEMPLATES,
        labelKey: 'formTemplates',
        requiredPermission: Permission.VIEW_FORM_TEMPLATES,
      },
      {
        icon: CheckSquare,
        href: FRONTEND_ROUTES.ADMIN.APPROVALS,
        labelKey: 'adminApprovals',
        requiredPermission: Permission.APPROVE_EQUIPMENT,
        badge: {
          kind: 'count',
          sourceKey: 'approvals',
        },
      },
      {
        icon: FileSearch,
        href: FRONTEND_ROUTES.ADMIN.AUDIT_LOGS,
        labelKey: 'adminAuditLogs',
        requiredPermission: Permission.VIEW_AUDIT_LOGS,
      },
      {
        icon: Upload,
        href: FRONTEND_ROUTES.ADMIN.DATA_MIGRATION,
        labelKey: 'adminDataMigration',
        requiredPermission: Permission.PERFORM_DATA_MIGRATION,
      },
      {
        icon: Users,
        href: FRONTEND_ROUTES.TEAMS.LIST,
        labelKey: 'teams',
        requiredPermission: Permission.VIEW_TEAMS,
      },
    ],
  },
  {
    sectionKey: 'sections.system',
    items: [
      {
        icon: Activity,
        href: FRONTEND_ROUTES.ADMIN.MONITORING,
        labelKey: 'adminMonitoring',
        requiredPermission: Permission.MANAGE_SYSTEM_SETTINGS,
      },
      {
        icon: Settings,
        href: FRONTEND_ROUTES.SETTINGS.INDEX,
        labelKey: 'settings',
        requiredPermission: null,
      },
    ],
  },
];

/**
 * 역할/권한 기반 필터링된 섹션 반환
 *
 * @param role - 사용자 역할 (미인증 시 undefined)
 * @param t - 번역 함수 (navigation 네임스페이스)
 * @param pendingCounts - 승인 대기 건수 (배지용)
 * @param checkoutYourTurnCount - 반출 "내 차례" 건수 (배지용)
 */
export function getFilteredNavSections(
  role: UserRole | undefined,
  t: (key: string) => string,
  pendingCounts?: PendingCountsByCategory,
  checkoutYourTurnCount?: number
): FilteredNavSection[] {
  return NAV_SECTIONS.map((section) => {
    const filteredItems: FilteredNavItem[] = section.items
      .filter((item) => {
        if (item.requiredPermission === null) return true;
        if (!role) return false;
        if (item.href === FRONTEND_ROUTES.ADMIN.APPROVALS) {
          return hasApprovalPermissions(role);
        }
        return hasPermission(role, item.requiredPermission);
      })
      .map((item) => {
        const { badge, secondaryAction } = resolveBadgeAndAction(
          item,
          role,
          pendingCounts,
          checkoutYourTurnCount
        );
        return {
          icon: item.icon,
          href: item.href,
          label: t(item.labelKey),
          badge,
          secondaryAction,
        };
      });

    return {
      sectionLabel: t(section.sectionKey),
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
}

/**
 * 배지 카운트 + 선택적 보조 액션을 정규화
 *
 * - 권한/카운트 0건 가드를 모두 통과해야 배지 노출
 * - `count-with-action` 분기일 때만 secondaryAction 정규화
 * - href 조립 시 query param/value는 모두 SSOT(`CHECKOUT_QUERY_PARAMS` 등)에서 옴
 */
// 컴파일 타임 exhaustiveness guard — NavItemBadgeConfig.kind에 신규 variant 추가 시 여기서 에러 발생
function assertNever(x: never): never {
  throw new Error(`Unhandled NavItemBadgeConfig kind: ${JSON.stringify(x)}`);
}

function resolveBadgeAndAction(
  item: NavItemConfig,
  role: UserRole | undefined,
  pendingCounts: PendingCountsByCategory | undefined,
  checkoutYourTurnCount: number | undefined
): { badge?: number; secondaryAction?: FilteredNavSecondaryAction } {
  const cfg = item.badge;
  if (!cfg) return {};

  let count = 0;
  if (cfg.sourceKey === 'approvals') {
    if (role && hasApprovalPermissions(role) && pendingCounts) {
      count = computeApprovalTotal(pendingCounts, role);
    }
  } else if (cfg.sourceKey === 'checkouts-your-turn') {
    count = checkoutYourTurnCount ?? 0;
  }
  if (count <= 0) return {};

  switch (cfg.kind) {
    case 'count-with-action': {
      const separator = item.href.includes('?') ? '&' : '?';
      return {
        badge: count,
        secondaryAction: {
          href: `${item.href}${separator}${cfg.action.queryParam}=${cfg.action.queryValue}`,
          ariaKey: cfg.action.ariaKey,
          primaryAriaKey: cfg.action.primaryAriaKey,
        },
      };
    }
    case 'count':
      return { badge: count };
    default:
      return assertNever(cfg);
  }
}

/**
 * 경로 활성 상태 판별
 *
 * 데스크톱 SidebarItem / 모바일 NavLink 공용
 */
export function isNavItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
