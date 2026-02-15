/**
 * 교정계획서 목록 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 데이터 fetch
 * - Suspense + ClientOnly wrapper로 hydration mismatch 방지
 * - Client Component에 initialData 전달
 * - FCP 개선 및 SEO 최적화
 *
 * ✅ SSOT 패턴 (2026-02-14)
 * - calibration-plans-filter-utils.ts에서 모든 필터 파싱/변환
 * - calibration-plans-api-server.ts로 서버 사이드 fetch 중앙화
 *
 * ✅ 역할별 기본 필터 (2026-02-15)
 * - technical_manager: 자기 팀만 조회 (site + teamId 필터)
 * - quality_manager, lab_manager: site 필터만 (전체 팀 조회 가능)
 * - system_admin: 필터 미적용 (전체 조회)
 *
 * 비즈니스 로직:
 * - 연간 외부교정 대상 장비의 교정 계획을 관리
 * - 연도/시험소/팀/상태별 필터링 지원
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

export default async function CalibrationPlansPage(props: PageProps) {
  const searchParams = await props.searchParams;

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
    initialData = await calibrationPlansApiServer.getCalibrationPlansList(apiFilters);
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
    <Suspense fallback={<CalibrationPlansLoadingFallback />}>
      <ClientOnly fallback={<CalibrationPlansLoadingFallback />}>
        <CalibrationPlansContent initialData={initialData} initialFilters={uiFilters} />
      </ClientOnly>
    </Suspense>
  );
}
