import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { checkouts } from '@equipment-management/db/schema/checkouts';
import {
  type CheckoutSortField,
  type CheckoutSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

/**
 * Checkout sort 컬럼 매핑 SSOT.
 * `CHECKOUT_SORT_FIELDS` 변경 시 `satisfies Record<CheckoutSortField, PgColumn>`로 컴파일타임 강제.
 */
export const CHECKOUT_SORT_COLUMN_MAP = {
  createdAt: checkouts.createdAt,
  checkoutDate: checkouts.checkoutDate,
  expectedReturnDate: checkouts.expectedReturnDate,
  status: checkouts.status,
  requesterId: checkouts.requesterId,
  approverId: checkouts.approverId,
} as const satisfies Record<CheckoutSortField, PgColumn>;

export const CHECKOUT_SORT_DEFAULT: { field: CheckoutSortField; direction: SortDirection } = {
  field: 'createdAt',
  direction: 'desc',
};

/**
 * sort enum 결합값(`'createdAt.desc'` 등) → drizzle ORDER BY 절.
 * undefined → `CHECKOUT_SORT_DEFAULT` 사용.
 */
export function resolveCheckoutOrderBy(sort: CheckoutSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : CHECKOUT_SORT_DEFAULT;
  const column = CHECKOUT_SORT_COLUMN_MAP[field as CheckoutSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
