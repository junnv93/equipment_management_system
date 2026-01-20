import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CalibrationPlanQueryDto {
  @ApiPropertyOptional({
    description: '계획 연도',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['suwon', 'uiwang'])
  siteId?: string;

  @ApiPropertyOptional({
    description: '상태',
    example: 'draft',
    enum: ['draft', 'pending_approval', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'pending_approval', 'approved', 'rejected'])
  status?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기 (기본값: 20)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class ExternalEquipmentQueryDto {
  @ApiPropertyOptional({
    description: '계획 연도 (차기교정일 기준)',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: '시험소 ID',
    example: 'suwon',
    enum: ['suwon', 'uiwang'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['suwon', 'uiwang'])
  siteId?: string;
}
