import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
// ✅ Single Source of Truth: schemas 패키지에서 import
import { RentalTypeEnum, RentalType } from '@equipment-management/schemas';

export class CreateRentalDto {
  @ApiProperty({
    description: '대여할 장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: '대여 신청자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  // Note: type 필드는 현재 loans 테이블에 없지만, 향후 확장을 위해 유지
  // 실제로는 모든 rentals가 'internal' (같은 시험소 내 대여)
  @ApiProperty({
    description: '대여 유형 (현재는 internal만 사용)',
    enum: RentalTypeEnum,
    example: 'internal',
    required: false,
  })
  @IsOptional()
  type?: RentalType;

  @ApiProperty({
    description: '대여 시작 일시 (ISO 형식)',
    example: '2023-06-01T09:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: '예상 반납 일시 (ISO 형식)',
    example: '2023-06-15T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expectedEndDate: string;

  @ApiProperty({
    description: '대여 목적',
    example: '프로젝트 A 테스트를 위한 장비 대여',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: '대여 장소 (선택사항)',
    example: '연구소 2층 테스트실',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: '승인자 UUID (선택사항, 승인 시 자동 설정)',
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
