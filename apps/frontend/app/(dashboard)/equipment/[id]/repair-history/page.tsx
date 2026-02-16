import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RepairHistoryClient } from '@/components/equipment/RepairHistoryClient';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 수리 이력 페이지 - Server Component
 *
 * PPR 패턴: sync page → Suspense → async child (params + searchParams)
 */
export default function RepairHistoryPage(props: PageProps) {
  return (
    <Suspense fallback={<RepairHistorySkeleton />}>
      <RepairHistoryContentAsync
        paramsPromise={props.params}
        searchParamsPromise={props.searchParams}
      />
    </Suspense>
  );
}

async function RepairHistoryContentAsync({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await paramsPromise;
  const searchParams = await searchParamsPromise;

  // Query params 추출
  const ncId = typeof searchParams.ncId === 'string' ? searchParams.ncId : undefined;
  const autoOpen = searchParams.autoOpen === 'true';

  return <RepairHistoryClient equipmentId={id} initialNcId={ncId} autoOpen={autoOpen} />;
}

function RepairHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: '수리 이력 - 장비 관리',
    description: `장비 ${id}의 수리 이력을 관리합니다.`,
    openGraph: {
      title: '수리 이력 - 장비 관리',
      description: `장비의 수리 이력, 비용, 담당자 정보를 확인하세요.`,
    },
  };
}
