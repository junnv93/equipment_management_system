import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReceiveEquipmentImportForm } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '수령 확인',
  description: '반입 장비의 수령 상태를 점검하고 확인합니다.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Equipment Import Receive Page - Unified for rental and internal shared
 *
 * PPR 패턴: sync page → Suspense → async child
 */
export default function ReceiveEquipmentImportPage(props: PageProps) {
  return (
    <Suspense fallback={<ReceiveFormSkeleton />}>
      <ReceiveContentAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function ReceiveContentAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  return <ReceiveEquipmentImportForm id={id} />;
}

function ReceiveFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-36" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
