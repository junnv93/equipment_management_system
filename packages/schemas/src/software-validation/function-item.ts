import { z } from 'zod';

/**
 * UL-QP-18-09 절차서 원문 기반 기능 검증 항목 스키마 (SSOT)
 *
 * 원문: docs/procedure/양식/QP-18-09_시험소프트웨어유효성확인.md
 *
 * ─ 획득/프로세싱 기능: 4+1 필드
 *   1. name              기능 명칭
 *   2. independentMethod 독립 방법 (소프트웨어와 별개로 데이터를 획득/처리한 방법)
 *   3. acceptanceCriteria 수락 기준
 *   4. attachmentDocumentId 첨부 자료 (documents 모듈 UUID 참조, 선택)
 *   +  result            합격/불합격 (UX용, 절차서 외 필드)
 *
 * ─ 제어 기능: 6+1 필드 (절차서 별도 구조)
 *   1. equipmentFunction  제어된 장비 기능
 *   2. expectedFunction   예상되는 장비 기능
 *   3. observedFunction   확인되는 장비 기능
 *   4. independentMethod  독립 판정 방법 (제어 소프트웨어와 무관)
 *   5. acceptanceCriteria 수락 기준
 *   6. attachmentDocumentId 첨부 자료 (선택)
 *   +  result            합격/불합격 (UX용)
 */

export const functionResultEnum = z.enum(['pass', 'fail', 'na']);
export type FunctionResult = z.infer<typeof functionResultEnum>;

/** 획득 기능 / 프로세싱 기능 항목 (4+1 필드) */
export const acquisitionOrProcessingItemSchema = z.object({
  name: z.string().min(1).max(200),
  independentMethod: z.string().min(1).max(1000),
  acceptanceCriteria: z.string().min(1).max(500),
  attachmentDocumentId: z.string().uuid().optional(),
  result: functionResultEnum.optional(),
});
export type AcquisitionOrProcessingItem = z.infer<typeof acquisitionOrProcessingItemSchema>;

/** 제어 기능 항목 (6+1 필드) */
export const controlItemSchema = z.object({
  equipmentFunction: z.string().min(1).max(200),
  expectedFunction: z.string().min(1).max(500),
  observedFunction: z.string().min(1).max(500),
  independentMethod: z.string().min(1).max(1000),
  acceptanceCriteria: z.string().min(1).max(500),
  attachmentDocumentId: z.string().uuid().optional(),
  result: functionResultEnum.optional(),
});
export type ControlItem = z.infer<typeof controlItemSchema>;

export const acquisitionOrProcessingArraySchema = z
  .array(acquisitionOrProcessingItemSchema)
  .min(1)
  .max(20);

export const controlItemArraySchema = z.array(controlItemSchema).min(1).max(20);
