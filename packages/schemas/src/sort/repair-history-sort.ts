import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 수리 이력(Repair History) sort 필드 SSOT.
 * 기존 `repair-history.service.ts` 라인 104-107 sortColumn 매핑 미러.
 */
export const REPAIR_HISTORY_SORT_FIELDS = ['repairDate', 'createdAt'] as const;

export type RepairHistorySortField = (typeof REPAIR_HISTORY_SORT_FIELDS)[number];

export const RepairHistorySortEnum = buildSortEnum(REPAIR_HISTORY_SORT_FIELDS);
export type RepairHistorySortValue = z.infer<typeof RepairHistorySortEnum>;
