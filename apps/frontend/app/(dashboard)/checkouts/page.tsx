/**
 * 반출입 관리 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
 *
 * 역할별 데이터 스코핑:
 * - 백엔드 @SiteScoped 데코레이터가 JWT 기반으로 자동 필터링 (SSOT)
 * - 프론트엔드는 session.user.teamId를 API 호출에 전달
 * - URL 기반 buildRoleBasedRedirectUrl은 사용하지 않음
 *   (장비/교정 페이지와 달리 checkout-filter-utils에 site/teamId 파싱이 없으므로)
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 장비 반출 요청 및 현황 관리
 * - 반출 목적: 교정, 수리, 대여(외부 대여는 2단계 승인 필요)
 * - 반출 시 장비 상태가 'checked_out'으로 변경
 *
 * URL 파라미터:
 * - ?view=outbound|inbound (기본: outbound)
 * - ?tab=rental_imports (레거시 호환 → inbound로 매핑)
 */

import { Suspense } from 'react';
import { createServerApiClient } from '@/lib/api/server-api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import CheckoutsContent from './CheckoutsContent';
import { RouteLoading } from '@/components/layout/RouteLoading';
import type { CheckoutSummary } from '@/lib/api/checkout-api';
import { parseCheckoutFiltersFromSearchParams } from '@/lib/utils/checkout-filter-utils';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CheckoutsPage(props: PageProps) {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <CheckoutsContentAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function CheckoutsContentAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // URL 파라미터에서 초기 필터 파싱 (SSOT)
  const initialFilters = parseCheckoutFiltersFromSearchParams(searchParams);

  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  let initialSummary: CheckoutSummary;

  try {
    // pageSize=1: 목록 데이터 불필요, summary만 취득
    const listResponse = await apiClient.get(
      `${API_ENDPOINTS.CHECKOUTS.LIST}?pageSize=1&includeSummary=true`
    );
    const transformed = transformPaginatedResponse<unknown, CheckoutSummary>(listResponse);
    initialSummary = transformed.meta.summary ?? {
      total: 0,
      pending: 0,
      approved: 0,
      overdue: 0,
      returnedToday: 0,
    };
  } catch (error) {
    // 에러 발생 시 기본값으로 시작 (Client에서 live query로 갱신)
    console.error('[CheckoutsPage] Initial fetch error:', error);
    initialSummary = {
      total: 0,
      pending: 0,
      approved: 0,
      overdue: 0,
      returnedToday: 0,
    };
  }

  return <CheckoutsContent initialSummary={initialSummary} initialFilters={initialFilters} />;
}
