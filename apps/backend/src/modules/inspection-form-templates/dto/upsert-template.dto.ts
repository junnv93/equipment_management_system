import { z } from 'zod';
import {
  ExtractedInspectionStructureSchema,
  ForkChoiceEnum,
  InspectionTypeEnum,
  uuidString,
} from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Inspection Form Template Upsert DTO — Phase 1B-B
 *
 * 호출 흐름:
 * 1. SoftFork apply_forward (1C): user가 표 구조 변경 + "다음부터도 적용" 선택 →
 *    inspection 제출 직전 본 endpoint 호출 → version+1 + supersededBy 체이닝
 * 2. Admin 명시 수정: dashboard에서 양식 통제 화면 → 직접 호출 (현재 단계 미구현, 1D 이후)
 *
 * SSOT:
 * - structure: ExtractedInspectionStructureSchema (zod) 검증 — DB jsonb 무결성 보장
 * - inspectionType: INSPECTION_TYPE_VALUES from @equipment-management/schemas
 * - forkChoice: ForkChoice 유니언 — 'this_only' 시 본 endpoint 미호출 (제출만), 'apply_forward' 시 호출
 *
 * CAS:
 * - 동시 수정 시 (equipmentId, inspectionType, version+1) unique 충돌 → 409 ConflictException
 * - 호출자(SoftForkDialog)가 새로고침 후 재시도 안내
 */
export const UpsertInspectionTemplateSchema = z
  .object({
    inspectionType: InspectionTypeEnum,
    /** 새 version 번호 — 현재 latest version + 1 */
    version: z.number().int().positive(),
    /** 새 양식 구조 (value-stripped) */
    structure: ExtractedInspectionStructureSchema,
    /** 직전 (현재) template UUID — 자동 supersededBy 체이닝에 사용 */
    supersededBy: uuidString().optional(),
    /** 본 template을 trigger한 inspection — auto-create 시 frontend가 전달 */
    sourceInspectionId: uuidString().optional(),
    /** 사용자 의사결정 (audit log + analytics용) */
    forkChoice: ForkChoiceEnum.optional(),
  })
  .strict();

export type UpsertInspectionTemplateInput = z.infer<typeof UpsertInspectionTemplateSchema>;

export const UpsertInspectionTemplateValidationPipe = new ZodValidationPipe(
  UpsertInspectionTemplateSchema
);
