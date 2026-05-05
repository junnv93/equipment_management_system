import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { users as usersTable } from '@equipment-management/db/schema';
import {
  type UserSortField,
  type UserSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const USER_SORT_COLUMN_MAP = {
  name: usersTable.name,
  email: usersTable.email,
  role: usersTable.role,
  site: usersTable.site,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
} as const satisfies Record<UserSortField, PgColumn>;

export const USER_SORT_DEFAULT: { field: UserSortField; direction: SortDirection } = {
  field: 'name',
  direction: 'asc',
};

export function resolveUserOrderBy(sort: UserSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : USER_SORT_DEFAULT;
  const column = USER_SORT_COLUMN_MAP[field as UserSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
