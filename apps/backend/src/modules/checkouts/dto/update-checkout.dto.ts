import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { CreateCheckoutDto } from './create-checkout.dto';
// ✅ Single Source of Truth: enums.ts에서 import
import { CheckoutStatus, CHECKOUT_STATUS_VALUES } from '@equipment-management/schemas';

export class UpdateCheckoutDto extends PartialType(
  OmitType(CreateCheckoutDto, ['equipmentIds', 'purpose'] as const)
) {
  @ApiProperty({
    description: '반출 상태',
    enum: CHECKOUT_STATUS_VALUES,
    example: 'first_approved',
    required: false,
  })
  @IsOptional()
  @IsIn(CHECKOUT_STATUS_VALUES, { message: '유효하지 않은 반출 상태값입니다.' })
  status?: CheckoutStatus;

  @ApiProperty({
    description: '예상 반입일',
    example: '2023-06-15T18:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expectedReturnDate?: string;

  @ApiProperty({
    description: '반출 관련 메모',
    example: '반출 승인됨',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
