/**
 * 부적합 상세 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ PPR: Suspense + async wrapper
 * ✅ 404 처리: notFound()
 * ✅ 서버 프리페치: non-conformances-api-server.ts
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import * as ncApiServer from '@/lib/api/non-conformances-api-server';
import NCDetailClient from '@/components/non-conformances/NCDetailClient';
import { ClientOnly } from '@/components/shared/ClientOnly';
import { Skeleton } from '@/components/ui/skeleton';

type PageProps = {
  params: Promise<{ id: string }>;
};

function NCDetailLoadingFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}

export default function NCDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<NCDetailLoadingFallback />}>
      <NCDetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function NCDetailAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  let initialData;
  try {
    initialData = await ncApiServer.getNonConformance(id);
  } catch {
    notFound();
  }

  return (
    <ClientOnly fallback={<NCDetailLoadingFallback />}>
      <NCDetailClient ncId={id} initialData={initialData} />
    </ClientOnly>
  );
}
