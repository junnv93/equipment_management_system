import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SoftwareValidationContent from './SoftwareValidationContent';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SoftwareValidationPage(props: PageProps) {
  return (
    <Suspense fallback={<ValidationSkeleton />}>
      <ValidationAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function ValidationAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  return <SoftwareValidationContent softwareId={id} />;
}

function ValidationSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
