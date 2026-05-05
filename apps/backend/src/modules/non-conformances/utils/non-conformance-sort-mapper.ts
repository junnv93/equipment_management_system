import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  type NonConformanceSortField,
  type NonConformanceSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const NON_CONFORMANCE_SORT_COLUMN_MAP = {
  discoveryDate: nonConformances.discoveryDate,
  status: nonConformances.status,
  createdAt: nonConformances.createdAt,
  updatedAt: nonConformances.updatedAt,
} as const satisfies Record<NonConformanceSortField, PgColumn>;

export const NON_CONFORMANCE_SORT_DEFAULT: {
  field: NonConformanceSortField;
  direction: SortDirection;
} = {
  field: 'discoveryDate',
  direction: 'desc',
};

export function resolveNonConformanceOrderBy(sort: NonConformanceSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : NON_CONFORMANCE_SORT_DEFAULT;
  const column = NON_CONFORMANCE_SORT_COLUMN_MAP[field as NonConformanceSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
