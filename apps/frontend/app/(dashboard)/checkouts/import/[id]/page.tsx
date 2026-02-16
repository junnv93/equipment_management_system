import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EquipmentImportDetail } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '반입 신청 상세',
  description: '장비 반입 신청의 상세 정보를 확인합니다.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Equipment Import Detail Page - Unified for rental and internal shared
 *
 * PPR 패턴: sync page → Suspense → async child
 */
export default function EquipmentImportDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<ImportDetailSkeleton />}>
      <ImportDetailContentAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function ImportDetailContentAsync({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  return <EquipmentImportDetail id={id} />;
}

function ImportDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
