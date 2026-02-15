/**
 * 교정 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 summary 데이터 fetch
 * - Client Component(CalibrationContent)에 initialData 전달
 * - FCP 개선 및 client bundle 분리
 *
 * ✅ 역할별 기본 필터 적용 (SSOT: buildRoleBasedRedirectUrl)
 * - test_engineer, technical_manager: 사이트 + 팀 필터
 * - quality_manager, lab_manager: 사이트 필터만
 * - system_admin: 필터 미적용
 *
 * ✅ SSOT 패턴 (2026-02-14)
 * - calibration-filter-utils.ts에서 모든 필터 파싱/변환
 * - calibration-api-server.ts로 서버 사이드 fetch 중앙화
 *
 * 레퍼런스: teams/page.tsx 패턴
 */

import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth/server-session';
import { buildRoleBasedRedirectUrl } from '@/lib/utils/role-filter-utils';
import {
  parseCalibrationFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/calibration-filter-utils';
import * as calibrationApiServer from '@/lib/api/calibration-api-server';
import CalibrationContent from './CalibrationContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CalibrationPage(props: PageProps) {
  const searchParams = await props.searchParams;

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
