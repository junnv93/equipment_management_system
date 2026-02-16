/**
 * 교정 관리 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
 * ✅ 역할별 기본 필터 적용 (SSOT: buildRoleBasedRedirectUrl)
 * ✅ SSOT 패턴: calibration-filter-utils.ts + calibration-api-server.ts
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildRoleBasedRedirectUrl } from '@/lib/utils/role-filter-utils';
import {
  parseCalibrationFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/calibration-filter-utils';
import * as calibrationApiServer from '@/lib/api/calibration-api-server';
import CalibrationContent from './CalibrationContent';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function CalibrationLoadingFallback() {
  return (
    <ListPageSkeleton
      title="교정 관리"
      description="장비 교정 기록을 관리하고 승인합니다"
      showFilters={true}
      filterCount={7}
      showSearch={true}
      gridCols={{ base: 1 }}
      cardCount={10}
      showActionButton={true}
    />
  );
}

export default function CalibrationPage(props: PageProps) {
  return (
    <Suspense fallback={<CalibrationLoadingFallback />}>
      <CalibrationContentAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function CalibrationContentAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await searchParamsPromise;

  // 1️⃣ 역할별 기본 필터 적용 (서버 사이드 redirect)
  const session = await getServerAuthSession();
  if (session?.user) {
    const redirectUrl = buildRoleBasedRedirectUrl('/calibration', searchParams, session.user);
    if (redirectUrl) redirect(redirectUrl);
  }

  // 2️⃣ 필터 파싱 (SSOT)
  const uiFilters = parseCalibrationFiltersFromSearchParams(searchParams);
  const apiFilters = convertFiltersToApiParams(uiFilters);

  // 3️⃣ 초기 데이터 서버 fetch (FCP 최적화)
  const initialSummary = await calibrationApiServer.getCalibrationSummary(apiFilters);

  return <CalibrationContent initialSummary={initialSummary} initialFilters={uiFilters} />;
}
