import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 반려 스키마
 */
export const rejectCheckoutSchema = z.object({
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다'),
  reason: z.string().min(1, '반려 사유를 입력해주세요'),
});

export type RejectCheckoutInput = z.infer<typeof rejectCheckoutSchema>;
export const RejectCheckoutValidationPipe = new ZodValidationPipe(rejectCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class RejectCheckoutDto {
  @ApiProperty({
    description: '승인자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  approverId: string;

  @ApiProperty({
    description: '반려 사유 (필수)',
    example: '장비가 교정 예정으로 반출 불가',
  })
  reason: string;
}
