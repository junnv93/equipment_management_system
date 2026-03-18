import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EditEquipmentClient } from '@/components/equipment/EditEquipmentClient';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 */
const getEquipmentCached = cache(async (id: string) => {
  return equipmentApiServer.getEquipment(id);
});

/**
 * Next.js 16 PageProps 타입 정의
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 장비 수정 페이지 (PPR Non-Blocking)
 *
 * PPR 패턴:
 * - Page 함수는 동기 (non-async) → 즉시 static shell 전송
 * - Suspense 자식에서 params await + 데이터 fetching
 * - EditEquipmentSkeleton이 즉시 표시 → 데이터 로드 후 콘텐츠 스트리밍
 */
export default function EditEquipmentPage(props: PageProps) {
  return (
    <Suspense fallback={<EditEquipmentSkeleton />}>
      <EditEquipmentAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function EditEquipmentAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  let equipment;
  try {
    equipment = await getEquipmentCached(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return <EditEquipmentClient equipment={equipment} />;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  try {
    const equipment = await getEquipmentCached(id);
    return {
      title: `${equipment.name} 수정`,
      description: `${equipment.name} (${equipment.managementNumber})의 정보를 수정합니다.`,
    };
  } catch {
    return {
      title: '장비 수정',
      description: '장비 정보를 수정합니다.',
    };
  }
}

/**
 * 폼 스켈레톤 (PPR fallback)
 */
function EditEquipmentSkeleton() {
  return (
    <div className={getPageContainerClasses('detail')}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
