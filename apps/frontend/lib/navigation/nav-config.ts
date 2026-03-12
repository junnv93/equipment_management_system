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
} from 'lucide-react';
import { FRONTEND_ROUTES, Permission, hasPermission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { hasApprovalPermissions } from '@/lib/utils/permission-helpers';
import { computeApprovalTotal } from '@/lib/utils/approval-count-utils';
import type { PendingCountsByCategory } from '@/lib/api/approvals-api';

/** 정적 네비게이션 아이템 설정 */
export interface NavItemConfig {
  icon: LucideIcon;
  href: string;
  /** i18n 키 (navigation 네임스페이스) */
  labelKey: string;
  requiredPermission: Permission | null;
  /** 배지 데이터 소스 식별자 */
  badgeKey?: 'approvals';
}

/** 정적 섹션 설정 */
export interface NavSection {
  /** i18n 키 (navigation.sections.*) */
  sectionKey: string;
  items: NavItemConfig[];
}

/** 필터링/번역 완료된 네비게이션 아이템 */
export interface FilteredNavItem {
  icon: LucideIcon;
  href: string;
  label: string;
  badge?: number;
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
    ],
  },
  {
    sectionKey: 'sections.management',
    items: [
      {
        icon: CheckSquare,
        href: FRONTEND_ROUTES.ADMIN.APPROVALS,
        labelKey: 'adminApprovals',
        requiredPermission: Permission.APPROVE_EQUIPMENT,
        badgeKey: 'approvals',
      },
      {
        icon: FileSearch,
        href: FRONTEND_ROUTES.ADMIN.AUDIT_LOGS,
        labelKey: 'adminAuditLogs',
        requiredPermission: Permission.VIEW_AUDIT_LOGS,
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
 */
export function getFilteredNavSections(
  role: UserRole | undefined,
  t: (key: string) => string,
  pendingCounts?: PendingCountsByCategory
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
        let badge: number | undefined;
        if (
          item.badgeKey === 'approvals' &&
          role &&
          hasApprovalPermissions(role) &&
          pendingCounts
        ) {
          const total = computeApprovalTotal(pendingCounts, role);
          badge = total > 0 ? total : undefined;
        }
        return {
          icon: item.icon,
          href: item.href,
          label: t(item.labelKey),
          badge,
        };
      });

    return {
      sectionLabel: t(section.sectionKey),
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
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
