/**
 * Breadcrumb Generation Logic
 *
 * pathname을 받아 브레드크럼 아이템 배열을 생성합니다.
 *
 * @module generate-breadcrumbs
 */

import { type LucideIcon } from 'lucide-react';
import {
  getRouteMetadata,
  getParentChain,
  normalizeDynamicRoute,
  extractDynamicParams,
  routeMap,
} from './route-metadata';

/**
 * UUID 형식 감지 (8-4-4-4-12 패턴)
 *
 * @param str - 검사할 문자열
 * @returns UUID 형식 여부
 */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * 브레드크럼 아이템 인터페이스
 */
export interface BreadcrumbItem {
  /** 표시 라벨 */
  label: string;
  /** i18n 번역 키 (예: 'navigation.equipment') */
  labelKey?: string;
  /** 링크 href */
  href: string;
  /** 선택적 아이콘 */
  icon?: LucideIcon;
  /** 현재 페이지 여부 */
  current?: boolean;
  /** 동적 라우트 여부 */
  isDynamic?: boolean;
  /** 동적 라우트 파라미터 (예: { id: 'abc-123' }) */
  params?: Record<string, string>;
}

/**
 * pathname을 브레드크럼 아이템 배열로 변환
 *
 * @param pathname - 현재 경로 (예: "/equipment/abc-123/edit")
 * @param dynamicLabels - 동적 라우트의 커스텀 라벨 (선택적)
 * @returns 브레드크럼 아이템 배열
 *
 * @example
 * generateBreadcrumbs('/equipment/abc-123/edit', { 'abc-123': '디지털 멀티미터 DMM-2000' })
 * // [
 * //   { label: '대시보드', href: '/', icon: Home },
 * //   { label: '장비 관리', href: '/equipment', icon: Package2 },
 * //   { label: '디지털 멀티미터 DMM-2000', href: '/equipment/abc-123', isDynamic: true },
 * //   { label: '편집', href: '/equipment/abc-123/edit', current: true }
 * // ]
 */
export function generateBreadcrumbs(
  pathname: string,
  dynamicLabels?: Record<string, string>
): BreadcrumbItem[] {
  // 인증 페이지나 숨겨진 페이지는 브레드크럼 없음
  const metadata = getRouteMetadata(pathname);
  if (metadata?.hidden) {
    return [];
  }

  // 부모 경로 체인 가져오기 (정규화된 경로)
  const normalizedPath = normalizeDynamicRoute(pathname);
  const parentChain = getParentChain(normalizedPath);

  // 동적 파라미터 추출
  const dynamicParams = extractDynamicParams(pathname);

  // 브레드크럼 아이템 생성
  const breadcrumbs: BreadcrumbItem[] = parentChain.map((route, index) => {
    const routeMetadata = routeMap[route];

    if (!routeMetadata) {
      // 메타데이터가 없는 경우 기본값
      return {
        label: route,
        href: route,
        current: index === parentChain.length - 1,
      };
    }

    // 동적 라우트인 경우 실제 경로로 변환
    let actualHref = route;
    let actualLabel = routeMetadata.label;
    let isDynamic = false;
    let params: Record<string, string> | undefined;

    if (routeMetadata.dynamic) {
      // [id], [uuid] 등을 실제 값으로 교체
      actualHref = route;
      Object.keys(dynamicParams).forEach((paramName) => {
        actualHref = actualHref.replace(`[${paramName}]`, dynamicParams[paramName]);
      });

      // 커스텀 라벨이 제공된 경우 사용, 없으면 UUID 감지
      const paramValue = Object.values(dynamicParams)[0]; // 첫 번째 파라미터 값
      if (dynamicLabels && paramValue && dynamicLabels[paramValue]) {
        actualLabel = dynamicLabels[paramValue];
      } else if (paramValue && isUUID(paramValue)) {
        // UUID가 직접 표시되는 것을 방지 (BreadcrumbProvider가 동적으로 로드)
        actualLabel = routeMetadata.label; // 기본 라벨 유지 (예: "상세", "편집")
      }

      isDynamic = true;
      params = dynamicParams;
    }

    return {
      label: actualLabel,
      labelKey: routeMetadata.labelKey,
      href: actualHref,
      icon: routeMetadata.icon,
      current: index === parentChain.length - 1,
      isDynamic,
      params,
    };
  });

  // 숨겨진 항목 제거
  return breadcrumbs.filter((item) => {
    const itemMetadata = getRouteMetadata(item.href);
    return !itemMetadata?.hidden;
  });
}

