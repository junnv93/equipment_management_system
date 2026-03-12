/**
 * 교정계획서 목록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Static Shell: 없음 (CalibrationPlansContent가 전체 UI)
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
 * ✅ SSOT 패턴: calibration-plans-filter-utils.ts + calibration-plans-api-server.ts
 * ✅ 역할별 기본 필터 (buildRoleBasedRedirectUrl)
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import {
  parseCalibrationPlansFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/calibration-plans-filter-utils';
import * as calibrationPlansApiServer from '@/lib/api/calibration-plans-api-server';
import CalibrationPlansContent from './CalibrationPlansContent';
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
function CalibrationPlansLoadingFallback() {
  return (
    <ListPageSkeleton
      title="교정계획서"
      description="연간 외부교정 대상 장비의 교정 계획을 관리합니다"
      showFilters={true}
      filterCount={4}
      showSearch={false}
      gridCols={{ base: 1 }}
      cardCount={8}
      showActionButton={true}
    />
  );
}

export default function CalibrationPlansPage(props: PageProps) {
  return (
    <Suspense fallback={<CalibrationPlansLoadingFallback />}>
      <CalibrationPlansAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function CalibrationPlansAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // 1️⃣ 역할별 기본 필터 적용 (서버 사이드 redirect)
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/calibration-plans', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 2️⃣ 필터 파싱 (SSOT)
  const uiFilters = parseCalibrationPlansFiltersFromSearchParams(searchParams);
  const apiFilters = convertFiltersToApiParams(uiFilters);

  // 3️⃣ 초기 데이터 서버 fetch (FCP 최적화)
  let initialData;
  try {
    initialData = await calibrationPlansApiServer.getCalibrationPlansList({
      ...apiFilters,
      includeSummary: true,
    });
  } catch (error) {
    // 에러 발생 시 빈 데이터로 시작 (Client에서 재시도)
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[CalibrationPlansPage] Server-side fetch 실패\n' +
          `Query: ${JSON.stringify(apiFilters, null, 2)}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } else {
      console.error('Failed to fetch initial calibration plans:', error);
    }
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

  return (
    <ClientOnly fallback={<CalibrationPlansLoadingFallback />}>
      <CalibrationPlansContent initialData={initialData} initialFilters={uiFilters} />
    </ClientOnly>
  );
}
