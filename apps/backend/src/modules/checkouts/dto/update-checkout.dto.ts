import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
// ✅ Single Source of Truth: enums.ts에서 import
import { CheckoutStatus, CHECKOUT_STATUS_VALUES, VM } from '@equipment-management/schemas';
import { VersionedDto, versionedSchema } from '../../../common/dto/base-versioned.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 수정 스키마
 * version은 optimistic locking을 위해 필수
 */
export const updateCheckoutSchema = z.object({
  ...versionedSchema, // ✅ Optimistic locking version
  destination: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().min(1).optional(),
  status: z
    .enum(CHECKOUT_STATUS_VALUES, {
      message: VM.checkout.status.invalid,
    })
    .optional(),
  expectedReturnDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type UpdateCheckoutInput = z.infer<typeof updateCheckoutSchema>;
export const UpdateCheckoutValidationPipe = new ZodValidationPipe(updateCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateCheckoutDto extends VersionedDto {
  // ✅ version 필드는 VersionedDto에서 자동 상속

  @ApiProperty({
    description: '반출 장소',
    example: 'KOLAS 교정기관',
    required: false,
  })
  destination?: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: '반출 사유',
    example: '정기 교정',
    required: false,
  })
  reason?: string;

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
