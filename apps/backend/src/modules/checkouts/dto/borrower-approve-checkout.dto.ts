import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 차용 팀 TM 1차 승인 스키마 (rental 전용)
 * version은 optimistic locking을 위해 필수
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 */
export const borrowerApproveCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  notes: z.string().optional(),
});

export type BorrowerApproveCheckoutInput = z.infer<typeof borrowerApproveCheckoutSchema>;
export const BorrowerApproveCheckoutValidationPipe = new ZodValidationPipe(
  borrowerApproveCheckoutSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BorrowerApproveCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
  // ✅ approverId는 서버에서 req.user.userId로 추출 (Rule 2)

  @ApiProperty({
    description: '승인 메모',
    example: '1차 승인합니다.',
    required: false,
  })
  notes?: string;
}
