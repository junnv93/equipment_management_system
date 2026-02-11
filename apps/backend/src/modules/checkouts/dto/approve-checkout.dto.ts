import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 승인 스키마
 * approverId는 백엔드에서 req.user로부터 추출하므로 optional
 * version은 optimistic locking을 위해 필수
 */
export const approveCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다').optional(),
  notes: z.string().optional(),
});

export type ApproveCheckoutInput = z.infer<typeof approveCheckoutSchema>;
export const ApproveCheckoutValidationPipe = new ZodValidationPipe(approveCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속

  @ApiProperty({
    description: '승인자 UUID (선택사항: 백엔드에서 세션으로부터 추출)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  approverId?: string;

  @ApiProperty({
    description: '승인 메모',
    example: '반출 승인합니다.',
    required: false,
  })
  notes?: string;
}
