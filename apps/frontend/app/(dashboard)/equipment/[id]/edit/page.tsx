import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EditEquipmentClient } from '@/components/equipment/EditEquipmentClient';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

/**
 * Next.js 16 PageProps 타입 정의
 */
type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 장비 수정 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입, await 필수
 * - Server Component에서 데이터 fetching
 * - Client Component(EditEquipmentClient)로 UI/인터랙션 위임
 * - notFound() 호출로 404 처리
 */
export default async function EditEquipmentPage(props: PageProps) {
  // Next.js 16: params는 Promise, await 필수
  const { id } = await props.params;

  let equipment;
  try {
    // Server Component에서 데이터 fetching
    equipment = await equipmentApiServer.getEquipment(id);
  } catch (error) {
    // 404 에러인 경우 not-found 페이지로
    if (isNotFoundError(error)) {
      notFound();
    }
    // 그 외 에러는 error.tsx에서 처리
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
    const equipment = await equipmentApiServer.getEquipment(id);
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
