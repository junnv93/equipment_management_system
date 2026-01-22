import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateCheckoutDto } from './create-checkout.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { CheckoutStatus, CHECKOUT_STATUS_VALUES } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 수정 스키마
 */
export const updateCheckoutSchema = z.object({
  destination: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().min(1).optional(),
  status: z
    .enum([...CHECKOUT_STATUS_VALUES] as [string, ...string[]], {
      message: '유효하지 않은 반출 상태값입니다.',
    })
    .optional(),
  expectedReturnDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type UpdateCheckoutInput = z.infer<typeof updateCheckoutSchema>;
export const UpdateCheckoutValidationPipe = new ZodValidationPipe(updateCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateCheckoutDto extends PartialType(
  OmitType(CreateCheckoutDto, ['equipmentIds', 'purpose'] as const)
) {
  @ApiProperty({
    description: '반출 상태',
    enum: CHECKOUT_STATUS_VALUES,
    example: 'approved',
    required: false,
  })
  status?: CheckoutStatus;

  @ApiProperty({
    description: '예상 반입일',
    example: '2023-06-15T18:00:00Z',
    required: false,
  })
  expectedReturnDate?: string;

  @ApiProperty({
    description: '반출 관련 메모',
    example: '반출 승인됨',
    required: false,
  })
  notes?: string;
}
