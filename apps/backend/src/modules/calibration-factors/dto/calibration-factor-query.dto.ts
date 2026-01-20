import { IsOptional, IsString, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CalibrationFactorType } from './create-calibration-factor.dto';

// 보정계수 승인 상태 enum
export enum CalibrationFactorApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CalibrationFactorQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({
    description: '승인 상태로 필터',
    enum: CalibrationFactorApprovalStatus,
    required: false,
  })
  @IsEnum(CalibrationFactorApprovalStatus)
  @IsOptional()
  approvalStatus?: CalibrationFactorApprovalStatus;

  @ApiProperty({
    description: '보정계수 타입으로 필터',
    enum: CalibrationFactorType,
    required: false,
  })
  @IsEnum(CalibrationFactorType)
  @IsOptional()
  factorType?: CalibrationFactorType;

  @ApiProperty({
    description: '검색어 (이름으로 검색)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드.방향)',
    example: 'effectiveDate.desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: '페이지 번호',
    default: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: '페이지 크기',
    default: 20,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 20;
}
