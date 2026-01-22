import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 승인 스키마
 */
export const approveCheckoutSchema = z.object({
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  notes: z.string().optional(),
});

export type ApproveCheckoutInput = z.infer<typeof approveCheckoutSchema>;
export const ApproveCheckoutValidationPipe = new ZodValidationPipe(approveCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveCheckoutDto {
  @ApiProperty({
    description: '승인자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '승인 메모',
    example: '반출 승인합니다.',
    required: false,
  })
  notes?: string;
}
