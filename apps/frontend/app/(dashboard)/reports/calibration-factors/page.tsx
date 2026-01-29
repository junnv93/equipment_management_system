/**
 * 보정계수 대장 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 데이터 fetch
 * - Client Component에 initialData 전달
 * - FCP 개선 및 SEO 최적화
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 보정계수관리대장: 전체 장비의 현재 적용 중인 보정계수 현황
 * - 승인된 보정계수만 대장에 포함
 * - CSV 내보내기 지원
 */

import { createServerApiClient } from '@/lib/api/server-api-client';
import CalibrationFactorsRegistryContent from './CalibrationFactorsRegistryContent';

// Next.js 16 PageProps 타입 정의
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CalibrationFactorsRegistryPage(_props: PageProps) {
  // ✅ Server-side 데이터 fetch
  const apiClient = await createServerApiClient();

  let initialData = null;

  try {
    const response = await apiClient.get('/api/calibration-factors/registry');
    initialData = response.data;
  } catch (error) {
    // 에러 발생 시 null로 시작 (Client에서 재시도)
    console.error('[CalibrationFactorsRegistryPage] Initial fetch error:', error);
  }

  return <CalibrationFactorsRegistryContent initialData={initialData} />;
}
