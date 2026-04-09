/**
 * Route Metadata System
 *
 * 전체 애플리케이션의 라우트 구조와 메타데이터를 정의합니다.
 * 브레드크럼 네비게이션 생성에 사용됩니다.
 *
 * @module route-metadata
 */

import {
  Home,
  Package2,
  Clipboard,
  FileText,
  Users,
  Settings,
  Bell,
  BarChart3,
  Shield,
  Calendar,
  AlertTriangle,
  Code,
  Upload,
  Activity,
  Cable,
  FilePlus,
  type LucideIcon,
} from 'lucide-react';

/**
 * 라우트 메타데이터 인터페이스
 */
export interface RouteMetadata {
  /** i18n 키 (예: "navigation.equipment") — useTranslations()로 렌더링 */
  labelKey: string;
  /** @deprecated 영어 fallback (dynamic route 등 i18n 미지원 시) */
  label?: string;
  /** 선택적 아이콘 */
  icon?: LucideIcon;
  /** 부모 경로 (예: "/") */
  parent?: string;
  /**
   * 브레드크럼에서 숨김 여부.
   *
   * NOTE: 과거 `dynamic: boolean` 필드는 제거됨. 동적 여부는 route 키에 `[` 포함 여부로
   * SSOT 파생한다 (`isDynamicRoute`, `normalizeDynamicRoute`, `generate-breadcrumbs.ts`).
   * 수동 플래그 누락으로 Next.js 16 `<Link>` 에 리터럴 템플릿이 유출되던 버그 클래스 방지.
   */
  hidden?: boolean;
}

/**
 * 전체 라우트 맵
 *
 * 키: 라우트 경로 (예: "/equipment", "/equipment/[id]")
 * 값: 라우트 메타데이터
 */
