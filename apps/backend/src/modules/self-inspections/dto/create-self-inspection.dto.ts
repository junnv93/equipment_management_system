import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  SelfInspectionItemJudgmentEnum,
  SelfInspectionResultEnum,
} from '@equipment-management/schemas';

export const createSelfInspectionSchema = z.object({
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다'),
  appearance: SelfInspectionItemJudgmentEnum,
  functionality: SelfInspectionItemJudgmentEnum,
  safety: SelfInspectionItemJudgmentEnum,
  calibrationStatus: SelfInspectionItemJudgmentEnum,
  overallResult: SelfInspectionResultEnum,
  remarks: z.string().optional(),
  inspectionCycle: z.number().int().min(1).max(120).default(6),
});

export type CreateSelfInspectionInput = z.infer<typeof createSelfInspectionSchema>;
export const CreateSelfInspectionPipe = new ZodValidationPipe(createSelfInspectionSchema);
