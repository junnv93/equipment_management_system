import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RepairHistoryClient } from '@/components/equipment/RepairHistoryClient';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 수리 이력 페이지 - Server Component
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입 → await 필수
 * - Server Component에서 equipmentId 추출
 * - Client Component로 인터랙티브 UI 위임
 */
export default async function RepairHistoryPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise, await 필수
  const { id } = await props.params;

  return (
    <Suspense fallback={null}>
      <RepairHistoryClient equipmentId={id} />
    </Suspense>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  return {
    title: '수리 이력 - 장비 관리',
    description: `장비 ${id}의 수리 이력을 관리합니다.`,
    openGraph: {
      title: '수리 이력 - 장비 관리',
      description: `장비의 수리 이력, 비용, 담당자 정보를 확인하세요.`,
    },
  };
}
