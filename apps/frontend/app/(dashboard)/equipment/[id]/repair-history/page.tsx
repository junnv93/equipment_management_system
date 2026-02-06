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
 * - searchParams로 context 전달 (부적합 페이지에서 넘어올 때)
 * - Client Component로 인터랙티브 UI 위임
 */
export default async function RepairHistoryPage(props: PageProps) {
  // ✅ Next.js 16: params와 searchParams는 Promise, await 필수
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  // Query params 추출
  const ncId = typeof searchParams.ncId === 'string' ? searchParams.ncId : undefined;
  const autoOpen = searchParams.autoOpen === 'true';

  return (
    <Suspense fallback={null}>
      <RepairHistoryClient equipmentId={id} initialNcId={ncId} autoOpen={autoOpen} />
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
