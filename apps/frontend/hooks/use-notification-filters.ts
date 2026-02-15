/**
 * 알림 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 알림 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스
 * - 필터 변경 시 URL 업데이트 (router.push)
 * - SSOT 유틸리티 함수 재사용 (notification-filter-utils.ts)
 * - 필터 변경 시 page 자동 리셋
 *
 * 사용처:
 * - app/(dashboard)/notifications/NotificationsListContent.tsx
 *
 * @see lib/utils/notification-filter-utils.ts
 */

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  type UINotificationFilters,
  parseNotificationFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  buildNotificationFilterUrl,
} from '@/lib/utils/notification-filter-utils';

/**
 * 알림 필터 관리 훅
 *
 * @returns 필터 상태 및 업데이트 함수
 */
export function useNotificationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const filters = useMemo(
    () => parseNotificationFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  // API 파라미터 변환
  const apiFilters = useMemo(() => convertFiltersToApiParams(filters), [filters]);

  // 활성 필터 개수
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  /**
   * 필터 업데이트 함수
   *
   * - 필터 변경 시 page=1 자동 리셋 (page 자체가 변경된 경우 제외)
   * - "전체" 선택 = 파라미터 생략 (프로젝트 통일 규칙)
   */
  const updateFilters = useCallback(
    (updates: Partial<UINotificationFilters>) => {
      const newFilters = { ...filters, ...updates };
      // 필터 변경 시 page를 1로 리셋 (page 자체가 변경된 경우 제외)
      if (!('page' in updates)) {
        newFilters.page = 1;
      }
      router.push(buildNotificationFilterUrl(pathname, newFilters));
    },
    [filters, router, pathname]
  );

  /**
   * 필터 초기화
   */
  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    /** 현재 UI 필터 */
    filters,
    /** API 호출용 필터 */
    apiFilters,
    /** 활성 필터 개수 (탭/페이지 제외) */
    activeCount,
    /** 필터 업데이트 함수 (부분 업데이트 가능) */
    updateFilters,
    /** 필터 초기화 */
    clearFilters,
  };
}
