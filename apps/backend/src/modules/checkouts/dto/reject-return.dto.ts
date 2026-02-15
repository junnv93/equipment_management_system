import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 반입 반려 스키마
 * version은 optimistic locking을 위해 필수
 * 반려 시 returned → checked_out 으로 되돌림 (재검사 필요)
 */
export const rejectReturnSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  reason: z.string().min(1, '반려 사유를 입력해주세요'),
});

export type RejectReturnInput = z.infer<typeof rejectReturnSchema>;
export const RejectReturnValidationPipe = new ZodValidationPipe(rejectReturnSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RejectReturnDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속
  // ✅ approverId는 서버에서 req.user.userId로 추출 (Rule 2)

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '검사 항목 미충족: 작동 확인이 완료되지 않았습니다. 재검사 후 반입 처리해주세요.',
  })
  reason: string;
}
