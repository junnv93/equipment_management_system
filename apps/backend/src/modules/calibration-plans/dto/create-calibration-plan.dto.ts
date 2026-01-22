import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 생성 스키마
 */
export const createCalibrationPlanSchema = z.object({
  year: z
    .number()
    .int({ message: '연도는 정수여야 합니다' })
    .min(2020, { message: '연도는 2020 이상이어야 합니다' })
    .max(2100, { message: '연도는 2100 이하여야 합니다' }),
  siteId: z.string().min(1, '시험소 ID를 입력해주세요'),
  teamId: z.string().uuid({ message: '유효한 팀 UUID가 아닙니다' }).optional(),
  createdBy: z.string().min(1, '작성자 ID를 입력해주세요'),
});

export type CreateCalibrationPlanInput = z.infer<typeof createCalibrationPlanSchema>;
export const CreateCalibrationPlanValidationPipe = new ZodValidationPipe(
  createCalibrationPlanSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateCalibrationPlanDto {
  @ApiProperty({
    description: '계획 연도',
    example: 2026,
    minimum: 2020,
    maximum: 2100,
  })
  year: number;

  @ApiProperty({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  siteId: string;

  @ApiPropertyOptional({
    description: '팀 ID (선택)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;

  @ApiProperty({
    description: '작성자 ID (기술책임자)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  createdBy: string;
}
