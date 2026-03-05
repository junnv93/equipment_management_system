import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient';
import { EquipmentDetailSkeleton } from '@/components/equipment/EquipmentDetailSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import * as disposalApiServer from '@/lib/api/disposal-api-server';
import { isNotFoundError } from '@/lib/api/error';
import { getServerAuthSession } from '@/lib/auth/server-session';

/**
 * ✅ React.cache()로 같은 render pass에서 중복 호출 방지
 *
 * generateMetadata()와 Page()에서 각각 호출해도 한 번만 fetch됩니다.
 * 이 패턴은 Next.js 공식 권장 방식입니다.
 */
const getEquipmentCached = cache(async (id: string) => {
  return equipmentApiServer.getEquipment(id);
});

/**
 * 폐기 요청 조회 (인증된 사용자만)
 *
 * ✅ SSOT: Server Component는 getServerAuthSession() 사용
 * ✅ Best Practice: 조건부 조회로 불필요한 401 에러 방지
 */
const getDisposalRequestCached = cache(async (id: string) => {
  try {
    // ✅ NextAuth 세션 확인 (SSOT)
    const session = await getServerAuthSession();

    // 로그인하지 않은 사용자는 폐기 정보 조회 불필요
    if (!session) {
      return null;
    }

    // ✅ Server Component용 API 사용
    return await disposalApiServer.getCurrentDisposalRequest(id);
  } catch (error) {
    // 폐기 정보 조회 실패 시 null 반환 (선택적 데이터)
    console.error(`[Equipment Detail] Failed to fetch disposal request for ${id}:`, error);
    return null;
  }
});

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 장비 상세 페이지 - Server Component (PPR Non-Blocking)
 *
 * PPR 패턴:
 * - Page 함수는 동기 (non-async) → 즉시 static shell 전송
 * - Suspense 자식에서 params await + 데이터 fetching
 * - EquipmentDetailSkeleton이 즉시 표시 → 데이터 로드 후 콘텐츠 스트리밍
 */
export default function EquipmentDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<EquipmentDetailSkeleton />}>
      <EquipmentDetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function EquipmentDetailAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  // ✅ Next.js 16: params는 Promise, await 필수
  const { id } = await paramsPromise;

  // ✅ 병렬 fetch: 두 요청 모두 id만 필요하므로 동시 시작 후 await late (Rule 1.3)
  const equipmentPromise = getEquipmentCached(id);
  const disposalPromise = getDisposalRequestCached(id);

  let equipment;
  try {
    equipment = await equipmentPromise;
  } catch (error: unknown) {
    // ✅ Next.js 16 Best Practice: any 타입 대신 타입 안전한 에러 처리
    // 404 에러인 경우 not-found 페이지로
    if (isNotFoundError(error)) {
      notFound();
    }
    // 그 외 에러는 error.tsx에서 처리
    throw error;
  }

  const disposalRequest = await disposalPromise;

  return <EquipmentDetailClient equipment={equipment} disposalRequest={disposalRequest} />;
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;

  try {
    // ✅ React.cache()로 메모이제이션된 함수 사용 (Page와 동일 함수)
    const equipment = await getEquipmentCached(id);
    return {
      title: `${equipment.name} - 장비 상세`,
      description: `${equipment.name} (${equipment.managementNumber})의 상세 정보, 교정 이력, 반출 이력 등을 확인하세요.`,
    };
  } catch {
    return {
      title: '장비 상세',
      description: '장비 상세 정보',
    };
  }
}
