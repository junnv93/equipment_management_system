import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ValidationDetailContent from './ValidationDetailContent';

type PageProps = {
  params: Promise<{ id: string; validationId: string }>;
};

export default function ValidationDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function DetailAsync({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string; validationId: string }>;
}) {
  const { id, validationId } = await paramsPromise;
  return <ValidationDetailContent softwareId={id} validationId={validationId} />;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
