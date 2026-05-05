import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 부적합(Non-Conformance) sort 필드 SSOT.
 * 기존 `non-conformances.service.ts` 라인 429-440 switch 케이스 미러.
 */
export const NON_CONFORMANCE_SORT_FIELDS = [
  'discoveryDate',
  'status',
  'createdAt',
  'updatedAt',
] as const;

export type NonConformanceSortField = (typeof NON_CONFORMANCE_SORT_FIELDS)[number];

export const NonConformanceSortEnum = buildSortEnum(NON_CONFORMANCE_SORT_FIELDS);
export type NonConformanceSortValue = z.infer<typeof NonConformanceSortEnum>;
