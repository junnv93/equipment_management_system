import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import {
  SiteEnum,
  type Site,
  CALIBRATION_PLAN_STATUS_VALUES,
  VM,
} from '@equipment-management/schemas';

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
      message: VM.calibrationPlan.site.invalid,
    })
    .optional(),
  teamId: z
    .string()
    .uuid({ message: VM.uuid.invalid('팀') })
    .optional(),
  status: z
    .enum(calibrationPlanStatusValues, {
      message: VM.calibrationPlan.status.invalid,
    })
    .optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
  includeSummary: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

export type CalibrationPlanQueryInput = z.infer<typeof calibrationPlanQuerySchema>;
export const CalibrationPlanQueryValidationPipe = new ZodValidationPipe(
  calibrationPlanQuerySchema,
  { targets: ['query'] }
);

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
      message: VM.calibrationPlan.site.invalid,
    })
    .optional(),
  teamId: z
    .string()
    .uuid({ message: VM.uuid.invalid('팀') })
    .optional(),
});

export type ExternalEquipmentQueryInput = z.infer<typeof externalEquipmentQuerySchema>;
export const ExternalEquipmentQueryValidationPipe = new ZodValidationPipe(
  externalEquipmentQuerySchema,
  { targets: ['query'] }
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
    enum: SiteEnum.options,
  })
  siteId?: Site;

  @ApiPropertyOptional({
    description: '팀 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;

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
  pageSize?: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: '상태별 요약 통계 포함 여부 (기본값: false)',
    example: true,
  })
  includeSummary?: boolean;
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
    enum: SiteEnum.options,
  })
  siteId?: Site;

  @ApiPropertyOptional({
    description: '팀 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  teamId?: string;
}
