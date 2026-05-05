import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import * as schema from '@equipment-management/db/schema';
import {
  type NotificationSortField,
  type NotificationSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const NOTIFICATION_SORT_COLUMN_MAP = {
  createdAt: schema.notifications.createdAt,
  priority: schema.notifications.priority,
} as const satisfies Record<NotificationSortField, PgColumn>;

export const NOTIFICATION_SORT_DEFAULT: {
  field: NotificationSortField;
  direction: SortDirection;
} = {
  field: 'createdAt',
  direction: 'desc',
};

export function resolveNotificationOrderBy(sort: NotificationSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : NOTIFICATION_SORT_DEFAULT;
  const column = NOTIFICATION_SORT_COLUMN_MAP[field as NotificationSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