export const routeMap: Record<string, RouteMetadata> = {
  // ========================================
  // 대시보드 (루트)
  // ========================================
  '/': {
    labelKey: 'navigation.dashboard',
    icon: Home,
  },

  // ========================================
  // 장비 관리
  // ========================================
  '/equipment': {
    labelKey: 'navigation.equipment',
    parent: '/',
    icon: Package2,
  },
  '/equipment/create': {
    labelKey: 'navigation.equipmentCreate',
    parent: '/equipment',
  },
  '/equipment/[id]': {
    labelKey: 'navigation.equipmentDetail',
    parent: '/equipment',
  },
  '/equipment/[id]/edit': {
    labelKey: 'navigation.equipmentEdit',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/calibration-factors': {
    labelKey: 'navigation.equipmentCalibrationFactors',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/non-conformance': {
    labelKey: 'navigation.equipmentNonConformance',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/rent': {
    labelKey: 'navigation.equipmentRent',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/repair-history': {
    labelKey: 'navigation.equipmentRepairHistory',
    parent: '/equipment/[id]',
  },

  // ========================================
  // 교정 관리
  // ========================================
  '/calibration': {
    labelKey: 'navigation.calibration',
    parent: '/',
    icon: Clipboard,
  },
  '/calibration/register': {
    labelKey: 'navigation.calibrationRegister',
    parent: '/calibration',
  },

  // ========================================
  // 교정계획서
  // ========================================
  '/calibration-plans': {
    labelKey: 'navigation.calibrationPlans',
    parent: '/',
    icon: Calendar,
  },
  '/calibration-plans/create': {
    labelKey: 'navigation.calibrationPlansCreate',
    parent: '/calibration-plans',
  },
  '/calibration-plans/[uuid]': {
    labelKey: 'navigation.calibrationPlansDetail',
    parent: '/calibration-plans',
  },

  // ========================================
  // 부적합 관리
  // ========================================
  '/non-conformances': {
    labelKey: 'navigation.nonConformances',
    parent: '/',
    icon: AlertTriangle,
  },
  '/non-conformances/[id]': {
    labelKey: 'navigation.nonConformancesDetail',
    parent: '/non-conformances',
  },

  // ========================================
  // 반출입 관리
  // ========================================
  '/checkouts': {
    labelKey: 'navigation.checkouts',
    parent: '/',
    icon: FileText,
  },
  '/checkouts/create': {
    labelKey: 'navigation.checkoutsCreate',
    parent: '/checkouts',
  },
  '/checkouts/pending-checks': {
    labelKey: 'navigation.checkoutsPendingChecks',
    parent: '/checkouts',
  },
  '/checkouts/manage': {
    labelKey: 'navigation.checkoutsManage',
    parent: '/checkouts',
  },
  '/checkouts/[id]': {
    labelKey: 'navigation.checkoutsDetail',
    parent: '/checkouts',
  },
  '/checkouts/[id]/check': {
    labelKey: 'navigation.checkoutsCheck',
    parent: '/checkouts/[id]',
  },
  '/checkouts/[id]/return': {
    labelKey: 'navigation.checkoutsReturn',
    parent: '/checkouts/[id]',
  },

  '/checkouts/import/[id]': {
    labelKey: 'navigation.checkoutsImportDetail',
    parent: '/checkouts',
  },

  // Equipment Imports (Unified)
  '/checkouts/import/rental': {
    labelKey: 'navigation.checkoutsImportRental',
    parent: '/checkouts',
  },
  '/checkouts/import/shared': {
    labelKey: 'navigation.checkoutsImportShared',
    parent: '/checkouts',
  },
  '/checkouts/import/[id]/receive': {
    labelKey: 'navigation.checkoutsImportReceive',
    parent: '/checkouts/import/[id]',
  },

  // ========================================
  // 시험용 소프트웨어 관리
  // ========================================
  '/software': {
    labelKey: 'navigation.software',
    parent: '/',
    icon: Code,
  },
  '/software/create': {
    labelKey: 'navigation.softwareCreate',
    parent: '/software',
  },
  '/software/[id]': {
    labelKey: 'navigation.softwareDetail',
    parent: '/software',
  },
  '/software/[id]/validation': {
    labelKey: 'navigation.softwareValidation',
    parent: '/software/[id]',
  },
  '/software/[id]/validation/[validationId]': {
    labelKey: 'navigation.softwareValidationDetail',
    parent: '/software/[id]/validation',
  },

  // ========================================
  // 보고서
  // ========================================
  '/reports': {
    labelKey: 'navigation.reports',
    parent: '/',
    icon: BarChart3,
  },
  '/reports/calibration-factors': {
    labelKey: 'navigation.reportsCalibrationFactors',
    parent: '/reports',
  },

  // ========================================
  // 케이블 관리
  // ========================================
  '/cables': {
    labelKey: 'navigation.cables',
    parent: '/',
    icon: Cable,
  },
  '/cables/create': {
    labelKey: 'navigation.cablesCreate',
    parent: '/cables',
  },
  '/cables/[id]': {
    labelKey: 'navigation.cablesDetail',
    parent: '/cables',
  },

  // ========================================
  // 양식 관리
  // ========================================
  '/form-templates': {
    labelKey: 'navigation.formTemplates',
    parent: '/',
    icon: FilePlus,
  },

  // ========================================
  // 팀 관리
  // ========================================
  '/teams': {
    labelKey: 'navigation.teams',
    parent: '/',
    icon: Users,
  },
  '/teams/create': {
    labelKey: 'navigation.teamsCreate',
    parent: '/teams',
  },
  '/teams/[id]': {
    labelKey: 'navigation.teamsDetail',
    parent: '/teams',
  },
  '/teams/[id]/edit': {
    labelKey: 'navigation.teamsEdit',
    parent: '/teams/[id]',
  },

  // ========================================
  // 알림
  // ========================================
  '/alerts': {
    labelKey: 'navigation.alerts',
    parent: '/',
    icon: Bell,
  },
  '/notifications': {
    labelKey: 'navigation.notifications',
    parent: '/',
    icon: Bell,
  },

  // ========================================
  // 설정
  // ========================================
  '/settings': {
    labelKey: 'navigation.settings',
    parent: '/',
    icon: Settings,
  },
  '/settings/profile': {
    labelKey: 'navigation.settingsProfile',
    parent: '/settings',
  },
  '/settings/notifications': {
    labelKey: 'navigation.settingsNotifications',
    parent: '/settings',
  },
  '/settings/display': {
    labelKey: 'navigation.settingsDisplay',
    parent: '/settings',
  },
  '/settings/admin/calibration': {
    labelKey: 'navigation.settingsCalibration',
    parent: '/settings',
  },
  '/settings/admin/system': {
    labelKey: 'navigation.settingsSystem',
    parent: '/settings',
  },

  // ========================================
  // 관리자 (Admin) - 승인 페이지들
  // ========================================
  '/admin': {
    labelKey: 'navigation.admin',
    parent: '/',
    icon: Shield,
    hidden: true, // 브레드크럼에서 숨김 (하위 페이지만 표시)
  },
  '/admin/approvals': {
    labelKey: 'navigation.adminApprovals',
    parent: '/',
    icon: Shield,
  },
  // Legacy individual approval routes removed — all redirect to /admin/approvals?tab=xxx
  '/admin/audit-logs': {
    labelKey: 'navigation.adminAuditLogs',
    parent: '/',
    icon: FileText,
  },
  '/admin/data-migration': {
    labelKey: 'navigation.adminDataMigration',
    parent: '/',
    icon: Upload,
  },
  '/admin/monitoring': {
    labelKey: 'navigation.adminMonitoring',
    parent: '/',
    icon: Activity,
  },

  // ========================================
  // 인증 페이지 (브레드크럼 제외)
  // ========================================
  '/login': {
    labelKey: 'navigation.login',
    hidden: true,
  },
  '/error': {
    labelKey: 'navigation.error',
    hidden: true,
  },
};

