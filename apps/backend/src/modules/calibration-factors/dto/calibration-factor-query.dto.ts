import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import {
  CalibrationFactorTypeEnum,
  CalibrationFactorApprovalStatusEnum,
  CalibrationFactorApprovalStatusValues,
  CALIBRATION_FACTOR_TYPE_VALUES,
  CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES,
  type CalibrationFactorType,
  type CalibrationFactorApprovalStatus,
  VM,
  uuidString,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export {
  CalibrationFactorApprovalStatusEnum,
  CalibrationFactorApprovalStatusValues,
  type CalibrationFactorApprovalStatus,
};

// ========== Zod 스키마 정의 ==========

/**
 * 보정계수 조회 쿼리 스키마
 */
export const calibrationFactorQuerySchema = z.object({
  equipmentId: uuidString(VM.uuid.invalid('장비')).optional(),
  approvalStatus: CalibrationFactorApprovalStatusEnum.optional(),
  factorType: CalibrationFactorTypeEnum.optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
});

export type CalibrationFactorQueryInput = z.infer<typeof calibrationFactorQuerySchema>;
export const CalibrationFactorQueryValidationPipe = new ZodValidationPipe(
  calibrationFactorQuerySchema,
  { targets: ['query'] }
);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CalibrationFactorQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터',
    required: false,
  })
  equipmentId?: string;

  @ApiProperty({
    description: '승인 상태로 필터',
    enum: CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES,
    required: false,
  })
  approvalStatus?: CalibrationFactorApprovalStatus;

  @ApiProperty({
    description: '보정계수 타입으로 필터',
    enum: CALIBRATION_FACTOR_TYPE_VALUES,
    required: false,
  })
  factorType?: CalibrationFactorType;

  @ApiProperty({
    description: '검색어 (이름으로 검색)',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드.방향)',
    example: 'effectiveDate.desc',
    required: false,
  })
  sort?: string;

  @ApiProperty({
    description: '페이지 번호',
    default: 1,
    required: false,
  })
  page?: number = 1;

  @ApiProperty({
    description: '페이지 크기',
    default: 20,
    required: false,
  })
  pageSize?: number = DEFAULT_PAGE_SIZE;
}
