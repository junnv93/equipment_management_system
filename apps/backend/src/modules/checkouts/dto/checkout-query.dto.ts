import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsISO8601, IsUUID, IsIn } from 'class-validator';
// ✅ Single Source of Truth: enums.ts에서 import
import { CHECKOUT_PURPOSE_VALUES } from '@equipment-management/schemas';

export class CheckoutQueryDto {
  @ApiProperty({
    description: '장비 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({
    description: '신청자 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  requesterId?: string;

  @ApiProperty({
    description: '승인자 UUID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  approverId?: string;

  @ApiProperty({
    description: '반출 목적으로 필터링',
    enum: CHECKOUT_PURPOSE_VALUES,
    required: false,
  })
  @IsOptional()
  @IsIn(CHECKOUT_PURPOSE_VALUES, { message: '유효하지 않은 반출 목적입니다.' })
  purpose?: string;

  @ApiProperty({
    description: '반출 상태로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'pending,first_approved',
    required: false,
  })
  @IsString()
  @IsOptional()
  statuses?: string;

  @ApiProperty({
    description: '반출일 이후로 필터링',
    example: '2023-06-01',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  checkoutFrom?: string;

  @ApiProperty({
    description: '반출일 이전으로 필터링',
    example: '2023-07-01',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  checkoutTo?: string;

  @ApiProperty({
    description: '반입 예정일 이후로 필터링',
    example: '2023-06-15',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  returnFrom?: string;

  @ApiProperty({
    description: '반입 예정일 이전으로 필터링',
    example: '2023-07-15',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  returnTo?: string;

  @ApiProperty({
    description: '검색어 (목적, 장소, 사유 등을 검색)',
    example: '교정',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'checkoutDate.desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 20,
    default: 20,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}
