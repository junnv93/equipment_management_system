import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 소프트웨어 유효성 검증(Software Validation) sort 필드 SSOT.
 * 기존 `software-validations.service.ts` 라인 201-208 sortColumn 매핑 미러.
 */
export const SOFTWARE_VALIDATION_SORT_FIELDS = ['testDate', 'status', 'createdAt'] as const;

export type SoftwareValidationSortField = (typeof SOFTWARE_VALIDATION_SORT_FIELDS)[number];

export const SoftwareValidationSortEnum = buildSortEnum(SOFTWARE_VALIDATION_SORT_FIELDS);
export type SoftwareValidationSortValue = z.infer<typeof SoftwareValidationSortEnum>;
