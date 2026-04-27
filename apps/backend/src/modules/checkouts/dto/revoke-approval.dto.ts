import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 ==========

/**
 * 승인 철회 스키마
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 * ✅ fail-close: scope → FSM(approved+5분이내) → domain(approvedBy===approverId) 순
 */
export const revokeApprovalSchema = z.object({
  ...versionedSchema,
  reason: z.string().min(1, '철회 사유를 입력해주세요'),
});

export type RevokeApprovalInput = z.infer<typeof revokeApprovalSchema>;
export const RevokeApprovalValidationPipe = new ZodValidationPipe(revokeApprovalSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RevokeApprovalDto extends VersionedDto {
  @ApiProperty({
    description: '승인 철회 사유 (필수)',
    example: '승인 조건 오류로 철회합니다',
  })
  reason: string;
}
