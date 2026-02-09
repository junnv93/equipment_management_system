/**
 * 반출입 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 데이터 fetch
 * - Client Component에 initialData 전달
 * - FCP 개선 및 SEO 최적화
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 장비 반출 요청 및 현황 관리
 * - 반출 목적: 교정, 수리, 대여(외부 대여는 2단계 승인 필요)
 * - 반출 시 장비 상태가 'checked_out'으로 변경
 */

import { createServerApiClient } from '@/lib/api/server-api-client';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import CheckoutsContent from './CheckoutsContent';
import type { Checkout } from '@/lib/api/checkout-api';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutsPage(_props: PageProps) {
  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  let initialData;
  let initialSummary;

  try {
    // 초기 반출 목록 fetch
    const listResponse = await apiClient.get('/api/checkouts?pageSize=100');
    initialData = transformPaginatedResponse<Checkout>(listResponse);

    // 요약 정보 생성 (백엔드에 summary 엔드포인트가 없으므로 목록에서 계산)
    initialSummary = {
      total: initialData.meta.pagination.total,
      pending: 0, // TODO: 백엔드에서 상태별 카운트 제공 시 업데이트
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

  return <CheckoutsContent initialData={initialData} initialSummary={initialSummary} />;
}
