import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { testSoftware } from '@equipment-management/db/schema';
import {
  type TestSoftwareSortField,
  type TestSoftwareSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const TEST_SOFTWARE_SORT_COLUMN_MAP = {
  name: testSoftware.name,
  managementNumber: testSoftware.managementNumber,
  testField: testSoftware.testField,
  createdAt: testSoftware.createdAt,
} as const satisfies Record<TestSoftwareSortField, PgColumn>;

export const TEST_SOFTWARE_SORT_DEFAULT: {
  field: TestSoftwareSortField;
  direction: SortDirection;
} = {
  field: 'createdAt',
  direction: 'desc',
};

export function resolveTestSoftwareOrderBy(sort: TestSoftwareSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : TEST_SOFTWARE_SORT_DEFAULT;
  const column = TEST_SOFTWARE_SORT_COLUMN_MAP[field as TestSoftwareSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
