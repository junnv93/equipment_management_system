import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 팀(Team) sort 필드 SSOT.
 *
 * 기존 `teams.service.ts`는 sort 처리가 없어 `orderBy(teamsTable.name)` 단일 ORDER BY (asc).
 * 본 sprint에서 sort enum + mapper 도입으로 격상.
 */
export const TEAM_SORT_FIELDS = ['name', 'classification', 'createdAt'] as const;

export type TeamSortField = (typeof TEAM_SORT_FIELDS)[number];

export const TeamSortEnum = buildSortEnum(TEAM_SORT_FIELDS);
export type TeamSortValue = z.infer<typeof TeamSortEnum>;
