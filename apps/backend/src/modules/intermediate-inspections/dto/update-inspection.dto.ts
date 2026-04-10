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

const inspectionItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  checkItem: z.string().min(1, VM.required('점검 항목')).max(300, VM.string.max('점검 항목', 300)),
  checkCriteria: z
    .string()
    .min(1, VM.required('점검 기준'))
    .max(300, VM.string.max('점검 기준', 300)),
  checkResult: z.string().max(300, VM.string.max('점검 결과', 300)).optional(),
  detailedResult: z.string().optional(),
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
  inspectionCycle: z.string().max(20, VM.string.max('점검 주기', 20)).optional(),
  calibrationValidityPeriod: z.string().max(50, VM.string.max('교정 유효기간', 50)).optional(),
  overallResult: InspectionResultEnum.optional(),
  remarks: z.string().optional(),
  items: z.array(inspectionItemSchema).optional(),
  measurementEquipment: z.array(inspectionEquipmentSchema).optional(),
});

export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;
export const UpdateInspectionPipe = new ZodValidationPipe(updateInspectionSchema);
