/**
 * ============================================================================
 * SSOT: 시험용 소프트웨어 필터 변환 유틸리티
 * ============================================================================
 *
 * URL 파라미터 ↔ UI 필터 ↔ API 필터 변환의 단일 소스.
 *
 * 사용처:
 * - app/(dashboard)/software/page.tsx (Server Component)
 * - app/(dashboard)/software/TestSoftwareListContent.tsx (Client Component)
 */

import type { TestField, SoftwareAvailability } from '@equipment-management/schemas';
import { TEST_FIELD_VALUES, SOFTWARE_AVAILABILITY_VALUES } from '@equipment-management/schemas';
import type { TestSoftwareQuery } from '@/lib/api/software-api';

export interface UITestSoftwareFilters {
  search: string;
  testField: TestField | '';
  availability: SoftwareAvailability | '';
}

export const DEFAULT_UI_FILTERS: UITestSoftwareFilters = {
  search: '',
  testField: '',
  availability: '',
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 */
export function parseTestSoftwareFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UITestSoftwareFilters {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    return typeof value === 'string' ? value : null;
  };

  const testField = get('testField') ?? '';
  const availability = get('availability') ?? '';

  return {
    search: get('search') ?? '',
    testField: TEST_FIELD_VALUES.includes(testField as TestField) ? (testField as TestField) : '',
    availability: SOFTWARE_AVAILABILITY_VALUES.includes(availability as SoftwareAvailability)
      ? (availability as SoftwareAvailability)
      : '',
  };
}

/**
 * UI 필터 → API 쿼리 파라미터 변환
 */
export function toApiFilters(ui: UITestSoftwareFilters): TestSoftwareQuery {
  return {
    ...(ui.search ? { search: ui.search } : {}),
    ...(ui.testField ? { testField: ui.testField } : {}),
    ...(ui.availability ? { availability: ui.availability } : {}),
  };
}

/**
 * UI 필터 → URLSearchParams 문자열 변환
 */
export function toSearchParamsString(ui: UITestSoftwareFilters): string {
  const params = new URLSearchParams();
  if (ui.search) params.set('search', ui.search);
  if (ui.testField) params.set('testField', ui.testField);
  if (ui.availability) params.set('availability', ui.availability);
  return params.toString();
}
