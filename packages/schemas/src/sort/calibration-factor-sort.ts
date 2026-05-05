import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 보정계수(Calibration Factor) sort 필드 SSOT.
 * 기존 `calibration-factors.service.ts` 라인 184-191 sortColumn 매핑 미러.
 */
export const CALIBRATION_FACTOR_SORT_FIELDS = [
  'effectiveDate',
  'requestedAt',
  'createdAt',
] as const;

export type CalibrationFactorSortField = (typeof CALIBRATION_FACTOR_SORT_FIELDS)[number];

export const CalibrationFactorSortEnum = buildSortEnum(CALIBRATION_FACTOR_SORT_FIELDS);
export type CalibrationFactorSortValue = z.infer<typeof CalibrationFactorSortEnum>;
