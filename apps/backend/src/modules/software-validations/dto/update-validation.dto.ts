import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ValidationTypeEnum, uuidString, VM } from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';

export const updateValidationSchema = z.object({
  ...versionedSchema,
  validationType: ValidationTypeEnum.optional(),
  softwareVersion: z.string().max(100, VM.string.max('소프트웨어 버전', 100)).optional(),
  testDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  infoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  softwareAuthor: z.string().max(200, VM.string.max('제작자', 200)).optional(),
  // ── 방법 1: 공급자 시연 (vendor) ──
  vendorName: z.string().max(200, VM.string.max('공급자명', 200)).optional(),
  vendorSummary: z.string().optional(),
  receivedBy: uuidString(VM.uuid.invalid('수령인')).optional(),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  attachmentNote: z.string().optional(),
  // ── 방법 2: UL 자체 시험 (self) ──
  referenceDocuments: z.string().optional(),
  operatingUnitDescription: z.string().optional(),
  softwareComponents: z.string().optional(),
  hardwareComponents: z.string().optional(),
  acquisitionFunctions: z.array(z.record(z.string(), z.unknown())).optional(),
  processingFunctions: z.array(z.record(z.string(), z.unknown())).optional(),
  controlFunctions: z.array(z.record(z.string(), z.unknown())).optional(),
  performedBy: uuidString(VM.uuid.invalid('수행자')).optional(),
});

export type UpdateValidationInput = z.infer<typeof updateValidationSchema>;
export const UpdateValidationPipe = new ZodValidationPipe(updateValidationSchema);
