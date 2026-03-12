import { Suspense } from 'react';
import { createServerApiClient } from '@/lib/api/server-api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import PendingChecksClient from './PendingChecksClient';
import { RouteLoading } from '@/components/layout/RouteLoading';
import type { Checkout } from '@/lib/api/checkout-api';

/**
 * 확인 필요 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 데이터 로딩 서버 스트리밍
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 현재 사용자가 확인해야 할 대여 건 목록
 * - 빌리는 측: 인수 확인(②), 반납 전 확인(③)
 * - 빌려주는 측: 반출 전 확인(①), 반입 확인(④)
 */
export default function PendingChecksPage() {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <PendingChecksAsync />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function PendingChecksAsync() {
  const apiClient = await createServerApiClient();

  let initialData;

  try {
    // 확인 필요 목록 fetch
    const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.PENDING_CHECKS);
    initialData = transformPaginatedResponse<Checkout>(response);
  } catch (error) {
    console.error('[PendingChecksPage] Initial fetch error:', error);
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
  }

  return <PendingChecksClient initialData={initialData} />;
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata() {
  return {
    title: '확인 필요 목록',
    description: '내가 확인해야 할 대여 건 목록입니다.',
  };
}
