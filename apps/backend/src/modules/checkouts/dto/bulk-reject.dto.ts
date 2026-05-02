import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 ==========

/**
 * 일괄 반려 스키마 (Sprint 4.5 U-01)
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * ✅ Rule 0: ids는 uuid 배열로 Zod 검증 (min 1, max 50)
 * ✅ reason: 단건 reject와 동등 수준 — required + max 500
 *
 * 단건 reject의 fail-close 순서(scope → FSM → reason validation)를 그대로
 * 활용하기 위해 service는 Promise.allSettled로 단건 reject()를 감쌈.
 */
export const bulkRejectSchema = z.object({
  ids: z
    .array(z.string().uuid(VM.uuid.generic))
    .min(1, '최소 1건 이상 선택해야 합니다')
    .max(50, '최대 50건까지 일괄 반려할 수 있습니다'),
  reason: z
    .string()
    .trim()
    .min(1, VM.approval.rejectReason.required)
    .max(500, VM.string.max('반려 사유', 500)),
});

export type BulkRejectInput = z.infer<typeof bulkRejectSchema>;
export const BulkRejectValidationPipe = new ZodValidationPipe(bulkRejectSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BulkRejectDto {
  @ApiProperty({
    description: '반려할 반출 UUID 배열 (min 1, max 50)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  ids: string[];

  @ApiProperty({
    description: '공통 반려 사유 (모든 항목에 동일 적용, 최대 500자)',
    example: '계측 일정 미충족',
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
