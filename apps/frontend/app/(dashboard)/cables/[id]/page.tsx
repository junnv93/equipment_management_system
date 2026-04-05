import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CableDetailContent from './CableDetailContent';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CableDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function DetailAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  return <CableDetailContent id={id} />;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
