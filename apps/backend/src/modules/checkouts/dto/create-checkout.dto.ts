import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
// ✅ Single Source of Truth: enums.ts에서 import
import {
  CheckoutPurpose,
  CHECKOUT_PURPOSE_VALUES,
  VM,
  optionalUuid,
  uuidString,
} from '@equipment-management/schemas';
import { CHECKOUT_MAX_EQUIPMENT_COUNT } from '@equipment-management/shared-constants';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 생성 스키마
 */
export const createCheckoutSchema = z.object({
  equipmentIds: z
    .array(uuidString(VM.uuid.generic))
    .min(1, VM.array.min('장비', 1))
    .max(CHECKOUT_MAX_EQUIPMENT_COUNT, VM.array.max('장비', CHECKOUT_MAX_EQUIPMENT_COUNT)),
  purpose: z.enum(CHECKOUT_PURPOSE_VALUES, {
    message: VM.checkout.purpose.invalid,
  }),
  destination: z.string().min(1, VM.checkout.destination.required),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().min(1, VM.checkout.reason.required),
  expectedReturnDate: z.string().datetime({ message: VM.date.invalid }),
  notes: z.string().optional(),
  lenderTeamId: optionalUuid(VM.uuid.invalid('대여 팀')),
  lenderSiteId: z.string().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export const CreateCheckoutValidationPipe = new ZodValidationPipe(createCheckoutSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateCheckoutDto {
  @ApiProperty({
    description: '반출할 장비 UUID 목록',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  equipmentIds: string[];

  @ApiProperty({
    description: '반출 목적',
    enum: CHECKOUT_PURPOSE_VALUES,
    example: 'calibration',
  })
  purpose: CheckoutPurpose;

  @ApiProperty({
    description: '반출 장소',
    example: '교정기관 ABC',
  })
  destination: string;

  @ApiProperty({
    description: '연락처',
    example: '02-1234-5678',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: '반출 사유',
    example: '정기 교정을 위해 반출합니다.',
  })
  reason: string;

  @ApiProperty({
    description: '예상 반입 일시 (ISO 형식)',
    example: '2023-06-15T18:00:00Z',
  })
  expectedReturnDate: string;

  @ApiProperty({
    description: '추가 비고 사항',
    example: '교정 완료 후 즉시 반입 예정',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: '외부 대여 시 빌려주는 팀 UUID',
    example: '550e8400-e29b-41d4-a716-446655440010',
    required: false,
  })
  lenderTeamId?: string;

  @ApiProperty({
    description: '외부 대여 시 빌려주는 사이트 ID',
    example: 'pyeongtaek',
    required: false,
  })
  lenderSiteId?: string;
}
