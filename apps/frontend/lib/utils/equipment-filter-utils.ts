/**
 * ============================================================================
 * 🔴 SSOT: 장비 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 장비 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 이 파일이 존재하는 이유:
 * - 2026-01-30 버그: page.tsx와 useEquipmentFilters.ts가 각각 다른 파싱 로직을
 *   사용하여 새 필터(classification, managementMethod, isShared 등)가
 *   서버 컴포넌트에서 누락되는 문제 발생
 *
 * 사용처:
 * - app/(dashboard)/equipment/page.tsx (Server Component)
 * - hooks/useEquipmentFilters.ts (Client Hook)
 *
 * ============================================================================
 * 🔴 새로운 필터 추가 시 체크리스트
 * ============================================================================
 *
 * 1. [이 파일] UIEquipmentFilters 인터페이스에 필드 추가
 * 2. [이 파일] ApiEquipmentFilters 인터페이스에 필드 추가 (필요시)
 * 3. [이 파일] DEFAULT_UI_FILTERS에 기본값 추가
 * 4. [이 파일] parseEquipmentFiltersFromSearchParams() 함수 업데이트
 * 5. [이 파일] convertFiltersToApiParams() 함수 업데이트
 * 6. [이 파일] countActiveFilters() 함수 업데이트
 * 7. hooks/useEquipmentFilters.ts - EquipmentFilters 타입 (필요시)
 * 8. components/equipment/EquipmentFilters.tsx - UI 컴포넌트
 * 9. packages/schemas/src/equipment.ts - 백엔드 Zod 스키마 (필요시)
 * 10. backend/.../equipment.service.ts - 백엔드 쿼리 로직
 *
 * ============================================================================
 */

import type {
  Site,
  EquipmentStatus,
  ManagementMethod,
  Classification,
} from '@equipment-management/schemas';
import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 *
 * ⚠️ showRetired는 URL 필터가 아닌 사용자 설정(DisplayPreferences)입니다.
 * → 서버: getDisplayPreferences() → withPreferences()로 주입
 * → 클라이언트: useUserPreferences() → useEquipmentFilters()에서 자동 주입
 */
