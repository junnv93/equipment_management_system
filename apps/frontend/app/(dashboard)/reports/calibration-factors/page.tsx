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
import CalibrationFactorsRegistryContent from './CalibrationFactorsRegistryContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function CalibrationFactorsLoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

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
    const response = await apiClient.get('/api/calibration-factors/registry');
    initialData = response.data;
  } catch (error) {
    // 에러 발생 시 null로 시작 (Client에서 재시도)
    console.error('[CalibrationFactorsRegistryPage] Initial fetch error:', error);
  }

  return <CalibrationFactorsRegistryContent initialData={initialData} />;
}
