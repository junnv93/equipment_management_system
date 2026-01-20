import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum NonConformanceStatus {
  OPEN = 'open',
  ANALYZING = 'analyzing',
  CORRECTED = 'corrected',
  CLOSED = 'closed',
}

export class NonConformanceQueryDto {
  @ApiPropertyOptional({ description: '장비 UUID 필터' })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '상태 필터',
    enum: NonConformanceStatus,
  })
  @IsOptional()
  @IsIn(['open', 'analyzing', 'corrected', 'closed'])
  status?: string;

  @ApiPropertyOptional({ description: '검색어 (원인 내용)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '정렬 (예: discoveryDate.desc)',
    default: 'discoveryDate.desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