export interface UIEquipmentFilters {
  search: string;
  site: Site | '';
  status: EquipmentStatus | '';
  managementMethod: ManagementMethod | '';
  classification: Classification | '';
  isShared: 'all' | 'shared' | 'normal';
  calibrationDueFilter: 'all' | 'due_soon' | 'overdue' | 'normal';
  teamId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiEquipmentFilters {
  search?: string;
  site?: Site;
  status?: EquipmentStatus;
  managementMethod?: ManagementMethod;
  classification?: Classification;
  isShared?: boolean;
  calibrationDue?: number;
  calibrationDueAfter?: number;
  calibrationOverdue?: boolean;
  teamId?: string;
  sort?: string;
  showRetired?: boolean;
  page: number;
  pageSize: number;
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_UI_FILTERS: UIEquipmentFilters = {
  search: '',
  site: '',
  status: '',
  managementMethod: '',
  classification: '',
  isShared: 'all',
  calibrationDueFilter: 'all',
  teamId: '',
  sortBy: 'managementNumber',
  sortOrder: 'asc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record<string, string | string[] | undefined>)
 * @returns UI 필터 객체
 *
 * "_all" 변환 규칙:
 * - URL: site=_all → UI State: site='' (빈 문자열)
 * - 이유: 무한 리다이렉트 방지 + Radix UI Select 제약 우회
 */
export function parseEquipmentFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UIEquipmentFilters {
  // URLSearchParams와 일반 객체 모두 지원
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    // 배열인 경우 첫 번째 값 반환 (Next.js가 중복 쿼리 파라미터를 배열로 전달할 수 있음)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  };

  const search = get('search') || DEFAULT_UI_FILTERS.search;

  // ✅ "_all"을 빈 문자열로 변환 (무한 리다이렉트 방지)
  const siteRaw = get('site') || DEFAULT_UI_FILTERS.site;
  const site = (siteRaw === '_all' ? '' : siteRaw) as Site | '';

  const statusRaw = get('status') || DEFAULT_UI_FILTERS.status;
  const status = (statusRaw === '_all' ? '' : statusRaw) as EquipmentStatus | '';

  const managementMethodRaw = get('managementMethod') || DEFAULT_UI_FILTERS.managementMethod;
  const managementMethod = (managementMethodRaw === '_all' ? '' : managementMethodRaw) as
    | ManagementMethod
    | '';

  const classificationRaw = get('classification') || DEFAULT_UI_FILTERS.classification;
  const classification = (classificationRaw === '_all' ? '' : classificationRaw) as
    | Classification
    | '';

  const isSharedParam = get('isShared');
  const isShared = isSharedParam === 'shared' || isSharedParam === 'normal' ? isSharedParam : 'all';

  const calibrationDueFilterParam = get('calibrationDueFilter');
  const calibrationDueFilter = (
    calibrationDueFilterParam === 'due_soon' ||
    calibrationDueFilterParam === 'overdue' ||
    calibrationDueFilterParam === 'normal'
      ? calibrationDueFilterParam
      : 'all'
  ) as UIEquipmentFilters['calibrationDueFilter'];

  // ✅ teamId도 "_all" 변환
  const teamIdRaw = get('teamId') || DEFAULT_UI_FILTERS.teamId;
  const teamId = teamIdRaw === '_all' ? '' : teamIdRaw;
  const sortBy = get('sortBy') || DEFAULT_UI_FILTERS.sortBy;
  const sortOrder = (get('sortOrder') || DEFAULT_UI_FILTERS.sortOrder) as 'asc' | 'desc';
  const page = parseInt(get('page') || String(DEFAULT_UI_FILTERS.page), 10);
  const pageSize = parseInt(get('pageSize') || String(DEFAULT_UI_FILTERS.pageSize), 10);

  return {
    search,
    site,
    status,
    managementMethod,
    classification,
    isShared,
    calibrationDueFilter,
    teamId,
    sortBy,
    sortOrder,
    page: isNaN(page) || page < 1 ? DEFAULT_UI_FILTERS.page : page,
    pageSize: isNaN(pageSize) || pageSize < 1 ? DEFAULT_UI_FILTERS.pageSize : pageSize,
  };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 *
 * calibrationDueFilter, isShared 등 UI 전용 값을 백엔드 API 파라미터로 변환
 *
 * @param filters - UI 필터 객체
 * @returns API 쿼리 파라미터 객체
 */
export function convertFiltersToApiParams(filters: UIEquipmentFilters): ApiEquipmentFilters {
  // calibrationDueFilter → API 파라미터 변환
  let calibrationDue: number | undefined;
  let calibrationDueAfter: number | undefined;
  let calibrationOverdue: boolean | undefined;

  if (filters.calibrationDueFilter === 'due_soon') {
    calibrationDue = 30; // 30일 이내 교정 예정
  } else if (filters.calibrationDueFilter === 'overdue') {
    calibrationOverdue = true; // 교정 기한 초과
  } else if (filters.calibrationDueFilter === 'normal') {
    calibrationDueAfter = 30; // 30일 이후 교정 예정
  }

  // isShared → boolean 변환
  const isShared =
    filters.isShared === 'shared' ? true : filters.isShared === 'normal' ? false : undefined;

  return {
    search: filters.search || undefined,
    site: filters.site || undefined,
    status: filters.status || undefined,
    managementMethod: filters.managementMethod || undefined,
    classification: filters.classification || undefined,
    isShared,
    calibrationDue,
    calibrationDueAfter,
    calibrationOverdue,
    teamId: filters.teamId || undefined,
    sort: filters.sortBy ? `${filters.sortBy}.${filters.sortOrder}` : undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

/**
 * 활성 필터 개수 계산
 *
 * @param filters - UI 필터 객체
 * @returns 활성 필터 개수
 */
export function countActiveFilters(filters: UIEquipmentFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.site) count++;
  if (filters.status) count++;
  if (filters.managementMethod) count++;
  if (filters.classification) count++;
  if (filters.isShared !== 'all') count++;
  if (filters.calibrationDueFilter !== 'all') count++;
  if (filters.teamId) count++;
  return count;
}

/**
 * API 파라미터에 사용자 표시 설정(preference)을 병합
 *
 * showRetired는 URL 필터가 아닌 사용자 설정이므로 별도로 주입합니다.
 * - 서버: page.tsx에서 getDisplayPreferences() 결과로 호출
 * - 클라이언트: useEquipmentFilters에서 useUserPreferences() 결과로 자동 주입
 *
 * @param apiParams - convertFiltersToApiParams()의 결과
 * @param preferences - showRetiredEquipment 값 (DisplayPreferences에서 추출)
 */
export function withPreferences(
  apiParams: ApiEquipmentFilters,
  preferences: { showRetiredEquipment: boolean }
): ApiEquipmentFilters {
  return { ...apiParams, showRetired: preferences.showRetiredEquipment };
}
