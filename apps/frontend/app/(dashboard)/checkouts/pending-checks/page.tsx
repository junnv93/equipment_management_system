import { Suspense } from 'react';
import { createServerApiClient } from '@/lib/api/server-api-client';
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import PendingChecksClient from './PendingChecksClient';
import { RouteLoading } from '@/components/layout/RouteLoading';
import type { Checkout } from '@/lib/api/checkout-api';

/**
 * 확인 필요 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 데이터 로딩 서버 스트리밍
 * ✅ SSOT: URL searchParams.role → 서버 fetch → initialRole prop → 클라이언트 placeholderData 매칭
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 현재 사용자가 확인해야 할 대여 건 목록
 * - 빌리는 측: 인수 확인(②), 반납 전 확인(③)
 * - 빌려주는 측: 반출 전 확인(①), 반입 확인(④)
 */

// Next.js 16 PageProps 타입
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PendingCheckRole = 'all' | 'lender' | 'borrower';

/** URL searchParams.role 값 → PendingCheckRole 변환 (유효하지 않으면 'all') */
function parseRole(raw: string | string[] | undefined): PendingCheckRole {
  if (raw === 'lender' || raw === 'borrower') return raw;
  return 'all';
}

export default function PendingChecksPage(props: PageProps) {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <PendingChecksAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 *
 * URL role에 맞는 데이터를 서버에서 fetch하여 initialData/initialRole로 전달.
 * 클라이언트의 placeholderData가 initialRole과 activeRole을 비교해 올바른 데이터만 표시한다.
 */
async function PendingChecksAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;
  const initialRole = parseRole(searchParams.role);

  const apiClient = await createServerApiClient();
  // URL role에 맞는 엔드포인트 호출 — 낭비 없이 필요한 데이터만 fetch
  const roleQuery = initialRole !== 'all' ? `?role=${initialRole}` : '';

  let initialData;
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.CHECKOUTS.PENDING_CHECKS}${roleQuery}`);
    initialData = transformPaginatedResponse<Checkout>(response);
  } catch (error) {
    console.error('[PendingChecksPage] Initial fetch error:', error);
    initialData = {
      data: [],
      meta: {
        pagination: {
          total: 0,
          pageSize: DEFAULT_PAGE_SIZE,
          currentPage: 1,
          totalPages: 0,
        },
      },
    };
  }

  return <PendingChecksClient initialData={initialData} initialRole={initialRole} />;
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
