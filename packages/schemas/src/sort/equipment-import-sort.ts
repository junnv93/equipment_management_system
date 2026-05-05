import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 장비 반입(Equipment Import) sort 필드 SSOT.
 *
 * 기존 `sortBy` + `sortOrder` 분리형이 deprecated 되며, 결합형 `sort` enum이 신규.
 * service-layer에서 결합형 우선, 분리형 fallback 처리. 자세한 내용은
 * `apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts`.
 */
export const EQUIPMENT_IMPORT_SORT_FIELDS = [
  'createdAt',
  'usagePeriodStart',
  'usagePeriodEnd',
  'status',
] as const;

export type EquipmentImportSortField = (typeof EQUIPMENT_IMPORT_SORT_FIELDS)[number];

export const EquipmentImportSortEnum = buildSortEnum(EQUIPMENT_IMPORT_SORT_FIELDS);
export type EquipmentImportSortValue = z.infer<typeof EquipmentImportSortEnum>;
