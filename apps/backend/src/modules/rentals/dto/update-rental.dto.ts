import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, IsIn } from 'class-validator';
import { CreateRentalDto } from './create-rental.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { LoanStatus, LOAN_STATUS_VALUES } from '@equipment-management/schemas';

// @ts-expect-error - PartialType과 OmitType의 타입 추론 제한으로 인한 타입 오류
export class UpdateRentalDto extends PartialType(
  OmitType(CreateRentalDto, ['equipmentId', 'userId', 'type'] as const)
) {
  @ApiProperty({
    description: '대여 상태',
    enum: LOAN_STATUS_VALUES,
    example: 'approved',
    required: false,
  })
  @IsOptional()
  @IsIn(LOAN_STATUS_VALUES, { message: '유효하지 않은 대여 상태값입니다.' })
  status?: LoanStatus;

  @ApiProperty({
    description: '예상 반납일',
    example: '2023-06-15T18:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expectedEndDate?: string;

  @ApiProperty({
    description: '대여/반출 관련 메모',
    example: '장비 대여 승인됨',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: '승인자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  approverId?: string;
}
