/**
 * 교정 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component에서 초기 summary 데이터 fetch
 * - Client Component(CalibrationContent)에 initialData 전달
 * - FCP 개선 및 client bundle 분리
 *
 * 레퍼런스: checkouts/page.tsx 패턴
 */

import { createServerApiClient } from '@/lib/api/server-api-client';
import CalibrationContent from './CalibrationContent';

export default async function CalibrationPage() {
  const apiClient = await createServerApiClient();

  let initialSummary;
  try {
    const response = await apiClient.get('/api/calibration/summary');
    initialSummary = response.data;
  } catch (error) {
    console.error('[CalibrationPage] Initial fetch error:', error);
  }

  return <CalibrationContent initialSummary={initialSummary} />;
}
