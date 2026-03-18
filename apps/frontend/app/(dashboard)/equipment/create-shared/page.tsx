/**
 * 공용/렌탈 장비 임시등록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 세션 로딩 서버 스트리밍
 */

import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server-session';
import CreateSharedEquipmentContent from './CreateSharedEquipmentContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';

function CreateSharedEquipmentFormSkeleton() {
  return (
    <div className={getPageContainerClasses()}>
      <Skeleton className="h-9 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateSharedEquipmentPage() {
  return (
    <Suspense fallback={<CreateSharedEquipmentFormSkeleton />}>
      <CreateSharedEquipmentAsync />
    </Suspense>
  );
}

/**
 * 비동기 세션 로딩 + 폼 렌더링 (Suspense 내부에서 실행)
 */
async function CreateSharedEquipmentAsync() {
  const user = await getCurrentUser();

  const userDefaults = {
    site: user?.site,
    teamId: user?.teamId,
  };

  return <CreateSharedEquipmentContent userDefaults={userDefaults} />;
}
