/**
 * ============================================================================
 * 🔴 SSOT: 반출 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 반출 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 사용처:
 * - app/(dashboard)/checkouts/page.tsx (Server Component)
 * - app/(dashboard)/checkouts/CheckoutsContent.tsx (Client Component)
 *
 * ============================================================================
 * 🔴 새로운 필터 추가 시 체크리스트
 * ============================================================================
 *
 * 1. [이 파일] UICheckoutFilters 인터페이스에 필드 추가
 * 2. [이 파일] DEFAULT_UI_FILTERS에 기본값 추가
 * 3. [이 파일] parseCheckoutFiltersFromSearchParams() 함수 업데이트
 * 4. [이 파일] convertFiltersToApiParams() 함수 업데이트
 * 5. [이 파일] filtersToSearchParams() 함수 업데이트
 * 6. [이 파일] countActiveFilters() 함수 업데이트
 * 7. CheckoutsContent.tsx - 필터 UI 컴포넌트
 * 8. OutboundCheckoutsTab.tsx / InboundCheckoutsTab.tsx - API 쿼리 업데이트
 *
 * ============================================================================
 */

/**
 * UI에서 사용하는 반출 필터 타입 (URL 파라미터와 1:1 대응)
 */
export type CheckoutPeriod = 'all' | 'this_week' | 'this_month' | 'last_month';

export interface UICheckoutFilters {
  /** 탭 뷰 모드 */
  view: 'outbound' | 'inbound';
  /** 검색어 */
  search: string;
  /** 반출 상태 ('all' 또는 특정 status 값) */
  status: string;
  /** 반출지 ('all' 또는 특정 destination) */
  destination: string;
  /** 반출 목적 ('all', 'calibration', 'repair', 'rental') */
  purpose: string;
  /** 기간 프리셋 */
  period: CheckoutPeriod;
  /** 현재 페이지 */
  page: number;
  /** 페이지 크기 */
  pageSize: number;
}

/**
 * API 파라미터 타입 (convertFiltersToApiParams 반환값)
 */
export interface ApiCheckoutParams {
  page: number;
  pageSize: number;
  search?: string;
  statuses?: string;
  destination?: string;
  purpose?: string;
  checkoutFrom?: string;
  checkoutTo?: string;
}

/**
 * UI 필터 기본값
 *
 * "전체" = 파라미터 생략 규칙:
 * - status/destination/purpose = 'all' → URL에서 파라미터 생략
 * - view = 'outbound' → URL에서 파라미터 생략
 */
export const DEFAULT_UI_FILTERS: UICheckoutFilters = {
  view: 'outbound',
  search: '',
  status: 'all',
  destination: 'all',
  purpose: 'all',
  period: 'all',
  page: 1,
  pageSize: 20,
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record)
 * @returns UI 필터 객체
 *
 * 레거시 호환:
 * - ?tab=rental_imports → view=inbound
 */
export function parseCheckoutFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UICheckoutFilters {
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

  // view 파싱 (레거시 ?tab=rental_imports 호환)
  const viewRaw = get('view');
  const tabRaw = get('tab');
  let view: 'outbound' | 'inbound' = DEFAULT_UI_FILTERS.view;
  if (viewRaw === 'inbound' || tabRaw === 'rental_imports') {
    view = 'inbound';
  }

  const search = get('search') || DEFAULT_UI_FILTERS.search;
  const status = get('status') || DEFAULT_UI_FILTERS.status;
  const destination = get('destination') || DEFAULT_UI_FILTERS.destination;
  const purpose = get('purpose') || DEFAULT_UI_FILTERS.purpose;

  const periodRaw = get('period');
  const period: CheckoutPeriod =
    periodRaw === 'this_week' || periodRaw === 'this_month' || periodRaw === 'last_month'
      ? periodRaw
      : DEFAULT_UI_FILTERS.period;

  const pageRaw = parseInt(get('page') || String(DEFAULT_UI_FILTERS.page), 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? DEFAULT_UI_FILTERS.page : pageRaw;

  const pageSizeRaw = parseInt(get('pageSize') || String(DEFAULT_UI_FILTERS.pageSize), 10);
  const pageSize =
    isNaN(pageSizeRaw) || pageSizeRaw < 1 ? DEFAULT_UI_FILTERS.pageSize : pageSizeRaw;

  return { view, search, status, destination, purpose, period, page, pageSize };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 *
 * @param filters - UI 필터 객체
 * @returns API 쿼리 파라미터 객체
 */
/** 기간 프리셋 → API checkoutFrom/checkoutTo 변환 (YYYY-MM-DD) */
function periodToDateRange(period: CheckoutPeriod): { checkoutFrom?: string; checkoutTo?: string } {
  if (period === 'all') return {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (period === 'this_week') {
    const dayOfWeek = today.getDay() || 7; // 0(일) → 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    return { checkoutFrom: fmt(monday) };
  }
  if (period === 'this_month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { checkoutFrom: fmt(first) };
  }
  if (period === 'last_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { checkoutFrom: fmt(first), checkoutTo: fmt(last) };
  }
  return {};
}

export function convertFiltersToApiParams(filters: UICheckoutFilters): ApiCheckoutParams {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    statuses: filters.status !== 'all' ? filters.status : undefined,
    destination: filters.destination !== 'all' ? filters.destination : undefined,
    purpose: filters.purpose !== 'all' ? filters.purpose : undefined,
    ...periodToDateRange(filters.period),
  };
}

/**
 * UI 필터를 URLSearchParams로 변환
 *
 * 기본값과 같은 필터는 파라미터를 생략 ("전체" = 파라미터 없음)
 *
 * @param filters - UI 필터 객체
 * @returns URLSearchParams (URL에 반영할 파라미터)
 */
export function filtersToSearchParams(filters: UICheckoutFilters): URLSearchParams {
  const params = new URLSearchParams();

  // 기본값과 다른 경우만 URL에 포함
  if (filters.view !== DEFAULT_UI_FILTERS.view) params.set('view', filters.view);
  if (filters.search) params.set('search', filters.search);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.destination !== 'all') params.set('destination', filters.destination);
  if (filters.purpose !== 'all') params.set('purpose', filters.purpose);
  if (filters.period !== 'all') params.set('period', filters.period);
  if (filters.page !== DEFAULT_UI_FILTERS.page) params.set('page', String(filters.page));
  if (filters.pageSize !== DEFAULT_UI_FILTERS.pageSize)
    params.set('pageSize', String(filters.pageSize));

  return params;
}

/**
 * 활성 필터 개수 계산 (검색, 상태, 반출지, 목적)
 *
 * @param filters - UI 필터 객체
 * @returns 활성 필터 개수
 */
export function countActiveFilters(filters: UICheckoutFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.status !== 'all') count++;
  if (filters.destination !== 'all') count++;
  if (filters.purpose !== 'all') count++;
  if (filters.period !== 'all') count++;
  return count;
}
