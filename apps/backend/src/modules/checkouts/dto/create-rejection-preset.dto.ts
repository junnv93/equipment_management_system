import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

/**
 * 반려 사유 프리셋 생성 스키마.
 *
 * ✅ MANAGE_SYSTEM_SETTINGS 권한 필수 (controller decorator).
 * ✅ isDefault는 admin 신규 등록에서 false로 강제 (시드 무결성 — service-layer에서 무시).
 */
export const createRejectionPresetSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, VM.string.min('반려 사유 레이블', 1))
    .max(
      VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH,
      VM.string.max('반려 사유 레이블', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
    ),
  template: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('반려 사유 본문', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  sortOrder: z.number().int().min(0).max(VALIDATION_RULES.SORT_ORDER_MAX).optional(),
});

export type CreateRejectionPresetInput = z.infer<typeof createRejectionPresetSchema>;
export const CreateRejectionPresetValidationPipe = new ZodValidationPipe(
  createRejectionPresetSchema
);

export class CreateRejectionPresetDto {
  @ApiProperty({
    description: '반려 사유 프리셋 레이블 (드롭다운 표시)',
    example: '교정 예정 중 반출 불가',
    maxLength: VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH,
  })
  label: string;

  @ApiProperty({
    description: '반려 사유 프리셋 본문 (선택, textarea 자동 채움)',
    required: false,
    example: '본 장비는 교정 예정 상태로 반출이 제한됩니다. 교정 완료 후 재신청 부탁드립니다.',
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  template?: string;

  @ApiProperty({
    description: '반려 사유 프리셋 정렬 순서 (선택, 낮을수록 먼저 표시)',
    required: false,
    example: 10,
    minimum: 0,
    maximum: VALIDATION_RULES.SORT_ORDER_MAX,
  })
  sortOrder?: number;
}
