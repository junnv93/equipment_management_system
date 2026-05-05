import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { calibrationFactors } from '@equipment-management/db/schema';
import {
  type CalibrationFactorSortField,
  type CalibrationFactorSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const CALIBRATION_FACTOR_SORT_COLUMN_MAP = {
  effectiveDate: calibrationFactors.effectiveDate,
  requestedAt: calibrationFactors.requestedAt,
  createdAt: calibrationFactors.createdAt,
} as const satisfies Record<CalibrationFactorSortField, PgColumn>;

export const CALIBRATION_FACTOR_SORT_DEFAULT: {
  field: CalibrationFactorSortField;
  direction: SortDirection;
} = {
  field: 'createdAt',
  direction: 'desc',
};

export function resolveCalibrationFactorOrderBy(sort: CalibrationFactorSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : CALIBRATION_FACTOR_SORT_DEFAULT;
  const column = CALIBRATION_FACTOR_SORT_COLUMN_MAP[field as CalibrationFactorSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
