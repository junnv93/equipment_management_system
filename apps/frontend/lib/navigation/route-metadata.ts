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
  type LucideIcon,
} from 'lucide-react';

/**
 * 라우트 메타데이터 인터페이스
 */
export interface RouteMetadata {
  /** 표시 이름 (예: "장비 관리") — 한국어 하드코딩 (deprecated: labelKey로 전환 예정) */
  label: string;
  /** i18n 키 (예: "navigation.equipment") — Phase 3에서 label 대체 */
  labelKey?: string;
  /** 선택적 아이콘 */
  icon?: LucideIcon;
  /** 부모 경로 (예: "/") */
  parent?: string;
  /** 동적 라우트 여부 ([id], [uuid] 등 포함) */
  dynamic?: boolean;
  /** 브레드크럼에서 숨김 여부 */
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
    label: '대시보드',
    labelKey: 'navigation.dashboard',
    icon: Home,
  },

  // ========================================
  // 장비 관리
  // ========================================
  '/equipment': {
    label: '장비 관리',
    labelKey: 'navigation.equipment',
    parent: '/',
    icon: Package2,
  },
  '/equipment/create': {
    label: '장비 등록',
    labelKey: 'navigation.equipmentCreate',
    parent: '/equipment',
  },
  '/equipment/create-shared': {
    label: '공유 장비 등록',
    labelKey: 'navigation.equipmentCreateShared',
    parent: '/equipment',
  },
  '/equipment/[id]': {
    label: '장비 상세',
    labelKey: 'navigation.equipmentDetail',
    parent: '/equipment',
    dynamic: true,
  },
  '/equipment/[id]/edit': {
    label: '편집',
    labelKey: 'navigation.equipmentEdit',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/calibration-factors': {
    label: '보정계수',
    labelKey: 'navigation.equipmentCalibrationFactors',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/non-conformance': {
    label: '부적합 관리',
    labelKey: 'navigation.equipmentNonConformance',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/rent': {
    label: '대여',
    labelKey: 'navigation.equipmentRent',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/repair-history': {
    label: '수리 이력',
    labelKey: 'navigation.equipmentRepairHistory',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/software': {
    label: '소프트웨어',
    labelKey: 'navigation.equipmentSoftware',
    parent: '/equipment/[id]',
  },

  // ========================================
  // 교정 관리
  // ========================================
  '/calibration': {
    label: '교정 관리',
    labelKey: 'navigation.calibration',
    parent: '/',
    icon: Clipboard,
  },
  '/calibration/register': {
    label: '교정 등록',
    labelKey: 'navigation.calibrationRegister',
    parent: '/calibration',
  },

  // ========================================
  // 교정계획서
  // ========================================
  '/calibration-plans': {
    label: '교정계획서',
    labelKey: 'navigation.calibrationPlans',
    parent: '/',
    icon: Calendar,
  },
  '/calibration-plans/create': {
    label: '교정계획서 작성',
    labelKey: 'navigation.calibrationPlansCreate',
    parent: '/calibration-plans',
  },
  '/calibration-plans/[uuid]': {
    label: '교정계획서 상세',
    labelKey: 'navigation.calibrationPlansDetail',
    parent: '/calibration-plans',
    dynamic: true,
  },

  // ========================================
  // 부적합 관리
  // ========================================
  '/non-conformances': {
    label: '부적합 관리',
    labelKey: 'navigation.nonConformances',
    parent: '/',
    icon: AlertTriangle,
  },
  '/non-conformances/[id]': {
    label: '부적합 상세',
    labelKey: 'navigation.nonConformancesDetail',
    parent: '/non-conformances',
    dynamic: true,
  },

  // ========================================
  // 반출입 관리
  // ========================================
  '/checkouts': {
    label: '반출입 관리',
    labelKey: 'navigation.checkouts',
    parent: '/',
    icon: FileText,
  },
  '/checkouts/create': {
    label: '반출입 등록',
    labelKey: 'navigation.checkoutsCreate',
    parent: '/checkouts',
  },
  '/checkouts/manage': {
    label: '반출입 관리',
    labelKey: 'navigation.checkoutsManage',
    parent: '/checkouts',
  },
  '/checkouts/[id]': {
    label: '반출 상세',
    labelKey: 'navigation.checkoutsDetail',
    parent: '/checkouts',
    dynamic: true,
  },
  '/checkouts/[id]/check': {
    label: '반출 확인',
    labelKey: 'navigation.checkoutsCheck',
    parent: '/checkouts/[id]',
  },
  '/checkouts/[id]/return': {
    label: '반입 처리',
    labelKey: 'navigation.checkoutsReturn',
    parent: '/checkouts/[id]',
  },

  '/checkouts/import/[id]': {
    label: '렌탈 반입 상세',
    labelKey: 'navigation.checkoutsImportDetail',
    parent: '/checkouts',
    dynamic: true,
  },

  // Equipment Imports (Unified)
  '/checkouts/import/rental': {
    label: '외부 렌탈 반입',
    labelKey: 'navigation.checkoutsImportRental',
    parent: '/checkouts',
  },
  '/checkouts/import/shared': {
    label: '내부 공용 반입',
    labelKey: 'navigation.checkoutsImportShared',
    parent: '/checkouts',
  },
  '/checkouts/import/[id]/receive': {
    label: '수령 확인',
    labelKey: 'navigation.checkoutsImportReceive',
    parent: '/checkouts/import/[id]',
  },

  // ========================================
  // 소프트웨어 관리
  // ========================================
  '/software': {
    label: '소프트웨어 관리',
    labelKey: 'navigation.software',
    parent: '/',
    icon: Code,
  },

  // ========================================
  // 보고서
  // ========================================
  '/reports': {
    label: '보고서',
    labelKey: 'navigation.reports',
    parent: '/',
    icon: BarChart3,
  },
  '/reports/calibration-factors': {
    label: '보정계수 보고서',
    labelKey: 'navigation.reportsCalibrationFactors',
    parent: '/reports',
  },

  // ========================================
  // 팀 관리
  // ========================================
  '/teams': {
    label: '팀 관리',
    labelKey: 'navigation.teams',
    parent: '/',
    icon: Users,
  },
  '/teams/[id]': {
    label: '팀 상세',
    labelKey: 'navigation.teamsDetail',
    parent: '/teams',
    dynamic: true,
  },

  // ========================================
  // 알림
  // ========================================
  '/notifications': {
    label: '알림',
    labelKey: 'navigation.notifications',
    parent: '/',
    icon: Bell,
  },

  // ========================================
  // 설정
  // ========================================
  '/settings': {
    label: '설정',
    labelKey: 'navigation.settings',
    parent: '/',
    icon: Settings,
  },
  '/settings/profile': {
    label: '내 프로필',
    labelKey: 'navigation.settingsProfile',
    parent: '/settings',
  },
  '/settings/notifications': {
    label: '알림 설정',
    labelKey: 'navigation.settingsNotifications',
    parent: '/settings',
  },
  '/settings/display': {
    label: '표시 설정',
    labelKey: 'navigation.settingsDisplay',
    parent: '/settings',
  },
  '/settings/admin/calibration': {
    label: '교정 알림 설정',
    labelKey: 'navigation.settingsCalibration',
    parent: '/settings',
  },
  '/settings/admin/system': {
    label: '시스템 설정',
    labelKey: 'navigation.settingsSystem',
    parent: '/settings',
  },

  // ========================================
  // 관리자 (Admin) - 승인 페이지들
  // ========================================
  '/admin': {
    label: '관리자',
    labelKey: 'navigation.admin',
    parent: '/',
    icon: Shield,
    hidden: true, // 브레드크럼에서 숨김 (하위 페이지만 표시)
  },
  '/admin/approvals': {
    label: '승인 관리',
    labelKey: 'navigation.adminApprovals',
    parent: '/',
    icon: Shield,
  },
  // Legacy individual approval routes removed — all redirect to /admin/approvals?tab=xxx
  '/admin/audit-logs': {
    label: '감사 로그',
    labelKey: 'navigation.adminAuditLogs',
    parent: '/',
    icon: FileText,
  },

  // ========================================
  // 인증 페이지 (브레드크럼 제외)
  // ========================================
  '/login': {
    label: '로그인',
    labelKey: 'navigation.login',
    hidden: true,
  },
  '/error': {
    label: '오류',
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
  // pathname에서 동적 세그먼트가 있는지 확인
  return Object.keys(routeMap).some((route) => {
    if (!routeMap[route].dynamic) return false;

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
    if (!routeMap[route].dynamic) continue;

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
 * getRouteMetadata('/equipment') // { label: '장비 관리', parent: '/', icon: Package2 }
 * getRouteMetadata('/equipment/abc-123') // { label: '장비 상세', parent: '/equipment', dynamic: true }
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
