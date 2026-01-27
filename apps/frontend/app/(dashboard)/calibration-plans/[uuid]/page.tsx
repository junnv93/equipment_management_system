import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalibrationPlanDetailClient } from '@/components/calibration/CalibrationPlanDetailClient';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 교정계획서 상세 페이지 - Server Component
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입 → await 필수
 * - Server Component에서 uuid 추출
 * - Client Component로 인터랙티브 UI 위임
 */
export default async function CalibrationPlanDetailPage(props: PageProps) {
  // ✅ Next.js 16: params는 Promise, await 필수
  const { uuid } = await props.params;

  return (
    <Suspense fallback={null}>
      <CalibrationPlanDetailClient planUuid={uuid} />
    </Suspense>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { uuid } = await props.params;

  return {
    title: '교정계획서 상세 - 장비 관리',
    description: `교정계획서 ${uuid}의 상세 내용을 확인합니다.`,
    openGraph: {
      title: '교정계획서 상세 - 장비 관리',
      description: `교정 대상 장비 목록, 일정, 승인 상태를 확인하세요.`,
    },
  };
}
