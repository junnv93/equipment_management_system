import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// SSOT: schemas 패키지에서 enum 값 import
import { SiteEnum, CALIBRATION_PLAN_STATUS_VALUES } from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 시험소 ID 값 (SSOT: SiteEnum에서 파생)
 * - suwon, uiwang, pyeongtaek
 */
const siteIdValues = SiteEnum.options;

/**
 * 교정계획서 상태 값 (SSOT: CALIBRATION_PLAN_STATUS_VALUES)
 * - draft, pending_review, pending_approval, approved, rejected
 */
const calibrationPlanStatusValues = CALIBRATION_PLAN_STATUS_VALUES;

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
      message: '유효하지 않은 시험소 ID입니다 (suwon, uiwang, pyeongtaek)',
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
      message: '유효하지 않은 시험소 ID입니다 (suwon, uiwang, pyeongtaek)',
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
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
  })
  siteId?: string;

  @ApiPropertyOptional({
    description: '상태 (3단계 승인)',
    example: 'draft',
    enum: CALIBRATION_PLAN_STATUS_VALUES,
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
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
  })
  siteId?: string;
}
