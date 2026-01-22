import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CalibrationFactorType } from './create-calibration-factor.dto';

// ========== Enum 정의 ==========

export enum CalibrationFactorApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ========== Zod 스키마 정의 ==========

/**
 * 보정계수 조회 쿼리 스키마
 */
export const calibrationFactorQuerySchema = z.object({
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  approvalStatus: z
    .nativeEnum(CalibrationFactorApprovalStatus, {
      message: '유효하지 않은 승인 상태입니다',
    })
    .optional(),
  factorType: z
    .nativeEnum(CalibrationFactorType, {
      message: '유효하지 않은 보정계수 타입입니다',
    })
    .optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});

export type CalibrationFactorQueryInput = z.infer<typeof calibrationFactorQuerySchema>;
export const CalibrationFactorQueryValidationPipe = new ZodValidationPipe(
  calibrationFactorQuerySchema
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
    enum: CalibrationFactorApprovalStatus,
    required: false,
  })
  approvalStatus?: CalibrationFactorApprovalStatus;

  @ApiProperty({
    description: '보정계수 타입으로 필터',
    enum: CalibrationFactorType,
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
  pageSize?: number = 20;
}
