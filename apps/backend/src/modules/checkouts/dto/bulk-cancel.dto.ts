import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM, uuidString } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 ==========

/**
 * 일괄 취소 스키마 (checkout-bulk-extended-actions sprint, 2026-05-06)
 *
 * 단건 cancel(`POST /checkouts/:uuid/cancel`)의 fail-close 순서(scope → FSM → reason)를
 * Promise.allSettled로 감싸 부분 실패를 허용한다.
 *
 * - ✅ Rule 2: cancellerId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * - ✅ Rule 0: ids는 uuid 배열로 Zod 검증 (min 1, max 50)
 * - reason은 단건 cancel과 동일 — optional + LONG_TEXT_MAX_LENGTH
 */
export const bulkCancelSchema = z.object({
  ids: z
    .array(uuidString(VM.uuid.generic))
    .min(1, VM.array.minCases(1))
    .max(
      VALIDATION_RULES.BULK_OPERATION_MAX_COUNT,
      VM.array.maxCases(VALIDATION_RULES.BULK_OPERATION_MAX_COUNT)
    ),
  reason: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('취소 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type BulkCancelInput = z.infer<typeof bulkCancelSchema>;
export const BulkCancelValidationPipe = new ZodValidationPipe(bulkCancelSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BulkCancelDto {
  @ApiProperty({
    description: `취소할 반출 UUID 배열 (min 1, max ${VALIDATION_RULES.BULK_OPERATION_MAX_COUNT})`,
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  ids: string[];

  @ApiProperty({
    description: '취소 사유 (선택)',
    required: false,
  })
  reason?: string;
}

// ========== 응답 타입 ==========

export interface BulkCancelResult {
  canceled: { id: string; version: number }[];
  failed: { id: string; error: string }[];
}
