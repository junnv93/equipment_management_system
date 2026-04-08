/**
 * 보고서 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 보고서 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스 (CLAUDE.md Filter SSOT 원칙)
 * - 필터 변경 시 router.replace (history pollution 방지)
 * - SSOT 유틸리티 함수 재사용 (reports-filter-utils.ts)
 *
 * 사용처:
 * - app/(dashboard)/reports/ReportsContent.tsx
 *
 * @see lib/utils/reports-filter-utils.ts
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  DEFAULT_REPORTS_FILTERS,
  parseReportsFiltersFromSearchParams,
  type UIReportsFilters,
} from '@/lib/utils/reports-filter-utils';

export function useReportsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseReportsFiltersFromSearchParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  const updateFilters = useCallback(
    (updates: Partial<UIReportsFilters>) => {
      const next: UIReportsFilters = { ...filters, ...updates };
      const params = new URLSearchParams();

      if (next.reportType) params.set('reportType', next.reportType);
      if (next.dateRange && next.dateRange !== DEFAULT_REPORTS_FILTERS.dateRange) {
        params.set('dateRange', next.dateRange);
      }
      if (next.dateRange === 'custom') {
        if (next.customDateFrom) params.set('customDateFrom', next.customDateFrom);
        if (next.customDateTo) params.set('customDateTo', next.customDateTo);
      }
      if (next.reportFormat && next.reportFormat !== DEFAULT_REPORTS_FILTERS.reportFormat) {
        params.set('reportFormat', next.reportFormat);
      }
      if (next.site) params.set('site', next.site);
      if (next.teamId) params.set('teamId', next.teamId);
      if (next.status) params.set('status', next.status);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  return { filters, updateFilters };
}
