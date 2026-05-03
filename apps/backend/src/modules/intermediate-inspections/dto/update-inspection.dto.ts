import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  InspectionJudgmentEnum,
  InspectionResultEnum,
  EquipmentClassificationEnum,
  uuidString,
  VM,
} from '@equipment-management/schemas';
import { versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

const inspectionItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  checkItem: z
    .string()
    .trim()
    .min(1, VM.required('점검 항목'))
    .max(300, VM.string.max('점검 항목', 300)),
  checkCriteria: z
    .string()
    .trim()
    .min(1, VM.required('점검 기준'))
    .max(300, VM.string.max('점검 기준', 300)),
  checkResult: z.string().trim().max(300, VM.string.max('점검 결과', 300)).optional(),
  detailedResult: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('상세 결과', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  judgment: InspectionJudgmentEnum.optional(),
});

const inspectionEquipmentSchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')),
  calibrationDate: z.string().optional(),
});

export const updateInspectionSchema = z.object({
  ...versionedSchema,
  inspectionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  classification: EquipmentClassificationEnum.optional(),
  inspectionCycle: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH,
      VM.string.max('점검 주기', VALIDATION_RULES.SHORT_TEXT_MAX_LENGTH)
    )
    .optional(),
  calibrationValidityPeriod: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH,
      VM.string.max('교정 유효기간', VALIDATION_RULES.MANAGEMENT_NUMBER_MAX_LENGTH)
    )
    .optional(),
  overallResult: InspectionResultEnum.optional(),
  remarks: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  items: z.array(inspectionItemSchema).optional(),
  measurementEquipment: z.array(inspectionEquipmentSchema).optional(),
});

export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;
export const UpdateInspectionPipe = new ZodValidationPipe(updateInspectionSchema);
