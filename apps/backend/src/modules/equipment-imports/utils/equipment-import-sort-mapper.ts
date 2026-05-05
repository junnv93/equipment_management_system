import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import {
  type EquipmentImportSortField,
  type EquipmentImportSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const EQUIPMENT_IMPORT_SORT_COLUMN_MAP = {
  createdAt: equipmentImports.createdAt,
  usagePeriodStart: equipmentImports.usagePeriodStart,
  usagePeriodEnd: equipmentImports.usagePeriodEnd,
  status: equipmentImports.status,
} as const satisfies Record<EquipmentImportSortField, PgColumn>;

export const EQUIPMENT_IMPORT_SORT_DEFAULT: {
  field: EquipmentImportSortField;
  direction: SortDirection;
} = {
  field: 'createdAt',
  direction: 'desc',
};

/**
 * sort 결합형 우선, fallback to legacy sortBy + sortOrder 분리형.
 *
 * `sort`(`'createdAt.desc'` 등)가 제공되면 그것 사용 — 신 클라이언트.
 * 미제공 시 legacy `sortBy` + `sortOrder` 분리형 사용 — 구 클라이언트 backwards compat.
 *
 * 둘 다 미제공 시 `EQUIPMENT_IMPORT_SORT_DEFAULT` 사용.
 */
export function resolveEquipmentImportOrderBy(
  sort: EquipmentImportSortValue | undefined,
  legacySortBy: EquipmentImportSortField | undefined,
  legacySortOrder: SortDirection | undefined
): SQL {
  let field: EquipmentImportSortField;
  let direction: SortDirection;

  if (sort) {
    const parsed = parseSortValue(sort);
    field = parsed.field as EquipmentImportSortField;
    direction = parsed.direction;
  } else if (legacySortBy) {
    field = legacySortBy;
    direction = legacySortOrder ?? 'desc';
  } else {
    field = EQUIPMENT_IMPORT_SORT_DEFAULT.field;
    direction = EQUIPMENT_IMPORT_SORT_DEFAULT.direction;
  }

  const column = EQUIPMENT_IMPORT_SORT_COLUMN_MAP[field];
  return direction === 'asc' ? asc(column) : desc(column);
}
