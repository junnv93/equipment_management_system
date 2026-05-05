import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 사용자(User) sort 필드 SSOT.
 * 기존 `users.service.ts` `getSortColumn()` 라인 47-69 switch 케이스 미러.
 */
export const USER_SORT_FIELDS = [
  'name',
  'email',
  'role',
  'site',
  'createdAt',
  'updatedAt',
] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export const UserSortEnum = buildSortEnum(USER_SORT_FIELDS);
export type UserSortValue = z.infer<typeof UserSortEnum>;
