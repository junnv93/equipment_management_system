import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateRentalDto } from './create-rental.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { LoanStatus, LOAN_STATUS_VALUES } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 대여 수정 스키마
 */
export const updateRentalSchema = z.object({
  startDate: z.string().datetime().optional(),
  expectedEndDate: z.string().datetime().optional(),
  purpose: z.string().min(1).optional(),
  location: z.string().optional(),
  status: z
    .enum([...LOAN_STATUS_VALUES] as [string, ...string[]], {
      message: '유효하지 않은 대여 상태값입니다.',
    })
    .optional(),
  notes: z.string().optional(),
  approverId: z.string().uuid().optional(),
});

export type UpdateRentalInput = z.infer<typeof updateRentalSchema>;
export const UpdateRentalValidationPipe = new ZodValidationPipe(updateRentalSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateRentalDto extends PartialType(
  OmitType(CreateRentalDto, ['equipmentId', 'userId', 'type'] as const)
) {
  @ApiProperty({
    description: '대여 상태',
    enum: LOAN_STATUS_VALUES,
    example: 'approved',
    required: false,
  })
  status?: LoanStatus;

  @ApiProperty({
    description: '예상 반납일',
    example: '2023-06-15T18:00:00Z',
    required: false,
  })
  expectedEndDate?: string;

  @ApiProperty({
    description: '대여/반출 관련 메모',
    example: '장비 대여 승인됨',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: '승인자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  approverId?: string;
}
