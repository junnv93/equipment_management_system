/**
 * 부적합 관리 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Static Shell: 없음 (NonConformancesContent가 전체 UI)
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
 * ✅ SSOT 패턴: non-conformances-filter-utils.ts + non-conformances-api-server.ts
 * ✅ 역할별 기본 필터 (buildRoleBasedRedirectUrl)
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  parseNCFiltersFromSearchParams,
  convertNCFiltersToApiParams,
  NC_DEFAULT_PAGE_SIZE,
} from '@/lib/utils/non-conformances-filter-utils';
import * as ncApiServer from '@/lib/api/non-conformances-api-server';
import NonConformancesContent from './NonConformancesContent';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildRoleBasedRedirectUrl } from '@/lib/utils/role-filter-utils';
import { ClientOnly } from '@/components/shared/ClientOnly';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 로딩 폴백 (ListPageSkeleton 사용)
 */
function NonConformancesLoadingFallback() {
  return (
    <ListPageSkeleton
      title="부적합 관리"
      description="장비 부적합 사항을 등록, 분석, 조치하고 종결합니다"
      showFilters={true}
      filterCount={3}
      showSearch={true}
      gridCols={{ base: 1 }}
      cardCount={8}
    />
  );
}

export default function NonConformancesPage(props: PageProps) {
  return (
    <Suspense fallback={<NonConformancesLoadingFallback />}>
      <NonConformancesAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function NonConformancesAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // 1️⃣ 역할별 기본 필터 적용 (서버 사이드 redirect)
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/non-conformances', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 2️⃣ 필터 파싱 (SSOT)
  const uiFilters = parseNCFiltersFromSearchParams(searchParams);
  const apiFilters = convertNCFiltersToApiParams(uiFilters);

  // 3️⃣ 초기 데이터 서버 fetch (FCP 최적화) — KPI 스트립용 summary 포함
  let initialData;
  try {
    initialData = await ncApiServer.getNonConformances({ ...apiFilters, includeSummary: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[NonConformancesPage] Server-side fetch 실패\n' +
          `Query: ${JSON.stringify(apiFilters, null, 2)}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } else {
      console.error('Failed to fetch initial non-conformances:', error);
    }
    initialData = {
      data: [],
      meta: {
        pagination: {
          total: 0,
          pageSize: NC_DEFAULT_PAGE_SIZE,
          currentPage: 1,
          totalPages: 0,
        },
        summary: { open: 0, corrected: 0, closed: 0 },
      },
    };
  }

  return (
    <ClientOnly fallback={<NonConformancesLoadingFallback />}>
      <NonConformancesContent initialData={initialData} initialFilters={uiFilters} />
    </ClientOnly>
  );
}
