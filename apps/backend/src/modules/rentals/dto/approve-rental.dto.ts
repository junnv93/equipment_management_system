import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 대여 승인 스키마
 */
export const approveRentalSchema = z.object({
  approverId: z.string().uuid('유효한 UUID 형식이 아닙니다').optional(),
  comment: z.string().max(500, '코멘트는 최대 500자까지 입력 가능합니다').optional(),
});

export type ApproveRentalInput = z.infer<typeof approveRentalSchema>;
export const ApproveRentalValidationPipe = new ZodValidationPipe(approveRentalSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 대여 승인 DTO
 * @description 대여 승인 시 전달되는 데이터
 */
export class ApproveRentalDto {
  @ApiProperty({
    description: '승인자 UUID (JWT에서 자동 설정, 선택적으로 직접 지정 가능)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  approverId?: string;

  @ApiProperty({
    description: '승인자 코멘트',
    example: '교정 일정에 맞춰 사용 바랍니다.',
    required: false,
    maxLength: 500,
  })
  comment?: string;
}
