import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient';
import { EquipmentDetailSkeleton } from '@/components/equipment/EquipmentDetailSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

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
    // ✅ Server Component에서 데이터 fetching
    // ✅ equipmentApiServer는 getServerSession()을 통해 자동으로 인증 토큰 주입
    equipment = await equipmentApiServer.getEquipment(id);
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
    // ✅ Server-side API 사용
    const equipment = await equipmentApiServer.getEquipment(id);
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
