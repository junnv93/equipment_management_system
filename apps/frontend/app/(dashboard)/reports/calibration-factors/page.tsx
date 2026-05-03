/**
 * 보정계수 대장 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 데이터 로딩 서버 스트리밍
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 보정계수관리대장: 전체 장비의 현재 적용 중인 보정계수 현황
 * - 승인된 보정계수만 대장에 포함
 * - CSV 내보내기 지원
 */

import { Suspense } from 'react';
import { createServerApiClient } from '@/lib/api/server-api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import CalibrationFactorsRegistryContent from './CalibrationFactorsRegistryContent';
import { CalibrationFactorsLoadingSkeleton } from './CalibrationFactorsLoadingSkeleton';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CalibrationFactorsRegistryPage(_props: PageProps) {
  return (
    <Suspense fallback={<CalibrationFactorsLoadingSkeleton />}>
      <CalibrationFactorsAsync />
    </Suspense>
  );
}

/**
 * 비동기 데이터 로딩 컴포넌트 (Suspense 내부에서 실행)
 */
async function CalibrationFactorsAsync() {
  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  let initialData = null;

  try {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_FACTORS.REGISTRY);
    initialData = response.data;
  } catch (error) {
    // 에러 발생 시 null로 시작 (Client에서 재시도)
    console.error('[CalibrationFactorsRegistryPage] Initial fetch error:', error);
  }

  return <CalibrationFactorsRegistryContent initialData={initialData} />;
}
