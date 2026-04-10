/**
 * 감사 로그 페이지 (PPR Non-Blocking)
 *
 * ✅ Next.js 16 PPR Pattern:
 * - Page (sync): 정적 셸 즉시 렌더링
 * - Suspense: ListPageSkeleton 폴백
 * - AuditLogsAsync (async): searchParams await → 서버 fetch → Client Content
 *
 * ✅ DataScope RBAC:
 * - test_engineer: 403 (Permission.VIEW_AUDIT_LOGS 없음)
 * - technical_manager: 소속 팀 로그만 (서버 강제)
 * - lab_manager: 소속 사이트 로그만 (서버 강제)
 * - quality_manager/system_admin: 전체 로그
 *
 * ✅ 커서 기반 무한 스크롤:
 * - SSR 첫 페이지 → useInfiniteQuery initialData로 전달
 */
import { Suspense } from 'react';
import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';
import AuditLogsContent from './AuditLogsContent';
import { getAuditLogsListCursor } from '@/lib/api/audit-api-server';
import {
  convertFiltersToCursorParams,
  parseAuditLogFiltersFromSearchParams,
} from '@/lib/utils/audit-log-filter-utils';
import type { CursorPaginatedAuditLogsResponse } from '@equipment-management/schemas';

export default function AuditLogsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <TablePageSkeleton
          title="감사 로그"
          description="시스템 활동 기록"
          showFilters={true}
          filterCount={3}
          columnCount={7}
          showActionButton={false}
        />
      }
    >
      <AuditLogsAsync searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}

async function AuditLogsAsync({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  const filters = parseAuditLogFiltersFromSearchParams(searchParams);
  const cursorParams = convertFiltersToCursorParams(filters);

  let initialData: CursorPaginatedAuditLogsResponse | null = null;
  try {
    initialData = await getAuditLogsListCursor(cursorParams);
  } catch {
    // 403/401은 서버 API 클라이언트가 처리 (리다이렉트)
    // 기타 에러는 클라이언트에서 재시도
  }

  return <AuditLogsContent initialData={initialData} />;
}
