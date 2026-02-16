/**
 * 점검 관리 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 전체 컨텐츠 서버 스트리밍
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 장비 점검 일정 및 결과 관리
 * - 중간점검, 자체점검 등 점검 유형별 관리
 * - 점검 상태 추적 (예정/진행중/완료/지연)
 */

import { Suspense } from 'react';
import { createServerApiClient } from '@/lib/api/server-api-client';
import { transformPaginatedResponse } from '@/lib/api/utils/response-transformers';
import MaintenanceContent from './MaintenanceContent';
import { RouteLoading } from '@/components/layout/RouteLoading';
import type { Maintenance } from '@/lib/api/maintenance-api';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function MaintenancePage(_props: PageProps) {
  return (
    <Suspense fallback={<RouteLoading variant="table" showHeader />}>
      <MaintenanceContentAsync />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function MaintenanceContentAsync() {
  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  // 초기 데이터: 점검 목록과 요약 정보를 병렬로 fetch
  let initialData;
  let initialSummary;

  try {
    const [listResponse, summaryResponse] = await Promise.all([
      apiClient.get('/api/maintenances?pageSize=100'),
      apiClient.get('/api/maintenances/summary'),
    ]);

    initialData = transformPaginatedResponse<Maintenance>(listResponse);
    initialSummary = summaryResponse.data || {
      total: 0,
      scheduled: 0,
      inProgress: 0,
      overdue: 0,
    };
  } catch (error) {
    // 에러 발생 시 빈 데이터로 시작 (Client에서 재시도)
    console.error('[MaintenancePage] Initial fetch error:', error);
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
      scheduled: 0,
      inProgress: 0,
      overdue: 0,
    };
  }

  return <MaintenanceContent initialData={initialData} initialSummary={initialSummary} />;
}
