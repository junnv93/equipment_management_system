import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ReturnApprovalStatusEnum,
  RETURN_APPROVAL_STATUS_VALUES,
  type ReturnApprovalStatus,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export { ReturnApprovalStatusEnum, RETURN_APPROVAL_STATUS_VALUES, type ReturnApprovalStatus };

// ========== Zod 스키마 정의 ==========

/**
 * 반납 승인 스키마
 */
export const approveReturnSchema = z.object({
  status: z.enum(['approved', 'rejected'], { message: '유효한 승인 상태를 선택해주세요' }),
  notes: z.string().optional(),
  approverId: z.string().min(1, '승인자 ID를 입력해주세요'),
});

export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;
export const ApproveReturnValidationPipe = new ZodValidationPipe(approveReturnSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class ApproveReturnDto {
  @ApiProperty({
    description: '반납 승인 상태',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  status: 'approved' | 'rejected';

  @ApiProperty({
    description: '반납 승인/거절 메모',
    example: '장비 상태 확인 완료',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: '승인자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  approverId: string;
}
