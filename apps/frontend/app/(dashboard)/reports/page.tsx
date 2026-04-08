/**
 * 보고서 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - searchParams Promise await 후 URL SSOT 필터 파싱하여 client에 initialFilters 전달
 *
 * 보고서 페이지는 초기 데이터 fetch가 불필요 (순수 폼 UI)
 */

import {
  parseReportsFiltersFromSearchParams,
  type UIReportsFilters,
} from '@/lib/utils/reports-filter-utils';
import ReportsContent from './ReportsContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ReportsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialFilters: UIReportsFilters = parseReportsFiltersFromSearchParams(searchParams);
  return <ReportsContent initialFilters={initialFilters} />;
}
