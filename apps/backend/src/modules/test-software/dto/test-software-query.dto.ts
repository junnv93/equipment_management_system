import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  VALIDATION_RULES,
} from '@equipment-management/shared-constants';
import {
  TestFieldEnum,
  SoftwareAvailabilityEnum,
  SiteEnum,
  TestSoftwareSortEnum,
  VM,
  uuidString,
  optionalTrimmedString,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 시험용 소프트웨어 조회 쿼리 스키마
 */
export const testSoftwareQuerySchema = z.object({
  testField: TestFieldEnum.optional(),
  availability: SoftwareAvailabilityEnum.optional(),
  search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
  manufacturer: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '제조사'),
  /** @SiteScoped에 의해 자동 주입 — 직접 설정 금지 */
  site: SiteEnum.optional(),
  /** @SiteScoped(team 스코프)에 의해 자동 주입 — 직접 설정 금지 */
  teamId: uuidString(VM.uuid.invalid('팀')).optional(),
  sort: TestSoftwareSortEnum.optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
});

export type TestSoftwareQueryInput = z.infer<typeof testSoftwareQuerySchema>;
export const TestSoftwareQueryValidationPipe = new ZodValidationPipe(testSoftwareQuerySchema, {
  targets: ['query'],
});
