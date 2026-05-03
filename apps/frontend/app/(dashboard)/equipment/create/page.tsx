/**
 * 장비 등록 페이지 — PPR Non-Blocking Pattern
 *
 * ✅ Dynamic Hole: Suspense로 세션 로딩 서버 스트리밍
 */

import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/server-session';
import CreateEquipmentContent from './CreateEquipmentContent';
import { CreateEquipmentFormSkeleton } from './CreateEquipmentFormSkeleton';

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
