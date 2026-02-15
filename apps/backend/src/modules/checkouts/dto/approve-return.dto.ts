import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 반입 승인 스키마
 * version은 optimistic locking을 위해 필수
 * ✅ Rule 2: approverId는 서버에서 req.user.userId로 추출 (DTO에 미포함)
 */
export const approveReturnSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  comment: z.string().optional(),
});

export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;
export const ApproveReturnValidationPipe = new ZodValidationPipe(approveReturnSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveReturnDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
  // ✅ approverId는 서버에서 req.user.userId로 추출 (Rule 2)

  @ApiProperty({
    description: '승인 코멘트',
    example: '검사 완료 확인, 정상 작동함',
    required: false,
  })
  comment?: string;
}
