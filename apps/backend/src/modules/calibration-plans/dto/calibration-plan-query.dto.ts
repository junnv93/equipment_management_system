import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Zod 스키마 정의 ==========

/**
 * 시험소 ID 값
 */
const siteIdValues = ['suwon', 'uiwang'] as const;

/**
 * 교정계획서 상태 값
 */
const calibrationPlanStatusValues = ['draft', 'pending_approval', 'approved', 'rejected'] as const;

/**
 * 교정계획서 조회 쿼리 스키마
 */
export const calibrationPlanQuerySchema = z.object({
  year: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(2020).max(2100).optional()
  ),
  siteId: z
    .enum(siteIdValues, {
      message: '유효하지 않은 시험소 ID입니다 (suwon, uiwang)',
    })
    .optional(),
  status: z
    .enum(calibrationPlanStatusValues, {
      message: '유효하지 않은 상태입니다',
    })
    .optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type CalibrationPlanQueryInput = z.infer<typeof calibrationPlanQuerySchema>;
export const CalibrationPlanQueryValidationPipe = new ZodValidationPipe(calibrationPlanQuerySchema);

/**
 * 외부 장비 조회 쿼리 스키마
 */
export const externalEquipmentQuerySchema = z.object({
  year: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(2020).max(2100).optional()
  ),
  siteId: z
    .enum(siteIdValues, {
      message: '유효하지 않은 시험소 ID입니다 (suwon, uiwang)',
    })
    .optional(),
});

export type ExternalEquipmentQueryInput = z.infer<typeof externalEquipmentQuerySchema>;
export const ExternalEquipmentQueryValidationPipe = new ZodValidationPipe(
  externalEquipmentQuerySchema
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CalibrationPlanQueryDto {
  @ApiPropertyOptional({
    description: '계획 연도',
    example: 2026,
  })
  year?: number;

  @ApiPropertyOptional({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  siteId?: string;

  @ApiPropertyOptional({
    description: '상태',
    example: 'draft',
    enum: ['draft', 'pending_approval', 'approved', 'rejected'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기 (기본값: 20)',
    example: 20,
  })
  pageSize?: number = 20;
}

export class ExternalEquipmentQueryDto {
  @ApiPropertyOptional({
    description: '계획 연도 (차기교정일 기준)',
    example: 2026,
  })
  year?: number;

  @ApiPropertyOptional({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  siteId?: string;
}
