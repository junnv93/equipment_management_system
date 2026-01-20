import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUUID,
  MinLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// 수리 결과 enum
export enum RepairResultEnum {
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

/**
 * 수리 이력 생성 DTO
 */
export class CreateRepairHistoryDto {
  @ApiProperty({
    description: '수리 일자',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  repairDate: string;

  @ApiProperty({
    description: '수리 내용',
    example: '전원부 고장으로 인한 전원 보드 교체',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: '수리 내용은 최소 10자 이상 입력해야 합니다.' })
  repairDescription: string;

  @ApiPropertyOptional({
    description: '수리 담당자',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  repairedBy?: string;

  @ApiPropertyOptional({
    description: '외부 수리 업체',
    example: '키사이트 코리아',
  })
  @IsOptional()
  @IsString()
  repairCompany?: string;

  @ApiPropertyOptional({
    description: '수리 비용 (원)',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: '수리 결과',
    enum: RepairResultEnum,
    example: RepairResultEnum.COMPLETED,
  })
  @IsOptional()
  @IsEnum(RepairResultEnum)
  repairResult?: RepairResultEnum;

  @ApiPropertyOptional({
    description: '비고',
    example: '보증 기간 내 무상 수리',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: '첨부 파일 경로',
    example: '/uploads/repair/2024/repair-report.pdf',
  })
  @IsOptional()
  @IsString()
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
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (필터)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: '수리 결과 필터',
    enum: RepairResultEnum,
  })
  @IsOptional()
  @IsEnum(RepairResultEnum)
  repairResult?: RepairResultEnum;

  @ApiPropertyOptional({
    description: '수리 업체 필터',
    example: '키사이트',
  })
  @IsOptional()
  @IsString()
  repairCompany?: string;

  @ApiPropertyOptional({
    description: '삭제된 항목 포함 여부',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'repairDate.desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
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
