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
 * 결합형 `sort`(`'createdAt.desc'` 등) 파싱.
 * 미제공 시 `EQUIPMENT_IMPORT_SORT_DEFAULT` 사용.
 */
export function resolveEquipmentImportOrderBy(sort: EquipmentImportSortValue | undefined): SQL {
  let field: EquipmentImportSortField;
  let direction: SortDirection;

  if (sort) {
    const parsed = parseSortValue(sort);
    field = parsed.field as EquipmentImportSortField;
    direction = parsed.direction;
  } else {
    field = EQUIPMENT_IMPORT_SORT_DEFAULT.field;
    direction = EQUIPMENT_IMPORT_SORT_DEFAULT.direction;
  }

  const column = EQUIPMENT_IMPORT_SORT_COLUMN_MAP[field];
  return direction === 'asc' ? asc(column) : desc(column);
}
