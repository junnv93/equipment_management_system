import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// 수리 결과 enum
export enum RepairResultEnum {
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

// ========== Zod 스키마 정의 ==========

/**
 * 수리 이력 생성 스키마
 */
export const createRepairHistorySchema = z.object({
  repairDate: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  repairDescription: z.string().min(10, '수리 내용은 최소 10자 이상 입력해야 합니다'),
  repairedBy: z.string().optional(),
  repairCompany: z.string().optional(),
  cost: z.number().min(0, '수리 비용은 0 이상이어야 합니다').optional(),
  repairResult: z.nativeEnum(RepairResultEnum).optional(),
  notes: z.string().optional(),
  attachmentPath: z.string().optional(),
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
  repairResult: z.nativeEnum(RepairResultEnum).optional(),
  repairCompany: z.string().optional(),
  includeDeleted: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
  pageSize: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
});

export type RepairHistoryQueryInput = z.infer<typeof repairHistoryQuerySchema>;
export const RepairHistoryQueryValidationPipe = new ZodValidationPipe(repairHistoryQuerySchema);

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
    description: '수리 담당자',
    example: '홍길동',
  })
  repairedBy?: string;

  @ApiPropertyOptional({
    description: '외부 수리 업체',
    example: '키사이트 코리아',
  })
  repairCompany?: string;

  @ApiPropertyOptional({
    description: '수리 비용 (원)',
    example: 500000,
    minimum: 0,
  })
  cost?: number;

  @ApiPropertyOptional({
    description: '수리 결과',
    enum: RepairResultEnum,
    example: RepairResultEnum.COMPLETED,
  })
  repairResult?: RepairResultEnum;

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
    enum: RepairResultEnum,
  })
  repairResult?: RepairResultEnum;

  @ApiPropertyOptional({
    description: '수리 업체 필터',
    example: '키사이트',
  })
  repairCompany?: string;

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

  @ApiPropertyOptional({ description: '수리 담당자' })
  repairedBy?: string;

  @ApiPropertyOptional({ description: '외부 수리 업체' })
  repairCompany?: string;

  @ApiPropertyOptional({ description: '수리 비용' })
  cost?: number;

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
