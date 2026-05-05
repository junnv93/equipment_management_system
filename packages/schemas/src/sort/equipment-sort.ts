import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 장비(Equipment) sort 필드 SSOT.
 * 기존 `equipment.service.ts` `INDEXED_FIELDS` 라인 94-105 + switch 라인 333-381 미러.
 */
export const EQUIPMENT_SORT_FIELDS = [
  'managementNumber',
  'name',
  'status',
  'location',
  'manufacturer',
  'teamId',
  'managerId',
  'nextCalibrationDate',
  'modelName',
  'isActive',
  'createdAt',
] as const;

export type EquipmentSortField = (typeof EQUIPMENT_SORT_FIELDS)[number];

export const EquipmentSortEnum = buildSortEnum(EQUIPMENT_SORT_FIELDS);
export type EquipmentSortValue = z.infer<typeof EquipmentSortEnum>;
