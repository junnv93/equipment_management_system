import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  EquipmentClassificationEnum,
  SelfInspectionItemJudgmentEnum,
  SelfInspectionResultEnum,
  SpecialNoteSchema,
} from '@equipment-management/schemas';

const selfInspectionItemSchema = z.object({
  itemNumber: z.number().int().min(1),
  checkItem: z.string().min(1).max(300),
  checkResult: SelfInspectionItemJudgmentEnum,
  detailedResult: z.string().optional(),
});

export const createSelfInspectionSchema = z.object({
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다'),
  // 유연한 점검 항목 (필수)
  items: z.array(selfInspectionItemSchema).min(1, '최소 1개 이상의 점검 항목이 필요합니다'),
  overallResult: SelfInspectionResultEnum,
  remarks: z.string().optional(),
  specialNotes: z.array(SpecialNoteSchema).optional(),
  inspectionCycle: z.number().int().min(1).max(120).default(6),
  // UL-QP-18-05 양식 헤더 snapshot (장비 마스터 drift 방지).
  // 미전달 시 서비스 레이어가 장비 마스터에서 현재 값을 읽어 snapshot으로 보존.
  classification: EquipmentClassificationEnum.optional(),
  calibrationValidityPeriod: z.string().trim().max(50).optional(),
  // 하위 호환: 기존 고정 컬럼 (선택)
  appearance: SelfInspectionItemJudgmentEnum.optional(),
  functionality: SelfInspectionItemJudgmentEnum.optional(),
  safety: SelfInspectionItemJudgmentEnum.optional(),
  calibrationStatus: SelfInspectionItemJudgmentEnum.optional(),
});

export type CreateSelfInspectionInput = z.infer<typeof createSelfInspectionSchema>;
export const CreateSelfInspectionPipe = new ZodValidationPipe(createSelfInspectionSchema);
