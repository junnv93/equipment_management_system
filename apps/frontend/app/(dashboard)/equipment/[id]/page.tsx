import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient';
import { EquipmentDetailSkeleton } from '@/components/equipment/EquipmentDetailSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

/**
 * ✅ React.cache()로 같은 render pass에서 중복 호출 방지
 *
 * generateMetadata()와 Page()에서 각각 호출해도 한 번만 fetch됩니다.
 * 이 패턴은 Next.js 공식 권장 방식입니다.
 */
const getEquipmentCached = cache(async (id: string) => {
  return equipmentApiServer.getEquipment(id);
});

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 장비 상세 페이지 - Server Component
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입
 * - Server Component에서 데이터 fetching
 * - Client Component로 UI 렌더링 위임
 */
export default async function EquipmentDetailPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise, await 필수
  const { id } = await props.params;

  let equipment;
  try {
    // ✅ Server Component에서 데이터 fetching (React.cache로 메모이제이션)
    // ✅ generateMetadata와 동일한 함수를 호출하지만 캐시되어 1회만 fetch
    equipment = await getEquipmentCached(id);
  } catch (error: unknown) {
    // ✅ Next.js 16 Best Practice: any 타입 대신 타입 안전한 에러 처리
    // 404 에러인 경우 not-found 페이지로
    if (isNotFoundError(error)) {
      notFound();
    }
    // 그 외 에러는 error.tsx에서 처리
    throw error;
  }

  return (
    <Suspense fallback={<EquipmentDetailSkeleton />}>
      <EquipmentDetailClient equipment={equipment} />
    </Suspense>
  );
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
