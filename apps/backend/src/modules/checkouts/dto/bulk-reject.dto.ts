import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM, uuidString } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 ==========

/**
 * 일괄 반려 스키마 (Sprint 4.5 U-01)
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * ✅ Rule 0: ids는 uuid 배열로 Zod 검증 (min 1, max 50)
 * ✅ reason: 단건 reject와 동일 최소 길이(REJECTION_REASON_MIN_LENGTH) + LONG_TEXT_MAX_LENGTH
 *
 * 단건 reject의 fail-close 순서(scope → FSM → reason validation)를 그대로
 * 활용하기 위해 service는 Promise.allSettled로 단건 reject()를 감쌈.
 */
export const bulkRejectSchema = z.object({
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
    .min(
      VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
      VM.string.min('반려 사유', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
    )
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
});

export type BulkRejectInput = z.infer<typeof bulkRejectSchema>;
export const BulkRejectValidationPipe = new ZodValidationPipe(bulkRejectSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BulkRejectDto {
  @ApiProperty({
    description: `반려할 반출 UUID 배열 (min 1, max ${VALIDATION_RULES.BULK_OPERATION_MAX_COUNT})`,
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  ids: string[];

  @ApiProperty({
    description: `공통 반려 사유 (모든 항목에 동일 적용, ${VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}자 이상 ${VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}자 이하)`,
    example: '계측 일정 미충족으로 인해 반려합니다.',
  })
  reason: string;
}

// ========== 응답 타입 ==========

/**
 * 일괄 반려 응답 — bulk-approve와 대칭 구조.
 * `rejected`: 성공한 항목 (id + 새 version)
 * `failed`: 실패한 항목 (id + 에러 메시지)
 */
export interface BulkRejectResult {
  rejected: { id: string; version: number }[];
  failed: { id: string; error: string }[];
}
