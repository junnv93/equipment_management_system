import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalibrationFactorsClient } from '@/components/equipment/CalibrationFactorsClient';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 보정계수 관리 페이지 - Server Component
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입 → await 필수
 * - Server Component에서 equipmentId 추출
 * - Client Component로 인터랙티브 UI 위임
 */
export default async function CalibrationFactorsPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise, await 필수
  const { id } = await props.params;

  return (
    <Suspense fallback={null}>
      <CalibrationFactorsClient equipmentId={id} />
    </Suspense>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: '보정계수 관리 - 장비 관리',
    description: `장비 ${id}의 보정계수를 관리합니다.`,
    openGraph: {
      title: '보정계수 관리 - 장비 관리',
      description: `안테나 이득, 케이블 손실 등 보정계수를 관리하세요.`,
    },
  };
}
