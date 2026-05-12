import { ApiProperty } from '@nestjs/swagger';
import { revokeApprovalSchema, type RevokeApprovalInput } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto } from '../../../common/dto/base-versioned.dto';

/**
 * 승인 철회 DTO
 *
 * SSOT — `packages/schemas/src/revoke-approval.ts` 의 `revokeApprovalSchema` 를 단일 import.
 * Backend/Frontend 양쪽이 같은 schema 를 사용하여 wire mismatch 회귀 차단.
 *
 * ✅ Rule 2: `approverId` 는 서버에서 `req.user.userId` 로 추출 (DTO 에 미포함)
 * ✅ fail-close: scope → FSM(approved) → reason(min 길이) → time-window(5분) → domain(approvedBy===approverId)
 */
export { revokeApprovalSchema };
export type { RevokeApprovalInput };

export const RevokeApprovalValidationPipe = new ZodValidationPipe(revokeApprovalSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RevokeApprovalDto extends VersionedDto {
  @ApiProperty({
    description: '승인 철회 사유 (필수)',
    example: '승인 조건 오류로 철회합니다',
  })
  reason: string;
}
