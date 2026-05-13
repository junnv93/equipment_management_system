import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import {
  VM,
  uuidString,
  CONDITION_STATUS_VALUES,
  ACCESSORIES_STATUS_VALUES,
  type ConditionStatus,
  type AccessoriesStatus,
} from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 ==========

/**
 * 일괄 수령 확인 스키마 — borrower_receive 단계 고정
 * ✅ Rule 2: checkerId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * ✅ Rule 11 예외: bulk UX상 per-item version 전달 불가 → DB 최신값 사용
 * ✅ step 고정: borrower_receive — 클라이언트가 단계를 선택하지 않음
 * ✅ attachmentIds 미포함: per-item 사진은 단건 endpoint 사용
 */
export const bulkReceiveSchema = z.object({
  ids: z
    .array(uuidString(VM.uuid.generic))
    .min(1, VM.array.minCases(1))
    .max(
      VALIDATION_RULES.BULK_OPERATION_MAX_COUNT,
      VM.array.maxCases(VALIDATION_RULES.BULK_OPERATION_MAX_COUNT)
    ),
  appearanceStatus: z.enum(CONDITION_STATUS_VALUES, {
    message: VM.checkout.conditionCheck.appearance.invalid,
  }),
  operationStatus: z.enum(CONDITION_STATUS_VALUES, {
    message: VM.checkout.conditionCheck.operation.invalid,
  }),
  accessoriesStatus: z.enum(ACCESSORIES_STATUS_VALUES).optional(),
  abnormalDetails: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('이상 상세', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  notes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type BulkReceiveInput = z.infer<typeof bulkReceiveSchema>;
export const BulkReceiveValidationPipe = new ZodValidationPipe(bulkReceiveSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BulkReceiveDto {
  @ApiProperty({
    description: `수령 확인할 반출 UUID 배열 (min 1, max ${VALIDATION_RULES.BULK_OPERATION_MAX_COUNT})`,
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  ids: string[];

  @ApiProperty({
    description: '외관 상태',
    enum: CONDITION_STATUS_VALUES,
    example: 'normal',
  })
  appearanceStatus: ConditionStatus;

  @ApiProperty({
    description: '작동 상태',
    enum: CONDITION_STATUS_VALUES,
    example: 'normal',
  })
  operationStatus: ConditionStatus;

  @ApiProperty({
    description: '부속품 상태 (선택)',
    enum: ACCESSORIES_STATUS_VALUES,
    example: 'complete',
    required: false,
  })
  accessoriesStatus?: AccessoriesStatus;

  @ApiProperty({
    description: '이상 시 상세 내용 (선택)',
    required: false,
  })
  abnormalDetails?: string;

  @ApiProperty({
    description: '비고 (선택)',
    required: false,
  })
  notes?: string;
}

// ========== 응답 타입 ==========

// submitConditionCheck가 condition_check 레코드를 반환하므로 checkout version 미포함
// 클라이언트는 invalidateQueries로 최신 상태를 재조회함
export interface BulkReceiveResult {
  received: { id: string }[];
  failed: { id: string; error: string }[];
}
