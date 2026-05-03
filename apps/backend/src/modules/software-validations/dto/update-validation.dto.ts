import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ValidationTypeEnum,
  uuidString,
  VM,
  acquisitionOrProcessingArraySchema,
  controlItemArraySchema,
} from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const updateValidationSchema = z.object({
  ...versionedSchema,
  validationType: ValidationTypeEnum.optional(),
  softwareVersion: z.string().trim().max(100, VM.string.max('소프트웨어 버전', 100)).optional(),
  testDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, VM.date.invalidYMD)
    .optional(),
  infoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, VM.date.invalidYMD)
    .optional(),
  softwareAuthor: z.string().trim().max(200, VM.string.max('제작자', 200)).optional(),
  // ── 방법 1: 공급자 시연 (vendor) ──
  vendorName: z.string().trim().max(200, VM.string.max('공급자명', 200)).optional(),
  vendorSummary: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('공급자 요약', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  receivedBy: uuidString(VM.uuid.invalid('수령인')).optional(),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, VM.date.invalidYMD)
    .optional(),
  attachmentNote: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('첨부 비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  // ── 방법 2: UL 자체 시험 (self) ──
  referenceDocuments: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('참조 문서', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  operatingUnitDescription: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('운영 단위 설명', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  softwareComponents: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('소프트웨어 구성', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  hardwareComponents: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('하드웨어 구성', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  acquisitionFunctions: acquisitionOrProcessingArraySchema.optional(),
  processingFunctions: acquisitionOrProcessingArraySchema.optional(),
  controlFunctions: controlItemArraySchema.optional(),
  performedBy: uuidString(VM.uuid.invalid('수행자')).optional(),
});

export type UpdateValidationInput = z.infer<typeof updateValidationSchema>;
export const UpdateValidationPipe = new ZodValidationPipe(updateValidationSchema);
