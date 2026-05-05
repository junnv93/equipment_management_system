import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { cables } from '@equipment-management/db/schema';
import {
  type CableSortField,
  type CableSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const CABLE_SORT_COLUMN_MAP = {
  managementNumber: cables.managementNumber,
  lastMeasurementDate: cables.lastMeasurementDate,
  createdAt: cables.createdAt,
} as const satisfies Record<CableSortField, PgColumn>;

export const CABLE_SORT_DEFAULT: { field: CableSortField; direction: SortDirection } = {
  field: 'createdAt',
  direction: 'desc',
};

export function resolveCableOrderBy(sort: CableSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : CABLE_SORT_DEFAULT;
  const column = CABLE_SORT_COLUMN_MAP[field as CableSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
