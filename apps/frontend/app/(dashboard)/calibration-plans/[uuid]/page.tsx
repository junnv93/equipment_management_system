import { Suspense, cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalibrationPlanDetailClient } from '@/components/calibration/CalibrationPlanDetailClient';
import * as calibrationPlansApiServer from '@/lib/api/calibration-plans-api-server';
import { isNotFoundError } from '@/lib/api/error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 *
 * generateMetadata()와 Page()에서 각각 호출해도 한 번만 fetch됩니다.
 * equipment/[id]/page.tsx와 동일한 패턴 — SSOT.
 */
const getCalibrationPlanCached = cache(async (uuid: string) => {
  return calibrationPlansApiServer.getCalibrationPlan(uuid);
});

/**
 * 교정계획서 상세 페이지 - PPR Non-Blocking
 *
 * 렌더링 전략:
 * - Page 함수 동기 → 즉시 static shell 전송
 * - Suspense 자식에서 params await + 데이터 fetching
 * - CalibrationPlanSkeleton 즉시 표시 → 데이터 로드 후 콘텐츠 스트리밍
 * - React.cache()로 generateMetadata와 Page 간 API 중복 호출 방지
 *
 * 에러 처리:
 * - 404 → notFound() (not-found.tsx 렌더링)
 * - 기타 에러 → error.tsx로 전파
 */
export default function CalibrationPlanDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<CalibrationPlanSkeleton />}>
      <CalibrationPlanDetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function CalibrationPlanDetailAsync({
  paramsPromise,
}: {
  paramsPromise: Promise<{ uuid: string }>;
}) {
  const { uuid } = await paramsPromise;

  let plan;
  try {
    plan = await getCalibrationPlanCached(uuid);
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return <CalibrationPlanDetailClient planUuid={uuid} initialData={plan} />;
}

/**
 * 동적 메타데이터 생성
 *
 * React.cache()된 함수를 재사용하여 Page와 동일한 데이터로 메타데이터 생성.
 * 추가 API 호출 없음.
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { uuid } = await props.params;

  try {
    const plan = await getCalibrationPlanCached(uuid);
    return {
      title: `${plan.year}년 교정계획서 - 장비 관리`,
      description: `${plan.siteId} 사이트의 ${plan.year}년 교정계획서 상세 내용을 확인합니다.`,
      openGraph: {
        title: `${plan.year}년 교정계획서 - 장비 관리`,
        description: `교정 대상 장비 목록, 일정, 승인 상태를 확인하세요.`,
      },
    };
  } catch {
    return {
      title: '교정계획서 상세 - 장비 관리',
      description: `교정계획서 상세 내용을 확인합니다.`,
    };
  }
}

/**
 * 교정계획서 상세 스켈레톤 (PPR fallback)
 */
function CalibrationPlanSkeleton() {
  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
