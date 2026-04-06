import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  SelfInspectionItemJudgmentEnum,
  SelfInspectionResultEnum,
  SpecialNoteSchema,
} from '@equipment-management/schemas';

const selfInspectionItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  checkItem: z.string().min(1).max(300),
  checkResult: SelfInspectionItemJudgmentEnum,
});

export const updateSelfInspectionSchema = z.object({
  inspectionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다')
    .optional(),
  // 유연한 점검 항목 (전체 교체)
  items: z.array(selfInspectionItemSchema).min(1).optional(),
  overallResult: SelfInspectionResultEnum.optional(),
  remarks: z.string().optional(),
  specialNotes: z.array(SpecialNoteSchema).optional(),
  inspectionCycle: z.number().int().min(1).max(120).optional(),
  version: z.number().int().min(1),
  // 하위 호환: 기존 고정 컬럼 (선택)
  appearance: SelfInspectionItemJudgmentEnum.optional(),
  functionality: SelfInspectionItemJudgmentEnum.optional(),
  safety: SelfInspectionItemJudgmentEnum.optional(),
  calibrationStatus: SelfInspectionItemJudgmentEnum.optional(),
});

export type UpdateSelfInspectionInput = z.infer<typeof updateSelfInspectionSchema>;
export const UpdateSelfInspectionPipe = new ZodValidationPipe(updateSelfInspectionSchema);
