import { Suspense, cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CalibrationHistoryClient } from '@/components/equipment/CalibrationHistoryClient';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';
import { getPageContainerClasses } from '@/lib/design-tokens';
import {
  parseCalibrationFiltersFromSearchParams,
  type UICalibrationFilters,
} from '@/lib/utils/calibration-filter-utils';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const getEquipmentCached = cache(async (id: string) => {
  return equipmentApiServer.getEquipment(id);
});

export default function CalibrationHistoryPage(props: PageProps) {
  return (
    <div className={getPageContainerClasses('detail')}>
      <Suspense fallback={<CalibrationHistorySkeleton />}>
        <CalibrationHistoryAsync
          paramsPromise={props.params}
          searchParamsPromise={props.searchParams}
        />
      </Suspense>
    </div>
  );
}

async function CalibrationHistoryAsync({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, searchParams] = await Promise.all([paramsPromise, searchParamsPromise]);
  const initialFilters: UICalibrationFilters =
    parseCalibrationFiltersFromSearchParams(searchParams);

  let equipment;
  try {
    equipment = await getEquipmentCached(id);
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <CalibrationHistoryClient
      equipmentId={id}
      initialEquipment={equipment}
      initialFilters={initialFilters}
    />
  );
}

function CalibrationHistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-6 w-16" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: '교정 이력 - 장비 관리',
    description: `장비 ${id}의 교정 이력을 관리합니다.`,
    openGraph: {
      title: '교정 이력 - 장비 관리',
      description: '장비의 교정 이력, 차기 교정 예정일, 성적서 정보를 확인하세요.',
    },
  };
}
