import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import {
  TestFieldEnum,
  SoftwareAvailabilityEnum,
  VM,
  uuidString,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 시험용 소프트웨어 수정 스키마 (CAS: version 필수)
 */
export const updateTestSoftwareSchema = z.object({
  name: z
    .string()
    .min(1, VM.required('소프트웨어 이름'))
    .max(200, VM.string.max('소프트웨어 이름', 200))
    .optional(),
  softwareVersion: z.string().max(100, VM.string.max('버전', 100)).optional(),
  testField: TestFieldEnum.optional(),
  primaryManagerId: uuidString(VM.uuid.invalid('정담당자')).nullable().optional(),
  secondaryManagerId: uuidString(VM.uuid.invalid('부담당자')).nullable().optional(),
  installedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: VM.date.invalidYMD })
    .nullable()
    .optional(),
  manufacturer: z.string().max(200, VM.string.max('제조사', 200)).optional(),
  location: z.string().max(50, VM.string.max('위치', 50)).optional(),
  availability: SoftwareAvailabilityEnum.optional(),
  requiresValidation: z.boolean().optional(),
  site: z.string().max(10, VM.string.max('사이트', 10)).optional(),
  ...versionedSchema,
});

export type UpdateTestSoftwareInput = z.infer<typeof updateTestSoftwareSchema>;
export const UpdateTestSoftwareValidationPipe = new ZodValidationPipe(updateTestSoftwareSchema);
