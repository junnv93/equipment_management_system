import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { softwareValidations } from '@equipment-management/db/schema';
import {
  type SoftwareValidationSortField,
  type SoftwareValidationSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const SOFTWARE_VALIDATION_SORT_COLUMN_MAP = {
  testDate: softwareValidations.testDate,
  status: softwareValidations.status,
  createdAt: softwareValidations.createdAt,
} as const satisfies Record<SoftwareValidationSortField, PgColumn>;

export const SOFTWARE_VALIDATION_SORT_DEFAULT: {
  field: SoftwareValidationSortField;
  direction: SortDirection;
} = {
  field: 'createdAt',
  direction: 'desc',
};

export function resolveSoftwareValidationOrderBy(
  sort: SoftwareValidationSortValue | undefined
): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : SOFTWARE_VALIDATION_SORT_DEFAULT;
  const column = SOFTWARE_VALIDATION_SORT_COLUMN_MAP[field as SoftwareValidationSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
