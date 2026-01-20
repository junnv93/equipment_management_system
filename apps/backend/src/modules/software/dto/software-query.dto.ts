import { IsOptional, IsString, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// 소프트웨어 변경 승인 상태 enum
export enum SoftwareApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class SoftwareHistoryQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({
    description: '소프트웨어명으로 필터',
    required: false,
  })
  @IsString()
  @IsOptional()
  softwareName?: string;

  @ApiProperty({
    description: '승인 상태로 필터',
    enum: SoftwareApprovalStatus,
    required: false,
  })
  @IsEnum(SoftwareApprovalStatus)
  @IsOptional()
  approvalStatus?: SoftwareApprovalStatus;

  @ApiProperty({
    description: '검색어 (소프트웨어명으로 검색)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드.방향)',
    example: 'changedAt.desc',
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
