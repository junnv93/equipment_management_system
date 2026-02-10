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
  Wrench,
  Calendar,
  AlertTriangle,
  Code,
  type LucideIcon,
} from 'lucide-react';

/**
 * 라우트 메타데이터 인터페이스
 */
export interface RouteMetadata {
  /** 표시 이름 (예: "장비 관리") */
  label: string;
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
    icon: Home,
  },

  // ========================================
  // 장비 관리
  // ========================================
  '/equipment': {
    label: '장비 관리',
    parent: '/',
    icon: Package2,
  },
  '/equipment/create': {
    label: '장비 등록',
    parent: '/equipment',
  },
  '/equipment/create-shared': {
    label: '공유 장비 등록',
    parent: '/equipment',
  },
  '/equipment/[id]': {
    label: '장비 상세',
    parent: '/equipment',
    dynamic: true,
  },
  '/equipment/[id]/edit': {
    label: '편집',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/calibration-factors': {
    label: '보정계수',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/non-conformance': {
    label: '부적합 관리',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/rent': {
    label: '대여',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/repair-history': {
    label: '수리 이력',
    parent: '/equipment/[id]',
  },
  '/equipment/[id]/software': {
    label: '소프트웨어',
    parent: '/equipment/[id]',
  },

  // ========================================
  // 교정 관리
  // ========================================
  '/calibration': {
    label: '교정 관리',
    parent: '/',
    icon: Clipboard,
  },
  '/calibration/register': {
    label: '교정 등록',
    parent: '/calibration',
  },

  // ========================================
  // 교정계획서
  // ========================================
  '/calibration-plans': {
    label: '교정계획서',
    parent: '/',
    icon: Calendar,
  },
  '/calibration-plans/create': {
    label: '교정계획서 작성',
    parent: '/calibration-plans',
  },
  '/calibration-plans/[uuid]': {
    label: '교정계획서 상세',
    parent: '/calibration-plans',
    dynamic: true,
  },

  // ========================================
  // 반출입 관리
  // ========================================
  '/checkouts': {
    label: '반출입 관리',
    parent: '/',
    icon: FileText,
  },
  '/checkouts/create': {
    label: '반출입 등록',
    parent: '/checkouts',
  },
  '/checkouts/manage': {
    label: '반출입 관리',
    parent: '/checkouts',
  },
  '/checkouts/[id]': {
    label: '반출 상세',
    parent: '/checkouts',
    dynamic: true,
  },
  '/checkouts/[id]/check': {
    label: '반출 확인',
    parent: '/checkouts/[id]',
  },
  '/checkouts/[id]/return': {
    label: '반입 처리',
    parent: '/checkouts/[id]',
  },

  // ========================================
  // 렌탈 반입 관리
  // ========================================
  '/rental-imports': {
    label: '렌탈 반입',
    parent: '/',
    icon: FileText,
  },
  '/rental-imports/[id]': {
    label: '렌탈 반입 상세',
    parent: '/rental-imports',
    dynamic: true,
  },
  '/checkouts/import/[id]': {
    label: '렌탈 반입 상세',
    parent: '/checkouts',
    dynamic: true,
  },

  // Equipment Imports (Unified)
  '/checkouts/import/rental': {
    label: '외부 렌탈 반입',
    parent: '/checkouts',
  },
  '/checkouts/import/shared': {
    label: '내부 공용 반입',
    parent: '/checkouts',
  },
  '/checkouts/import/[id]/receive': {
    label: '수령 확인',
    parent: '/checkouts/import/[id]',
  },

  // ========================================
  // 유지보수
  // ========================================
  '/maintenance': {
    label: '유지보수',
    parent: '/',
    icon: Wrench,
  },
  '/maintenance/create': {
    label: '유지보수 등록',
    parent: '/maintenance',
  },

  // ========================================
  // 소프트웨어 관리
  // ========================================
  '/software': {
    label: '소프트웨어 관리',
    parent: '/',
    icon: Code,
  },

  // ========================================
  // 보고서
  // ========================================
  '/reports': {
    label: '보고서',
    parent: '/',
    icon: BarChart3,
  },
  '/reports/calibration-factors': {
    label: '보정계수 보고서',
    parent: '/reports',
  },

  // ========================================
  // 팀 관리
  // ========================================
  '/teams': {
    label: '팀 관리',
    parent: '/',
    icon: Users,
  },
  '/teams/[id]': {
    label: '팀 상세',
    parent: '/teams',
    dynamic: true,
  },

  // ========================================
  // 알림
  // ========================================
  '/alerts': {
    label: '알림',
    parent: '/',
    icon: Bell,
  },

  // ========================================
  // 설정
  // ========================================
  '/settings': {
    label: '설정',
    parent: '/',
    icon: Settings,
  },
  '/settings/notifications': {
    label: '알림 설정',
    parent: '/settings',
  },

  // ========================================
  // 관리자 (Admin) - 승인 페이지들
  // ========================================
  '/admin': {
    label: '관리자',
    parent: '/',
    icon: Shield,
    hidden: true, // 브레드크럼에서 숨김 (하위 페이지만 표시)
  },
  '/admin/approvals': {
    label: '승인 관리',
    parent: '/',
    icon: Shield,
  },
  '/admin/equipment-approvals': {
    label: '장비 등록 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/calibration-approvals': {
    label: '교정 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/calibration-plan-approvals': {
    label: '교정계획서 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/calibration-factor-approvals': {
    label: '보정계수 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/return-approvals': {
    label: '반입 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/non-conformance-approvals': {
    label: '부적합 승인',
    parent: '/',
    icon: AlertTriangle,
  },
  '/admin/software-approvals': {
    label: '소프트웨어 승인',
    parent: '/',
    icon: Shield,
  },
  '/admin/audit-logs': {
    label: '감사 로그',
    parent: '/',
    icon: FileText,
  },

  // ========================================
  // 인증 페이지 (브레드크럼 제외)
  // ========================================
  '/login': {
    label: '로그인',
    hidden: true,
  },
  '/error': {
    label: '오류',
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
