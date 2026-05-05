import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { repairHistory } from '@equipment-management/db/schema';
import {
  type RepairHistorySortField,
  type RepairHistorySortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const REPAIR_HISTORY_SORT_COLUMN_MAP = {
  repairDate: repairHistory.repairDate,
  createdAt: repairHistory.createdAt,
} as const satisfies Record<RepairHistorySortField, PgColumn>;

export const REPAIR_HISTORY_SORT_DEFAULT: {
  field: RepairHistorySortField;
  direction: SortDirection;
} = {
  field: 'repairDate',
  direction: 'desc',
};

export function resolveRepairHistoryOrderBy(sort: RepairHistorySortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : REPAIR_HISTORY_SORT_DEFAULT;
  const column = REPAIR_HISTORY_SORT_COLUMN_MAP[field as RepairHistorySortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
