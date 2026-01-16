import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  IsIn,
} from 'class-validator';
// ✅ Single Source of Truth: enums.ts에서 import
import { CheckoutPurpose, CHECKOUT_PURPOSE_VALUES } from '@equipment-management/schemas';

export class CreateCheckoutDto {
  @ApiProperty({
    description: '반출할 장비 UUID 목록',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  equipmentIds: string[];

  @ApiProperty({
    description: '반출 목적',
    enum: CHECKOUT_PURPOSE_VALUES,
    example: 'calibration',
  })
  @IsNotEmpty()
  @IsIn(CHECKOUT_PURPOSE_VALUES, { message: '유효하지 않은 반출 목적입니다.' })
  purpose: CheckoutPurpose;

  @ApiProperty({
    description: '반출 장소',
    example: '교정기관 ABC',
  })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({
    description: '연락처',
    example: '02-1234-5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: '반출 사유',
    example: '정기 교정을 위해 반출합니다.',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: '예상 반입 일시 (ISO 형식)',
    example: '2023-06-15T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expectedReturnDate: string;

  @ApiProperty({
    description: '추가 비고 사항',
    example: '교정 완료 후 즉시 반입 예정',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
