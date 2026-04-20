import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ValidationTypeEnum,
  uuidString,
  VM,
  acquisitionOrProcessingArraySchema,
  controlItemArraySchema,
} from '@equipment-management/schemas';
import { CONTROL_MAX_ROWS } from '../services/software-validation.layout';

const datePattern = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, VM.date.invalidYMD);

const VENDOR_FIELDS = [
  'vendorName',
  'vendorSummary',
  'receivedBy',
  'receivedDate',
  'attachmentNote',
] as const;

const SELF_FIELDS = [
  'referenceDocuments',
  'operatingUnitDescription',
  'softwareComponents',
  'hardwareComponents',
  'acquisitionFunctions',
  'processingFunctions',
  'controlFunctions',
  'performedBy',
] as const;

export const createValidationSchema = z
  .object({
    validationType: ValidationTypeEnum,
    softwareVersion: z.string().max(100, VM.string.max('소프트웨어 버전', 100)).optional(),
    testDate: datePattern.optional(),
    infoDate: datePattern.optional(),
    softwareAuthor: z.string().max(200, VM.string.max('제작자', 200)).optional(),
    // ── 방법 1: 공급자 시연 (vendor) ──
    vendorName: z.string().max(200, VM.string.max('공급자명', 200)).optional(),
    vendorSummary: z.string().optional(),
    receivedBy: uuidString(VM.uuid.invalid('수령인')).optional(),
    receivedDate: datePattern.optional(),
    attachmentNote: z.string().optional(),
    // ── 방법 2: UL 자체 시험 (self) ──
    referenceDocuments: z.string().optional(),
    operatingUnitDescription: z.string().optional(),
    softwareComponents: z.string().optional(),
    hardwareComponents: z.string().optional(),
    // UL-QP-18-09 템플릿 구조: T4/T5 = 단일 기능(3행×2열), T6 = 최대 CONTROL_MAX_ROWS개(R1~R3)
    acquisitionFunctions: acquisitionOrProcessingArraySchema.max(1).optional(),
    processingFunctions: acquisitionOrProcessingArraySchema.max(1).optional(),
    controlFunctions: controlItemArraySchema.max(CONTROL_MAX_ROWS).optional(),
    performedBy: uuidString(VM.uuid.invalid('수행자')).optional(),
  })
  .superRefine((data, ctx) => {
    // vendor 타입일 때 self 전용 필드가 있으면 경고
    if (data.validationType === 'vendor') {
      for (const field of SELF_FIELDS) {
        if (data[field] !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `'${field}' is not applicable for vendor validation type.`,
          });
        }
      }
    }
    // self 타입일 때 vendor 전용 필드가 있으면 경고
    if (data.validationType === 'self') {
      for (const field of VENDOR_FIELDS) {
        if (data[field] !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `'${field}' is not applicable for self validation type.`,
          });
        }
      }
    }
  });

export type CreateValidationInput = z.infer<typeof createValidationSchema>;
export const CreateValidationPipe = new ZodValidationPipe(createValidationSchema);
