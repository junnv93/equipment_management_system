import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { VM, uuidString } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 수정 스키마
 */
export const updateCalibrationPlanSchema = z.object({
  casVersion: z.number().int().positive(VM.number.positive('casVersion')),
  teamId: uuidString(VM.uuid.invalid('팀')).optional(),
});

export type UpdateCalibrationPlanInput = z.infer<typeof updateCalibrationPlanSchema>;
export const UpdateCalibrationPlanValidationPipe = new ZodValidationPipe(
  updateCalibrationPlanSchema
);

/**
 * 교정계획서 항목 수정 스키마
 */
export const updateCalibrationPlanItemSchema = z.object({
  plannedCalibrationAgency: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH,
      VM.string.max('계획된 교정기관', VALIDATION_RULES.TEXT_FIELD_MAX_LENGTH)
    )
    .optional(),
  notes: z
    .string()
    .trim()
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('추가 비고', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    )
    .optional(),
});

export type UpdateCalibrationPlanItemInput = z.infer<typeof updateCalibrationPlanItemSchema>;
export const UpdateCalibrationPlanItemValidationPipe = new ZodValidationPipe(
  updateCalibrationPlanItemSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateCalibrationPlanDto {
  @ApiProperty({ description: 'CAS 버전 (동시 수정 방지)', example: 1 })
  casVersion: number;

  @ApiPropertyOptional({
    description: '팀 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;
}

export class UpdateCalibrationPlanItemDto {
  @ApiPropertyOptional({
    description: '계획된 교정기관',
    example: 'KATS',
  })
  plannedCalibrationAgency?: string;

  @ApiPropertyOptional({
    description: '추가 비고',
  })
  notes?: string;
}
