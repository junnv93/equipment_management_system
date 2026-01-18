import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RentalStatusEnum, RentalTypeEnum } from '@equipment-management/schemas';

export class RentalQueryDto {
  @ApiProperty({
    description: '장비 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({
    description: '사용자 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: '승인자 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  approverId?: string;

  @ApiProperty({
    description: '대여/반출 유형으로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'rental,checkout',
    required: false,
  })
  @IsString()
  @IsOptional()
  types?: string;

  @ApiProperty({
    description: '대여/반출 상태로 필터링 (콤마로 구분하여 여러 값 지정 가능)',
    example: 'pending,approved',
    required: false,
  })
  @IsString()
  @IsOptional()
  statuses?: string;

  @ApiProperty({
    description: '시작 일자 이후로 필터링',
    example: '2023-06-01',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  startFrom?: string;

  @ApiProperty({
    description: '시작 일자 이전으로 필터링',
    example: '2023-07-01',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  startTo?: string;

  @ApiProperty({
    description: '종료 예정 일자 이후로 필터링',
    example: '2023-06-15',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  endFrom?: string;

  @ApiProperty({
    description: '종료 예정 일자 이전으로 필터링',
    example: '2023-07-15',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  endTo?: string;

  @ApiProperty({
    description: '검색어 (목적, 장소, 비고 등을 검색)',
    example: '테스트',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준 (필드명.asc 또는 필드명.desc)',
    example: 'startDate.desc',
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
  @IsNumber()
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
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}
