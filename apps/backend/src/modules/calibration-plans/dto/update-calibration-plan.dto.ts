import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 수정 스키마
 */
export const updateCalibrationPlanSchema = z.object({
  teamId: z.string().uuid({ message: '유효한 팀 UUID가 아닙니다' }).optional(),
});

export type UpdateCalibrationPlanInput = z.infer<typeof updateCalibrationPlanSchema>;
export const UpdateCalibrationPlanValidationPipe = new ZodValidationPipe(
  updateCalibrationPlanSchema
);

/**
 * 교정계획서 항목 수정 스키마
 */
export const updateCalibrationPlanItemSchema = z.object({
  plannedCalibrationAgency: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateCalibrationPlanItemInput = z.infer<typeof updateCalibrationPlanItemSchema>;
export const UpdateCalibrationPlanItemValidationPipe = new ZodValidationPipe(
  updateCalibrationPlanItemSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateCalibrationPlanDto {
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
