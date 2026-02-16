/**
 * 반출입 관리 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
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
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import CheckoutsContent from './CheckoutsContent';
import { RouteLoading } from '@/components/layout/RouteLoading';
import type { Checkout } from '@/lib/api/checkout-api';

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

  // URL 파라미터에서 view 모드 결정
  // 기존 ?tab=rental_imports → ?view=inbound 호환
  let initialView: 'outbound' | 'inbound' = 'outbound';
  if (searchParams.view === 'inbound' || searchParams.tab === 'rental_imports') {
    initialView = 'inbound';
  }

  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  let initialData;
  let initialSummary;

  try {
    // ✅ 성능 최적화: includeSummary=true로 목록+요약을 단일 요청으로 조회
    const listResponse = await apiClient.get('/api/checkouts?pageSize=100&includeSummary=true');
    initialData = transformPaginatedResponse<Checkout>(listResponse);

    // 백엔드에서 summary를 포함하여 반환하면 사용, 없으면 기본값
    initialSummary = (listResponse.data as any).summary || {
      total: initialData.meta.pagination.total,
      pending: 0,
      approved: 0,
      overdue: 0,
      returnedToday: 0,
    };
  } catch (error) {
    // 에러 발생 시 빈 데이터로 시작 (Client에서 재시도)
    console.error('[CheckoutsPage] Initial fetch error:', error);
    initialData = {
      data: [],
      meta: {
        pagination: {
          total: 0,
          pageSize: 20,
          currentPage: 1,
          totalPages: 0,
        },
      },
    };
    initialSummary = {
      total: 0,
      pending: 0,
      approved: 0,
      overdue: 0,
      returnedToday: 0,
    };
  }

  return (
    <CheckoutsContent
      initialData={initialData}
      initialSummary={initialSummary}
      initialView={initialView}
    />
  );
}
