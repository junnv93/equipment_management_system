/**
 * ============================================================================
 * 🔴 SSOT: 교정계획서 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 교정계획서 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 이 파일이 존재하는 이유:
 * - 2026-02-14: Equipment, Teams, Calibration 페이지의 SSOT 패턴을 CalibrationPlans 페이지에 적용
 * - page.tsx의 하드코딩된 필터 파싱 로직을 중앙화
 *
 * 사용처:
 * - app/(dashboard)/calibration-plans/page.tsx (Server Component)
 * - hooks/use-calibration-plans-filters.ts (Client Hook)
 * - app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx (Client Component)
 *
 * ============================================================================
 */

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UICalibrationPlansFilters {
  year: string; // 연도 ('' = 전체, 기본값은 현재 연도)
  siteId: string; // 사이트 ID ('' = 전체)
  teamId: string; // 팀 ID ('' = 전체)
  status: string; // 상태 ('' = 전체)
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiCalibrationPlansFilters {
  year?: string;
  siteId?: string;
  teamId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * UI 필터 기본값
 *
 * year는 현재 연도로 동적 설정
 */
export function getDefaultUIFilters(): UICalibrationPlansFilters {
  const currentYear = new Date().getFullYear();
  return {
    year: String(currentYear),
    siteId: '',
    teamId: '',
    status: '',
  };
}

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record<string, string | string[] | undefined>)
 * @returns UI 필터 객체
 */
export function parseCalibrationPlansFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UICalibrationPlansFilters {
  const defaultFilters = getDefaultUIFilters();

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

  const year = get('year') || defaultFilters.year;

  // ✅ "_all"을 빈 문자열로 변환 (무한 리다이렉트 방지)
  const siteIdRaw = get('siteId') || defaultFilters.siteId;
  const siteId = siteIdRaw === '_all' ? '' : siteIdRaw;

  const teamIdRaw = get('teamId') || defaultFilters.teamId;
  const teamId = teamIdRaw === '_all' ? '' : teamIdRaw;

  const statusRaw = get('status') || defaultFilters.status;
  const status = statusRaw === '_all' ? '' : statusRaw;

  return {
    year,
    siteId,
    teamId,
    status,
  };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 *
 * @param filters - UI 필터 객체
 * @returns API 쿼리 파라미터 객체
 */
export function convertFiltersToApiParams(
  filters: UICalibrationPlansFilters
): ApiCalibrationPlansFilters {
  return {
    year: filters.year || undefined,
    siteId: filters.siteId || undefined,
    teamId: filters.teamId || undefined,
    status: filters.status || undefined,
    pageSize: 100, // 교정계획은 보통 많지 않으므로 한 번에 로드
  };
}

/**
 * 활성 필터 개수 계산
 *
 * year는 기본값이므로 카운팅하지 않음
 *
 * @param filters - UI 필터 객체
 * @returns 활성 필터 개수
 */
export function countActiveFilters(filters: UICalibrationPlansFilters): number {
  const defaultFilters = getDefaultUIFilters();
  let count = 0;
  // year는 기본값(현재 연도)과 다를 때만 카운팅
  if (filters.year && filters.year !== defaultFilters.year) count++;
  if (filters.siteId) count++;
  if (filters.teamId) count++;
  if (filters.status) count++;
  return count;
}
