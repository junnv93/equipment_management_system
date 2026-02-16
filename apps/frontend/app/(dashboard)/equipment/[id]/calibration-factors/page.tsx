import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CalibrationFactorsClient } from '@/components/equipment/CalibrationFactorsClient';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 보정계수 관리 페이지 - Server Component
 *
 * PPR 패턴: sync page → Suspense → async child
 */
export default function CalibrationFactorsPage(props: PageProps) {
  return (
    <Suspense fallback={<CalibrationFactorsSkeleton />}>
      <CalibrationFactorsContentAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function CalibrationFactorsContentAsync({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  return <CalibrationFactorsClient equipmentId={id} />;
}

function CalibrationFactorsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
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
    title: '보정계수 관리 - 장비 관리',
    description: `장비 ${id}의 보정계수를 관리합니다.`,
    openGraph: {
      title: '보정계수 관리 - 장비 관리',
      description: `안테나 이득, 케이블 손실 등 보정계수를 관리하세요.`,
    },
  };
}
