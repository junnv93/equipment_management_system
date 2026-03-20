import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VM } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 반려 스키마
 * version은 optimistic locking을 위해 필수
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 */
export const rejectCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  reason: z.string().min(1, VM.approval.rejectReason.required),
});

export type RejectCheckoutInput = z.infer<typeof rejectCheckoutSchema>;
export const RejectCheckoutValidationPipe = new ZodValidationPipe(rejectCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RejectCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
  // ✅ approverId는 서버에서 req.user.userId로 추출 (Rule 2)

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '장비가 교정 예정으로 반출 불가',
  })
  reason: string;
}
