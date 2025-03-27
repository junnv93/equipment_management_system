import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RentalTypeEnum } from '../../../types';

export class CreateRentalDto {
  @ApiProperty({
    description: '대여/반출할 장비 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: '대여/반출 사용자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '대여/반출 유형',
    enum: RentalTypeEnum,
    example: 'internal',
  })
  @IsEnum(RentalTypeEnum)
  @IsNotEmpty()
  type: keyof typeof RentalTypeEnum;

  @ApiProperty({
    description: '대여/반출 시작 일시',
    example: '2023-06-01T09:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: '대여/반출 예상 반납 일시',
    example: '2023-06-15T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expectedEndDate: string;

  @ApiProperty({
    description: '대여/반출 목적',
    example: '프로젝트 A 테스트를 위한 장비 대여',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: '대여/반출 장소',
    example: '연구소 2층 테스트실',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: '승인자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  approverId?: string;

  @ApiProperty({
    description: '추가 비고 사항',
    example: '테스트 완료 후 즉시 반납 예정',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
} 