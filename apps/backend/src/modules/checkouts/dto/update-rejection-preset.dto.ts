import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

/**
 * 반려 사유 프리셋 수정 스키마.
 *
 * ✅ 부분 수정 — 모든 필드 optional, 최소 한 필드 필수 (refine).
 * ✅ isDefault 토글 금지 (시드 무결성). service-layer에서 무시.
 * ✅ MANAGE_SYSTEM_SETTINGS 권한 필수 (controller decorator).
 */
export const updateRejectionPresetSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, VM.string.min('반려 사유 레이블', 1))
      .max(
        VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH,
        VM.string.max('반려 사유 레이블', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
      )
      .optional(),
    template: z
      .string()
      .trim()
      .max(
        VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
        VM.string.max('반려 사유 본문', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      )
      .nullable()
      .optional()
      .transform((v) => (v === '' ? null : v)),
    sortOrder: z.number().int().min(0).max(VALIDATION_RULES.SORT_ORDER_MAX).optional(),
  })
  .refine(
    (data) =>
      data.label !== undefined || data.template !== undefined || data.sortOrder !== undefined,
    {
      message: '최소 한 개 필드는 수정해야 합니다',
    }
  );

export type UpdateRejectionPresetInput = z.infer<typeof updateRejectionPresetSchema>;
export const UpdateRejectionPresetValidationPipe = new ZodValidationPipe(
  updateRejectionPresetSchema
);

export class UpdateRejectionPresetDto {
  @ApiProperty({
    description: '반려 사유 프리셋 레이블 (선택, 부분 수정)',
    required: false,
    example: '교정 예정 중 반출 불가 (수정)',
    maxLength: VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH,
  })
  label?: string;

  @ApiProperty({
    description: '반려 사유 프리셋 본문 (선택, null 전달 시 본문 제거)',
    required: false,
    nullable: true,
    example: '본 장비는 교정 예정 상태로 반출이 제한됩니다.',
    maxLength: VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
  })
  template?: string | null;

  @ApiProperty({
    description: '반려 사유 프리셋 정렬 순서 (선택, 낮을수록 먼저 표시)',
    required: false,
    example: 5,
    minimum: 0,
    maximum: VALIDATION_RULES.SORT_ORDER_MAX,
  })
  sortOrder?: number;
}
