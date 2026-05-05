import { asc, desc, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { teams as teamsTable } from '@equipment-management/db/schema';
import {
  type TeamSortField,
  type TeamSortValue,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';

export const TEAM_SORT_COLUMN_MAP = {
  name: teamsTable.name,
  classification: teamsTable.classification,
  createdAt: teamsTable.createdAt,
} as const satisfies Record<TeamSortField, PgColumn>;

export const TEAM_SORT_DEFAULT: { field: TeamSortField; direction: SortDirection } = {
  field: 'name',
  direction: 'asc',
};

export function resolveTeamOrderBy(sort: TeamSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : TEAM_SORT_DEFAULT;
  const column = TEAM_SORT_COLUMN_MAP[field as TeamSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
