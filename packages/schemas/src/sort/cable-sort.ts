import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 케이블(Cable) sort 필드 SSOT.
 * 기존 `cables.service.ts` 라인 123-130 sortColumn 매핑 미러.
 */
export const CABLE_SORT_FIELDS = ['managementNumber', 'lastMeasurementDate', 'createdAt'] as const;

export type CableSortField = (typeof CABLE_SORT_FIELDS)[number];

export const CableSortEnum = buildSortEnum(CABLE_SORT_FIELDS);
export type CableSortValue = z.infer<typeof CableSortEnum>;