/**
 * 브레드크럼 문자열 생성 (스크린리더용)
 *
 * @param breadcrumbs - 브레드크럼 아이템 배열
 * @returns 브레드크럼 문자열 (예: "대시보드 > 장비 관리 > 장비 상세")
 *
 * @example
 * const breadcrumbs = generateBreadcrumbs('/equipment/abc-123');
 * const label = generateBreadcrumbLabel(breadcrumbs);
 * // "대시보드 > 장비 관리 > 장비 상세"
 */
export function generateBreadcrumbLabel(breadcrumbs: BreadcrumbItem[]): string {
  return breadcrumbs.map((item) => item.label).join(' > ');
}

/**
 * 모바일용 축약 브레드크럼 생성
 *
 * 마지막 2단계만 표시
 *
 * @param breadcrumbs - 전체 브레드크럼 배열
 * @returns 축약된 브레드크럼 배열
 *
 * @example
 * const full = generateBreadcrumbs('/equipment/abc-123/edit');
 * const mobile = generateMobileBreadcrumbs(full);
 * // [
 * //   { label: '장비 상세', href: '/equipment/abc-123' },
 * //   { label: '편집', href: '/equipment/abc-123/edit', current: true }
 * // ]
 */
export function generateMobileBreadcrumbs(breadcrumbs: BreadcrumbItem[]): BreadcrumbItem[] {
  if (breadcrumbs.length <= 2) {
    return breadcrumbs;
  }

  // 홈을 제외한 마지막 2개 항목만 반환
  return breadcrumbs.slice(-2);
}

/**
 * 브레드크럼에서 홈 아이템 가져오기
 *
 * @returns 홈 브레드크럼 아이템
 */
export function getHomeBreadcrumb(): BreadcrumbItem {
  const homeMetadata = routeMap['/'];

  return {
    label: homeMetadata.label,
    href: '/',
    icon: homeMetadata.icon,
  };
}

/**
 * 특정 경로의 브레드크럼 개수 계산
 *
 * @param pathname - 경로
 * @returns 브레드크럼 개수
 *
 * @example
 * getBreadcrumbDepth('/equipment/abc-123/edit') // 4 (홈 > 장비 관리 > 상세 > 편집)
 */
export function getBreadcrumbDepth(pathname: string): number {
  const breadcrumbs = generateBreadcrumbs(pathname);
  return breadcrumbs.length;
}

/**
 * 현재 페이지의 부모 페이지 가져오기
 *
 * @param pathname - 현재 경로
 * @returns 부모 페이지 브레드크럼 아이템 또는 undefined
 *
 * @example
 * getParentBreadcrumb('/equipment/abc-123/edit')
 * // { label: '장비 상세', href: '/equipment/abc-123', ... }
 */
export function getParentBreadcrumb(pathname: string): BreadcrumbItem | undefined {
  const breadcrumbs = generateBreadcrumbs(pathname);

  if (breadcrumbs.length < 2) {
    return undefined; // 부모가 없음 (루트 페이지)
  }

  return breadcrumbs[breadcrumbs.length - 2];
}

/**
 * 브레드크럼 디버그 정보 생성
 *
 * @param pathname - 경로
 * @returns 디버그 정보 문자열
 */
export function debugBreadcrumbs(pathname: string): string {
  const breadcrumbs = generateBreadcrumbs(pathname);
  const normalizedPath = normalizeDynamicRoute(pathname);
  const dynamicParams = extractDynamicParams(pathname);

  const lines = [
    `=== Breadcrumb Debug Info ===`,
    `Original Path: ${pathname}`,
    `Normalized Path: ${normalizedPath}`,
    `Dynamic Params: ${JSON.stringify(dynamicParams)}`,
    `Breadcrumb Count: ${breadcrumbs.length}`,
    ``,
    `Breadcrumbs:`,
  ];

  breadcrumbs.forEach((item, index) => {
    lines.push(
      `  ${index + 1}. ${item.label} (${item.href})${item.current ? ' [CURRENT]' : ''}${item.isDynamic ? ' [DYNAMIC]' : ''}`
    );
  });

  return lines.join('\n');
}
