/**
 * 장비 등록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 세션 로딩 서버 스트리밍
 */

import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server-session';
import CreateEquipmentContent from './CreateEquipmentContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';

function CreateEquipmentFormSkeleton() {
  return (
    <div className={getPageContainerClasses()}>
      <Skeleton className="h-9 w-32" />
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

export default function CreateEquipmentPage() {
  return (
    <Suspense fallback={<CreateEquipmentFormSkeleton />}>
      <CreateEquipmentAsync />
    </Suspense>
  );
}

/**
 * 비동기 세션 로딩 + 폼 렌더링 (Suspense 내부에서 실행)
 */
async function CreateEquipmentAsync() {
  // ✅ Server Component에서 세션 읽기
  const user = await getCurrentUser();

  // Client Component에 전달할 사용자 기본값 (최소 직렬화)
  const userDefaults = {
    site: user?.site,
    teamId: user?.teamId,
  };

  return <CreateEquipmentContent userDefaults={userDefaults} />;
}