/**
 * 경로가 동적 라우트인지 확인
 *
 * @param pathname - 확인할 경로
 * @returns 동적 라우트 여부
 *
 * @example
 * isDynamicRoute('/equipment/abc-123') // true
 * isDynamicRoute('/equipment') // false
 */
export function isDynamicRoute(pathname: string): boolean {
  // SSOT: 동적 여부는 route 문자열에 `[` 가 포함되는지로 판단 (수동 flag 불필요).
  return Object.keys(routeMap).some((route) => {
    if (!route.includes('[')) return false;

    // [id], [uuid] 등을 정규식 패턴으로 변환
    const pattern = route.replace(/\[([^\]]+)\]/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    return regex.test(pathname);
  });
}

/**
 * 동적 경로를 정적 라우트 템플릿으로 변환
 *
 * @param pathname - 실제 경로 (예: "/equipment/abc-123")
 * @returns 라우트 템플릿 (예: "/equipment/[id]")
 *
 * @example
 * normalizeDynamicRoute('/equipment/abc-123') // '/equipment/[id]'
 * normalizeDynamicRoute('/teams/team-001') // '/teams/[id]'
 */
export function normalizeDynamicRoute(pathname: string): string {
  for (const route of Object.keys(routeMap)) {
    // SSOT: 동적 여부는 route 문자열에 `[` 가 포함되는지로 판단 (수동 flag 불필요).
    if (!route.includes('[')) continue;

    // [id], [uuid] 등을 정규식 패턴으로 변환
    const pattern = route.replace(/\[([^\]]+)\]/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(pathname)) {
      return route;
    }
  }

  return pathname;
}

/**
 * 라우트 메타데이터 가져오기
 *
 * @param pathname - 경로
 * @returns 라우트 메타데이터 또는 undefined
 *
 * @example
 * getRouteMetadata('/equipment') // { labelKey: 'navigation.equipment', parent: '/', icon: Package2 }
 * getRouteMetadata('/equipment/abc-123') // { labelKey: 'navigation.equipmentDetail', parent: '/equipment' }
 */
export function getRouteMetadata(pathname: string): RouteMetadata | undefined {
  // 먼저 정확한 경로로 찾기
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // 동적 라우트인 경우 정규화하여 찾기
  const normalizedRoute = normalizeDynamicRoute(pathname);
  return routeMap[normalizedRoute];
}

/**
 * 경로의 동적 파라미터 추출
 *
 * @param pathname - 실제 경로 (예: "/equipment/abc-123")
 * @returns 파라미터 객체 (예: { id: "abc-123" })
 *
 * @example
 * extractDynamicParams('/equipment/abc-123') // { id: 'abc-123' }
 * extractDynamicParams('/calibration-plans/uuid-001') // { uuid: 'uuid-001' }
 */
export function extractDynamicParams(pathname: string): Record<string, string> {
  const normalizedRoute = normalizeDynamicRoute(pathname);

  if (normalizedRoute === pathname) {
    return {}; // 동적 라우트가 아님
  }

  const routeSegments = normalizedRoute.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  const params: Record<string, string> = {};

  routeSegments.forEach((segment, index) => {
    const match = segment.match(/\[([^\]]+)\]/);
    if (match) {
      const paramName = match[1];
      params[paramName] = pathSegments[index];
    }
  });

  return params;
}

/**
 * 부모 경로 체인 가져오기
 *
 * @param pathname - 경로
 * @returns 부모 경로 배열 (루트부터)
 *
 * @example
 * getParentChain('/equipment/abc-123/edit')
 * // ['/', '/equipment', '/equipment/[id]', '/equipment/[id]/edit']
 */
export function getParentChain(pathname: string): string[] {
  const chain: string[] = [];
  let currentPath = normalizeDynamicRoute(pathname);

  while (currentPath) {
    chain.unshift(currentPath);

    const metadata = routeMap[currentPath];
    if (!metadata || !metadata.parent) {
      break;
    }

    currentPath = metadata.parent;
  }

  return chain;
}
