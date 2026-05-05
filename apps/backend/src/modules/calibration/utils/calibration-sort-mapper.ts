import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import * as schema from '@equipment-management/db/schema';
import {
  type CalibrationSortField,
  type CalibrationSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

/**
 * Calibration sort 컬럼 매핑 SSOT.
 * `equipmentName`은 join된 `equipment.name` 참조 — 다른 도메인과 다른 cross-table 케이스.
 */
export const CALIBRATION_SORT_COLUMN_MAP = {
  calibrationDate: schema.calibrations.calibrationDate,
  nextCalibrationDate: schema.calibrations.nextCalibrationDate,
  status: schema.calibrations.status,
  agencyName: schema.calibrations.agencyName,
  equipmentName: schema.equipment.name,
} as const satisfies Record<CalibrationSortField, PgColumn>;

export const CALIBRATION_SORT_DEFAULT: { field: CalibrationSortField; direction: SortDirection } = {
  field: 'calibrationDate',
  direction: 'desc',
};

export function resolveCalibrationOrderBy(sort: CalibrationSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : CALIBRATION_SORT_DEFAULT;
  const column = CALIBRATION_SORT_COLUMN_MAP[field as CalibrationSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
