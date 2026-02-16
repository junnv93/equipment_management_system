/**
 * ============================================================================
 * 🔴 SSOT: 감사 로그 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 감사 로그 필터 파싱/변환의 유일한 소스입니다.
 *
 * 사용처:
 * - app/(dashboard)/admin/audit-logs/page.tsx (Server Component)
 * - app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx (Client Component)
 *
 * 패턴: team-filter-utils.ts와 동일한 SSOT 패턴
 * ============================================================================
 */

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UIAuditLogFilters {
  entityType: string;
  action: string;
  userId: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiAuditLogFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_UI_FILTERS: UIAuditLogFilters = {
  entityType: '',
  action: '',
  userId: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 20,
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 */
export function parseAuditLogFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UIAuditLogFilters {
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

  return {
    entityType: get('entityType') || DEFAULT_UI_FILTERS.entityType,
    action: get('action') || DEFAULT_UI_FILTERS.action,
    userId: get('userId') || DEFAULT_UI_FILTERS.userId,
    startDate: get('startDate') || DEFAULT_UI_FILTERS.startDate,
    endDate: get('endDate') || DEFAULT_UI_FILTERS.endDate,
    page: parseInt(get('page') || '1', 10),
    limit: parseInt(get('limit') || '20', 10),
  };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 * 빈 문자열 → undefined (파라미터 생략)
 */
export function convertFiltersToApiParams(filters: UIAuditLogFilters): ApiAuditLogFilters {
  return {
    entityType: filters.entityType || undefined,
    action: filters.action || undefined,
    userId: filters.userId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page: filters.page,
    limit: filters.limit,
  };
}

/**
 * 활성 필터 개수 계산 (page/limit 제외)
 */
export function countActiveFilters(filters: UIAuditLogFilters): number {
  let count = 0;
  if (filters.entityType) count++;
  if (filters.action) count++;
  if (filters.userId) count++;
  if (filters.startDate) count++;
  if (filters.endDate) count++;
  return count;
}
