import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { SiteEnum, type Site, VM } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 교정계획서 생성 스키마
 */
export const createCalibrationPlanSchema = z.object({
  year: z
    .number()
    .int({ message: VM.number.int('연도') })
    .min(2020, { message: VM.number.min('연도', 2020) })
    .max(2100, { message: VM.number.max('연도', 2100) }),
  siteId: SiteEnum,
  teamId: z
    .string()
    .uuid({ message: VM.uuid.invalid('팀') })
    .optional(),
});

/** 서비스 내부용 (controller가 createdBy 주입) */
export type CreateCalibrationPlanPayload = CreateCalibrationPlanInput & { createdBy: string };

export type CreateCalibrationPlanInput = z.infer<typeof createCalibrationPlanSchema>;
export const CreateCalibrationPlanValidationPipe = new ZodValidationPipe(
  createCalibrationPlanSchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 교정계획서 생성 DTO (Swagger 문서화용)
 * createdBy는 서버에서 JWT로 추출
 */
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
    enum: SiteEnum.options,
  })
  siteId: Site;

  @ApiPropertyOptional({
    description: '팀 ID (선택)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;
}
