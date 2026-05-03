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
import {
  CHECKOUT_MAX_EQUIPMENT_COUNT,
  VALIDATION_RULES,
} from '@equipment-management/shared-constants';

// ========== Zod 스키마 정의 ==========

/**
 * 반출 생성 스키마
 */
export const createCheckoutSchema = z.object({
  equipmentIds: z
    .array(uuidString(VM.uuid.generic))
    .min(1, VM.array.min('장비', 1))
    .max(CHECKOUT_MAX_EQUIPMENT_COUNT, VM.array.max('장비', CHECKOUT_MAX_EQUIPMENT_COUNT))
    .refine((ids) => new Set(ids).size === ids.length, {
      message: '동일한 장비를 중복으로 선택할 수 없습니다',
    }),
  purpose: z.enum(CHECKOUT_PURPOSE_VALUES, {
    message: VM.checkout.purpose.invalid,
  }),
  destination: z
    .string()
    .trim()
    .min(1, VM.checkout.destination.required)
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('반출 장소', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    ),
  phoneNumber: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.PHONE_MAX_LENGTH,
      VM.string.max('전화번호', VALIDATION_RULES.PHONE_MAX_LENGTH)
    )
    .optional(),
  address: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('주소', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  reason: z
    .string()
    .trim()
    .min(1, VM.checkout.reason.required)
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('반출 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
  expectedReturnDate: z.string().datetime({ message: VM.date.invalid }),
  notes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
  lenderTeamId: optionalUuid(VM.uuid.invalid('대여 팀')),
  lenderSiteId: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('대여 사이트 ID', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
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
