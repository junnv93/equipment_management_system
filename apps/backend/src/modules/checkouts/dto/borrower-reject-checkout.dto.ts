import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';
import { VM } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 차용 팀 TM 1차 반려 스키마 (rental 전용)
 * version은 optimistic locking을 위해 필수
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 */
export const borrowerRejectCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  reason: z.string().min(1, VM.approval.rejectReason.required),
});

export type BorrowerRejectCheckoutInput = z.infer<typeof borrowerRejectCheckoutSchema>;
export const BorrowerRejectCheckoutValidationPipe = new ZodValidationPipe(
  borrowerRejectCheckoutSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class BorrowerRejectCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
  // ✅ approverId는 서버에서 req.user.userId로 추출 (Rule 2)

  @ApiProperty({
    description: '1차 반려 사유 (필수)',
    example: '장비 사용 일정이 겹쳐 대여 불가',
  })
  reason: string;
}
