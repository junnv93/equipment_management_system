import { z } from 'zod';
import { InspectionTypeEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/**
 * Inspection Template Gallery Query DTO — Phase 1B-B
 *
 * 신규 장비 첫 점검 시 비슷한 장비의 검증된 template 가져오기 (1D).
 *
 * 매칭 우선순위 (실제 equipment 스키마 기반):
 * 1. modelName 정확 일치 (가장 강한 신호 — 동일 모델 = 동일 양식 가능성 매우 높음)
 * 2. classificationCode 일치 (E/R/W/S/A/P 분류 — 카테고리 fallback)
 *
 * 결과 정렬: priorityScore desc, createdAt desc, 최대 N개.
 */
export const GalleryQuerySchema = z.object({
  inspectionType: InspectionTypeEnum,
  /** 정확 일치 시 가장 높은 priority */
  modelName: z.string().min(1).optional(),
  /** UL-QP-18-02 분류코드: E(전기), R(RF), W(파장/광), S(센서), A(아날로그), P(전력) 등 */
  classificationCode: z.string().min(1).max(2).optional(),
  /** 결과 최대 개수 (기본 8 = 4-card grid 2줄) */
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export type GalleryQueryInput = z.infer<typeof GalleryQuerySchema>;

export const GalleryQueryValidationPipe = new ZodValidationPipe(GalleryQuerySchema, {
  targets: ['query'],
});
