import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  type EquipmentSortField,
  type EquipmentSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const EQUIPMENT_SORT_COLUMN_MAP = {
  managementNumber: equipment.managementNumber,
  name: equipment.name,
  status: equipment.status,
  location: equipment.location,
  manufacturer: equipment.manufacturer,
  teamId: equipment.teamId,
  managerId: equipment.managerId,
  nextCalibrationDate: equipment.nextCalibrationDate,
  modelName: equipment.modelName,
  isActive: equipment.isActive,
  createdAt: equipment.createdAt,
} as const satisfies Record<EquipmentSortField, PgColumn>;

export const EQUIPMENT_SORT_DEFAULT: { field: EquipmentSortField; direction: SortDirection } = {
  field: 'managementNumber',
  direction: 'asc',
};

export function resolveEquipmentOrderBy(sort: EquipmentSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : EQUIPMENT_SORT_DEFAULT;
  const column = EQUIPMENT_SORT_COLUMN_MAP[field as EquipmentSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
