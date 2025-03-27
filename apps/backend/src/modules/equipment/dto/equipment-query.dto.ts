import { IsString, IsOptional, IsInt, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
// import { EquipmentStatusEnum } from '@equipment-management/schemas';
import { EquipmentStatusEnum } from '../../../types';

export class EquipmentQueryDto {
  @ApiPropertyOptional({
    description: '검색어 (장비명, 관리번호, 일련번호 등)',
    example: 'RF 분석기'
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: '장비 상태',
    enum: EquipmentStatusEnum,
    example: 'available'
  })
  @IsEnum(EquipmentStatusEnum)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: '장비 위치',
    example: 'RF 시험실'
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: '제조사',
    example: 'Anritsu'
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({
    description: '팀 ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID('4')
  @IsOptional()
  teamId?: string;
  
  @ApiPropertyOptional({
    description: '교정 예정일 기준 필터링 (일)',
    example: 30
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  calibrationDue?: number;
  
  @ApiPropertyOptional({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'name.asc'
  })
  @IsString()
  @IsOptional()
  sort?: string;
  
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
  
  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
} 