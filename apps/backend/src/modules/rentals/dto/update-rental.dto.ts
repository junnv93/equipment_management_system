import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateRentalDto } from './create-rental.dto';
import { RentalStatusEnum } from '../../../types';

// @ts-ignore - 타입 참조 문제 무시
export class UpdateRentalDto extends PartialType(
  OmitType(CreateRentalDto, ['equipmentId', 'userId', 'type'] as const),
) {
  @ApiProperty({
    description: '대여/반출 상태',
    enum: RentalStatusEnum,
    example: 'approved',
    required: false,
  })
  @IsEnum(RentalStatusEnum)
  @IsOptional()
  status?: keyof typeof RentalStatusEnum | string;

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