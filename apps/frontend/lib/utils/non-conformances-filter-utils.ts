/**
 * ============================================================================
 * 🔴 SSOT: 부적합 관리 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 부적합 관리 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 사용처:
 * - app/(dashboard)/non-conformances/page.tsx (Server Component)
 * - hooks/use-nc-filters.ts (Client Hook)
 * - app/(dashboard)/non-conformances/NonConformancesContent.tsx (Client Component)
 *
 * 백엔드 지원 쿼리 파라미터:
 * - status: 'open' | 'analyzing' | 'corrected' | 'closed'
 * - site: 'suwon' | 'uiwang' | 'pyeongtaek'
 * - search: string (원인 검색)
 * - sort: string (예: 'discoveryDate.desc')
 * - page: number
 * - pageSize: number
 *
 * @see apps/backend/src/modules/non-conformances/dto/non-conformance-query.dto.ts
 * ============================================================================
 */

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UINonConformancesFilters {
  status: string; // 상태 ('' = 전체)
  ncType: string; // 유형 ('' = 전체)
  site: string; // 사이트 ('' = 전체)
  search: string; // 검색어 ('' = 전체)
  equipmentId: string; // 장비 UUID ('' = 전체) — 장비 상세에서 진입 시
  sort: string; // 정렬 ('' = 기본값 discoveryDate.desc)
  page: number; // 현재 페이지 (1-based)
  pageSize: number; // 페이지당 항목 수
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiNonConformancesFilters {
  status?: string;
  ncType?: string;
  site?: string;
  search?: string;
  equipmentId?: string;
  sort?: string;
  includeSummary?: boolean;
  page?: number;
  pageSize?: number;
}

/** 부적합 관리 기본 페이지 크기 */
export const NC_DEFAULT_PAGE_SIZE = 20;

/** 기본 정렬 */
export const NC_DEFAULT_SORT = 'discoveryDate.desc';

/**
 * UI 필터 기본값
 */
export function getDefaultNCFilters(): UINonConformancesFilters {
  return {
    status: '',
    ncType: '',
    site: '',
    search: '',
    equipmentId: '',
    sort: NC_DEFAULT_SORT,
    page: 1,
    pageSize: NC_DEFAULT_PAGE_SIZE,
  };
}

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record)
 * @returns UI 필터 객체
 */
export function parseNCFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UINonConformancesFilters {
  const defaults = getDefaultNCFilters();

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

  // ✅ "_all"을 빈 문자열로 변환 (무한 리다이렉트 방지)
  const statusRaw = get('status') || defaults.status;
  const status = statusRaw === '_all' ? '' : statusRaw;

  const siteRaw = get('site') || defaults.site;
  const site = siteRaw === '_all' ? '' : siteRaw;

  const ncTypeRaw = get('ncType') || defaults.ncType;
  const ncType = ncTypeRaw === '_all' ? '' : ncTypeRaw;

  const search = get('search') || defaults.search;

  const equipmentId = get('equipmentId') || defaults.equipmentId;

  const sort = get('sort') || defaults.sort;

  const pageRaw = get('page');
  const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : defaults.page;

  const pageSizeRaw = get('pageSize');
  const pageSize = pageSizeRaw
    ? Math.max(1, parseInt(pageSizeRaw, 10) || defaults.pageSize)
    : defaults.pageSize;

  return { status, ncType, site, search, equipmentId, sort, page, pageSize };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 */
export function convertNCFiltersToApiParams(
  filters: UINonConformancesFilters
): ApiNonConformancesFilters {
  return {
    status: filters.status || undefined,
    ncType: filters.ncType || undefined,
    site: filters.site || undefined,
    search: filters.search || undefined,
    equipmentId: filters.equipmentId || undefined,
    sort: filters.sort !== NC_DEFAULT_SORT ? filters.sort : undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

/**
 * 활성 필터 개수 계산
 *
 * sort, page, pageSize는 카운팅하지 않음
 */
export function countActiveNCFilters(filters: UINonConformancesFilters): number {
  let count = 0;
  if (filters.status) count++;
  if (filters.ncType) count++;
  if (filters.site) count++;
  if (filters.search) count++;
  return count;
}
