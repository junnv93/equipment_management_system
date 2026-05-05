import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 시험용 소프트웨어(Test Software) sort 필드 SSOT.
 * 기존 `test-software.service.ts` 라인 168-176 sortColumn 매핑 미러.
 */
export const TEST_SOFTWARE_SORT_FIELDS = [
  'name',
  'managementNumber',
  'testField',
  'createdAt',
] as const;

export type TestSoftwareSortField = (typeof TEST_SOFTWARE_SORT_FIELDS)[number];

export const TestSoftwareSortEnum = buildSortEnum(TEST_SOFTWARE_SORT_FIELDS);
export type TestSoftwareSortValue = z.infer<typeof TestSoftwareSortEnum>;
