/**
 * ============================================================================
 * SSOT: 알림 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * 이 파일은 알림 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 이 파일이 존재하는 이유:
 * - 2026-02-14: Equipment/Teams/Calibration 페이지의 SSOT 패턴을 알림 페이지에 적용
 * - useState 기반 필터 → URL 파라미터 기반으로 마이그레이션
 *
 * 사용처:
 * - app/(dashboard)/notifications/page.tsx (Server Component)
 * - app/(dashboard)/notifications/NotificationsListContent.tsx (Client Component)
 *
 * ============================================================================
 * 새로운 필터 추가 시 체크리스트
 * ============================================================================
 *
 * 1. [이 파일] UINotificationFilters 인터페이스에 필드 추가
 * 2. [이 파일] DEFAULT_UI_FILTERS에 기본값 추가
 * 3. [이 파일] parseNotificationFiltersFromSearchParams() 함수 업데이트
 * 4. [이 파일] convertFiltersToApiParams() 함수 업데이트
 * 5. hooks/use-notification-filters.ts - 훅 업데이트
 * 6. NotificationsListContent.tsx - UI 컴포넌트 업데이트
 *
 * ============================================================================
 */

import type { NotificationCategory } from '@equipment-management/shared-constants';
import { NOTIFICATION_CATEGORIES } from '@equipment-management/shared-constants';

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UINotificationFilters {
  tab: 'all' | 'unread';
  category: NotificationCategory | '';
  search: string;
  page: number;
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 *
 * UI 필터를 백엔드 API가 기대하는 형식으로 변환한 결과입니다.
 * - tab: 'unread' → isRead: false
 * - category: '' → undefined (전체)
 */
export interface ApiNotificationFilters {
  category?: string;
  isRead?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_UI_FILTERS: UINotificationFilters = {
  tab: 'all',
  category: '',
  search: '',
  page: 1,
};

const PAGE_SIZE = 20;

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 컴포넌트에서 동일하게 사용
 *
 * "전체" 선택 = 파라미터 생략 (프로젝트 통일 규칙)
 */
export function parseNotificationFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UINotificationFilters {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  };

  const tabRaw = get('tab');
  const tab = tabRaw === 'unread' ? 'unread' : 'all';

  const categoryRaw = get('category');
  const category = (
    categoryRaw && NOTIFICATION_CATEGORIES.includes(categoryRaw as NotificationCategory)
      ? categoryRaw
      : ''
  ) as NotificationCategory | '';

  const search = get('search') || '';

  const pageRaw = parseInt(get('page') || '1', 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  return { tab, category, search, page };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 */
export function convertFiltersToApiParams(filters: UINotificationFilters): ApiNotificationFilters {
  return {
    category: filters.category || undefined,
    isRead: filters.tab === 'unread' ? false : undefined,
    search: filters.search || undefined,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

/**
 * 활성 필터 개수 반환 (탭과 페이지 제외)
 */
export function countActiveFilters(filters: UINotificationFilters): number {
  let count = 0;
  if (filters.category) count++;
  if (filters.search) count++;
  return count;
}

/**
 * UI 필터를 URL 쿼리 스트링으로 변환
 *
 * "전체" 선택(기본값)인 필터는 URL에서 생략 (프로젝트 통일 규칙)
 */
export function buildNotificationFilterUrl(
  pathname: string,
  filters: Partial<UINotificationFilters>
): string {
  const params = new URLSearchParams();

  if (filters.tab && filters.tab !== 'all') {
    params.set('tab', filters.tab);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
