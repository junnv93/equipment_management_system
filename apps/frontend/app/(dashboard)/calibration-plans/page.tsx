/**
 * 교정계획서 목록 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 데이터 fetch
 * - Client Component에 initialData 전달
 * - FCP 개선 및 SEO 최적화
 *
 * 비즈니스 로직:
 * - 연간 외부교정 대상 장비의 교정 계획을 관리
 * - 연도/시험소/상태별 필터링 지원
 */

import { createServerApiClient } from '@/lib/api/server-api-client';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import CalibrationPlansContent from './CalibrationPlansContent';
import type { CalibrationPlan } from '@/lib/api/calibration-plans-api';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CalibrationPlansPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // URL 쿼리 파라미터에서 필터 값 추출
  const currentYear = new Date().getFullYear();
  const year = typeof searchParams?.year === 'string' ? searchParams.year : String(currentYear);
  const siteId = typeof searchParams?.siteId === 'string' ? searchParams.siteId : undefined;
  const status = typeof searchParams?.status === 'string' ? searchParams.status : undefined;

  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  // 쿼리 파라미터 구성
  const params = new URLSearchParams();
  if (year && year !== 'all') params.append('year', year);
  if (siteId && siteId !== 'all') params.append('siteId', siteId);
  if (status && status !== 'all') params.append('status', status);

  let initialData;
  try {
    const response = await apiClient.get(`/api/calibration-plans?${params.toString()}`);
    initialData = transformPaginatedResponse<CalibrationPlan>(response);
  } catch (error) {
    // 에러 발생 시 빈 데이터로 시작 (Client에서 재시도)
    console.error('[CalibrationPlansPage] Initial fetch error:', error);
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
    <CalibrationPlansContent
      initialData={initialData}
      initialYear={year}
      initialSite={siteId ?? 'all'}
      initialStatus={status ?? 'all'}
    />
  );
}
