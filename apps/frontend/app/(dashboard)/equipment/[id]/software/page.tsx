import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import SoftwareHistoryClient from './SoftwareHistoryClient';

/**
 * 소프트웨어 변경 이력 페이지 (Server Component)
 *
 * PPR 패턴: sync page → Suspense → async child
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EquipmentSoftwareHistoryPage(props: PageProps) {
  return (
    <Suspense fallback={<SoftwareHistorySkeleton />}>
      <SoftwareHistoryContentAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function SoftwareHistoryContentAsync({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  return <SoftwareHistoryClient equipmentId={id} />;
}

function SoftwareHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
