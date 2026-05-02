import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 ==========

/**
 * 일괄 승인 스키마
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * ✅ Rule 0: ids는 uuid 배열로 Zod 검증 (min 1, max 50)
 */
export const bulkApproveSchema = z.object({
  ids: z
    .array(z.string().uuid(VM.uuid.generic))
    .min(1, '최소 1건 이상 선택해야 합니다')
    .max(50, '최대 50건까지 일괄 승인할 수 있습니다'),
  commonReason: z.string().optional(),
});

export type BulkApproveInput = z.infer<typeof bulkApproveSchema>;
export const BulkApproveValidationPipe = new ZodValidationPipe(bulkApproveSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BulkApproveDto {
  @ApiProperty({
    description: '승인할 반출 UUID 배열 (min 1, max 50)',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  ids: string[];

  @ApiProperty({
    description: '공통 승인 메모 (선택)',
    required: false,
  })
  commonReason?: string;
}

// ========== 응답 타입 ==========

export interface BulkApproveResult {
  approved: { id: string; version: number }[];
  failed: { id: string; error: string }[];
}
