import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  RepairResultEnum,
  REPAIR_RESULT_VALUES,
  type RepairResult,
  VM,
  uuidString,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export { RepairResultEnum, REPAIR_RESULT_VALUES, type RepairResult };

// ========== Zod 스키마 정의 ==========

/**
 * 날짜 문자열 검증 스키마
 * - ISO 8601 datetime 형식 ('2024-01-15T00:00:00.000Z')
 * - 또는 날짜 전용 형식 ('2024-01-15')
 */
const dateStringSchema = z.string().refine(
  (val) => {
    // ISO 8601 datetime 또는 날짜 전용 형식 허용
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoDateTimeRegex.test(val) && !isNaN(Date.parse(val));
  },
  { message: VM.date.invalid }
);

/**
 * 수리 이력 생성 스키마
 */
export const createRepairHistorySchema = z.object({
  repairDate: dateStringSchema,
  repairDescription: z.string().min(10, VM.string.min('수리 내용', 10)),
  repairResult: RepairResultEnum.optional(),
  notes: z.string().optional(),
  attachmentPath: z.string().optional(),
  nonConformanceId: uuidString(VM.uuid.invalid('부적합')).optional(),
});

export type CreateRepairHistoryInput = z.infer<typeof createRepairHistorySchema>;
export const CreateRepairHistoryValidationPipe = new ZodValidationPipe(createRepairHistorySchema);

/**
 * 수리 이력 수정 스키마
 */
export const updateRepairHistorySchema = createRepairHistorySchema.partial();
export type UpdateRepairHistoryInput = z.infer<typeof updateRepairHistorySchema>;
export const UpdateRepairHistoryValidationPipe = new ZodValidationPipe(updateRepairHistorySchema);

/**
 * 수리 이력 조회 쿼리 스키마
 */
export const repairHistoryQuerySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  repairResult: RepairResultEnum.optional(),
  includeDeleted: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sort: z.string().optional(),
  page: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().max(100).optional()
  ),
});

export type RepairHistoryQueryInput = z.infer<typeof repairHistoryQuerySchema>;
export const RepairHistoryQueryValidationPipe = new ZodValidationPipe(repairHistoryQuerySchema, {
  targets: ['query'],
});

// ========== DTO 클래스 (Swagger 문서화용) ==========

/**
 * 수리 이력 생성 DTO
 */
export class CreateRepairHistoryDto {
  @ApiProperty({
    description: '수리 일자',
    example: '2024-01-15T00:00:00.000Z',
  })
  repairDate: string;

  @ApiProperty({
    description: '수리 내용',
    example: '전원부 고장으로 인한 전원 보드 교체',
    minLength: 10,
  })
  repairDescription: string;

  @ApiPropertyOptional({
    description: '수리 결과',
    enum: REPAIR_RESULT_VALUES,
    example: 'completed',
  })
  repairResult?: RepairResult;

  @ApiPropertyOptional({
    description: '비고',
    example: '보증 기간 내 무상 수리',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: '첨부 파일 경로',
    example: '/uploads/repair/2024/repair-report.pdf',
  })
  attachmentPath?: string;

  @ApiPropertyOptional({
    description: '연결된 부적합 ID (이 수리로 해결하는 부적합)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  nonConformanceId?: string;
}

/**
 * 수리 이력 수정 DTO
 */
export class UpdateRepairHistoryDto extends PartialType(CreateRepairHistoryDto) {}

/**
 * 수리 이력 조회 쿼리 DTO
 */
export class RepairHistoryQueryDto {
  @ApiPropertyOptional({
    description: '시작 날짜 (필터)',
    example: '2024-01-01',
  })
  fromDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (필터)',
    example: '2024-12-31',
  })
  toDate?: string;

  @ApiPropertyOptional({
    description: '수리 결과 필터',
    enum: REPAIR_RESULT_VALUES,
  })
  repairResult?: RepairResult;

  @ApiPropertyOptional({
    description: '삭제된 항목 포함 여부',
    example: false,
  })
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'repairDate.desc',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 20,
  })
  pageSize?: number;
}

/**
 * 수리 이력 응답 DTO
 */
export class RepairHistoryResponseDto {
  @ApiProperty({ description: 'UUID' })
  uuid: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: number;

  @ApiProperty({ description: '수리 일자' })
  repairDate: Date;

  @ApiProperty({ description: '수리 내용' })
  repairDescription: string;

  @ApiPropertyOptional({ description: '수리 결과' })
  repairResult?: string;

  @ApiPropertyOptional({ description: '비고' })
  notes?: string;

  @ApiPropertyOptional({ description: '첨부 파일 경로' })
  attachmentPath?: string;

  @ApiProperty({ description: '삭제 여부' })
  isDeleted: boolean;

  @ApiProperty({ description: '생성자' })
  createdBy: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;
}
