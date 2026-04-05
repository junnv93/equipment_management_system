import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  SelfInspectionItemJudgmentEnum,
  SelfInspectionResultEnum,
} from '@equipment-management/schemas';

export const updateSelfInspectionSchema = z.object({
  inspectionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  appearance: SelfInspectionItemJudgmentEnum.optional(),
  functionality: SelfInspectionItemJudgmentEnum.optional(),
  safety: SelfInspectionItemJudgmentEnum.optional(),
  calibrationStatus: SelfInspectionItemJudgmentEnum.optional(),
  overallResult: SelfInspectionResultEnum.optional(),
  remarks: z.string().optional(),
  inspectionCycle: z.number().int().min(1).max(120).optional(),
  version: z.number().int().min(1),
});

export type UpdateSelfInspectionInput = z.infer<typeof updateSelfInspectionSchema>;
export const UpdateSelfInspectionPipe = new ZodValidationPipe(updateSelfInspectionSchema);
