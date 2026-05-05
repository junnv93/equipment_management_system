import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 교정(Calibration) sort 필드 SSOT.
 * 기존 `calibration.service.ts` 라인 1188-1195 sortColumn 매핑 미러.
 */
export const CALIBRATION_SORT_FIELDS = [
  'calibrationDate',
  'nextCalibrationDate',
  'status',
  'agencyName',
  'equipmentName',
] as const;

export type CalibrationSortField = (typeof CALIBRATION_SORT_FIELDS)[number];

export const CalibrationSortEnum = buildSortEnum(CALIBRATION_SORT_FIELDS);
export type CalibrationSortValue = z.infer<typeof CalibrationSortEnum>;
