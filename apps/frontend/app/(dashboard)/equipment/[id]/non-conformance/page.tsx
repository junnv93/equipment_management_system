import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import NonConformanceManagementClient from './NonConformanceManagementClient';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import * as nonConformancesApiServer from '@/lib/api/non-conformances-api-server';
import { isNotFoundError } from '@/lib/api/error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 부적합 관리 페이지 (Server Component with Prefetch)
 *
 * 렌더링 전략:
 * - PPR Non-Blocking: Page 함수 동기, Suspense 자식에서 데이터 fetching
 * - 장비 + 부적합 목록을 병렬 프리페치
 * - NonConformanceManagementClient에 initialData로 전달
 * - placeholderData로 stale 취급 → 백그라운드 refetch 보장
 *
 * SSOT:
 * - equipment-api-server.ts / non-conformances-api-server.ts (서버 전용 API)
 * - queryKeys.equipment.detail / queryKeys.nonConformances.byEquipment (클라이언트 캐시 키)
 *
 * 에러 처리:
 * - 장비 미존재(404) → notFound()
 * - 부적합 조회 실패 → 빈 데이터로 폴백 (장비 페이지는 표시)
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 */
const getEquipmentCached = cache(async (id: string) => {
  return equipmentApiServer.getEquipment(id);
});

export default function NonConformanceManagementPage(props: PageProps) {
  return (
    <Suspense fallback={<NonConformanceSkeleton />}>
      <NonConformanceAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function NonConformanceAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  // 장비 데이터는 필수 — 없으면 404
  let equipment;
  try {
    equipment = await getEquipmentCached(id);
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  // 부적합 목록은 선택적 — 실패 시 null (클라이언트에서 재시도)
  let nonConformances;
  try {
    nonConformances = await nonConformancesApiServer.getNonConformances({ equipmentId: id });
  } catch {
    nonConformances = undefined;
  }

  return (
    <NonConformanceManagementClient
      equipmentId={id}
      initialEquipment={equipment}
      initialNonConformances={nonConformances}
    />
  );
}

/**
 * 부적합 관리 스켈레톤 (PPR fallback)
 */
function NonConformanceSkeleton() {
  return (
    <div className={getPageContainerClasses('detail')}>
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
